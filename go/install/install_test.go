package install

import (
	"bytes"
	"context"
	"github.com/activelane/activelane/go/alx"
	reg "github.com/activelane/activelane/go/registry"
	"github.com/activelane/activelane/go/registryconfig"
	"os"
	"path/filepath"
	"testing"
)

func TestDirectoryInstallAndRecord(t *testing.T) {
	_, config := installFixture(t)
	root := t.TempDir()
	record, e := (Installer{Root: root}).Install(context.Background(), config, "local/example@1.0.0")
	if e != nil {
		t.Fatal(e)
	}
	if record.RegistryID != "local" || record.PackageDigest == "" || record.Enabled {
		t.Fatalf("bad record: %+v", record)
	}
	if !filepath.IsAbs(record.InstallPath) {
		t.Fatalf("install path is not absolute: %s", record.InstallPath)
	}
	if _, e = os.Stat(filepath.Join(record.InstallPath, "extension/main.js")); e != nil {
		t.Fatal(e)
	}
}

func TestInstallRepairsOrphanedDestinationAndWritesInventory(t *testing.T) {
	_, config := installFixture(t)
	root := t.TempDir()
	destination := filepath.Join(root, "local", "example", "1.0.0")
	if err := os.MkdirAll(destination, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(destination, "interrupted"), []byte("partial"), 0644); err != nil {
		t.Fatal(err)
	}
	record, err := (Installer{Root: root}).Install(context.Background(), config, "local/example@1.0.0")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(record.InstallPath, "extension/main.js")); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(record.InstallPath, "interrupted")); !os.IsNotExist(err) {
		t.Fatalf("orphaned file survived repair: %v", err)
	}
	if _, err := ReadRecord(filepath.Join(root, RecordsFile), "local", "example"); err != nil {
		t.Fatal(err)
	}
}

func TestReinstallRepairsCorruptedRecordedDestination(t *testing.T) {
	_, config := installFixture(t)
	root := t.TempDir()
	installer := Installer{Root: root}
	record, err := installer.Install(context.Background(), config, "local/example@1.0.0")
	if err != nil {
		t.Fatal(err)
	}
	entry := filepath.Join(record.InstallPath, "extension/main.js")
	if err := os.WriteFile(entry, []byte("corrupted"), 0644); err != nil {
		t.Fatal(err)
	}
	if _, err := installer.Install(context.Background(), config, "local/example@1.0.0"); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(entry)
	if err != nil {
		t.Fatal(err)
	}
	if string(data) == "corrupted" {
		t.Fatal("corrupted entry was not repaired")
	}
}

func installFixture(t *testing.T) (string, registryconfig.Config) {
	t.Helper()
	source := t.TempDir()
	ext := t.TempDir()
	os.MkdirAll(filepath.Join(ext, "extension"), 0755)
	os.WriteFile(filepath.Join(ext, alx.ManifestFile), []byte(`{"schemaVersion":"1.0.0","id":"@local/example","publisher":"local","name":"example","displayName":"Example","version":"1.0.0","description":"Example","entry":"extension/main.js","engines":{"activelane":"*"},"hostSupport":["desktop"],"extensionKind":["workbench"]}`), 0644)
	os.WriteFile(filepath.Join(ext, "extension/main.js"), []byte("export default { manifest: { id: '@local/example', version: '1.0.0' } }"), 0644)
	pkg := filepath.Join(t.TempDir(), "x.alx")
	alx.PackDir(ext, pkg)
	b, _ := os.ReadFile(pkg)
	store, _ := reg.NewStore(source)
	store.Publish(context.Background(), "local", "example", bytes.NewReader(b))
	config := registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{{ID: "local", Type: "directory", Path: source, Enabled: true, Scopes: []string{"local"}}}}
	return source, config
}
