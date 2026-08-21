package seed

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/registry"
	"github.com/activelane/activelane/go/registryconfig"
)

type Options struct {
	RegistryID string
	Count      int
	Seed       int64
	Profile    Profile
	Output     string
	Keep       bool
	Progress   func(completed, total int)
}
type Result struct {
	Generated, Published, Existing int
	Directory                      string
}

func Run(ctx context.Context, config registryconfig.Config, options Options) (Result, error) {
	// Config contains slices; clone them before adding transient seed routes.
	registries := make([]registryconfig.Registry, len(config.Registries))
	copy(registries, config.Registries)
	for i := range registries {
		registries[i].Scopes = append([]string(nil), registries[i].Scopes...)
	}
	config.Registries = registries
	target, err := registryByID(config, options.RegistryID)
	if err != nil {
		return Result{}, err
	}
	if err := (registry.Publisher{}).CheckSeedSupport(ctx, target); err != nil {
		return Result{}, err
	}
	root := options.Output
	temporary := root == ""
	if temporary {
		root, err = os.MkdirTemp("", "activelane-seed-*")
		if err != nil {
			return Result{}, err
		}
	}
	if !temporary {
		root, err = filepath.Abs(root)
		if err != nil {
			return Result{}, err
		}
		if err = os.MkdirAll(root, 0755); err != nil {
			return Result{}, err
		}
	}
	if temporary && !options.Keep {
		defer os.RemoveAll(root)
	}
	projects, err := Generate(root, options.Count, options.Seed, options.Profile)
	if err != nil {
		return Result{}, err
	}
	// Seed publishers are routed transiently to the chosen registry; user configuration is not mutated.
	for _, publisher := range Publishers(options.Seed) {
		owned := false
		for _, scope := range target.Scopes {
			if scope == publisher {
				owned = true
				break
			}
		}
		if !owned {
			target.Scopes = append(target.Scopes, publisher)
		}
	}
	for i := range config.Registries {
		if config.Registries[i].ID == target.ID {
			config.Registries[i] = target
		}
	}
	result := Result{Generated: len(projects)}
	if !temporary || options.Keep {
		result.Directory = root
	}
	for _, project := range projects {
		if _, err := alx.ValidateFile(filepath.Join(project.Directory, alx.ManifestFile)); err != nil {
			return result, fmt.Errorf("validate %s: %w", project.Manifest.ID, err)
		}
		packagePath := filepath.Join(project.Directory, project.Manifest.Name+".alx")
		if _, err := alx.PackDir(project.Directory, packagePath); err != nil {
			return result, fmt.Errorf("pack %s: %w", project.Manifest.ID, err)
		}
		if _, err := alx.VerifyFile(packagePath); err != nil {
			return result, fmt.Errorf("verify %s: %w", project.Manifest.ID, err)
		}
		_, existing, err := (registry.Publisher{}).PublishSeedFile(ctx, config, target.ID, packagePath)
		if existing {
			result.Existing++
		} else if err != nil {
			return result, fmt.Errorf("publish %s: %w", project.Manifest.ID, err)
		} else {
			result.Published++
		}
		if options.Progress != nil {
			options.Progress(project.Index+1, len(projects))
		}
	}
	return result, nil
}

func Clean(config registryconfig.Config, registryID string) (int, error) {
	target, err := registryByID(config, registryID)
	if err != nil {
		return 0, err
	}
	return (registry.Publisher{}).CleanSeeded(context.Background(), target)
}

func registryByID(config registryconfig.Config, id string) (registryconfig.Registry, error) {
	for _, r := range config.Registries {
		if r.ID == id {
			return r, nil
		}
	}
	return registryconfig.Registry{}, fmt.Errorf("registry %q not found", id)
}
