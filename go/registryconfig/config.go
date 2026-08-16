package registryconfig

import (
	"encoding/json"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const Version = 1

type Config struct {
	Version    int        `json:"version"`
	Registries []Registry `json:"registries"`
}

type Registry struct {
	ID       string   `json:"id"`
	Type     string   `json:"type"`
	URL      string   `json:"url,omitempty"`
	Path     string   `json:"path,omitempty"`
	Enabled  bool     `json:"enabled"`
	Priority int      `json:"priority"`
	Scopes   []string `json:"scopes"`
}

func DefaultPath() string {

	if p := os.Getenv("ACTIVELANE_REGISTRY_CONFIG"); p != "" {
		return p
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "activelane", "registries.json")
}

func Load(filename string) (Config, error) {
	data, e := os.ReadFile(filename)

	if e != nil {
		return Config{}, e
	}
	var c Config

	if e = json.Unmarshal(data, &c); e != nil {
		return Config{}, fmt.Errorf("parse registry config: %w", e)
	}

	if e = c.Validate(); e != nil {
		return Config{}, e
	}
	return c, nil
}

func Save(filename string, c Config) error {

	if e := c.Validate(); e != nil {
		return e
	}
	data, e := json.MarshalIndent(c, "", "  ")

	if e != nil {
		return e
	}
	data = append(data, '\n')

	if e = os.MkdirAll(filepath.Dir(filename), 0700); e != nil {
		return e
	}
	tmp, e := os.CreateTemp(filepath.Dir(filename), ".registries-*.tmp")

	if e != nil {
		return e
	}
	name := tmp.Name()
	defer os.Remove(name)

	if e = tmp.Chmod(0600); e != nil {
		tmp.Close()
		return e
	}

	if _, e = tmp.Write(data); e != nil {
		tmp.Close()
		return e
	}

	if e = tmp.Sync(); e != nil {
		tmp.Close()
		return e
	}

	if e = tmp.Close(); e != nil {
		return e
	}
	return os.Rename(name, filename)
}

func (c Config) Validate() error {

	if c.Version != Version {
		return fmt.Errorf("version: must be %d", Version)
	}
	ids := map[string]bool{}
	scopes := map[string]string{}
	for i, r := range c.Registries {
		p := fmt.Sprintf("registries[%d]", i)
		if r.ID == "" {
			return fmt.Errorf("%s.id: must be non-empty", p)
		}
		if ids[r.ID] {
			return fmt.Errorf("%s.id: duplicate id %q", p, r.ID)
		}
		ids[r.ID] = true
		if r.Type != "remote" && r.Type != "directory" {
			return fmt.Errorf("%s.type: must be remote or directory", p)
		}
		if r.Type == "remote" && r.URL == "" {
			return fmt.Errorf("%s.url: required for remote registry", p)
		}
		if r.Type == "remote" {
			parsed, err := url.Parse(r.URL)
			if err != nil || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Host == "" || parsed.User != nil {
				return fmt.Errorf("%s.url: must be an http(s) URL without embedded credentials", p)
			}
		}
		if r.Type == "directory" && r.Path == "" {
			return fmt.Errorf("%s.path: required for directory registry", p)
		}
		if len(r.Scopes) == 0 {
			return fmt.Errorf("%s.scopes: must be non-empty", p)
		}
		if !r.Enabled {
			continue
		}

		for j, s := range r.Scopes {
			if s == "" || strings.Contains(s, "/") {
				return fmt.Errorf("%s.scopes[%d]: invalid namespace", p, j)
			}
			if owner, ok := scopes[s]; ok {
				return fmt.Errorf("%s.scopes[%d]: namespace %q already routed to %q", p, j, s, owner)
			}
			scopes[s] = r.ID
		}
	}
	return nil
}

func (c Config) Resolve(namespace string) (Registry, error) {
	var matches []Registry
	for _, r := range c.Registries {
		if !r.Enabled {
			continue
		}

		for _, s := range r.Scopes {
			if s == namespace {
				matches = append(matches, r)
			}
		}
	}

	if len(matches) == 0 {
		return Registry{}, fmt.Errorf("no enabled registry owns namespace %q", namespace)
	}

	if len(matches) > 1 {
		return Registry{}, fmt.Errorf("namespace %q has ambiguous registry routes", namespace)
	}
	return matches[0], nil
}

func (c *Config) Sort() {
	sort.SliceStable(c.Registries, func(i, j int) bool {
		if c.Registries[i].Priority == c.Registries[j].Priority {
			return c.Registries[i].ID < c.Registries[j].ID
		}
		return c.Registries[i].Priority > c.Registries[j].Priority
	})
}

func ExpandPath(p string) (string, error) {

	if p == "~" || strings.HasPrefix(p, "~/") {
		home, e := os.UserHomeDir()
		if e != nil {
			return "", e
		}
		if p == "~" {
			return home, nil
		}
		return filepath.Join(home, p[2:]), nil
	}

	if strings.Contains(p, "~") {
		return "", fmt.Errorf("path: ~ is only supported as the first segment")
	}
	return filepath.Clean(p), nil
}
