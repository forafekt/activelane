package alx

import (
	"encoding/json"
	"fmt"
	"path"
	"regexp"
	"strings"
)

const (
	ManifestFile          = "activelane.manifest.json"
	ManifestSchemaVersion = "1.0.0"
	MaxManifestBytes      = 1 << 20
)

var (
	segmentRE         = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*$`)
	semverRE          = regexp.MustCompile(`^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$`)
	validOS           = map[string]bool{"linux": true, "darwin": true, "windows": true}
	validArchitecture = map[string]bool{"amd64": true, "arm64": true, "386": true}
)

type Manifest struct {
	SchemaVersion string            `json:"schemaVersion"`
	ID            string            `json:"id"`
	Publisher     string            `json:"publisher"`
	Name          string            `json:"name"`
	DisplayName   string            `json:"displayName"`
	Version       string            `json:"version"`
	Description   string            `json:"description"`
	Entry         string            `json:"entry"`
	Engines       map[string]string `json:"engines"`
	HostSupport   []string          `json:"hostSupport"`
	ExtensionKind []string          `json:"extensionKind"`
	OS            []string          `json:"os,omitempty"`
	Architecture  []string          `json:"architecture,omitempty"`
	Visibility    string            `json:"visibility,omitempty"`
	Raw           map[string]any    `json:"-"`
}

func (m Manifest) MarshalJSON() ([]byte, error) {
	type plain Manifest
	known, err := json.Marshal(plain(m))
	if err != nil {
		return nil, err
	}
	var merged map[string]any
	if err := json.Unmarshal(known, &merged); err != nil {
		return nil, err
	}
	for key, value := range m.Raw {
		if _, exists := merged[key]; !exists {
			merged[key] = value
		}
	}
	delete(merged, "Raw")
	return json.Marshal(merged)
}

func (m *Manifest) UnmarshalJSON(data []byte) error {
	type plain Manifest
	var decoded plain
	if err := json.Unmarshal(data, &decoded); err != nil {
		return err
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	*m = Manifest(decoded)
	m.Raw = raw
	return nil
}

func ParseManifest(data []byte) (Manifest, error) {
	if len(data) > MaxManifestBytes {
		return Manifest{}, fmt.Errorf("manifest exceeds %d bytes", MaxManifestBytes)
	}
	var raw map[string]any
	if err := json.Unmarshal(data, &raw); err != nil {
		return Manifest{}, fmt.Errorf("parse manifest: %w", err)
	}
	var m Manifest
	if err := json.Unmarshal(data, &m); err != nil {
		return Manifest{}, fmt.Errorf("parse manifest: %w", err)
	}
	m.Raw = raw
	if err := m.Validate(); err != nil {
		return Manifest{}, err
	}
	return m, nil
}

func (m Manifest) Validate() error {
	var issues []string
	if m.SchemaVersion != ManifestSchemaVersion {
		issues = append(issues, "schemaVersion: must be "+ManifestSchemaVersion)
	}
	if !strings.HasPrefix(m.ID, "@") {
		issues = append(issues, "id: must use @namespace/name")
	}
	parts := strings.Split(strings.TrimPrefix(m.ID, "@"), "/")
	if len(parts) != 2 || !segmentRE.MatchString(m.Publisher) || !segmentRE.MatchString(m.Name) || len(parts) == 2 && (parts[0] != m.Publisher || parts[1] != m.Name) {
		issues = append(issues, "id: must match publisher and name")
	}
	if m.DisplayName == "" {
		issues = append(issues, "displayName: must be non-empty")
	}
	if m.Description == "" {
		issues = append(issues, "description: must be non-empty")
	}
	if !semverRE.MatchString(m.Version) {
		issues = append(issues, "version: must be valid semantic version")
	}
	if m.Engines["activelane"] == "" {
		issues = append(issues, "engines.activelane: must be non-empty")
	}
	if len(m.HostSupport) == 0 {
		issues = append(issues, "hostSupport: must be non-empty")
	}
	if len(m.ExtensionKind) == 0 {
		issues = append(issues, "extensionKind: must be non-empty")
	}
	for index, value := range m.OS {
		if !validOS[value] {
			issues = append(issues, fmt.Sprintf("os.%d: unsupported operating system", index))
		}
	}
	for index, value := range m.Architecture {
		if !validArchitecture[value] {
			issues = append(issues, fmt.Sprintf("architecture.%d: unsupported architecture", index))
		}
	}
	if err := validateArchivePath(m.Entry); err != nil {
		issues = append(issues, "entry: "+err.Error())
	}
	if len(issues) > 0 {
		return fmt.Errorf("invalid manifest: %s", strings.Join(issues, "; "))
	}
	return nil
}

func validateArchivePath(name string) error {
	if name == "" {
		return fmt.Errorf("must be non-empty")
	}
	if strings.Contains(name, "\\") || strings.HasPrefix(name, "/") || path.Clean(name) != name || name == "." || strings.HasPrefix(name, "../") {
		return fmt.Errorf("unsafe package path %q", name)
	}
	return nil
}
