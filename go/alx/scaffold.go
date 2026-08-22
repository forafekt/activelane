package alx

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

type ScaffoldOptions struct {
	Directory   string
	Name        string
	Publisher   string
	DisplayName string
	Views       []string
	Runtime     bool
	Framework   string
}

const SDKVersion = "0.1.0"

var scaffoldViewLocations = map[string]string{
	"primary-sidebar":   "primary-sidebar",
	"secondary-sidebar": "secondary-sidebar",
	"editor":            "editor",
	"panel":             "panel",
}

func CreateScaffold(options ScaffoldOptions) error {
	if options.Directory == "" {
		return fmt.Errorf("scaffold directory is required")
	}
	if !segmentRE.MatchString(options.Name) || !segmentRE.MatchString(options.Publisher) {
		return fmt.Errorf("name and publisher must contain lowercase letters, numbers, or hyphens")
	}
	if options.DisplayName == "" {
		options.DisplayName = displayName(options.Name)
	}
	if options.Framework == "" {
		options.Framework = "vanilla"
	}
	if options.Framework != "vanilla" {
		return fmt.Errorf("unsupported framework %q (supported: vanilla)", options.Framework)
	}
	if len(options.Views) == 0 {
		options.Views = []string{"primary-sidebar", "editor"}
	}
	seen := map[string]bool{}
	for _, view := range options.Views {
		if _, ok := scaffoldViewLocations[view]; !ok {
			return fmt.Errorf("unsupported view %q", view)
		}
		if seen[view] {
			return fmt.Errorf("duplicate view %q", view)
		}
		seen[view] = true
	}
	if _, err := os.Stat(options.Directory); err == nil {
		entries, readErr := os.ReadDir(options.Directory)
		if readErr != nil {
			return readErr
		}
		if len(entries) != 0 {
			return fmt.Errorf("destination %s is not empty", options.Directory)
		}
	} else if !os.IsNotExist(err) {
		return err
	}
	if err := os.MkdirAll(options.Directory, 0o755); err != nil {
		return err
	}
	files, err := scaffoldFiles(options)
	if err != nil {
		return err
	}
	for name, contents := range files {
		filename := filepath.Join(options.Directory, filepath.FromSlash(name))
		if err := os.MkdirAll(filepath.Dir(filename), 0o755); err != nil {
			return err
		}
		if err := os.WriteFile(filename, []byte(contents), 0o644); err != nil {
			return err
		}
	}
	return nil
}

