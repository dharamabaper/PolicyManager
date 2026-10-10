import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Layers,
  Check,
  Copy,
  ChevronRight,
  Bell,
  Users,
  Plus,
  RefreshCw,
  Cake,
  UserCheck,
  FileSpreadsheet,
  Award,
} from 'lucide-react';
import {
  LIC_PLANS,
  LicActuarialResult,
  LicCalculationInput,
  PaymentMode,
  formatInr,
  formatInrCompact,
} from '../data/licPlans';
import {
  CustomerPolicyRecord,
  buildPolicyNotifications,
  calculateAgeFromDob,
  createCustomerPolicyRecord,
  markPolicyRenewalPaid,
} from '../services/policyService';
import { AgentHubSubView } from './CustomerPoliciesAndAlertsView';
import {
  LicAgentFamilyIcon,
  DHARMENDRA_FOUNDER_INFO,
  AboutDharmendraCard,
} from './LicAgentFamilyBrand';

interface AndroidHandsetPreviewProps {
  agentId: string;
  agentName: string;
  agentMobile: string;
  agencyCode?: string;
  branchCode?: string;
  policies: CustomerPolicyRecord[];
  input: LicCalculationInput;
  result: LicActuarialResult;
  onUpdateInput: (patch: Partial<LicCalculationInput>) => void;
  onSaveQuote: () => void;
  onSwitchToCSharpTab: () => void;
  onOpenHubSubView: (subView: AgentHubSubView) => void;
}

