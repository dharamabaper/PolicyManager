import * as XLSX from 'xlsx';
import { LIC_PLANS, PaymentMode, calculateLicActuarial } from '../data/licPlans';
import { CustomerPolicyRecord, PolicyStatus, calculateAgeFromDob } from './policyService';

export type ParsedExcelPolicyRow = Omit<CustomerPolicyRecord, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>;

function normalizeDateString(val: unknown, fallback: string): string {
  if (!val) return fallback;
  if (typeof val === 'number') {
    // Excel serial date
    const parsed = XLSX.SSF.parse_date_code(val);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const m = String(parsed.m).padStart(2, '0');
      const d = String(parsed.d).padStart(2, '0');
      return `${parsed.y}-${m}-${d}`;
    }
  }
  const str = String(val).trim();
  const dObj = new Date(str);
  if (!isNaN(dObj.getTime())) {
    return dObj.toISOString().slice(0, 10);
  }
  return fallback;
}

function matchLicPlan(rawPlan: unknown) {
  const s = String(rawPlan || '').toLowerCase();
  if (s.includes('736') || s.includes('936') || s.includes('labh')) {
    return LIC_PLANS.find((p) => p.id === 'jeevan-labh-736')!;
  }
  if (s.includes('733') || s.includes('933') || s.includes('lakshya')) {
    return LIC_PLANS.find((p) => p.id === 'jeevan-lakshya-733')!;
  }
  if (s.includes('745') || s.includes('945') || s.includes('umang')) {
    return LIC_PLANS.find((p) => p.id === 'jeevan-umang-745')!;
  }
  if (s.includes('771') || s.includes('871') || s.includes('utsav')) {
    return LIC_PLANS.find((p) => p.id === 'jeevan-utsav-771')!;
  }
  if (s.includes('720') || s.includes('920') || s.includes('money back 20')) {
    return LIC_PLANS.find((p) => p.id === 'money-back-20-720')!;
  }
  if (s.includes('721') || s.includes('921') || s.includes('money back 25')) {
    return LIC_PLANS.find((p) => p.id === 'money-back-25-721')!;
  }
  if (s.includes('774') || s.includes('874') || s.includes('amritbaal')) {
    return LIC_PLANS.find((p) => p.id === 'amritbaal-774')!;
  }
  if (s.includes('955') || s.includes('855') || s.includes('amar') || s.includes('term')) {
    return LIC_PLANS.find((p) => p.id === 'jeevan-amar-955')!;
  }
  if (s.includes('717') || s.includes('917') || s.includes('single')) {
    return LIC_PLANS.find((p) => p.id === 'single-premium-endowment-717')!;
  }
  if (s.includes('714') || s.includes('914') || s.includes('endowment')) {
    return LIC_PLANS.find((p) => p.id === 'new-endowment-714')!;
  }
  return LIC_PLANS[0]; // Default 715 New Jeevan Anand
}

function normalizePaymentMode(raw: unknown): PaymentMode {
  const s = String(raw || '').toLowerCase();
  if (s.includes('half') || s.includes('hly')) return 'Half-Yearly';
  if (s.includes('quart') || s.includes('qly')) return 'Quarterly';
  if (s.includes('month') || s.includes('nach') || s.includes('mly')) return 'Monthly (NACH)';
  if (s.includes('single')) return 'Single';
  return 'Yearly';
}

function normalizeStatus(raw: unknown): PolicyStatus {
  const s = String(raw || '').toLowerCase();
  if (s.includes('grace')) return 'Grace Period';
  if (s.includes('lapse')) return 'Lapsed';
  if (s.includes('matur')) return 'Matured';
  return 'Active';
}

/**
 * Parses an Excel (.xlsx / .xls / .csv) file strictly in memory and extracts only the structured
 * customer policy records. The Excel file itself is never saved or uploaded anywhere.
 */
