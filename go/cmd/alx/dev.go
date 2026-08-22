package main

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/devextensions"
	"github.com/fsnotify/fsnotify"
)

func devExtension(args []string, out io.Writer) error {
	flags := flag.NewFlagSet("dev", flag.ContinueOnError)
	flags.SetOutput(io.Discard)
	runner := flags.String("runner", "pnpm", "package manager used to run the development server")
	port := flags.Int("port", 0, "loopback development server port")
	if err := flags.Parse(flagsFirst(args, map[string]bool{"--runner": true, "--port": true})); err != nil {
		return err
	}
	if flags.NArg() > 1 {
		return fmt.Errorf("dev accepts one extension directory")
	}
	root := "."
	var err error
	if flags.NArg() == 1 {
		root = flags.Arg(0)
	} else {
		root, err = discoverProjectRoot(root)
		if err != nil {
			return err
		}
	}
	absoluteRoot, err := filepath.Abs(root)
	if err != nil {
		return err
	}
	manifest, config, err := devextensions.LoadProject(absoluteRoot)
	if err != nil {
		return err
	}
	if *port == 0 {
		*port, err = availableLoopbackPort()
		if err != nil {
			return err
		}
	}
	if *port < 1 || *port > 65535 {
		return fmt.Errorf("port must be between 1 and 65535")
	}
	command, err := developmentCommand(config, *runner, *port)
	if err != nil {
		return err
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	process := exec.CommandContext(ctx, command[0], command[1:]...)
	process.Dir = absoluteRoot
	process.Stdout = out
	process.Stderr = out
	if err := process.Start(); err != nil {
		return fmt.Errorf("start extension development server: %w", err)
	}
	processDone := make(chan error, 1)
	go func() { processDone <- process.Wait() }()

	baseURL := "http://127.0.0.1:" + strconv.Itoa(*port)
	if err := waitForDevelopmentServer(ctx, baseURL, processDone); err != nil {
		if ctx.Err() != nil {
			return nil
		}
		return err
	}
	sessionID, err := randomSessionID()
	if err != nil {
		return err
	}
	generation := 1
	runtimeDirectory, err := os.MkdirTemp("", "activelane-runtime-"+manifest.Name+"-")
	if err != nil {
		return fmt.Errorf("create runtime build directory: %w", err)
	}
	defer os.RemoveAll(runtimeDirectory)
	runtimeBundle := filepath.Join(runtimeDirectory, "extension.js")
	if err := bundleDevelopmentRuntime(ctx, absoluteRoot, config.Runtime, runtimeBundle, out); err != nil {
		return err
	}
	registration := makeDevelopmentRegistration(sessionID, generation, absoluteRoot, baseURL, runtimeBundle, manifest, config)
	updates := make(chan devextensions.Registration, 1)
	updates <- registration
	registrationErrors := make(chan error, 1)
	go maintainDevelopmentRegistration(ctx, updates, registrationErrors, out)

	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return fmt.Errorf("create development watcher: %w", err)
	}
	defer watcher.Close()
	if err := watcher.Add(absoluteRoot); err != nil {
		return fmt.Errorf("watch extension project: %w", err)
	}
	if err := watchDevelopmentTree(watcher, filepath.Join(absoluteRoot, "src")); err != nil {
		return fmt.Errorf("watch extension source: %w", err)
	}

	fmt.Fprintf(out, "\nActiveLane extension development\n\nExtension: %s\nRuntime: %s\nViews: %d\nDev server: %s\n\nWatching for changes...\n", manifest.ID, config.Runtime, len(config.Views), baseURL)
	var debounce <-chan time.Time
	for {
		select {
		case <-ctx.Done():
			fmt.Fprintln(out, "\nDevelopment session stopped.")
			return nil
		case err := <-processDone:
			if ctx.Err() != nil {
				return nil
			}
			return fmt.Errorf("development server exited: %w", err)
		case err := <-registrationErrors:
			return err
		case event := <-watcher.Events:
			if relevantDevelopmentChange(event, absoluteRoot, config.Runtime) {
				debounce = time.After(120 * time.Millisecond)
			}
		case err := <-watcher.Errors:
			fmt.Fprintf(out, "Watcher warning: %v\n", err)
		case <-debounce:
			debounce = nil
			nextManifest, nextConfig, loadErr := devextensions.LoadProject(absoluteRoot)
			if loadErr != nil {
				fmt.Fprintf(out, "Manifest invalid: %v\n", loadErr)
				continue
			}
			manifest, config = nextManifest, nextConfig
			if err := bundleDevelopmentRuntime(ctx, absoluteRoot, config.Runtime, runtimeBundle, out); err != nil {
				fmt.Fprintf(out, "Runtime build failed: %v\n", err)
				continue
			}
			generation++
			next := makeDevelopmentRegistration(sessionID, generation, absoluteRoot, baseURL, runtimeBundle, manifest, config)
			select {
			case updates <- next:
			default:
				<-updates
				updates <- next
			}
			fmt.Fprintf(out, "Reloading %s generation %d\n", manifest.ID, generation)
		}
	}
}

func availableLoopbackPort() (int, error) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return 0, fmt.Errorf("allocate development port: %w", err)
	}
	defer listener.Close()
	return listener.Addr().(*net.TCPAddr).Port, nil
}

func developmentCommand(config devextensions.ProjectConfig, runner string, port int) ([]string, error) {
	command := append([]string(nil), config.Command...)
	if len(command) == 0 {
		switch runner {
		case "pnpm", "yarn":
			command = []string{runner, "run", "dev", "--host", "127.0.0.1", "--port", "{port}", "--strictPort"}
		case "npm":
			command = []string{"npm", "run", "dev", "--", "--host", "127.0.0.1", "--port", "{port}", "--strictPort"}
		default:
			return nil, fmt.Errorf("unsupported development runner %q", runner)
		}
	}
	for index := range command {
		command[index] = strings.ReplaceAll(command[index], "{port}", strconv.Itoa(port))
	}
	if len(command) == 0 || command[0] == "" {
		return nil, fmt.Errorf("development command is empty")
	}
	return command, nil
}

