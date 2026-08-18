package seed

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/activelane/activelane/go/registry"
	"github.com/activelane/activelane/go/registry/httpapi"
	"github.com/activelane/activelane/go/registryconfig"
)

type handlerTransport struct{ handler http.Handler }

func (transport handlerTransport) RoundTrip(request *http.Request) (*http.Response, error) {
	recorder := httptest.NewRecorder()
	transport.handler.ServeHTTP(recorder, request)
	return recorder.Result(), nil
}

func TestRemoteFullPipelineIdempotencyAndClean(t *testing.T) {
	store, err := registry.NewStore(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	handler := httpapi.NewRouter(httpapi.Config{Store: store, AllowPublish: true})
	previousClient := http.DefaultClient
	http.DefaultClient = &http.Client{Transport: handlerTransport{handler: handler}}
	defer func() { http.DefaultClient = previousClient }()
	config := registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{{ID: "local", Type: "remote", URL: "http://registry.test", Enabled: true, Scopes: []string{"local"}}}}
	options := Options{RegistryID: "local", Count: 6, Seed: 42, Profile: MarketplaceDemo}
	first, err := Run(context.Background(), config, options)
	if err != nil {
		t.Fatal(err)
	}
	if first.Published != 6 {
		t.Fatalf("unexpected result: %+v", first)
	}
	second, err := Run(context.Background(), config, options)
	if err != nil {
		t.Fatal(err)
	}
	if second.Existing != 6 {
		t.Fatalf("repeat was not idempotent: %+v", second)
	}
	removed, err := Clean(config, "local")
	if err != nil {
		t.Fatal(err)
	}
	if removed != 6 {
		t.Fatalf("removed %d", removed)
	}
	items, err := store.List("")
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 0 {
		t.Fatalf("%d seeded extensions remain", len(items))
	}
}
