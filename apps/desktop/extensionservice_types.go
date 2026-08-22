package main

type DesktopError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Detail  string `json:"detail,omitempty"`
}

type RegistryStatus struct {
	ID           string          `json:"id"`
	DisplayName  string          `json:"displayName"`
	Type         string          `json:"type"`
	Source       string          `json:"source"`
	Enabled      bool            `json:"enabled"`
	Priority     int             `json:"priority"`
	Scopes       []string        `json:"scopes"`
	State        string          `json:"state"`
	Capabilities map[string]bool `json:"capabilities,omitempty"`
	Error        *DesktopError   `json:"error,omitempty"`
}

type RegistryStatusResponse struct {
	Registries            []RegistryStatus `json:"registries"`
	Mode                  string           `json:"mode"`
	PublicRegistryEnabled bool             `json:"publicRegistryEnabled"`
	Error                 *DesktopError    `json:"error,omitempty"`
}

type SearchExtension struct {
	RegistryID          string         `json:"registryId"`
	RegistryDisplayName string         `json:"registryDisplayName"`
	ID                  string         `json:"id"`
	Namespace           string         `json:"namespace"`
	Name                string         `json:"name"`
	DisplayName         string         `json:"displayName"`
	Description         string         `json:"description"`
	Version             string         `json:"version"`
	VersionStatus       string         `json:"versionStatus"`
	Manifest            map[string]any `json:"manifest"`
	ManifestDigest      string         `json:"manifestDigest"`
	PackageDigest       string         `json:"packageDigest"`
	PublishedAt         string         `json:"publishedAt"`
	Compatible          bool           `json:"compatible"`
	CompatibilityReason string         `json:"compatibilityReason,omitempty"`
}

type RegistryFailure struct {
	RegistryID          string       `json:"registryId"`
	RegistryDisplayName string       `json:"registryDisplayName"`
	Error               DesktopError `json:"error"`
}

type SearchResponse struct {
	Items                 []SearchExtension `json:"items"`
	Failures              []RegistryFailure `json:"failures"`
	Mode                  string            `json:"mode"`
	PublicRegistryEnabled bool              `json:"publicRegistryEnabled"`
	Error                 *DesktopError     `json:"error,omitempty"`
}

type InstalledExtension struct {
	ID              string         `json:"id"`
	ExtensionID     string         `json:"extensionId"`
	DisplayName     string         `json:"displayName"`
	Version         string         `json:"version"`
	Enabled         bool           `json:"enabled"`
	State           string         `json:"state"`
	InstallSource   string         `json:"installSource"`
	InstalledAt     string         `json:"installedAt"`
	UpdatedAt       string         `json:"updatedAt"`
	Manifest        map[string]any `json:"manifest"`
	RegistryID      string         `json:"registryId"`
	RegistrySource  string         `json:"registrySource"`
	ManifestDigest  string         `json:"manifestDigest"`
	PackageDigest   string         `json:"packageDigest"`
	InstallPath     string         `json:"installPath"`
	IntegrityState  string         `json:"integrityState"`
	RestartRequired bool           `json:"restartRequired"`
}

type InstalledResponse struct {
	Items []InstalledExtension `json:"items"`
	Error *DesktopError        `json:"error,omitempty"`
}

type ExtensionModuleResponse struct {
	Source      string        `json:"source,omitempty"`
	Entrypoint  string        `json:"entrypoint,omitempty"`
	ContentType string        `json:"contentType,omitempty"`
	SizeBytes   int           `json:"sizeBytes,omitempty"`
	SHA256      string        `json:"sha256,omitempty"`
	Error       *DesktopError `json:"error,omitempty"`
}

type ExtensionAssetResponse struct {
	URL   string        `json:"url,omitempty"`
	Error *DesktopError `json:"error,omitempty"`
}

type ExtensionOperationResponse struct {
	Record          *InstalledExtension `json:"record,omitempty"`
	RestartRequired bool                `json:"restartRequired"`
	Error           *DesktopError       `json:"error,omitempty"`
}
