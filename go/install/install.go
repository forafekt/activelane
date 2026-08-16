package install

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/activelane/activelane/go/alx"
	reg "github.com/activelane/activelane/go/registry"
	"github.com/activelane/activelane/go/registryconfig"
)

type Record struct {
	SchemaVersion  int    `json:"schemaVersion"`
	RegistryID     string `json:"registryId"`
	RegistrySource string `json:"registrySource"`
	Namespace      string `json:"namespace"`
	Name           string `json:"name"`
	Version        string `json:"version"`
	ManifestDigest string `json:"manifestDigest"`
	PackageDigest  string `json:"packageDigest"`
	InstalledAt    string `json:"installedAt"`
	Enabled        bool   `json:"enabled"`
	InstallPath    string `json:"installPath"`
}

type Installer struct {
	Root   string
	Client *http.Client
	Now    func() time.Time
}

func DefaultRoot() string {
	if p := os.Getenv("ACTIVELANE_EXTENSIONS_DIR"); p != "" {
		return p
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".local", "share", "activelane", "extensions")
}

func ParseSpec(spec string) (namespace, name, version string, err error) {
	at := strings.LastIndex(spec, "@")
	if at <= 0 || at == len(spec)-1 {
		return "", "", "", fmt.Errorf("extension must be exact namespace/name@version")
	}
	id := strings.TrimPrefix(spec[:at], "@")
	parts := strings.Split(id, "/")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", "", fmt.Errorf("extension must be exact namespace/name@version")
	}
	return parts[0], parts[1], spec[at+1:], nil
}

func (i Installer) Install(ctx context.Context, c registryconfig.Config, spec string) (Record, error) {
	return i.InstallFromRegistry(ctx, c, spec, "")
}

// InstallFromRegistry preserves source identity selected by discovery. Resolution remains
// namespace-authoritative: a supplied registry ID must equal the configured owner.
func (i Installer) InstallFromRegistry(ctx context.Context, c registryconfig.Config, spec, registryID string) (Record, error) {
	ns, name, version, err := ParseSpec(spec)
	if err != nil {
		return Record{}, err
	}
	route, err := c.Resolve(ns)
	if err != nil {
		return Record{}, err
	}
	if registryID != "" && route.ID != registryID {
		return Record{}, &Error{Code: "REGISTRY_SCOPE_AMBIGUOUS", Message: fmt.Sprintf("Namespace %q is routed to registry %q, not selected registry %q.", ns, route.ID, registryID)}
	}
	tmpDir, err := os.MkdirTemp(filepath.Dir(i.Root), ".activelane-install-*")
	if err != nil {
		if os.IsNotExist(err) {
			if e := os.MkdirAll(filepath.Dir(i.Root), 0755); e != nil {
				return Record{}, e
			}
			tmpDir, err = os.MkdirTemp(filepath.Dir(i.Root), ".activelane-install-*")
		}
		if err != nil {
			return Record{}, err
		}
	}
	defer os.RemoveAll(tmpDir)
	pkg := filepath.Join(tmpDir, "package.alx")
	meta, source, err := i.fetch(ctx, route, ns, name, version, pkg)
	if err != nil {
		return Record{}, err
	}
	inspection, err := alx.InspectFile(pkg)
	if err != nil {
		return Record{}, err
	}
	if inspection.Digest != meta.Artifact.Digest {
		return Record{}, fmt.Errorf("package digest mismatch: expected %s, got %s", meta.Artifact.Digest, inspection.Digest)
	}
	if inspection.Manifest.Publisher != ns || inspection.Manifest.Name != name || inspection.Manifest.Version != version {
		return Record{}, fmt.Errorf("downloaded package identity does not match requested extension")
	}
	staged := filepath.Join(tmpDir, "extension")
	if err = os.Mkdir(staged, 0755); err != nil {
		return Record{}, err
	}
	if _, err = alx.ExtractFile(pkg, staged); err != nil {
		return Record{}, err
	}
	dest := filepath.Join(i.Root, ns, name, version)
	if _, err = os.Stat(dest); err == nil {
		record, readErr := ReadRecord(filepath.Join(i.Root, "installed.json"), ns, name)
		if readErr == nil && record.PackageDigest == inspection.Digest {
			return record, nil
		}
		return Record{}, fmt.Errorf("install destination already exists: %s", dest)
	} else if !errors.Is(err, os.ErrNotExist) {
		return Record{}, err
	}
	if err = os.MkdirAll(filepath.Dir(dest), 0755); err != nil {
		return Record{}, err
	}
	if err = os.Rename(staged, dest); err != nil {
		return Record{}, err
	}
	now := time.Now
	if i.Now != nil {
		now = i.Now
	}
	record := Record{SchemaVersion: 1, RegistryID: route.ID, RegistrySource: source, Namespace: ns, Name: name, Version: version, ManifestDigest: meta.ManifestDigest, PackageDigest: inspection.Digest, InstalledAt: now().UTC().Format(time.RFC3339Nano), Enabled: false, InstallPath: dest}
	if err = UpdateRecord(filepath.Join(i.Root, RecordsFile), record); err != nil {
		os.RemoveAll(dest)
		return Record{}, err
	}
	return record, nil
}

