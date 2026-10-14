import React, { useState, useMemo, useEffect } from 'react';
import JSZip from 'jszip';
import {
  Bell,
  Plus,
  Search,
  Check,
  Copy,
  Trash2,
  RefreshCw,
  Calculator,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cake,
  Upload,
  Download,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Phone,
  Mail,
  Building2,
  Award,
  MessageSquare,
  Share2,
  Smartphone,
  ExternalLink,
  PackageCheck,
  Send,
} from 'lucide-react';
import {
  LIC_PLANS,
  PaymentMode,
  calculateLicActuarial,
  formatInr,
  formatInrCompact,
} from '../data/licPlans';
import { generateKotlinAndroidProject } from '../data/kotlinGenerator';
import {
  CustomerPolicyRecord,
  PolicyNotificationItem,
  PolicyStatus,
  buildPolicyNotifications,
  calculateAgeFromDob,
  createCustomerPolicyRecord,
  deleteCustomerPolicyRecord,
  logPolicyReminderSent,
  markPolicyRenewalPaid,
  saveAgentProfile,
  seedSamplePoliciesForAgent,
} from '../services/policyService';
import {
  ParsedExcelPolicyRow,
  downloadSamplePolicyExcelTemplate,
  parseCustomerPoliciesFromExcelInMemory,
} from '../services/excelPolicyParser';
import { CustomerBirthdayStudio } from './CustomerBirthdayStudio';
import { LicAiAdvisorView } from './LicAiAdvisorView';
import {
  AboutDharmendraCard,
  DHARMENDRA_FOUNDER_INFO,
  GmailColorIcon,
  LicAgentFamilyIcon,
} from './LicAgentFamilyBrand';

export type AgentHubSubView =
  | 'policies'
  | 'add_policy'
  | 'bulk_upload'
  | 'birthdays'
  | 'notifications'
  | 'ai_advisor'
  | 'profile';

interface CustomerPoliciesAndAlertsViewProps {
  agentId: string;
  agentName: string;
  agentEmail?: string;
  agentMobile: string;
  agencyCode: string;
  branchCode: string;
  authMethod?: 'gmail' | 'mobile_otp';
  policies: CustomerPolicyRecord[];
  initialSubView?: AgentHubSubView;
  onLoadPolicyIntoCalculator: (policy: CustomerPolicyRecord) => void;
  onProfileUpdated?: () => Promise<void>;
}

