// Package httpapi exposes the registry protocol as a standard HTTP handler.
package httpapi

import (
	"context"
	"io"
	"net/http"
	"os"

	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/registry"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
)

const DefaultMaxPublishBytes int64 = alx.MaxPackageBytes

type Store interface {
	List(search string) ([]registry.Extension, error)
	GetExtension(namespace, name string) (registry.Extension, error)
	ListVersions(namespace, name string) ([]registry.Version, error)
	GetVersion(namespace, name, version string) (registry.Version, error)
	Publish(ctx context.Context, namespace, name string, body io.Reader) (registry.Version, error)
	OpenPackage(namespace, name, version string) (*os.File, registry.Version, error)
	SetYanked(namespace, name, version string, yanked bool) (registry.Version, error)
}

type Config struct {
	Store           Store
	RegistryID      string
	DisplayName     string
	AllowPublish    bool
	MaxPublishBytes int64
}

type handlers struct {
	config Config
}

func NewRouter(config Config) http.Handler {
	if config.MaxPublishBytes <= 0 {
		config.MaxPublishBytes = DefaultMaxPublishBytes
	}

	handlers := handlers{config: config}
	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(exposeRequestID)
	router.Use(recoverPanics)
	router.Use(securityHeaders)
	router.NotFound(notFound)
	router.MethodNotAllowed(methodNotAllowed)

	router.Get("/healthz", handlers.health)
	router.Get("/.well-known/activelane-registry", handlers.discovery)

	router.Route("/v1/extensions", func(router chi.Router) {
		router.Get("/", handlers.searchExtensions)
		router.Get("/{namespace}/{name}", handlers.getExtension)
		router.Get("/{namespace}/{name}/versions", handlers.listVersions)
		router.Post("/{namespace}/{name}/versions", handlers.publishVersion)
		router.Get("/{namespace}/{name}/versions/{version}", handlers.getVersion)
		router.Get("/{namespace}/{name}/versions/{version}/package", handlers.downloadPackage)
		router.Post("/{namespace}/{name}/versions/{version}/yank", handlers.yankVersion)
		router.Delete("/{namespace}/{name}/versions/{version}/yank", handlers.restoreVersion)
	})

	return router
}
