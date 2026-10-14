import React, { useState, useMemo, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  Code2,
  Copy,
  Check,
  Download,
  Smartphone,
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
  ChevronLeft,
  Share2,
  Wifi,
  Battery,
  ShieldCheck,
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
import {
  AgentHubSubView,
  CustomerPoliciesAndAlertsView,
} from './components/CustomerPoliciesAndAlertsView';
import { KotlinStudioView } from './components/KotlinStudioView';
import { LicAiAdvisorView } from './components/LicAiAdvisorView';
import { LicCalculatorAndroidView } from './components/LicCalculatorAndroidView';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallButton';
import {
  LicAgentFamilyIcon,
  DHARMENDRA_FOUNDER_INFO,
} from './components/LicAgentFamilyBrand';
import { AndroidBridge } from './utils/androidBridge';

export type ActiveTab =
  | 'calculator'
  | 'policies'
  | 'notifications'
  | 'birthdays'
  | 'ai'
  | 'profile'
  | 'plans'
  | 'schedule'
  | 'kotlin_apk'
  | 'csharp';

export default function App() {
  // Authentication & Agent Profile Gate State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfileRecord | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [policies, setPolicies] = useState<CustomerPolicyRecord[]>([]);

  // Android Viewport & Navigation State
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [hubSubView, setHubSubView] = useState<AgentHubSubView>('policies');
  const [planCategoryFilter, setPlanCategoryFilter] = useState<LicPlanCategory | 'All'>('All');
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const [androidOsVersion, setAndroidOsVersion] = useState<'15' | '14' | '13' | '10' | '8'>('15');
  const [currentTime, setCurrentTime] = useState('10:30');

  // Actuarial Calculation Input State
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

  // Track Real-time Clock for Android Status Bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hook Android Hardware Back Button to return to home/calculator tab
  useEffect(() => {
    const unregister = AndroidBridge.onHardwareBack(() => {
      if (activeTab !== 'calculator') {
        AndroidBridge.vibrate(20);
        setActiveTab('calculator');
        return true;
      }
      return false;
    });
    return unregister;
  }, [activeTab]);

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
    AndroidBridge.vibrate(25);
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

  const handleSaveCurrentAsPolicy = async (policyData: {
    policyNumber: string;
    customerDob: string;
    nextRenewalDate: string;
  }) => {
    if (!agentProfile) return;
    const matYear = new Date().getFullYear() + result.effectivePolicyTerm;
    await createCustomerPolicyRecord({
      agentId: agentProfile.uid,
      policyNumber: policyData.policyNumber,
      customerName: result.input.clientName || 'Valued Policyholder',
      customerMobile: result.input.clientPhone || '+91 98201 44510',
      dateOfBirth: policyData.customerDob,
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
      nextRenewalDate: policyData.nextRenewalDate,
      maturityDate: `${matYear}-10-15`,
      maturityAmount: result.totalValueDelivered,
      status: 'Active',
      lastReminderSentAt: '',
    });
    setSaveToast(`Policy #${policyData.policyNumber} saved to vault!`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleLoadPolicyIntoCalculator = (pol: CustomerPolicyRecord) => {
    AndroidBridge.vibrate(25);
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
    setActiveTab('calculator');
  };

  const openAgentHubSubView = (targetSubView: AgentHubSubView) => {
    AndroidBridge.vibrate(20);
    setHubSubView(targetSubView);
    if (targetSubView === 'notifications') setActiveTab('notifications');
    else if (targetSubView === 'birthdays') setActiveTab('birthdays');
    else if (targetSubView === 'ai_advisor') setActiveTab('ai');
    else if (targetSubView === 'profile') setActiveTab('profile');
    else setActiveTab('policies');
  };

  const switchTab = (tab: ActiveTab) => {
    AndroidBridge.vibrate(25);
    setActiveTab(tab);
  };

  const handleSignOutAll = async () => {
    AndroidBridge.vibrate(30);
    clearMobileOtpAgentSession();
    setAgentProfile(null);
    setPolicies([]);
    try {
      await signOutAgent();
    } catch {
      // ignore
    }
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

  // GATE ACCESS: Require Mobile WhatsApp OTP OR Gmail Sign-In / Sign-Up
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

  // =========================================================================
  // ANDROID NATIVE APPLICATION UI
  // Renders 100% full screen on mobile / Android devices, and in an authentic
  // =========================================================================
  // ANDROID NATIVE APPLICATION UI:
  // Responsive, edge-to-edge on mobile, centered modern app container on desktop,
  // with a single smooth scroll context (zero dual scrollbars).
  // =========================================================================
  return (
    <div className="h-dvh w-full bg-slate-950 flex justify-center overflow-hidden selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-2xl h-full flex flex-col bg-slate-100 text-slate-900 shadow-2xl relative overflow-hidden font-sans">
        {/* 1. Android Status Bar (System Bar) */}
        <div className="bg-slate-950 text-slate-200 px-3.5 sm:px-4 pt-2 pb-1.5 flex items-center justify-between text-xs font-mono tabular-nums shrink-0 z-30 select-none">
          <span className="font-semibold text-white tracking-wide">{currentTime}</span>
          <div className="flex items-center gap-2 text-slate-300">
            {/* Interactive Android Version Switcher Pill */}
            <button
              onClick={() => {
                AndroidBridge.vibrate(15);
                const osList: Array<'15' | '14' | '13' | '10' | '8'> = ['15', '14', '13', '10', '8'];
                const nextIdx = (osList.indexOf(androidOsVersion) + 1) % osList.length;
                setAndroidOsVersion(osList[nextIdx]);
              }}
              title="Click to toggle target Android OS (Android 15, 14, 13, 10, 8.0)"
              className="text-[9px] font-bold text-emerald-400 bg-emerald-950/90 hover:bg-emerald-900 active:scale-95 px-2 py-0.5 rounded border border-emerald-600/40 font-mono transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Android {androidOsVersion} · API {androidOsVersion === '15' ? '35' : androidOsVersion === '14' ? '34' : androidOsVersion === '13' ? '33' : androidOsVersion === '10' ? '29' : '26'}</span>
              <span className="text-[8px] opacity-70">⟳</span>
            </button>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/40">
              5G
            </span>
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

      {/* 2. Android Material 3 Top Action Bar */}
      <header className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-md shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          {activeTab !== 'calculator' ? (
            <button
              onClick={() => switchTab('calculator')}
              className="p-1.5 -ml-1 text-slate-300 hover:text-white active:scale-95 rounded-lg transition-transform"
              title="Back to Calculator"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          ) : (
            <LicAgentFamilyIcon className="w-7 h-7 shrink-0" />
          )}
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white truncate font-display">
              Policy Manager - Agent
            </h1>
            <div className="text-[10px] text-slate-300 truncate">
              LIC Actuarial Suite
            </div>
          </div>
        </div>

        {/* Right Action Icons: Alerts, Profile & Share APK, PWA Install, Sign Out */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <PWAInstallButton />
          <button
            onClick={() => openAgentHubSubView('notifications')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 relative transition-transform"
            title="Renewal Notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          <button
            onClick={() => openAgentHubSubView('profile')}
            className={`p-1.5 rounded-lg active:scale-95 transition-transform ${
              activeTab === 'profile'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Agent Profile & Invite / Share APK"
          >
            <UserCheck className="w-4 h-4" />
          </button>

          <button
            onClick={handleSignOutAll}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 transition-transform"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 3. Android Quick Plan & Shortcut Chips (Horizontally Scrollable) */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 z-10">
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
              if (activeTab !== 'calculator') switchTab('calculator');
            }}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              plan.id === preset.id && activeTab === 'calculator'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Save Toast Notification Banner */}
      {saveToast && (
        <div className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 text-center flex items-center justify-center gap-1.5 shadow-sm animate-fade-in shrink-0 z-10">
          <Check className="w-3.5 h-3.5" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 4. Android Scrollable Main Tab Content Viewport */}
      <main className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 overscroll-contain">
        {/* TAB 1: ANDROID CALCULATOR */}
        {activeTab === 'calculator' && (
          <LicCalculatorAndroidView
            planId={plan.id}
            input={input}
            result={result}
            policies={policies}
            agentName={agentProfile.fullName}
            agencyCode={agentProfile.agencyCode}
            agentMobile={agentProfile.mobileNumber}
            onUpdateInput={updateInput}
            onSelectPlan={handleSelectPlan}
            onSaveCurrentAsPolicy={handleSaveCurrentAsPolicy}
            onOpenHubSubView={openAgentHubSubView}
            onNavigateToTab={(tab) => switchTab(tab as ActiveTab)}
          />
        )}

        {/* TAB 2, 3, 4: AGENT HUB (POLICIES, BULK EXCEL, BIRTHDAY STUDIO, ALERTS, PROFILE) */}
        {(activeTab === 'policies' ||
          activeTab === 'notifications' ||
          activeTab === 'birthdays' ||
          activeTab === 'profile') && (
          <div className="pb-20">
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
          </div>
        )}

        {/* TAB: FREE AI LIC ADVISOR */}
        {activeTab === 'ai' && (
          <div className="pb-20">
            <LicAiAdvisorView
              agentName={agentProfile.fullName}
              agencyCode={agentProfile.agencyCode}
              agentMobile={agentProfile.mobileNumber}
              policies={policies}
            />
          </div>
        )}

        {/* TAB: 15 PLANS CATALOG */}
        {activeTab === 'plans' && (
          <div className="space-y-3 pb-20">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                    IRDAI Master Catalog
                  </span>
                  <h2 className="text-base font-bold text-slate-900">
                    15 Flagship LIC Plans
                  </h2>
                </div>
                <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                  {filteredPlans.length} Plans
                </span>
              </div>

              {/* Search input for Android */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={planSearchQuery}
                  onChange={(e) => setPlanSearchQuery(e.target.value)}
                  placeholder="Search plan name or number..."
                  className="w-full h-10 pl-9 pr-3 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {(['All', 'Endowment', 'Money Back', 'Whole Life', 'Child Plan', 'Term Assurance', 'Single Premium'] as const).map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setPlanCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                        planCategoryFilter === cat
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Mobile Plan Cards */}
            <div className="space-y-2.5">
              {filteredPlans.map((p) => {
                const isSelected = plan.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`bg-white rounded-2xl p-3.5 border transition-all ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                            Plan {p.planNo}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            UIN: {p.uin}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">
                          {p.name}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          handleSelectPlan(p.id);
                          switchTab('calculator');
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Calculate'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-snug">
                      {p.tagline}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px] text-slate-600 font-mono">
                      <div>
                        <span className="text-slate-400 block font-sans">Min SA:</span>
                        <span className="font-bold text-slate-800">{formatInr(p.minSumAssured)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-sans">Entry Age:</span>
                        <span className="font-bold text-slate-800">{p.minAge}–{p.maxAge} Y</span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 block font-sans">Terms:</span>
                        <span className="font-bold text-slate-800">{p.minTerm}–{p.maxTerm} Y</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: 35-YEAR SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-3 pb-20">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                Year-By-Year Cashflows
              </span>
              <h2 className="text-base font-bold text-slate-900">
                35-Year Benefit & Loan Schedule
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {plan.name} (Plan {plan.planNo}) · Sum Assured: {formatInr(result.input.sumAssured)}
              </p>
            </div>

            <div className="space-y-2">
              {result.schedule.map((row) => (
                <div
                  key={row.policyYear}
                  className="bg-white rounded-2xl p-3 border border-slate-200 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-bold text-slate-900">
                      Policy Year {row.policyYear} · Age {row.age} Yrs
                    </span>
                    <span className="font-mono font-semibold text-blue-800">
                      {row.annualPremiumWithGst > 0
                        ? `Prem: ${formatInr(row.annualPremiumWithGst)}`
                        : 'Paid-Up (₹0)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 font-sans">Bonus/GA: </span>
                      <span className="text-emerald-700 font-semibold">{formatInr(row.cumulativeBonusOrGa)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-sans">Risk Cover: </span>
                      <span className="text-slate-900 font-semibold">{formatInrCompact(row.normalRiskCover)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-sans">Surrender: </span>
                      <span className="text-slate-800">{row.surrenderValue > 0 ? formatInrCompact(row.surrenderValue) : '—'}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 font-sans">90% Loan: </span>
                      <span className="text-slate-800">{row.loanEligibility > 0 ? formatInrCompact(row.loanEligibility) : '—'}</span>
                    </div>
                  </div>

                  {row.survivalOrMoneyBackPayout > 0 && (
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-emerald-800 font-bold">
                      <span>Maturity / Survival Payout:</span>
                      <span className="font-mono">{formatInr(row.survivalOrMoneyBackPayout)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: GENERATE ANDROID APK & KOTLIN SOURCE CODE */}
        {(activeTab === 'kotlin_apk' || activeTab === 'csharp') && (
          <div className="pb-20">
            <KotlinStudioView activeResult={result} />
          </div>
        )}
      </main>

      {/* 5. Android Material 3 Bottom Navigation Bar */}
      <nav className="bg-slate-950 text-slate-300 border-t border-slate-800 grid grid-cols-5 py-1 px-1 z-30 shrink-0 select-none shadow-xl">
        <button
          onClick={() => switchTab('calculator')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'calculator'
              ? 'text-amber-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4 mb-0.5" />
          <span>Calc</span>
        </button>

        <button
          onClick={() => openAgentHubSubView('policies')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-semibold transition-all relative ${
            activeTab === 'policies'
              ? 'text-amber-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4 mb-0.5" />
          <span>Hub ({policies.length})</span>
        </button>

        <button
          onClick={() => switchTab('ai')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'ai'
              ? 'text-amber-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4 mb-0.5 text-blue-400" />
          <span>Ask AI</span>
        </button>

        <button
          onClick={() => openAgentHubSubView('birthdays')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'birthdays'
              ? 'text-amber-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cake className="w-4 h-4 mb-0.5" />
          <span>Birthday</span>
        </button>

        <button
          onClick={() => openAgentHubSubView('profile')}
          className={`flex flex-col items-center justify-center py-1 rounded-xl text-[10px] font-semibold transition-all ${
            activeTab === 'profile'
              ? 'text-amber-400 bg-slate-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4 mb-0.5" />
          <span>Profile</span>
        </button>
      </nav>

      {/* 6. Android System Navigation Gesture Bar Pill */}
      <div className="bg-slate-950 py-1 flex justify-center items-center shrink-0">
        <div className="w-32 h-1 bg-slate-600/60 rounded-full" />
      </div>
    </div>
  </div>
);
}
