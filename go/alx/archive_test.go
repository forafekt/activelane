package alx

import (
	"archive/zip"
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func fixture(t *testing.T) string {
	t.Helper()
	d := t.TempDir()
	manifest := `{"schemaVersion":"1.0.0","id":"@acme/example","publisher":"acme","name":"example","displayName":"Example","version":"1.2.3","description":"Example extension","entry":"extension/main.js","engines":{"activelane":"*"},"hostSupport":["desktop"],"extensionKind":["workbench"]}`
	if err := os.MkdirAll(filepath.Join(d, "extension"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(d, ManifestFile), []byte(manifest), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(d, "extension/main.js"), []byte("export default { manifest: { id: '@acme/example', version: '1.2.3' } }\n"), 0644); err != nil {
		t.Fatal(err)
	}
	return d
}

func TestPackRejectsRuntimeEntryWithoutCanonicalDefaultExport(t *testing.T) {
	d := fixture(t)
	if err := os.WriteFile(filepath.Join(d, "extension/main.js"), []byte("export function createExtension() {}\n"), 0644); err != nil {
		t.Fatal(err)
	}
	_, err := PackDir(d, filepath.Join(t.TempDir(), "invalid.alx"))
	if err == nil || !strings.Contains(err.Error(), "must default-export") {
		t.Fatalf("expected canonical export error, got %v", err)
	}
}

func TestPackIsDeterministic(t *testing.T) {
	d := fixture(t)
	a := filepath.Join(t.TempDir(), "a.alx")
	b := filepath.Join(t.TempDir(), "b.alx")
	ia, e := PackDir(d, a)
	if e != nil {
		t.Fatal(e)
	}
	ib, e := PackDir(d, b)
	if e != nil {
		t.Fatal(e)
	}
	if ia.Digest != ib.Digest {
		t.Fatalf("digests differ: %s %s", ia.Digest, ib.Digest)
	}
}

func TestPackIgnoresDevelopmentDependencyDirectories(t *testing.T) {
	d := fixture(t)
	if err := os.MkdirAll(filepath.Join(d, "node_modules", "example"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink("../../extension", filepath.Join(d, "node_modules", "example", "linked")); err != nil {
		t.Fatal(err)
	}
	inspection, err := PackDir(d, filepath.Join(t.TempDir(), "example.alx"))
	if err != nil {
		t.Fatal(err)
	}
	for _, name := range inspection.Files {
		if strings.HasPrefix(name, "node_modules/") {
			t.Fatalf("development dependency was packed: %s", name)
		}
	}
}

func TestInspectRejectsTraversal(t *testing.T) {
	var b bytes.Buffer
	w := zip.NewWriter(&b)
	h := &zip.FileHeader{Name: "../evil"}
	if _, e := w.CreateHeader(h); e != nil {
		t.Fatal(e)
	}
	w.Close()
	if _, e := InspectBytes(b.Bytes()); e == nil {
		t.Fatal("expected traversal error")
	}
}

func TestManifestRejectsBadVersion(t *testing.T) {
	d := fixture(t)
	data, e := os.ReadFile(filepath.Join(d, ManifestFile))
	if e != nil {
		t.Fatal(e)
	}
	data = bytes.Replace(data, []byte("1.2.3"), []byte("latest"), 1)
	if _, e := ParseManifest(data); e == nil {
		t.Fatal("expected validation error")
	}
}

func TestSharedExampleManifestMatchesGoContract(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("..", "..", "examples", "extensions", "hello", ManifestFile))
	if err != nil {
		t.Fatal(err)
	}
	manifest, err := ParseManifest(data)
	if err != nil {
		t.Fatal(err)
	}
	if manifest.ID != "@local/hello" || manifest.Version != "1.0.0" {
		t.Fatalf("unexpected manifest: %+v", manifest)
	}
}
