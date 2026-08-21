// Package httpapi exposes the registry protocol as a standard HTTP handler.
package httpapi

import (
	"context"
	"io"
	"net/http"
	"os"
	"time"

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

type SubscriptionStore interface {
	Plans(namespace, name string) ([]alx.SubscriptionPlan, error)
	GetSubscription(accountID, extensionID string) (registry.Subscription, error)
	SaveSubscription(subscription registry.Subscription) error
	ResolveEntitlements(accountID, namespace, name string) (registry.EntitlementResolution, error)
}

type SeedStore interface {
	PublishSeeded(ctx context.Context, namespace, name string, body io.Reader) (registry.Version, bool, error)
	CleanSeeded() (int, error)
}

type Config struct {
	Store                Store
	RegistryID           string
	DisplayName          string
	AllowPublish         bool
	MaxPublishBytes      int64
	SubscriptionProvider registry.SubscriptionProvider
	SubscriptionStore    SubscriptionStore
	Now                  func() time.Time
}

type handlers struct {
	config Config
}

func NewRouter(config Config) http.Handler {
	if config.MaxPublishBytes <= 0 {
		config.MaxPublishBytes = DefaultMaxPublishBytes
	}
	if config.SubscriptionStore == nil {
		config.SubscriptionStore, _ = config.Store.(SubscriptionStore)
	}

	handlers := handlers{config: config}
	router := chi.NewRouter()
	router.Use(middleware.RequestID)
	router.Use(exposeRequestID)
	router.Use(recoverPanics)
	router.Use(securityHeaders)
	router.Use(localDevelopmentCORS)
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
		router.Get("/{namespace}/{name}/plans", handlers.listPlans)
	})
	router.Delete("/v1/development/seeded-extensions", handlers.cleanSeededExtensions)

	router.Route("/v1/accounts/{accountId}/extensions/{namespace}/{name}", func(router chi.Router) {
		router.Get("/subscription", handlers.getSubscription)
		router.Post("/subscription", handlers.subscribe)
		router.Put("/subscription/plan", handlers.changePlan)
		router.Post("/subscription/cancel", handlers.cancelSubscription)
		router.Post("/subscription/resume", handlers.resumeSubscription)
		router.Get("/entitlements", handlers.resolveEntitlements)
	})

	return router
}
