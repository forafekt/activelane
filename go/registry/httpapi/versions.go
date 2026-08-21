package httpapi

import (
	"errors"
	"net/http"
	"strings"

	"github.com/activelane/activelane/go/registry"
	"github.com/go-chi/chi/v5"
)

const packageMediaType = "application/vnd.activelane.alx+zip"
const seedHeader = "X-ActiveLane-Seed"

func (handlers handlers) listVersions(response http.ResponseWriter, request *http.Request) {
	versions, err := handlers.config.Store.ListVersions(extensionParams(request))
	respond(response, versions, err)
}

func (handlers handlers) getVersion(response http.ResponseWriter, request *http.Request) {
	version, err := handlers.config.Store.GetVersion(versionParams(request))
	respond(response, version, err)
}

func (handlers handlers) publishVersion(response http.ResponseWriter, request *http.Request) {
	if !handlers.config.AllowPublish {
		writeError(response, http.StatusForbidden, "PUBLISH_DISABLED", "publishing is disabled; start the registry explicitly with --allow-publish for development")
		return
	}
	if mediaType := strings.TrimSpace(strings.Split(request.Header.Get("Content-Type"), ";")[0]); mediaType != packageMediaType {
		writeError(response, http.StatusUnsupportedMediaType, "INVALID_CONTENT_TYPE", "Content-Type must be "+packageMediaType)
		return
	}

	request.Body = http.MaxBytesReader(response, request.Body, handlers.config.MaxPublishBytes)
	namespace, name := extensionParams(request)
	if request.Header.Get(seedHeader) == "1" {
		store, ok := handlers.config.Store.(SeedStore)
		if !ok {
			writeError(response, http.StatusNotImplemented, "SEEDING_UNSUPPORTED", "registry store does not support development seeding")
			return
		}
		version, existing, err := store.PublishSeeded(request.Context(), namespace, name, request.Body)
		if errors.Is(err, registry.ErrVersionExists) {
			writeError(response, http.StatusConflict, "VERSION_EXISTS", "version exists and is not owned by the seeder")
			return
		}
		if err != nil {
			writeError(response, http.StatusBadRequest, "INVALID_PACKAGE", err.Error())
			return
		}
		status := http.StatusCreated
		if existing {
			status = http.StatusOK
		}
		writeJSON(response, status, version)
		return
	}
	version, err := handlers.config.Store.Publish(request.Context(), namespace, name, request.Body)
	if errors.Is(err, registry.ErrVersionExists) {
		writeError(response, http.StatusConflict, "VERSION_EXISTS", err.Error())
		return
	}
	if err != nil {
		status := http.StatusBadRequest
		code := "INVALID_PACKAGE"
		if strings.Contains(err.Error(), "request body too large") {
			status = http.StatusRequestEntityTooLarge
			code = "PACKAGE_TOO_LARGE"
		}
		writeError(response, status, code, err.Error())
		return
	}

	writeJSON(response, http.StatusCreated, version)
}

func (handlers handlers) cleanSeededExtensions(response http.ResponseWriter, request *http.Request) {
	if !handlers.config.AllowPublish {
		writeError(response, http.StatusForbidden, "PUBLISH_DISABLED", "development cleanup is disabled")
		return
	}
	store, ok := handlers.config.Store.(SeedStore)
	if !ok {
		writeError(response, http.StatusNotImplemented, "SEEDING_UNSUPPORTED", "registry store does not support development seeding")
		return
	}
	removed, err := store.CleanSeeded()
	if err != nil {
		writeError(response, http.StatusInternalServerError, "CLEAN_FAILED", err.Error())
		return
	}
	writeJSON(response, http.StatusOK, map[string]int{"removed": removed})
}

func (handlers handlers) yankVersion(response http.ResponseWriter, request *http.Request) {
	namespace, name, versionNumber := versionParams(request)
	version, err := handlers.config.Store.SetYanked(namespace, name, versionNumber, true)
	respond(response, version, err)
}

func (handlers handlers) restoreVersion(response http.ResponseWriter, request *http.Request) {
	namespace, name, versionNumber := versionParams(request)
	version, err := handlers.config.Store.SetYanked(namespace, name, versionNumber, false)
	respond(response, version, err)
}

func extensionParams(request *http.Request) (string, string) {
	return chi.URLParam(request, "namespace"), chi.URLParam(request, "name")
}

func versionParams(request *http.Request) (string, string, string) {
	namespace, name := extensionParams(request)
	return namespace, name, chi.URLParam(request, "version")
}
