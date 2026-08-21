package seed

import (
	"encoding/json"
	"testing"
)

func TestGenerateIsDeterministicUniqueAndReusesPublishers(t *testing.T) {
	a, err := Generate(t.TempDir(), 100, 42, MarketplaceDemo)
	if err != nil {
		t.Fatal(err)
	}
	b, err := Generate(t.TempDir(), 100, 42, MarketplaceDemo)
	if err != nil {
		t.Fatal(err)
	}
	if len(a) != 100 || len(b) != 100 {
		t.Fatalf("unexpected counts %d %d", len(a), len(b))
	}
	ids, publishers := map[string]bool{}, map[string]int{}
	for i := range a {
		left, _ := json.Marshal(a[i].Manifest)
		right, _ := json.Marshal(b[i].Manifest)
		if string(left) != string(right) {
			t.Fatalf("item %d differs for same seed", i)
		}
		if ids[a[i].Manifest.ID] {
			t.Fatalf("duplicate id %s", a[i].Manifest.ID)
		}
		ids[a[i].Manifest.ID] = true
		publishers[a[i].Manifest.Publisher]++
		if err := a[i].Manifest.Validate(); err != nil {
			t.Fatalf("invalid item %d: %v", i, err)
		}
	}
	if len(publishers) >= len(a) {
		t.Fatal("expected publisher reuse")
	}
	c, err := Generate(t.TempDir(), 1, 43, MarketplaceDemo)
	if err != nil {
		t.Fatal(err)
	}
	if c[0].Manifest.ID == a[0].Manifest.ID {
		t.Fatal("different seeds produced same first identity")
	}
}

func TestProfilePricingDistribution(t *testing.T) {
	projects, err := Generate(t.TempDir(), 400, 42, MarketplaceDemo)
	if err != nil {
		t.Fatal(err)
	}
	free, paid, trial := 0, 0, 0
	for _, p := range projects {
		market, err := p.Manifest.Marketplace()
		if err != nil {
			t.Fatal(err)
		}
		if len(market.Plans) == 1 && market.Plans[0].PriceMinor == 0 {
			free++
		}
		for _, plan := range market.Plans {
			if plan.PriceMinor > 0 {
				paid++
			}
			if plan.TrialDays > 0 {
				trial++
			}
		}
	}
	if free < 180 || free > 260 {
		t.Fatalf("free distribution out of range: %d", free)
	}
	if paid == 0 || trial == 0 {
		t.Fatalf("expected paid and trial plans: paid=%d trial=%d", paid, trial)
	}
}