export async function parseCustomerPoliciesFromExcelInMemory(
  file: File
): Promise<ParsedExcelPolicyRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) return [];

  const sheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  const parsedPolicies: ParsedExcelPolicyRow[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const r = rawRows[i];
    // Case-insensitive field lookup helper
    const getVal = (candidates: string[]) => {
      for (const key of Object.keys(r)) {
        const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (candidates.some((c) => cleanKey.includes(c))) {
          return r[key];
        }
      }
      return '';
    };

    const rawPolicyNo = String(
      getVal(['policynumber', 'policyno', 'polno', 'policy']) ||
        `89${Math.floor(1000000 + Math.random() * 8999999)}`
    ).trim();

    const customerName = String(
      getVal(['customername', 'clientname', 'name', 'policyholder', 'assured']) ||
        `Policyholder ${i + 1}`
    ).trim();

    const customerMobile = String(
      getVal(['mobile', 'phone', 'contact', 'whatsapp', 'cell']) || '+91 98201 44510'
    ).trim();

    const dateOfBirth = normalizeDateString(
      getVal(['dob', 'dateofbirth', 'birthdate']),
      '1990-06-15'
    );

    const plan = matchLicPlan(getVal(['plan', 'table', 'planno', 'planname']));
    const sumAssuredRaw = Number(
      String(getVal(['sumassured', 'sa', 'basic']) || plan.minSumAssured).replace(/[^0-9.]/g, '')
    );
    const sumAssured = Math.max(plan.minSumAssured, sumAssuredRaw || plan.minSumAssured);

    const paymentMode = normalizePaymentMode(getVal(['mode', 'paymentmode', 'frequency']));
    const policyTermRaw = Number(getVal(['term', 'policyterm']) || 21);
    const policyTerm = Math.max(plan.minTerm, Math.min(plan.maxTerm, policyTermRaw || 21));

    const entryAge = calculateAgeFromDob(dateOfBirth);
    const actuarial = calculateLicActuarial({
      clientName: customerName,
      clientPhone: customerMobile,
      planId: plan.id,
      entryAge,
      policyTerm,
      ppt: plan.pptOptions ? plan.pptOptions[0] : policyTerm,
      sumAssured,
      paymentMode,
      addbRider: true,
      termRider: false,
      criticalIllnessRider: false,
      pwbRider: false,
      proposerAge: 32,
    });

    const premiumRaw = Number(
      String(getVal(['premium', 'modalpremium', 'installment']) || 0).replace(/[^0-9.]/g, '')
    );
    const premiumAmount =
      premiumRaw >= 500
        ? Math.round(premiumRaw)
        : actuarial.subsequentYearModalPremiumInclGst > 0
        ? actuarial.subsequentYearModalPremiumInclGst
        : actuarial.firstYearModalPremiumInclGst;

    const commencementDate = normalizeDateString(
      getVal(['commencement', 'doc', 'startdate']),
      '2022-10-15'
    );
    const nextRenewalDate = normalizeDateString(
      getVal(['nextrenewal', 'renewal', 'duedate', 'fup']),
      new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)
    );

    const maturityDate = normalizeDateString(
      getVal(['maturitydate', 'dom']),
      `${new Date(commencementDate).getFullYear() + actuarial.effectivePolicyTerm}-10-15`
    );

    const maturityRaw = Number(
      String(getVal(['maturityamount', 'maturityvalue', 'maturity']) || 0).replace(/[^0-9.]/g, '')
    );
    const maturityAmount =
      maturityRaw > 0 ? Math.round(maturityRaw) : actuarial.totalValueDelivered;

    const status = normalizeStatus(getVal(['status', 'policystatus']));

    parsedPolicies.push({
      policyNumber: rawPolicyNo,
      customerName,
      customerMobile,
      dateOfBirth,
      planId: plan.id,
      planName: plan.name,
      planNo: plan.planNo,
      sumAssured,
      premiumAmount,
      paymentMode,
      policyTerm: actuarial.effectivePolicyTerm,
      ppt: actuarial.effectivePpt,
      commencementDate,
      nextRenewalDate,
      maturityDate,
      maturityAmount,
      status,
      lastReminderSentAt: '',
    });
  }

  return parsedPolicies;
}

/**
 * Generates and downloads a sample LIC Agent Customer Policy Excel (.xlsx) template
 * so the agent can test bulk policy data extraction immediately.
 */
export function downloadSamplePolicyExcelTemplate(): void {
  const today = new Date();
  const inDays = (d: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };
  const bdayToday = new Date(today);
  bdayToday.setFullYear(1988);

  const sampleRows = [
    {
      'Policy Number': '895001234',
      'Customer Name': 'Anil Kumar Verma',
      'Mobile': '+91 98201 77410',
      'Date of Birth': bdayToday.toISOString().slice(0, 10),
      'LIC Plan': '715 LIC New Jeevan Anand',
      'Sum Assured': 1500000,
      'Payment Mode': 'Yearly',
      'Policy Term': 21,
      'Premium Amount': 78430,
      'Next Renewal Date': inDays(6),
      'Maturity Date': '2045-10-15',
      'Maturity Amount': 4548000,
      'Status': 'Active',
    },
    {
      'Policy Number': '895005678',
      'Customer Name': 'Sunita Deshpande',
      'Mobile': '+91 98450 99120',
      'Date of Birth': '1992-10-18',
      'LIC Plan': '736 LIC Jeevan Labh',
      'Sum Assured': 2000000,
      'Payment Mode': 'Yearly',
      'Policy Term': 25,
      'Premium Amount': 96760,
      'Next Renewal Date': inDays(-8),
      'Maturity Date': '2048-10-18',
      'Maturity Amount': 5420000,
      'Status': 'Grace Period',
    },
    {
      'Policy Number': '895009012',
      'Customer Name': 'Rohan Malhotra',
      'Mobile': '+91 97112 33490',
      'Date of Birth': '1986-10-25',
      'LIC Plan': '745 LIC Jeevan Umang',
      'Sum Assured': 1000000,
      'Payment Mode': 'Half-Yearly',
      'Policy Term': 55,
      'Premium Amount': 39850,
      'Next Renewal Date': inDays(14),
      'Maturity Date': '2081-10-25',
      'Maturity Amount': 6300000,
      'Status': 'Active',
    },
    {
      'Policy Number': '895003456',
      'Customer Name': 'Kavita Joshi',
      'Mobile': '+91 98114 55210',
      'Date of Birth': '1995-11-02',
      'LIC Plan': '771 LIC Jeevan Utsav',
      'Sum Assured': 1000000,
      'Payment Mode': 'Yearly',
      'Policy Term': 40,
      'Premium Amount': 108500,
      'Next Renewal Date': inDays(21),
      'Maturity Date': '2065-11-02',
      'Maturity Amount': 5400000,
      'Status': 'Active',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'LIC_Customer_Policies');
  XLSX.writeFile(workbook, 'LIC_Agent_Bulk_Policies_Template.xlsx');
}
