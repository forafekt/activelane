package alx

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
)

var (
	currencyRE    = regexp.MustCompile(`^[A-Z]{3}$`)
	entitlementRE = regexp.MustCompile(`^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$`)
)

// Marketplace contains optional, reusable listing and commercial metadata.
type Marketplace struct {
	Icon            string             `json:"icon,omitempty"`
	Summary         string             `json:"summary,omitempty"`
	LongDescription string             `json:"longDescription,omitempty"`
	Categories      []string           `json:"categories,omitempty"`
	Capabilities    []string           `json:"capabilities,omitempty"`
	Highlights      []string           `json:"highlights,omitempty"`
	Media           []MarketplaceMedia `json:"media,omitempty"`
	ReleaseNotes    string             `json:"releaseNotes,omitempty"`
	Plans           []SubscriptionPlan `json:"plans,omitempty"`
}

type MarketplaceMedia struct {
	Type    string `json:"type"`
	Source  string `json:"source"`
	Title   string `json:"title,omitempty"`
	AltText string `json:"altText,omitempty"`
}

// SubscriptionPlan uses minor currency units so prices never pass through floats.
type SubscriptionPlan struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Description  string   `json:"description,omitempty"`
	Interval     string   `json:"interval"`
	PriceMinor   int64    `json:"priceMinor"`
	Currency     string   `json:"currency"`
	TrialDays    int      `json:"trialDays,omitempty"`
	Features     []string `json:"features,omitempty"`
	Entitlements []string `json:"entitlements,omitempty"`
}

func (m Manifest) Marketplace() (Marketplace, error) {
	value, ok := m.Raw["marketplace"]
	if !ok {
		return Marketplace{}, nil
	}
	data, err := json.Marshal(value)
	if err != nil {
		return Marketplace{}, err
	}
	var marketplace Marketplace
	if err := json.Unmarshal(data, &marketplace); err != nil {
		return Marketplace{}, fmt.Errorf("marketplace: %w", err)
	}
	return marketplace, nil
}

func validateMarketplace(marketplace Marketplace) []string {
	var issues []string
	planIDs := map[string]bool{}
	for index, plan := range marketplace.Plans {
		prefix := fmt.Sprintf("marketplace.plans.%d", index)
		if !segmentRE.MatchString(plan.ID) {
			issues = append(issues, prefix+".id: must be a lowercase identifier")
		} else if planIDs[plan.ID] {
			issues = append(issues, prefix+".id: duplicate plan ID")
		}
		planIDs[plan.ID] = true
		if strings.TrimSpace(plan.Name) == "" {
			issues = append(issues, prefix+".name: must be non-empty")
		}
		if plan.Interval != "none" && plan.Interval != "monthly" && plan.Interval != "yearly" {
			issues = append(issues, prefix+".interval: must be none, monthly, or yearly")
		}
		if plan.PriceMinor < 0 {
			issues = append(issues, prefix+".priceMinor: must be non-negative")
		}
		if plan.Interval == "none" && plan.PriceMinor != 0 {
			issues = append(issues, prefix+".priceMinor: non-recurring plans must be free")
		}
		if plan.TrialDays < 0 {
			issues = append(issues, prefix+".trialDays: must be non-negative")
		}
		if !currencyRE.MatchString(plan.Currency) {
			issues = append(issues, prefix+".currency: must be a three-letter uppercase code")
		}
		seen := map[string]bool{}
		for entitlementIndex, entitlement := range plan.Entitlements {
			if !entitlementRE.MatchString(entitlement) {
				issues = append(issues, fmt.Sprintf("%s.entitlements.%d: invalid entitlement", prefix, entitlementIndex))
			} else if seen[entitlement] {
				issues = append(issues, fmt.Sprintf("%s.entitlements.%d: duplicate entitlement", prefix, entitlementIndex))
			}
			seen[entitlement] = true
		}
	}
	for index, capability := range marketplace.Capabilities {
		if !entitlementRE.MatchString(strings.ReplaceAll(capability, "/", ".")) {
			issues = append(issues, fmt.Sprintf("marketplace.capabilities.%d: invalid capability", index))
		}
	}
	for index, media := range marketplace.Media {
		if media.Type != "image" && media.Type != "video" {
			issues = append(issues, fmt.Sprintf("marketplace.media.%d.type: must be image or video", index))
		}
		if err := validateArchivePath(media.Source); err != nil {
			issues = append(issues, fmt.Sprintf("marketplace.media.%d.source: %s", index, err))
		}
	}
	return issues
}
