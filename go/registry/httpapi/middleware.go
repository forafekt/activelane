package httpapi

import (
	"log/slog"
	"net/http"

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