export const AndroidHandsetPreview: React.FC<AndroidHandsetPreviewProps> = ({
  agentId,
  agentName,
  agentMobile,
  agencyCode = DHARMENDRA_FOUNDER_INFO.agencyCode,
  branchCode = 'Senior Consultant · LIC',
  policies,
  input,
  result,
  onUpdateInput,
  onSaveQuote,
  onSwitchToCSharpTab,
  onOpenHubSubView,
}) => {
  const [mobileTab, setMobileTab] = useState<
    'calc' | 'policies' | 'alerts' | 'plans' | 'profile'
  >('calc');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [quickAdding, setQuickAdding] = useState(false);
  const [quickPolNo, setQuickPolNo] = useState('896521044');
  const [quickDob, setQuickDob] = useState('2018-08-12');
  const [quickDue, setQuickDue] = useState('2026-10-18');
  const [savingPolicy, setSavingPolicy] = useState(false);

  const { plan } = result;
  const notifications = useMemo(() => buildPolicyNotifications(policies), [policies]);

  const handleQuickSaveCurrentCalcAsPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const matYear = new Date().getFullYear() + result.effectivePolicyTerm;
      await createCustomerPolicyRecord({
        agentId,
        policyNumber: quickPolNo,
        customerName: input.clientName || 'Valued Policyholder',
        customerMobile: input.clientPhone || '+91 98201 44510',
        dateOfBirth: quickDob,
        planId: plan.id,
        planName: plan.name,
        planNo: plan.planNo,
        sumAssured: result.input.sumAssured,
        premiumAmount:
          result.subsequentYearModalPremiumInclGst > 0
            ? result.subsequentYearModalPremiumInclGst
            : result.firstYearModalPremiumInclGst,
        paymentMode: result.input.paymentMode,
        policyTerm: result.effectivePolicyTerm,
        ppt: result.effectivePpt,
        commencementDate: new Date().toISOString().slice(0, 10),
        nextRenewalDate: quickDue,
        maturityDate: `${matYear}-10-15`,
        maturityAmount: result.totalValueDelivered,
        status: 'Active',
        lastReminderSentAt: '',
      });
      setQuickAdding(false);
      setMobileTab('policies');
    } finally {
      setSavingPolicy(false);
    }
  };

  const whatsAppText = [
    `*POLICY MANAGER - AGENT — BENEFIT ILLUSTRATION*`,
    `Advisor: *${agentName}* (Code: ${agencyCode} · ${agentMobile})`,
    `Client: *${input.clientName || 'Valued Client'}* (Age: ${result.input.entryAge} Yrs)`,
    `Plan: *${plan.name}* (Plan ${plan.planNo})`,
    `Policy Term: ${result.effectivePolicyTerm} Yrs · PPT: ${result.effectivePpt} Yrs`,
    `Basic Sum Assured: *${formatInr(result.input.sumAssured)}*`,
    `Mode: ${result.input.paymentMode}`,
    `────────────────────────`,
    `*1st Year Premium (incl. ${result.firstYearGstRatePct}% GST):* ${formatInr(result.firstYearModalPremiumInclGst)}`,
    result.effectivePpt > 1
      ? `*2nd Year Onwards (incl. ${result.subsequentYearGstRatePct}% GST):* ${formatInr(result.subsequentYearModalPremiumInclGst)}`
      : `Single One-Time Premium Policy`,
    `Daily Saving Equivalent: ${formatInr(result.dailySavingEquivalentYear1)} / day`,
    `────────────────────────`,
    `*PROJECTED MATURITY & RETURNS:*`,
    `• Basic Sum Assured: ${formatInr(result.input.sumAssured)}`,
    `• Vested Bonus / GA (@ ₹${result.bonusRatePerThousandUsed}/1000): ${formatInr(result.totalBonusOrGaAtMaturity)}`,
    result.fabAmountAtMaturity > 0
      ? `• Final Additional Bonus (FAB): ${formatInr(result.fabAmountAtMaturity)}`
      : null,
    result.totalSurvivalMoneyBackReceived > 0
      ? `• Survival / Money-Back Payouts: ${formatInr(result.totalSurvivalMoneyBackReceived)}`
      : null,
    `*Total Projected Benefit: ${formatInr(result.totalValueDelivered)}*`,
    `Total Premium Invested: ${formatInr(result.totalPremiumPaidOverPptInclGst)}`,
    `Tax Rebate u/s 80C · Tax-Free Maturity u/s 10(10D)`,
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsAppText);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row items-start gap-6 sm:gap-8 w-full">
      {/* Left Column: Responsive Android Handset Frame */}
      <div className="w-full max-w-[420px] mx-auto lg:mx-0 shrink-0 bg-slate-900 rounded-[32px] sm:rounded-[36px] p-2.5 sm:p-3 shadow-xl border border-slate-800">
        {/* Android Status Bar */}
        <div className="bg-slate-950 text-slate-300 px-4 pt-2 pb-1.5 rounded-t-[24px] flex items-center justify-between text-[11px] font-mono tabular-nums">
          <span>09:41</span>
          <span className="text-slate-400 truncate px-2">5G · Policy Manager - Agent</span>
          <span>100%</span>
        </div>

        {/* Android App Top Bar with Policy Manager - Agent Emblem */}
        <div className="bg-blue-950 text-white px-3.5 py-2.5 flex items-center justify-between gap-2 border-b border-blue-900">
          <div className="flex items-center gap-2 min-w-0">
            <LicAgentFamilyIcon className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold tracking-tight truncate">
                Policy Manager - Agent
              </div>
              <div className="text-[10px] text-amber-300 truncate font-mono tabular-nums">
                {agentName} · {agencyCode}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileTab('alerts')}
            className="px-2.5 py-1.5 bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{notifications.length}</span>
          </button>
        </div>

        {/* Quick 5-Tile Hub Bar Inside Android Screen (Add Policy, Bulk Excel, Birthday, Free AI, Profile) */}
        <div className="bg-slate-900 px-2 py-2 grid grid-cols-5 gap-1 border-b border-slate-800">
          <button
            onClick={() => onOpenHubSubView('add_policy')}
            className="py-1.5 px-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-200 hover:bg-blue-600/30 text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 truncate"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Add Policy</span>
          </button>
          <button
            onClick={() => onOpenHubSubView('bulk_upload')}
            className="py-1.5 px-1 rounded-lg bg-emerald-600/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-600/30 text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 truncate"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Bulk Excel</span>
          </button>
          <button
            onClick={() => onOpenHubSubView('birthdays')}
            className="py-1.5 px-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30 text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 truncate"
          >
            <Cake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Birthday</span>
          </button>
          <button
            onClick={() => onOpenHubSubView('ai_advisor')}
            className="py-1.5 px-1 rounded-lg bg-indigo-600/25 border border-indigo-400/40 text-indigo-200 hover:bg-indigo-600/35 text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 truncate"
          >
            <Award className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span className="truncate">Free AI</span>
          </button>
          <button
            onClick={() => onOpenHubSubView('profile')}
            className="py-1.5 px-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-[10px] font-semibold flex flex-col items-center justify-center gap-0.5 truncate"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="truncate">Profile</span>
          </button>
        </div>

        {/* Scrollable Viewport Area */}
        <div className="bg-slate-50 h-[530px] overflow-y-auto p-3 space-y-3">
          {/* TAB 1: CALCULATOR */}
          {mobileTab === 'calc' && (
            <>
              <div className="bg-white rounded-2xl p-3 border border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-medium text-slate-500 truncate">
                    {plan.category} · Plan {plan.planNo}
                  </span>
                  <button
                    onClick={() => setMobileTab('plans')}
                    className="text-xs font-semibold text-blue-700 hover:underline whitespace-nowrap shrink-0"
                  >
                    Switch Plan ({LIC_PLANS.length})
                  </button>
                </div>
                <div className="text-sm sm:text-base font-bold text-slate-900">{plan.name}</div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{plan.tagline}</p>
              </div>

              {/* Live Premium Banner */}
              <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] text-slate-400 truncate">
                    1st Yr {result.input.paymentMode} (incl. {result.firstYearGstRatePct}% GST)
                  </span>
                  <span className="text-[11px] font-mono text-amber-400 tabular-nums shrink-0">
                    {formatInr(result.dailySavingEquivalentYear1)}/day
                  </span>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums tracking-tight">
                  {formatInr(result.firstYearModalPremiumInclGst)}
                </div>
                {result.effectivePpt > 1 && (
                  <div className="text-xs text-slate-300 font-mono tabular-nums pt-1 border-t border-slate-800 flex justify-between">
                    <span>2nd Yr+ (incl. {result.subsequentYearGstRatePct}% GST):</span>
                    <span className="font-semibold text-white">
                      {formatInr(result.subsequentYearModalPremiumInclGst)}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-slate-400">Total Invested</div>
                    <div className="font-mono font-semibold text-slate-100 tabular-nums mt-0.5">
                      {formatInrCompact(result.totalPremiumPaidOverPptInclGst)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400">Maturity Benefit</div>
                    <div className="font-mono font-bold text-amber-400 tabular-nums mt-0.5">
                      {formatInrCompact(result.totalValueDelivered)}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setQuickAdding((v) => !v)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    + Save as Policy
                  </button>
                  <button
                    onClick={handleCopyWhatsApp}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors"
                  >
                    {copiedWhatsApp ? 'Copied!' : 'WhatsApp'}
                  </button>
                </div>
              </div>

              {quickAdding && (
                <form
                  onSubmit={handleQuickSaveCurrentCalcAsPolicy}
                  className="bg-blue-50/90 border border-blue-200 rounded-2xl p-3 space-y-2.5"
                >
                  <div className="text-xs font-bold text-blue-950">
                    Store Customer Policy into LIC Agent Family Book
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">
                        Policy Number
                      </label>
                      <input
                        type="text"
                        required
                        value={quickPolNo}
                        onChange={(e) => setQuickPolNo(e.target.value)}
                        className="w-full h-8 px-2 bg-white rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600">
                        Customer DOB
                      </label>
                      <input
                        type="date"
                        required
                        value={quickDob}
                        onChange={(e) => setQuickDob(e.target.value)}
                        className="w-full h-8 px-2 bg-white rounded-lg border border-slate-300 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600">
                      Next Renewal Due Date
                    </label>
                    <input
                      type="date"
                      required
                      value={quickDue}
                      onChange={(e) => setQuickDue(e.target.value)}
                      className="w-full h-8 px-2 bg-white rounded-lg border border-slate-300 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPolicy}
                    className="w-full py-2 bg-blue-700 text-white text-xs font-semibold rounded-lg"
                  >
                    {savingPolicy ? 'Saving...' : 'Confirm & Create Renewal Alert'}
                  </button>
                </form>
              )}

              {/* Touch Sliders & Riders */}
              <div className="bg-white rounded-2xl p-3 border border-slate-200 space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Customer Name & Mobile
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={input.clientName}
                      onChange={(e) => onUpdateInput({ clientName: e.target.value })}
                      className="h-8 px-2.5 border border-slate-300 rounded-lg text-xs"
                      placeholder="Customer Name"
                    />
                    <input
                      type="tel"
                      value={input.clientPhone}
                      onChange={(e) => onUpdateInput({ clientPhone: e.target.value })}
                      className="h-8 px-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                      placeholder="+91..."
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Entry Age</span>
                    <span className="font-mono font-semibold text-blue-900 tabular-nums">
                      {result.input.entryAge} Yrs
                    </span>
                  </div>
                  <input
                    type="range"
                    min={plan.minAge}
                    max={plan.maxAge}
                    value={result.input.entryAge}
                    onChange={(e) => onUpdateInput({ entryAge: Number(e.target.value) })}
                    className="w-full accent-blue-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">Basic Sum Assured</span>
                    <span className="font-mono font-semibold text-blue-900 tabular-nums">
                      {formatInr(result.input.sumAssured)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={plan.minSumAssured}
                    max={Math.max(5000000, plan.minSumAssured * 10)}
                    step={plan.saMultiple}
                    value={result.input.sumAssured}
                    onChange={(e) => onUpdateInput({ sumAssured: Number(e.target.value) })}
                    className="w-full accent-blue-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* AD-DB & PWB (PWA) Rider Checkboxes */}
                {plan.pptRule !== 'single' && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-700">
                      LIC Riders (AD-DB · PWB/PWA · Term · CI)
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={input.addbRider}
                          onChange={(e) => onUpdateInput({ addbRider: e.target.checked })}
                          className="w-3.5 h-3.5 accent-blue-700"
                        />
                        <span className="truncate font-medium">AD-DB Rider</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={input.pwbRider}
                          onChange={(e) => onUpdateInput({ pwbRider: e.target.checked })}
                          className="w-3.5 h-3.5 accent-blue-700"
                        />
                        <span className="truncate font-medium">PWB / PWA Rider</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={input.termRider}
                          onChange={(e) => onUpdateInput({ termRider: e.target.checked })}
                          className="w-3.5 h-3.5 accent-blue-700"
                        />
                        <span className="truncate font-medium">Term Rider</span>
                      </label>
                      <label className="flex items-center gap-1.5 p-1.5 rounded-lg border border-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={input.criticalIllnessRider}
                          onChange={(e) => onUpdateInput({ criticalIllnessRider: e.target.checked })}
                          className="w-3.5 h-3.5 accent-blue-700"
                        />
                        <span className="truncate font-medium">Critical Illness</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* TAB 2: ANDROID CUSTOMER POLICIES VAULT */}
          {mobileTab === 'policies' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-700">
                  Policy Book ({policies.length})
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenHubSubView('bulk_upload')}
                    className="text-xs font-semibold text-emerald-700 flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Bulk Excel</span>
                  </button>
                  <button
                    onClick={() => onOpenHubSubView('add_policy')}
                    className="text-xs font-semibold text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              {policies.map((pol) => (
                <div
                  key={pol.id}
                  className="bg-white rounded-2xl p-3 border border-slate-200 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                    <span>#{pol.policyNumber} · {pol.status}</span>
                    <span>DOB: {pol.dateOfBirth} ({calculateAgeFromDob(pol.dateOfBirth)}Y)</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{pol.customerName}</div>
                      <div className="text-xs text-slate-600 truncate">
                        {pol.planName} · Plan {pol.planNo}
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenHubSubView('birthdays')}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold rounded-lg flex items-center gap-1 shrink-0"
                    >
                      <Cake className="w-3 h-3" />
                      <span>Wish Image</span>
                    </button>
                  </div>
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
                    <div>
                      <div className="text-slate-400 font-sans">Premium</div>
                      <div className="font-bold text-slate-900">{formatInr(pol.premiumAmount)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 font-sans">Next Due</div>
                      <div className="font-semibold text-blue-800">{pol.nextRenewalDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 font-sans">Maturity</div>
                      <div className="font-bold text-emerald-700">
                        {formatInrCompact(pol.maturityAmount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ANDROID RENEWAL & PLAN NOTIFICATIONS */}
          {mobileTab === 'alerts' && (
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-700 px-1">
                Renewal & Policy Plan Notifications ({notifications.length})
              </div>
              {notifications.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-500 border border-slate-200">
                  No urgent renewal or grace period alerts.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white rounded-2xl p-3 border border-slate-200 space-y-2"
                  >
                    <div className="text-[11px] font-mono text-amber-700 font-semibold tabular-nums">
                      Policy #{n.policy.policyNumber} · Due {n.policy.nextRenewalDate}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{n.title}</div>
                    <div className="text-[11px] text-slate-600">{n.subtitle}</div>
                    {n.recommendedPlanUpsell && (
                      <div className="text-[11px] text-blue-800 bg-blue-50/70 p-2 rounded-lg">
                        Plan Advisory: {n.recommendedPlanUpsell}
                      </div>
                    )}
                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                        {formatInr(n.policy.premiumAmount)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {n.type === 'birthday_cross_sell' && (
                          <button
                            onClick={() => onOpenHubSubView('birthdays')}
                            className="px-2.5 py-1.5 bg-amber-500 text-slate-950 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                          >
                            <Cake className="w-3 h-3" />
                            <span>Wish Image</span>
                          </button>
                        )}
                        <button
                          onClick={() => markPolicyRenewalPaid(n.policy)}
                          className="px-2.5 py-1.5 bg-slate-900 text-white text-[11px] font-semibold rounded-lg flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Mark Paid</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: ALL 15 LIC PLANS (INCLUDING JEEVAN TARUN 734) */}
          {mobileTab === 'plans' && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 px-1">
                Select LIC Plan ({LIC_PLANS.length} Plans incl. Jeevan Tarun 734)
              </div>
              {LIC_PLANS.map((p) => {
                const isSelected = p.id === plan.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      onUpdateInput({
                        planId: p.id,
                        entryAge: Math.max(p.minAge, Math.min(p.maxAge, input.entryAge)),
                        policyTerm: p.fixedTerms
                          ? p.fixedTerms[0]
                          : Math.max(p.minTerm, Math.min(p.maxTerm, input.policyTerm)),
                        ppt: p.pptOptions ? p.pptOptions[0] : input.ppt,
                        sumAssured: Math.max(p.minSumAssured, input.sumAssured),
                      });
                      setMobileTab('calc');
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-600'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] text-slate-500">
                        Plan {p.planNo} · {p.category}
                      </div>
                      <div className="text-sm font-semibold text-slate-900 truncate">{p.name}</div>
                      <div className="text-xs text-slate-600 truncate mt-0.5">{p.tagline}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 5: AGENT PROFILE & ABOUT DHARMENDRA YADAV */}
          {mobileTab === 'profile' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <LicAgentFamilyIcon className="w-10 h-10 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{agentName}</div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      Agency Code: {agencyCode} · {branchCode}
                    </div>
                    <div className="text-[11px] text-blue-700 font-mono truncate">{agentMobile}</div>
                  </div>
                </div>
                <button
                  onClick={() => onOpenHubSubView('profile')}
                  className="w-full py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
                >
                  Open Full Agent Profile & Edit Info
                </button>
              </div>

              <AboutDharmendraCard compact />

              <div className="bg-emerald-950 text-emerald-50 rounded-2xl p-3 border border-emerald-800 space-y-2">
                <div className="text-xs font-semibold text-emerald-300">
                  WhatsApp Illustration Preview
                </div>
                <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed text-emerald-100 max-h-40 overflow-y-auto">
                  {whatsAppText}
                </pre>
                <button
                  onClick={handleCopyWhatsApp}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  {copiedWhatsApp ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied Quotation</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy WhatsApp Quotation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Android Material 3 Bottom Navigation Bar (5 Tabs, 44px+ hit targets) */}
        <div className="bg-white border-t border-slate-200 rounded-b-[24px] grid grid-cols-5 h-16 px-1">
          <button
            onClick={() => setMobileTab('calc')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              mobileTab === 'calc' ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span className="text-[10px] mt-1">Calc</span>
          </button>
          <button
            onClick={() => setMobileTab('policies')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              mobileTab === 'policies' ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px] mt-1">Policies</span>
          </button>
          <button
            onClick={() => setMobileTab('alerts')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              mobileTab === 'alerts' ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="text-[10px] mt-1">Alerts ({notifications.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('plans')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              mobileTab === 'plans' ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] mt-1">Plans (15)</span>
          </button>
          <button
            onClick={() => setMobileTab('profile')}
            className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
              mobileTab === 'profile' ? 'text-blue-700 font-semibold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-[10px] mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Right Column: Unified Agent Hub Quick Cards + About Dharmendra Yadav + Live C# State */}
      <div className="flex-1 w-full min-w-0 space-y-6">
        {/* Quick Hub Launcher Card (Add Policy, Bulk Excel Upload, Birthday Wishes, Notifications, Profile) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-semibold text-blue-700">
                LIC Agent Family · Logged-In Agent Operations Hub
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                Quick Access: Add Policy, Bulk Excel, Birthday Card, Alerts & Profile
              </h3>
            </div>
            <button
              onClick={onSwitchToCSharpTab}
              className="px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors shrink-0"
            >
              Inspect C# (.NET 8 MAUI) Code
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            <button
              onClick={() => onOpenHubSubView('add_policy')}
              className="p-4 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-left space-y-1 transition-colors"
            >
              <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-700" />
                <span>1. Add Customer Policy</span>
              </div>
              <p className="text-xs text-slate-600">
                Store Policy No., DOB, Premium & Maturity with 1-click actuarial auto-calculation.
              </p>
            </button>

            <button
              onClick={() => onOpenHubSubView('bulk_upload')}
              className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-left space-y-1 transition-colors"
            >
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>2. Bulk Excel Upload</span>
              </div>
              <p className="text-xs text-slate-600">
                Upload .xlsx / .csv inside login hub. Saves only policy data without storing the Excel file.
              </p>
            </button>

            <button
              onClick={() => onOpenHubSubView('birthdays')}
              className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 text-left space-y-1 transition-colors"
            >
              <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Cake className="w-4 h-4 text-amber-600" />
                <span>3. Birthday Wish Image</span>
              </div>
              <p className="text-xs text-slate-600">
                Create dynamic 1080×1080 HD Birthday Greeting Cards to send directly on WhatsApp.
              </p>
            </button>

            <button
              onClick={() => onOpenHubSubView('notifications')}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left space-y-1 transition-colors"
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-600" />
                <span>4. Renewal Notifications ({notifications.length})</span>
              </div>
              <p className="text-xs text-slate-600">
                Track 30-day Grace Period alerts, upcoming renewals, and LIC plan advisories.
              </p>
            </button>

            <button
              onClick={() => onOpenHubSubView('profile')}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left space-y-1 transition-colors sm:col-span-2 xl:col-span-2"
            >
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-700" />
                <span>
                  5. Agent Profile View ({agentName} · Code: {agencyCode})
                </span>
              </div>
              <p className="text-xs text-slate-600">
                View & edit your logged-in LIC Agent profile, portfolio KPIs, and Senior Consultant & Developer bio.
              </p>
            </button>
          </div>
        </div>

        {/* About Dharmendra Yadav — Developer & Senior LIC Consultant Card */}
        <AboutDharmendraCard />
      </div>
    </div>
  );
};
