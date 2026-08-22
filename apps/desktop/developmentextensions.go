package main

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"sync"

	"github.com/activelane/activelane/go/devextensions"
)

type developmentExtensionRegistry struct {
	mu          sync.RWMutex
	listener    net.Listener
	socketPath  string
	byExtension map[string]devextensions.Registration
	emitChanged func()
	closed      bool
}

func newDevelopmentExtensionRegistry() *developmentExtensionRegistry {
	return &developmentExtensionRegistry{byExtension: map[string]devextensions.Registration{}}
}

func (registry *developmentExtensionRegistry) start(emitChanged func()) error {
	if runtime.GOOS == "windows" {
		return fmt.Errorf("development extension IPC is not yet available on Windows")
	}
	path, err := devextensions.SocketPath()
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("create development socket directory: %w", err)
	}
	if connection, dialErr := net.Dial("unix", path); dialErr == nil {
		_ = connection.Close()
		return fmt.Errorf("another ActiveLane development service is already listening at %s", path)
	}
	if err := os.Remove(path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("remove stale development socket: %w", err)
	}
	listener, err := net.Listen("unix", path)
	if err != nil {
		return fmt.Errorf("listen for development extensions: %w", err)
	}
	if err := os.Chmod(path, 0o600); err != nil {
		_ = listener.Close()
		_ = os.Remove(path)
		return fmt.Errorf("secure development socket: %w", err)
	}
	registry.mu.Lock()
	registry.listener = listener
	registry.socketPath = path
	registry.emitChanged = emitChanged
	registry.mu.Unlock()
	go registry.accept()
	return nil
}

func (registry *developmentExtensionRegistry) accept() {
	for {
		connection, err := registry.listener.Accept()
		if err != nil {
			registry.mu.RLock()
			closed := registry.closed
			registry.mu.RUnlock()
			if closed {
				return
			}
			continue
		}
		go registry.handle(connection)
	}
}

func (registry *developmentExtensionRegistry) handle(connection net.Conn) {
	defer connection.Close()
	decoder := json.NewDecoder(bufio.NewReader(connection))
	encoder := json.NewEncoder(connection)
	sessionID := ""
	extensionID := ""
	defer func() {
		if registry.removeSession(extensionID, sessionID) {
			registry.changed()
		}
	}()
	for {
		var message devextensions.Message
		if err := decoder.Decode(&message); err != nil {
			if !errors.Is(err, io.EOF) {
				_ = encoder.Encode(devextensions.Response{OK: false, Message: "invalid development protocol message: " + err.Error()})
			}
			return
		}
		if message.Type == "ping" {
			_ = encoder.Encode(devextensions.Response{OK: true})
			continue
		}
		if message.Type != "register" || message.Registration == nil {
			_ = encoder.Encode(devextensions.Response{OK: false, Message: "expected a register message"})
			continue
		}
		registration := *message.Registration
		if err := devextensions.ValidateRegistration(registration); err != nil {
			_ = encoder.Encode(devextensions.Response{OK: false, Message: err.Error()})
			continue
		}
		if sessionID != "" && registration.SessionID != sessionID {
			_ = encoder.Encode(devextensions.Response{OK: false, Message: "a connection cannot change development session identity"})
			continue
		}
		if err := registry.register(registration); err != nil {
			_ = encoder.Encode(devextensions.Response{OK: false, Message: err.Error()})
			continue
		}
		sessionID = registration.SessionID
		extensionID = registration.Manifest.ID
		_ = encoder.Encode(devextensions.Response{OK: true, Message: fmt.Sprintf("registered generation %d", registration.Generation)})
		registry.changed()
	}
}

func (registry *developmentExtensionRegistry) register(registration devextensions.Registration) error {
	registry.mu.Lock()
	defer registry.mu.Unlock()
	existing, found := registry.byExtension[registration.Manifest.ID]
	if found && existing.SessionID != registration.SessionID {
		return fmt.Errorf("%s is already owned by development session %s", registration.Manifest.ID, existing.SessionID)
	}
	if found && registration.Generation <= existing.Generation {
		return fmt.Errorf("generation %d is not newer than active generation %d", registration.Generation, existing.Generation)
	}
	registry.byExtension[registration.Manifest.ID] = registration
	return nil
}

func (registry *developmentExtensionRegistry) removeSession(extensionID, sessionID string) bool {
	if extensionID == "" || sessionID == "" {
		return false
	}
	registry.mu.Lock()
	defer registry.mu.Unlock()
	existing, found := registry.byExtension[extensionID]
	if !found || existing.SessionID != sessionID {
		return false
	}
	delete(registry.byExtension, extensionID)
	return true
}

func (registry *developmentExtensionRegistry) changed() {
	registry.mu.RLock()
	emit := registry.emitChanged
	registry.mu.RUnlock()
	if emit != nil {
		emit()
	}
}

func (registry *developmentExtensionRegistry) list() []devextensions.Registration {
	registry.mu.RLock()
	defer registry.mu.RUnlock()
	items := make([]devextensions.Registration, 0, len(registry.byExtension))
	for _, registration := range registry.byExtension {
		items = append(items, registration)
	}
	sort.Slice(items, func(i, j int) bool { return items[i].Manifest.ID < items[j].Manifest.ID })
	return items
}

func (registry *developmentExtensionRegistry) get(extensionID, version string) (devextensions.Registration, bool) {
	registry.mu.RLock()
	defer registry.mu.RUnlock()
	registration, found := registry.byExtension[extensionID]
	return registration, found && registration.Manifest.Version == version
}

func (registry *developmentExtensionRegistry) close() {
	registry.mu.Lock()
	if registry.closed {
		registry.mu.Unlock()
		return
	}
	registry.closed = true
	listener := registry.listener
	path := registry.socketPath
	registry.byExtension = map[string]devextensions.Registration{}
	registry.mu.Unlock()
	if listener != nil {
		_ = listener.Close()
	}
	if path != "" {
		_ = os.Remove(path)
	}
}
