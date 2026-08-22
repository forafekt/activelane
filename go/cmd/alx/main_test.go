package main

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/activelane/activelane/go/registryconfig"
)

func TestCreateValidatePackInspectWorkflow(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "example")
	var out bytes.Buffer
	if err := run([]string{"create", dir}, &out); err != nil {
		t.Fatal(err)
	}
	for name, contents := range map[string]string{
		"dist/extension.js":             "export default {}",
		"dist/views/primary/index.html": "<main>Primary</main>",
		"dist/views/editor/index.html":  "<main>Editor</main>",
	} {
		filename := filepath.Join(dir, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(filename), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filename, []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	if err := run([]string{"validate", filepath.Join(dir, "activelane.manifest.json")}, &out); err != nil {
		t.Fatal(err)
	}
	pkg := filepath.Join(t.TempDir(), "example.alx")
	if err := run([]string{"pack", dir, "--output", pkg}, &out); err != nil {
		t.Fatal(err)
	}
	if err := run([]string{"inspect", pkg, "--json"}, &out); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(pkg); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out.String(), "sha256:") {
		t.Fatalf("missing digest: %s", out.String())
	}
}

func TestDiscoverProjectRootFromViewDirectory(t *testing.T) {
	root := t.TempDir()
	nested := filepath.Join(root, "src", "views", "editor")
	if err := os.MkdirAll(nested, 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "activelane.manifest.json"), []byte("{}"), 0o644); err != nil {
		t.Fatal(err)
	}
	discovered, err := discoverProjectRoot(nested)
	if err != nil {
		t.Fatal(err)
	}
	if discovered != root {
		t.Fatalf("discovered %s, want %s", discovered, root)
	}
}

func TestCreateGeneratesCanonicalMultiEntryProject(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "notes")
	var out bytes.Buffer
	if err := run([]string{"create", dir, "--publisher", "sample", "--display-name", "Team Notes", "--view", "editor", "--view", "panel"}, &out); err != nil {
		t.Fatal(err)
	}
	for _, name := range []string{
		"activelane.manifest.json",
		"activelane.dev.json",
		"package.json",
		"pnpm-workspace.yaml",
		"tsconfig.json",
		"vite.config.ts",
		"src/runtime/extension.ts",
		"src/views/editor/index.html",
		"src/views/editor/main.ts",
		"src/views/panel/index.html",
		"src/views/panel/main.ts",
	} {
		if _, err := os.Stat(filepath.Join(dir, filepath.FromSlash(name))); err != nil {
			t.Fatalf("missing generated file %s: %v", name, err)
		}
	}
	manifest, err := os.ReadFile(filepath.Join(dir, "activelane.manifest.json"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(manifest), `"id": "@sample/notes"`) || !strings.Contains(string(manifest), `"multiple": true`) {
		t.Fatalf("generated manifest does not describe the selected editor: %s", manifest)
	}
	development, err := os.ReadFile(filepath.Join(dir, "activelane.dev.json"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(development), `"dist/views/editor/index.html": "src/views/editor/index.html"`) {
		t.Fatalf("generated development mapping is incomplete: %s", development)
	}
}

func TestRegistryRoutingRejectsUnownedNamespace(t *testing.T) {
	config := registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{
		{ID: "local", Type: "remote", URL: "http://127.0.0.1:8787", Enabled: true, Scopes: []string{"local"}},
	}}
	if _, err := config.Resolve("activelane"); err == nil {
		t.Fatal("expected activelane namespace to be rejected")
	}
}
