package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	semver "github.com/Masterminds/semver/v3"
	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/install"
	registry "github.com/activelane/activelane/go/registry"
	"github.com/activelane/activelane/go/registryconfig"
)

type ExtensionService struct {
	mu          sync.Mutex
	configPath  string
	installRoot string
	sources     registry.SourceClient
	installer   install.Installer
}

func NewExtensionService() *ExtensionService {
	root := install.DefaultRoot()
	return &ExtensionService{configPath: registryconfig.DefaultPath(), installRoot: root, installer: install.Installer{Root: root}}
}
func NewExtensionServiceAt(configPath, installRoot string) *ExtensionService {
	return &ExtensionService{configPath: configPath, installRoot: installRoot, installer: install.Installer{Root: installRoot}}
}
func (service *ExtensionService) Close() {}

// Module returns the self-contained ES module entrypoint for an installed package.
// Keeping this at the native service boundary gives development and packaged builds
// one loading path and prevents the webview from reading arbitrary local files.
func (service *ExtensionService) Module(extensionID, version string) ExtensionModuleResponse {
	service.mu.Lock()
	defer service.mu.Unlock()
	packageInfo, err := service.resolveInstalledPackage(extensionID, version, false)
	if err != nil {
		return ExtensionModuleResponse{Error: desktopError("EXTENSION_NOT_FOUND", "Enabled extension version was not found.", err)}
	}
	file, err := service.resolvePackageResource(extensionID, version, packageInfo.manifest.Entry, false)
	if err != nil {
		return ExtensionModuleResponse{Error: desktopError("EXTENSION_INVALID", "Extension runtime entrypoint is unsafe.", err)}
	}
	source, readErr := os.ReadFile(file)
	if readErr != nil {
		return ExtensionModuleResponse{Error: desktopError("EXTENSION_INVALID", "Extension runtime entrypoint is unavailable.", readErr)}
	}
	digest := sha256.Sum256(source)
	return ExtensionModuleResponse{Source: string(source), Entrypoint: packageInfo.manifest.Entry, ContentType: runtimeEntrypointContentType(file), SizeBytes: len(source), SHA256: hex.EncodeToString(digest[:])}
}

func runtimeEntrypointContentType(path string) string {
	switch strings.ToLower(filepath.Ext(path)) {
	case ".js", ".mjs":
		return "text/javascript"
	default:
		return "application/octet-stream"
	}
}

func (service *ExtensionService) Registries(ctx context.Context) RegistryStatusResponse {
	config, err := service.loadConfig()

	if err != nil {
		return RegistryStatusResponse{Registries: []RegistryStatus{}, Error: desktopError("REGISTRY_CONFIG_INVALID", "Registry configuration is invalid.", err)}
	}
	response := RegistryStatusResponse{Registries: []RegistryStatus{}, Mode: registryMode(config), PublicRegistryEnabled: publicEnabled(config)}
	for _, source := range config.Registries {
		status := registryStatus(source)
		if !source.Enabled {
			status.State = "disabled"
			response.Registries = append(response.Registries, status)
			continue
		}
		discovery, err := service.sources.Discover(ctx, source)
		if err != nil {
			status.State = "unavailable"
			status.Error = desktopError("REGISTRY_UNAVAILABLE", "Registry is unavailable.", err)
		} else {
			status.State = "available"
			status.Capabilities = discovery.Capabilities
			if discovery.DisplayName != "" {
				status.DisplayName = discovery.DisplayName
			}
		}
		response.Registries = append(response.Registries, status)
	}
	return response
}

