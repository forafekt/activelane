package devextensions

import (
	"encoding/json"
	"fmt"
	"net"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/activelane/activelane/go/alx"
)

const ChangedEvent = "activelane:development-extensions-changed"

type ProjectConfig struct {
	Runtime string            `json:"runtime"`
	Views   map[string]string `json:"views"`
	Command []string          `json:"command,omitempty"`
}

type Registration struct {
	SessionID   string            `json:"sessionId"`
	ProjectRoot string            `json:"projectRoot"`
	Manifest    alx.Manifest      `json:"manifest"`
	RuntimePath string            `json:"runtimePath"`
	AssetURLs   map[string]string `json:"assetUrls"`
	Generation  int               `json:"generation"`
}

type Message struct {
	Type         string        `json:"type"`
	Registration *Registration `json:"registration,omitempty"`
}

type Response struct {
	OK      bool   `json:"ok"`
	Message string `json:"message,omitempty"`
}

func SocketPath() (string, error) {
	if configured := os.Getenv("ACTIVELANE_DEV_SOCKET"); configured != "" {
		if !filepath.IsAbs(configured) {
			return "", fmt.Errorf("ACTIVELANE_DEV_SOCKET must be absolute")
		}
		return configured, nil
	}
	if runtime.GOOS == "windows" {
		return `\\.\pipe\activelane-extension-dev`, nil
	}
	directory := os.Getenv("XDG_RUNTIME_DIR")
	if directory == "" {
		config, err := os.UserConfigDir()
		if err != nil {
			return "", fmt.Errorf("resolve user configuration directory: %w", err)
		}
		directory = filepath.Join(config, "activelane", "runtime")
	}
	return filepath.Join(directory, "extension-dev.sock"), nil
}

func ValidateRegistration(registration Registration) error {
	if registration.SessionID == "" || registration.Generation < 1 {
		return fmt.Errorf("session ID and positive generation are required")
	}
	if !filepath.IsAbs(registration.ProjectRoot) {
		return fmt.Errorf("project root must be absolute")
	}
	if err := registration.Manifest.Validate(); err != nil {
		return err
	}
	if !filepath.IsAbs(registration.RuntimePath) {
		return fmt.Errorf("runtime path must be absolute")
	}
	if filepath.Ext(registration.RuntimePath) != ".js" && filepath.Ext(registration.RuntimePath) != ".mjs" {
		return fmt.Errorf("runtime path must be a bundled JavaScript module")
	}
	for entry, value := range registration.AssetURLs {
		if !contains(registration.Manifest.ViewEntries(), entry) {
			return fmt.Errorf("asset mapping references undeclared view entry %q", entry)
		}
		if err := validateLoopbackURL(value); err != nil {
			return fmt.Errorf("asset %q: %w", entry, err)
		}
	}
	for _, entry := range registration.Manifest.ViewEntries() {
		if registration.AssetURLs[entry] == "" {
			return fmt.Errorf("view entry %q has no development URL", entry)
		}
	}
	return nil
}

func validateLoopbackURL(value string) error {
	parsed, err := url.Parse(value)
	if err != nil || parsed.Scheme != "http" || parsed.Hostname() == "" {
		return fmt.Errorf("must be an HTTP URL")
	}
	ip := net.ParseIP(parsed.Hostname())
	if parsed.Hostname() != "localhost" && (ip == nil || !ip.IsLoopback()) {
		return fmt.Errorf("must use a loopback host")
	}
	if parsed.User != nil || parsed.Fragment != "" {
		return fmt.Errorf("credentials and fragments are not allowed")
	}
	return nil
}

func LoadProject(root string) (alx.Manifest, ProjectConfig, error) {
	manifestBytes, err := os.ReadFile(filepath.Join(root, alx.ManifestFile))
	if err != nil {
		return alx.Manifest{}, ProjectConfig{}, err
	}
	manifest, err := alx.ParseManifest(manifestBytes)
	if err != nil {
		return alx.Manifest{}, ProjectConfig{}, err
	}
	data, err := os.ReadFile(filepath.Join(root, "activelane.dev.json"))
	if err != nil {
		return alx.Manifest{}, ProjectConfig{}, fmt.Errorf("read activelane.dev.json: %w", err)
	}
	var config ProjectConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return alx.Manifest{}, ProjectConfig{}, fmt.Errorf("parse activelane.dev.json: %w", err)
	}
	if config.Runtime == "" {
		return alx.Manifest{}, ProjectConfig{}, fmt.Errorf("development runtime entry is required")
	}
	return manifest, config, nil
}

func DevelopmentURL(base, source string) string {
	return strings.TrimSuffix(base, "/") + "/" + strings.TrimPrefix(filepath.ToSlash(source), "src/")
}

func contains(values []string, expected string) bool {
	for _, value := range values {
		if value == expected {
			return true
		}
	}
	return false
}
