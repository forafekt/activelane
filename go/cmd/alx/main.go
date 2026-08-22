package main

import (
	"context"
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/install"
	reg "github.com/activelane/activelane/go/registry"
	"github.com/activelane/activelane/go/registryconfig"
	"github.com/activelane/activelane/go/seed"
)

func main() {
	if err := run(os.Args[1:], os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "alx:", err)
		os.Exit(1)
	}
}

func run(args []string, out io.Writer) error {
	if len(args) == 0 || args[0] == "help" || args[0] == "--help" {
		usage(out)
		return nil
	}
	switch args[0] {
	case "create":
		return createExtension(args[1:], out)
	case "validate":
		return validate(args[1:], out)
	case "build":
		return buildExtension(args[1:], out)
	case "dev":
		return devExtension(args[1:], out)
	case "pack":
		return pack(args[1:], out)
	case "inspect", "verify":
		return inspect(args[1:], out, args[0] == "verify")
	case "registry":
		return registryCommand(args[1:], out)
	case "search":
		return search(args[1:], out)
	case "info":
		return info(args[1:], out)
	case "publish":
		return publish(args[1:], out)
	case "seed":
		return seedCommand(args[1:], out)
	case "install":
		return installCommand(args[1:], out)
	default:
		return fmt.Errorf("unknown command %q (run alx --help)", args[0])
	}
}

func usage(w io.Writer) {
	fmt.Fprint(w, `alx - ActiveLane extension package and registry tool

Usage:
  alx create NAME [--publisher PUBLISHER] [--display-name NAME]
                  [--view primary-sidebar|secondary-sidebar|editor|panel]
                  [--framework vanilla]
                  [--no-runtime]
  alx validate [manifest]
  alx build [directory] [--runner pnpm|npm|yarn]
  alx dev [directory] [--runner pnpm|npm|yarn] [--port PORT]
  alx pack [directory] --output extension.alx
  alx inspect extension.alx [--json]
  alx verify extension.alx
  alx registry list|add|remove|enable|disable|test
  alx search QUERY [--json]
  alx info namespace/name[@version] [--json]
  alx publish extension.alx --registry ID
  alx seed [--registry ID] [--profile marketplace-demo] [--count 500] [--seed 42]
  alx seed clean --registry ID
  alx seed status --registry ID
  alx install namespace/name@exact-version [--root DIR]

Configuration defaults to ~/.config/activelane/registries.json and may be
overridden with ACTIVELANE_REGISTRY_CONFIG. Credentials are not stored there.
The repository local profile is examples/registries.local.json; from the
repository root, pnpm registry:dev and pnpm marketplace:seed use it together.
`)
}

type stringValues []string

func (values *stringValues) String() string { return strings.Join(*values, ",") }
func (values *stringValues) Set(value string) error {
	*values = append(*values, value)
	return nil
}

