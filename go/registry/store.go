package registry

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/activelane/activelane/go/alx"
)

var ErrNotFound = errors.New("not found")
var ErrVersionExists = errors.New("version already exists")

type Artifact struct {
	Digest      string `json:"digest"`
	Algorithm   string `json:"algorithm"`
	SizeBytes   int64  `json:"sizeBytes"`
	DownloadURL string `json:"downloadUrl"`
}

type Version struct {
	ExtensionID    string       `json:"extensionId"`
	Publisher      string       `json:"publisher"`
	Name           string       `json:"name"`
	Version        string       `json:"version"`
	Status         string       `json:"status"`
	Manifest       alx.Manifest `json:"manifest"`
	ManifestDigest string       `json:"manifestDigest"`
	Artifact       Artifact     `json:"artifact"`
	PublishedAt    string       `json:"publishedAt"`
	YankedAt       string       `json:"yankedAt,omitempty"`
}

type Extension struct {
	ID            string    `json:"id"`
	Publisher     string    `json:"publisher"`
	Name          string    `json:"name"`
	DisplayName   string    `json:"displayName"`
	Description   string    `json:"description"`
	Visibility    string    `json:"visibility"`
	LatestVersion string    `json:"latestVersion,omitempty"`
	Versions      []Version `json:"versions"`
}

type Store struct {
	root string
	mu   sync.RWMutex
	now  func() time.Time
}

type SeedRecord struct {
	Publisher string `json:"publisher"`
	Name      string `json:"name"`
	Version   string `json:"version"`
}

// PublishSeeded uses normal immutable publication semantics and records internal
// provenance. An existing version is idempotent only when it was seeded before.
func (s *Store) PublishSeeded(ctx context.Context, namespace, name string, r io.Reader) (Version, bool, error) {
	version, err := s.Publish(ctx, namespace, name, r)
	record := SeedRecord{Publisher: namespace, Name: name}
	if err == nil {
		record.Version = version.Version
		if err := s.RecordSeed(record); err != nil {
			return Version{}, false, err
		}
		return version, false, nil
	}
	if !errors.Is(err, ErrVersionExists) {
		return Version{}, false, err
	}
	versions, listErr := s.ListVersions(namespace, name)
	if listErr != nil {
		return Version{}, false, listErr
	}
	for _, existing := range versions {
		record.Version = existing.Version
		seeded, provenanceErr := s.IsSeeded(record)
		if provenanceErr != nil {
			return Version{}, false, provenanceErr
		}
		if seeded {
			return existing, true, nil
		}
	}
	return Version{}, false, ErrVersionExists
}

func (s *Store) IsSeeded(record SeedRecord) (bool, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	data, err := os.ReadFile(filepath.Join(s.root, ".activelane-seed", "records.json"))
	if errors.Is(err, os.ErrNotExist) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	var records []SeedRecord
	if err := json.Unmarshal(data, &records); err != nil {
		return false, fmt.Errorf("read seed provenance: %w", err)
	}
	for _, existing := range records {
		if existing == record {
			return true, nil
		}
	}
	return false, nil
}

func (s *Store) RecordSeed(record SeedRecord) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	filename := filepath.Join(s.root, ".activelane-seed", "records.json")
	var records []SeedRecord
	if data, err := os.ReadFile(filename); err == nil {
		_ = json.Unmarshal(data, &records)
	}
	for _, existing := range records {
		if existing == record {
			return nil
		}
	}
	records = append(records, record)
	sort.Slice(records, func(i, j int) bool {
		return records[i].Publisher+"/"+records[i].Name < records[j].Publisher+"/"+records[j].Name
	})
	return writeJSONAtomic(filename, records)
}

// CleanSeeded removes only version metadata recorded by the development seeder.
func (s *Store) CleanSeeded() (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	filename := filepath.Join(s.root, ".activelane-seed", "records.json")
	data, err := os.ReadFile(filename)
	if errors.Is(err, os.ErrNotExist) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	var records []SeedRecord
	if err := json.Unmarshal(data, &records); err != nil {
		return 0, fmt.Errorf("read seed provenance: %w", err)
	}
	removed := 0
	for _, record := range records {
		if err := os.Remove(s.versionPath(record.Publisher, record.Name, record.Version)); err == nil {
			removed++
		} else if !errors.Is(err, os.ErrNotExist) {
			return removed, err
		}
		_ = os.Remove(filepath.Dir(s.versionPath(record.Publisher, record.Name, record.Version)))
		_ = os.Remove(filepath.Dir(filepath.Dir(s.versionPath(record.Publisher, record.Name, record.Version))))
		_ = os.Remove(filepath.Dir(filepath.Dir(filepath.Dir(s.versionPath(record.Publisher, record.Name, record.Version)))))
	}
	if err := os.Remove(filename); err != nil && !errors.Is(err, os.ErrNotExist) {
		return removed, err
	}
	_ = os.Remove(filepath.Dir(filename))
	return removed, nil
}

