package httpapi

import (
	"log/slog"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5/middleware"
)

func exposeRequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("X-Request-Id", middleware.GetReqID(request.Context()))
		next.ServeHTTP(response, request)
	})
}

func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("X-Content-Type-Options", "nosniff")
		next.ServeHTTP(response, request)
	})
}

func localDevelopmentCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		origin := request.Header.Get("Origin")
		if strings.HasPrefix(origin, "http://127.0.0.1:") || strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "wails://") {
			response.Header().Set("Access-Control-Allow-Origin", origin)
			response.Header().Set("Vary", "Origin")
			response.Header().Set("Access-Control-Allow-Headers", "Content-Type")
			response.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		}
		if request.Method == http.MethodOptions {
			response.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(response, request)
	})
}

func recoverPanics(next http.Handler) http.Handler {
	return http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		defer func() {
			if recovered := recover(); recovered != nil {
				slog.ErrorContext(request.Context(), "registry HTTP handler panicked", "panic", recovered)
				writeError(response, http.StatusInternalServerError, "INTERNAL", "internal server error")
			}
		}()

		next.ServeHTTP(response, request)
	})
}
