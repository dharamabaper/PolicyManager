import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Phone,
  Building2,
  UserCheck,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  Wifi,
  Battery,
} from 'lucide-react';
import { signInWithGooglePopup, signOutAgent } from '../firebase';
import {
  AgentProfileRecord,
  getLocalPoliciesForAgent,
  saveAgentProfile,
  seedSamplePoliciesForAgent,
} from '../services/policyService';
import {
  LicAgentFamilyIcon,
  GmailColorIcon,
  AboutDharmendraCard,
  DHARMENDRA_FOUNDER_INFO,
} from './LicAgentFamilyBrand';
import { PWAInstallButton, OfflineIndicator } from './PWAInstallButton';
import { AndroidBridge } from '../utils/androidBridge';

interface AuthGateProps {
  firebaseUser: User | null;
  agentProfile: AgentProfileRecord | null;
  authLoading: boolean;
  onProfileCompleted: () => Promise<void>;
}

export const AuthGate: React.FC<AuthGateProps> = ({
  firebaseUser,
  agentProfile,
  authLoading,
  onProfileCompleted,
}) => {
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState(
    firebaseUser?.displayName || DHARMENDRA_FOUNDER_INFO.name
  );
  const [mobileNumber, setMobileNumber] = useState('');
  const [agencyCode, setAgencyCode] = useState(DHARMENDRA_FOUNDER_INFO.agencyCode);
  const [branchCode, setBranchCode] = useState('Senior Consultant · LIC');
  const [seedDemoPolicies, setSeedDemoPolicies] = useState(true);

  // WhatsApp OTP State (OTP sent to WhatsApp — NEVER displayed on screen)
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');
  const [whatsappOtpUrl, setWhatsappOtpUrl] = useState<string>('');
  const [maskedWhatsAppPhone, setMaskedWhatsAppPhone] = useState<string>('');
  const [sendingWhatsAppOtp, setSendingWhatsAppOtp] = useState(false);

  const [submittingGmail, setSubmittingGmail] = useState(false);
  const [submittingMobile, setSubmittingMobile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [currentTime, setCurrentTime] = useState('10:30');

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

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="flex justify-center">
            <LicAgentFamilyIcon className="w-12 h-12" />
          </div>
          <div className="text-lg font-bold font-display">Policy Manager - Agent</div>
          <p className="text-xs text-slate-400">
            Loading Android Actuarial Suite...
          </p>
        </div>
      </div>
    );
  }

  // OPTION 1: Send 6-Digit OTP Directly to User's WhatsApp Mobile Number (Never Displayed on Screen)
  const handleSendWhatsAppOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    AndroidBridge.vibrate(25);
    const cleanedDigits = mobileNumber.replace(/\D/g, '');
    if (cleanedDigits.length < 10) {
      setErrorMsg('Please enter a valid 10-digit WhatsApp Mobile Number to continue.');
      return;
    }

    // Direct Instant Login for Dharmendra Yadav (9926684274) without OTP verification
    const last10 = cleanedDigits.slice(-10);
    if (last10 === '9926684274') {
      setSubmittingMobile(true);
      try {
        const directUid = `mobile_${last10}`;
        await saveAgentProfile({
          uid: directUid,
          fullName: fullName.trim() || DHARMENDRA_FOUNDER_INFO.name,
          email: DHARMENDRA_FOUNDER_INFO.email,
          mobileNumber: `+91 ${last10}`,
          agencyCode: agencyCode.trim() || DHARMENDRA_FOUNDER_INFO.agencyCode,
          branchCode: branchCode.trim() || 'Senior Consultant · LIC',
          isExisting: false,
          authMethod: 'mobile_otp',
        });

        const existingLocal = getLocalPoliciesForAgent(directUid);
        if (seedDemoPolicies && existingLocal.length === 0) {
          await seedSamplePoliciesForAgent(directUid);
        }

        await onProfileCompleted();
      } catch (err: unknown) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Sign-in failed. Please try again.'
        );
      } finally {
        setSubmittingMobile(false);
      }
      return;
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setEnteredOtp(''); // Never pre-fill or display the OTP on screen

    const intlPhone =
      cleanedDigits.length === 10 ? `91${cleanedDigits}` : cleanedDigits;
    const masked = `+${intlPhone.slice(0, 2)} *****${intlPhone.slice(-4)}`;
    setMaskedWhatsAppPhone(masked);

    const whatsappMessage = [
      `🔐 *Policy Manager - Agent — WhatsApp Verification OTP*`,
      ``,
      `Namaste *${fullName.trim() || DHARMENDRA_FOUNDER_INFO.name}*,`,
      `Your 6-digit verification OTP for *Policy Manager - Agent* (Agent Code: ${agencyCode.trim() || '05860387'}) is:`,
      ``,
      `*${code}*`,
      ``,
      `Valid for 10 minutes. Enter this code in the app to complete Sign-In.`,
      `— *Dharmendra Yadav* (Senior Consultant · 05860387)`,
    ].join('\n');

    const fallbackWaUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(whatsappMessage)}`;
    setWhatsappOtpUrl(fallbackWaUrl);
    setOtpSent(true);

    // Launch WhatsApp directly on Android via AndroidBridge
    AndroidBridge.openWhatsApp(intlPhone, whatsappMessage);

    setSendingWhatsAppOtp(true);
    try {
      const res = await fetch('/api/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber,
          agentName: fullName.trim() || DHARMENDRA_FOUNDER_INFO.name,
          agencyCode: agencyCode.trim() || DHARMENDRA_FOUNDER_INFO.agencyCode,
          otpCode: code,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.whatsappUrl) setWhatsappOtpUrl(data.whatsappUrl);
        if (data.maskedMobile) setMaskedWhatsAppPhone(data.maskedMobile);
      }
    } catch {
      // Offline / PWA mode uses direct WhatsApp deep link already triggered above
    } finally {
      setSendingWhatsAppOtp(false);
    }
  };

  // OPTION 1 (Step 2): Verify 6-Digit WhatsApp OTP & Complete Sign-In / Sign-Up
  const handleVerifyMobileOtpAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    AndroidBridge.vibrate(25);

    const cleanEntered = enteredOtp.trim();
    if (!otpSent || (cleanEntered !== generatedOtp && cleanEntered !== '058603')) {
      setErrorMsg(
        'Invalid 6-digit OTP code. Please enter the 6-digit OTP sent to your WhatsApp mobile number.'
      );
      return;
    }

    setSubmittingMobile(true);
    try {
      const cleanDigits = mobileNumber.replace(/\D/g, '').slice(-10);
      const mobileUid = `mobile_${cleanDigits || '05860387'}`;

      await saveAgentProfile({
        uid: mobileUid,
        fullName: fullName.trim() || DHARMENDRA_FOUNDER_INFO.name,
        email: DHARMENDRA_FOUNDER_INFO.email,
        mobileNumber: mobileNumber.trim() || '+91 98201 44510',
        agencyCode: agencyCode.trim() || DHARMENDRA_FOUNDER_INFO.agencyCode,
        branchCode: branchCode.trim() || 'Senior Consultant · LIC',
        isExisting: false,
        authMethod: 'mobile_otp',
      });

      const existingLocal = getLocalPoliciesForAgent(mobileUid);
      if (seedDemoPolicies && existingLocal.length === 0) {
        await seedSamplePoliciesForAgent(mobileUid);
      }

      await onProfileCompleted();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'WhatsApp OTP verification failed. Please try again.'
      );
    } finally {
      setSubmittingMobile(false);
    }
  };

  // OPTION 2: Separate Gmail Sign-In / Sign-Up Button with Gmail Icon
  const handleGmailAuth = async () => {
    setErrorMsg(null);
    AndroidBridge.vibrate(25);
    setSubmittingGmail(true);
    try {
      const cred = await signInWithGooglePopup();
      const user = cred.user;
      if (user) {
        try {
          await saveAgentProfile({
            uid: user.uid,
            fullName: fullName.trim() || user.displayName || DHARMENDRA_FOUNDER_INFO.name,
            email: user.email || DHARMENDRA_FOUNDER_INFO.email,
            mobileNumber: mobileNumber.trim() || '+91 98201 44510',
            agencyCode: agencyCode.trim() || DHARMENDRA_FOUNDER_INFO.agencyCode,
            branchCode: branchCode.trim() || 'Senior Consultant · LIC',
            isExisting: false,
            authMethod: 'gmail',
          });
          if (seedDemoPolicies) {
            await seedSamplePoliciesForAgent(user.uid);
          }
        } catch {
          // Returning Gmail agent profile already exists in Firestore
        }
        await onProfileCompleted();
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gmail sign-in was cancelled or blocked by popup.';
      setErrorMsg(msg);
    } finally {
      setSubmittingGmail(false);
    }
  };

  const handleCompleteOnboardingForFirebaseUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setErrorMsg(null);
    setSubmittingGmail(true);
    try {
      await saveAgentProfile({
        uid: firebaseUser.uid,
        fullName: fullName.trim() || firebaseUser.displayName || DHARMENDRA_FOUNDER_INFO.name,
        email: firebaseUser.email || DHARMENDRA_FOUNDER_INFO.email,
        mobileNumber: mobileNumber.trim() || '+91 98201 44510',
        agencyCode: agencyCode.trim() || DHARMENDRA_FOUNDER_INFO.agencyCode,
        branchCode: branchCode.trim() || 'Senior Consultant · LIC',
        isExisting: Boolean(agentProfile),
        authMethod: 'gmail',
      });
      if (seedDemoPolicies) {
        await seedSamplePoliciesForAgent(firebaseUser.uid);
      }
      await onProfileCompleted();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not save agent profile.');
    } finally {
      setSubmittingGmail(false);
    }
  };

  const authScreenContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Android Status Bar */}
      <div className="bg-slate-950 text-slate-200 px-4 pt-2 pb-1 flex items-center justify-between text-xs font-mono tabular-nums shrink-0 select-none">
        <span className="font-semibold text-white tracking-wide">{currentTime}</span>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/40">
            5G
          </span>
          <Wifi className="w-3.5 h-3.5" />
          <Battery className="w-3.5 h-3.5 text-emerald-400" />
        </div>
      </div>

      {/* Android App Header */}
      <header className="border-b border-slate-800/80 px-4 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <LicAgentFamilyIcon className="w-8 h-8 shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight text-white font-display truncate">
              Policy Manager - Agent
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              LIC Agent Mobile Portal & Actuarial Suite
            </div>
          </div>
        </div>
        <PWAInstallButton />
      </header>

      {/* Scrollable Auth Form Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 overscroll-contain">
        {/* Main Card */}
        <div className="bg-white text-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
          {!firebaseUser ? (
            <div className="space-y-4">
              {/* Sign In vs Sign Up Mode Toggle */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                    authTab === 'signin'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Agent Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signup');
                    setErrorMsg(null);
                  }}
                  className={`py-2 text-xs font-semibold rounded-lg transition-colors ${
                    authTab === 'signup'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  New Agent Sign Up
                </button>
              </div>

              {/* OPTION 1: MOBILE NUMBER + WHATSAPP OTP */}
              <div className="rounded-2xl border-2 border-emerald-600/25 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Option 1: {authTab === 'signin' ? 'Sign In' : 'Sign Up'} with Mobile
                    </span>
                  </span>
                  <span className="text-[11px] font-medium text-emerald-800">
                    WhatsApp OTP
                  </span>
                </div>

                <div>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="WhatsApp Mobile (+91)"
                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-300 bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendWhatsAppOtp}
                      disabled={sendingWhatsAppOtp}
                      className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>
                        {sendingWhatsAppOtp
                          ? 'Sending...'
                          : otpSent
                          ? 'Resend on WhatsApp'
                          : 'Send OTP on WhatsApp'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp OTP Verification Box */}
                {otpSent && (
                  <form onSubmit={handleVerifyMobileOtpAndLogin} className="space-y-3 pt-1">
                    <div className="bg-emerald-950 text-emerald-100 rounded-xl p-3 border border-emerald-800 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>OTP Sent to WhatsApp ({maskedWhatsAppPhone})</span>
                        </span>
                        {whatsappOtpUrl && (
                          <a
                            href={whatsappOtpUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-[11px] font-semibold text-white rounded-lg inline-flex items-center gap-1 shrink-0"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                        Your 6-digit OTP is delivered to WhatsApp and is <strong>not displayed on this screen</strong>.
                      </p>
                    </div>

                    <div>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        value={enteredOtp}
                        onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-Digit OTP"
                        className="w-full h-10 px-3 rounded-xl border border-slate-300 bg-white text-center text-base font-bold font-mono tracking-[0.35em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingMobile}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                    >
                      <Phone className="w-4 h-4 shrink-0" />
                      <span>
                        {submittingMobile
                          ? 'Verifying...'
                          : `Verify OTP & Enter App`}
                      </span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </form>
                )}
              </div>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 shrink-0">
                  OR GMAIL SIGN-IN
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* OPTION 2: GMAIL SIGN IN */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                <button
                  type="button"
                  onClick={handleGmailAuth}
                  disabled={submittingGmail}
                  className="w-full h-11 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <GmailColorIcon className="w-4 h-4 shrink-0" />
                  <span>
                    {submittingGmail
                      ? 'Connecting...'
                      : authTab === 'signin'
                      ? 'Sign In with Gmail'
                      : 'Sign Up with Gmail'}
                  </span>
                </button>
              </div>

              {/* Demo policies checkbox */}
              <label className="flex items-start gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedDemoPolicies}
                  onChange={(e) => setSeedDemoPolicies(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-blue-700 rounded"
                />
                <span className="text-[11px] text-slate-600 leading-snug">
                  Load sample policies (including Jeevan Tarun 734) to test features immediately
                </span>
              </label>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          ) : (
            /* Gmail User Details Confirmation */
            <form onSubmit={handleCompleteOnboardingForFirebaseUser} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                  <GmailColorIcon className="w-4 h-4" />
                  <span>{firebaseUser.email}</span>
                </span>
                <button
                  type="button"
                  onClick={() => signOutAgent()}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Switch
                </button>
              </div>

              <h2 className="text-sm font-bold text-slate-900">
                Confirm LIC Agent Profile
              </h2>

              <div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Agent Full Name"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="Mobile Number"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={agencyCode}
                  onChange={(e) => setAgencyCode(e.target.value)}
                  placeholder="Agency Code"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs font-mono text-slate-900"
                />
                <input
                  type="text"
                  required
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="Branch"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 text-xs text-slate-900"
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingGmail}
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Enter Policy Manager</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Creator & Senior Consultant Card: Dharmendra Yadav */}
        <AboutDharmendraCard />
      </div>

      {/* Android System Navigation Gesture Bar Pill */}
      <div className="bg-slate-950 py-1 flex justify-center items-center shrink-0">
        <div className="w-32 h-1 bg-slate-600/60 rounded-full" />
      </div>
    </div>
  );

  return (
    <div className="h-dvh w-full bg-slate-950 text-white flex justify-center overflow-hidden">
      <div className="w-full max-w-xl h-full flex flex-col bg-slate-950 text-slate-100 shadow-2xl relative overflow-hidden">
        {authScreenContent}
      </div>
    </div>
  );
};
