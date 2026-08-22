package alx

import (
	"fmt"
	"os"
	"path/filepath"
)

// ValidateFile validates a source manifest using the canonical manifest parser.
func ValidateFile(filename string) (Manifest, error) {
	data, err := os.ReadFile(filename)
	if err != nil {
		return Manifest{}, fmt.Errorf("read manifest: %w", err)
	}
	manifest, err := ParseManifest(data)
	if err != nil {
		return Manifest{}, err
	}
	entry := filepath.Join(filepath.Dir(filename), filepath.FromSlash(manifest.Entry))
	entryData, err := os.ReadFile(entry)
	if err != nil {
		return Manifest{}, fmt.Errorf("runtime entry %q: %w", manifest.Entry, err)
	}
	if err := ValidateRuntimeEntry(manifest.Entry, entryData); err != nil {
		return Manifest{}, err
	}
	for _, viewEntry := range manifest.ViewEntries() {
		info, statErr := os.Stat(filepath.Join(filepath.Dir(filename), filepath.FromSlash(viewEntry)))
		if statErr != nil {
			return Manifest{}, fmt.Errorf("view entry %q: %w", viewEntry, statErr)
		}
		if !info.Mode().IsRegular() {
			return Manifest{}, fmt.Errorf("view entry %q is not a regular file", viewEntry)
		}
	}
	return manifest, nil
}

// VerifyFile verifies an ALX package using the canonical archive inspection path.
func VerifyFile(filename string) (Inspection, error) { return InspectFile(filename) }
