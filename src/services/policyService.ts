import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { PaymentMode } from '../data/licPlans';

export type PolicyStatus = 'Active' | 'Grace Period' | 'Lapsed' | 'Matured';

export interface AgentProfileRecord {
  uid: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  agencyCode: string;
  branchCode: string;
  authMethod?: 'gmail' | 'mobile_otp';
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface CustomerPolicyRecord {
  id: string;
  agentId: string;
  policyNumber: string;
  customerName: string;
  customerMobile: string;
  dateOfBirth: string; // YYYY-MM-DD
  planId: string;
  planName: string;
  planNo: string;
  sumAssured: number;
  premiumAmount: number;
  paymentMode: PaymentMode;
  policyTerm: number;
  ppt: number;
  commencementDate: string; // YYYY-MM-DD
  nextRenewalDate: string; // YYYY-MM-DD
  maturityDate: string; // YYYY-MM-DD
  maturityAmount: number;
  status: PolicyStatus;
  lastReminderSentAt: string;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
}

export interface PolicyNotificationItem {
  id: string;
  policy: CustomerPolicyRecord;
  type: 'overdue_grace' | 'upcoming_renewal' | 'maturity_soon' | 'birthday_cross_sell';
  urgency: 'critical' | 'warning' | 'info';
  title: string;
  subtitle: string;
  daysDelta: number; // negative = overdue, 0 = today, positive = in X days
  recommendedPlanUpsell?: string;
}

const LOCAL_MOBILE_SESSION_KEY = 'lic_agent_family_mobile_otp_session_v1';
const LOCAL_POLICIES_PREFIX = 'lic_agent_family_policies_v1_';

function isFirestoreVerifiedUser(uid: string): boolean {
  return Boolean(
    auth.currentUser &&
      auth.currentUser.uid === uid &&
      auth.currentUser.emailVerified === true
  );
}

export function getSavedMobileOtpAgentSession(): AgentProfileRecord | null {
  try {
    const raw = localStorage.getItem(LOCAL_MOBILE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AgentProfileRecord;
  } catch {
    return null;
  }
}

export function saveMobileOtpAgentSession(profile: AgentProfileRecord): void {
  localStorage.setItem(LOCAL_MOBILE_SESSION_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('lic-mobile-vault-updated'));
}

export function clearMobileOtpAgentSession(): void {
  localStorage.removeItem(LOCAL_MOBILE_SESSION_KEY);
  window.dispatchEvent(new CustomEvent('lic-mobile-vault-updated'));
}

export function getLocalPoliciesForAgent(agentId: string): CustomerPolicyRecord[] {
  try {
    const raw = localStorage.getItem(`${LOCAL_POLICIES_PREFIX}${agentId}`);
    if (!raw) return [];
    return JSON.parse(raw) as CustomerPolicyRecord[];
  } catch {
    return [];
  }
}

function saveLocalPoliciesForAgent(agentId: string, list: CustomerPolicyRecord[]): void {
  localStorage.setItem(`${LOCAL_POLICIES_PREFIX}${agentId}`, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('lic-mobile-vault-updated'));
}

// Defensive sanitizer matching firebase-blueprint.json & firestore.rules
function sanitizeMobile(raw: string): string {
  const cleaned = raw.replace(/[^0-9+\-\s()]/g, '').trim().slice(0, 20);
  return cleaned.length >= 8 ? cleaned : '+91 98201 44510';
}

function sanitizeAlphanumericId(raw: string, fallback: string, maxLen = 32): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '').trim().slice(0, maxLen);
  return cleaned.length >= 2 ? cleaned : fallback;
}

function sanitizePolicyNumber(raw: string): string {
  const cleaned = raw.replace(/[^0-9A-Za-z\-]/g, '').trim().slice(0, 24);
  return cleaned.length >= 5 ? cleaned : `89${Math.floor(1000000 + Math.random() * 8999999)}`;
}

