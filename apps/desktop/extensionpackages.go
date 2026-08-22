package main

import (
	"fmt"
	"mime"
	"net/http"
	"net/url"
	"os"
	"path"
	"path/filepath"
	"strings"

	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/install"
)

const extensionResourcePrefix = "/__activelane/extensions/"

type installedPackage struct {
	record   install.Record
	manifest alx.Manifest
}

func (service *ExtensionService) resolveInstalledPackage(extensionID, version string, requireEnabled bool) (installedPackage, error) {
	namespace, name, err := parseExtensionID(extensionID)
	if err != nil {
		return installedPackage{}, err
	}
	records, err := install.ListRecords(service.installRoot)
	if err != nil {
		return installedPackage{}, err
	}
	for _, record := range records {
		if record.Namespace != namespace || record.Name != name || record.Version != version {
			continue
		}
		if requireEnabled && !record.Enabled {
			return installedPackage{}, fmt.Errorf("extension is disabled")
		}
		manifestBytes, readErr := os.ReadFile(filepath.Join(record.InstallPath, alx.ManifestFile))
		if readErr != nil {
			return installedPackage{}, fmt.Errorf("read installed manifest: %w", readErr)
		}
		manifest, parseErr := alx.ParseManifest(manifestBytes)
		if parseErr != nil {
			return installedPackage{}, parseErr
		}
		if manifest.Publisher != record.Namespace || manifest.Name != record.Name || manifest.Version != record.Version {
			return installedPackage{}, fmt.Errorf("installed manifest identity does not match installation record")
		}
		return installedPackage{record: record, manifest: manifest}, nil
	}
	return installedPackage{}, os.ErrNotExist
}

func (service *ExtensionService) resolvePackageResource(extensionID, version, resource string, requireEnabled bool) (string, error) {
	packageInfo, err := service.resolveInstalledPackage(extensionID, version, requireEnabled)
	if err != nil {
		return "", err
	}
	resource, err = normalizePackageResource(resource)
	if err != nil {
		return "", err
	}
	filename := filepath.Join(packageInfo.record.InstallPath, filepath.FromSlash(resource))
	if err := validatePackageFile(packageInfo.record.InstallPath, filename); err != nil {
		return "", err
	}
	return filename, nil
}

func normalizePackageResource(resource string) (string, error) {
	if resource == "" || strings.Contains(resource, "\\") || strings.HasPrefix(resource, "/") || path.Clean(resource) != resource || resource == "." || strings.HasPrefix(resource, "../") {
		return "", fmt.Errorf("unsafe package resource")
	}
	return resource, nil
}

func validatePackageFile(root, filename string) error {
	rootAbs, err := filepath.EvalSymlinks(root)
	if err != nil {
		return err
	}
	fileAbs, err := filepath.EvalSymlinks(filename)
	if err != nil {
		return err
	}
	relative, err := filepath.Rel(rootAbs, fileAbs)
	if err != nil || relative == "." || strings.HasPrefix(relative, ".."+string(os.PathSeparator)) || filepath.IsAbs(relative) {
		return fmt.Errorf("package resource escapes installed package")
	}
	info, err := os.Stat(fileAbs)
	if err != nil {
		return err
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("package resource is not a regular file")
	}
	return nil
}

func extensionAssetMiddleware(service *ExtensionService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
			if !strings.HasPrefix(request.URL.Path, extensionResourcePrefix) {
				next.ServeHTTP(response, request)
				return
			}
			serveExtensionResource(service, response, request)
		})
	}
}

func serveExtensionResource(service *ExtensionService, response http.ResponseWriter, request *http.Request) {
	if request.Method != http.MethodGet && request.Method != http.MethodHead {
		response.Header().Set("Allow", "GET, HEAD")
		http.Error(response, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	escaped := strings.TrimPrefix(request.URL.EscapedPath(), extensionResourcePrefix)
	decoded, err := url.PathUnescape(escaped)
	if err != nil {
		http.Error(response, "invalid extension resource", http.StatusBadRequest)
		return
	}
	parts := strings.Split(decoded, "/")
	if len(parts) < 4 {
		http.NotFound(response, request)
		return
	}
	namespace, name, version := parts[0], parts[1], parts[2]
	if namespace == "" || name == "" || version == "" {
		http.NotFound(response, request)
		return
	}
	service.mu.Lock()
	filename, err := service.resolvePackageResource("@"+namespace+"/"+name, version, strings.Join(parts[3:], "/"), true)
	service.mu.Unlock()
	if err != nil {
		if os.IsNotExist(err) {
			http.NotFound(response, request)
			return
		}
		http.Error(response, "extension resource unavailable", http.StatusForbidden)
		return
	}
	contentType := mime.TypeByExtension(strings.ToLower(filepath.Ext(filename)))
	if contentType != "" {
		response.Header().Set("Content-Type", contentType)
	}
	// Sandboxed extension views intentionally have an opaque origin. Their module
	// scripts therefore require an explicit CORS grant even though both documents
	// are served by ActiveLane's private application resource scheme.
	response.Header().Set("Access-Control-Allow-Origin", "*")
	response.Header().Set("Cache-Control", "no-cache")
	response.Header().Set("X-Content-Type-Options", "nosniff")
	file, err := os.Open(filename)
	if err != nil {
		http.NotFound(response, request)
		return
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		http.NotFound(response, request)
		return
	}
	http.ServeContent(response, request, filepath.Base(filename), info.ModTime(), file)
}
