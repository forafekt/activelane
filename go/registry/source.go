package registry

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/activelane/activelane/go/registryconfig"
)

type Discovery struct {
	ProtocolVersion string          `json:"protocolVersion"`
	RegistryID      string          `json:"registryId"`
	DisplayName     string          `json:"displayName"`
	Capabilities    map[string]bool `json:"capabilities"`
}

type SourceClient struct{ HTTP *http.Client }

const DefaultHTTPTimeout = 30 * time.Second

func (client SourceClient) httpClient() *http.Client {
	if client.HTTP != nil {
		return client.HTTP
	}
	return &http.Client{Timeout: DefaultHTTPTimeout}
}

func (client SourceClient) Discover(ctx context.Context, source registryconfig.Registry) (Discovery, error) {
	if source.Type == "directory" {
		path, err := registryconfig.ExpandPath(source.Path)
		if err != nil {
			return Discovery{}, err
		}
		if _, err := NewStore(path); err != nil {
			return Discovery{}, err
		}
		return Discovery{ProtocolVersion: "1", RegistryID: source.ID, DisplayName: source.ID, Capabilities: map[string]bool{"search": true, "publish": true}}, nil
	}
	var result Discovery
	if err := client.getJSON(ctx, strings.TrimRight(source.URL, "/")+"/.well-known/activelane-registry", &result); err != nil {
		return Discovery{}, err
	}
	return result, nil
}

func (client SourceClient) Search(ctx context.Context, source registryconfig.Registry, query string) ([]Extension, error) {
	if source.Type == "directory" {
		path, err := registryconfig.ExpandPath(source.Path)
		if err != nil {
			return nil, err
		}
		store, err := NewStore(path)
		if err != nil {
			return nil, err
		}
		return store.List(query)
	}
	const pageSize = 100
	var items []Extension
	for offset := 0; ; offset += pageSize {
		var result struct {
			Items []Extension `json:"items"`
			Total int         `json:"total"`
		}
		endpoint := strings.TrimRight(source.URL, "/") + "/v1/extensions?search=" + url.QueryEscape(query) + "&limit=100&offset=" + fmt.Sprint(offset)
		if err := client.getJSON(ctx, endpoint, &result); err != nil {
			return nil, err
		}
		items = append(items, result.Items...)
		if len(items) >= result.Total || len(result.Items) == 0 {
			return items, nil
		}
	}
}

func (client SourceClient) GetExtension(ctx context.Context, source registryconfig.Registry, namespace, name string) (Extension, error) {
	if source.Type == "directory" {
		path, err := registryconfig.ExpandPath(source.Path)
		if err != nil {
			return Extension{}, err
		}
		store, err := NewStore(path)
		if err != nil {
			return Extension{}, err
		}
		return store.GetExtension(namespace, name)
	}
	var result Extension
	err := client.getJSON(ctx, strings.TrimRight(source.URL, "/")+fmt.Sprintf("/v1/extensions/%s/%s", namespace, name), &result)
	return result, err
}

func (client SourceClient) GetVersion(ctx context.Context, source registryconfig.Registry, namespace, name, version string) (Version, error) {
	if source.Type == "directory" {
		path, err := registryconfig.ExpandPath(source.Path)
		if err != nil {
			return Version{}, err
		}
		store, err := NewStore(path)
		if err != nil {
			return Version{}, err
		}
		return store.GetVersion(namespace, name, version)
	}
	var result Version
	err := client.getJSON(ctx, strings.TrimRight(source.URL, "/")+fmt.Sprintf("/v1/extensions/%s/%s/versions/%s", namespace, name, version), &result)
	return result, err
}

func (client SourceClient) getJSON(ctx context.Context, endpoint string, output any) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	response, err := client.httpClient().Do(req)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return fmt.Errorf("registry returned %s", response.Status)
	}
	return json.NewDecoder(response.Body).Decode(output)
}
