'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Copy,
  Archive,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Sparkles,
  Ticket,
  Sliders,
  Calendar,
  AlertTriangle,
  Search,
  Building2,
  Trash2,
  Tag,
  RefreshCw,
  Clock,
  Shield,
  Layers,
  HelpCircle,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  PlatformPlan,
  PlatformCoupon,
  WorkspaceSubscription,
  SubscriptionStatus,
  BillingPeriod,
} from '@/types/plans';
import {
  PLAN_FEATURES,
  PLAN_LIMITS,
  PLAN_FEATURE_CATEGORIES,
  PlanFeatureKey,
  PlanLimitKey,
  createEmptyPlanFeatures,
} from '@/lib/plans/features';
import {
  getPlatformPlansAction,
  savePlanAction,
  duplicatePlanAction,
  archivePlanAction,
  reorderPlansAction,
  getPlatformCouponsAction,
  saveCouponAction,
  deleteCouponAction,
  updateWorkspaceSubscriptionAction,
} from '@/app/actions/plans';
import { getPlatformCompaniesAction, PlatformCompaniesData } from '@/app/actions/platform';
import {
  getPlatformRevenueMetricsAction,
  getWorkspaceInvoicesAction,
  recordManualPaymentAction,
} from '@/app/actions/platform-management';
import { RevenueMetrics, WorkspaceInvoice } from '@/types/platform-management';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Table } from '@/components/ui/Table';
import { SkeletonBlock } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';

type ActiveTab = 'plans' | 'subscriptions' | 'revenue' | 'invoices' | 'coupons';