func createExtension(args []string, out io.Writer) error {
	fs := flag.NewFlagSet("create", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	publisher := fs.String("publisher", "local", "extension publisher")
	displayName := fs.String("display-name", "", "human-readable extension name")
	noRuntime := fs.Bool("no-runtime", false, "omit the lifecycle runtime")
	framework := fs.String("framework", "vanilla", "isolated view framework")
	var views stringValues
	fs.Var(&views, "view", "Workbench view location (repeatable)")
	known := map[string]bool{"--publisher": true, "--display-name": true, "--view": true, "--framework": true, "--no-runtime": false}
	if err := fs.Parse(flagsFirst(args, known)); err != nil {
		return err
	}
	if fs.NArg() > 1 {
		return fmt.Errorf("create accepts one extension name")
	}
	name := "example"
	if fs.NArg() == 1 {
		name = filepath.Base(filepath.Clean(fs.Arg(0)))
	}
	directory := name
	if fs.NArg() == 1 && (strings.Contains(fs.Arg(0), string(os.PathSeparator)) || fs.Arg(0) == ".") {
		directory = fs.Arg(0)
	}
	if err := alx.CreateScaffold(alx.ScaffoldOptions{Directory: directory, Name: name, Publisher: *publisher, DisplayName: *displayName, Views: views, Runtime: !*noRuntime, Framework: *framework}); err != nil {
		return err
	}
	fmt.Fprintf(out, "Created @%s/%s in %s\n\nNext steps:\n  cd %s\n  pnpm install\n  alx build\n  alx validate\n  alx pack --output %s.alx\n", *publisher, name, directory, directory, name)
	return nil
}

func validate(args []string, out io.Writer) error {
	file := alx.ManifestFile
	if len(args) > 0 {
		file = args[0]
	} else {
		root, err := discoverProjectRoot(".")
		if err != nil {
			return err
		}
		file = filepath.Join(root, alx.ManifestFile)
	}
	m, e := alx.ValidateFile(file)
	if e != nil {
		return e
	}
	fmt.Fprintf(out, "Valid %s %s\n", m.ID, m.Version)
	return nil
}

func buildExtension(args []string, out io.Writer) error {
	fs := flag.NewFlagSet("build", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	runner := fs.String("runner", "pnpm", "package manager used to run the build script")
	if err := fs.Parse(flagsFirst(args, map[string]bool{"--runner": true})); err != nil {
		return err
	}
	directory := "."
	if fs.NArg() > 1 {
		return fmt.Errorf("build accepts one extension directory")
	}
	if fs.NArg() == 1 {
		directory = fs.Arg(0)
	} else {
		var err error
		directory, err = discoverProjectRoot(directory)
		if err != nil {
			return err
		}
	}
	var command *exec.Cmd
	switch *runner {
	case "pnpm", "yarn":
		command = exec.Command(*runner, "run", "build")
	case "npm":
		command = exec.Command("npm", "run", "build")
	default:
		return fmt.Errorf("unsupported build runner %q", *runner)
	}
	command.Dir = directory
	command.Stdout = out
	command.Stderr = out
	if err := command.Run(); err != nil {
		return fmt.Errorf("extension build failed: %w", err)
	}
	manifest, err := alx.ValidateFile(filepath.Join(directory, alx.ManifestFile))
	if err != nil {
		return fmt.Errorf("build output is invalid: %w", err)
	}
	fmt.Fprintf(out, "Built and validated %s %s\n", manifest.ID, manifest.Version)
	return nil
}

func pack(args []string, out io.Writer) error {
	fs := flag.NewFlagSet("pack", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	output := fs.String("output", "", "output .alx path")
	if e := fs.Parse(flagsFirst(args, map[string]bool{"--output": true})); e != nil {
		return e
	}
	dir := "."
	if fs.NArg() > 0 {
		dir = fs.Arg(0)
	} else {
		var err error
		dir, err = discoverProjectRoot(dir)
		if err != nil {
			return err
		}
	}
	if *output == "" {
		*output = filepath.Base(filepath.Clean(dir)) + ".alx"
	}
	i, e := alx.PackDir(dir, *output)
	if e != nil {
		return e
	}
	fmt.Fprintf(out, "Packed %s (%d bytes, %s)\n", *output, i.Size, i.Digest)
	return nil
}

func discoverProjectRoot(start string) (string, error) {
	current, err := filepath.Abs(start)
	if err != nil {
		return "", fmt.Errorf("resolve extension project directory: %w", err)
	}
	if info, statErr := os.Stat(current); statErr == nil && !info.IsDir() {
		current = filepath.Dir(current)
	}
	for {
		manifest := filepath.Join(current, alx.ManifestFile)
		if info, statErr := os.Stat(manifest); statErr == nil && info.Mode().IsRegular() {
			return current, nil
		}
		parent := filepath.Dir(current)
		if parent == current {
			return "", fmt.Errorf("no %s found from %s or its parents", alx.ManifestFile, start)
		}
		current = parent
	}
}

func inspect(args []string, out io.Writer, verify bool) error {
	fs := flag.NewFlagSet("inspect", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	asJSON := fs.Bool("json", false, "JSON output")
	if e := fs.Parse(flagsFirst(args, map[string]bool{"--json": false})); e != nil {
		return e
	}
	if fs.NArg() != 1 {
		return fmt.Errorf("package path is required")
	}
	i, e := alx.InspectFile(fs.Arg(0))
	if e != nil {
		return e
	}
	if *asJSON {
		data, _ := alx.MarshalInspection(i)
		fmt.Fprintln(out, string(data))
	} else if verify {
		fmt.Fprintf(out, "Verified %s %s (%s)\n", i.Manifest.ID, i.Manifest.Version, i.Digest)
	} else {
		fmt.Fprintf(out, "%s %s\nDigest: %s\nSize: %d\nFiles: %d\n", i.Manifest.ID, i.Manifest.Version, i.Digest, i.Size, len(i.Files))
	}
	return nil
}

func loadConfig() (registryconfig.Config, string, error) {
	p := registryconfig.DefaultPath()
	c, e := registryconfig.Load(p)
	if errors.Is(e, os.ErrNotExist) {
		c = registryconfig.Config{Version: 1, Registries: []registryconfig.Registry{}}
		e = nil
	}
	return c, p, e
}

func registryCommand(args []string, out io.Writer) error {
	if len(args) == 0 {
		return fmt.Errorf("registry subcommand required")
	}
	c, p, e := loadConfig()
	if e != nil {
		return e
	}
	switch args[0] {
	case "list":
		c.Sort()
		data, _ := json.MarshalIndent(c, "", "  ")
		fmt.Fprintln(out, string(data))
		return nil
	case "add":
		fs := flag.NewFlagSet("registry add", flag.ContinueOnError)
		typ := fs.String("type", "remote", "remote or directory")
		url := fs.String("url", "", "remote URL")
		path := fs.String("path", "", "directory registry path")
		scopes := fs.String("scopes", "", "comma-separated namespaces")
		priority := fs.Int("priority", 50, "display priority")
		if e = fs.Parse(flagsFirst(args[1:], map[string]bool{"--type": true, "--url": true, "--path": true, "--scopes": true, "--priority": true})); e != nil {
			return e
		}
		if fs.NArg() != 1 {
			return fmt.Errorf("registry id required")
		}
		c.Registries = append(c.Registries, registryconfig.Registry{ID: fs.Arg(0), Type: *typ, URL: *url, Path: *path, Enabled: true, Priority: *priority, Scopes: split(*scopes)})
		e = registryconfig.Save(p, c)
	case "remove":
		if len(args) != 2 {
			return fmt.Errorf("registry id required")
		}
		next := c.Registries[:0]
		found := false
		for _, r := range c.Registries {
			if r.ID == args[1] {
				found = true
			} else {
				next = append(next, r)
			}
		}
		if !found {
			return fmt.Errorf("registry %q not found", args[1])
		}
		c.Registries = next
		e = registryconfig.Save(p, c)
	case "enable", "disable":
		if len(args) != 2 {
			return fmt.Errorf("registry id required")
		}
		found := false
		for n := range c.Registries {
			if c.Registries[n].ID == args[1] {
				c.Registries[n].Enabled = args[0] == "enable"
				found = true
			}
		}
		if !found {
			return fmt.Errorf("registry %q not found", args[1])
		}
		e = registryconfig.Save(p, c)
	case "test":
		if len(args) != 2 {
			return fmt.Errorf("registry id required")
		}
		r, e := byID(c, args[1])
		if e != nil {
			return e
		}
		if r.Type == "directory" {
			path, e := registryconfig.ExpandPath(r.Path)
			if e != nil {
				return e
			}
			_, e = reg.NewStore(path)
			if e != nil {
				return e
			}
			fmt.Fprintf(out, "Registry %s is available at %s\n", r.ID, path)
			return nil
		}
		discovery, discoverErr := (reg.SourceClient{}).Discover(context.Background(), r)
		e = discoverErr
		if e == nil {
			data, _ := json.MarshalIndent(discovery, "", "  ")
			fmt.Fprintln(out, string(data))
		}
		return e
	default:
		return fmt.Errorf("unknown registry subcommand %q", args[0])
	}
	if e == nil {
		fmt.Fprintf(out, "Updated %s\n", p)
	}
	return e
}

func search(args []string, out io.Writer) error {
	fs := flag.NewFlagSet("search", flag.ContinueOnError)
	asJSON := fs.Bool("json", false, "JSON output")
	if e := fs.Parse(flagsFirst(args, map[string]bool{"--json": false})); e != nil {
		return e
	}
	if fs.NArg() != 1 {
		return fmt.Errorf("search query required")
	}
	c, _, e := loadConfig()
	if e != nil {
		return e
	}
	type result struct {
		RegistryID string        `json:"registryId"`
		Extension  reg.Extension `json:"extension"`
	}
	var results []result
	for _, r := range c.Registries {
		if !r.Enabled {
			continue
		}
		items, e := searchRegistry(r, fs.Arg(0))
		if e != nil {
			return fmt.Errorf("registry %s: %w", r.ID, e)
		}
		for _, item := range items {
			results = append(results, result{r.ID, item})
		}
	}
	if *asJSON {
		data, _ := json.MarshalIndent(results, "", "  ")
		fmt.Fprintln(out, string(data))
	} else {
		for _, x := range results {
			fmt.Fprintf(out, "%s\t%s\t%s\n", x.Extension.ID, x.Extension.LatestVersion, x.RegistryID)
		}
	}
	return nil
}

func info(args []string, out io.Writer) error {
	fs := flag.NewFlagSet("info", flag.ContinueOnError)
	asJSON := fs.Bool("json", false, "JSON output")
	if e := fs.Parse(flagsFirst(args, map[string]bool{"--json": false})); e != nil {
		return e
	}
	if fs.NArg() != 1 {
		return fmt.Errorf("extension identity required")
	}
	spec := strings.TrimPrefix(fs.Arg(0), "@")
	at := strings.LastIndex(spec, "@")
	version := ""
	if at > 0 {
		version = spec[at+1:]
		spec = spec[:at]
	}
	parts := strings.Split(spec, "/")
	if len(parts) != 2 {
		return fmt.Errorf("identity must be namespace/name")
	}
	c, _, e := loadConfig()
	if e != nil {
		return e
	}
	r, e := c.Resolve(parts[0])
	if e != nil {
		return e
	}
	var value any
	if version != "" {
		value, e = getVersion(r, parts[0], parts[1], version)
	} else {
		value, e = getExtension(r, parts[0], parts[1])
	}
	if e != nil {
		return e
	}
	data, _ := json.MarshalIndent(value, "", "  ")
	if *asJSON {
		fmt.Fprintln(out, string(data))
	} else {
		fmt.Fprintln(out, string(data))
	}
	return nil
}

func publish(args []string, out io.Writer) error {
	fs := flag.NewFlagSet("publish", flag.ContinueOnError)
	id := fs.String("registry", "", "registry id")
	if e := fs.Parse(flagsFirst(args, map[string]bool{"--registry": true})); e != nil {
		return e
	}
	if fs.NArg() != 1 || *id == "" {
		return fmt.Errorf("package and --registry are required")
	}
	c, _, e := loadConfig()
	if e != nil {
		return e
	}
	v, e := (reg.Publisher{}).PublishFile(context.Background(), c, *id, fs.Arg(0))
	if e != nil {
		return e
	}
	fmt.Fprintf(out, "Published %s@%s to %s (%s)\n", v.ExtensionID, v.Version, *id, v.Artifact.Digest)
	return nil
}

func seedCommand(args []string, out io.Writer) error {
	if len(args) > 0 && (args[0] == "--help" || args[0] == "help") {
		fmt.Fprint(out, `Usage:
  alx seed --registry ID [--profile PROFILE] [--count N] [--seed N]
           [--output DIRECTORY] [--keep]
  alx seed clean --registry ID
  alx seed status --registry ID

Profiles: marketplace-demo, marketplace-stress, subscriptions, minimal.
Registry IDs are resolved through ACTIVELANE_REGISTRY_CONFIG or
~/.config/activelane/registries.json. The default seed is 42. Generated
projects are temporary unless --keep or --output is supplied. Repeating a seed
is safe; clean removes seeded data only.
`)
		return nil
	}
	clean := len(args) > 0 && args[0] == "clean"
	status := len(args) > 0 && args[0] == "status"
	if clean || status {
		args = args[1:]
	}
	fs := flag.NewFlagSet("seed", flag.ContinueOnError)
	fs.SetOutput(io.Discard)
	registryID := fs.String("registry", "local", "registry id")
	count := fs.Int("count", -1, "number of extensions")
	seedValue := fs.Int64("seed", 42, "deterministic random seed")
	profile := fs.String("profile", string(seed.MarketplaceDemo), "marketplace-demo, marketplace-stress, subscriptions, or minimal")
	output := fs.String("output", "", "generated project directory")
	keep := fs.Bool("keep", false, "retain temporary generated projects")
	known := map[string]bool{"--registry": true, "--count": true, "--seed": true, "--profile": true, "--output": true, "--keep": false}
	if e := fs.Parse(flagsFirst(args, known)); e != nil {
		return e
	}
	if fs.NArg() != 0 {
		return fmt.Errorf("unexpected argument %q", fs.Arg(0))
	}
	c, _, e := loadConfig()
	if e != nil {
		return e
	}
	target, e := byID(c, *registryID)
	if e != nil {
		return e
	}
	if status {
		items, e := searchRegistry(target, "")
		if e != nil {
			return fmt.Errorf("unable to query registry %q (%s): %w", *registryID, registryLocation(target), e)
		}
		fmt.Fprintf(out, "Registry: %s (%s)\nExtensions: %d\n", *registryID, registryLocation(target), len(items))
		return nil
	}
	if clean {
		n, e := seed.Clean(c, *registryID)
		if e == nil {
			fmt.Fprintf(out, "Removed %d seeded extension versions from %s\n", n, *registryID)
		}
		return e
	}
	if *count < 0 {
		if seed.Profile(*profile) == seed.Minimal {
			*count = 12
		} else {
			*count = 100
		}
	}
	fmt.Fprintf(out, "ActiveLane marketplace seed\n\nRegistry: %s (%s)\nProfile:  %s\nSeed:     %d\nCount:    %d\n\nGenerating and publishing extensions...\n", *registryID, registryLocation(target), *profile, *seedValue, *count)
	progress := func(completed, total int) {
		if completed == total || completed%100 == 0 {
			fmt.Fprintf(out, "%d / %d\n", completed, total)
		}
	}
	result, e := seed.Run(context.Background(), c, seed.Options{RegistryID: *registryID, Count: *count, Seed: *seedValue, Profile: seed.Profile(*profile), Output: *output, Keep: *keep, Progress: progress})
	if e != nil {
		return fmt.Errorf("seed failed for registry %q (%s): %w\n\nStart the local registry with:\n\n    pnpm registry:dev", *registryID, registryLocation(target), e)
	}
	fmt.Fprintf(out, "\nSeed complete\n\nGenerated: %d\nValidated: %d\nPacked:    %d\nVerified:  %d\nPublished: %d\nExisting:  %d\nFailed:    0\n", result.Generated, result.Generated, result.Generated, result.Generated, result.Published, result.Existing)
	if result.Directory != "" {
		fmt.Fprintf(out, "Generated projects retained at %s\n", result.Directory)
	}
	return nil
}

func registryLocation(registry registryconfig.Registry) string {
	if registry.Type == "remote" {
		return registry.URL
	}
	return registry.Path
}

func installCommand(args []string, out io.Writer) error {
	fs := flag.NewFlagSet("install", flag.ContinueOnError)
	root := fs.String("root", install.DefaultRoot(), "installation root")
	if e := fs.Parse(flagsFirst(args, map[string]bool{"--root": true})); e != nil {
		return e
	}
	if fs.NArg() != 1 {
		return fmt.Errorf("exact extension spec required")
	}
	c, _, e := loadConfig()
	if e != nil {
		return e
	}
	record, e := (install.Installer{Root: *root}).Install(context.Background(), c, fs.Arg(0))
	if e != nil {
		return e
	}
	data, _ := json.MarshalIndent(record, "", "  ")
	fmt.Fprintln(out, string(data))
	return nil
}

func split(v string) []string {
	var out []string
	for _, x := range strings.Split(v, ",") {
		if x = strings.TrimSpace(x); x != "" {
			out = append(out, x)
		}
	}
	return out
}

// flagsFirst preserves the documented CLI style while accommodating flag.FlagSet's
// default behaviour of stopping at the first positional argument.
func flagsFirst(args []string, flags map[string]bool) []string {
	var options, positional []string
	for i := 0; i < len(args); i++ {
		name := strings.SplitN(args[i], "=", 2)[0]
		needsValue, known := flags[name]
		if !known {
			positional = append(positional, args[i])
			continue
		}
		options = append(options, args[i])
		if needsValue && !strings.Contains(args[i], "=") && i+1 < len(args) {
			i++
			options = append(options, args[i])
		}
	}
	return append(options, positional...)
}

func byID(c registryconfig.Config, id string) (registryconfig.Registry, error) {
	for _, r := range c.Registries {
		if r.ID == id {
			return r, nil
		}
	}
	return registryconfig.Registry{}, fmt.Errorf("registry %q not found", id)
}

func searchRegistry(r registryconfig.Registry, q string) ([]reg.Extension, error) {
	return (reg.SourceClient{}).Search(context.Background(), r, q)
}

func getExtension(r registryconfig.Registry, ns, name string) (reg.Extension, error) {
	return (reg.SourceClient{}).GetExtension(context.Background(), r, ns, name)
}

func getVersion(r registryconfig.Registry, ns, name, version string) (reg.Version, error) {
	return (reg.SourceClient{}).GetVersion(context.Background(), r, ns, name, version)
}
