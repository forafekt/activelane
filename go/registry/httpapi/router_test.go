package httpapi

import (
	"bytes"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/activelane/activelane/go/registry"
)

type stubStore struct {
	called      string
	params      []string
	publish     func(io.Reader) (registry.Version, error)
	panicList   bool
	packageFile *os.File
}

func (store *stubStore) List(string) ([]registry.Extension, error) {
	if store.panicList {
		panic("test panic")
	}
	store.called = "list"
	return []registry.Extension{}, nil
}

func (store *stubStore) GetExtension(namespace, name string) (registry.Extension, error) {
	store.called, store.params = "extension", []string{namespace, name}
	return registry.Extension{}, nil
}

func (store *stubStore) ListVersions(namespace, name string) ([]registry.Version, error) {
	store.called, store.params = "versions", []string{namespace, name}
	return []registry.Version{}, nil
}

func (store *stubStore) GetVersion(namespace, name, version string) (registry.Version, error) {
	store.called, store.params = "version", []string{namespace, name, version}
	return registry.Version{}, nil
}

func (store *stubStore) Publish(_ context.Context, namespace, name string, body io.Reader) (registry.Version, error) {
	store.called, store.params = "publish", []string{namespace, name}
	if store.publish != nil {
		return store.publish(body)
	}
	return registry.Version{}, nil
}

func (store *stubStore) OpenPackage(namespace, name, version string) (*os.File, registry.Version, error) {
	store.called, store.params = "package", []string{namespace, name, version}
	if store.packageFile == nil {
		return nil, registry.Version{}, registry.ErrNotFound
	}
	return store.packageFile, registry.Version{Artifact: registry.Artifact{Digest: "sha256:abc", SizeBytes: 7}}, nil
}

func (store *stubStore) SetYanked(namespace, name, version string, yanked bool) (registry.Version, error) {
	store.called, store.params = "restore", []string{namespace, name, version}
	if yanked {
		store.called = "yank"
	}
	return registry.Version{}, nil
}

func TestRoutesAndPathParameters(t *testing.T) {
	packageFile, err := os.CreateTemp(t.TempDir(), "package-*.alx")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := packageFile.WriteString("package"); err != nil {
		t.Fatal(err)
	}
	if _, err := packageFile.Seek(0, io.SeekStart); err != nil {
		t.Fatal(err)
	}

	tests := []struct {
		method      string
		path        string
		contentType string
		called      string
		params      []string
		status      int
	}{
		{http.MethodGet, "/v1/extensions", "", "list", nil, http.StatusOK},
		{http.MethodGet, "/v1/extensions/acme/tool", "", "extension", []string{"acme", "tool"}, http.StatusOK},
		{http.MethodGet, "/v1/extensions/acme/tool/versions", "", "versions", []string{"acme", "tool"}, http.StatusOK},
		{http.MethodPost, "/v1/extensions/acme/tool/versions", packageMediaType, "publish", []string{"acme", "tool"}, http.StatusCreated},
		{http.MethodGet, "/v1/extensions/acme/tool/versions/1.2.3", "", "version", []string{"acme", "tool", "1.2.3"}, http.StatusOK},
		{http.MethodGet, "/v1/extensions/acme/tool/versions/1.2.3/package", "", "package", []string{"acme", "tool", "1.2.3"}, http.StatusOK},
		{http.MethodPost, "/v1/extensions/acme/tool/versions/1.2.3/yank", "", "yank", []string{"acme", "tool", "1.2.3"}, http.StatusOK},
		{http.MethodDelete, "/v1/extensions/acme/tool/versions/1.2.3/yank", "", "restore", []string{"acme", "tool", "1.2.3"}, http.StatusOK},
	}

	for _, test := range tests {
		t.Run(test.method+" "+test.path, func(t *testing.T) {
			store := &stubStore{packageFile: packageFile}
			request := httptest.NewRequest(test.method, test.path, bytes.NewBufferString("body"))
			request.Header.Set("Content-Type", test.contentType)
			response := httptest.NewRecorder()

			NewRouter(Config{Store: store, AllowPublish: true}).ServeHTTP(response, request)

			if response.Code != test.status {
				t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
			}
			if store.called != test.called || strings.Join(store.params, "/") != strings.Join(test.params, "/") {
				t.Fatalf("call = %q %v, want %q %v", store.called, store.params, test.called, test.params)
			}
		})
	}
}

