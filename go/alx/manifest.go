package alx

import (
	"encoding/json"
	"fmt"
	"path"
	"regexp"
	"strings"
)

const (
	ManifestFile          = "activelane.manifest.json"
	ManifestSchemaVersion = "1.0.0"
	MaxManifestBytes      = 1 << 20
)

var (
	segmentRE         = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*$`)
	semverRE          = regexp.MustCompile(`^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$`)
	defaultExportRE   = regexp.MustCompile(`(?m)\bexport\s+default\b|(?s)\bexport\s*\{[^}]*\bas\s+default\b[^}]*\}`)
	validOS           = map[string]bool{"linux": true, "darwin": true, "windows": true}
	validArchitecture = map[string]bool{"amd64": true, "arm64": true, "386": true}
)

type Manifest struct {
	SchemaVersion string            `json:"schemaVersion"`
	ID            string            `json:"id"`
	Publisher     string            `json:"publisher"`
	Name          string            `json:"name"`
	DisplayName   string            `json:"displayName"`
	Version       string            `json:"version"`
	Description   string            `json:"description"`
	Entry         string            `json:"entry"`
	Engines       map[string]string `json:"engines"`
	HostSupport   []string          `json:"hostSupport"`
	ExtensionKind []string          `json:"extensionKind"`
	OS            []string          `json:"os,omitempty"`
	Architecture  []string          `json:"architecture,omitempty"`
	Visibility    string            `json:"visibility,omitempty"`
	Raw           map[string]any    `json:"-"`
}

// ValidateRuntimeEntry checks the package-level contract that can be established
// without executing untrusted extension code. Runtime validation still checks the
// exported definition's shape, identity, and version after the module is loaded.
func ValidateRuntimeEntry(name string, data []byte) error {
	extension := strings.ToLower(path.Ext(name))
	if extension != ".js" && extension != ".mjs" {
		return fmt.Errorf("runtime entry %q must be an ES module ending in .js or .mjs", name)
	}
	if !defaultExportRE.Match(data) {
		return fmt.Errorf("runtime entry %q must default-export a Workbench extension definition", name)
	}
	return nil
}

func (m Manifest) MarshalJSON() ([]byte, error) {
	type plain Manifest
	known, err := json.Marshal(plain(m))
	if err != nil {
		return nil, err
	}
	var merged map[string]any
	if err := json.Unmarshal(known, &merged); err != nil {
		return nil, err
	}
	for key, value := range m.Raw {
		if _, exists := merged[key]; !exists {
			merged[key] = value
		}
	}
	delete(merged, "Raw")
	return json.Marshal(merged)
}

func (m *Manifest) UnmarshalJSON(data []byte) error {
	type plain Manifest
	var decoded plain
	if err := json.Unmarshal(data, &decoded); err != nil {
		return err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	*m = Manifest(decoded)
	m.Raw = raw
	return nil
}

func ParseManifest(data []byte) (Manifest, error) {
	if len(data) > MaxManifestBytes {
		return Manifest{}, fmt.Errorf("manifest exceeds %d bytes", MaxManifestBytes)
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return Manifest{}, fmt.Errorf("parse manifest: %w", err)
	}
	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return Manifest{}, fmt.Errorf("parse manifest: %w", err)
	}
	m.Raw = raw
	if err := m.Validate(); err != nil {
		return Manifest{}, err
	}
	return m, nil
}

func (m Manifest) Validate() error {
	var issues []string
	if m.SchemaVersion != ManifestSchemaVersion {
		issues = append(issues, "schemaVersion: must be "+ManifestSchemaVersion)
	}
	if rawPermissions, ok := m.Raw["permissions"]; ok {
		permissions, valid := rawPermissions.([]any)
		if !valid {
			issues = append(issues, "permissions: must be an array")
		} else {
			seen := map[string]bool{}
			for index, rawPermission := range permissions {
				permission, stringValue := rawPermission.(string)
				if !stringValue || permission != "extension-storage" {
					issues = append(issues, fmt.Sprintf("permissions.%d: unsupported permission", index))
				} else if seen[permission] {
					issues = append(issues, fmt.Sprintf("permissions.%d: duplicate permission", index))
				}
				seen[permission] = true
			}
		}
	}
	if !strings.HasPrefix(m.ID, "@") {
		issues = append(issues, "id: must use @namespace/name")
	}
	parts := strings.Split(strings.TrimPrefix(m.ID, "@"), "/")
	if len(parts) != 2 || !segmentRE.MatchString(m.Publisher) || !segmentRE.MatchString(m.Name) || len(parts) == 2 && (parts[0] != m.Publisher || parts[1] != m.Name) {
		issues = append(issues, "id: must match publisher and name")
	}
	if m.DisplayName == "" {
		issues = append(issues, "displayName: must be non-empty")
	}
	if m.Description == "" {
		issues = append(issues, "description: must be non-empty")
	}
	if !semverRE.MatchString(m.Version) {
		issues = append(issues, "version: must be valid semantic version")
	}
	if m.Engines["activelane"] == "" {
		issues = append(issues, "engines.activelane: must be non-empty")
	}
	if len(m.HostSupport) == 0 {
		issues = append(issues, "hostSupport: must be non-empty")
	}
	if len(m.ExtensionKind) == 0 {
		issues = append(issues, "extensionKind: must be non-empty")
	}
	marketplace, err := m.Marketplace()
	if err != nil {
		issues = append(issues, err.Error())
	} else {
		issues = append(issues, validateMarketplace(marketplace)...)
	}
	for index, value := range m.OS {
		if !validOS[value] {
			issues = append(issues, fmt.Sprintf("os.%d: unsupported operating system", index))
		}
	}
	for index, value := range m.Architecture {
		if !validArchitecture[value] {
			issues = append(issues, fmt.Sprintf("architecture.%d: unsupported architecture", index))
		}
	}
	if err := validateArchivePath(m.Entry); err != nil {
		issues = append(issues, "entry: "+err.Error())
	}
	issues = append(issues, validateViewContributions(m.Raw)...)
	if len(issues) > 0 {
		return fmt.Errorf("invalid manifest: %s", strings.Join(issues, "; "))
	}
	return nil
}

func validateViewContributions(raw map[string]any) []string {
	contributes, _ := raw["contributes"].(map[string]any)
	if contributes == nil {
		return nil
	}
	containers := map[string]bool{}
	validLocations := map[string]bool{"primary-sidebar": true, "secondary-sidebar": true, "editor": true, "panel": true, "auxiliary": true}
	var issues []string
	if values, ok := contributes["containers"].([]any); ok {
		for index, value := range values {
			container, _ := value.(map[string]any)
			id, _ := container["id"].(string)
			location, _ := container["location"].(string)
			if id == "" || containers[id] {
				issues = append(issues, fmt.Sprintf("contributes.containers.%d.id: must be unique and non-empty", index))
			}
			containers[id] = true
			if !validLocations[location] {
				issues = append(issues, fmt.Sprintf("contributes.containers.%d.location: unsupported Workbench location", index))
			}
		}
	}
	if values, ok := contributes["views"].([]any); ok {
		seen := map[string]bool{}
		for index, value := range values {
			view, _ := value.(map[string]any)
			id, _ := view["id"].(string)
			container, _ := view["container"].(string)
			if id == "" || seen[id] {
				issues = append(issues, fmt.Sprintf("contributes.views.%d.id: must be unique and non-empty", index))
			}
			seen[id] = true
			if !containers[container] {
				issues = append(issues, fmt.Sprintf("contributes.views.%d.container: unknown container %q", index, container))
			}
			renderer, _ := view["renderer"].(map[string]any)
			typeName, _ := renderer["type"].(string)
			entry, _ := renderer["entry"].(string)
			if typeName != "isolated" {
				issues = append(issues, fmt.Sprintf("contributes.views.%d.renderer.type: must be isolated", index))
			}
			if err := validateArchivePath(entry); err != nil || path.Ext(entry) != ".html" {
				issues = append(issues, fmt.Sprintf("contributes.views.%d.renderer.entry: must be a safe package-relative HTML file", index))
			}
		}
	}
	if values, ok := contributes["commands"].([]any); ok {
		seen := map[string]bool{}
		for index, value := range values {
			command, _ := value.(map[string]any)
			id, _ := command["id"].(string)
			if id == "" || seen[id] {
				issues = append(issues, fmt.Sprintf("contributes.commands.%d.id: must be unique and non-empty", index))
			}
			seen[id] = true
		}
	}
	return issues
}

func (m Manifest) ViewEntries() []string {
	contributes, _ := m.Raw["contributes"].(map[string]any)
	values, _ := contributes["views"].([]any)
	entries := make([]string, 0, len(values))
	for _, value := range values {
		view, _ := value.(map[string]any)
		renderer, _ := view["renderer"].(map[string]any)
		entry, _ := renderer["entry"].(string)
		if entry != "" {
			entries = append(entries, entry)
		}
	}
	return entries
}

func validateArchivePath(name string) error {
	if name == "" {
		return fmt.Errorf("must be non-empty")
	}
	if strings.Contains(name, "\\") || strings.HasPrefix(name, "/") || path.Clean(name) != name || name == "." || strings.HasPrefix(name, "../") {
		return fmt.Errorf("unsafe package path %q", name)
	}
	return nil
}