func NewStore(root string) (*Store, error) {
	root, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	for _, d := range []string{"blobs/sha256", "metadata/packages"} {
		if err := os.MkdirAll(filepath.Join(root, d), 0755); err != nil {
			return nil, err
		}
	}
	return &Store{root: root, now: time.Now}, nil
}

func (s *Store) Publish(ctx context.Context, namespace, name string, r io.Reader) (Version, error) {
	tmp, err := os.CreateTemp(s.root, ".upload-*.alx")
	if err != nil {
		return Version{}, err
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName)
	limited := io.LimitReader(r, alx.MaxPackageBytes+1)
	n, err := io.Copy(tmp, limited)
	if err != nil {
		tmp.Close()
		return Version{}, err
	}
	if n > alx.MaxPackageBytes {
		tmp.Close()
		return Version{}, fmt.Errorf("package exceeds maximum size")
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return Version{}, err
	}
	if err := tmp.Close(); err != nil {
		return Version{}, err
	}
	inspection, err := alx.InspectFile(tmpName)
	if err != nil {
		return Version{}, err
	}
	m := inspection.Manifest
	if m.Publisher != namespace || m.Name != name {
		return Version{}, fmt.Errorf("route identity %s/%s does not match manifest %s/%s", namespace, name, m.Publisher, m.Name)
	}
	manifestJSON, _ := json.Marshal(m.Raw)
	mh := sha256.Sum256(manifestJSON)
	v := Version{ExtensionID: m.ID, Publisher: namespace, Name: name, Version: m.Version, Status: "published", Manifest: m, ManifestDigest: "sha256:" + hex.EncodeToString(mh[:]), Artifact: Artifact{Digest: inspection.Digest, Algorithm: "sha256", SizeBytes: inspection.Size, DownloadURL: fmt.Sprintf("/v1/extensions/%s/%s/versions/%s/package", namespace, name, m.Version)}, PublishedAt: s.now().UTC().Format(time.RFC3339Nano)}
	s.mu.Lock()
	defer s.mu.Unlock()
	select {
	case <-ctx.Done():
		return Version{}, ctx.Err()
	default:
	}
	meta := s.versionPath(namespace, name, m.Version)
	if _, err := os.Stat(meta); err == nil {
		return Version{}, ErrVersionExists
	} else if !errors.Is(err, os.ErrNotExist) {
		return Version{}, err
	}
	digest := strings.TrimPrefix(inspection.Digest, "sha256:")
	blob := s.blobPath(digest)
	if err := os.MkdirAll(filepath.Dir(blob), 0755); err != nil {
		return Version{}, err
	}
	if _, err := os.Stat(blob); errors.Is(err, os.ErrNotExist) {
		if err := copyAtomic(tmpName, blob, 0644); err != nil {
			return Version{}, err
		}
	}
	if err := writeJSONAtomic(meta, v); err != nil {
		return Version{}, err
	}
	return v, nil
}

func (s *Store) GetVersion(namespace, name, version string) (Version, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.getVersion(namespace, name, version)
}

func (s *Store) getVersion(namespace, name, version string) (Version, error) {
	data, err := os.ReadFile(s.versionPath(namespace, name, version))
	if errors.Is(err, os.ErrNotExist) {
		return Version{}, ErrNotFound
	}
	if err != nil {
		return Version{}, err
	}
	var v Version
	if err = json.Unmarshal(data, &v); err != nil {
		return Version{}, err
	}
	return v, nil
}