func (i Installer) fetch(ctx context.Context, r registryconfig.Registry, ns, name, version, dest string) (reg.Version, string, error) {
	if r.Type == "directory" {
		p, err := registryconfig.ExpandPath(r.Path)
		if err != nil {
			return reg.Version{}, "", err
		}
		store, err := reg.NewStore(p)
		if err != nil {
			return reg.Version{}, "", err
		}
		f, v, err := store.OpenPackage(ns, name, version)
		if err != nil {
			return reg.Version{}, "", err
		}
		defer f.Close()
		if v.Status == "yanked" {
			return reg.Version{}, "", fmt.Errorf("version is yanked")
		}
		return v, p, copyTo(dest, f)
	}
	base := strings.TrimRight(r.URL, "/")
	client := i.Client
	if client == nil {
		client = &http.Client{Timeout: 5 * time.Minute}
	}
	var meta reg.Version
	if err := getJSON(ctx, client, base+fmt.Sprintf("/v1/extensions/%s/%s/versions/%s", ns, name, version), &meta); err != nil {
		return reg.Version{}, "", err
	}
	if meta.Status == "yanked" {
		return reg.Version{}, "", fmt.Errorf("version is yanked")
	}
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, base+meta.Artifact.DownloadURL, nil)
	resp, err := client.Do(req)
	if err != nil {
		return reg.Version{}, "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return reg.Version{}, "", fmt.Errorf("download failed: %s", resp.Status)
	}
	return meta, base, copyTo(dest, io.LimitReader(resp.Body, alx.MaxPackageBytes+1))
}

func copyTo(filename string, r io.Reader) error {
	f, err := os.OpenFile(filename, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0600)
	if err != nil {
		return err
	}
	_, copyErr := io.Copy(f, r)
	closeErr := f.Close()
	if copyErr != nil {
		return copyErr
	}
	return closeErr
}

func getJSON(ctx context.Context, c *http.Client, url string, out any) error {
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	resp, err := c.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("registry returned %s", resp.Status)
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func UpdateRecord(filename string, r Record) error {
	var records []Record
	if data, err := os.ReadFile(filename); err == nil {
		if err = json.Unmarshal(data, &records); err != nil {
			return err
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}
	next := records[:0]
	for _, existing := range records {
		if existing.Namespace != r.Namespace || existing.Name != r.Name {
			next = append(next, existing)
		}
	}
	next = append(next, r)
	return writeRecords(filename, next)
}

func ReadRecord(filename, ns, name string) (Record, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return Record{}, err
	}
	var records []Record
	if err = json.Unmarshal(data, &records); err != nil {
		return Record{}, err
	}
	for _, r := range records {
		if r.Namespace == ns && r.Name == name {
			return r, nil
		}
	}
	return Record{}, os.ErrNotExist
}

func VerifyDigest(filename, expected string) error {
	f, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer f.Close()
	h := sha256.New()
	if _, err = io.Copy(h, f); err != nil {
		return err
	}
	actual := "sha256:" + hex.EncodeToString(h.Sum(nil))
	if actual != expected {
		return fmt.Errorf("digest mismatch: expected %s, got %s", expected, actual)
	}
	return nil
}
