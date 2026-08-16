package install

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/activelane/activelane/go/registryconfig"
)

func installedFixture(t *testing.T, root string, enabled bool) Record {
	t.Helper()
	path := filepath.Join(root, "acme", "example", "1.0.0")
	if err := os.MkdirAll(path, 0o755); err != nil {
		t.Fatal(err)
	}
	record := Record{SchemaVersion: 1, RegistryID: "local", Namespace: "acme", Name: "example", Version: "1.0.0", InstallPath: path, Enabled: enabled}
	if err := UpdateRecord(filepath.Join(root, RecordsFile), record); err != nil {
		t.Fatal(err)
	}
	return record
}

func TestEnableDisablePersists(t *testing.T) {
	root := t.TempDir()
	installedFixture(t, root, false)
	record, err := SetEnabled(root, "acme", "example", true)
	if err != nil || !record.Enabled {
		t.Fatalf("enable: %+v %v", record, err)
	}
	record, err = SetEnabled(root, "acme", "example", false)
	if err != nil || record.Enabled {
		t.Fatalf("disable: %+v %v", record, err)
	}
	records, err := ListRecords(root)
	if err != nil || len(records) != 1 || records[0].Enabled {
		t.Fatalf("reload: %+v %v", records, err)
	}
}

func TestUninstallRemovesOnlyOwnedPath(t *testing.T) {
	root := t.TempDir()
	record := installedFixture(t, root, false)
	if err := Uninstall(root, "acme", "example"); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(record.InstallPath); !errors.Is(err, os.ErrNotExist) {
		t.Fatalf("path remains: %v", err)
	}
	records, err := ListRecords(root)
	if err != nil || len(records) != 0 {
		t.Fatalf("records: %+v %v", records, err)
	}
}

func TestUninstallRejectsEscapingRecordPath(t *testing.T) {
	root, outside := t.TempDir(), t.TempDir()
	marker := filepath.Join(outside, "keep")
	if err := os.WriteFile(marker, []byte("safe"), 0o644); err != nil {
		t.Fatal(err)
	}
	record := Record{SchemaVersion: 1, RegistryID: "local", Namespace: "acme", Name: "example", Version: "1.0.0", InstallPath: outside}
	if err := writeRecords(filepath.Join(root, RecordsFile), []Record{record}); err != nil {
		t.Fatal(err)
	}
	err := Uninstall(root, "acme", "example")
	var installErr *Error
	if !errors.As(err, &installErr) || installErr.Code != "INSTALLATION_CORRUPT" {
		t.Fatalf("unexpected error: %v", err)
	}
	if _, err := os.Stat(marker); err != nil {
		t.Fatalf("outside file changed: %v", err)
	}
}

func TestUninstallRequiresDisabledRecord(t *testing.T) {
	root := t.TempDir()
	installedFixture(t, root, true)
	err := Uninstall(root, "acme", "example")
	var installErr *Error
	if !errors.As(err, &installErr) || installErr.Code != "DISABLE_FAILED" {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestInstallRejectsSelectedRegistryDifferentFromRoute(t *testing.T) {
	root := t.TempDir()
	config := registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{{ID: "owner", Type: "directory", Path: t.TempDir(), Enabled: true, Scopes: []string{"acme"}}}}
	_, err := (Installer{Root: root}).InstallFromRegistry(context.Background(), config, "acme/example@1.0.0", "other")
	var installErr *Error
	if !errors.As(err, &installErr) || installErr.Code != "REGISTRY_SCOPE_AMBIGUOUS" {
		t.Fatalf("unexpected error: %v", err)
	}
}
