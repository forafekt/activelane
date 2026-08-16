package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/activelane/activelane/go/registry"
	"github.com/activelane/activelane/go/registry/httpapi"
)

const (
	defaultListenAddress     = "127.0.0.1:8787"
	defaultDataDirectory     = "./registry-data"
	defaultRegistryID        = "local.activelane"
	defaultDisplayName       = "Local ActiveLane Registry"
	defaultReadHeaderTimeout = 5 * time.Second
	defaultReadTimeout       = 30 * time.Second
	defaultWriteTimeout      = 5 * time.Minute
	defaultIdleTimeout       = 60 * time.Second
	defaultShutdownTimeout   = 10 * time.Second
)

func main() {
	var address, dataDirectory, registryID, displayName string
	var allowPublish bool
	var maxPublishBytes int64

	flag.StringVar(&address, "listen", defaultListenAddress, "listen address (loopback by default)")
	flag.StringVar(&dataDirectory, "data", defaultDataDirectory, "registry data directory")
	flag.StringVar(&registryID, "id", defaultRegistryID, "stable registry ID")
	flag.StringVar(&displayName, "display-name", defaultDisplayName, "human-readable registry name")
	flag.BoolVar(&allowPublish, "allow-publish", false, "enable unauthenticated development publishing")
	flag.Int64Var(&maxPublishBytes, "max-publish-bytes", httpapi.DefaultMaxPublishBytes, "maximum request body size for package publication")
	flag.Parse()

	store, err := registry.NewStore(dataDirectory)
	if err != nil {
		log.Fatal(err)
	}

	handler := httpapi.NewRouter(httpapi.Config{
		Store:           store,
		RegistryID:      registryID,
		DisplayName:     displayName,
		AllowPublish:    allowPublish,
		MaxPublishBytes: maxPublishBytes,
	})
	server := &http.Server{
		Addr:              address,
		Handler:           handler,
		ReadHeaderTimeout: defaultReadHeaderTimeout,
		ReadTimeout:       defaultReadTimeout,
		WriteTimeout:      defaultWriteTimeout,
		IdleTimeout:       defaultIdleTimeout,
	}
	listener, err := net.Listen("tcp", address)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Fprintf(os.Stderr, "ActiveLane registry %s listening on http://%s (publishing=%t)\n", registryID, address, allowPublish)
	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)
	go func() {
		<-done
		ctx, cancel := context.WithTimeout(context.Background(), defaultShutdownTimeout)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("registry shutdown: %v", err)
		}
	}()

	if err = server.Serve(listener); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
