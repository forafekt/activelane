package registry

import (
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/activelane/activelane/go/alx"
)

var ErrInvalidSubscriptionTransition = errors.New("invalid subscription transition")

type SubscriptionStatus string

const (
	SubscriptionActive   SubscriptionStatus = "active"
	SubscriptionCanceled SubscriptionStatus = "canceled"
	SubscriptionExpired  SubscriptionStatus = "expired"
)

type Subscription struct {
	ID                 string             `json:"id"`
	AccountID          string             `json:"accountId"`
	ExtensionID        string             `json:"extensionId"`
	PlanID             string             `json:"planId"`
	Status             SubscriptionStatus `json:"status"`
	Provider           string             `json:"provider"`
	ProviderReference  string             `json:"providerReference"`
	CurrentPeriodStart string             `json:"currentPeriodStart"`
	CurrentPeriodEnd   string             `json:"currentPeriodEnd"`
	CancelAtPeriodEnd  bool               `json:"cancelAtPeriodEnd"`
	CreatedAt          string             `json:"createdAt"`
	UpdatedAt          string             `json:"updatedAt"`
}

type EntitlementResolution struct {
	AccountID      string   `json:"accountId"`
	ExtensionID    string   `json:"extensionId"`
	PlanID         string   `json:"planId"`
	SubscriptionID string   `json:"subscriptionId,omitempty"`
	Entitlements   []string `json:"entitlements"`
	ResolvedAt     string   `json:"resolvedAt"`
}

type SubscriptionProvider interface {
	Name() string
	Subscribe(context.Context, Subscription, alx.SubscriptionPlan) (Subscription, error)
	ChangePlan(context.Context, Subscription, alx.SubscriptionPlan) (Subscription, error)
	Cancel(context.Context, Subscription) (Subscription, error)
	Resume(context.Context, Subscription) (Subscription, error)
}

// DevSubscriptionProvider is an honest local checkout implementation. It never
// accepts payment details and can be replaced without changing registry handlers.
type DevSubscriptionProvider struct{ Now func() time.Time }

func (p DevSubscriptionProvider) Name() string { return "development" }

func (p DevSubscriptionProvider) Subscribe(_ context.Context, subscription Subscription, plan alx.SubscriptionPlan) (Subscription, error) {
	now := p.now()
	subscription.Provider = p.Name()
	subscription.ProviderReference = "dev_" + subscription.ID
	subscription.Status = SubscriptionActive
	subscription.CurrentPeriodStart = now.Format(time.RFC3339Nano)
	subscription.CurrentPeriodEnd = periodEnd(now, plan.Interval).Format(time.RFC3339Nano)
	return subscription, nil
}

func (p DevSubscriptionProvider) ChangePlan(_ context.Context, subscription Subscription, plan alx.SubscriptionPlan) (Subscription, error) {
	if subscription.Status != SubscriptionActive {
		return Subscription{}, ErrInvalidSubscriptionTransition
	}
	subscription.PlanID = plan.ID
	subscription.CurrentPeriodEnd = periodEnd(p.now(), plan.Interval).Format(time.RFC3339Nano)
	return subscription, nil
}

func (p DevSubscriptionProvider) Cancel(_ context.Context, subscription Subscription) (Subscription, error) {
	if subscription.Status != SubscriptionActive || subscription.CancelAtPeriodEnd {
		return Subscription{}, ErrInvalidSubscriptionTransition
	}
	subscription.CancelAtPeriodEnd = true
	return subscription, nil
}

func (p DevSubscriptionProvider) Resume(_ context.Context, subscription Subscription) (Subscription, error) {
	if subscription.Status != SubscriptionActive || !subscription.CancelAtPeriodEnd {
		return Subscription{}, ErrInvalidSubscriptionTransition
	}
	subscription.CancelAtPeriodEnd = false
	return subscription, nil
}

func (p DevSubscriptionProvider) now() time.Time {
	if p.Now != nil {
		return p.Now().UTC()
	}
	return time.Now().UTC()
}

func periodEnd(now time.Time, interval string) time.Time {
	if interval == "yearly" {
		return now.AddDate(1, 0, 0)
	}
	return now.AddDate(0, 1, 0)
}

func (s *Store) Plans(namespace, name string) ([]alx.SubscriptionPlan, error) {
	extension, err := s.GetExtension(namespace, name)
	if err != nil {
		return nil, err
	}
	marketplace, err := extension.Versions[0].Manifest.Marketplace()
	if err != nil {
		return nil, err
	}
	return marketplace.Plans, nil
}

func (s *Store) GetSubscription(accountID, extensionID string) (Subscription, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	var subscription Subscription
	err := readJSON(s.subscriptionPath(accountID, extensionID), &subscription)
	return subscription, err
}

func (s *Store) SaveSubscription(subscription Subscription) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return writeJSONAtomic(s.subscriptionPath(subscription.AccountID, subscription.ExtensionID), subscription)
}

func (s *Store) ResolveEntitlements(accountID, namespace, name string) (EntitlementResolution, error) {
	extensionID := "@" + namespace + "/" + name
	plans, err := s.Plans(namespace, name)
	if err != nil {
		return EntitlementResolution{}, err
	}
	plan := freePlan(plans)
	subscription, subscriptionErr := s.GetSubscription(accountID, extensionID)
	if subscriptionErr == nil && subscription.Status == SubscriptionActive {
		if selected, ok := findPlan(plans, subscription.PlanID); ok {
			plan = selected
		}
	}
	if subscriptionErr != nil && !errors.Is(subscriptionErr, ErrNotFound) {
		return EntitlementResolution{}, subscriptionErr
	}
	resolution := EntitlementResolution{AccountID: accountID, ExtensionID: extensionID, PlanID: plan.ID, Entitlements: append([]string(nil), plan.Entitlements...), ResolvedAt: s.now().UTC().Format(time.RFC3339Nano)}
	if subscriptionErr == nil {
		resolution.SubscriptionID = subscription.ID
	}
	return resolution, nil
}

func (s *Store) subscriptionPath(accountID, extensionID string) string {
	accountKey := fmt.Sprintf("%x", sha256.Sum256([]byte(accountID)))
	extensionKey := fmt.Sprintf("%x", sha256.Sum256([]byte(extensionID)))
	return filepath.Join(s.root, "metadata", "subscriptions", accountKey, extensionKey+".json")
}

func readJSON(filename string, value any) error {
	data, err := os.ReadFile(filename)
	if errors.Is(err, os.ErrNotExist) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	return json.Unmarshal(data, value)
}

func findPlan(plans []alx.SubscriptionPlan, id string) (alx.SubscriptionPlan, bool) {
	for _, plan := range plans {
		if plan.ID == id {
			return plan, true
		}
	}
	return alx.SubscriptionPlan{}, false
}

func freePlan(plans []alx.SubscriptionPlan) alx.SubscriptionPlan {
	for _, plan := range plans {
		if plan.Interval == "none" && plan.PriceMinor == 0 {
			return plan
		}
	}
	return alx.SubscriptionPlan{ID: "free", Name: "Free", Interval: "none", Currency: "EUR"}
}

func NewSubscription(accountID, extensionID, planID string, now time.Time) Subscription {
	stamp := now.UTC().Format(time.RFC3339Nano)
	return Subscription{ID: fmt.Sprintf("sub_%d", now.UnixNano()), AccountID: accountID, ExtensionID: extensionID, PlanID: planID, CreatedAt: stamp, UpdatedAt: stamp}
}
