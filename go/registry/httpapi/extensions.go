package httpapi

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

const (
	defaultPageLimit = 50
	maximumPageLimit = 100
)

func (handlers handlers) searchExtensions(response http.ResponseWriter, request *http.Request) {
	items, err := handlers.config.Store.List(request.URL.Query().Get("search"))
	if err != nil {
		respond(response, nil, err)
		return
	}

	limit, ok := positiveQueryInt(response, request, "limit", defaultPageLimit, maximumPageLimit)
	if !ok {
		return
	}
	offset, ok := positiveQueryInt(response, request, "offset", 0, 0)
	if !ok {
		return
	}

	if offset > len(items) {
		offset = len(items)
	}
	end := min(offset+limit, len(items))

	writeJSON(response, http.StatusOK, map[string]any{
		"items":  items[offset:end],
		"total":  len(items),
		"offset": offset,
		"limit":  limit,
	})
}

func (handlers handlers) getExtension(response http.ResponseWriter, request *http.Request) {
	extension, err := handlers.config.Store.GetExtension(
		chi.URLParam(request, "namespace"),
		chi.URLParam(request, "name"),
	)
	respond(response, extension, err)
}

func positiveQueryInt(response http.ResponseWriter, request *http.Request, name string, fallback, maximum int) (int, bool) {
	raw := request.URL.Query().Get(name)
	if raw == "" {
		return fallback, true
	}

	value, err := strconv.Atoi(raw)
	if err != nil || value < 0 || (name == "limit" && value == 0) || (maximum > 0 && value > maximum) {
		message := name + " must be non-negative"
		if maximum > 0 {
			message = name + " must be between 1 and " + strconv.Itoa(maximum)
		}
		writeError(response, http.StatusBadRequest, "INVALID_ARGUMENT", message)
		return 0, false
	}

	return value, true
}
