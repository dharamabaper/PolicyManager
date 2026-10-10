import React, { useState, useMemo, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  Code2,
  Copy,
  Check,
  Download,
  Printer,
  Smartphone,
  Monitor,
  ArrowUpRight,
  Search,
  RotateCcw,
  Bell,
  Users,
  LogOut,
  Plus,
  Cake,
  UserCheck,
  FileSpreadsheet,
  MessageSquare,
  Calculator,
} from 'lucide-react';
import {
  LIC_PLANS,
  LicPlanCategory,
  LicCalculationInput,
  PaymentMode,
  calculateLicActuarial,
  formatInr,
  formatInrCompact,
} from './data/licPlans';
import { auth, db, handleFirestoreError, OperationType, signOutAgent } from './firebase';
import {
  AgentProfileRecord,
  CustomerPolicyRecord,
  buildPolicyNotifications,
  calculateAgeFromDob,
  clearMobileOtpAgentSession,
  createCustomerPolicyRecord,
  fetchAgentProfile,
  getLocalPoliciesForAgent,
  getSavedMobileOtpAgentSession,
} from './services/policyService';
import { AuthGate } from './components/AuthGate';
import { AndroidHandsetPreview } from './components/AndroidHandsetPreview';
import {
  AgentHubSubView,
  CustomerPoliciesAndAlertsView,
} from './components/CustomerPoliciesAndAlertsView';
import { CSharpStudioView } from './components/CSharpStudioView';
import { LicAiAdvisorView } from './components/LicAiAdvisorView';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import {
  LicAgentFamilyIcon,
  DHARMENDRA_FOUNDER_INFO,
} from './components/LicAgentFamilyBrand';

type ActiveTab =
  | 'calculator'
  | 'policies'
  | 'notifications'
  | 'birthdays'
  | 'ai'
  | 'profile'
  | 'plans'
  | 'schedule'
  | 'csharp';

