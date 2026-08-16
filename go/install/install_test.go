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
	source := t.TempDir()
	root := t.TempDir()
	ext := t.TempDir()
	os.MkdirAll(filepath.Join(ext, "extension"), 0755)
	os.WriteFile(filepath.Join(ext, alx.ManifestFile), []byte(`{"schemaVersion":"1.0.0","id":"@local/example","publisher":"local","name":"example","displayName":"Example","version":"1.0.0","description":"Example","entry":"extension/main.js","engines":{"activelane":"*"},"hostSupport":["desktop"],"extensionKind":["workbench"]}`), 0644)
	os.WriteFile(filepath.Join(ext, "extension/main.js"), []byte("ok"), 0644)
	pkg := filepath.Join(t.TempDir(), "x.alx")
	alx.PackDir(ext, pkg)
	b, _ := os.ReadFile(pkg)
	store, _ := reg.NewStore(source)
	store.Publish(context.Background(), "local", "example", bytes.NewReader(b))
	c := registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{{ID: "local", Type: "directory", Path: source, Enabled: true, Scopes: []string{"local"}}}}
	record, e := (Installer{Root: root}).Install(context.Background(), c, "local/example@1.0.0")
	if e != nil {
		t.Fatal(e)
	}
	if record.RegistryID != "local" || record.PackageDigest == "" || record.Enabled {
		t.Fatalf("bad record: %+v", record)
	}
	if _, e = os.Stat(filepath.Join(record.InstallPath, "extension/main.js")); e != nil {
		t.Fatal(e)
	}
}
