package main

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/activelane/activelane/go/registryconfig"
)

func TestInitValidatePackInspectWorkflow(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "example")
	var out bytes.Buffer
	if err := run([]string{"init", dir}, &out); err != nil {
		t.Fatal(err)
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

func TestRegistryRoutingRejectsUnownedNamespace(t *testing.T) {
	config := registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{
		{ID: "local", Type: "remote", URL: "http://127.0.0.1:8787", Enabled: true, Scopes: []string{"local"}},
	}}
	if _, err := config.Resolve("activelane"); err == nil {
		t.Fatal("expected activelane namespace to be rejected")
	}
}
