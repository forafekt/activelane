package registry

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/registryconfig"
)

// Publisher is the reusable production publication client used by the CLI and seeder.
type Publisher struct{ Client *http.Client }

func (p Publisher) CheckSeedSupport(ctx context.Context, target registryconfig.Registry) error {
	if target.Type == "directory" {
		return nil
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, strings.TrimRight(target.URL, "/")+"/.well-known/activelane-registry", nil)
	if err != nil {
		return err
	}
	client := p.Client
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("registry discovery failed: %s", resp.Status)
	}
	var discovery struct {
		Capabilities map[string]bool `json:"capabilities"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&discovery); err != nil {
		return err
	}
	if !discovery.Capabilities["developmentSeeding"] {
		return fmt.Errorf("registry does not support development seeding; restart it with the updated registry server and --allow-publish")
	}
	return nil
}

func (p Publisher) CleanSeeded(ctx context.Context, target registryconfig.Registry) (int, error) {
	if target.Type == "directory" {
		path, err := registryconfig.ExpandPath(target.Path)
		if err != nil {
			return 0, err
		}
		store, err := NewStore(path)
		if err != nil {
			return 0, err
		}
		return store.CleanSeeded()
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, strings.TrimRight(target.URL, "/")+"/v1/development/seeded-extensions", nil)
	if err != nil {
		return 0, err
	}
	client := p.Client
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return 0, fmt.Errorf("clean failed: %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	var result struct {
		Removed int `json:"removed"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, err
	}
	return result.Removed, nil
}

func (p Publisher) PublishFile(ctx context.Context, config registryconfig.Config, registryID, filename string) (Version, error) {
	version, _, err := p.publishFile(ctx, config, registryID, filename, false)
	return version, err
}

func (p Publisher) PublishSeedFile(ctx context.Context, config registryconfig.Config, registryID, filename string) (Version, bool, error) {
	return p.publishFile(ctx, config, registryID, filename, true)
}

func (p Publisher) publishFile(ctx context.Context, config registryconfig.Config, registryID, filename string, seeded bool) (Version, bool, error) {
	inspection, err := alx.VerifyFile(filename)
	if err != nil {
		return Version{}, false, err
	}
	var target registryconfig.Registry
	for _, candidate := range config.Registries {
		if candidate.ID == registryID {
			target = candidate
			break
		}
	}
	if target.ID == "" {
		return Version{}, false, fmt.Errorf("registry %q not found", registryID)
	}
	owner, err := config.Resolve(inspection.Manifest.Publisher)
	if err != nil {
		return Version{}, false, fmt.Errorf("cannot publish %s: %w", inspection.Manifest.ID, err)
	}
	if owner.ID != target.ID {
		return Version{}, false, fmt.Errorf("cannot publish %s to registry %q: namespace %q is routed to registry %q", inspection.Manifest.ID, target.ID, inspection.Manifest.Publisher, owner.ID)
	}
	f, err := os.Open(filename)
	if err != nil {
		return Version{}, false, err
	}
	defer f.Close()
	if target.Type == "directory" {
		path, err := registryconfig.ExpandPath(target.Path)
		if err != nil {
			return Version{}, false, err
		}
		store, err := NewStore(path)
		if err != nil {
			return Version{}, false, err
		}
		if seeded {
			return store.PublishSeeded(ctx, inspection.Manifest.Publisher, inspection.Manifest.Name, f)
		}
		version, err := store.Publish(ctx, inspection.Manifest.Publisher, inspection.Manifest.Name, f)
		return version, false, err
	}
	url := strings.TrimRight(target.URL, "/") + fmt.Sprintf("/v1/extensions/%s/%s/versions", inspection.Manifest.Publisher, inspection.Manifest.Name)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, f)
	if err != nil {
		return Version{}, false, err
	}
	req.Header.Set("Content-Type", "application/vnd.activelane.alx+zip")
	if seeded {
		req.Header.Set("X-ActiveLane-Seed", "1")
	}
	client := p.Client
	if client == nil {
		client = http.DefaultClient
	}
	resp, err := client.Do(req)
	if err != nil {
		return Version{}, false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated && !(seeded && resp.StatusCode == http.StatusOK) {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		if resp.StatusCode == http.StatusConflict {
			return Version{}, false, ErrVersionExists
		}
		return Version{}, false, fmt.Errorf("publish failed: %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	var version Version
	if err := json.NewDecoder(resp.Body).Decode(&version); err != nil {
		return Version{}, false, err
	}
	return version, resp.StatusCode == http.StatusOK, nil
}