func (s *Store) ListVersions(namespace, name string) ([]Version, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	dir := filepath.Dir(s.versionPath(namespace, name, "x"))
	entries, err := os.ReadDir(dir)
	if errors.Is(err, os.ErrNotExist) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	out := make([]Version, 0, len(entries))
	for _, e := range entries {
		if e.IsDir() || filepath.Ext(e.Name()) != ".json" {
			continue
		}
		v, err := s.getVersion(namespace, name, strings.TrimSuffix(e.Name(), ".json"))
		if err != nil {
			return nil, err
		}
		out = append(out, v)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Version > out[j].Version })
	return out, nil
}

func (s *Store) GetExtension(namespace, name string) (Extension, error) {
	versions, err := s.ListVersions(namespace, name)
	if err != nil {
		return Extension{}, err
	}
	m := versions[0].Manifest
	e := Extension{ID: m.ID, Publisher: namespace, Name: name, DisplayName: m.DisplayName, Description: m.Description, Visibility: m.Visibility, Versions: versions}
	for _, v := range versions {
		if v.Status == "published" {
			e.LatestVersion = v.Version
			break
		}
	}
	return e, nil
}

func (s *Store) List(search string) ([]Extension, error) {
	s.mu.RLock()
	root := filepath.Join(s.root, "metadata/packages")
	var pairs [][2]string
	namespaces, err := os.ReadDir(root)
	if err != nil {
		s.mu.RUnlock()
		return nil, err
	}
	for _, ns := range namespaces {
		if !ns.IsDir() {
			continue
		}
		pkgs, _ := os.ReadDir(filepath.Join(root, ns.Name()))
		for _, p := range pkgs {
			if p.IsDir() {
				pairs = append(pairs, [2]string{ns.Name(), p.Name()})
			}
		}
	}
	s.mu.RUnlock()
	var out []Extension
	query := strings.ToLower(search)
	for _, p := range pairs {
		e, err := s.GetExtension(p[0], p[1])
		if err != nil {
			continue
		}
		if query == "" || strings.Contains(strings.ToLower(e.ID+" "+e.DisplayName+" "+e.Description), query) {
			out = append(out, e)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

func (s *Store) SetYanked(namespace, name, version string, yanked bool) (Version, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	v, err := s.getVersion(namespace, name, version)
	if err != nil {
		return Version{}, err
	}
	if yanked {
		v.Status = "yanked"
		v.YankedAt = s.now().UTC().Format(time.RFC3339Nano)
	} else {
		v.Status = "published"
		v.YankedAt = ""
	}
	if err := writeJSONAtomic(s.versionPath(namespace, name, version), v); err != nil {
		return Version{}, err
	}
	return v, nil
}

func (s *Store) OpenPackage(namespace, name, version string) (*os.File, Version, error) {
	v, err := s.GetVersion(namespace, name, version)
	if err != nil {
		return nil, Version{}, err
	}
	f, err := os.Open(s.blobPath(strings.TrimPrefix(v.Artifact.Digest, "sha256:")))
	return f, v, err
}

func (s *Store) versionPath(ns, name, version string) string {
	return filepath.Join(s.root, "metadata/packages", ns, name, "versions", version+".json")
}

func (s *Store) blobPath(digest string) string {
	return filepath.Join(s.root, "blobs/sha256", digest[:2], digest)
}

func writeJSONAtomic(filename string, v any) error {
	data, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	if err = os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(filename), ".metadata-*.tmp")
	if err != nil {
		return err
	}
	name := tmp.Name()
	defer os.Remove(name)
	if _, err = tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err = tmp.Sync(); err != nil {
		tmp.Close()
		return err
	}
	if err = tmp.Close(); err != nil {
		return err
	}
	return os.Rename(name, filename)
}

func copyAtomic(source, dest string, mode os.FileMode) error {
	in, err := os.Open(source)
	if err != nil {
		return err
	}
	defer in.Close()
	tmp, err := os.CreateTemp(filepath.Dir(dest), ".blob-*.tmp")
	if err != nil {
		return err
	}
	name := tmp.Name()
	defer os.Remove(name)
	if err = tmp.Chmod(mode); err != nil {
		tmp.Close()
		return err
	}
	if _, err = io.Copy(tmp, in); err != nil {
		tmp.Close()
		return err
	}
	if err = tmp.Sync(); err != nil {
		tmp.Close()
		return err
	}
	if err = tmp.Close(); err != nil {
		return err
	}
	if err = os.Link(name, dest); err == nil {
		return nil
	} else if errors.Is(err, os.ErrExist) {
		return nil
	}
	return os.Rename(name, dest)
}