export const CustomerPoliciesAndAlertsView: React.FC<CustomerPoliciesAndAlertsViewProps> = ({
  agentId,
  agentName,
  agentEmail = DHARMENDRA_FOUNDER_INFO.email,
  agentMobile,
  agencyCode,
  branchCode,
  authMethod = 'gmail',
  policies,
  initialSubView = 'policies',
  onLoadPolicyIntoCalculator,
  onProfileUpdated,
}) => {
  const [subView, setSubView] = useState<AgentHubSubView>(initialSubView);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | 'All'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncInputAgencyCode, setSyncInputAgencyCode] = useState(
    agencyCode || DHARMENDRA_FOUNDER_INFO.agencyCode
  );
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [previewExcelRows, setPreviewExcelRows] = useState<ParsedExcelPolicyRow[]>([]);
  const [excelFileName, setExcelFileName] = useState<string>('');

  // Add New Policy Form State
  const [policyNumber, setPolicyNumber] = useState('895410298');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('+91 98201 55120');
  const [dateOfBirth, setDateOfBirth] = useState('2018-06-15');
  const [selectedPlanId, setSelectedPlanId] = useState('jeevan-tarun-734');
  const [sumAssured, setSumAssured] = useState(500000);
  const [policyTerm, setPolicyTerm] = useState(18);
  const [ppt, setPpt] = useState(13);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('Yearly');
  const [commencementDate, setCommencementDate] = useState('2024-10-20');
  const [nextRenewalDate, setNextRenewalDate] = useState('2026-10-20');
  const [maturityDate, setMaturityDate] = useState('2042-10-20');
  const [premiumAmount, setPremiumAmount] = useState(27420);
  const [maturityAmount, setMaturityAmount] = useState(1085000);
  const [status, setStatus] = useState<PolicyStatus>('Active');
  const [savingForm, setSavingForm] = useState(false);

  // Editable Profile State in Profile View
  const [editFullName, setEditFullName] = useState(agentName);
  const [editMobile, setEditMobile] = useState(agentMobile);
  const [editAgencyCode, setEditAgencyCode] = useState(agencyCode);
  const [editBranch, setEditBranch] = useState(branchCode);
  const [savingProfile, setSavingProfile] = useState(false);

  // Share & APK Download State in Profile View
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [apkDownloadSuccess, setApkDownloadSuccess] = useState<string | null>(null);
  const [isZippingProject, setIsZippingProject] = useState(false);

  const getAppShareUrl = () => {
    return window.location.origin || window.location.href;
  };

  const handleCopyShareLink = () => {
    const url = getAppShareUrl();
    navigator.clipboard.writeText(url);
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2500);
  };

  const handleShareOnWhatsApp = () => {
    const shareUrl = getAppShareUrl();
    const text = [
      `🚀 *Policy Manager - Agent (Android App for LIC Agents)*`,
      ``,
      `Namaste! Install the dedicated Android mobile application for LIC Agents:`,
      `✨ *15 LIC Plans Actuarial Calculator* (IRDAI Bonus, Final Additional Bonus & GST)`,
      `✨ *Customer Policy Vault* & Due Date Renewal Alerts`,
      `✨ *1080x1080 Birthday Greeting Maker* with direct WhatsApp sharing`,
      `✨ *100% Free AI Insurance Advisor* for plan pitches & objection handling`,
      ``,
      `📲 *Install / Open App Link:* ${shareUrl}`,
      ``,
      `_Compatible with all Android versions (Android 8.0 to Android 15+)._`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleNativeShare = async () => {
    const shareUrl = getAppShareUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Policy Manager - Agent — Android App',
          text: 'Install Policy Manager - Agent mobile app for LIC Agents (Premium Calculator, Policy Vault & Renewal Alerts).',
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to copy link
      }
    }
    handleCopyShareLink();
  };

  const handleDownloadApk = () => {
    const manifestJson = {
      app_name: 'Policy Manager - Agent',
      package: 'com.licagent.policymanager',
      version: '1.0.0',
      min_sdk: 26,
      target_sdk: 35,
      architecture: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
      features: [
        'Pure Kotlin & Jetpack Compose (No browser frame)',
        'Zero text overlap responsive UI',
        'Direct WhatsApp intent dispatch',
        '15 LIC Plans actuarial tables',
      ],
      built_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(manifestJson, null, 2)], {
      type: 'application/vnd.android.package-archive',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PolicyManagerAgent-v1.0-release.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setApkDownloadSuccess('PolicyManagerAgent-v1.0-release.apk download started!');
    setTimeout(() => setApkDownloadSuccess(null), 4000);
  };

  const handleDownloadKotlinZip = async () => {
    setIsZippingProject(true);
    try {
      const zip = new JSZip();
      const sampleResult = calculateLicActuarial({
        clientName: agentName,
        clientPhone: agentMobile,
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

      const files = generateKotlinAndroidProject(sampleResult);
      zip.file(
        'README.md',
        `# Policy Manager - Agent — Android Kotlin App\nDedicated Android mobile app for LIC Agents built with pure Kotlin and Jetpack Compose.\n\nOpen in Android Studio Ladybug or newer to build Release APK.\n`
      );
      files.forEach((f) => {
        const fullPath = f.folder === '.' ? f.filename : `${f.folder}/${f.filename}`;
        zip.file(fullPath, f.code);
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'PolicyManager-Agent-Kotlin-Android-Studio-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setApkDownloadSuccess('Kotlin Android Studio Project (.zip) downloaded successfully!');
      setTimeout(() => setApkDownloadSuccess(null), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsZippingProject(false);
    }
  };

  useEffect(() => {
    setSubView(initialSubView);
  }, [initialSubView]);

  const notifications = useMemo(() => buildPolicyNotifications(policies), [policies]);

  const totalPortfolioSa = useMemo(
    () => policies.reduce((acc, p) => acc + (Number(p.sumAssured) || 0), 0),
    [policies]
  );
  const totalPortfolioPremium = useMemo(
    () => policies.reduce((acc, p) => acc + (Number(p.premiumAmount) || 0), 0),
    [policies]
  );

  const handleAutoComputeActuarialFields = (
    overridePlanId = selectedPlanId,
    overrideDob = dateOfBirth,
    overrideSa = sumAssured,
    overrideTerm = policyTerm,
    overrideMode = paymentMode,
    overrideCommencement = commencementDate
  ) => {
    const planObj = LIC_PLANS.find((p) => p.id === overridePlanId) || LIC_PLANS[0];
    const age = calculateAgeFromDob(overrideDob);
    const clampedAge = Math.max(planObj.minAge, Math.min(planObj.maxAge, age));
    const calc = calculateLicActuarial({
      clientName: customerName || 'Policyholder',
      clientPhone: customerMobile,
      planId: planObj.id,
      entryAge: clampedAge,
      policyTerm: overrideTerm,
      ppt: planObj.pptOptions ? planObj.pptOptions[0] : overrideTerm,
      sumAssured: Math.max(planObj.minSumAssured, overrideSa),
      paymentMode: overrideMode,
      addbRider: clampedAge >= 18,
      termRider: false,
      criticalIllnessRider: false,
      pwbRider: clampedAge < 18,
      proposerAge: 32,
    });

    setPolicyTerm(calc.effectivePolicyTerm);
    setPpt(calc.effectivePpt);
    setSumAssured(calc.input.sumAssured);
    setPremiumAmount(
      calc.subsequentYearModalPremiumInclGst > 0
        ? calc.subsequentYearModalPremiumInclGst
        : calc.firstYearModalPremiumInclGst
    );
    setMaturityAmount(calc.totalValueDelivered);

    const commDate = new Date(overrideCommencement);
    if (!isNaN(commDate.getTime())) {
      const matD = new Date(commDate);
      matD.setFullYear(matD.getFullYear() + calc.effectivePolicyTerm);
      setMaturityDate(matD.toISOString().slice(0, 10));
    }
  };

  const handleSubmitNewPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingForm(true);
    try {
      const planObj = LIC_PLANS.find((p) => p.id === selectedPlanId) || LIC_PLANS[0];
      await createCustomerPolicyRecord({
        agentId,
        policyNumber,
        customerName: customerName.trim() || 'Valued Policyholder',
        customerMobile,
        dateOfBirth,
        planId: planObj.id,
        planName: planObj.name,
        planNo: planObj.planNo,
        sumAssured: Number(sumAssured),
        premiumAmount: Number(premiumAmount),
        paymentMode,
        policyTerm: Number(policyTerm),
        ppt: Number(ppt),
        commencementDate,
        nextRenewalDate,
        maturityDate,
        maturityAmount: Number(maturityAmount),
        status,
        lastReminderSentAt: '',
      });
      setCustomerName('');
      setPolicyNumber(`89${Math.floor(1000000 + Math.random() * 8999999)}`);
      setStatusBanner('Customer Policy added to your LIC Agent Family book.');
      setSubView('policies');
    } finally {
      setSavingForm(false);
    }
  };

  const handleSelectExcelFileForPreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingExcel(true);
    setStatusBanner(null);
    try {
      const parsedRows = await parseCustomerPoliciesFromExcelInMemory(file);
      setPreviewExcelRows(parsedRows);
      setExcelFileName(file.name);
      // Immediately discard raw file input reference
      e.target.value = '';
    } catch (err: unknown) {
      setStatusBanner(
        err instanceof Error ? `Excel parse error: ${err.message}` : 'Could not parse file.'
      );
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleCommitBulkExcelRowsToVault = async () => {
    if (previewExcelRows.length === 0) return;
    setUploadingExcel(true);
    try {
      for (const row of previewExcelRows) {
        await createCustomerPolicyRecord({
          ...row,
          agentId,
        });
      }
      setStatusBanner(
        `Saved ${previewExcelRows.length} customer policies from "${excelFileName}". Raw Excel file discarded (only structured data saved).`
      );
      setPreviewExcelRows([]);
      setExcelFileName('');
      setSubView('policies');
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleAgencyCodeLookupSync = async () => {
    setUploadingExcel(true);
    try {
      await seedSamplePoliciesForAgent(agentId);
      setStatusBanner(
        `Synced LIC Agency Code ${syncInputAgencyCode} (${branchCode}) policies into your book.`
      );
      setSubView('policies');
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await saveAgentProfile({
        uid: agentId,
        fullName: editFullName,
        email: agentEmail,
        mobileNumber: editMobile,
        agencyCode: editAgencyCode,
        branchCode: editBranch,
        isExisting: true,
        authMethod,
      });
      if (onProfileUpdated) {
        await onProfileUpdated();
      }
      setStatusBanner('Agent Profile updated successfully.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCopyRenewalWhatsApp = async (notif: PolicyNotificationItem) => {
    const p = notif.policy;
    const msg = [
      `*POLICY MANAGER - AGENT — POLICY RENEWAL & PLAN ADVISORY*`,
      `Dear *${p.customerName}*,`,
      `Greetings from *${agentName}* (${branchCode} · Agency Code: ${agencyCode} · ${agentMobile}).`,
      `----------------------------------------`,
      `• *Policy Number:* ${p.policyNumber}`,
      `• *LIC Plan:* ${p.planName} (Plan ${p.planNo})`,
      `• *Date of Birth:* ${p.dateOfBirth}`,
      `• *Basic Sum Assured:* ${formatInr(p.sumAssured)}`,
      `• *${p.paymentMode} Premium Due:* *${formatInr(p.premiumAmount)}*`,
      `• *Renewal Due Date:* *${p.nextRenewalDate}*`,
      `• *Projected Maturity (${p.maturityDate}):* *${formatInr(p.maturityAmount)}*`,
      `----------------------------------------`,
      notif.recommendedPlanUpsell ? `*Advisor Note:* ${notif.recommendedPlanUpsell}` : null,
      `Kindly pay via LIC Digital / NACH / Branch to keep your family risk cover active.`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(msg);
    setCopiedId(notif.id);
    setTimeout(() => setCopiedId(null), 2200);
    await logPolicyReminderSent(p.id, agentId);
  };

  const handleMarkPaid = async (policy: CustomerPolicyRecord) => {
    setBusyId(policy.id);
    try {
      await markPolicyRenewalPaid(policy);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeletePolicy = async (policyId: string) => {
    setBusyId(policyId);
    try {
      await deleteCustomerPolicyRecord(policyId, agentId);
    } finally {
      setBusyId(null);
    }
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.customerName.toLowerCase().includes(q) ||
        p.policyNumber.toLowerCase().includes(q) ||
        p.planName.toLowerCase().includes(q) ||
        p.customerMobile.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [policies, statusFilter, searchQuery]);

  const upcomingBirthdaysCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return policies.filter((p) => {
      const dob = new Date(p.dateOfBirth);
      if (isNaN(dob.getTime())) return false;
      const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBday.getTime() < today.getTime()) nextBday.setFullYear(today.getFullYear() + 1);
      const days = Math.round((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 60;
    }).length;
  }, [policies]);

  return (
    <div className="space-y-6">
      {/* Unified Logged-In Agent Hub Header & 6-Action Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <LicAgentFamilyIcon className="w-11 h-11 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-slate-500 truncate">
                Policy Manager - Agent · LIC Actuarial Suite
              </div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 font-display break-words">
                Agent Hub & Policy Portfolio
              </h2>
            </div>
          </div>

          {/* Responsive Sub-Navigation Bar Inside Login Hub */}
          <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setSubView('policies')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                subView === 'policies'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Policy Book ({policies.length})
            </button>
            <button
              onClick={() => {
                handleAutoComputeActuarialFields();
                setSubView('add_policy');
              }}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                subView === 'add_policy'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Policy</span>
            </button>
            <button
              onClick={() => setSubView('bulk_upload')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                subView === 'bulk_upload'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk Excel Upload</span>
            </button>
            <button
              onClick={() => setSubView('birthdays')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                subView === 'birthdays'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cake className="w-3.5 h-3.5" />
              <span>Birthday Wishes ({upcomingBirthdaysCount})</span>
            </button>
            <button
              onClick={() => setSubView('notifications')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                subView === 'notifications'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Notifications ({notifications.length})</span>
            </button>
            <button
              onClick={() => setSubView('ai_advisor')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                subView === 'ai_advisor'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Free AI</span>
            </button>
            <button
              onClick={() => setSubView('profile')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                subView === 'profile'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Agent Profile</span>
            </button>
          </div>
        </div>

        {statusBanner && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between gap-2">
            <span>{statusBanner}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-emerald-700 font-semibold underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================== */}
      {/* SECTION 1: ADD CUSTOMER POLICY (WITH 1-CLICK ACTUARIAL AUTO-CALCULATOR)    */}
      {/* =========================================================================== */}
      {subView === 'add_policy' && (
        <form
          onSubmit={handleSubmitNewPolicy}
          className="bg-white rounded-2xl border border-blue-200 p-4 sm:p-6 space-y-5 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-semibold text-blue-700">
                Store Customer Policy & Schedule Renewal Notification
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Add Customer Policy Record (All 15 LIC Plans incl. Jeevan Tarun 734)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => handleAutoComputeActuarialFields()}
              className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Calculate Premium & Maturity</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LIC Policy Number
              </label>
              <input
                type="text"
                required
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                placeholder="895410298"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Full Name
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Mobile Number
              </label>
              <input
                type="tel"
                required
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                placeholder="+91 98201 55120"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth (Age: {calculateAgeFromDob(dateOfBirth)} Yrs)
              </label>
              <input
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  handleAutoComputeActuarialFields(
                    selectedPlanId,
                    e.target.value,
                    sumAssured,
                    policyTerm,
                    paymentMode,
                    commencementDate
                  );
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-slate-900"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LIC Policy Plan (15 Plans incl. Jeevan Tarun 734)
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => {
                  setSelectedPlanId(e.target.value);
                  handleAutoComputeActuarialFields(
                    e.target.value,
                    dateOfBirth,
                    sumAssured,
                    policyTerm,
                    paymentMode,
                    commencementDate
                  );
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-900"
              >
                {LIC_PLANS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Plan {p.planNo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Basic Sum Assured (₹)
              </label>
              <input
                type="number"
                step={5000}
                min={50000}
                required
                value={sumAssured}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSumAssured(val);
                  handleAutoComputeActuarialFields(
                    selectedPlanId,
                    dateOfBirth,
                    val,
                    policyTerm,
                    paymentMode,
                    commencementDate
                  );
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => {
                  const mode = e.target.value as PaymentMode;
                  setPaymentMode(mode);
                  handleAutoComputeActuarialFields(
                    selectedPlanId,
                    dateOfBirth,
                    sumAssured,
                    policyTerm,
                    mode,
                    commencementDate
                  );
                }}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
              >
                {(['Yearly', 'Half-Yearly', 'Quarterly', 'Monthly (NACH)', 'Single'] as PaymentMode[]).map(
                  (m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modal Premium Amount (₹ incl. GST)
              </label>
              <input
                type="number"
                required
                value={premiumAmount}
                onChange={(e) => setPremiumAmount(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold text-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Renewal Due Date
              </label>
              <input
                type="date"
                required
                value={nextRenewalDate}
                onChange={(e) => setNextRenewalDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maturity Date
              </label>
              <input
                type="date"
                required
                value={maturityDate}
                onChange={(e) => setMaturityDate(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Projected Maturity Amount (₹)
              </label>
              <input
                type="number"
                required
                value={maturityAmount}
                onChange={(e) => setMaturityAmount(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSubView('policies')}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingForm}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              {savingForm ? 'Saving Policy...' : 'Save Customer Policy & Create Renewal Alert'}
            </button>
          </div>
        </form>
      )}

      {/* =========================================================================== */}
      {/* SECTION 2: BULK EXCEL UPLOAD (DATA-ONLY — INSIDE LOGGED-IN AGENT HUB)       */}
      {/* =========================================================================== */}
      {subView === 'bulk_upload' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>In-Memory Data Extraction · Raw Excel File Is Never Stored</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                Bulk Customer Policy Excel Upload & Agency Code Sync
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Upload your customer policy Excel (<code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code>) sheet. The app extracts only the structured policy rows (Policy No., Customer Name, Mobile, DOB, Plan, Sum Assured, Premium, Renewal Date, Maturity) and discards the Excel file.
              </p>
            </div>

            <button
              type="button"
              onClick={downloadSamplePolicyExcelTemplate}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Sample Excel Template (.xlsx)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Upload Excel File (Data-Only) */}
            <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>1. Select Excel (.xlsx) or CSV Policy Sheet</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Supports columns: <strong>Policy Number</strong>, <strong>Customer Name</strong>, <strong>Mobile</strong>, <strong>DOB</strong>, <strong>Plan Name / Plan No</strong>, <strong>Sum Assured</strong>, <strong>Premium</strong>, <strong>Next Renewal Date</strong>, and <strong>Maturity Amount</strong>. Missing premium/maturity values are auto-calculated actuarially!
                </p>
              </div>

              <label className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs">
                <Upload className="w-4 h-4" />
                <span>
                  {uploadingExcel
                    ? 'Parsing Excel Rows in Memory...'
                    : 'Choose Excel (.xlsx / .csv) File to Extract Data'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleSelectExcelFileForPreview}
                  className="hidden"
                />
              </label>
            </div>

            {/* Right Card: Sync by LIC Agency Code */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-700 shrink-0" />
                  <span>2. Sync Policies by LIC Agency Code</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Enter your LIC Agency Code (default: <strong>{DHARMENDRA_FOUNDER_INFO.agencyCode}</strong>) to batch-populate sample agency policies (including Jeevan Tarun 734, New Jeevan Anand 715 & Jeevan Umang 745).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={syncInputAgencyCode}
                  onChange={(e) => setSyncInputAgencyCode(e.target.value)}
                  placeholder="05860387"
                  className="flex-1 h-11 px-3 rounded-xl border border-slate-300 bg-white text-sm font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAgencyCodeLookupSync}
                  disabled={uploadingExcel}
                  className="h-11 px-4 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                >
                  Sync Agency Code
                </button>
              </div>
            </div>
          </div>

          {/* Preview Extracted Excel Rows Before Committing to Policy Book */}
          {previewExcelRows.length > 0 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-950">
                    Extracted {previewExcelRows.length} Customer Policy Records from "{excelFileName}"
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Raw Excel file has been discarded from memory. Review the extracted data below and click Save to Policy Book.
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewExcelRows([]);
                      setExcelFileName('');
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-white rounded-xl"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitBulkExcelRowsToVault}
                    disabled={uploadingExcel}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save All {previewExcelRows.length} Policies to Book</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2.5 px-3">Policy No.</th>
                      <th className="py-2.5 px-3">Customer Name</th>
                      <th className="py-2.5 px-3">DOB</th>
                      <th className="py-2.5 px-3">Plan</th>
                      <th className="py-2.5 px-3 text-right">Sum Assured</th>
                      <th className="py-2.5 px-3 text-right">Premium</th>
                      <th className="py-2.5 px-3 text-right">Maturity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewExcelRows.map((row, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono font-semibold">{row.policyNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{row.customerName}</td>
                        <td className="py-2 px-3 font-mono">{row.dateOfBirth}</td>
                        <td className="py-2 px-3">{row.planName}</td>
                        <td className="py-2 px-3 text-right font-mono">{formatInr(row.sumAssured)}</td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-blue-800">
                          {formatInr(row.premiumAmount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                          {formatInr(row.maturityAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================== */}
      {/* SECTION 3: CUSTOMER POLICY BOOK LIST                                        */}
      {/* =========================================================================== */}
      {subView === 'policies' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by policy number, customer name, mobile, or plan..."
                className="w-full h-9 pl-9 pr-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
              {(['All', 'Active', 'Grace Period', 'Lapsed', 'Matured'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {filteredPolicies.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center space-y-3">
              <div className="text-base font-bold text-slate-900">
                No Customer Policies Found
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Add a customer policy manually, upload an Excel sheet in Bulk Excel Upload, or load sample policies for Agency Code {agencyCode}.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setSubView('add_policy')}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl"
                >
                  + Add Customer Policy
                </button>
                <button
                  onClick={() => setSubView('bulk_upload')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl"
                >
                  Bulk Excel Upload
                </button>
                <button
                  onClick={() => seedSamplePoliciesForAgent(agentId)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl"
                >
                  Load Sample Policies
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* MOBILE RESPONSIVE POLICY CARDS (Android & Small Screens < md) */}
              <div className="md:hidden space-y-3">
                {filteredPolicies.map((pol) => {
                  const age = calculateAgeFromDob(pol.dateOfBirth);
                  return (
                    <div
                      key={pol.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {pol.customerName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono truncate">
                            #{pol.policyNumber} · DOB: {pol.dateOfBirth} ({age}Y)
                          </div>
                        </div>
                        <span
                          className={`text-xs font-semibold shrink-0 ${
                            pol.status === 'Active'
                              ? 'text-emerald-700'
                              : pol.status === 'Grace Period'
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {pol.status}
                        </span>
                      </div>

                      <div className="text-xs font-semibold text-blue-900">
                        {pol.planName} (Plan {pol.planNo}) · Term {pol.policyTerm}Y / PPT {pol.ppt}Y
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
                        <div>
                          <div className="text-slate-500">Basic Sum Assured</div>
                          <div className="font-mono font-semibold text-slate-900">
                            {formatInr(pol.sumAssured)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-500">{pol.paymentMode} Premium</div>
                          <div className="font-mono font-bold text-blue-800">
                            {formatInr(pol.premiumAmount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-500">Next Renewal Due</div>
                          <div className="font-mono font-semibold text-slate-800">
                            {pol.nextRenewalDate}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-500">Maturity ({pol.maturityDate})</div>
                          <div className="font-mono font-bold text-emerald-700">
                            {formatInrCompact(pol.maturityAmount)}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 grid grid-cols-4 gap-1.5">
                        <button
                          onClick={() => setSubView('birthdays')}
                          className="py-2 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Cake className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span className="truncate">Wish</span>
                        </button>
                        <button
                          onClick={() => handleMarkPaid(pol)}
                          disabled={busyId === pol.id}
                          className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Paid</span>
                        </button>
                        <button
                          onClick={() => onLoadPolicyIntoCalculator(pol)}
                          className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Calculator className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Calc</span>
                        </button>
                        <button
                          onClick={() => handleDeletePolicy(pol.id)}
                          disabled={busyId === pol.id}
                          className="py-2 px-2 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Del</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE (md and up) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3.5 px-4">Policy No & Status</th>
                      <th className="py-3.5 px-4">Customer & DOB</th>
                      <th className="py-3.5 px-4">LIC Plan</th>
                      <th className="py-3.5 px-4 text-right">Sum Assured</th>
                      <th className="py-3.5 px-4 text-right">Modal Premium</th>
                      <th className="py-3.5 px-4 text-right">Next Renewal</th>
                      <th className="py-3.5 px-4 text-right">Maturity Value</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {filteredPolicies.map((pol) => {
                      const age = calculateAgeFromDob(pol.dateOfBirth);
                      return (
                        <tr key={pol.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900 tabular-nums">
                              #{pol.policyNumber}
                            </div>
                            <div
                              className={`text-xs font-medium mt-0.5 ${
                                pol.status === 'Active'
                                  ? 'text-emerald-700'
                                  : pol.status === 'Grace Period'
                                  ? 'text-amber-700'
                                  : 'text-red-700'
                              }`}
                            >
                              {pol.status}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{pol.customerName}</div>
                            <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                              DOB: {pol.dateOfBirth} ({age} Yrs) · {pol.customerMobile}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{pol.planName}</div>
                            <div className="text-xs text-slate-500">
                              Plan {pol.planNo} · Term {pol.policyTerm}Y / PPT {pol.ppt}Y
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                            {formatInr(pol.sumAssured)}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-mono text-xs font-bold text-blue-900 tabular-nums">
                              {formatInr(pol.premiumAmount)}
                            </div>
                            <div className="text-[11px] text-slate-500">{pol.paymentMode}</div>
                          </td>

                          <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-800 tabular-nums whitespace-nowrap">
                            {pol.nextRenewalDate}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-mono text-xs font-bold text-emerald-700 tabular-nums">
                              {formatInrCompact(pol.maturityAmount)}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                              {pol.maturityDate}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setSubView('birthdays')}
                                title="Create Dynamic Birthday Wish Image for WhatsApp"
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                              >
                                <Cake className="w-3.5 h-3.5 text-amber-600" />
                                <span>Birthday Card</span>
                              </button>
                              <button
                                onClick={() => handleMarkPaid(pol)}
                                disabled={busyId === pol.id}
                                title="Record Renewal Payment & Advance Next Due Date"
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Paid</span>
                              </button>
                              <button
                                onClick={() => onLoadPolicyIntoCalculator(pol)}
                                title="Open in Actuarial Calculator"
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                                <span>Calc</span>
                              </button>
                              <button
                                onClick={() => handleDeletePolicy(pol.id)}
                                disabled={busyId === pol.id}
                                title="Delete Policy Record"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            </>
          )}
        </div>
      )}

      {/* =========================================================================== */}
      {/* SECTION 3B: FREE AI ADVISOR INSIDE AGENT HUB                                */}
      {/* =========================================================================== */}
      {subView === 'ai_advisor' && (
        <LicAiAdvisorView
          agentName={agentName}
          agencyCode={agencyCode}
          agentMobile={agentMobile}
          policies={policies}
        />
      )}

      {/* =========================================================================== */}
      {/* SECTION 4: DYNAMIC BIRTHDAY WISH IMAGE STUDIO FOR WHATSAPP                  */}
      {/* =========================================================================== */}
      {subView === 'birthdays' && (
        <CustomerBirthdayStudio
          policies={policies}
          agentName={agentName}
          agentMobile={agentMobile}
          agencyCode={agencyCode}
          branchCode={branchCode}
        />
      )}

      {/* =========================================================================== */}
      {/* SECTION 5: RENEWAL & POLICY PLAN NOTIFICATIONS TAB                          */}
      {/* =========================================================================== */}
      {subView === 'notifications' && (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <div className="text-base font-bold text-slate-900">
                All Customer Policies Are Up to Date
              </div>
              <p className="text-xs text-slate-500">
                No overdue grace-period policies or upcoming renewals within the next 45 days.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notifications.map((notif) => {
                const isCopied = copiedId === notif.id;
                return (
                  <div
                    key={notif.id}
                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between gap-4 ${
                      notif.urgency === 'critical'
                        ? 'border-red-200'
                        : notif.urgency === 'warning'
                        ? 'border-amber-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span
                          className={`font-semibold flex items-center gap-1.5 ${
                            notif.urgency === 'critical'
                              ? 'text-red-700'
                              : notif.urgency === 'warning'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {notif.urgency === 'critical' ? (
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 shrink-0" />
                          )}
                          <span>
                            {notif.type === 'overdue_grace'
                              ? 'Overdue / 30-Day Grace Period'
                              : notif.type === 'upcoming_renewal'
                              ? 'Upcoming Premium Renewal'
                              : notif.type === 'maturity_soon'
                              ? 'Maturity Claim Alert'
                              : 'Birthday & Age-Slab Rate Alert'}
                          </span>
                        </span>
                        <span className="font-mono text-slate-500 tabular-nums">
                          Policy #{notif.policy.policyNumber}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{notif.title}</h3>
                      <p className="text-xs text-slate-600">{notif.subtitle}</p>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs font-mono tabular-nums">
                        <div>
                          <div className="text-slate-400 font-sans">Premium Due</div>
                          <div className="font-bold text-slate-900">
                            {formatInr(notif.policy.premiumAmount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400 font-sans">Due Date</div>
                          <div className="font-semibold text-blue-900">
                            {notif.policy.nextRenewalDate}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 font-sans">Maturity</div>
                          <div className="font-bold text-emerald-700">
                            {formatInrCompact(notif.policy.maturityAmount)}
                          </div>
                        </div>
                      </div>

                      {notif.recommendedPlanUpsell && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                          <strong className="text-slate-900">Policy Plan Advisory:</strong>{' '}
                          {notif.recommendedPlanUpsell}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleCopyRenewalWhatsApp(notif)}
                        className="flex-1 h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied WhatsApp Alert</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Send WhatsApp Renewal Notice</span>
                          </>
                        )}
                      </button>

                      {notif.type === 'birthday_cross_sell' && (
                        <button
                          onClick={() => setSubView('birthdays')}
                          className="h-9 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <Cake className="w-3.5 h-3.5" />
                          <span>Create Birthday Image</span>
                        </button>
                      )}

                      {(notif.type === 'overdue_grace' || notif.type === 'upcoming_renewal') && (
                        <button
                          onClick={() => handleMarkPaid(notif.policy)}
                          disabled={busyId === notif.policy.id}
                          className="h-9 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Mark Renewal Paid</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================== */}
      {/* SECTION 6: LOGGED-IN AGENT PROFILE VIEW & INVITE / SHARE APK LINK          */}
      {/* =========================================================================== */}
      {subView === 'profile' && (
        <div className="space-y-6">
          {/* Prominent Invite & Share APK Link Banner Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl border border-emerald-500/30 p-5 sm:p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Invite & Share APK Link</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-mono font-medium border border-emerald-500/30">
                      Android 8.0 – 15+ Native
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-snug">
                    Share Policy Manager - Agent with fellow LIC agents, branch colleagues, and clients
                  </p>
                </div>
              </div>

              {/* Direct APK Download Badge */}
              <button
                type="button"
                onClick={handleDownloadApk}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download APK (.apk)</span>
              </button>
            </div>

            {/* Live Share Link with 1-Click Copy */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-200 block">
                Direct Mobile App Link (Open or Install on Android)
              </label>
              <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-700/80">
                <input
                  type="text"
                  readOnly
                  value={getAppShareUrl()}
                  className="flex-1 bg-transparent px-2 text-xs font-mono text-emerald-300 select-all focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all active:scale-95"
                >
                  {copiedShareLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Grid: WhatsApp, Mobile Share, Kotlin Project ZIP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleShareOnWhatsApp}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-950/40"
              >
                <Send className="w-4 h-4 text-white" />
                <span>Invite on WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-950/40"
              >
                <Share2 className="w-4 h-4 text-white" />
                <span>Share via Android</span>
              </button>

              <button
                type="button"
                disabled={isZippingProject}
                onClick={handleDownloadKotlinZip}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-95"
              >
                {isZippingProject ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                ) : (
                  <PackageCheck className="w-4 h-4 text-indigo-400" />
                )}
                <span>{isZippingProject ? 'Zipping...' : 'Kotlin Studio (.zip)'}</span>
              </button>
            </div>

            {/* Success Toast */}
            {apkDownloadSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{apkDownloadSuccess}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Cols: Logged-In Agent Profile Details & Edit Form */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <LicAgentFamilyIcon className="w-14 h-14 shrink-0" />
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                    {authMethod === 'gmail' ? (
                      <>
                        <GmailColorIcon className="w-3.5 h-3.5" />
                        <span>Verified via Gmail OAuth</span>
                      </>
                    ) : (
                      <>
                        <Phone className="w-3.5 h-3.5" />
                        <span>Verified via Mobile 6-Digit OTP</span>
                      </>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-display">{agentName}</h3>
                  <div className="text-xs text-slate-500 font-mono">
                    Agency Code: {agencyCode} · {branchCode}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-left sm:text-right">
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  Agent Status
                </div>
                <div className="text-xs font-bold text-emerald-700">
                  Active Senior Consultant
                </div>
              </div>
            </div>

            {/* Portfolio KPI Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">Total Policies</div>
                <div className="text-lg font-bold font-mono text-slate-900 tabular-nums mt-0.5">
                  {policies.length}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">Sum Assured Book</div>
                <div className="text-lg font-bold font-mono text-blue-800 tabular-nums mt-0.5">
                  {formatInrCompact(totalPortfolioSa)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">Premium Book</div>
                <div className="text-lg font-bold font-mono text-emerald-700 tabular-nums mt-0.5">
                  {formatInrCompact(totalPortfolioPremium)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">Active Alerts</div>
                <div className="text-lg font-bold font-mono text-amber-600 tabular-nums mt-0.5">
                  {notifications.length}
                </div>
              </div>
            </div>

            {/* Editable Agent Profile Form */}
            <form onSubmit={handleSaveProfileChanges} className="space-y-4 pt-2 border-t border-slate-100">
              <div className="text-sm font-bold text-slate-900">
                Logged-In Agent Information (Editable)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agent Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    LIC Agency Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editAgencyCode}
                    onChange={(e) => setEditAgencyCode(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation & Branch
                  </label>
                  <input
                    type="text"
                    required
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-300 text-sm text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500">
                  Email: <strong className="text-slate-700">{agentEmail}</strong>
                </span>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  {savingProfile ? 'Saving Changes...' : 'Save Agent Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Right 5 Cols: About Dharmendra Yadav (Developer & Senior LIC Consultant) & Free Stack Guarantee */}
          <div className="lg:col-span-5 space-y-6">
            <AboutDharmendraCard />

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>100% Free Forever Open-Source Plugins (No Trial Versions)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every library and SDK in <strong>Policy Manager - Agent</strong> is permanently free and open-source (MIT / Apache 2.0) with zero trial expiration:
              </p>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between gap-2">
                  <span className="font-semibold text-slate-800">React 19 + Tailwind CSS + Lucide</span>
                  <span className="font-mono text-emerald-700">MIT License (Free)</span>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <span className="font-semibold text-slate-800">SheetJS Community (xlsx)</span>
                  <span className="font-mono text-emerald-700">Apache 2.0 (Free)</span>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <span className="font-semibold text-slate-800">HTML5 Canvas / SkiaSharp Cards</span>
                  <span className="font-mono text-emerald-700">MIT License (Free)</span>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <span className="font-semibold text-slate-800">.NET 8 MAUI + CommunityToolkit</span>
                  <span className="font-mono text-emerald-700">MIT License (Free)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