func (service *ExtensionService) Search(ctx context.Context, query string) SearchResponse {
	config, err := service.loadConfig()

	if err != nil {
		return SearchResponse{Items: []SearchExtension{}, Failures: []RegistryFailure{}, Error: desktopError("REGISTRY_CONFIG_INVALID", "Registry configuration is invalid.", err)}
	}
	response := SearchResponse{Items: []SearchExtension{}, Failures: []RegistryFailure{}, Mode: registryMode(config), PublicRegistryEnabled: publicEnabled(config)}
	for _, source := range config.Registries {
		if !source.Enabled {
			continue
		}
		discovery, discoveryErr := service.sources.Discover(ctx, source)
		displayName := source.ID
		if discovery.DisplayName != "" {
			displayName = discovery.DisplayName
		}
		if discoveryErr != nil {
			response.Failures = append(response.Failures, RegistryFailure{RegistryID: source.ID, RegistryDisplayName: displayName, Error: *desktopError("REGISTRY_UNAVAILABLE", "Registry search is unavailable.", discoveryErr)})
			continue
		}
		extensions, searchErr := service.sources.Search(ctx, source, query)
		if searchErr != nil {
			response.Failures = append(response.Failures, RegistryFailure{RegistryID: source.ID, RegistryDisplayName: displayName, Error: *desktopError("REGISTRY_UNAVAILABLE", "Registry search failed.", searchErr)})
			continue
		}

		for _, extension := range extensions {
			owner, routeErr := config.Resolve(extension.Publisher)
			if routeErr != nil || owner.ID != source.ID {
				continue
			}
			if item, ok := mapSearchExtension(source.ID, displayName, extension); ok {
				response.Items = append(response.Items, item)
			}
		}
	}
	return response
}

func (service *ExtensionService) Details(ctx context.Context, registryID, extensionID string) SearchResponse {
	config, err := service.loadConfig()

	if err != nil {
		return SearchResponse{Items: []SearchExtension{}, Failures: []RegistryFailure{}, Error: desktopError("REGISTRY_CONFIG_INVALID", "Registry configuration is invalid.", err)}
	}
	source, err := findRegistry(config, registryID)

	if err != nil {
		return SearchResponse{Items: []SearchExtension{}, Failures: []RegistryFailure{}, Error: desktopError("REGISTRY_UNAVAILABLE", "Selected registry is not configured.", err)}
	}
	namespace, name, err := parseExtensionID(extensionID)

	if err != nil {
		return SearchResponse{Items: []SearchExtension{}, Failures: []RegistryFailure{}, Error: desktopError("EXTENSION_NOT_FOUND", "Extension identity is invalid.", err)}
	}
	extension, err := service.sources.GetExtension(ctx, source, namespace, name)

	if err != nil {
		return SearchResponse{Items: []SearchExtension{}, Failures: []RegistryFailure{}, Error: desktopError("EXTENSION_NOT_FOUND", "Extension metadata is unavailable.", err)}
	}
	item, ok := mapSearchExtension(source.ID, source.ID, extension)

	if !ok {
		return SearchResponse{Items: []SearchExtension{}, Failures: []RegistryFailure{}, Error: desktopError("VERSION_NOT_FOUND", "No release is available.", nil)}
	}
	return SearchResponse{Items: []SearchExtension{item}, Failures: []RegistryFailure{}, Mode: registryMode(config), PublicRegistryEnabled: publicEnabled(config)}
}

func (service *ExtensionService) Installed() InstalledResponse {
	service.mu.Lock()
	defer service.mu.Unlock()
	records, err := install.ListRecords(service.installRoot)

	if err != nil {
		return InstalledResponse{Items: []InstalledExtension{}, Error: mapInstallError(err)}
	}
	items := make([]InstalledExtension, 0, len(records))
	for _, record := range records {
		items = append(items, service.mapInstalled(record, true))
	}
	return InstalledResponse{Items: items}
}
func (service *ExtensionService) Install(ctx context.Context, registryID, extensionID, version string) ExtensionOperationResponse {
	service.mu.Lock()
	defer service.mu.Unlock()
	config, err := service.loadConfig()

	if err != nil {
		return operationError("REGISTRY_CONFIG_INVALID", "Registry configuration is invalid.", err)
	}
	namespace, name, err := parseExtensionID(extensionID)

	if err != nil {
		return operationError("EXTENSION_NOT_FOUND", "Extension identity is invalid.", err)
	}
	owner, err := config.Resolve(namespace)

	if err != nil {
		return operationError("REGISTRY_SCOPE_AMBIGUOUS", "Namespace routing is invalid.", err)
	}

	if owner.ID != registryID {
		return operationError("REGISTRY_SCOPE_AMBIGUOUS", "Selected registry does not own this namespace.", fmt.Errorf("namespace %q is routed to %q", namespace, owner.ID))
	}
	source, err := findRegistry(config, registryID)

	if err != nil || !source.Enabled {
		return operationError("REGISTRY_DISABLED", "Selected registry is not enabled.", err)
	}
	metadata, err := service.sources.GetVersion(ctx, source, namespace, name, version)

	if err != nil {
		return operationError("VERSION_NOT_FOUND", "Selected extension version is unavailable.", err)
	}
	compatible, reason := manifestCompatible(metadata.Manifest)

	if !compatible {
		return operationError("VERSION_INCOMPATIBLE", reason, nil)
	}
	record, err := service.installer.InstallFromRegistry(ctx, config, namespace+"/"+name+"@"+version, registryID)

	if err != nil {
		return ExtensionOperationResponse{Error: mapInstallError(err)}
	}
	mapped := service.mapInstalled(record, true)
	return ExtensionOperationResponse{Record: &mapped, RestartRequired: true}
}
func (service *ExtensionService) Enable(extensionID string) ExtensionOperationResponse {
	return service.setEnabled(extensionID, true)
}
func (service *ExtensionService) Disable(extensionID string) ExtensionOperationResponse {
	return service.setEnabled(extensionID, false)
}
func (service *ExtensionService) Uninstall(extensionID string) ExtensionOperationResponse {
	service.mu.Lock()
	defer service.mu.Unlock()
	namespace, name, err := parseExtensionID(extensionID)

	if err != nil {
		return operationError("EXTENSION_NOT_FOUND", "Extension identity is invalid.", err)
	}

	if err := install.Uninstall(service.installRoot, namespace, name); err != nil {
		return ExtensionOperationResponse{Error: mapInstallError(err)}
	}
	return ExtensionOperationResponse{RestartRequired: true}
}

