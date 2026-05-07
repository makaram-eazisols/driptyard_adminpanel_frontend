"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Crown, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { notifyError, notifySuccess } from "@/lib/toast";

const MAX_PLANS = 3;
const MAX_CARDS = 3;
const MAX_ACTIVE_PLANS = 3;

const emptyPlanForm = {
  slug: "",
  name: "",
  description: "",
  subscription_price: "",
  listings_per_day: "10",
  driptyard_points: "0",
  is_active: true,
  is_free: false,
};

const emptyCardForm = {
  points_amount: "",
  price: "",
  is_active: true,
};

export function MembershipSettingsSection() {
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [pointsCards, setPointsCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [editingCardId, setEditingCardId] = useState(null);
  const [planForm, setPlanForm] = useState(emptyPlanForm);
  const [cardForm, setCardForm] = useState(emptyCardForm);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [plans, cards] = await Promise.all([
        apiClient.getAdminMembershipPlans(),
        apiClient.getAdminPointsCards(),
      ]);
      setMembershipPlans(Array.isArray(plans) ? plans : []);
      setPointsCards(Array.isArray(cards) ? cards : []);
    } catch (error) {
      notifyError(error?.response?.data?.detail || error?.message || "Failed to load membership catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const openCreatePlan = () => {
    if (membershipPlans.length >= MAX_PLANS) {
      notifyError(`You can have at most ${MAX_PLANS} membership plans.`);
      return;
    }
    setEditingPlanId(null);
    setPlanForm(emptyPlanForm);
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      slug: plan.slug || "",
      name: plan.name || "",
      description: plan.description || "",
      subscription_price: plan.subscription_price != null ? String(plan.subscription_price) : "",
      listings_per_day: String(plan.listings_per_day ?? ""),
      driptyard_points: String(plan.driptyard_points ?? "0"),
      is_active: !!plan.is_active,
      is_free: !!plan.is_free,
    });
    setPlanDialogOpen(true);
  };

  const openCreateCard = () => {
    if (pointsCards.length >= MAX_CARDS) {
      notifyError(`You can have at most ${MAX_CARDS} points cards.`);
      return;
    }
    setEditingCardId(null);
    setCardForm(emptyCardForm);
    setCardDialogOpen(true);
  };

  const openEditCard = (card) => {
    setEditingCardId(card.id);
    setCardForm({
      points_amount: String(card.points_amount ?? ""),
      price: card.price != null ? String(card.price) : "",
      is_active: !!card.is_active,
    });
    setCardDialogOpen(true);
  };

  const handleSavePlan = async () => {
    const slug = planForm.slug.trim().toLowerCase();
    const name = planForm.name.trim();
    if (!slug || !name) {
      notifyError("Slug and plan name are required.");
      return;
    }
    const listings = parseInt(planForm.listings_per_day, 10);
    const points = parseInt(planForm.driptyard_points, 10);
    if (Number.isNaN(listings) || listings === 0 || listings < -1) {
      notifyError("Listings per day must be -1 (unlimited) or a positive number.");
      return;
    }
    if (Number.isNaN(points) || points < 0) {
      notifyError("Driptyard points must be zero or greater.");
      return;
    }
    const priceNum = parseFloat(planForm.subscription_price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      notifyError("Subscription price must be a valid non-negative number.");
      return;
    }
    if (!editingPlanId && membershipPlans.length >= MAX_PLANS) {
      notifyError(`At most ${MAX_PLANS} membership plans are allowed.`);
      return;
    }

    setSavingPlan(true);
    try {
      const payload = {
        slug,
        name,
        description: planForm.description.trim() || null,
        subscription_price: priceNum,
        listings_per_day: listings,
        driptyard_points: points,
        is_active: planForm.is_active,
        is_free: planForm.is_free,
      };
      if (editingPlanId) {
        await apiClient.updateAdminMembershipPlan(editingPlanId, payload);
        notifySuccess("Membership plan updated.");
      } else {
        await apiClient.createAdminMembershipPlan(payload);
        notifySuccess("Membership plan created.");
      }
      setPlanDialogOpen(false);
      await loadAll();
    } catch (error) {
      notifyError(
        error?.response?.data?.detail || error?.response?.data?.message || "Failed to save membership plan."
      );
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (plan) => {
    if (!confirm(`Delete membership plan “${plan.name}”? This cannot be undone if no users are on it.`)) return;
    try {
      await apiClient.deleteAdminMembershipPlan(plan.id);
      notifySuccess("Membership plan deleted.");
      await loadAll();
    } catch (error) {
      notifyError(error?.response?.data?.detail || "Failed to delete plan.");
    }
  };

  const handleSaveCard = async () => {
    const pts = parseInt(cardForm.points_amount, 10);
    const price = parseFloat(cardForm.price);
    if (Number.isNaN(pts) || pts <= 0) {
      notifyError("Points amount must be a positive integer.");
      return;
    }
    if (Number.isNaN(price) || price <= 0) {
      notifyError("Price must be greater than zero.");
      return;
    }
    if (!editingCardId && pointsCards.length >= MAX_CARDS) {
      notifyError(`At most ${MAX_CARDS} points cards are allowed.`);
      return;
    }

    setSavingCard(true);
    try {
      const payload = {
        points_amount: pts,
        price,
        is_active: cardForm.is_active,
      };
      if (editingCardId) {
        await apiClient.updateAdminPointsCard(editingCardId, payload);
        notifySuccess("Points card updated.");
      } else {
        await apiClient.createAdminPointsCard(payload);
        notifySuccess("Points card created.");
      }
      setCardDialogOpen(false);
      await loadAll();
    } catch (error) {
      notifyError(error?.response?.data?.detail || "Failed to save points card.");
    } finally {
      setSavingCard(false);
    }
  };

  const handleDeleteCard = async (card) => {
    if (!confirm(`Delete points card ${card.points_amount} pts / S$${card.price}?`)) return;
    try {
      await apiClient.deleteAdminPointsCard(card.id);
      notifySuccess("Points card deleted.");
      await loadAll();
    } catch (error) {
      notifyError(error?.response?.data?.detail || "Failed to delete points card.");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Membership plans
          </CardTitle>
          <CardDescription>
            Up to {MAX_PLANS} plans total. At most {MAX_ACTIVE_PLANS} can be active at once (server-enforced). Paid
            plans are billed as recurring subscriptions automatically. Only one free plan is allowed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {membershipPlans.length} / {MAX_PLANS} plans
            </p>
            <Button
              size="sm"
              className="gradient-driptyard-hover text-white shadow-md"
              onClick={openCreatePlan}
              disabled={loading || membershipPlans.length >= MAX_PLANS}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add plan
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </p>
          ) : membershipPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">No membership plans configured.</p>
          ) : (
            <div className="space-y-2">
              {membershipPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="border border-border rounded-md p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="text-sm space-y-1">
                    <p className="font-semibold">
                      {plan.name}{" "}
                      <span className="text-muted-foreground font-normal">({plan.slug})</span>
                    </p>
                    <p className="text-muted-foreground">
                      S${plan.subscription_price} · {plan.listings_per_day === -1 ? "Unlimited" : plan.listings_per_day}{" "}
                      listings/day · {plan.driptyard_points} pts · {plan.is_free ? "Free" : "Paid"}
                    </p>
                    <p className="text-xs">Status: {plan.is_active ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditPlan(plan)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePlan(plan)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Points cards</CardTitle>
          <CardDescription>
            Up to {MAX_CARDS} one-time point packages. Prices are charged in SGD via Stripe Checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {pointsCards.length} / {MAX_CARDS} cards
            </p>
            <Button
              size="sm"
              className="gradient-driptyard-hover text-white shadow-md"
              onClick={openCreateCard}
              disabled={loading || pointsCards.length >= MAX_CARDS}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add card
            </Button>
          </div>
          {loading ? null : pointsCards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No points cards configured.</p>
          ) : (
            <div className="space-y-2">
              {pointsCards.map((card) => (
                <div
                  key={card.id}
                  className="border border-border rounded-md p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="text-sm">
                    <p className="font-semibold">
                      {card.points_amount} points — S${card.price}
                    </p>
                    <p className="text-xs text-muted-foreground">Status: {card.is_active ? "Active" : "Inactive"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEditCard(card)}>
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCard(card)}>
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlanId ? "Edit membership plan" : "Create membership plan"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="mp-slug">Slug (url-safe)</Label>
              <Input
                id="mp-slug"
                value={planForm.slug}
                onChange={(e) => setPlanForm((p) => ({ ...p, slug: e.target.value.toLowerCase() }))}
                disabled={!!editingPlanId}
                placeholder="e.g. premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-name">Plan name</Label>
              <Input
                id="mp-name"
                value={planForm.name}
                onChange={(e) => setPlanForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Displayed to users"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-desc">Description (optional)</Label>
              <Textarea
                id="mp-desc"
                rows={2}
                value={planForm.description}
                onChange={(e) => setPlanForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mp-price">Subscription price (S$)</Label>
                <Input
                  id="mp-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={planForm.subscription_price}
                  onChange={(e) => setPlanForm((p) => ({ ...p, subscription_price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mp-listings">Listings / day (-1 = ∞)</Label>
                <Input
                  id="mp-listings"
                  type="number"
                  value={planForm.listings_per_day}
                  onChange={(e) => setPlanForm((p) => ({ ...p, listings_per_day: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mp-points">Driptyard points (per cycle)</Label>
                <Input
                  id="mp-points"
                  type="number"
                  min="0"
                  value={planForm.driptyard_points}
                  onChange={(e) => setPlanForm((p) => ({ ...p, driptyard_points: e.target.value }))}
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={planForm.is_active} onCheckedChange={(v) => setPlanForm((p) => ({ ...p, is_active: !!v }))} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={planForm.is_free} onCheckedChange={(v) => setPlanForm((p) => ({ ...p, is_free: !!v }))} />
                <Label>Free tier</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button className="gradient-driptyard-hover text-white shadow-md" onClick={handleSavePlan} disabled={savingPlan}>
              {savingPlan ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cardDialogOpen} onOpenChange={setCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCardId ? "Edit points card" : "Create points card"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label htmlFor="pc-points">Points amount</Label>
              <Input
                id="pc-points"
                type="number"
                min="1"
                value={cardForm.points_amount}
                onChange={(e) => setCardForm((p) => ({ ...p, points_amount: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pc-price">Price (S$)</Label>
              <Input
                id="pc-price"
                type="number"
                min="0.01"
                step="0.01"
                value={cardForm.price}
                onChange={(e) => setCardForm((p) => ({ ...p, price: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={cardForm.is_active} onCheckedChange={(v) => setCardForm((p) => ({ ...p, is_active: !!v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCardDialogOpen(false)} type="button">
              Cancel
            </Button>
            <Button className="gradient-driptyard-hover text-white shadow-md" onClick={handleSaveCard} disabled={savingCard}>
              {savingCard ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
