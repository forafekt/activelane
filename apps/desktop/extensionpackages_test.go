package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/activelane/activelane/go/install"
)

func TestExtensionAssetHandlerServesInstalledAssetTree(t *testing.T) {
	service := installedExtensionFixture(t, true)
	handler := extensionAssetMiddleware(service)(http.NotFoundHandler())

	request := httptest.NewRequest(http.MethodGet, "/__activelane/extensions/example/views/1.0.0/dist/views/editor/index.html", nil)
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", response.Code, response.Body.String())
	}
	if contentType := response.Header().Get("Content-Type"); contentType != "text/html; charset=utf-8" {
		t.Fatalf("unexpected content type %q", contentType)
	}
	if allowOrigin := response.Header().Get("Access-Control-Allow-Origin"); allowOrigin != "*" {
		t.Fatalf("sandboxed view resources require a CORS grant, got %q", allowOrigin)
	}
	if response.Body.String() != "<script src=\"../../assets/editor.js\"></script>" {
		t.Fatalf("unexpected body %q", response.Body.String())
	}

	request = httptest.NewRequest(http.MethodGet, "/__activelane/extensions/example/views/1.0.0/dist/assets/editor.js", nil)
	response = httptest.NewRecorder()
	handler.ServeHTTP(response, request)
	if response.Code != http.StatusOK || response.Body.String() != "window.editorLoaded=true" {
		t.Fatalf("nested asset was not served: %d %q", response.Code, response.Body.String())
	}
}

func TestExtensionAssetHandlerRejectsTraversalUnknownAndDisabledPackages(t *testing.T) {
	service := installedExtensionFixture(t, true)
	handler := extensionAssetMiddleware(service)(http.NotFoundHandler())

	for _, resource := range []string{
		"/__activelane/extensions/example/views/1.0.0/%2e%2e/activelane.manifest.json",
		"/__activelane/extensions/unknown/views/1.0.0/dist/views/editor/index.html",
	} {
		response := httptest.NewRecorder()
		handler.ServeHTTP(response, httptest.NewRequest(http.MethodGet, resource, nil))
		if response.Code == http.StatusOK {
			t.Fatalf("unsafe or unknown resource was served: %s", resource)
		}
	}

	disabled := installedExtensionFixture(t, false)
	response := httptest.NewRecorder()
	extensionAssetMiddleware(disabled)(http.NotFoundHandler()).ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/__activelane/extensions/example/views/1.0.0/dist/views/editor/index.html", nil))
	if response.Code != http.StatusForbidden {
		t.Fatalf("expected disabled package to be forbidden, got %d", response.Code)
	}
}

func TestExtensionAssetHandlerRejectsSymlinkEscape(t *testing.T) {
	service := installedExtensionFixture(t, true)
	records, err := install.ListRecords(service.installRoot)
	if err != nil {
		t.Fatal(err)
	}
	outside := t.TempDir()
	if err := os.WriteFile(filepath.Join(outside, "secret.js"), []byte("secret"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(outside, filepath.Join(records[0].InstallPath, "linked")); err != nil {
		t.Fatal(err)
	}

	request := httptest.NewRequest(http.MethodGet, "/__activelane/extensions/example/views/1.0.0/linked/secret.js", nil)
	response := httptest.NewRecorder()
	extensionAssetMiddleware(service)(http.NotFoundHandler()).ServeHTTP(response, request)
	if response.Code == http.StatusOK {
		t.Fatal("resource handler served a file through a package-root symlink escape")
	}
}

func installedExtensionFixture(t *testing.T, enabled bool) *ExtensionService {
	t.Helper()
	root := t.TempDir()
	installPath := filepath.Join(root, "example", "views", "1.0.0")
	if err := os.MkdirAll(filepath.Join(installPath, "dist", "views", "editor"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(installPath, "dist", "assets"), 0o755); err != nil {
		t.Fatal(err)
	}
	manifest := `{"schemaVersion":"1.0.0","id":"@example/views","publisher":"example","name":"views","displayName":"Views","version":"1.0.0","description":"Fixture","entry":"dist/extension.js","engines":{"activelane":"*"},"hostSupport":["desktop"],"extensionKind":["workbench"]}`
	files := map[string]string{
		"activelane.manifest.json":     manifest,
		"dist/extension.js":            "export default {}",
		"dist/views/editor/index.html": "<script src=\"../../assets/editor.js\"></script>",
		"dist/assets/editor.js":        "window.editorLoaded=true",
	}
	for name, contents := range files {
		if err := os.WriteFile(filepath.Join(installPath, filepath.FromSlash(name)), []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	records, err := json.Marshal([]install.Record{{SchemaVersion: 1, Namespace: "example", Name: "views", Version: "1.0.0", Enabled: enabled, InstallPath: installPath}})
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, install.RecordsFile), records, 0o600); err != nil {
		t.Fatal(err)
	}
	return NewExtensionServiceAt(filepath.Join(root, "registry.json"), root)
}
