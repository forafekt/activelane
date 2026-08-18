package seed

import (
	"encoding/json"
	"fmt"
	"hash/fnv"
	"math/rand"
	"os"
	"path/filepath"
	"strings"

	"github.com/activelane/activelane/go/alx"
)

type Profile string

const (
	MarketplaceDemo   Profile = "marketplace-demo"
	MarketplaceStress Profile = "marketplace-stress"
	Subscriptions     Profile = "subscriptions"
	Minimal           Profile = "minimal"
)

type Project struct {
	Index     int
	Manifest  alx.Manifest
	Directory string
}

var adjectives = []string{"Bright", "Clear", "Swift", "North", "Open", "Quiet", "Signal", "Pixel", "Cloud", "True", "Agile", "Nova", "Focus", "Clever", "Lumen", "Vector"}
var nouns = []string{"Board", "Flow", "Pulse", "Forge", "Desk", "Metrics", "Canvas", "Pilot", "Notes", "Watch", "Ledger", "Relay", "Studio", "Atlas", "Beacon", "Stack"}
var categories = []string{"Productivity", "Project Management", "Developer Tools", "Data", "Analytics", "AI", "Communication", "Design", "Monitoring", "Finance", "Automation", "Utilities", "Collaboration", "Knowledge"}
var capabilities = []string{"commands", "views", "themes", "search", "automation", "dashboards", "notifications", "data.import"}

func ValidateProfile(profile Profile) error {
	switch profile {
	case MarketplaceDemo, MarketplaceStress, Subscriptions, Minimal:
		return nil
	}
	return fmt.Errorf("unknown profile %q", profile)
}

func Publishers(seed int64) []string {
	base := []string{"northstar-labs", "copperline", "brightworks", "pixel-foundry", "openlane", "signalcraft", "orbit-tools", "lumen-systems", "vectorhouse", "relay-studio", "cloudmill", "atlas-data"}
	r := rand.New(rand.NewSource(seed ^ 0x51eed))
	r.Shuffle(len(base), func(i, j int) { base[i], base[j] = base[j], base[i] })
	return base
}

func Generate(root string, count int, seedValue int64, profile Profile) ([]Project, error) {
	if count < 0 {
		return nil, fmt.Errorf("count must be non-negative")
	}
	if err := ValidateProfile(profile); err != nil {
		return nil, err
	}
	publishers := Publishers(seedValue)
	projects := make([]Project, 0, count)
	seen := map[string]bool{}
	for i := 0; i < count; i++ {
		r := rand.New(rand.NewSource(itemSeed(seedValue, i)))
		display := adjectives[r.Intn(len(adjectives))] + " " + nouns[r.Intn(len(nouns))]
		slug := strings.ToLower(strings.ReplaceAll(display, " ", "-")) + fmt.Sprintf("-%04d", i+1)
		publisher := publishers[(i+r.Intn(3))%len(publishers)]
		id := "@" + publisher + "/" + slug
		if seen[id] {
			return nil, fmt.Errorf("duplicate generated id %s", id)
		}
		seen[id] = true
		category := categories[r.Intn(len(categories))]
		market := alx.Marketplace{Icon: "assets/icon.svg", Summary: fmt.Sprintf("A focused %s tool for modern teams.", strings.ToLower(category)), LongDescription: fmt.Sprintf("%s helps teams turn everyday %s work into a clear, repeatable workflow. Designed for fast setup and thoughtful collaboration.", display, strings.ToLower(category)), Categories: []string{category}, Capabilities: []string{capabilities[r.Intn(len(capabilities))]}, Highlights: []string{"Fast setup", "Team-friendly workflows", "Native ActiveLane integration"}, ReleaseNotes: "Initial stable marketplace release."}
		market.Plans = plans(r, profile)
		rawMarket, _ := json.Marshal(market)
		var raw map[string]any
		_ = json.Unmarshal(rawMarket, &raw)
		manifest := alx.Manifest{SchemaVersion: alx.ManifestSchemaVersion, ID: id, Publisher: publisher, Name: slug, DisplayName: display, Version: "1.0.0", Description: market.Summary, Entry: "extension/main.js", Engines: map[string]string{"activelane": "*"}, HostSupport: []string{"desktop", "browser"}, ExtensionKind: []string{"workbench"}, Visibility: "public", Raw: map[string]any{"marketplace": raw}}
		dir := filepath.Join(root, fmt.Sprintf("%04d-%s", i+1, slug))
		if err := writeProject(dir, manifest, r); err != nil {
			return nil, err
		}
		projects = append(projects, Project{Index: i, Manifest: manifest, Directory: dir})
	}
	return projects, nil
}

func itemSeed(seed int64, index int) int64 {
	h := fnv.New64a()
	fmt.Fprintf(h, "%d/%d", seed, index)
	return int64(h.Sum64())
}

func plans(r *rand.Rand, profile Profile) []alx.SubscriptionPlan {
	n := r.Intn(100)
	if profile == Subscriptions {
		n = 55 + r.Intn(45)
	}
	free := alx.SubscriptionPlan{ID: "free", Name: "Free", Interval: "none", Currency: "USD", Features: []string{"Core workspace tools"}, Entitlements: []string{"core"}}
	if n < 55 {
		return []alx.SubscriptionPlan{free}
	}
	trial := 0
	if n >= 90 || profile == Subscriptions {
		trial = 14
	}
	monthly := int64(500 + r.Intn(25)*100)
	paid := alx.SubscriptionPlan{ID: "pro", Name: "Pro", Interval: "monthly", PriceMinor: monthly, Currency: "USD", TrialDays: trial, Features: []string{"Unlimited projects", "Priority workflows"}, Entitlements: []string{"pro", "automation.advanced"}}
	if n < 75 || profile == Subscriptions {
		return []alx.SubscriptionPlan{free, paid}
	}
	paid.Interval = "yearly"
	paid.PriceMinor = monthly * 10
	return []alx.SubscriptionPlan{paid}
}

func writeProject(dir string, manifest alx.Manifest, r *rand.Rand) error {
	if err := os.MkdirAll(filepath.Join(dir, "extension"), 0755); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Join(dir, "assets"), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return err
	}
	data = append(data, '\n')
	if err := os.WriteFile(filepath.Join(dir, alx.ManifestFile), data, 0644); err != nil {
		return err
	}
	module := fmt.Sprintf("export default { manifest: { id: %q, name: %q, displayName: %q, version: %q }, async activate(context) {} }\n", manifest.ID, manifest.Name, manifest.DisplayName, manifest.Version)
	if err := os.WriteFile(filepath.Join(dir, "extension/main.js"), []byte(module), 0644); err != nil {
		return err
	}
	a, b := r.Intn(360), r.Intn(360)
	svg := fmt.Sprintf(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><defs><linearGradient id="g"><stop stop-color="hsl(%d 75%% 55%%)"/><stop offset="1" stop-color="hsl(%d 75%% 42%%)"/></linearGradient></defs><rect width="128" height="128" rx="28" fill="url(#g)"/><circle cx="64" cy="64" r="28" fill="white" opacity=".88"/></svg>`, a, b)
	return os.WriteFile(filepath.Join(dir, "assets/icon.svg"), []byte(svg), 0644)
}