func (service *ExtensionService) setEnabled(extensionID string, enabled bool) ExtensionOperationResponse {
	service.mu.Lock()
	defer service.mu.Unlock()
	namespace, name, err := parseExtensionID(extensionID)

	if err != nil {
		return operationError("EXTENSION_NOT_FOUND", "Extension identity is invalid.", err)
	}
	record, err := install.SetEnabled(service.installRoot, namespace, name, enabled)

	if err != nil {
		return ExtensionOperationResponse{Error: mapInstallError(err)}
	}
	mapped := service.mapInstalled(record, true)
	return ExtensionOperationResponse{Record: &mapped, RestartRequired: true}
}
func (service *ExtensionService) loadConfig() (registryconfig.Config, error) {
	config, err := registryconfig.Load(service.configPath)

	if errors.Is(err, os.ErrNotExist) {
		return registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{}}, nil
	}
	return config, err
}
func (service *ExtensionService) mapInstalled(record install.Record, restart bool) InstalledExtension {
	manifest := map[string]any{}
	integrity := "verified"
	data, err := os.ReadFile(filepath.Join(record.InstallPath, alx.ManifestFile))

	if err != nil {
		integrity = "missing"
	} else if parsed, parseErr := alx.ParseManifest(data); parseErr != nil {
		integrity = "invalid"
	} else {
		manifest = parsed.Raw
		canonical, marshalErr := json.Marshal(parsed.Raw)
		if marshalErr != nil {
			integrity = "invalid"
		} else {
			digest := sha256.Sum256(canonical)
			if "sha256:"+hex.EncodeToString(digest[:]) != record.ManifestDigest {
				integrity = "mismatch"
			}
		}
		if _, entryErr := os.Stat(filepath.Join(record.InstallPath, filepath.FromSlash(parsed.Entry))); entryErr != nil {
			integrity = "missing"
		}
	}
	displayName, _ := manifest["displayName"].(string)

	if displayName == "" {
		displayName = record.Namespace + "/" + record.Name
	}
	state := "disabled"

	if record.Enabled {
		state = "enabled"
	}
	return InstalledExtension{ID: record.Namespace + "/" + record.Name, ExtensionID: "@" + record.Namespace + "/" + record.Name, DisplayName: displayName, Version: record.Version, Enabled: record.Enabled, State: state, InstallSource: "marketplace", InstalledAt: record.InstalledAt, UpdatedAt: record.InstalledAt, Manifest: manifest, RegistryID: record.RegistryID, RegistrySource: record.RegistrySource, ManifestDigest: record.ManifestDigest, PackageDigest: record.PackageDigest, InstallPath: record.InstallPath, IntegrityState: integrity, RestartRequired: restart}
}

