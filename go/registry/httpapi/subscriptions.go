package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/activelane/activelane/go/alx"
	"github.com/activelane/activelane/go/registry"
	"github.com/go-chi/chi/v5"
)

type subscriptionRequest struct {
	PlanID string `json:"planId"`
}

func decodeJSON(response http.ResponseWriter, request *http.Request, value any) bool {
	decoder := json.NewDecoder(http.MaxBytesReader(response, request.Body, 1<<20))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(value); err != nil {
		writeError(response, http.StatusBadRequest, "INVALID_ARGUMENT", "Request body is not valid JSON.")
		return false
	}
	return true
}

func planByID(plans []alx.SubscriptionPlan, id string) (alx.SubscriptionPlan, bool) {
	for _, plan := range plans {
		if plan.ID == id {
			return plan, true
		}
	}
	return alx.SubscriptionPlan{}, false
}

func (handlers handlers) listPlans(response http.ResponseWriter, request *http.Request) {
	plans, err := handlers.subscriptionStore().Plans(chi.URLParam(request, "namespace"), chi.URLParam(request, "name"))
	respond(response, map[string]any{"items": plans}, err)
}

func (handlers handlers) getSubscription(response http.ResponseWriter, request *http.Request) {
	subscription, err := handlers.subscriptionStore().GetSubscription(
		chi.URLParam(request, "accountId"), extensionID(request),
	)
	respond(response, subscription, err)
}

func (handlers handlers) subscribe(response http.ResponseWriter, request *http.Request) {
	var input subscriptionRequest
	if !decodeJSON(response, request, &input) {
		return
	}
	plans, err := handlers.subscriptionStore().Plans(chi.URLParam(request, "namespace"), chi.URLParam(request, "name"))
	if err != nil {
		respond(response, nil, err)
		return
	}
	plan, ok := planByID(plans, input.PlanID)
	if !ok || plan.Interval == "none" {
		writeError(response, http.StatusBadRequest, "INVALID_PLAN", "A paid subscription plan is required.")
		return
	}
	accountID := chi.URLParam(request, "accountId")
	if existing, existingErr := handlers.subscriptionStore().GetSubscription(accountID, extensionID(request)); existingErr == nil && existing.Status == registry.SubscriptionActive {
		writeError(response, http.StatusConflict, "SUBSCRIPTION_EXISTS", "An active subscription already exists.")
		return
	}
	now := handlers.now()
	subscription := registry.NewSubscription(accountID, extensionID(request), plan.ID, now)
	subscription, err = handlers.provider().Subscribe(request.Context(), subscription, plan)
	if err != nil {
		respond(response, nil, err)
		return
	}
	subscription.UpdatedAt = now.Format(time.RFC3339Nano)
	if err := handlers.subscriptionStore().SaveSubscription(subscription); err != nil {
		respond(response, nil, err)
		return
	}
	writeJSON(response, http.StatusCreated, subscription)
}

func (handlers handlers) changePlan(response http.ResponseWriter, request *http.Request) {
	var input subscriptionRequest
	if !decodeJSON(response, request, &input) {
		return
	}
	subscription, err := handlers.subscriptionStore().GetSubscription(chi.URLParam(request, "accountId"), extensionID(request))
	if err != nil {
		respond(response, nil, err)
		return
	}
	plans, err := handlers.subscriptionStore().Plans(chi.URLParam(request, "namespace"), chi.URLParam(request, "name"))
	if err != nil {
		respond(response, nil, err)
		return
	}
	plan, ok := planByID(plans, input.PlanID)
	if !ok || plan.Interval == "none" {
		writeError(response, http.StatusBadRequest, "INVALID_PLAN", "A paid subscription plan is required.")
		return
	}
	subscription, err = handlers.provider().ChangePlan(request.Context(), subscription, plan)
	handlers.persistSubscription(response, subscription, err)
}

func (handlers handlers) cancelSubscription(response http.ResponseWriter, request *http.Request) {
	handlers.transitionSubscription(response, request, handlers.provider().Cancel)
}

func (handlers handlers) resumeSubscription(response http.ResponseWriter, request *http.Request) {
	handlers.transitionSubscription(response, request, handlers.provider().Resume)
}

func (handlers handlers) resolveEntitlements(response http.ResponseWriter, request *http.Request) {
	resolution, err := handlers.subscriptionStore().ResolveEntitlements(chi.URLParam(request, "accountId"), chi.URLParam(request, "namespace"), chi.URLParam(request, "name"))
	respond(response, resolution, err)
}

func (handlers handlers) transitionSubscription(response http.ResponseWriter, request *http.Request, transition func(context.Context, registry.Subscription) (registry.Subscription, error)) {
	subscription, err := handlers.subscriptionStore().GetSubscription(chi.URLParam(request, "accountId"), extensionID(request))
	if err == nil {
		subscription, err = transition(request.Context(), subscription)
	}
	handlers.persistSubscription(response, subscription, err)
}

func (handlers handlers) persistSubscription(response http.ResponseWriter, subscription registry.Subscription, err error) {
	if errors.Is(err, registry.ErrInvalidSubscriptionTransition) {
		writeError(response, http.StatusConflict, "INVALID_SUBSCRIPTION_TRANSITION", err.Error())
		return
	}
	if err != nil {
		respond(response, nil, err)
		return
	}
	subscription.UpdatedAt = handlers.now().Format(time.RFC3339Nano)
	if err := handlers.subscriptionStore().SaveSubscription(subscription); err != nil {
		respond(response, nil, err)
		return
	}
	writeJSON(response, http.StatusOK, subscription)
}

func (handlers handlers) provider() registry.SubscriptionProvider {
	if handlers.config.SubscriptionProvider != nil {
		return handlers.config.SubscriptionProvider
	}
	return registry.DevSubscriptionProvider{Now: handlers.config.Now}
}

func (handlers handlers) subscriptionStore() SubscriptionStore {
	return handlers.config.SubscriptionStore
}

func (handlers handlers) now() time.Time {
	if handlers.config.Now != nil {
		return handlers.config.Now().UTC()
	}
	return time.Now().UTC()
}

func extensionID(request *http.Request) string {
	return "@" + chi.URLParam(request, "namespace") + "/" + chi.URLParam(request, "name")
}
