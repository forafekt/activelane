package install

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

const RecordsFile = "installed.json"

type Error struct {
	Code    string
	Message string
	Cause   error
}

func (e *Error) Error() string {
	if e.Cause != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Cause)
	}
	return e.Message
}

func (e *Error) Unwrap() error { return e.Cause }

func ListRecords(root string) ([]Record, error) {
	data, err := os.ReadFile(filepath.Join(root, RecordsFile))
	if errors.Is(err, os.ErrNotExist) {
		return []Record{}, nil
	}
	if err != nil {
		return nil, &Error{Code: "INSTALLATION_CORRUPT", Message: "Unable to read installed extension state.", Cause: err}
	}
	var records []Record
	if err := json.Unmarshal(data, &records); err != nil {
		return nil, &Error{Code: "INSTALLATION_CORRUPT", Message: "Installed extension state is invalid.", Cause: err}
	}
	for index := range records {
		if err := validateOwnedPath(root, records[index]); err != nil {
			return nil, &Error{Code: "INSTALLATION_CORRUPT", Message: "Installed extension path is unsafe.", Cause: err}
		}
	}
	sort.Slice(records, func(i, j int) bool {
		return records[i].Namespace+"/"+records[i].Name < records[j].Namespace+"/"+records[j].Name
	})
	return records, nil
}

func SetEnabled(root, namespace, name string, enabled bool) (Record, error) {
	records, err := ListRecords(root)
	if err != nil {
		return Record{}, err
	}
	for index := range records {
		if records[index].Namespace != namespace || records[index].Name != name {
			continue
		}
		if _, err := os.Stat(records[index].InstallPath); err != nil {
			return Record{}, &Error{Code: "INSTALLATION_CORRUPT", Message: "The installed extension directory is missing.", Cause: err}
		}
		records[index].Enabled = enabled
		if err := writeRecords(filepath.Join(root, RecordsFile), records); err != nil {
			return Record{}, &Error{Code: enableErrorCode(enabled), Message: "Unable to persist extension enablement.", Cause: err}
		}
		return records[index], nil
	}
	return Record{}, &Error{Code: "EXTENSION_NOT_FOUND", Message: "The extension is not installed."}
}

func Uninstall(root, namespace, name string) error {
	records, err := ListRecords(root)
	if err != nil {
		return err
	}
	index := -1
	var record Record
	for candidate, installed := range records {
		if installed.Namespace == namespace && installed.Name == name {
			index, record = candidate, installed
			break
		}
	}
	if index < 0 {
		return &Error{Code: "EXTENSION_NOT_FOUND", Message: "The extension is not installed."}
	}
	if err := validateOwnedPath(root, record); err != nil {
		return &Error{Code: "UNINSTALL_FAILED", Message: "Refusing to remove an unsafe installation path.", Cause: err}
	}
	if record.Enabled {
		return &Error{Code: "DISABLE_FAILED", Message: "Disable the extension before uninstalling it."}
	}
	quarantineRoot := filepath.Join(root, ".uninstalling")
	if err := os.MkdirAll(quarantineRoot, 0o700); err != nil {
		return &Error{Code: "UNINSTALL_FAILED", Message: "Unable to prepare safe uninstallation.", Cause: err}
	}
	quarantine, err := os.MkdirTemp(quarantineRoot, namespace+"-"+name+"-*")
	if err != nil {
		return &Error{Code: "UNINSTALL_FAILED", Message: "Unable to prepare safe uninstallation.", Cause: err}
	}
	if err := os.Remove(quarantine); err != nil {
		return &Error{Code: "UNINSTALL_FAILED", Message: "Unable to prepare safe uninstallation.", Cause: err}
	}
	if err := os.Rename(record.InstallPath, quarantine); err != nil {
		return &Error{Code: "UNINSTALL_FAILED", Message: "Unable to quarantine the installed extension.", Cause: err}
	}
	next := append(records[:index:index], records[index+1:]...)
	if err := writeRecords(filepath.Join(root, RecordsFile), next); err != nil {
		_ = os.Rename(quarantine, record.InstallPath)
		return &Error{Code: "UNINSTALL_FAILED", Message: "Unable to update installed extension state.", Cause: err}
	}
	if err := os.RemoveAll(quarantine); err != nil {
		return &Error{Code: "UNINSTALL_FAILED", Message: "Extension was uninstalled but quarantine cleanup failed.", Cause: err}
	}
	removeEmptyParents(root, filepath.Dir(record.InstallPath))
	return nil
}

func validateOwnedPath(root string, record Record) error {
	rootAbs, err := filepath.Abs(root)
	if err != nil {
		return err
	}
	expected := filepath.Join(rootAbs, record.Namespace, record.Name, record.Version)
	pathAbs, err := filepath.Abs(record.InstallPath)
	if err != nil {
		return err
	}
	if pathAbs != expected {
		return fmt.Errorf("installPath %q does not match package-owned path %q", pathAbs, expected)
	}
	rel, err := filepath.Rel(rootAbs, pathAbs)
	if err != nil || rel == "." || strings.HasPrefix(rel, ".."+string(os.PathSeparator)) || filepath.IsAbs(rel) {
		return fmt.Errorf("installPath escapes installation root")
	}
	return nil
}

func writeRecords(filename string, records []Record) error {
	data, err := json.MarshalIndent(records, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	if err := os.MkdirAll(filepath.Dir(filename), 0o755); err != nil {
		return err
	}
	tmp, err := os.CreateTemp(filepath.Dir(filename), ".installed-*.tmp")
	if err != nil {
		return err
	}
	name := tmp.Name()
	defer os.Remove(name)
	if err := tmp.Chmod(0o600); err != nil {
		tmp.Close()
		return err
	}
	if _, err := tmp.Write(data); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(name, filename)
}

func enableErrorCode(enabled bool) string {
	if enabled {
		return "ENABLE_FAILED"
	}
	return "DISABLE_FAILED"
}

func removeEmptyParents(root, current string) {
	root = filepath.Clean(root)
	for current != root && current != filepath.Dir(current) {
		if err := os.Remove(current); err != nil {
			return
		}
		current = filepath.Dir(current)
	}
}
