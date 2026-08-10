package main

import (
	"errors"
	"os"
	"path/filepath"
	"sort"
	"sync"
	"time"
)

type FileHandle struct {
	Name     string `json:"name"`
	Path     string `json:"path,omitempty"`
	Contents string `json:"contents,omitempty"`
}

type FileSystemEntry struct {
	Name       string `json:"name"`
	Path       string `json:"path"`
	URI        string `json:"uri"`
	Type       string `json:"type"`
	Size       int64  `json:"size,omitempty"`
	ModifiedAt string `json:"modifiedAt,omitempty"`
	Hidden     bool   `json:"hidden,omitempty"`
}

// WorkspaceService owns native filesystem operations exposed to the workbench.
// Dialog and window lifecycle APIs remain provided by the Wails runtime.
type WorkspaceService struct {
	mu   sync.RWMutex
	root string
}

func NewWorkspaceService() *WorkspaceService { return &WorkspaceService{} }

func (service *WorkspaceService) Close() {}

func (service *WorkspaceService) SetRoot(path string) error {
	if path == "" {
		return errors.New("workspace path is empty")
	}
	info, err := os.Stat(path)
	if err != nil {
		return err
	}
	if !info.IsDir() {
		return errors.New("workspace path is not a directory")
	}
	service.mu.Lock()
	service.root = filepath.Clean(path)
	service.mu.Unlock()
	return nil
}

func (service *WorkspaceService) Root() string {
	service.mu.RLock()
	defer service.mu.RUnlock()
	return service.root
}

func (service *WorkspaceService) ReadFile(path string) (FileHandle, error) {
	contents, err := os.ReadFile(path)
	if err != nil {
		return FileHandle{}, err
	}
	return FileHandle{Name: filepath.Base(path), Path: path, Contents: string(contents)}, nil
}

func (service *WorkspaceService) WriteFile(file FileHandle) (FileHandle, error) {
	if file.Path == "" {
		return FileHandle{}, errors.New("file path is empty")
	}
	if err := os.WriteFile(file.Path, []byte(file.Contents), 0o644); err != nil {
		return FileHandle{}, err
	}
	file.Name = filepath.Base(file.Path)
	return file, nil
}

func (service *WorkspaceService) ReadDirectory(path string) ([]FileSystemEntry, error) {
	if path == "" {
		path = service.Root()
	}
	if path == "" {
		return []FileSystemEntry{}, nil
	}
	entries, err := os.ReadDir(path)
	if err != nil {
		return nil, err
	}
	result := make([]FileSystemEntry, 0, len(entries))
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			return nil, err
		}
		entryPath := filepath.Join(path, entry.Name())
		kind := "file"
		if entry.IsDir() {
			kind = "directory"
		} else if info.Mode()&os.ModeSymlink != 0 {
			kind = "symlink"
		} else if !info.Mode().IsRegular() {
			kind = "other"
		}
		result = append(result, FileSystemEntry{
			Name: entry.Name(), Path: entryPath, URI: "file://" + filepath.ToSlash(entryPath),
			Type: kind, Size: info.Size(), ModifiedAt: info.ModTime().Format(time.RFC3339),
			Hidden: len(entry.Name()) > 0 && entry.Name()[0] == '.',
		})
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].Type == result[j].Type {
			return result[i].Name < result[j].Name
		}
		return result[i].Type == "directory"
	})
	return result, nil
}
