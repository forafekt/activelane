package registryconfig

import (
	"strings"
	"testing"
)

func TestDuplicateNamespaceRejected(t *testing.T) {
	c := Config{Version: 1, Registries: []Registry{{ID: "a", Type: "directory", Path: "a", Enabled: true, Scopes: []string{"acme"}}, {ID: "b", Type: "remote", URL: "http://b", Enabled: true, Scopes: []string{"acme"}}}}
	if e := c.Validate(); e == nil || !strings.Contains(e.Error(), "already routed") {
		t.Fatalf("unexpected error: %v", e)
	}
}

func TestDisabledPublicAndLocalOnly(t *testing.T) {
	c := Config{Version: 1, Registries: []Registry{{ID: "public", Type: "remote", URL: "https://example", Enabled: false, Scopes: []string{"activelane"}}, {ID: "local", Type: "directory", Path: "local", Enabled: true, Scopes: []string{"local"}}}}
	if e := c.Validate(); e != nil {
		t.Fatal(e)
	}
	if _, e := c.Resolve("activelane"); e == nil {
		t.Fatal("disabled registry resolved")
	}
	r, e := c.Resolve("local")
	if e != nil || r.ID != "local" {
		t.Fatalf("resolve: %v %v", r, e)
	}
}