export function PlansManagementView() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('plans');
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [coupons, setCoupons] = useState<PlatformCoupon[]>([]);
  const [workspaces, setWorkspaces] = useState<PlatformCompaniesData['companies']>([]);
  const [callerIsOwner, setCallerIsOwner] = useState(false);

  // --- Revenue Metrics State ---
  const [revenueMetrics, setRevenueMetrics] = useState<RevenueMetrics | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  // --- Invoices State ---
  const [invoices, setInvoices] = useState<(WorkspaceInvoice & { workspace?: { id: string; name: string } })[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceFilterWs, setInvoiceFilterWs] = useState<string>('all');

  // --- Manual Payment Modal State ---
  const [showManualPayModal, setShowManualPayModal] = useState(false);
  const [savingManualPay, setSavingManualPay] = useState(false);
  const [manualWsId, setManualWsId] = useState('');
  const [manualAmount, setManualAmount] = useState(49);
  const [manualCurrency, setManualCurrency] = useState('USD');
  const [manualMethod, setManualMethod] = useState<'manual_bank_transfer' | 'manual_crypto' | 'manual_check' | 'manual_other'>('manual_bank_transfer');
  const [manualRef, setManualRef] = useState('');
  const [manualDays, setManualDays] = useState(30);
  const [manualNotes, setManualNotes] = useState('');

  // --- Plan Modal State ---
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlatformPlan | null>(null);

  // Form Fields
  const [planName, setPlanName] = useState('');
  const [planSlug, setPlanSlug] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState(29);
  const [yearlyPrice, setYearlyPrice] = useState(290);
  const [trialDays, setTrialDays] = useState(14);
  const [visibility, setVisibility] = useState<'public' | 'hidden' | 'custom'>('public');
  const [customWorkspaceId, setCustomWorkspaceId] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  // Limit States: number or null (unlimited)
  const [limitsState, setLimitsState] = useState<Record<PlanLimitKey, number | null>>({
    max_agents: 3,
    max_tickets_per_month: 500,
    max_ai_bot_replies_per_month: 200,
    max_channels_connected: 2,
    max_articles: 25,
    max_automations: 5,
    max_storage_mb: 1024,
    max_api_requests_per_month: 1000,
  });

  // Feature Switches
  const [featuresState, setFeaturesState] = useState<Record<PlanFeatureKey, boolean>>(createEmptyPlanFeatures());

  // --- Coupon Modal State ---
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [couponValue, setCouponValue] = useState(20);
  const [couponExpiry, setCouponExpiry] = useState('');
  const [couponMaxRedemptions, setCouponMaxRedemptions] = useState<number | ''>('');
  const [couponPlanRestrictions, setCouponPlanRestrictions] = useState<string[]>([]);

  // --- Workspace Subscription Edit Modal ---
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedWs, setSelectedWs] = useState<PlatformCompaniesData['companies'][0] | null>(null);
  const [subPlanId, setSubPlanId] = useState('');
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>('active');
  const [subBillingPeriod, setSubBillingPeriod] = useState<BillingPeriod>('monthly');
  const [extendDays, setExtendDays] = useState<number | ''>('');
  const [adminNote, setAdminNote] = useState('');
  const [savingSub, setSavingSub] = useState(false);
  const [customSeatsOverride, setCustomSeatsOverride] = useState<string>('');
  const [wsSearch, setWsSearch] = useState('');

  // Initial Data Load
  const loadRevenue = async () => {
    setLoadingRevenue(true);
    try {
      const rev = await getPlatformRevenueMetricsAction();
      setRevenueMetrics(rev);
    } catch (err: any) {
      console.warn('Revenue metrics query note:', err.message);
    } finally {
      setLoadingRevenue(false);
    }
  };

  const loadInvoices = async (wsId?: string) => {
    setLoadingInvoices(true);
    try {
      const res = await getWorkspaceInvoicesAction(wsId && wsId !== 'all' ? { workspaceId: wsId } : undefined);
      setInvoices(res.invoices);
    } catch (err: any) {
      console.warn('Invoices query note:', err.message);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [plansRes, couponsRes, compRes] = await Promise.all([
        getPlatformPlansAction(),
        getPlatformCouponsAction().catch(() => []),
        getPlatformCompaniesAction().catch(() => ({ companies: [] })),
      ]);

      setPlans(plansRes.plans);
      setCallerIsOwner(plansRes.callerIsOwner);
      setCoupons(couponsRes);
      setWorkspaces(compRes.companies || []);

      loadRevenue();
      loadInvoices();
    } catch (err: any) {
      toast.error(err.message || 'Failed to load plans data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordManualPayment = async () => {
    if (!manualWsId) {
      toast.error('Please select a workspace.');
      return;
    }
    if (!manualRef.trim()) {
      toast.error('Please provide a payment reference (e.g. wire reference, crypto tx hash).');
      return;
    }
    setSavingManualPay(true);
    try {
      const res = await recordManualPaymentAction({
        workspaceId: manualWsId,
        amount: Number(manualAmount),
        currency: manualCurrency,
        paymentMethod: manualMethod,
        paymentReference: manualRef,
        notes: manualNotes,
        extendDays: Number(manualDays),
      });
      if (res.success) {
        toast.success('Manual payment recorded and workspace subscription updated.');
        setShowManualPayModal(false);
        setManualRef('');
        setManualNotes('');
        await Promise.all([loadInvoices(invoiceFilterWs), loadRevenue(), loadData()]);
      } else {
        toast.error(res.error || 'Failed to record manual payment.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to record payment.');
    } finally {
      setSavingManualPay(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Plan Modal (Create or Edit)
  const handleOpenPlanModal = (plan?: PlatformPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanName(plan.name);
      setPlanSlug(plan.slug);
      setPlanDescription(plan.description || '');
      setMonthlyPrice(Number(plan.monthly_price));
      setYearlyPrice(Number(plan.yearly_price));
      setTrialDays(plan.trial_days);
      setVisibility(plan.visibility);
      setCustomWorkspaceId(plan.custom_workspace_id || '');
      setIsPopular(plan.is_popular);
      setIsDefault(plan.is_default);
      setLimitsState({
        max_agents: plan.max_agents,
        max_tickets_per_month: plan.max_tickets_per_month,
        max_ai_bot_replies_per_month: plan.max_ai_bot_replies_per_month,
        max_channels_connected: plan.max_channels_connected,
        max_articles: plan.max_articles,
        max_automations: plan.max_automations,
        max_storage_mb: plan.max_storage_mb,
        max_api_requests_per_month: plan.max_api_requests_per_month,
      });
      setFeaturesState({ ...createEmptyPlanFeatures(), ...(plan.features || {}) });
    } else {
      setEditingPlan(null);
      setPlanName('');
      setPlanSlug('');
      setPlanDescription('');
      setMonthlyPrice(49);
      setYearlyPrice(490);
      setTrialDays(14);
      setVisibility('public');
      setCustomWorkspaceId('');
      setIsPopular(false);
      setIsDefault(false);
      setLimitsState({
        max_agents: 5,
        max_tickets_per_month: 1000,
        max_ai_bot_replies_per_month: 500,
        max_channels_connected: 3,
        max_articles: 50,
        max_automations: 10,
        max_storage_mb: 5120,
        max_api_requests_per_month: 5000,
      });
      setFeaturesState(createEmptyPlanFeatures());
    }
    setShowPlanModal(true);
  };

  // Save Plan Handler
  const handleSavePlan = async () => {
    if (!planName.trim()) {
      toast.error('Plan name is required.');
      return;
    }
    setSavingPlan(true);
    try {
      const res = await savePlanAction({
        id: editingPlan?.id,
        name: planName,
        slug: planSlug || undefined,
        description: planDescription,
        monthly_price: Number(monthlyPrice),
        yearly_price: Number(yearlyPrice),
        trial_days: Number(trialDays),
        visibility,
        custom_workspace_id: customWorkspaceId || null,
        is_popular: isPopular,
        is_default: isDefault,
        max_agents: limitsState.max_agents,
        max_tickets_per_month: limitsState.max_tickets_per_month,
        max_ai_bot_replies_per_month: limitsState.max_ai_bot_replies_per_month,
        max_channels_connected: limitsState.max_channels_connected,
        max_articles: limitsState.max_articles,
        max_automations: limitsState.max_automations,
        max_storage_mb: limitsState.max_storage_mb,
        max_api_requests_per_month: limitsState.max_api_requests_per_month,
        features: featuresState,
      });

      if (res.success) {
        toast.success(editingPlan ? 'Plan updated successfully.' : 'New plan created.');
        setShowPlanModal(false);
        await loadData();
      } else {
        toast.error(res.error || 'Failed to save plan.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save plan.');
    } finally {
      setSavingPlan(false);
    }
  };

  // Duplicate Plan Handler
  const handleDuplicatePlan = async (planId: string) => {
    try {
      const res = await duplicatePlanAction(planId);
      if (res.success) {
        toast.success('Plan duplicated as draft copy.');
        await loadData();
      } else {
        toast.error(res.error || 'Failed to duplicate plan.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to duplicate plan.');
    }
  };

  // Archive Plan Handler
  const handleArchivePlan = async (planId: string, currentArchived: boolean) => {
    try {
      const res = await archivePlanAction(planId, !currentArchived);
      if (res.success) {
        toast.success(currentArchived ? 'Plan restored.' : 'Plan archived.');
        await loadData();
      } else {
        toast.error(res.error || 'Failed to archive plan.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive plan.');
    }
  };

  // Reorder Plans Handler
  const handleMovePlan = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= plans.length) return;

    const newPlans = [...plans];
    const [moved] = newPlans.splice(index, 1);
    newPlans.splice(targetIndex, 0, moved);
    setPlans(newPlans);

    const orderedIds = newPlans.map((p) => p.id);
    await reorderPlansAction(orderedIds);
    toast.success('Plans order updated.');
  };

  // Save Coupon Handler
  const handleSaveCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Coupon code is required.');
      return;
    }
    setSavingCoupon(true);
    try {
      const res = await saveCouponAction({
        code: couponCode,
        discount_type: couponType,
        discount_value: Number(couponValue),
        valid_until: couponExpiry || null,
        max_redemptions: couponMaxRedemptions !== '' ? Number(couponMaxRedemptions) : null,
        allowed_plan_ids: couponPlanRestrictions.length > 0 ? couponPlanRestrictions : null,
      });

      if (res.success) {
        toast.success('Coupon created successfully.');
        setShowCouponModal(false);
        setCouponCode('');
        await loadData();
      } else {
        toast.error(res.error || 'Failed to create coupon.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create coupon.');
    } finally {
      setSavingCoupon(false);
    }
  };

  // Delete Coupon Handler
  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const res = await deleteCouponAction(couponId);
      if (res.success) {
        toast.success('Coupon removed.');
        await loadData();
      } else {
        toast.error(res.error || 'Failed to delete coupon.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete coupon.');
    }
  };

  // Open Workspace Subscription Modal
  const handleOpenSubModal = (ws: PlatformCompaniesData['companies'][0]) => {
    setSelectedWs(ws);
    // Find matching plan id by slug
    const matched = plans.find((p) => p.slug === ws.plan);
    setSubPlanId(matched?.id || plans[0]?.id || '');
    setSubStatus(ws.is_suspended ? 'suspended' : 'active');
    setSubBillingPeriod('monthly');
    setExtendDays('');
    setAdminNote('');
    setCustomSeatsOverride('');
    setShowSubModal(true);
  };

  // Save Workspace Subscription Handler
  const handleSaveSubscription = async () => {
    if (!selectedWs || !subPlanId) return;
    setSavingSub(true);
    try {
      const customLimits: Record<string, any> = {};
      if (customSeatsOverride.trim()) {
        const seatsNum = Number(customSeatsOverride);
        if (!isNaN(seatsNum)) customLimits.max_agents = seatsNum;
      }

      const res = await updateWorkspaceSubscriptionAction({
        workspaceId: selectedWs.id,
        planId: subPlanId,
        status: subStatus,
        billingPeriod: subBillingPeriod,
        extendTrialDays: extendDays !== '' ? Number(extendDays) : undefined,
        customLimits: Object.keys(customLimits).length > 0 ? customLimits : undefined,
        adminNote: adminNote || undefined,
      });

      if (res.success) {
        toast.success(`Subscription updated for ${selectedWs.name}.`);
        setShowSubModal(false);
        await loadData();
      } else {
        toast.error(res.error || 'Failed to update subscription.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update subscription.');
    } finally {
      setSavingSub(false);
    }
  };

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(wsSearch.toLowerCase()) ||
    w.plan.toLowerCase().includes(wsSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-accent" />
            <span>Plan & Pricing Management</span>
          </h1>
          <p className="text-xs text-ink-3 mt-1">
            Create, change, and version subscription tiers, resource limits, and feature access without touching code.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'plans' && callerIsOwner && (
            <Button size="sm" onClick={() => handleOpenPlanModal()}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Create Plan</span>
            </Button>
          )}

          {activeTab === 'coupons' && callerIsOwner && (
            <Button size="sm" onClick={() => setShowCouponModal(true)}>
              <Tag className="w-3.5 h-3.5 mr-1" />
              <span>Create Coupon</span>
            </Button>
          )}

          {activeTab === 'invoices' && callerIsOwner && (
            <Button size="sm" onClick={() => setShowManualPayModal(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Record Manual Payment</span>
            </Button>
          )}

          <Button variant="secondary" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-line pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'plans'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plans & Pricing ({plans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Workspace Subscriptions ({workspaces.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('revenue');
            loadRevenue();
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'revenue'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Revenue & MRR</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('invoices');
            loadInvoices(invoiceFilterWs);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'invoices'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices & Payments ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'coupons'
              ? 'border-accent text-accent'
              : 'border-transparent text-ink-3 hover:text-ink'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Coupons ({coupons.length})</span>
        </button>
      </div>

      {/* TAB 1: PLANS & TIERS */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-64" />
              <SkeletonBlock className="h-64" />
            </div>
          ) : plans.length === 0 ? (
            <div className="card p-12 text-center text-xs text-ink-3 border border-line bg-surface">
              No plans registered. Click &quot;Create Plan&quot; to define your first subscription tier.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((p, index) => {
                const isLegacy = p.slug === 'legacy';
                return (
                  <div
                    key={p.id}
                    className={`card border bg-surface p-5 shadow-xs relative flex flex-col justify-between transition-all ${
                      p.is_popular ? 'border-accent ring-1 ring-accent/30' : 'border-line'
                    } ${p.is_archived ? 'opacity-60 bg-surface-2/40' : ''}`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-sm text-ink">{p.name}</span>
                          {p.is_popular && <Badge tone="accent">Most Popular</Badge>}
                          {p.is_default && <Badge tone="info">Default Trial</Badge>}
                          {isLegacy && <Badge tone="neutral">Grandfathered</Badge>}
                        </div>

                        <div className="flex items-center gap-1 text-2xs text-ink-3">
                          <span className="pill text-3xs font-mono">v{p.version}</span>
                          <span className="capitalize">{p.visibility}</span>
                        </div>
                      </div>

                      <p className="text-2xs text-ink-3 min-h-[32px] line-clamp-2 mb-4">
                        {p.description || 'No description provided.'}
                      </p>

                      {/* Pricing Display */}
                      <div className="p-3 rounded-xl border border-line bg-surface-2/40 mb-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl font-bold text-ink tabular-nums">
                            ${Number(p.monthly_price).toFixed(0)}
                          </span>
                          <span className="text-xs text-ink-3">/ month</span>
                          <span className="text-2xs text-ink-3 ml-auto">
                            (${Number(p.yearly_price).toFixed(0)} / yr)
                          </span>
                        </div>
                        {p.trial_days > 0 && (
                          <div className="text-3xs text-accent font-medium mt-1">
                            {p.trial_days}-day free trial included
                          </div>
                        )}
                      </div>

                      {/* Resource Limits List */}
                      <div className="space-y-1.5 text-2xs mb-4">
                        <div className="font-semibold text-ink-2 uppercase text-3xs tracking-wider">
                          Resource Capacity
                        </div>
                        <div className="flex justify-between text-ink-2">
                          <span>Team Seats</span>
                          <span className="font-bold text-ink">
                            {p.max_agents === null ? 'Unlimited' : `${p.max_agents} seats`}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-2">
                          <span>Tickets / Mo</span>
                          <span className="font-bold text-ink">
                            {p.max_tickets_per_month === null ? 'Unlimited' : p.max_tickets_per_month.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-2">
                          <span>AI Bot Replies / Mo</span>
                          <span className="font-bold text-ink">
                            {p.max_ai_bot_replies_per_month === null ? 'Unlimited' : p.max_ai_bot_replies_per_month.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-2">
                          <span>Connected Channels</span>
                          <span className="font-bold text-ink">
                            {p.max_channels_connected === null ? 'Unlimited' : p.max_channels_connected}
                          </span>
                        </div>
                        <div className="flex justify-between text-ink-2">
                          <span>Automations & SLA</span>
                          <span className="font-bold text-ink">
                            {p.features?.sla && p.features?.automations ? 'Full Suite' : 'Limited'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    {callerIsOwner && (
                      <div className="pt-3 border-t border-line flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleMovePlan(index, 'up')}
                            disabled={index === 0}
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleMovePlan(index, 'down')}
                            disabled={index === plans.length - 1}
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleDuplicatePlan(p.id)}
                            title="Duplicate Plan"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            <span>Copy</span>
                          </Button>

                          {!isLegacy && (
                            <Button
                              variant="ghost"
                              size="xs"
                              className={p.is_archived ? 'text-success' : 'text-ink-3'}
                              onClick={() => handleArchivePlan(p.id, p.is_archived)}
                              title={p.is_archived ? 'Restore Plan' : 'Archive Plan'}
                            >
                              <Archive className="w-3 h-3" />
                            </Button>
                          )}

                          <Button size="xs" onClick={() => handleOpenPlanModal(p)}>
                            <Edit2 className="w-3 h-3 mr-1" />
                            <span>Edit</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS & WORKSPACES */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="card p-4 border border-line bg-surface shadow-xs flex items-center gap-3">
            <Search className="w-4 h-4 text-ink-3" />
            <input
              type="text"
              placeholder="Search workspaces by name or current plan..."
              value={wsSearch}
              onChange={(e) => setWsSearch(e.target.value)}
              className="bg-transparent border-none text-xs text-ink placeholder:text-ink-3 focus:outline-hidden w-full"
            />
          </div>

          <div className="card border border-line bg-surface shadow-xs overflow-hidden">
            <Table>
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-2xs uppercase text-ink-3 font-semibold">
                  <th className="p-3 text-left">Workspace</th>
                  <th className="p-3 text-left">Assigned Plan</th>
                  <th className="p-3 text-left">Team Seats</th>
                  <th className="p-3 text-left">Tickets (30d)</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-ui">
                {filteredWorkspaces.map((ws) => (
                  <tr key={ws.id} className="hover:bg-surface-2/40 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-ink text-xs">{ws.name}</div>
                      <div className="text-3xs text-ink-3 font-mono">{ws.id.slice(0, 13)}...</div>
                    </td>

                    <td className="p-3">
                      <Badge tone={ws.plan === 'legacy' ? 'neutral' : 'accent'} className="capitalize font-mono">
                        {ws.plan}
                      </Badge>
                    </td>

                    <td className="p-3 text-xs tabular-nums text-ink">
                      {ws.agents_count} seats
                    </td>

                    <td className="p-3 text-xs tabular-nums text-ink">
                      {(ws.tickets_30d_count ?? 0).toLocaleString()}
                    </td>

                    <td className="p-3">
                      {ws.is_suspended ? (
                        <Badge tone="danger">Suspended</Badge>
                      ) : (
                        <Badge tone="success">Active</Badge>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {callerIsOwner ? (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleOpenSubModal(ws)}
                        >
                          <Sliders className="w-3 h-3 mr-1" />
                          <span>Manage Subscription</span>
                        </Button>
                      ) : (
                        <span className="text-2xs text-ink-3">Owner Managed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="card border border-line bg-surface shadow-xs overflow-hidden">
            {coupons.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-3">
                No active coupons. Create promotional discount codes to share with customers.
              </div>
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-2xs uppercase text-ink-3 font-semibold">
                    <th className="p-3 text-left">Code</th>
                    <th className="p-3 text-left">Discount</th>
                    <th className="p-3 text-left">Redemptions</th>
                    <th className="p-3 text-left">Expiry</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ui">
                  {coupons.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-bold text-xs text-ink bg-surface-2/70 px-2 py-0.5 rounded-md border border-line">
                          {c.code}
                        </span>
                      </td>

                      <td className="p-3 text-xs font-semibold text-accent">
                        {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `$${c.discount_value} OFF`}
                      </td>

                      <td className="p-3 text-xs tabular-nums text-ink-2">
                        {c.redemptions_count} / {c.max_redemptions ? c.max_redemptions : '∞'}
                      </td>

                      <td className="p-3 text-2xs text-ink-3">
                        {c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'Never expires'}
                      </td>

                      <td className="p-3">
                        <Badge tone={c.is_active ? 'success' : 'neutral'}>
                          {c.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>

                      <td className="p-3 text-right">
                        {callerIsOwner && (
                          <Button
                            variant="ghost"
                            size="xs"
                            className="text-danger hover:text-danger"
                            onClick={() => handleDeleteCoupon(c.id)}
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: REVENUE & MRR */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {loadingRevenue && !revenueMetrics ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SkeletonBlock className="h-28" />
              <SkeletonBlock className="h-28" />
              <SkeletonBlock className="h-28" />
              <SkeletonBlock className="h-28" />
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card p-4 border border-line bg-surface shadow-xs">
                  <div className="flex items-center justify-between text-ink-3 mb-1.5">
                    <span className="text-2xs font-semibold uppercase tracking-wider">MRR</span>
                    <DollarSign className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-ink">
                    ${(revenueMetrics?.mrr || 0).toLocaleString()}
                  </div>
                  <p className="text-2xs text-ink-3 mt-1">Monthly Recurring Revenue</p>
                </div>

                <div className="card p-4 border border-line bg-surface shadow-xs">
                  <div className="flex items-center justify-between text-ink-3 mb-1.5">
                    <span className="text-2xs font-semibold uppercase tracking-wider">ARR</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-ink">
                    ${(revenueMetrics?.arr || 0).toLocaleString()}
                  </div>
                  <p className="text-2xs text-ink-3 mt-1">Annual Run Rate (MRR × 12)</p>
                </div>

                <div className="card p-4 border border-line bg-surface shadow-xs">
                  <div className="flex items-center justify-between text-ink-3 mb-1.5">
                    <span className="text-2xs font-semibold uppercase tracking-wider">New MRR (30d)</span>
                    <Plus className="w-4 h-4 text-accent" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    +${(revenueMetrics?.newMrr30d || 0).toLocaleString()}
                  </div>
                  <p className="text-2xs text-ink-3 mt-1">Added in the last 30 days</p>
                </div>

                <div className="card p-4 border border-line bg-surface shadow-xs">
                  <div className="flex items-center justify-between text-ink-3 mb-1.5">
                    <span className="text-2xs font-semibold uppercase tracking-wider">Churned MRR (30d)</span>
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-bold text-rose-600">
                    -${(revenueMetrics?.churnedMrr30d || 0).toLocaleString()}
                  </div>
                  <p className="text-2xs text-ink-3 mt-1">Lost in the last 30 days</p>
                </div>
              </div>

              {/* Revenue Breakdown by Plan */}
              <div className="card border border-line bg-surface shadow-xs overflow-hidden">
                <div className="p-4 border-b border-line flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink">Revenue Breakdown by Plan</h3>
                    <p className="text-2xs text-ink-3">Subscriber counts and monthly revenue contribution by tier</p>
                  </div>
                  <Button variant="secondary" size="xs" onClick={loadRevenue} loading={loadingRevenue}>
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    <span>Refresh</span>
                  </Button>
                </div>

                <Table>
                  <thead>
                    <tr className="border-b border-line bg-surface-2/40 text-2xs font-semibold text-ink-2 uppercase tracking-wider text-left">
                      <th className="p-3">Plan Tier</th>
                      <th className="p-3">Active Subscribers</th>
                      <th className="p-3">Monthly Revenue (MRR)</th>
                      <th className="p-3">% of Total MRR</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-xs">
                    {(revenueMetrics?.planBreakdown || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-ink-3 text-xs">
                          No active subscriptions to calculate breakdown.
                        </td>
                      </tr>
                    ) : (
                      revenueMetrics?.planBreakdown.map((item) => {
                        const total = revenueMetrics.mrr || 1;
                        const pct = Math.round((item.mrr / (total || 1)) * 100);
                        return (
                          <tr key={item.planId} className="hover:bg-surface-2/30 transition-colors">
                            <td className="p-3 font-semibold text-ink">{item.planName}</td>
                            <td className="p-3 text-ink-2">
                              <Badge tone="neutral">{item.subscriberCount} workspaces</Badge>
                            </td>
                            <td className="p-3 font-mono font-semibold text-ink">
                              ${item.mrr.toLocaleString()} /mo
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-surface-3 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-accent h-2 rounded-full"
                                    style={{ width: `${Math.min(100, pct)}%` }}
                                  />
                                </div>
                                <span className="text-2xs text-ink-3 font-mono">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 5: INVOICES & MANUAL PAYMENTS */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-ink-2">Filter by Workspace:</label>
              <select
                value={invoiceFilterWs}
                onChange={(e) => {
                  setInvoiceFilterWs(e.target.value);
                  loadInvoices(e.target.value);
                }}
                className="input input-sm text-xs py-1"
              >
                <option value="all">All Workspaces</option>
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {callerIsOwner && (
              <Button size="sm" onClick={() => setShowManualPayModal(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" />
                <span>Record Manual Payment</span>
              </Button>
            )}
          </div>

          <div className="card border border-line bg-surface shadow-xs overflow-hidden">
            {loadingInvoices ? (
              <div className="p-6 space-y-3">
                <SkeletonBlock className="h-10" />
                <SkeletonBlock className="h-10" />
                <SkeletonBlock className="h-10" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-ink-3">
                No invoices recorded yet. Manual payments or Lemon Squeezy subscription webhooks will populate here.
              </div>
            ) : (
              <Table>
                <thead>
                  <tr className="border-b border-line bg-surface-2/40 text-2xs font-semibold text-ink-2 uppercase tracking-wider text-left">
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Workspace</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Reference / Tx</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-xs">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="p-3 font-mono font-medium text-ink">{inv.invoice_number}</td>
                      <td className="p-3 font-medium text-ink">{inv.workspace?.name || inv.workspace_id}</td>
                      <td className="p-3 font-semibold text-ink">
                        {inv.currency.toUpperCase()} ${inv.amount.toLocaleString()}
                      </td>
                      <td className="p-3">
                        <Badge
                          tone={
                            inv.status === 'paid'
                              ? 'success'
                              : inv.status === 'open'
                              ? 'warn'
                              : 'neutral'
                          }
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-ink-2">
                        {inv.payment_method === 'lemonsqueezy' && 'Lemon Squeezy'}
                        {inv.payment_method === 'manual_bank_transfer' && 'Bank Transfer'}
                        {inv.payment_method === 'manual_crypto' && 'Cryptocurrency'}
                        {inv.payment_method === 'manual_check' && 'Check'}
                        {inv.payment_method === 'manual_other' && 'Manual / Other'}
                      </td>
                      <td className="p-3 font-mono text-2xs text-ink-3">
                        {inv.payment_reference || '—'}
                      </td>
                      <td className="p-3 text-2xs text-ink-3">
                        {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : new Date(inv.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        {inv.hosted_invoice_url ? (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-2xs text-accent hover:underline font-semibold"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-2xs text-ink-4">Internal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: CREATE OR EDIT PLAN */}
      {/* ===================================================================== */}
      <Modal
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        title={editingPlan ? `Edit Plan: ${editingPlan.name}` : 'Create New Plan'}
        description="Configure pricing, resource allowances, and feature toggles from the central registry."
      >
        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* General Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">General Information</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-2xs font-semibold text-ink-2 mb-1">Plan Name *</label>
                <input
                  type="text"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="e.g. Pro, Scale, Enterprise"
                  className="input input-sm w-full"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-2 mb-1">URL Identifier (Slug)</label>
                <input
                  type="text"
                  value={planSlug}
                  onChange={(e) => setPlanSlug(e.target.value)}
                  placeholder="auto-generated from name"
                  disabled={!!editingPlan}
                  className="input input-sm w-full font-mono text-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Description</label>
              <textarea
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                placeholder="Short value proposition displayed on pricing cards..."
                rows={2}
                className="input input-sm w-full py-2"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-2xs font-semibold text-ink-2 mb-1">Monthly Price ($)</label>
                <input
                  type="number"
                  min={0}
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                  className="input input-sm w-full"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-2 mb-1">Yearly Price ($)</label>
                <input
                  type="number"
                  min={0}
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(Number(e.target.value))}
                  className="input input-sm w-full"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-ink-2 mb-1">Trial Days</label>
                <input
                  type="number"
                  min={0}
                  value={trialDays}
                  onChange={(e) => setTrialDays(Number(e.target.value))}
                  className="input input-sm w-full"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 pt-1">
              <div>
                <label className="block text-2xs font-semibold text-ink-2 mb-1">Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="input input-sm w-full"
                >
                  <option value="public">Public (Visible on Pricing)</option>
                  <option value="hidden">Hidden (Internal Only)</option>
                  <option value="custom">Custom (One Workspace)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chk-popular"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="rounded border-line"
                />
                <label htmlFor="chk-popular" className="text-xs text-ink cursor-pointer">
                  Most Popular Flag
                </label>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="chk-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-line"
                />
                <label htmlFor="chk-default" className="text-xs text-ink cursor-pointer">
                  Default Trial for New Signups
                </label>
              </div>
            </div>
          </div>

          {/* Limits Configuration */}
          <div className="space-y-3 pt-3 border-t border-line">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Resource Capacity Limits (Empty / Null = Unlimited)
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {PLAN_LIMITS.map((lim) => {
                const val = limitsState[lim.id];
                const isUnlimited = val === null;

                return (
                  <div key={lim.id} className="p-3 rounded-xl border border-line bg-surface-2/30 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink">{lim.name}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setLimitsState((prev) => ({
                            ...prev,
                            [lim.id]: isUnlimited ? 10 : null,
                          }))
                        }
                        className={`text-3xs font-bold px-1.5 py-0.5 rounded transition-colors ${
                          isUnlimited
                            ? 'bg-accent text-accent-ink'
                            : 'bg-surface-3 text-ink-3 hover:text-ink'
                        }`}
                      >
                        {isUnlimited ? '∞ Unlimited' : 'Set Limit'}
                      </button>
                    </div>

                    {!isUnlimited && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={val ?? 0}
                          onChange={(e) =>
                            setLimitsState((prev) => ({
                              ...prev,
                              [lim.id]: Number(e.target.value),
                            }))
                          }
                          className="input input-sm w-full"
                        />
                        <span className="text-2xs text-ink-3 shrink-0">{lim.unit}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features Toggle Registry */}
          <div className="space-y-3 pt-3 border-t border-line">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Feature Matrix Toggles (Central Registry)
            </h4>

            {Object.entries(PLAN_FEATURE_CATEGORIES).map(([catKey, catInfo]) => {
              const catFeatures = PLAN_FEATURES.filter((f) => f.category === catKey);
              if (catFeatures.length === 0) return null;

              return (
                <div key={catKey} className="space-y-2">
                  <div className="text-2xs font-semibold text-accent uppercase tracking-wider">
                    {catInfo.label}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {catFeatures.map((feat) => {
                      const enabled = Boolean(featuresState[feat.id]);
                      return (
                        <label
                          key={feat.id}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                            enabled ? 'border-accent/40 bg-accent/5' : 'border-line bg-surface-2/20'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) =>
                              setFeaturesState((prev) => ({
                                ...prev,
                                [feat.id]: e.target.checked,
                              }))
                            }
                            className="mt-0.5 rounded border-line text-accent"
                          />
                          <div className="text-xs">
                            <span className="font-semibold text-ink block">{feat.name}</span>
                            <span className="text-3xs text-ink-3 line-clamp-1">{feat.description}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line">
            <Button variant="secondary" size="sm" onClick={() => setShowPlanModal(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={savingPlan} onClick={handleSavePlan}>
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: CREATE COUPON */}
      {/* ===================================================================== */}
      <Modal
        open={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        title="Create Promotional Coupon"
        description="Generate discount codes that workspaces can redeem on their subscriptions."
      >
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">Coupon Code *</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="e.g. LAUNCH50, WELCOME2026"
              className="input input-sm w-full font-mono uppercase"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Discount Type</label>
              <select
                value={couponType}
                onChange={(e) => setCouponType(e.target.value as any)}
                className="input input-sm w-full"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Dollar ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Discount Value *</label>
              <input
                type="number"
                min={1}
                value={couponValue}
                onChange={(e) => setCouponValue(Number(e.target.value))}
                className="input input-sm w-full"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Expiration Date (Optional)</label>
              <input
                type="date"
                value={couponExpiry}
                onChange={(e) => setCouponExpiry(e.target.value)}
                className="input input-sm w-full"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Max Redemptions (Optional)</label>
              <input
                type="number"
                min={1}
                value={couponMaxRedemptions}
                onChange={(e) => setCouponMaxRedemptions(e.target.value ? Number(e.target.value) : '')}
                placeholder="Unlimited if empty"
                className="input input-sm w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setShowCouponModal(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={savingCoupon} onClick={handleSaveCoupon}>
              Create Coupon
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: MANAGE WORKSPACE SUBSCRIPTION */}
      {/* ===================================================================== */}
      <Modal
        open={showSubModal}
        onClose={() => setShowSubModal(false)}
        title={`Subscription: ${selectedWs?.name}`}
        description="Override plans, extend free trials, and assign custom limits for this workspace."
      >
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">Assigned Plan *</label>
            <select
              value={subPlanId}
              onChange={(e) => setSubPlanId(e.target.value)}
              className="input input-sm w-full"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.slug}) — ${p.monthly_price}/mo
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Status</label>
              <select
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value as any)}
                className="input input-sm w-full"
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="past_due">Past Due</option>
                <option value="canceled">Canceled</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Billing Period</label>
              <select
                value={subBillingPeriod}
                onChange={(e) => setSubBillingPeriod(e.target.value as any)}
                className="input input-sm w-full"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Extend Trial (Days)</label>
              <input
                type="number"
                min={1}
                placeholder="e.g. 7 or 14 extra days"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value ? Number(e.target.value) : '')}
                className="input input-sm w-full"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Custom Seats Override</label>
              <input
                type="number"
                min={1}
                placeholder="Leave blank for plan default"
                value={customSeatsOverride}
                onChange={(e) => setCustomSeatsOverride(e.target.value)}
                className="input input-sm w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">Admin Internal Note</label>
            <textarea
              rows={2}
              placeholder="Record special arrangement, negotiated discount, or custom feature grant..."
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="input input-sm w-full py-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setShowSubModal(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={savingSub} onClick={handleSaveSubscription}>
              Save Subscription
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: RECORD MANUAL PAYMENT */}
      {/* ===================================================================== */}
      <Modal
        open={showManualPayModal}
        onClose={() => setShowManualPayModal(false)}
        title="Record Manual Payment"
        description="Register an offline bank wire, crypto transfer, or check, generate an invoice receipt, and extend subscription."
      >
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">Target Workspace *</label>
            <select
              value={manualWsId}
              onChange={(e) => setManualWsId(e.target.value)}
              className="input input-sm w-full"
            >
              <option value="">Select workspace...</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Current: {w.plan})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Amount ($) *</label>
              <input
                type="number"
                min={0}
                value={manualAmount}
                onChange={(e) => setManualAmount(Number(e.target.value))}
                className="input input-sm w-full"
              />
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Currency</label>
              <select
                value={manualCurrency}
                onChange={(e) => setManualCurrency(e.target.value)}
                className="input input-sm w-full"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Payment Method *</label>
              <select
                value={manualMethod}
                onChange={(e) => setManualMethod(e.target.value as any)}
                className="input input-sm w-full"
              >
                <option value="manual_bank_transfer">Bank Wire / ACH</option>
                <option value="manual_crypto">Cryptocurrency (BTC/ETH/USDT)</option>
                <option value="manual_check">Corporate Check</option>
                <option value="manual_other">Other Offline Method</option>
              </select>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-ink-2 mb-1">Extension Days *</label>
              <input
                type="number"
                min={1}
                value={manualDays}
                onChange={(e) => setManualDays(Number(e.target.value))}
                className="input input-sm w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">Payment Reference / Tx Hash *</label>
            <input
              type="text"
              placeholder="e.g. WIRE-894721 or 0x9b3f... or Check #1042"
              value={manualRef}
              onChange={(e) => setManualRef(e.target.value)}
              className="input input-sm w-full font-mono text-2xs"
            />
          </div>

          <div>
            <label className="block text-2xs font-semibold text-ink-2 mb-1">Internal Note</label>
            <textarea
              rows={2}
              placeholder="Add details on bank account received, date verified, or customer contact..."
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="input input-sm w-full py-2"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3">
            <Button variant="secondary" size="sm" onClick={() => setShowManualPayModal(false)}>
              Cancel
            </Button>
            <Button size="sm" loading={savingManualPay} onClick={handleRecordManualPayment}>
              Record & Activate Subscription
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