export async function fetchAgentProfile(uid: string): Promise<AgentProfileRecord | null> {
  if (!isFirestoreVerifiedUser(uid)) {
    const localSession = getSavedMobileOtpAgentSession();
    if (localSession && localSession.uid === uid) return localSession;
    return null;
  }
  const path = `agents/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'agents', uid));
    if (!snap.exists()) return null;
    return snap.data() as AgentProfileRecord;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveAgentProfile(input: {
  uid: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  agencyCode: string;
  branchCode: string;
  isExisting: boolean;
  authMethod?: 'gmail' | 'mobile_otp';
}): Promise<void> {
  const fullName = (input.fullName || 'Dharmendra Yadav').trim().slice(0, 100);
  const email = (input.email || auth.currentUser?.email || 'dharamabaper@gmail.com').trim().slice(0, 150);
  const mobileNumber = sanitizeMobile(input.mobileNumber);
  const agencyCode = sanitizeAlphanumericId(input.agencyCode, '05860387', 32);
  const branchCode = (input.branchCode || 'Senior Consultant · LIC').trim().slice(0, 32);

  if (!isFirestoreVerifiedUser(input.uid)) {
    saveMobileOtpAgentSession({
      uid: input.uid,
      fullName,
      email,
      mobileNumber,
      agencyCode,
      branchCode,
      authMethod: input.authMethod || 'mobile_otp',
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const path = `agents/${input.uid}`;
  try {
    if (input.isExisting) {
      await updateDoc(doc(db, 'agents', input.uid), {
        fullName,
        mobileNumber,
        agencyCode,
        branchCode,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'agents', input.uid), {
        uid: input.uid,
        fullName,
        email,
        mobileNumber,
        agencyCode,
        branchCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(
      error,
      input.isExisting ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function createCustomerPolicyRecord(
  payload: Omit<CustomerPolicyRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const policyId = `pol_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const cleanFields = {
    agentId: payload.agentId,
    policyNumber: sanitizePolicyNumber(payload.policyNumber),
    customerName: (payload.customerName || 'Valued Policyholder').trim().slice(0, 100),
    customerMobile: sanitizeMobile(payload.customerMobile),
    dateOfBirth: (payload.dateOfBirth || '1992-05-15').trim().slice(0, 16),
    planId: (payload.planId || 'jeevan-anand-715').trim().slice(0, 64),
    planName: (payload.planName || 'LIC New Jeevan Anand').trim().slice(0, 120),
    planNo: (payload.planNo || '715 (Legacy 915)').trim().slice(0, 32),
    sumAssured: Math.max(50000, Math.min(1000000000, Math.round(Number(payload.sumAssured) || 500000))),
    premiumAmount: Math.max(500, Math.min(500000000, Math.round(Number(payload.premiumAmount) || 25000))),
    paymentMode: payload.paymentMode || 'Yearly',
    policyTerm: Math.max(1, Math.min(100, Math.round(Number(payload.policyTerm) || 21))),
    ppt: Math.max(1, Math.min(100, Math.round(Number(payload.ppt) || 21))),
    commencementDate: (payload.commencementDate || '2024-10-15').trim().slice(0, 16),
    nextRenewalDate: (payload.nextRenewalDate || '2026-10-15').trim().slice(0, 16),
    maturityDate: (payload.maturityDate || '2045-10-15').trim().slice(0, 16),
    maturityAmount: Math.max(0, Math.min(5000000000, Math.round(Number(payload.maturityAmount) || 1500000))),
    status: payload.status || 'Active',
    lastReminderSentAt: (payload.lastReminderSentAt || '').trim().slice(0, 40),
  };

  if (!isFirestoreVerifiedUser(payload.agentId)) {
    const existing = getLocalPoliciesForAgent(payload.agentId);
    const newRecord: CustomerPolicyRecord = {
      id: policyId,
      ...cleanFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveLocalPoliciesForAgent(payload.agentId, [newRecord, ...existing]);
    return policyId;
  }

  const path = `policies/${policyId}`;
  try {
    await setDoc(doc(db, 'policies', policyId), {
      ...cleanFields,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return policyId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markPolicyRenewalPaid(
  policy: CustomerPolicyRecord
): Promise<void> {
  const nextDate = computeNextInstallmentDate(policy.nextRenewalDate, policy.paymentMode);
  if (!isFirestoreVerifiedUser(policy.agentId)) {
    const list = getLocalPoliciesForAgent(policy.agentId).map((p) =>
      p.id === policy.id
        ? {
            ...p,
            nextRenewalDate: nextDate,
            status: 'Active' as PolicyStatus,
            lastReminderSentAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    saveLocalPoliciesForAgent(policy.agentId, list);
    return;
  }

  const path = `policies/${policy.id}`;
  try {
    await updateDoc(doc(db, 'policies', policy.id), {
      nextRenewalDate: nextDate,
      status: 'Active',
      lastReminderSentAt: new Date().toISOString().slice(0, 10),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function logPolicyReminderSent(policyId: string, agentId?: string): Promise<void> {
  if (agentId && !isFirestoreVerifiedUser(agentId)) {
    const list = getLocalPoliciesForAgent(agentId).map((p) =>
      p.id === policyId
        ? {
            ...p,
            lastReminderSentAt: new Date().toISOString().slice(0, 10),
            updatedAt: new Date().toISOString(),
          }
        : p
    );
    saveLocalPoliciesForAgent(agentId, list);
    return;
  }

  if (!auth.currentUser?.emailVerified) return;

  const path = `policies/${policyId}`;
  try {
    await updateDoc(doc(db, 'policies', policyId), {
      lastReminderSentAt: new Date().toISOString().slice(0, 10),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCustomerPolicyRecord(policyId: string, agentId?: string): Promise<void> {
  const targetAgent = agentId || getSavedMobileOtpAgentSession()?.uid;
  if (targetAgent && !isFirestoreVerifiedUser(targetAgent)) {
    const list = getLocalPoliciesForAgent(targetAgent).filter((p) => p.id !== policyId);
    saveLocalPoliciesForAgent(targetAgent, list);
    return;
  }

  const path = `policies/${policyId}`;
  try {
    await deleteDoc(doc(db, 'policies', policyId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function computeNextInstallmentDate(currentDateStr: string, mode: PaymentMode): string {
  const d = new Date(currentDateStr);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() + 1);
    return fallback.toISOString().slice(0, 10);
  }
  if (mode === 'Yearly') d.setFullYear(d.getFullYear() + 1);
  else if (mode === 'Half-Yearly') d.setMonth(d.getMonth() + 6);
  else if (mode === 'Quarterly') d.setMonth(d.getMonth() + 3);
  else if (mode === 'Monthly (NACH)') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export function calculateAgeFromDob(dobStr: string): number {
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return 30;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, Math.min(99, age));
}

export function buildPolicyNotifications(policies: CustomerPolicyRecord[]): PolicyNotificationItem[] {
  const items: PolicyNotificationItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const pol of policies) {
    if (pol.status === 'Matured') continue;

    // 1. Check Renewal Due Date
    if (pol.paymentMode !== 'Single') {
      const due = new Date(pol.nextRenewalDate);
      if (!isNaN(due.getTime())) {
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
          const overdueDays = Math.abs(diffDays);
          const inGrace = overdueDays <= 30;
          items.push({
            id: `notif-overdue-${pol.id}`,
            policy: pol,
            type: 'overdue_grace',
            urgency: 'critical',
            daysDelta: diffDays,
            title: inGrace
              ? `Grace Period Alert: ${pol.customerName} (${overdueDays}d overdue)`
              : `Revival Alert: Policy ${pol.policyNumber} Lapsed (${overdueDays}d overdue)`,
            subtitle: `${pol.planName} (Plan ${pol.planNo}) · ${pol.paymentMode} Premium due on ${pol.nextRenewalDate}`,
            recommendedPlanUpsell: inGrace
              ? 'Remind client that LIC allows 30-day grace period without late fee or interest.'
              : 'Recommend LIC Special Revival Campaign with late fee concession.',
          });
        } else if (diffDays <= 45) {
          items.push({
            id: `notif-upcoming-${pol.id}`,
            policy: pol,
            type: 'upcoming_renewal',
            urgency: diffDays <= 7 ? 'critical' : 'warning',
            daysDelta: diffDays,
            title:
              diffDays === 0
                ? `Renewal Due Today: ${pol.customerName}`
                : `Renewal Due in ${diffDays} Days: ${pol.customerName}`,
            subtitle: `Policy #${pol.policyNumber} · ${pol.planName} · ${pol.paymentMode} Installment`,
            recommendedPlanUpsell:
              pol.planId === 'new-endowment-714'
                ? 'Cross-sell LIC Jeevan Utsav (Plan 771) for 10% Lifetime Guaranteed Income.'
                : 'Offer NACH Auto-Debit enrollment or Yearly Mode switch for 2% rebate.',
          });
        }
      }
    }

    // 2. Check Maturity Date within next 180 days
    const matDate = new Date(pol.maturityDate);
    if (!isNaN(matDate.getTime())) {
      matDate.setHours(0, 0, 0, 0);
      const matDays = Math.round((matDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (matDays >= -30 && matDays <= 180) {
        items.push({
          id: `notif-maturity-${pol.id}`,
          policy: pol,
          type: 'maturity_soon',
          urgency: 'info',
          daysDelta: matDays,
          title: `Maturity Claim Approaching: ${pol.customerName}`,
          subtitle: `Policy #${pol.policyNumber} matures on ${pol.maturityDate} · Prepare NEFT & Discharge Voucher`,
          recommendedPlanUpsell:
            'Re-invest maturity proceeds into LIC Jeevan Akshay VII / Single Premium Endowment (Plan 717).',
        });
      }
    }

    // 3. Check Birthday / Age Change (Nearer Birthday) Opportunity
    const dob = new Date(pol.dateOfBirth);
    if (!isNaN(dob.getTime())) {
      const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBday.getTime() < today.getTime()) {
        nextBday.setFullYear(today.getFullYear() + 1);
      }
      const bdayDays = Math.round((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (bdayDays <= 30) {
        const turningAge = nextBday.getFullYear() - dob.getFullYear();
        items.push({
          id: `notif-bday-${pol.id}`,
          policy: pol,
          type: 'birthday_cross_sell',
          urgency: 'info',
          daysDelta: bdayDays,
          title: `Birthday & Age-Slab Alert: ${pol.customerName} (Turning ${turningAge} in ${bdayDays}d)`,
          subtitle: `DOB: ${pol.dateOfBirth} · Lock lower LIC Tabular Rate before nearer-birthday age increases!`,
          recommendedPlanUpsell:
            turningAge < 12
              ? 'Pitch LIC Jeevan Tarun (Plan 734) or Amritbaal (Plan 774) for child higher education.'
              : turningAge < 35
              ? 'Pitch LIC Jeevan Labh (Plan 736 — 25/16) before age slab rate increases.'
              : 'Pitch LIC Jeevan Umang (Plan 745) for 8% tax-free retirement pension.',
        });
      }
    }
  }

  return items.sort((a, b) => a.daysDelta - b.daysDelta);
}

export async function seedSamplePoliciesForAgent(agentId: string): Promise<void> {
  const today = new Date();
  const addDays = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  // Birthday coming up in 8 days (born in 1991)
  const bdaySoon = new Date(today);
  bdaySoon.setDate(bdaySoon.getDate() + 8);
  bdaySoon.setFullYear(1991);

  const samples: Omit<CustomerPolicyRecord, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      agentId,
      policyNumber: '894512039',
      customerName: 'Rajesh Sharma',
      customerMobile: '+91 98201 44510',
      dateOfBirth: bdaySoon.toISOString().slice(0, 10),
      planId: 'jeevan-anand-715',
      planName: 'LIC New Jeevan Anand',
      planNo: '715 (Legacy 915)',
      sumAssured: 1000000,
      premiumAmount: 52287,
      paymentMode: 'Yearly',
      policyTerm: 21,
      ppt: 21,
      commencementDate: '2021-10-15',
      nextRenewalDate: addDays(5), // Due in 5 days!
      maturityDate: '2042-10-15',
      maturityAmount: 3032000,
      status: 'Active',
      lastReminderSentAt: '',
    },
    {
      agentId,
      policyNumber: '893104882',
      customerName: 'Aarav Verma (Jeevan Tarun)',
      customerMobile: '+91 98450 11290',
      dateOfBirth: '2019-06-14',
      planId: 'jeevan-tarun-734',
      planName: 'LIC Jeevan Tarun (Child Plan)',
      planNo: '734 (Legacy 934)',
      sumAssured: 500000,
      premiumAmount: 27420,
      paymentMode: 'Yearly',
      policyTerm: 18,
      ppt: 13,
      commencementDate: '2024-06-14',
      nextRenewalDate: addDays(-7), // 7 days overdue (in 30-day Grace Period!)
      maturityDate: '2044-06-14',
      maturityAmount: 1085000,
      status: 'Grace Period',
      lastReminderSentAt: '',
    },
    {
      agentId,
      policyNumber: '897623190',
      customerName: 'Vikramaditya Deshmukh',
      customerMobile: '+91 97654 33108',
      dateOfBirth: '1985-11-04',
      planId: 'jeevan-umang-745',
      planName: 'LIC Jeevan Umang',
      planNo: '745 (Legacy 945)',
      sumAssured: 1500000,
      premiumAmount: 118450,
      paymentMode: 'Yearly',
      policyTerm: 60,
      ppt: 15,
      commencementDate: '2023-10-28',
      nextRenewalDate: addDays(18),
      maturityDate: '2083-10-28',
      maturityAmount: 9450000,
      status: 'Active',
      lastReminderSentAt: '',
    },
    {
      agentId,
      policyNumber: '891009432',
      customerName: 'Meenakshi Iyer',
      customerMobile: '+91 98114 76200',
      dateOfBirth: '1980-07-19',
      planId: 'money-back-20-720',
      planName: 'LIC New Money Back (20 Years)',
      planNo: '720 (Legacy 920)',
      sumAssured: 500000,
      premiumAmount: 38420,
      paymentMode: 'Yearly',
      policyTerm: 20,
      ppt: 15,
      commencementDate: '2007-01-15',
      nextRenewalDate: addDays(95),
      maturityDate: addDays(95),
      maturityAmount: 1085000,
      status: 'Active',
      lastReminderSentAt: '',
    },
  ];

  for (const s of samples) {
    await createCustomerPolicyRecord(s);
  }
}