func TestStructuredRoutingErrors(t *testing.T) {
	for _, test := range []struct {
		method string
		path   string
		status int
		code   string
	}{
		{http.MethodGet, "/missing", http.StatusNotFound, "NOT_FOUND"},
		{http.MethodPatch, "/v1/extensions/acme/tool", http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED"},
	} {
		response := httptest.NewRecorder()
		NewRouter(Config{Store: &stubStore{}}).ServeHTTP(response, httptest.NewRequest(test.method, test.path, nil))

		if response.Code != test.status || !strings.Contains(response.Body.String(), `"code":"`+test.code+`"`) {
			t.Fatalf("%s %s: status = %d, body = %s", test.method, test.path, response.Code, response.Body.String())
		}
	}
}

func TestPublishValidationAndLimits(t *testing.T) {
	t.Run("content type", func(t *testing.T) {
		response := httptest.NewRecorder()
		request := httptest.NewRequest(http.MethodPost, "/v1/extensions/acme/tool/versions", strings.NewReader("body"))
		NewRouter(Config{Store: &stubStore{}, AllowPublish: true}).ServeHTTP(response, request)

		if response.Code != http.StatusUnsupportedMediaType {
			t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
		}
	})

	t.Run("body limit", func(t *testing.T) {
		store := &stubStore{publish: func(body io.Reader) (registry.Version, error) {
			_, err := io.ReadAll(body)
			return registry.Version{}, err
		}}
		request := httptest.NewRequest(http.MethodPost, "/v1/extensions/acme/tool/versions", strings.NewReader("too large"))
		request.Header.Set("Content-Type", packageMediaType)
		response := httptest.NewRecorder()
		NewRouter(Config{Store: store, AllowPublish: true, MaxPublishBytes: 2}).ServeHTTP(response, request)

		if response.Code != http.StatusRequestEntityTooLarge {
			t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
		}
	})

	t.Run("conflict", func(t *testing.T) {
		store := &stubStore{publish: func(io.Reader) (registry.Version, error) {
			return registry.Version{}, registry.ErrVersionExists
		}}
		request := httptest.NewRequest(http.MethodPost, "/v1/extensions/acme/tool/versions", strings.NewReader("body"))
		request.Header.Set("Content-Type", packageMediaType)
		response := httptest.NewRecorder()
		NewRouter(Config{Store: store, AllowPublish: true}).ServeHTTP(response, request)

		if response.Code != http.StatusConflict {
			t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
		}
	})
}

func TestRecoveryAndRequestID(t *testing.T) {
	response := httptest.NewRecorder()
	NewRouter(Config{Store: &stubStore{panicList: true}}).ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/v1/extensions", nil),
	)

	if response.Code != http.StatusInternalServerError || !strings.Contains(response.Body.String(), `"code":"INTERNAL"`) {
		t.Fatalf("status = %d, body = %s", response.Code, response.Body.String())
	}
	if response.Header().Get("X-Request-Id") == "" {
		t.Fatal("missing X-Request-Id")
	}
}

func TestDiscoveryAndPackageCacheHeaders(t *testing.T) {
	store := &stubStore{}
	discovery := httptest.NewRecorder()
	NewRouter(Config{Store: store, RegistryID: "local", DisplayName: "Local"}).ServeHTTP(
		discovery,
		httptest.NewRequest(http.MethodGet, "/.well-known/activelane-registry", nil),
	)
	if discovery.Code != http.StatusOK || strings.Contains(discovery.Body.String(), `"publish":true`) {
		t.Fatalf("unsafe discovery response: %s", discovery.Body.String())
	}

	packageFile, err := os.CreateTemp(t.TempDir(), "package-*.alx")
	if err != nil {
		t.Fatal(err)
	}
	if _, err := packageFile.WriteString("package"); err != nil {
		t.Fatal(err)
	}
	if _, err := packageFile.Seek(0, io.SeekStart); err != nil {
		t.Fatal(err)
	}
	store.packageFile = packageFile
	response := httptest.NewRecorder()
	NewRouter(Config{Store: store}).ServeHTTP(
		response,
		httptest.NewRequest(http.MethodGet, "/v1/extensions/acme/tool/versions/1.2.3/package", nil),
	)

	if response.Header().Get("ETag") != `"sha256:abc"` || !strings.Contains(response.Header().Get("Cache-Control"), "immutable") {
		t.Fatalf("cache headers = %q, %q", response.Header().Get("ETag"), response.Header().Get("Cache-Control"))
	}
}