export default function App() {
  // Authentication & Agent Profile Gate State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfileRecord | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [policies, setPolicies] = useState<CustomerPolicyRecord[]>([]);

  // Workspace Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [hubSubView, setHubSubView] = useState<AgentHubSubView>('policies');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'android'>('desktop');
  const [planCategoryFilter, setPlanCategoryFilter] = useState<LicPlanCategory | 'All'>('All');
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Quick Save Policy from Calculator State
  const [policyNumberInput, setPolicyNumberInput] = useState('895412098');
  const [customerDobInput, setCustomerDobInput] = useState('1994-06-15');
  const [nextRenewalInput, setNextRenewalInput] = useState('2026-10-22');
  const [savingToVault, setSavingToVault] = useState(false);

  const [input, setInput] = useState<LicCalculationInput>({
    clientName: 'Rajesh Sharma',
    clientPhone: '+91 98201 44510',
    planId: 'jeevan-anand-715',
    entryAge: 32,
    policyTerm: 21,
    ppt: 21,
    sumAssured: 1000000,
    paymentMode: 'Yearly',
    addbRider: true,
    termRider: false,
    criticalIllnessRider: false,
    pwbRider: false,
    proposerAge: 32,
  });

  // Track Firebase Auth State OR Mobile OTP Session & Load Agent Profile
  const loadAgentProfile = async (uid?: string) => {
    const targetUid = uid || auth.currentUser?.uid;
    if (targetUid && auth.currentUser?.emailVerified) {
      const profile = await fetchAgentProfile(targetUid);
      if (profile) {
        setAgentProfile({ ...profile, authMethod: 'gmail' });
        return;
      }
    }
    const mobileSession = getSavedMobileOtpAgentSession();
    if (mobileSession) {
      setAgentProfile({ ...mobileSession, authMethod: 'mobile_otp' });
      setPolicies(getLocalPoliciesForAgent(mobileSession.uid));
      return;
    }
    setAgentProfile(null);
  };

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user && user.emailVerified) {
        try {
          await loadAgentProfile(user.uid);
        } catch {
          setAgentProfile(null);
        }
      } else {
        const mobileSession = getSavedMobileOtpAgentSession();
        if (mobileSession) {
          setAgentProfile({ ...mobileSession, authMethod: 'mobile_otp' });
          setPolicies(getLocalPoliciesForAgent(mobileSession.uid));
        } else {
          setAgentProfile(null);
          setPolicies([]);
        }
      }
      setAuthLoading(false);
    });

    const handleLocalVaultUpdate = () => {
      const mobileSession = getSavedMobileOtpAgentSession();
      if (mobileSession && !auth.currentUser?.emailVerified) {
        setAgentProfile({ ...mobileSession, authMethod: 'mobile_otp' });
        setPolicies(getLocalPoliciesForAgent(mobileSession.uid));
      }
    };

    window.addEventListener('lic-mobile-vault-updated', handleLocalVaultUpdate);
    return () => {
      unsubAuth();
      window.removeEventListener('lic-mobile-vault-updated', handleLocalVaultUpdate);
    };
  }, []);

  // Subscribe to Agent's Customer Policies in Firestore (for Gmail Cloud Sessions)
  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified || !agentProfile) return;

    const q = query(
      collection(db, 'policies'),
      where('agentId', '==', firebaseUser.uid)
    );

    const unsubPolicies = onSnapshot(
      q,
      (snapshot) => {
        const list: CustomerPolicyRecord[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CustomerPolicyRecord, 'id'>),
        }));
        setPolicies(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'policies');
      }
    );

    return () => unsubPolicies();
  }, [firebaseUser, agentProfile]);

  const result = useMemo(() => calculateLicActuarial(input), [input]);
  const { plan } = result;
  const notifications = useMemo(() => buildPolicyNotifications(policies), [policies]);

  const updateInput = (patch: Partial<LicCalculationInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
  };

  const handleSelectPlan = (newPlanId: string) => {
    const targetPlan = LIC_PLANS.find((p) => p.id === newPlanId);
    if (!targetPlan) return;

    const clampedAge = Math.max(targetPlan.minAge, Math.min(targetPlan.maxAge, input.entryAge));
    const nextTerm = targetPlan.fixedTerms
      ? targetPlan.fixedTerms[Math.min(1, targetPlan.fixedTerms.length - 1)]
      : Math.max(targetPlan.minTerm, Math.min(targetPlan.maxTerm, input.policyTerm));
    const nextPpt = targetPlan.pptOptions
      ? targetPlan.pptOptions[Math.min(1, targetPlan.pptOptions.length - 1)]
      : nextTerm;
    const nextSa = Math.max(targetPlan.minSumAssured, input.sumAssured);

    setInput((prev) => ({
      ...prev,
      planId: targetPlan.id,
      entryAge: clampedAge,
      policyTerm: nextTerm,
      ppt: nextPpt,
      sumAssured: nextSa,
      paymentMode:
        targetPlan.pptRule === 'single'
          ? 'Single'
          : prev.paymentMode === 'Single'
          ? 'Yearly'
          : prev.paymentMode,
      customBonusRatePerThousand: undefined,
    }));
  };

  const handleStoreCurrentPolicyToFirestore = async () => {
    if (!agentProfile) return;
    setSavingToVault(true);
    try {
      const matYear = new Date().getFullYear() + result.effectivePolicyTerm;
      await createCustomerPolicyRecord({
        agentId: agentProfile.uid,
        policyNumber: policyNumberInput,
        customerName: result.input.clientName || 'Valued Policyholder',
        customerMobile: result.input.clientPhone || '+91 98201 44510',
        dateOfBirth: customerDobInput,
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
        nextRenewalDate: nextRenewalInput,
        maturityDate: `${matYear}-10-15`,
        maturityAmount: result.totalValueDelivered,
        status: 'Active',
        lastReminderSentAt: '',
      });
      setPolicyNumberInput(`89${Math.floor(1000000 + Math.random() * 8999999)}`);
      setSaveToast(`Saved Policy #${policyNumberInput} (${result.input.clientName})`);
      setTimeout(() => setSaveToast(null), 3500);
    } finally {
      setSavingToVault(false);
    }
  };

  const handleLoadPolicyIntoCalculator = (pol: CustomerPolicyRecord) => {
    const age = calculateAgeFromDob(pol.dateOfBirth);
    setInput({
      clientName: pol.customerName,
      clientPhone: pol.customerMobile,
      planId: pol.planId,
      entryAge: age,
      policyTerm: pol.policyTerm,
      ppt: pol.ppt,
      sumAssured: pol.sumAssured,
      paymentMode: pol.paymentMode,
      addbRider: true,
      termRider: false,
      criticalIllnessRider: false,
      pwbRider: false,
      proposerAge: 32,
    });
    setCustomerDobInput(pol.dateOfBirth);
    setPolicyNumberInput(pol.policyNumber);
    setNextRenewalInput(pol.nextRenewalDate);
    setActiveTab('calculator');
  };

  const handleCopyWhatsAppSummary = () => {
    const lines = [
      `*LIC OF INDIA — OFFICIAL BENEFIT ILLUSTRATION*`,
      `Advisor: *${agentProfile?.fullName || 'LIC Advisor'}* (${agentProfile?.mobileNumber || ''})`,
      `Client: *${result.input.clientName || 'Valued Client'}* (Age: ${result.input.entryAge} Yrs)`,
      `Plan: *${plan.name}* — Plan No. ${plan.planNo}`,
      `Policy Term: ${result.effectivePolicyTerm} Yrs · PPT: ${result.effectivePpt} Yrs`,
      `Basic Sum Assured: *${formatInr(result.input.sumAssured)}*`,
      `Payment Mode: ${result.input.paymentMode}`,
      `----------------------------------------`,
      `*1st Year Premium (incl. ${result.firstYearGstRatePct}% GST):* ${formatInr(result.firstYearModalPremiumInclGst)}`,
      result.effectivePpt > 1
        ? `*2nd Year Onwards (incl. ${result.subsequentYearGstRatePct}% GST):* ${formatInr(result.subsequentYearModalPremiumInclGst)}`
        : `One-Time Single Premium Policy`,
      `Daily Saving Equivalent: ${formatInr(result.dailySavingEquivalentYear1)} / day`,
      `----------------------------------------`,
      `*PROJECTED MATURITY & SURVIVAL BENEFITS:*`,
      `• Basic Sum Assured: ${formatInr(result.input.sumAssured)}`,
      `• Vested Bonus / GA (@ ₹${result.bonusRatePerThousandUsed}/1000): ${formatInr(result.totalBonusOrGaAtMaturity)}`,
      result.fabAmountAtMaturity > 0
        ? `• Final Additional Bonus (FAB): ${formatInr(result.fabAmountAtMaturity)}`
        : null,
      result.totalSurvivalMoneyBackReceived > 0
        ? `• Periodic Survival / Money-Back Payouts: ${formatInr(result.totalSurvivalMoneyBackReceived)}`
        : null,
      plan.wholeLifeCoverAfterMaturity && plan.id === 'jeevan-anand-715'
        ? `• Free Post-Maturity Whole Life Risk Cover: ${formatInr(result.input.sumAssured)}`
        : null,
      `*TOTAL PROJECTED BENEFIT: ${formatInr(result.totalValueDelivered)}*`,
      `Total Premium Invested: ${formatInr(result.totalPremiumPaidOverPptInclGst)}`,
      `Tax Deduction u/s 80C & Tax-Free Maturity u/s 10(10D).`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 2200);
  };

  const handleExportScheduleCsv = () => {
    const headers = [
      'Policy Year',
      'Age',
      'Annual Premium (Incl GST)',
      'Cumulative Premium',
      'Annual Bonus/GA',
      'Cumulative Bonus/GA',
      'Survival/MoneyBack Payout',
      'Normal Risk Cover',
      'Accidental Risk Cover',
      'Surrender Value',
      'Loan Eligibility (90% SV)',
    ];
    const rows = result.schedule.map((r) => [
      r.policyYear,
      r.age,
      r.annualPremiumWithGst,
      r.cumulativePremiumPaid,
      r.annualBonusOrGaAccrued,
      r.cumulativeBonusOrGa,
      r.survivalOrMoneyBackPayout,
      r.normalRiskCover,
      r.accidentalRiskCover,
      r.surrenderValue,
      r.loanEligibility,
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LIC_${plan.id}_Schedule_${result.input.clientName.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPlans = useMemo(() => {
    return LIC_PLANS.filter((p) => {
      const matchesCat = planCategoryFilter === 'All' || p.category === planCategoryFilter;
      const q = planSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.planNo.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [planCategoryFilter, planSearchQuery]);

  const openAgentHubSubView = (targetSubView: AgentHubSubView) => {
    setHubSubView(targetSubView);
    if (targetSubView === 'notifications') setActiveTab('notifications');
    else if (targetSubView === 'birthdays') setActiveTab('birthdays');
    else if (targetSubView === 'ai_advisor') setActiveTab('ai');
    else if (targetSubView === 'profile') setActiveTab('profile');
    else setActiveTab('policies');
  };

  const handleSignOutAll = async () => {
    clearMobileOtpAgentSession();
    setAgentProfile(null);
    setPolicies([]);
    try {
      await signOutAgent();
    } catch {
      // ignore
    }
  };

  // GATE ACCESS: Require Mobile Number + OTP OR Gmail Sign-In / Sign-Up before accessing the app
  if (authLoading || !agentProfile) {
    return (
      <AuthGate
        firebaseUser={firebaseUser}
        agentProfile={agentProfile}
        authLoading={authLoading}
        onProfileCompleted={async () => {
          await loadAgentProfile(auth.currentUser?.uid);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Strict 3-Zone Top Bar Contract with LIC Agent Family Emblem */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 no-print">
        {/* Zone 1: Brand Emblem & Policy Manager - Agent Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('calculator');
          }}
          className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap shrink-0"
        >
          <LicAgentFamilyIcon className="w-8 h-8 shrink-0" />
          <span>Policy Manager - Agent</span>
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'calculator'
                ? 'border-blue-700 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => openAgentHubSubView('policies')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'policies'
                ? 'border-blue-700 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Agent Hub ({policies.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'ai'
                ? 'border-blue-700 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Ask Free AI
          </button>
          <button
            onClick={() => openAgentHubSubView('birthdays')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'birthdays'
                ? 'border-blue-700 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Birthday Studio
          </button>
          <button
            onClick={() => setActiveTab('csharp')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeTab === 'csharp'
                ? 'border-blue-700 text-slate-900 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Generate APK
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleSignOutAll}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar for all Android screens */}
      <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-print">
        {(
          [
            { id: 'calculator', label: 'Calculator', action: () => setActiveTab('calculator') },
            {
              id: 'policies',
              label: `Hub & Policies (${policies.length})`,
              action: () => openAgentHubSubView('policies'),
            },
            {
              id: 'ai',
              label: 'Ask Free AI',
              action: () => setActiveTab('ai'),
            },
            {
              id: 'birthdays',
              label: 'Birthday Card',
              action: () => openAgentHubSubView('birthdays'),
            },
            {
              id: 'notifications',
              label: `Alerts (${notifications.length})`,
              action: () => openAgentHubSubView('notifications'),
            },
            {
              id: 'profile',
              label: 'Profile',
              action: () => openAgentHubSubView('profile'),
            },
            { id: 'plans', label: '15 Plans', action: () => setActiveTab('plans') },
            { id: 'schedule', label: '35-Yr Schedule', action: () => setActiveTab('schedule') },
            { id: 'csharp', label: 'Generate APK', action: () => setActiveTab('csharp') },
          ] as { id: ActiveTab; label: string; action: () => void }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={tab.action}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Workspace Sub-Toolbar: Agent Identity, Quick Presets (incl. Jeevan Tarun) & Hub Actions */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 no-print">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Authenticated Agent Info & Quick Plan Loaders */}
          <div className="flex items-center gap-2 overflow-x-auto py-0.5 max-w-full">
            <button
              onClick={() => openAgentHubSubView('profile')}
              className="text-xs text-slate-600 hover:text-blue-700 whitespace-nowrap shrink-0 mr-1 text-left"
            >
              <strong className="text-slate-900">{agentProfile.fullName}</strong> ·{' '}
              <span className="font-mono text-blue-800 font-semibold">
                {agentProfile.agencyCode}
              </span>{' '}
              · <span className="font-mono">{agentProfile.mobileNumber}</span>
            </button>
            <span className="text-slate-300">|</span>
            {[
              { label: '734 Jeevan Tarun', id: 'jeevan-tarun-734' },
              { label: '715 Jeevan Anand', id: 'jeevan-anand-715' },
              { label: '736 Jeevan Labh', id: 'jeevan-labh-736' },
              { label: '745 Jeevan Umang', id: 'jeevan-umang-745' },
              { label: '771 Jeevan Utsav', id: 'jeevan-utsav-771' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  handleSelectPlan(preset.id);
                  setActiveTab('calculator');
                }}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  plan.id === preset.id
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Interactive Mode Switcher & Quick Hub Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {saveToast && (
              <span className="text-xs font-medium text-emerald-700 mr-1 whitespace-nowrap">
                {saveToast}
              </span>
            )}
            <PWAInstallButton />
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
              <button
                onClick={() => {
                  setDeviceMode('desktop');
                  setActiveTab('calculator');
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  deviceMode === 'desktop' && activeTab === 'calculator'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Full Responsive</span>
              </button>
              <button
                onClick={() => {
                  setDeviceMode('android');
                  setActiveTab('calculator');
                }}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  deviceMode === 'android' && activeTab === 'calculator'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Frame</span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'ai'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
                <span>Ask AI (Free)</span>
              </button>
              <button
                onClick={() => openAgentHubSubView('bulk_upload')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'policies' && hubSubView === 'bulk_upload'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bulk Excel</span>
              </button>
              <button
                onClick={() => setActiveTab('plans')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'plans'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>15 Plans</span>
              </button>
              <button
                onClick={() => setActiveTab('csharp')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'csharp'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code2 className="w-3.5 h-3.5 text-blue-700" />
                <span>Generate APK</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* TAB 1: CALCULATOR WORKBENCH OR ANDROID HANDSET SIMULATOR */}
        {activeTab === 'calculator' && (
          <>
            {deviceMode === 'android' ? (
              <AndroidHandsetPreview
                agentId={agentProfile.uid}
                agentName={agentProfile.fullName}
                agentMobile={agentProfile.mobileNumber}
                agencyCode={agentProfile.agencyCode}
                branchCode={agentProfile.branchCode}
                policies={policies}
                input={input}
                result={result}
                onUpdateInput={updateInput}
                onSaveQuote={handleStoreCurrentPolicyToFirestore}
                onSwitchToCSharpTab={() => setActiveTab('csharp')}
                onOpenHubSubView={openAgentHubSubView}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN (4 cols): Plan & Actuarial Inputs */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 no-print">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="text-xs text-slate-500">
                        IRDAI 2024/2026 Revised Actuarial Parameters
                      </div>
                      <h2 className="text-lg font-bold text-slate-900">Policy Configuration</h2>
                    </div>
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      title="Reset plan defaults"
                      className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Plan Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Select LIC Plan
                    </label>
                    <select
                      value={plan.id}
                      onChange={(e) => handleSelectPlan(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      {LIC_PLANS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — Plan {p.planNo}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 text-xs text-slate-500">
                      {plan.category} · Plan {plan.planNo} · UIN {plan.uin}
                    </div>
                  </div>

                  {/* Client Name & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Customer Name
                      </label>
                      <input
                        type="text"
                        value={input.clientName}
                        onChange={(e) => updateInput({ clientName: e.target.value })}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Customer Mobile
                      </label>
                      <input
                        type="text"
                        value={input.clientPhone}
                        onChange={(e) => updateInput({ clientPhone: e.target.value })}
                        placeholder="+91 98201 44510"
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Customer DOB & Policy Number for Cloud Policy Vault */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={customerDobInput}
                        onChange={(e) => {
                          setCustomerDobInput(e.target.value);
                          const computedAge = calculateAgeFromDob(e.target.value);
                          updateInput({
                            entryAge: Math.max(plan.minAge, Math.min(plan.maxAge, computedAge)),
                          });
                        }}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Policy Number
                      </label>
                      <input
                        type="text"
                        value={policyNumberInput}
                        onChange={(e) => setPolicyNumberInput(e.target.value)}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Entry Age Slider */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Entry Age (Nearer Birthday)
                      </label>
                      <span className="font-mono text-sm font-semibold text-blue-900 tabular-nums">
                        {result.input.entryAge} Yrs
                      </span>
                    </div>
                    <input
                      type="range"
                      min={plan.minAge}
                      max={plan.maxAge}
                      value={result.input.entryAge}
                      onChange={(e) => updateInput({ entryAge: Number(e.target.value) })}
                      className="w-full accent-blue-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Policy Term & PPT Controls */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    {plan.pptRule === 'whole_life_100' ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">
                          Whole Life Policy Term (Up to Age 100)
                        </span>
                        <span className="font-mono font-bold text-blue-900 tabular-nums">
                          {result.effectivePolicyTerm} Years
                        </span>
                      </div>
                    ) : plan.fixedTerms ? (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Select Policy Term & PPT Combination
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {plan.fixedTerms.map((t) => {
                            const mappedPpt = plan.pptMap?.[t] || t;
                            const active = result.effectivePolicyTerm === t;
                            return (
                              <button
                                key={t}
                                onClick={() => updateInput({ policyTerm: t, ppt: mappedPpt })}
                                className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-colors whitespace-nowrap ${
                                  active
                                    ? 'bg-blue-700 text-white border-blue-700'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {t}Y / {mappedPpt}Y PPT
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Policy Term (Years)
                          </label>
                          <span className="font-mono text-sm font-semibold text-blue-900 tabular-nums">
                            {result.effectivePolicyTerm} Yrs (PPT: {result.effectivePpt} Yrs)
                          </span>
                        </div>
                        <input
                          type="range"
                          min={plan.minTerm}
                          max={plan.maxTerm}
                          value={result.effectivePolicyTerm}
                          onChange={(e) => updateInput({ policyTerm: Number(e.target.value) })}
                          className="w-full accent-blue-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                        />
                      </div>
                    )}

                    {plan.pptOptions && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Premium Paying Term (PPT — Years)
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {plan.pptOptions.map((pptOpt) => (
                            <button
                              key={pptOpt}
                              onClick={() => updateInput({ ppt: pptOpt })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
                                result.effectivePpt === pptOpt
                                  ? 'bg-blue-700 text-white border-blue-700'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {pptOpt} Yrs
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Basic Sum Assured Input */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Basic Sum Assured (₹)
                      </label>
                      <input
                        type="number"
                        step={plan.saMultiple}
                        min={plan.minSumAssured}
                        value={result.input.sumAssured}
                        onChange={(e) => updateInput({ sumAssured: Number(e.target.value) })}
                        className="w-36 h-8 px-2.5 text-right font-mono text-sm font-semibold border border-slate-300 rounded-lg tabular-nums"
                      />
                    </div>
                    <input
                      type="range"
                      min={plan.minSumAssured}
                      max={Math.max(10000000, plan.minSumAssured * 4)}
                      step={plan.saMultiple}
                      value={result.input.sumAssured}
                      onChange={(e) => updateInput({ sumAssured: Number(e.target.value) })}
                      className="w-full accent-blue-700 h-2 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Payment Mode Selector */}
                  {plan.pptRule !== 'single' && (
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Premium Payment Mode
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {(['Yearly', 'Half-Yearly', 'Quarterly', 'Monthly (NACH)'] as PaymentMode[]).map(
                          (mode) => (
                            <button
                              key={mode}
                              onClick={() => updateInput({ paymentMode: mode })}
                              className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap truncate ${
                                result.input.paymentMode === mode
                                  ? 'bg-blue-700 text-white border-blue-700'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {mode === 'Monthly (NACH)' ? 'Monthly' : mode}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Optional LIC Riders: AD-DB, PWB (PWA), Term Assurance & Critical Illness */}
                  {plan.pptRule !== 'single' && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700">
                          LIC Optional Riders (AD-DB & PWB / PWA)
                        </label>
                        <span className="font-mono text-xs font-semibold text-blue-800 tabular-nums">
                          +{formatInr(result.totalAnnualRidersExclGst)}/yr
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={input.addbRider}
                              onChange={(e) => updateInput({ addbRider: e.target.checked })}
                              className="w-3.5 h-3.5 accent-blue-700"
                            />
                            <span>AD-DB Rider</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {formatInr(result.addbRiderAnnualPremium)}
                          </span>
                        </label>

                        <label className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={input.pwbRider}
                              onChange={(e) => updateInput({ pwbRider: e.target.checked })}
                              className="w-3.5 h-3.5 accent-blue-700"
                            />
                            <span>PWB (PWA) Waiver</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {formatInr(result.pwbRiderAnnualPremium)}
                          </span>
                        </label>

                        <label className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={input.termRider}
                              onChange={(e) => updateInput({ termRider: e.target.checked })}
                              className="w-3.5 h-3.5 accent-blue-700"
                            />
                            <span>Term Rider</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {formatInr(result.termRiderAnnualPremium)}
                          </span>
                        </label>

                        <label className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <span className="flex items-center gap-2 font-medium text-slate-800">
                            <input
                              type="checkbox"
                              checked={input.criticalIllnessRider}
                              onChange={(e) =>
                                updateInput({ criticalIllnessRider: e.target.checked })
                              }
                              className="w-3.5 h-3.5 accent-blue-700"
                            />
                            <span>Critical Illness</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                            {formatInr(result.criticalIllnessAnnualPremium)}
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Store as Customer Policy CTA */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={handleStoreCurrentPolicyToFirestore}
                      disabled={savingToVault}
                      className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {savingToVault
                          ? 'Storing Policy in Cloud...'
                          : 'Store Customer Policy & Create Renewal Alert'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* MIDDLE COLUMN (4 cols): Hero Premium Card & 7-Step Actuarial Formula Sheet */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Plan {plan.planNo} · {result.input.paymentMode} Mode
                      </span>
                      <span className="font-mono text-amber-400 tabular-nums">
                        {formatInr(result.dailySavingEquivalentYear1)} / day
                      </span>
                    </div>

                    <div>
                      <div className="text-xs text-slate-300">
                        1st Policy Year {result.input.paymentMode} Premium (incl. {result.firstYearGstRatePct}% GST)
                      </div>
                      <div className="text-4xl font-bold font-mono tabular-nums tracking-tight mt-1">
                        {formatInr(result.firstYearModalPremiumInclGst)}
                      </div>
                    </div>

                    {result.effectivePpt > 1 ? (
                      <div className="pt-3 border-t border-slate-800 flex items-baseline justify-between">
                        <span className="text-xs text-slate-300">
                          2nd Year Onwards (incl. {result.subsequentYearGstRatePct}% GST)
                        </span>
                        <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                          {formatInr(result.subsequentYearModalPremiumInclGst)}
                        </span>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-slate-800 text-xs text-slate-300">
                        One-Time Single Premium Payment
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-slate-400">Total Invested ({result.effectivePpt} Yrs)</div>
                        <div className="text-base font-mono font-semibold text-white tabular-nums mt-0.5">
                          {formatInr(result.totalPremiumPaidOverPptInclGst)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400">Total Projected Benefit</div>
                        <div className="text-base font-mono font-bold text-emerald-400 tabular-nums mt-0.5">
                          {formatInr(result.totalValueDelivered)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step LIC Actuarial Calculation Sheet */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <div className="pb-3 border-b border-slate-200">
                      <div className="text-xs text-slate-500">
                        Exact 7-Step LIC Actuarial Derivation
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        How This Premium Is Calculated
                      </h3>
                    </div>

                    <div className="divide-y divide-slate-100 text-xs mt-2">
                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800">
                            01. Tabular Rate (Age {result.input.entryAge}, Term {result.effectivePolicyTerm}Y)
                          </div>
                          <div className="text-slate-500">Base rate per ₹1,000 Sum Assured</div>
                        </div>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          ₹{result.tabularRatePerThousand.toFixed(2)}
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800">
                            02. Mode Rebate ({result.input.paymentMode} — {result.modeRebatePct}%)
                          </div>
                          <div className="text-slate-500">Yearly 2% · Half-Yearly 1% · Monthly Nil</div>
                        </div>
                        <span className="font-mono font-medium text-emerald-700 tabular-nums">
                          -₹{result.modeRebatePerThousand.toFixed(2)}
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800">
                            03. High Sum Assured (HSA) Rebate
                          </div>
                          <div className="text-slate-500">
                            Slab discount on {formatInrCompact(result.input.sumAssured)} SA
                          </div>
                        </div>
                        <span className="font-mono font-medium text-emerald-700 tabular-nums">
                          -₹{result.hsaRebatePerThousand.toFixed(2)}
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2 bg-slate-50 -mx-2 px-2 rounded-lg">
                        <div>
                          <div className="font-semibold text-slate-900">
                            04. Net Annual Base Premium (Excl. GST)
                          </div>
                          <div className="text-slate-500 font-mono tabular-nums">
                            ({formatInr(result.input.sumAssured)} ÷ 1000) × ₹{result.netBaseRatePerThousand.toFixed(2)}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900 tabular-nums">
                          {formatInr(result.annualBasePremiumExclGst)}
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800">
                            05. Optional Riders Annual Premium
                          </div>
                          <div className="text-slate-500">ADDB + Term + Critical Illness + PWB</div>
                        </div>
                        <span className="font-mono font-semibold text-slate-800 tabular-nums">
                          +{formatInr(result.totalAnnualRidersExclGst)}
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800">
                            06. {result.input.paymentMode} Modal Installment (Before Tax)
                          </div>
                          <div className="text-slate-500">Net installment before CGST/SGST</div>
                        </div>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatInr(result.modalInstallmentExclGst)}
                        </span>
                      </div>

                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-slate-800">
                            07. GST ({result.firstYearGstRatePct}% Year 1 · {result.subsequentYearGstRatePct}% Year 2+)
                          </div>
                          <div className="text-slate-500">
                            Y1 Tax: {formatInr(result.firstYearModalGst)} · Y2+ Tax:{' '}
                            {formatInr(result.subsequentYearModalGst)}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-blue-800 tabular-nums">
                          {formatInr(result.firstYearModalPremiumInclGst)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN (4 cols): Maturity Benefit Illustration & Actions */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">
                          Section 10(10D) Tax-Free Benefit Illustration
                        </div>
                        <h3 className="text-base font-bold text-slate-900">
                          Maturity & Risk Cover Breakdown
                        </h3>
                      </div>
                      {result.estimatedIrrPct > 0 && (
                        <span className="text-xs font-mono font-semibold text-emerald-700 tabular-nums">
                          ~{result.estimatedIrrPct}% IRR
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">Basic Sum Assured</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {formatInr(result.input.sumAssured)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <span className="text-slate-600">
                          {plan.guaranteedAdditionPerThousand
                            ? `Guaranteed Additions (@ ₹${result.bonusRatePerThousandUsed}/1000)`
                            : `Vested Simple Reversionary Bonus (@ ₹${result.bonusRatePerThousandUsed}/1000)`}
                        </span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          +{formatInr(result.totalBonusOrGaAtMaturity)}
                        </span>
                      </div>

                      {result.fabAmountAtMaturity > 0 && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-600">
                            Final Additional Bonus (FAB @ ₹{result.fabRatePerThousandUsed}/1000)
                          </span>
                          <span className="font-mono font-semibold text-slate-900 tabular-nums">
                            +{formatInr(result.fabAmountAtMaturity)}
                          </span>
                        </div>
                      )}

                      {result.totalSurvivalMoneyBackReceived > 0 && (
                        <div className="flex items-center justify-between py-1">
                          <span className="text-slate-600">
                            Cumulative Periodic Survival / Income Payouts
                          </span>
                          <span className="font-mono font-semibold text-blue-800 tabular-nums">
                            +{formatInr(result.totalSurvivalMoneyBackReceived)}
                          </span>
                        </div>
                      )}

                      <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                        <span className="text-sm font-bold text-slate-900">
                          Total Projected Benefit Value
                        </span>
                        <span className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
                          {formatInr(result.totalValueDelivered)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 grid grid-cols-2 gap-2.5 no-print">
                      <button
                        onClick={handleCopyWhatsAppSummary}
                        className="h-10 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {copiedWhatsApp ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Copied for WhatsApp</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy WhatsApp Quote</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Illustration</span>
                      </button>
                    </div>
                  </div>

                  {/* Agent Commission & MDRT Earnings Card */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3 no-print">
                    <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-500">Agent Earnings Breakdown</div>
                        <h3 className="text-sm font-bold text-slate-900">
                          LIC Agent Commission Estimator
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-slate-500 tabular-nums">
                        1st Yr: {plan.commissionFirstYearPct}% + {plan.commissionBonusPct}% Bonus
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Total 1st Year Agent Commission
                        </span>
                        <span className="font-mono font-bold text-blue-700 tabular-nums">
                          {formatInr(result.agentFirstYearTotalCommission)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-slate-100 font-semibold text-slate-900">
                        <span>Total Policy Lifetime Commission</span>
                        <span className="font-mono text-emerald-700 tabular-nums">
                          {formatInr(result.agentLifetimeCommission)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2, 3, 4 & 5: UNIFIED AGENT OPERATIONS HUB (POLICIES, ADD POLICY, BULK EXCEL, BIRTHDAYS, ALERTS, PROFILE) */}
        {(activeTab === 'policies' ||
          activeTab === 'notifications' ||
          activeTab === 'birthdays' ||
          activeTab === 'profile') && (
          <CustomerPoliciesAndAlertsView
            key={`${activeTab}_${hubSubView}`}
            agentId={agentProfile.uid}
            agentName={agentProfile.fullName}
            agentEmail={agentProfile.email}
            agentMobile={agentProfile.mobileNumber}
            agencyCode={agentProfile.agencyCode}
            branchCode={agentProfile.branchCode}
            authMethod={agentProfile.authMethod}
            policies={policies}
            initialSubView={
              activeTab === 'notifications'
                ? 'notifications'
                : activeTab === 'birthdays'
                ? 'birthdays'
                : activeTab === 'profile'
                ? 'profile'
                : hubSubView
            }
            onLoadPolicyIntoCalculator={handleLoadPolicyIntoCalculator}
            onProfileUpdated={async () => {
              await loadAgentProfile(agentProfile.uid);
            }}
          />
        )}

        {/* TAB: FREE AI LIC ADVISOR */}
        {activeTab === 'ai' && (
          <LicAiAdvisorView
            agentName={agentProfile.fullName}
            agencyCode={agentProfile.agencyCode}
            agentMobile={agentProfile.mobileNumber}
            policies={policies}
          />
        )}

        {/* TAB 6: COMPLETE LIC PLAN MATRIX (15 PLANS INCL. JEEVAN TARUN) — FULL MOBILE RESPONSIVE */}
        {activeTab === 'plans' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500">
                  IRDAI Revised 2024–2026 Master Catalog · {LIC_PLANS.length} Flagship LIC Plans (incl. Jeevan Tarun 734)
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  LIC Plan Actuarial Comparison Matrix
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-full sm:w-auto">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={planSearchQuery}
                    onChange={(e) => setPlanSearchQuery(e.target.value)}
                    placeholder="Search plan name or number..."
                    className="w-full sm:w-56 h-9 pl-9 pr-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto max-w-full">
                  {(
                    [
                      'All',
                      'Endowment',
                      'Whole Life',
                      'Money Back',
                      'Child Plan',
                      'Term Assurance',
                      'Single Premium',
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setPlanCategoryFilter(cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        planCategoryFilter === cat
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MOBILE RESPONSIVE PLAN CARDS (Android Screens < md) */}
            <div className="md:hidden space-y-3">
              {filteredPlans.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-blue-700">
                        {p.category} · Plan {p.planNo}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">{p.name}</div>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-500 shrink-0">
                      {p.uin}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{p.tagline}</p>

                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <div className="text-slate-500">Entry Age</div>
                      <div className="font-mono font-semibold text-slate-900">
                        {p.minAge} – {p.maxAge} Yrs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500">Policy Term</div>
                      <div className="font-mono font-semibold text-slate-900">
                        {p.pptRule === 'whole_life_100'
                          ? '100 - Age'
                          : p.fixedTerms
                          ? p.fixedTerms.join(' / ') + ' Yrs'
                          : `${p.minTerm} – ${p.maxTerm} Yrs`}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Min Sum Assured</div>
                      <div className="font-mono font-bold text-slate-900">
                        {formatInr(p.minSumAssured)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-500">Bonus / GA (per ₹1,000)</div>
                      <div className="font-mono font-bold text-emerald-700">
                        {p.guaranteedAdditionPerThousand
                          ? `₹${p.guaranteedAdditionPerThousand} (GA)`
                          : p.defaultBonusPerThousand.longTerm > 0
                          ? `₹${p.defaultBonusPerThousand.shortTerm}–₹${p.defaultBonusPerThousand.longTerm}`
                          : 'Pure Risk'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSelectPlan(p.id);
                      setActiveTab('calculator');
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>Calculate Premium for {p.name}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* DESKTOP PLAN COMPARISON TABLE (md and up) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3.5 px-4">Plan No & Name</th>
                      <th className="py-3.5 px-4">Category · UIN</th>
                      <th className="py-3.5 px-4 text-right">Entry Age</th>
                      <th className="py-3.5 px-4 text-right">Policy Term</th>
                      <th className="py-3.5 px-4 text-right">Min Sum Assured</th>
                      <th className="py-3.5 px-4 text-right">Bonus / GA (per ₹1,000)</th>
                      <th className="py-3.5 px-4 text-right">1st Yr Comm.</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredPlans.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5 max-w-md">{p.tagline}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 whitespace-nowrap">
                          {p.category} · Plan {p.planNo} · {p.uin}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {p.minAge} – {p.maxAge} Yrs
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {p.pptRule === 'whole_life_100'
                            ? '100 - Age'
                            : p.fixedTerms
                            ? p.fixedTerms.join(' / ') + ' Yrs'
                            : `${p.minTerm} – ${p.maxTerm} Yrs`}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatInr(p.minSumAssured)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-emerald-700 font-semibold tabular-nums whitespace-nowrap">
                          {p.guaranteedAdditionPerThousand
                            ? `₹${p.guaranteedAdditionPerThousand} (Guaranteed)`
                            : p.defaultBonusPerThousand.longTerm > 0
                            ? `₹${p.defaultBonusPerThousand.shortTerm} – ₹${p.defaultBonusPerThousand.longTerm}`
                            : 'Pure Risk Cover'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap">
                          {p.commissionFirstYearPct}%
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => {
                              handleSelectPlan(p.id);
                              setActiveTab('calculator');
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                          >
                            <span>Calculate</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: YEAR-BY-YEAR BENEFIT SCHEDULE — FULL MOBILE RESPONSIVE */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="text-xs text-slate-500">
                  {plan.name} (Plan {plan.planNo}) · Client: {result.input.clientName} · SA:{' '}
                  {formatInr(result.input.sumAssured)}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Year-by-Year Actuarial Cashflow, Risk Cover & Loan Schedule
                </h2>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={handleExportScheduleCsv}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV Schedule</span>
                </button>
              </div>
            </div>

            {/* MOBILE RESPONSIVE YEAR-BY-YEAR SCHEDULE CARDS (Android Screens < md) */}
            <div className="md:hidden space-y-2.5">
              {result.schedule.map((row) => (
                <div
                  key={row.policyYear}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900">
                      Policy Year {row.policyYear} (Age {row.age} Yrs)
                    </span>
                    <span className="font-mono font-bold text-blue-800">
                      {row.annualPremiumWithGst > 0
                        ? `Prem: ${formatInr(row.annualPremiumWithGst)}`
                        : 'Paid-Up (₹0)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <span className="text-slate-500 font-sans">Vested Bonus/GA: </span>
                      <span className="text-emerald-700 font-semibold">
                        {formatInr(row.cumulativeBonusOrGa)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-sans">Risk Cover: </span>
                      <span className="text-slate-900 font-semibold">
                        {formatInrCompact(row.normalRiskCover)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans">Surrender Val: </span>
                      <span className="text-slate-800">
                        {row.surrenderValue > 0 ? formatInrCompact(row.surrenderValue) : '—'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-sans">90% Loan: </span>
                      <span className="text-slate-800">
                        {row.loanEligibility > 0 ? formatInrCompact(row.loanEligibility) : '—'}
                      </span>
                    </div>
                  </div>

                  {row.survivalOrMoneyBackPayout > 0 && (
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-emerald-800 font-bold">
                      <span>Survival / Maturity Payout:</span>
                      <span className="font-mono">{formatInr(row.survivalOrMoneyBackPayout)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* DESKTOP SCHEDULE TABLE (md and up) */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs tabular-nums">
                  <thead>
                    <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                      <th className="py-3 px-4 font-sans">Year</th>
                      <th className="py-3 px-4 font-sans">Age</th>
                      <th className="py-3 px-4 text-right font-sans">Annual Premium</th>
                      <th className="py-3 px-4 text-right font-sans">Cumulative Paid</th>
                      <th className="py-3 px-4 text-right font-sans">Vested Bonus / GA</th>
                      <th className="py-3 px-4 text-right font-sans">Survival / Maturity</th>
                      <th className="py-3 px-4 text-right font-sans">Normal Risk Cover</th>
                      <th className="py-3 px-4 text-right font-sans">Accidental Cover</th>
                      <th className="py-3 px-4 text-right font-sans">Surrender Value</th>
                      <th className="py-3 px-4 text-right font-sans">Loan Available (90%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {result.schedule.map((row) => (
                      <tr key={row.policyYear} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-slate-900">Year {row.policyYear}</td>
                        <td className="py-2.5 px-4 text-slate-600">{row.age} Yrs</td>
                        <td className="py-2.5 px-4 text-right text-slate-800">
                          {row.annualPremiumWithGst > 0
                            ? formatInr(row.annualPremiumWithGst)
                            : 'Paid-Up (₹0)'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">
                          {formatInr(row.cumulativePremiumPaid)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-emerald-700">
                          {formatInr(row.cumulativeBonusOrGa)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-blue-800 font-bold">
                          {row.survivalOrMoneyBackPayout > 0
                            ? formatInr(row.survivalOrMoneyBackPayout)
                            : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-900 font-semibold">
                          {formatInr(row.normalRiskCover)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-700">
                          {formatInr(row.accidentalRiskCover)}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600">
                          {row.surrenderValue > 0 ? formatInr(row.surrenderValue) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-700">
                          {row.loanEligibility > 0 ? formatInr(row.loanEligibility) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: C# (.NET 8 MAUI) ANDROID SOURCE CODE STUDIO */}
        {activeTab === 'csharp' && <CSharpStudioView activeResult={result} />}
      </main>

      {/* Quiet Footer */}
      <OfflineIndicator />
      <footer className="border-t border-slate-200 bg-white px-4 sm:px-6 py-4 mt-12 mb-16 md:mb-0 no-print">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Policy Manager - Agent · Created by {DHARMENDRA_FOUNDER_INFO.name} (Senior Consultant · Code:{' '}
            {DHARMENDRA_FOUNDER_INFO.agencyCode}) · Active Agent: {agentProfile.fullName} ({agentProfile.agencyCode})
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('ai')}
              className="hover:text-slate-900 underline"
            >
              Ask Free AI Advisor
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('schedule')}
              className="hover:text-slate-900 underline"
            >
              35-Year Benefit Schedule
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveTab('csharp')}
              className="hover:text-slate-900 underline"
            >
              Generate Android APK & C# Source
            </button>
          </div>
        </div>
      </footer>

      {/* Native Android Mobile Bottom Navigation Bar (Visible on all phones < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950 text-slate-300 border-t border-slate-800 grid grid-cols-6 py-1.5 px-1 no-print">
        <button
          onClick={() => setActiveTab('calculator')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
            activeTab === 'calculator' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Calculator className="w-4 h-4 mb-0.5" />
          <span className="truncate">Calc</span>
        </button>
        <button
          onClick={() => openAgentHubSubView('policies')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
            activeTab === 'policies' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span className="truncate">Policies</span>
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
            activeTab === 'ai' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <MessageSquare className="w-4 h-4 mb-0.5" />
          <span className="truncate">Free AI</span>
        </button>
        <button
          onClick={() => openAgentHubSubView('birthdays')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
            activeTab === 'birthdays' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Cake className="w-4 h-4 mb-0.5" />
          <span className="truncate">Birthday</span>
        </button>
        <button
          onClick={() => openAgentHubSubView('notifications')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
            activeTab === 'notifications' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Bell className="w-4 h-4 mb-0.5" />
          <span className="truncate">Alerts ({notifications.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('csharp')}
          className={`flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-medium ${
            activeTab === 'csharp' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Code2 className="w-4 h-4 mb-0.5" />
          <span className="truncate">APK</span>
        </button>
      </nav>
    </div>
  );
}
