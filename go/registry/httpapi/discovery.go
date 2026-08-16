package httpapi

import "net/http"

func (handlers handlers) health(response http.ResponseWriter, _ *http.Request) {
	writeJSON(response, http.StatusOK, map[string]string{"status": "ok"})
}

func (handlers handlers) discovery(response http.ResponseWriter, _ *http.Request) {
	writeJSON(response, http.StatusOK, map[string]any{
		"protocolVersion": "1",
		"registryId":      handlers.config.RegistryID,
		"displayName":     handlers.config.DisplayName,
		"capabilities": map[string]bool{
			"search":         true,
			"publish":        handlers.config.AllowPublish,
			"signatures":     false,
			"offlineBundles": false,
			"commerce":       false,
		},
	})
}