func waitForDevelopmentServer(ctx context.Context, baseURL string, processDone <-chan error) error {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()
	client := &http.Client{Timeout: 500 * time.Millisecond}
	for {
		request, _ := http.NewRequestWithContext(ctx, http.MethodGet, baseURL, nil)
		response, err := client.Do(request)
		if err == nil {
			_ = response.Body.Close()
			return nil
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case err := <-processDone:
			return fmt.Errorf("development server exited before becoming ready: %w", err)
		case <-ticker.C:
		}
	}
}

func randomSessionID() (string, error) {
	data := make([]byte, 16)
	if _, err := rand.Read(data); err != nil {
		return "", fmt.Errorf("create development session identity: %w", err)
	}
	return hex.EncodeToString(data), nil
}

func makeDevelopmentRegistration(sessionID string, generation int, root, baseURL, runtimeBundle string, manifest alx.Manifest, config devextensions.ProjectConfig) devextensions.Registration {
	assets := make(map[string]string, len(config.Views))
	for packaged, source := range config.Views {
		assets[packaged] = devextensions.DevelopmentURL(baseURL, source)
	}
	return devextensions.Registration{SessionID: sessionID, ProjectRoot: root, Manifest: manifest, RuntimePath: runtimeBundle, AssetURLs: assets, Generation: generation}
}

func bundleDevelopmentRuntime(ctx context.Context, root, source, output string, out io.Writer) error {
	command := exec.CommandContext(ctx, "pnpm", "exec", "esbuild", filepath.FromSlash(source), "--bundle", "--format=esm", "--platform=browser", "--sourcemap=inline", "--outfile="+output)
	command.Dir = root
	command.Stdout = out
	command.Stderr = out
	if err := command.Run(); err != nil {
		return fmt.Errorf("bundle development runtime: %w", err)
	}
	return nil
}

func watchDevelopmentTree(watcher *fsnotify.Watcher, root string) error {
	return filepath.WalkDir(root, func(path string, entry os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if entry.IsDir() {
			return watcher.Add(path)
		}
		return nil
	})
}

func maintainDevelopmentRegistration(ctx context.Context, updates <-chan devextensions.Registration, failures chan<- error, out io.Writer) {
	var latest devextensions.Registration
	connected := false
	for {
		select {
		case <-ctx.Done():
			return
		case latest = <-updates:
		default:
		}
		if latest.SessionID == "" {
			select {
			case <-ctx.Done():
				return
			case latest = <-updates:
			}
		}
		path, err := devextensions.SocketPath()
		if err != nil {
			failures <- err
			return
		}
		connection, err := net.DialTimeout("unix", path, 500*time.Millisecond)
		if err != nil {
			if !connected {
				fmt.Fprintln(out, "Waiting for ActiveLane desktop development service...")
				connected = true
			}
			select {
			case <-ctx.Done():
				return
			case next := <-updates:
				latest = next
			case <-time.After(time.Second):
			}
			continue
		}
		connected = false
		encoder := json.NewEncoder(connection)
		decoder := json.NewDecoder(bufio.NewReader(connection))
		if err := exchangeDevelopmentMessage(encoder, decoder, devextensions.Message{Type: "register", Registration: &latest}); err != nil {
			_ = connection.Close()
			fmt.Fprintf(out, "Registration rejected: %v\n", err)
			time.Sleep(time.Second)
			continue
		}
		fmt.Fprintf(out, "Registered with ActiveLane (generation %d).\n", latest.Generation)
		heartbeat := time.NewTicker(2 * time.Second)
		alive := true
		for alive {
			select {
			case <-ctx.Done():
				heartbeat.Stop()
				_ = connection.Close()
				return
			case next := <-updates:
				latest = next
				if err := exchangeDevelopmentMessage(encoder, decoder, devextensions.Message{Type: "register", Registration: &latest}); err != nil {
					alive = false
				}
			case <-heartbeat.C:
				if err := exchangeDevelopmentMessage(encoder, decoder, devextensions.Message{Type: "ping"}); err != nil {
					alive = false
				}
			}
		}
		heartbeat.Stop()
		_ = connection.Close()
		fmt.Fprintln(out, "Desktop disconnected; waiting to re-register...")
	}
}

func exchangeDevelopmentMessage(encoder *json.Encoder, decoder *json.Decoder, message devextensions.Message) error {
	if err := encoder.Encode(message); err != nil {
		return err
	}
	var response devextensions.Response
	if err := decoder.Decode(&response); err != nil {
		return err
	}
	if !response.OK {
		return errors.New(response.Message)
	}
	return nil
}

func relevantDevelopmentChange(event fsnotify.Event, root, runtimeEntry string) bool {
	if event.Op&(fsnotify.Write|fsnotify.Create|fsnotify.Rename) == 0 {
		return false
	}
	name := filepath.Clean(event.Name)
	if name == filepath.Join(root, alx.ManifestFile) || name == filepath.Join(root, "activelane.dev.json") || name == filepath.Join(root, filepath.FromSlash(runtimeEntry)) {
		return true
	}
	if strings.HasPrefix(name, filepath.Join(root, "src")+string(os.PathSeparator)) {
		switch strings.ToLower(filepath.Ext(name)) {
		case ".ts", ".tsx", ".js", ".jsx", ".vue":
			return true
		}
	}
	return false
}
