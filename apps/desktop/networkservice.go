package main

import (
	"context"
	"io"
	"net/http"
	"strings"
	"time"
)

const maxNetworkResponseBytes = 16 << 20

type NetworkRequest struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

type NetworkResponse struct {
	Status     int                 `json:"status"`
	StatusText string              `json:"statusText"`
	DurationMs int64               `json:"durationMs"`
	SizeBytes  int                 `json:"sizeBytes"`
	Headers    map[string][]string `json:"headers"`
	Body       string              `json:"body"`
	Error      *DesktopError       `json:"error,omitempty"`
}

type NetworkService struct {
	client *http.Client
}

func NewNetworkService() *NetworkService {
	return &NetworkService{client: &http.Client{Timeout: 60 * time.Second}}
}

func (service *NetworkService) Request(ctx context.Context, input NetworkRequest) NetworkResponse {
	started := time.Now()
	request, err := http.NewRequestWithContext(ctx, input.Method, input.URL, strings.NewReader(input.Body))
	if err != nil {
		return NetworkResponse{Error: desktopError("NETWORK_REQUEST_INVALID", "The HTTP request is invalid.", err)}
	}
	for key, value := range input.Headers {
		request.Header.Set(key, value)
	}
	response, err := service.client.Do(request)
	if err != nil {
		return NetworkResponse{DurationMs: time.Since(started).Milliseconds(), Error: desktopError("NETWORK_REQUEST_FAILED", "The HTTP request failed.", err)}
	}
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, maxNetworkResponseBytes+1))
	if err != nil {
		return NetworkResponse{DurationMs: time.Since(started).Milliseconds(), Error: desktopError("NETWORK_RESPONSE_FAILED", "The HTTP response could not be read.", err)}
	}
	if len(body) > maxNetworkResponseBytes {
		return NetworkResponse{DurationMs: time.Since(started).Milliseconds(), Error: desktopError("NETWORK_RESPONSE_TOO_LARGE", "The HTTP response exceeds the 16 MiB safety limit.", nil)}
	}
	return NetworkResponse{
		Status: response.StatusCode, StatusText: http.StatusText(response.StatusCode),
		DurationMs: time.Since(started).Milliseconds(), SizeBytes: len(body),
		Headers: response.Header, Body: string(body),
	}
}