func scaffoldFiles(options ScaffoldOptions) (map[string]string, error) {
	extensionID := "@" + options.Publisher + "/" + options.Name
	hasEditor := false
	containers := make([]map[string]any, 0, len(options.Views))
	views := make([]map[string]any, 0, len(options.Views))
	inputs := make([]string, 0, len(options.Views)+1)
	developmentViews := map[string]string{}
	files := map[string]string{}
	for _, location := range options.Views {
		if location == "editor" {
			hasEditor = true
		}
		short := strings.TrimSuffix(location, "-sidebar")
		containerID := options.Name + "." + short
		viewID := options.Name + "." + short
		containers = append(containers, map[string]any{"id": containerID, "location": location, "title": options.DisplayName})
		view := map[string]any{"id": viewID, "container": containerID, "title": options.DisplayName, "renderer": map[string]any{"type": "isolated", "entry": "dist/views/" + short + "/index.html"}}
		if location == "editor" {
			view["multiple"] = true
		}
		views = append(views, view)
		developmentViews["dist/views/"+short+"/index.html"] = "src/views/" + short + "/index.html"
		inputs = append(inputs, fmt.Sprintf("        'views/%s/index': resolve(import.meta.dirname, 'src/views/%s/index.html'),", short, short))
		files["src/views/"+short+"/index.html"] = "<div id=\"app\"></div>\n<script type=\"module\" src=\"./main.ts\"></script>\n"
		files["src/views/"+short+"/main.ts"] = viewMainTemplate(options.DisplayName, location)
	}
	entry := "dist/extension.js"
	if options.Runtime {
		files["src/runtime/extension.ts"] = runtimeTemplate(extensionID, options.Name, options.DisplayName, hasEditor)
		inputs = append([]string{"        extension: resolve(import.meta.dirname, 'src/runtime/extension.ts'),"}, inputs...)
	} else {
		files["src/runtime.ts"] = "export default { manifest: { id: '" + extensionID + "', name: '" + options.Name + "', displayName: '" + options.DisplayName + "', version: '0.1.0' } }\n"
		inputs = append([]string{"        extension: resolve(import.meta.dirname, 'src/runtime.ts'),"}, inputs...)
	}
	developmentRuntime := "src/runtime.ts"
	if options.Runtime {
		developmentRuntime = "src/runtime/extension.ts"
	}
	developmentConfig, err := json.MarshalIndent(map[string]any{"runtime": developmentRuntime, "views": developmentViews}, "", "  ")
	if err != nil {
		return nil, err
	}
	files["activelane.dev.json"] = string(developmentConfig) + "\n"
	contributes := map[string]any{"containers": containers, "views": views}
	if options.Runtime && hasEditor {
		contributes["commands"] = []map[string]any{{"id": options.Name + ".open", "title": options.DisplayName + ": Open"}}
	}
	manifest := map[string]any{
		"schemaVersion": "1.0.0", "id": extensionID, "publisher": options.Publisher, "name": options.Name,
		"displayName": options.DisplayName, "version": "0.1.0", "description": options.DisplayName + " for ActiveLane.",
		"entry": entry, "engines": map[string]string{"activelane": ">=0.1.0"}, "hostSupport": []string{"desktop"},
		"extensionKind": []string{"workbench"}, "visibility": "private", "contributes": contributes,
	}
	manifestBytes, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return nil, err
	}
	files[ManifestFile] = string(manifestBytes) + "\n"
	files["package.json"] = fmt.Sprintf("{\n  \"name\": %q,\n  \"version\": \"0.1.0\",\n  \"private\": true,\n  \"type\": \"module\",\n  \"scripts\": { \"build\": \"vite build\", \"dev\": \"vite\" },\n  \"dependencies\": { \"@activelane/extension\": \"^%s\" },\n  \"devDependencies\": { \"esbuild\": \"^0.27.0\", \"typescript\": \"~6.0.0\", \"vite\": \"^8.0.0\" }\n}\n", extensionID, SDKVersion)
	files["pnpm-workspace.yaml"] = "allowBuilds:\n  esbuild: true\n"
	files["tsconfig.json"] = "{\n  \"compilerOptions\": { \"target\": \"ES2022\", \"module\": \"ESNext\", \"moduleResolution\": \"Bundler\", \"strict\": true, \"lib\": [\"ES2022\", \"DOM\"] },\n  \"include\": [\"src\"]\n}\n"
	files["vite.config.ts"] = "import { resolve } from 'node:path'\nimport { defineConfig } from 'vite'\n\nexport default defineConfig({\n  root: resolve(import.meta.dirname, 'src'),\n  base: './',\n  server: { cors: true },\n  build: {\n    outDir: resolve(import.meta.dirname, 'dist'),\n    emptyOutDir: true,\n    rollupOptions: {\n      preserveEntrySignatures: 'strict',\n      input: {\n" + strings.Join(inputs, "\n") + "\n      },\n      output: { entryFileNames: chunk => chunk.name === 'extension' ? 'extension.js' : 'assets/[name]-[hash].js' },\n    },\n  },\n})\n"
	files["README.md"] = fmt.Sprintf(`# %s

- Runtime lifecycle: `+"`src/runtime/extension.ts`"+`
- Isolated applications: `+"`src/views/<view>/`"+`
- Production contributions: `+"`activelane.manifest.json`"+`
- Development source mapping: `+"`activelane.dev.json`"+`

The runtime opens a view with `+"`runtime.workbench.openView()`"+`. Its logical `+"`resource`"+` controls
reveal-versus-create behavior, while `+"`context`"+` is delivered to that isolated instance through
`+"`connectActiveLaneView()`"+` from `+"`@activelane/extension/view`"+`.

%s

Build and package:

`+"```bash"+`
alx build
alx validate
alx pack --output %s.alx
alx verify %s.alx
`+"```"+`

ActiveLane extension guide: https://activelane.dev/docs/extensions
`, options.DisplayName, "Run `alx dev` alongside the ActiveLane desktop application for runtime reload and view HMR.", options.Name, options.Name)
	return files, nil
}

func displayName(name string) string {
	parts := strings.Split(name, "-")
	for index, part := range parts {
		if part != "" {
			parts[index] = strings.ToUpper(part[:1]) + part[1:]
		}
	}
	return strings.Join(parts, " ")
}

func viewMainTemplate(title, location string) string {
	return fmt.Sprintf("import { connectActiveLaneView } from '@activelane/extension/view'\n\nconst activelane = await connectActiveLaneView()\nconst context = await activelane.view.getContext<Record<string, unknown>>()\nconst root = document.querySelector<HTMLDivElement>('#app')!\nroot.innerHTML = `<main><h1>%s</h1><p>%s view connected.</p><pre>${JSON.stringify(context, null, 2)}</pre></main>`\nconst applyTheme = (theme: { tokens: Record<string, string> }) => {\n  for (const [name, value] of Object.entries(theme.tokens)) document.documentElement.style.setProperty(name, value)\n}\napplyTheme(await activelane.theme.getCurrent())\nactivelane.theme.onDidChange(applyTheme)\nwindow.addEventListener('beforeunload', () => activelane.dispose(), { once: true })\n", title, location)
}

func runtimeTemplate(id, name, title string, hasEditor bool) string {
	if !hasEditor {
		return fmt.Sprintf("import { defineExtension } from '@activelane/extension'\n\nexport default defineExtension({\n  manifest: { id: %q, name: %q, displayName: %q, version: '0.1.0' },\n})\n", id, name, title)
	}
	return fmt.Sprintf("import { defineExtension } from '@activelane/extension'\n\nexport default defineExtension({\n  manifest: { id: %q, name: %q, displayName: %q, version: '0.1.0' },\n  activate(runtime) {\n    runtime.contribute.commands({\n      id: %q,\n      title: %q,\n      run: () => runtime.workbench.openView(%q, { resource: 'default', context: {} }),\n    })\n  },\n})\n", id, name, title, name+".open", title+": Open", name+".editor")
}

func SupportedScaffoldViews() []string {
	values := make([]string, 0, len(scaffoldViewLocations))
	for value := range scaffoldViewLocations {
		values = append(values, value)
	}
	sort.Strings(values)
	return values
}
