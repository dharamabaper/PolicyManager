import React, { useState } from 'react';
import {
  Calculator,
  Share2,
  Copy,
  Check,
  RotateCcw,
  Plus,
  Sparkles,
  Calendar,
  User,
  Phone,
  Shield,
  FileSpreadsheet,
  Cake,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  LIC_PLANS,
  LicActuarialResult,
  LicCalculationInput,
  PaymentMode,
  formatInr,
  formatInrCompact,
} from '../data/licPlans';
import { CustomerPolicyRecord } from '../services/policyService';
import { AndroidBridge } from '../utils/androidBridge';

interface LicCalculatorAndroidViewProps {
  planId: string;
  input: LicCalculationInput;
  result: LicActuarialResult;
  policies: CustomerPolicyRecord[];
  agentName: string;
  agencyCode: string;
  agentMobile: string;
  onUpdateInput: (patch: Partial<LicCalculationInput>) => void;
  onSelectPlan: (planId: string) => void;
  onSaveCurrentAsPolicy: (policyData: {
    policyNumber: string;
    customerDob: string;
    nextRenewalDate: string;
  }) => Promise<void>;
  onOpenHubSubView: (subView: 'policies' | 'add_policy' | 'bulk_upload' | 'birthdays' | 'notifications' | 'profile' | 'ai_advisor') => void;
  onNavigateToTab: (tab: string) => void;
}

