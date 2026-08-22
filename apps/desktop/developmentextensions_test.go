package main

import (
	"encoding/json"
	"net"
	"path/filepath"
	"testing"
	"time"

	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/devextensions"
)

func TestDevelopmentRegistrationFollowsConnectionLifecycle(t *testing.T) {
	registry := newDevelopmentExtensionRegistry()
	changed := make(chan struct{}, 4)
	registry.emitChanged = func() { changed <- struct{}{} }
	client, server := net.Pipe()
	go registry.handle(server)
	connection := client
	registration := developmentTestRegistration(t, 1)
	if err := json.NewEncoder(connection).Encode(devextensions.Message{Type: "register", Registration: &registration}); err != nil {
		t.Fatal(err)
	}
	var response devextensions.Response
	if err := json.NewDecoder(connection).Decode(&response); err != nil || !response.OK {
		t.Fatalf("registration response: %#v, %v", response, err)
	}
	awaitDevelopmentChange(t, changed)
	if items := registry.list(); len(items) != 1 || items[0].Generation != 1 {
		t.Fatalf("unexpected registrations: %#v", items)
	}

	_ = connection.Close()
	awaitDevelopmentChange(t, changed)
	if items := registry.list(); len(items) != 0 {
		t.Fatalf("registration survived owner disconnect: %#v", items)
	}
}

func TestDevelopmentRegistrationRejectsCompetingOwner(t *testing.T) {
	registry := newDevelopmentExtensionRegistry()
	first := developmentTestRegistration(t, 1)
	if err := registry.register(first); err != nil {
		t.Fatal(err)
	}
	second := first
	second.SessionID = "another-session"
	if err := registry.register(second); err == nil {
		t.Fatal("expected competing session to be rejected")
	}
}

func developmentTestRegistration(t *testing.T, generation int) devextensions.Registration {
	t.Helper()
	manifest, err := alx.ParseManifest([]byte(`{
  "schemaVersion":"1.0.0","id":"@test/development","publisher":"test","name":"development","displayName":"Development","version":"1.0.0","description":"test","entry":"dist/extension.js","engines":{"activelane":">=0.1.0"},"hostSupport":["desktop"],"extensionKind":["workbench"],"contributes":{"containers":[{"id":"test.sidebar","location":"primary-sidebar","title":"Test"}],"views":[{"id":"test.view","container":"test.sidebar","title":"Test","renderer":{"type":"isolated","entry":"dist/views/sidebar/index.html"}}]}
}`))
	if err != nil {
		t.Fatal(err)
	}
	return devextensions.Registration{SessionID: "test-session", ProjectRoot: t.TempDir(), Manifest: manifest, RuntimePath: filepath.Join(t.TempDir(), "extension.js"), AssetURLs: map[string]string{"dist/views/sidebar/index.html": "http://127.0.0.1:43127/views/sidebar/index.html"}, Generation: generation}
}

func awaitDevelopmentChange(t *testing.T, changed <-chan struct{}) {
	t.Helper()
	select {
	case <-changed:
	case <-time.After(time.Second):
		t.Fatal("timed out waiting for development registry change")
	}
}
