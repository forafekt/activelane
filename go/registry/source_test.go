package registry

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"testing"

	"github.com/activelane/activelane/go/registryconfig"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (function roundTripFunc) RoundTrip(request *http.Request) (*http.Response, error) {
	return function(request)
}

func TestSourceClientSearchReadsEveryPage(t *testing.T) {
	all := make([]Extension, 250)
	for index := range all {
		all[index] = Extension{ID: "@local/item-" + strconv.Itoa(index)}
	}
	client := SourceClient{HTTP: &http.Client{Transport: roundTripFunc(func(request *http.Request) (*http.Response, error) {
		query, _ := url.ParseQuery(request.URL.RawQuery)
		offset, _ := strconv.Atoi(query.Get("offset"))
		limit, _ := strconv.Atoi(query.Get("limit"))
		end := min(offset+limit, len(all))
		body, _ := json.Marshal(map[string]any{"items": all[offset:end], "total": len(all), "offset": offset, "limit": limit})
		return &http.Response{StatusCode: http.StatusOK, Body: io.NopCloser(strings.NewReader(string(body))), Header: make(http.Header)}, nil
	})}}
	items, err := client.Search(context.Background(), registryconfig.Registry{Type: "remote", URL: "http://registry.test"}, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(items) != 250 {
		t.Fatalf("got %d extensions", len(items))
	}
}