export const LicCalculatorAndroidView: React.FC<LicCalculatorAndroidViewProps> = ({
  input,
  result,
  policies,
  agentName,
  agencyCode,
  agentMobile,
  onUpdateInput,
  onSelectPlan,
  onSaveCurrentAsPolicy,
  onOpenHubSubView,
  onNavigateToTab,
}) => {
  const { plan } = result;

  const [copiedQuote, setCopiedQuote] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Quick Policy Vault Save Form State
  const [quickPolicyNo, setQuickPolicyNo] = useState(() => `89${Math.floor(1000000 + Math.random() * 9000000)}`);
  const [quickDob, setQuickDob] = useState('1994-06-15');
  const [quickRenewalDate, setQuickRenewalDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });

  const generateWhatsAppQuoteText = () => {
    return [
      `*POLICY MANAGER - AGENT — BENEFIT ILLUSTRATION*`,
      `Advisor: *${agentName}* (LIC Code: ${agencyCode} · ${agentMobile})`,
      `Client: *${input.clientName || 'Valued Client'}* (Age: ${result.input.entryAge} Yrs)`,
      `Plan: *${plan.name}* (Plan ${plan.planNo})`,
      `Term: ${result.effectivePolicyTerm} Yrs · PPT: ${result.effectivePpt} Yrs`,
      `Basic Sum Assured: *${formatInr(result.input.sumAssured)}*`,
      `Payment Mode: ${result.input.paymentMode}`,
      `────────────────────────`,
      `*1st Year Premium (incl. ${result.firstYearGstRatePct}% GST):* ${formatInr(result.firstYearModalPremiumInclGst)}`,
      result.effectivePpt > 1
        ? `*2nd Year Onwards (incl. ${result.subsequentYearGstRatePct}% GST):* ${formatInr(result.subsequentYearModalPremiumInclGst)}`
        : `Single One-Time Premium Policy`,
      `Daily Saving Equivalent: ${formatInr(result.dailySavingEquivalentYear1)} / day`,
      `────────────────────────`,
      `*PROJECTED MATURITY & RETURNS:*`,
      `• Basic Sum Assured: ${formatInr(result.input.sumAssured)}`,
      `• Bonus / Guaranteed Additions: ${formatInr(result.totalBonusOrGaAtMaturity)}`,
      result.fabAmountAtMaturity > 0
        ? `• Final Additional Bonus (FAB): ${formatInr(result.fabAmountAtMaturity)}`
        : null,
      result.totalSurvivalMoneyBackReceived > 0
        ? `• Cumulative Survival Payouts: ${formatInr(result.totalSurvivalMoneyBackReceived)}`
        : null,
      `*Total Value Delivered: ${formatInr(result.totalValueDelivered)}*`,
      `Total Premium Invested: ${formatInr(result.totalPremiumPaidOverPptInclGst)}`,
      result.estimatedIrrPct > 0 ? `Tax-Free Yield: ~${result.estimatedIrrPct}% IRR` : null,
      `Tax Rebate u/s 80C · Tax-Free Maturity u/s 10(10D)`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleCopyQuote = async () => {
    AndroidBridge.vibrate(30);
    const text = generateWhatsAppQuoteText();
    const success = await AndroidBridge.copyToClipboard(text);
    if (success) {
      setCopiedQuote(true);
      setTimeout(() => setCopiedQuote(false), 2200);
    }
  };

  const handleShareWhatsApp = () => {
    AndroidBridge.vibrate(40);
    const text = generateWhatsAppQuoteText();
    const clientPhone = input.clientPhone || agentMobile || '9926684274';
    AndroidBridge.openWhatsApp(clientPhone, text);
  };

  const handleSavePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    setSaveSuccessMsg(null);
    try {
      await onSaveCurrentAsPolicy({
        policyNumber: quickPolicyNo.trim() || '895412098',
        customerDob: quickDob,
        nextRenewalDate: quickRenewalDate,
      });
      AndroidBridge.vibrate([40, 30, 40]);
      setSaveSuccessMsg(`Policy #${quickPolicyNo} saved successfully to your vault!`);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveSuccessMsg(null);
      }, 1500);
    } catch {
      setSaveSuccessMsg('Could not save policy. Please try again.');
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 no-print">
      {/* 1. Android Active Plan Header Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
            {plan.category} · Plan {plan.planNo}
          </span>
          <button
            onClick={() => onNavigateToTab('plans')}
            className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>View 15 Plans</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Plan Dropdown for Android */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-700">
            Selected LIC Plan
          </label>
          <select
            value={plan.id}
            onChange={(e) => onSelectPlan(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          >
            {LIC_PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — Plan {p.planNo}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-slate-500 pt-1 leading-snug">
            {plan.tagline} · UIN {plan.uin}
          </p>
        </div>
      </div>

      {/* 2. Android Live Modal Premium Card (High Contrast Material Card) */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg space-y-3.5 border border-slate-800">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-xs font-medium text-slate-300">
            1st Year {result.input.paymentMode} Premium
          </div>
          <div className="text-xs font-mono font-semibold text-amber-400 tabular-nums">
            {formatInr(result.dailySavingEquivalentYear1)} / day
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2">
          <div className="text-3xl font-extrabold font-mono tracking-tight text-white tabular-nums">
            {formatInr(result.firstYearModalPremiumInclGst)}
          </div>
          <span className="text-[11px] text-slate-400">incl. {result.firstYearGstRatePct}% GST</span>
        </div>

        {result.effectivePpt > 1 && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-xs text-slate-300 font-mono tabular-nums">
            <span className="text-[11px] text-slate-400">2nd Yr+ Premium ({result.subsequentYearGstRatePct}% GST):</span>
            <span className="font-bold text-white">
              {formatInr(result.subsequentYearModalPremiumInclGst)}
            </span>
          </div>
        )}

        {/* Investment vs Maturity Summary */}
        <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 block">Total Investment</span>
            <span className="text-sm font-bold font-mono text-slate-100 tabular-nums">
              {formatInrCompact(result.totalPremiumPaidOverPptInclGst)}
            </span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[11px] text-slate-400 block">Maturity Returns</span>
            <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
              {formatInrCompact(result.totalValueDelivered)}
            </span>
          </div>
        </div>

        {/* Android Action Buttons: WhatsApp Share, Copy Quote, Save as Policy */}
        <div className="pt-1 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={handleCopyQuote}
            className="py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            {copiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedQuote ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="py-2.5 px-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>+ Save</span>
          </button>
        </div>
      </div>

      {/* 3. Android Calculation Parameters Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-blue-700" />
            <span>Actuarial Parameters</span>
          </h2>
          <button
            onClick={() => onSelectPlan(plan.id)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Reset plan defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Client Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Customer Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={input.clientName}
                onChange={(e) => onUpdateInput({ clientName: e.target.value })}
                placeholder="Rajesh Sharma"
                className="w-full h-10 pl-8 pr-3 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Customer Mobile
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={input.clientPhone}
                onChange={(e) => onUpdateInput({ clientPhone: e.target.value })}
                placeholder="+91 98201 44510"
                className="w-full h-10 pl-8 pr-3 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Age Slider */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-700">
              Entry Age (Years)
            </label>
            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
              {result.input.entryAge} Years
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

        {/* Policy Term & PPT */}
        <div className="space-y-2">
          {plan.fixedTerms ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Policy Term & PPT
              </label>
              <div className="grid grid-cols-3 gap-2">
                {plan.fixedTerms.map((t) => {
                  const mappedPpt = plan.pptMap?.[t] || t;
                  const active = result.effectivePolicyTerm === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onUpdateInput({ policyTerm: t, ppt: mappedPpt })}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        active
                          ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {t}Y / {mappedPpt}Y
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Policy Term: {result.effectivePolicyTerm} Yrs (PPT: {result.effectivePpt} Yrs)
                </label>
              </div>
              <input
                type="range"
                min={plan.minTerm}
                max={plan.maxTerm}
                value={result.effectivePolicyTerm}
                onChange={(e) => onUpdateInput({ policyTerm: Number(e.target.value) })}
                className="w-full accent-blue-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          )}

          {plan.pptOptions && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                PPT (Premium Paying Term)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {plan.pptOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => onUpdateInput({ ppt: opt })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                      result.effectivePpt === opt
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt} Yrs
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Basic Sum Assured */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-700">
              Basic Sum Assured (₹)
            </label>
            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
              {formatInr(result.input.sumAssured)}
            </span>
          </div>
          <input
            type="range"
            min={plan.minSumAssured}
            max={Math.max(5000000, plan.minSumAssured * 5)}
            step={plan.saMultiple}
            value={result.input.sumAssured}
            onChange={(e) => onUpdateInput({ sumAssured: Number(e.target.value) })}
            className="w-full accent-blue-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        {/* Premium Payment Mode */}
        {plan.pptRule !== 'single' && (
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Payment Mode
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Yearly', 'Half-Yearly', 'Quarterly', 'Monthly (NACH)'] as PaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateInput({ paymentMode: mode })}
                  className={`py-2 px-1 rounded-xl text-[11px] font-semibold border transition-all truncate text-center ${
                    result.input.paymentMode === mode
                      ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {mode === 'Monthly (NACH)' ? 'Monthly' : mode === 'Half-Yearly' ? 'Half-Yr' : mode}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Optional Riders */}
        {plan.pptRule !== 'single' && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="text-xs font-semibold text-slate-700">
              Optional LIC Riders
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={input.addbRider}
                  onChange={(e) => onUpdateInput({ addbRider: e.target.checked })}
                  className="w-4 h-4 accent-blue-700 rounded"
                />
                <span className="font-medium truncate">AD & DB Rider</span>
              </label>

              {(plan.category === 'Child Plan' || plan.id === 'jeevan-tarun-734') && (
                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={input.pwbRider}
                    onChange={(e) => onUpdateInput({ pwbRider: e.target.checked })}
                    className="w-4 h-4 accent-blue-700 rounded"
                  />
                  <span className="font-medium truncate">PWB (PWA) Rider</span>
                </label>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Android Maturity & Commission Breakdown */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Returns & Commission Breakdown
          </h3>
          {result.estimatedIrrPct > 0 && (
            <span className="text-xs font-mono font-bold text-emerald-700">
              ~{result.estimatedIrrPct}% Tax-Free Yield
            </span>
          )}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Basic Sum Assured:</span>
            <span className="font-mono font-semibold text-slate-900">{formatInr(result.input.sumAssured)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Vested Bonus / GA:</span>
            <span className="font-mono font-semibold text-emerald-700">+{formatInr(result.totalBonusOrGaAtMaturity)}</span>
          </div>
          {result.fabAmountAtMaturity > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Final Additional Bonus (FAB):</span>
              <span className="font-mono font-semibold text-emerald-700">+{formatInr(result.fabAmountAtMaturity)}</span>
            </div>
          )}
          {result.totalSurvivalMoneyBackReceived > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Money-Back Survival Payouts:</span>
              <span className="font-mono font-semibold text-blue-800">+{formatInr(result.totalSurvivalMoneyBackReceived)}</span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
            <span>Total Maturity Value:</span>
            <span className="font-mono text-emerald-700 text-sm">{formatInr(result.totalValueDelivered)}</span>
          </div>
          <div className="pt-1.5 flex justify-between text-[11px] text-slate-500 font-mono">
            <span>Estimated 1st Yr Agent Commission:</span>
            <span className="font-bold text-blue-800">{formatInr(result.agentFirstYearTotalCommission)}</span>
          </div>
        </div>
      </div>

      {/* 5. Android Quick Hub Actions Bar (Add Policy, Bulk Excel, Birthday, Alerts) */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 border border-slate-800 space-y-2">
        <div className="text-[11px] text-slate-400 font-medium">Quick Hub Shortcuts</div>
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => onOpenHubSubView('add_policy')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-center transition-all"
          >
            <Plus className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <span className="text-[10px] font-semibold block truncate">Add Policy</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenHubSubView('bulk_upload')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-center transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <span className="text-[10px] font-semibold block truncate">Bulk Excel</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenHubSubView('birthdays')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-center transition-all"
          >
            <Cake className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <span className="text-[10px] font-semibold block truncate">Birthdays</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenHubSubView('ai_advisor')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-center transition-all"
          >
            <Sparkles className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
            <span className="text-[10px] font-semibold block truncate">Free AI</span>
          </button>
        </div>
      </div>

      {/* Save Policy Modal for Android */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                Save to Policy Vault
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePolicySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Policy Number
                </label>
                <input
                  type="text"
                  required
                  value={quickPolicyNo}
                  onChange={(e) => setQuickPolicyNo(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-mono border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={quickDob}
                  onChange={(e) => setQuickDob(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Next Renewal Date
                </label>
                <input
                  type="date"
                  required
                  value={quickRenewalDate}
                  onChange={(e) => setQuickRenewalDate(e.target.value)}
                  className="w-full h-10 px-3 text-xs border border-slate-300 rounded-xl"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div><strong>Customer:</strong> {input.clientName || 'Valued Client'} ({input.clientPhone})</div>
                <div><strong>Plan:</strong> {plan.name} ({plan.planNo})</div>
                <div><strong>Premium:</strong> {formatInr(result.firstYearModalPremiumInclGst)} / {result.input.paymentMode}</div>
              </div>

              {saveSuccessMsg && (
                <div className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="h-10 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPolicy}
                  className="h-10 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                >
                  {savingPolicy ? 'Saving...' : 'Save Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
