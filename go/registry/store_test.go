package registry

import (
	"bytes"
	"context"
	"errors"
	"os"
	"path/filepath"
	"sync"
	"testing"

	"github.com/activelane/activelane/go/alx"
)

func packageBytes(t *testing.T) []byte {
	t.Helper()
	root := t.TempDir()
	os.MkdirAll(filepath.Join(root, "extension"), 0755)
	os.WriteFile(filepath.Join(root, alx.ManifestFile), []byte(`{"schemaVersion":"1.0.0","id":"@acme/example","publisher":"acme","name":"example","displayName":"Example","version":"1.0.0","description":"Example","entry":"extension/main.js","engines":{"activelane":"*"},"hostSupport":["desktop"],"extensionKind":["workbench"]}`), 0644)
	os.WriteFile(filepath.Join(root, "extension/main.js"), []byte("ok"), 0644)
	out := filepath.Join(t.TempDir(), "x.alx")
	if _, e := alx.PackDir(root, out); e != nil {
		t.Fatal(e)
	}
	b, e := os.ReadFile(out)
	if e != nil {
		t.Fatal(e)
	}
	return b
}

func TestPublishImmutableAndYankRestore(t *testing.T) {
	s, _ := NewStore(t.TempDir())
	b := packageBytes(t)
	v, e := s.Publish(context.Background(), "acme", "example", bytes.NewReader(b))
	if e != nil {
		t.Fatal(e)
	}
	if _, e = s.Publish(context.Background(), "acme", "example", bytes.NewReader(b)); !errors.Is(e, ErrVersionExists) {
		t.Fatalf("expected exists: %v", e)
	}
	v, e = s.SetYanked("acme", "example", v.Version, true)
	if e != nil || v.Status != "yanked" {
		t.Fatal(e)
	}
	v, e = s.SetYanked("acme", "example", v.Version, false)
	if e != nil || v.Status != "published" {
		t.Fatal(e)
	}
}

func TestConcurrentPublishOneWinner(t *testing.T) {
	s, _ := NewStore(t.TempDir())
	b := packageBytes(t)
	var wg sync.WaitGroup
	errs := make(chan error, 2)
	for range 2 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, e := s.Publish(context.Background(), "acme", "example", bytes.NewReader(b))
			errs <- e
		}()
	}
	wg.Wait()
	close(errs)
	success, exists := 0, 0
	for e := range errs {
		if e == nil {
			success++
		} else if errors.Is(e, ErrVersionExists) {
			exists++
		} else {
			t.Fatal(e)
		}
	}
	if success != 1 || exists != 1 {
		t.Fatalf("success=%d exists=%d", success, exists)
	}
}
