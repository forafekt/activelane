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
	for name, contents := range map[string]string{
		"activelane.dev.json": "{}",
		"package.json":        "{}",
		"pnpm-lock.yaml":      "lockfileVersion: 9",
		"pnpm-workspace.yaml": "allowBuilds:\n  esbuild: true\n",
		"vite.config.ts":      "export default {}",
		"src/extension.ts":    "export default {}",
	} {
		filename := filepath.Join(d, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(filename), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filename, []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	inspection, err := PackDir(d, filepath.Join(t.TempDir(), "example.alx"))
	if err != nil {
		t.Fatal(err)
	}
	for _, name := range inspection.Files {
		if strings.HasPrefix(name, "node_modules/") || strings.HasPrefix(name, "src/") || name == "activelane.dev.json" || name == "package.json" || name == "pnpm-workspace.yaml" {
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

func TestValidateFileRejectsMissingDeclaredViewEntry(t *testing.T) {
	d := fixture(t)
	manifest := `{"schemaVersion":"1.0.0","id":"@acme/example","publisher":"acme","name":"example","displayName":"Example","version":"1.2.3","description":"Example extension","entry":"extension/main.js","engines":{"activelane":"*"},"hostSupport":["desktop"],"extensionKind":["workbench"],"contributes":{"containers":[{"id":"example.editors","location":"editor"}],"views":[{"id":"example.editor","container":"example.editors","renderer":{"type":"isolated","entry":"views/editor/index.html"}}]}}`
	if err := os.WriteFile(filepath.Join(d, ManifestFile), []byte(manifest), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := ValidateFile(filepath.Join(d, ManifestFile)); err == nil || !strings.Contains(err.Error(), "view entry") {
		t.Fatalf("expected missing view entry diagnostic, got %v", err)
	}
}

func TestManifestRejectsDuplicateCommandIDs(t *testing.T) {
	manifest := `{"schemaVersion":"1.0.0","id":"@acme/example","publisher":"acme","name":"example","displayName":"Example","version":"1.2.3","description":"Example extension","entry":"extension/main.js","engines":{"activelane":"*"},"hostSupport":["desktop"],"extensionKind":["workbench"],"contributes":{"commands":[{"id":"example.open"},{"id":"example.open"}]}}`
	if _, err := ParseManifest([]byte(manifest)); err == nil || !strings.Contains(err.Error(), "must be unique") {
		t.Fatalf("expected duplicate command diagnostic, got %v", err)
	}
}