func mapSearchExtension(registryID, displayName string, extension registry.Extension) (SearchExtension, bool) {

	if len(extension.Versions) == 0 {
		return SearchExtension{}, false
	}
	selected := extension.Versions[0]
	for _, version := range extension.Versions {
		if version.Status == "published" {
			selected = version
			break
		}
	}
	compatible, reason := manifestCompatible(selected.Manifest)
	return SearchExtension{RegistryID: registryID, RegistryDisplayName: displayName, ID: extension.ID, Namespace: extension.Publisher, Name: extension.Name, DisplayName: extension.DisplayName, Description: extension.Description, Version: selected.Version, VersionStatus: selected.Status, Manifest: selected.Manifest.Raw, ManifestDigest: selected.ManifestDigest, PackageDigest: selected.Artifact.Digest, PublishedAt: selected.PublishedAt, Compatible: compatible, CompatibilityReason: reason}, true
}
func manifestCompatible(manifest alx.Manifest) (bool, string) {
	supported := false
	for _, host := range manifest.HostSupport {
		if host == "desktop" {
			supported = true
		}
	}

	if !supported {
		return false, "Extension does not support the desktop host."
	}
	constraint, err := semver.NewConstraint(manifest.Engines["activelane"])

	if err != nil {
		return false, "Extension declares an invalid ActiveLane engine constraint."
	}
	current, _ := semver.NewVersion("0.1.0")

	if !constraint.Check(current) {
		return false, fmt.Sprintf("Extension requires ActiveLane %s; this desktop is 0.1.0.", manifest.Engines["activelane"])
	}

	if values := manifest.OS; len(values) > 0 && !containsString(values, runtime.GOOS) {
		return false, fmt.Sprintf("Extension does not support operating system %s.", runtime.GOOS)
	}

	if values := manifest.Architecture; len(values) > 0 && !containsString(values, runtime.GOARCH) {
		return false, fmt.Sprintf("Extension does not support architecture %s.", runtime.GOARCH)
	}
	return true, ""
}
func containsString(values []string, expected string) bool {
	for _, value := range values {
		if value == expected || value == "*" {
			return true
		}
	}
	return false
}
func registryStatus(source registryconfig.Registry) RegistryStatus {
	value := source.URL

	if source.Type == "directory" {
		value = source.Path
	}
	return RegistryStatus{ID: source.ID, DisplayName: source.ID, Type: source.Type, Source: value, Enabled: source.Enabled, Priority: source.Priority, Scopes: source.Scopes, Capabilities: map[string]bool{}}
}
func registryMode(config registryconfig.Config) string {
	enabled, local := 0, 0
	for _, source := range config.Registries {
		if source.Enabled {
			enabled++
			if source.Type == "directory" {
				local++
			}
		}
	}

	if enabled == 0 {
		return "none"
	}

	if enabled == local {
		return "local-only"
	}
	return "connected"
}
func publicEnabled(config registryconfig.Config) bool {
	for _, source := range config.Registries {
		if source.Enabled && (source.ID == "activelane" || strings.Contains(source.URL, "registry.activelane")) {
			return true
		}
	}
	return false
}
func findRegistry(config registryconfig.Config, id string) (registryconfig.Registry, error) {
	for _, source := range config.Registries {
		if source.ID == id {
			return source, nil
		}
	}
	return registryconfig.Registry{}, fmt.Errorf("registry %q is not configured", id)
}
func parseExtensionID(id string) (string, string, error) {
	value := strings.TrimPrefix(id, "@")
	parts := strings.Split(value, "/")

	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", fmt.Errorf("expected @namespace/name")
	}
	return parts[0], parts[1], nil
}
func desktopError(code, message string, err error) *DesktopError {
	detail := ""

	if err != nil {
		detail = err.Error()
	}
	return &DesktopError{Code: code, Message: message, Detail: detail}
}
func operationError(code, message string, err error) ExtensionOperationResponse {
	return ExtensionOperationResponse{Error: desktopError(code, message, err)}
}
func mapInstallError(err error) *DesktopError {
	var domain *install.Error

	if errors.As(err, &domain) {
		return desktopError(domain.Code, domain.Message, domain.Cause)
	}
	message := err.Error()
	switch {
	case strings.Contains(message, "yanked"):
		return desktopError("VERSION_YANKED", "The selected version has been yanked.", err)
	case strings.Contains(message, "digest mismatch"):
		return desktopError("PACKAGE_DIGEST_MISMATCH", "Package verification failed.", err)
	case strings.Contains(message, "invalid manifest") || strings.Contains(message, "package"):
		return desktopError("PACKAGE_INVALID", "The extension package is invalid.", err)
	default:
		return desktopError("INSTALL_FAILED", "The extension operation failed.", err)
	}
}
