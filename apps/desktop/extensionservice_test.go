package main

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/activelane/activelane/go/alx"
	registry "github.com/activelane/activelane/go/registry"
	"github.com/activelane/activelane/go/registryconfig"
)

func serviceFixture(t *testing.T) (*ExtensionService, string) {
	t.Helper()
	registryRoot, extensionRoot, installRoot := t.TempDir(), t.TempDir(), t.TempDir()

	if err := os.MkdirAll(filepath.Join(extensionRoot, "extension"), 0o755); err != nil {
		t.Fatal(err)
	}
	manifest := `{"schemaVersion":"1.0.0","id":"@local/example","publisher":"local","name":"example","displayName":"Example","version":"1.0.0","description":"Example extension","entry":"extension/main.js","engines":{"activelane":"*"},"hostSupport":["desktop"],"extensionKind":["workbench"]}`

	if err := os.WriteFile(filepath.Join(extensionRoot, alx.ManifestFile), []byte(manifest), 0o644); err != nil {
		t.Fatal(err)
	}

	if err := os.WriteFile(filepath.Join(extensionRoot, "extension/main.js"), []byte("export {}"), 0o644); err != nil {
		t.Fatal(err)
	}
	packageFile := filepath.Join(t.TempDir(), "example.alx")

	if _, err := alx.PackDir(extensionRoot, packageFile); err != nil {
		t.Fatal(err)
	}
	packageBytes, err := os.ReadFile(packageFile)

	if err != nil {
		t.Fatal(err)
	}
	store, err := registry.NewStore(registryRoot)

	if err != nil {
		t.Fatal(err)
	}

	if _, err := store.Publish(context.Background(), "local", "example", bytes.NewReader(packageBytes)); err != nil {
		t.Fatal(err)
	}
	configPath := filepath.Join(t.TempDir(), "registries.json")
	config := registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{{ID: "local", Type: "directory", Path: registryRoot, Enabled: true, Priority: 100, Scopes: []string{"local"}}, {ID: "offline", Type: "remote", URL: "http://127.0.0.1:1", Enabled: true, Priority: 10, Scopes: []string{"offline"}}}}

	if err := registryconfig.Save(configPath, config); err != nil {
		t.Fatal(err)
	}
	return NewExtensionServiceAt(configPath, installRoot), installRoot
}

func TestSearchPreservesSourceAndPartialFailure(t *testing.T) {
	service, _ := serviceFixture(t)
	response := service.Search(context.Background(), "example")

	if response.Error != nil || len(response.Items) != 1 || response.Items[0].RegistryID != "local" {
		t.Fatalf("items: %+v error: %+v", response.Items, response.Error)
	}

	if len(response.Failures) != 1 || response.Failures[0].Error.Code != "REGISTRY_UNAVAILABLE" {
		t.Fatalf("failures: %+v", response.Failures)
	}
}

func TestInstallEnableDisableRestartAndUninstall(t *testing.T) {
	service, installRoot := serviceFixture(t)
	installed := service.Install(context.Background(), "local", "@local/example", "1.0.0")

	if installed.Error != nil || installed.Record == nil || installed.Record.Enabled || !installed.RestartRequired {
		t.Fatalf("install: %+v", installed)
	}
	restarted := NewExtensionServiceAt(service.configPath, installRoot)
	loaded := restarted.Installed()

	if loaded.Error != nil || len(loaded.Items) != 1 || loaded.Items[0].RegistryID != "local" {
		t.Fatalf("loaded: %+v", loaded)
	}
	enabled := restarted.Enable("@local/example")

	if enabled.Error != nil || enabled.Record == nil || !enabled.Record.Enabled {
		t.Fatalf("enable: %+v", enabled)
	}

	if uninstall := restarted.Uninstall("@local/example"); uninstall.Error == nil || uninstall.Error.Code != "DISABLE_FAILED" {
		t.Fatalf("enabled uninstall: %+v", uninstall)
	}
	disabled := restarted.Disable("@local/example")

	if disabled.Error != nil || disabled.Record == nil || disabled.Record.Enabled {
		t.Fatalf("disable: %+v", disabled)
	}
	removed := restarted.Uninstall("@local/example")

	if removed.Error != nil {
		t.Fatalf("uninstall: %+v", removed)
	}

	if items := restarted.Installed(); items.Error != nil || len(items.Items) != 0 {
		t.Fatalf("after uninstall: %+v", items)
	}
}

func TestStructuredInstallErrorSurvivesServiceBoundary(t *testing.T) {
	service, _ := serviceFixture(t)
	response := service.Install(context.Background(), "offline", "@local/example", "1.0.0")

	if response.Error == nil || response.Error.Code != "REGISTRY_SCOPE_AMBIGUOUS" {
		t.Fatalf("response: %+v", response)
	}
}

func TestNoRegistriesConfigured(t *testing.T) {
	service := NewExtensionServiceAt(filepath.Join(t.TempDir(), "missing.json"), t.TempDir())
	response := service.Search(context.Background(), "anything")

	if response.Error != nil || response.Mode != "none" || len(response.Items) != 0 {
		t.Fatalf("response: %+v", response)
	}
}

func TestManifestCompatibilityUsesEngineOSAndArchitecture(t *testing.T) {
	manifest, err := alx.ParseManifest([]byte(`{"schemaVersion":"1.0.0","id":"@local/example","publisher":"local","name":"example","displayName":"Example","version":"1.0.0","description":"Example","entry":"extension/main.js","engines":{"activelane":"^0.1.0"},"hostSupport":["desktop"],"extensionKind":["workbench"]}`))

	if err != nil {
		t.Fatal(err)
	}
	manifest.OS = []string{"unsupported"}
	manifest.Architecture = []string{"unsupported"}

	if compatible, _ := manifestCompatible(manifest); compatible {
		t.Fatal("expected incompatible platform")
	}
	manifest.OS = []string{"*"}
	manifest.Architecture = []string{"*"}

	if compatible, reason := manifestCompatible(manifest); !compatible {
		t.Fatalf("expected compatible: %s", reason)
	}
}

func TestInstalledIntegrityMismatchIsPresented(t *testing.T) {
	service, _ := serviceFixture(t)
	installed := service.Install(context.Background(), "local", "@local/example", "1.0.0")

	if installed.Error != nil || installed.Record == nil {
		t.Fatalf("install: %+v", installed)
	}
	manifestPath := filepath.Join(installed.Record.InstallPath, alx.ManifestFile)
	data, err := os.ReadFile(manifestPath)

	if err != nil {
		t.Fatal(err)
	}
	data = bytes.Replace(data, []byte("Example extension"), []byte("Changed extension"), 1)

	if err := os.WriteFile(manifestPath, data, 0o644); err != nil {
		t.Fatal(err)
	}
	response := service.Installed()

	if response.Error != nil || len(response.Items) != 1 || response.Items[0].IntegrityState != "mismatch" {
		t.Fatalf("response: %+v", response)
	}
}
