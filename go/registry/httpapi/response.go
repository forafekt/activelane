package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/activelane/activelane/go/registry"
)

type apiError struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func respond(response http.ResponseWriter, value any, err error) {
	if errors.Is(err, registry.ErrNotFound) {
		writeError(response, http.StatusNotFound, "NOT_FOUND", err.Error())
		return
	}
	if err != nil {
		writeError(response, http.StatusInternalServerError, "INTERNAL", "internal server error")
		return
	}

	writeJSON(response, http.StatusOK, value)
}

func notFound(response http.ResponseWriter, _ *http.Request) {
	writeError(response, http.StatusNotFound, "NOT_FOUND", "route not found")
}

func methodNotAllowed(response http.ResponseWriter, _ *http.Request) {
	writeError(response, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
}

func writeError(response http.ResponseWriter, status int, code, message string) {
	var body apiError
	body.Error.Code = code
	body.Error.Message = message
	writeJSON(response, status, body)
}

func writeJSON(response http.ResponseWriter, status int, value any) {
	response.Header().Set("Content-Type", "application/json")
	response.WriteHeader(status)
	_ = json.NewEncoder(response).Encode(value)
}
