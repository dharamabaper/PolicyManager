export type LicPlanCategory =
  | 'Endowment'
  | 'Whole Life'
  | 'Money Back'
  | 'Child Plan'
  | 'Term Assurance'
  | 'Single Premium';

export type PaymentMode = 'Yearly' | 'Half-Yearly' | 'Quarterly' | 'Monthly (NACH)' | 'Single';

export interface HsaSlab {
  minSa: number;
  rebatePerThousand: number;
}

export interface LicPlanDefinition {
  id: string;
  planNo: string; // e.g., "715 (915)"
  uin: string;
  name: string;
  tagline: string;
  category: LicPlanCategory;
  minAge: number;
  maxAge: number;
  minTerm: number;
  maxTerm: number;
  fixedTerms?: number[];
  pptRule: 'equal_to_term' | 'term_minus_3' | 'fixed_map' | 'custom_options' | 'single' | 'whole_life_100';
  pptMap?: Record<number, number>; // PolicyTerm -> PPT (e.g., Jeevan Labh 16->10, 21->15, 25->16)
  pptOptions?: number[]; // e.g., Jeevan Umang [15, 20, 25, 30] or Jeevan Utsav [5..16]
  minSumAssured: number;
  saMultiple: number;
  gstType: 'endowment' | 'term' | 'single';
  defaultBonusPerThousand: {
    shortTerm: number; // <= 15 yrs
    midTerm: number;   // 16 - 20 yrs
    longTerm: number;  // 21+ yrs
  };
  guaranteedAdditionPerThousand?: number; // e.g. 40 for Jeevan Utsav, 80 for Amritbaal
  hasFab: boolean;
  wholeLifeCoverAfterMaturity: boolean;
  survivalBenefitDescription: string;
  deathBenefitDescription: string;
  maturityBenefitDescription: string;
  loanAvailableAfterYears: number;
  taxSection80C: boolean;
  taxSection10_10D: boolean;
  commissionFirstYearPct: number;
  commissionBonusPct: number; // % of 1st yr commission as bonus commission
  commissionYear2To3Pct: number;
  commissionYear4PlusPct: number;
  hsaSlabs: { minSa: number; rebatePerThousand: number }[];
  baseRateAnchor: {
    refAge: number;
    refTerm: number;
    ratePerThousand: number;
    ageSlope: number;
    termSlope: number;
  };
}

export const LIC_PLANS: LicPlanDefinition[] = [
  {
    id: 'jeevan-anand-715',
    planNo: '715 (Legacy 915)',
    uin: '512N279V03',
    name: 'LIC New Jeevan Anand',
    tagline: 'Maturity lump sum at end of term + Free 100% Sum Assured Whole Life cover till age 100',
    category: 'Whole Life',
    minAge: 18,
    maxAge: 50,
    minTerm: 15,
    maxTerm: 35,
    pptRule: 'equal_to_term',
    minSumAssured: 200000,
    saMultiple: 5000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 38,
      midTerm: 42,
      longTerm: 46,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: true,
    survivalBenefitDescription: 'Full Maturity Sum Assured + Vested Simple Reversionary Bonus + Final Additional Bonus (FAB) paid at end of Policy Term. Thereafter, free risk cover equal to 100% Basic Sum Assured continues for whole life (up to age 100).',
    deathBenefitDescription: 'During Policy Term: 125% of Basic Sum Assured + Vested Bonus + FAB. After Maturity Term: 100% of Basic Sum Assured paid again to nominee upon death.',
    maturityBenefitDescription: 'Basic Sum Assured + Vested Simple Reversionary Bonuses + Final Additional Bonus (FAB) at end of chosen Policy Term, PLUS second payout of 100% Basic SA on death after maturity.',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 25,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.5 },
      { minSa: 1000000, rebatePerThousand: 2.5 },
      { minSa: 2500000, rebatePerThousand: 3.0 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 21,
      ratePerThousand: 53.85,
      ageSlope: 0.72,
      termSlope: -1.85,
    },
  },
  {
    id: 'jeevan-labh-736',
    planNo: '736 (Legacy 936)',
    uin: '512N304V03',
    name: 'LIC Jeevan Labh',
    tagline: 'Limited Premium Payment Endowment with high bonus accrual & compact paying term',
    category: 'Endowment',
    minAge: 8,
    maxAge: 59,
    minTerm: 16,
    maxTerm: 25,
    fixedTerms: [16, 21, 25],
    pptRule: 'fixed_map',
    pptMap: {
      16: 10,
      21: 15,
      25: 16,
    },
    minSumAssured: 200000,
    saMultiple: 10000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 40,
      midTerm: 44,
      longTerm: 47,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Pay premiums only for 10, 15, or 16 years while enjoying full risk cover and bonus accumulation for the entire 16, 21, or 25 year policy term.',
    deathBenefitDescription: '100% of Basic Sum Assured (or 7x annualized premium) + Vested Simple Reversionary Bonus + Final Additional Bonus (FAB).',
    maturityBenefitDescription: 'Basic Sum Assured + Vested Simple Reversionary Bonus for full policy term + Final Additional Bonus (FAB).',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 20,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.25 },
      { minSa: 1000000, rebatePerThousand: 1.75 },
      { minSa: 1500000, rebatePerThousand: 2.0 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 21,
      ratePerThousand: 54.20,
      ageSlope: 0.48,
      termSlope: -1.65,
    },
  },
  {
    id: 'jeevan-lakshya-733',
    planNo: '733 (Legacy 933)',
    uin: '512N297V03',
    name: 'LIC Jeevan Lakshya',
    tagline: 'Child education & family income protection: 10% Annual Income + Waiver of Premiums + 110% SA on death',
    category: 'Endowment',
    minAge: 18,
    maxAge: 50,
    minTerm: 13,
    maxTerm: 25,
    pptRule: 'term_minus_3',
    minSumAssured: 200000,
    saMultiple: 10000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 39,
      midTerm: 43,
      longTerm: 46,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Premium Paying Term is always (Policy Term - 3 years). Last 3 policy years require zero premium payment.',
    deathBenefitDescription: 'On death during term: (1) All future premiums are waived, (2) 10% of Basic Sum Assured paid EVERY YEAR till maturity, AND (3) 110% of Basic Sum Assured + Full Term Bonus + FAB paid at maturity.',
    maturityBenefitDescription: 'Basic Sum Assured + Vested Simple Reversionary Bonus + Final Additional Bonus (FAB) at end of Policy Term.',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 25,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.5 },
      { minSa: 1000000, rebatePerThousand: 2.0 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 21,
      ratePerThousand: 52.60,
      ageSlope: 0.55,
      termSlope: -1.75,
    },
  },
  {
    id: 'jeevan-umang-745',
    planNo: '745 (Legacy 945)',
    uin: '512N312V03',
    name: 'LIC Jeevan Umang',
    tagline: '8% of Basic Sum Assured Guaranteed Tax-Free Annual Pension after PPT till Age 99 + Lump Sum at Age 100',
    category: 'Whole Life',
    minAge: 1,
    maxAge: 55,
    minTerm: 45,
    maxTerm: 99,
    pptRule: 'whole_life_100',
    pptOptions: [15, 20, 25, 30],
    minSumAssured: 200000,
    saMultiple: 25000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 46,
      midTerm: 52,
      longTerm: 62,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: true,
    survivalBenefitDescription: '8% of Basic Sum Assured paid EVERY YEAR as Guaranteed Survival Benefit starting from the end of PPT until Age 99.',
    deathBenefitDescription: 'Basic Sum Assured + Vested Simple Reversionary Bonus (during PPT) + Differential Whole-Life Bonus + Final Additional Bonus (FAB).',
    maturityBenefitDescription: 'At Age 100: Basic Sum Assured + Accrued Bonuses + FAB (in addition to all 8% annual survival payouts already received).',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 25,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.25 },
      { minSa: 1000000, rebatePerThousand: 2.25 },
      { minSa: 2500000, rebatePerThousand: 2.75 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 20, // uses PPT as reference term
      ratePerThousand: 53.90,
      ageSlope: 0.35,
      termSlope: -2.10,
    },
  },
  {
    id: 'jeevan-utsav-771',
    planNo: '771 (Legacy 871)',
    uin: '512N363V02',
    name: 'LIC Jeevan Utsav',
    tagline: '100% Guaranteed ₹40/1000 Additions during PPT + 10% of Basic Sum Assured Lifetime Guaranteed Income',
    category: 'Whole Life',
    minAge: 1,
    maxAge: 65,
    minTerm: 35,
    maxTerm: 99,
    pptRule: 'whole_life_100',
    pptOptions: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    minSumAssured: 500000,
    saMultiple: 25000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 40,
      midTerm: 40,
      longTerm: 40,
    },
    guaranteedAdditionPerThousand: 40,
    hasFab: false,
    wholeLifeCoverAfterMaturity: true,
    survivalBenefitDescription: '10% of Basic Sum Assured Guaranteed Income every year for life starting 3–6 years after PPT (or Flexi Income accumulating at 5.5% p.a. compounded).',
    deathBenefitDescription: '100% of Basic Sum Assured + Accrued Guaranteed Additions (₹40 per ₹1,000 SA per year of PPT).',
    maturityBenefitDescription: 'Lifetime guaranteed 10% annual income stream + Full Basic SA + Guaranteed Additions paid to nominee on death.',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 20,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 500000, rebatePerThousand: 0 },
      { minSa: 1000000, rebatePerThousand: 1.5 },
      { minSa: 2500000, rebatePerThousand: 2.5 },
      { minSa: 5000000, rebatePerThousand: 3.0 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 10, // uses PPT as ref
      ratePerThousand: 108.50,
      ageSlope: 0.42,
      termSlope: -6.40,
    },
  },
  {
    id: 'new-endowment-714',
    planNo: '714 (Legacy 914)',
    uin: '512N277V03',
    name: 'LIC New Endowment Plan',
    tagline: 'Foundational low-premium participating endowment combining disciplined savings & family risk cover',
    category: 'Endowment',
    minAge: 8,
    maxAge: 55,
    minTerm: 12,
    maxTerm: 35,
    pptRule: 'equal_to_term',
    minSumAssured: 200000,
    saMultiple: 5000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 35,
      midTerm: 40,
      longTerm: 45,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Lump sum payout on surviving to the end of the policy term.',
    deathBenefitDescription: 'Basic Sum Assured + Vested Simple Reversionary Bonus + Final Additional Bonus (FAB).',
    maturityBenefitDescription: 'Basic Sum Assured + Vested Simple Reversionary Bonus + Final Additional Bonus (FAB).',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 25,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.25 },
      { minSa: 1000000, rebatePerThousand: 2.0 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 21,
      ratePerThousand: 46.10,
      ageSlope: 0.45,
      termSlope: -1.70,
    },
  },
  {
    id: 'money-back-20-720',
    planNo: '720 (Legacy 920)',
    uin: '512N280V03',
    name: 'LIC New Money Back (20 Years)',
    tagline: '20% Survival Benefit at Years 5, 10 & 15 + 40% SA + Full Bonus + FAB at 20th Year Maturity',
    category: 'Money Back',
    minAge: 13,
    maxAge: 50,
    minTerm: 20,
    maxTerm: 20,
    fixedTerms: [20],
    pptRule: 'fixed_map',
    pptMap: { 20: 15 },
    minSumAssured: 200000,
    saMultiple: 5000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 38,
      midTerm: 39,
      longTerm: 39,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: '20% of Basic Sum Assured paid at the end of 5th, 10th, and 15th policy year (Total 60% returned before maturity).',
    deathBenefitDescription: '125% of Basic Sum Assured + Vested Bonus + FAB (Without deducting earlier 20% Money-Back survival payouts!).',
    maturityBenefitDescription: 'Remaining 40% of Basic Sum Assured + Vested Simple Reversionary Bonus on 100% SA + Final Additional Bonus (FAB) at Year 20.',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 25,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.5 },
      { minSa: 1000000, rebatePerThousand: 2.25 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 20,
      ratePerThousand: 76.45,
      ageSlope: 0.52,
      termSlope: 0,
    },
  },
  {
    id: 'money-back-25-721',
    planNo: '721 (Legacy 921)',
    uin: '512N281V03',
    name: 'LIC New Money Back (25 Years)',
    tagline: '15% Survival Benefit at Years 5, 10, 15 & 20 + 40% SA + Full Bonus + FAB at 25th Year Maturity',
    category: 'Money Back',
    minAge: 13,
    maxAge: 45,
    minTerm: 25,
    maxTerm: 25,
    fixedTerms: [25],
    pptRule: 'fixed_map',
    pptMap: { 25: 20 },
    minSumAssured: 200000,
    saMultiple: 5000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 40,
      midTerm: 41,
      longTerm: 42,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: '15% of Basic Sum Assured paid at the end of 5th, 10th, 15th, and 20th policy year (Total 60% returned before maturity).',
    deathBenefitDescription: '125% of Basic Sum Assured + Vested Bonus + FAB (Earlier 15% survival payouts are NEVER deducted from Death Claim!).',
    maturityBenefitDescription: 'Remaining 40% of Basic Sum Assured + Vested Simple Reversionary Bonus on 100% SA + Final Additional Bonus (FAB) at Year 25.',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 25,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.5 },
      { minSa: 1000000, rebatePerThousand: 2.25 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 25,
      ratePerThousand: 61.15,
      ageSlope: 0.50,
      termSlope: 0,
    },
  },
  {
    id: 'amritbaal-774',
    planNo: '774 (Legacy 874)',
    uin: '512N365V02',
    name: 'LIC Amritbaal (Child Plan)',
    tagline: 'Guaranteed Addition of ₹80 per ₹1,000 Basic Sum Assured EVERY policy year for child higher education',
    category: 'Child Plan',
    minAge: 0,
    maxAge: 13,
    minTerm: 10,
    maxTerm: 25,
    pptRule: 'custom_options',
    pptOptions: [5, 6, 7],
    minSumAssured: 200000,
    saMultiple: 25000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 80,
      midTerm: 80,
      longTerm: 80,
    },
    guaranteedAdditionPerThousand: 80,
    hasFab: false,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Guaranteed Addition of ₹80 per ₹1,000 Basic Sum Assured accrues at the end of EVERY policy year throughout the Policy Term.',
    deathBenefitDescription: 'Sum Assured on Death + Accrued Guaranteed Additions (@ ₹80/1000 SA/year). Optional Proposer Premium Waiver Benefit (PWB) waives all future premiums.',
    maturityBenefitDescription: 'Basic Sum Assured + Total Guaranteed Additions (@ ₹80 per ₹1,000 SA × Policy Term) paid at child maturity age (18–25).',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 15,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.5 },
      { minSa: 1000000, rebatePerThousand: 2.5 },
    ],
    baseRateAnchor: {
      refAge: 5,
      refTerm: 18,
      ratePerThousand: 188.00,
      ageSlope: 0.35,
      termSlope: 2.40,
    },
  },
  {
    id: 'jeevan-amar-955',
    planNo: '955 (Legacy 855)',
    uin: '512N350V02',
    name: 'LIC New Jeevan Amar (Pure Term)',
    tagline: 'High Sum Assured Pure Risk Protection with Non-Smoker Rebates & Level/Increasing Cover options',
    category: 'Term Assurance',
    minAge: 18,
    maxAge: 65,
    minTerm: 10,
    maxTerm: 40,
    pptRule: 'equal_to_term',
    minSumAssured: 2500000,
    saMultiple: 500000,
    gstType: 'term',
    defaultBonusPerThousand: {
      shortTerm: 0,
      midTerm: 0,
      longTerm: 0,
    },
    hasFab: false,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Pure Risk Protection Plan — Nil Maturity Value on survival.',
    deathBenefitDescription: '100% of Basic Sum Assured paid in Lump Sum or in 5/10/15 Year Monthly/Annual Installments to nominee.',
    maturityBenefitDescription: 'Nil (Pure Risk Term Assurance Plan; 18% GST applies on pure protection premium).',
    loanAvailableAfterYears: 0,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 7.5,
    commissionBonusPct: 0,
    commissionYear2To3Pct: 2,
    commissionYear4PlusPct: 2,
    hsaSlabs: [
      { minSa: 2500000, rebatePerThousand: 0 },
      { minSa: 5000000, rebatePerThousand: 0.25 },
      { minSa: 10000000, rebatePerThousand: 0.45 },
      { minSa: 25000000, rebatePerThousand: 0.60 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 25,
      ratePerThousand: 1.92,
      ageSlope: 0.14,
      termSlope: 0.03,
    },
  },
  {
    id: 'single-premium-endowment-717',
    planNo: '717 (Legacy 917)',
    uin: '512N283V03',
    name: 'LIC Single Premium Endowment',
    tagline: 'One-time Lump Sum Premium with immediate Loan Liquidity, Simple Reversionary Bonus & FAB',
    category: 'Single Premium',
    minAge: 1,
    maxAge: 65,
    minTerm: 10,
    maxTerm: 25,
    pptRule: 'single',
    minSumAssured: 100000,
    saMultiple: 10000,
    gstType: 'single',
    defaultBonusPerThousand: {
      shortTerm: 42,
      midTerm: 46,
      longTerm: 51,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'One-time single premium payment at inception; policy participates in annual Simple Reversionary Bonuses for full term.',
    deathBenefitDescription: '125% of Basic Sum Assured + Vested Simple Reversionary Bonus + Final Additional Bonus (FAB).',
    maturityBenefitDescription: 'Basic Sum Assured + Vested Simple Reversionary Bonus + Final Additional Bonus (FAB).',
    loanAvailableAfterYears: 1,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 2,
    commissionBonusPct: 0,
    commissionYear2To3Pct: 0,
    commissionYear4PlusPct: 0,
    hsaSlabs: [
      { minSa: 100000, rebatePerThousand: 0 },
      { minSa: 300000, rebatePerThousand: 12.0 },
      { minSa: 500000, rebatePerThousand: 18.0 },
      { minSa: 1000000, rebatePerThousand: 22.0 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 15,
      ratePerThousand: 598.00,
      ageSlope: 1.15,
      termSlope: -14.20,
    },
  },
  {
    id: 'jeevan-tarun-734',
    planNo: '734 (Legacy 934)',
    uin: '512N299V03',
    name: 'LIC Jeevan Tarun (Child Plan)',
    tagline: 'Child Education & Marriage Money-Back Plan: PPT till Age 20, Survival Payouts Ages 20–24 & Maturity at Age 25',
    category: 'Child Plan',
    minAge: 0,
    maxAge: 12,
    minTerm: 13,
    maxTerm: 25,
    pptRule: 'term_minus_3',
    minSumAssured: 75000,
    saMultiple: 5000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 40,
      midTerm: 43,
      longTerm: 47,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Policy Term = (25 - Entry Age); PPT = (20 - Entry Age). Under Option 3, 10% of Basic Sum Assured is paid every year at child ages 20, 21, 22, 23 & 24 (50% total survival payouts).',
    deathBenefitDescription: '125% of Basic Sum Assured + Vested Simple Reversionary Bonus + FAB. With PWB (Premium Waiver Benefit) Rider, all future premiums are waived upon death of Proposer.',
    maturityBenefitDescription: 'At Child Age 25: Remaining 50% (or chosen option %) of Basic Sum Assured + 100% Vested Simple Reversionary Bonus + Final Additional Bonus (FAB).',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 25,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 75000, rebatePerThousand: 0 },
      { minSa: 200000, rebatePerThousand: 1.25 },
      { minSa: 500000, rebatePerThousand: 2.0 },
    ],
    baseRateAnchor: {
      refAge: 5,
      refTerm: 20,
      ratePerThousand: 56.40,
      ageSlope: 0.45,
      termSlope: -1.80,
    },
  },
  {
    id: 'bima-jyoti-760',
    planNo: '760 (Legacy 860)',
    uin: '512N339V03',
    name: 'LIC Bima Jyoti',
    tagline: 'Guaranteed Addition of ₹50 per ₹1,000 Basic Sum Assured EVERY policy year with Limited PPT (Term - 5 Yrs)',
    category: 'Endowment',
    minAge: 1,
    maxAge: 60,
    minTerm: 15,
    maxTerm: 20,
    pptRule: 'term_minus_3',
    minSumAssured: 125000,
    saMultiple: 25000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 50,
      midTerm: 50,
      longTerm: 50,
    },
    guaranteedAdditionPerThousand: 50,
    hasFab: false,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Guaranteed Addition of ₹50 per ₹1,000 Basic Sum Assured accrues at the end of every policy year throughout the Policy Term.',
    deathBenefitDescription: '125% of Basic Sum Assured + Accrued Guaranteed Additions (@ ₹50 per ₹1,000 SA per year).',
    maturityBenefitDescription: '100% Basic Sum Assured + Total Guaranteed Additions (@ ₹50 per ₹1,000 SA × Policy Term).',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 20,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 125000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.5 },
      { minSa: 1000000, rebatePerThousand: 2.5 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 18,
      ratePerThousand: 82.50,
      ageSlope: 0.48,
      termSlope: -2.10,
    },
  },
  {
    id: 'dhan-rekha-863',
    planNo: '863 (763)',
    uin: '512N343V02',
    name: 'LIC Dhan Rekha',
    tagline: 'Half-PPT Guaranteed Addition Money-Back Plan with periodic survival payouts & zero deduction from maturity',
    category: 'Money Back',
    minAge: 8,
    maxAge: 55,
    minTerm: 20,
    maxTerm: 40,
    fixedTerms: [20, 30, 40],
    pptRule: 'fixed_map',
    pptMap: {
      20: 10,
      30: 15,
      40: 20,
    },
    minSumAssured: 200000,
    saMultiple: 25000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 50,
      midTerm: 55,
      longTerm: 60,
    },
    guaranteedAdditionPerThousand: 55,
    hasFab: false,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Periodic Money-Back payouts (10%/15%/20% of Basic SA) during second half of term PLUS 100% Basic SA paid at maturity without deducting survival benefits.',
    deathBenefitDescription: '125% of Basic Sum Assured + Accrued Guaranteed Additions.',
    maturityBenefitDescription: 'Full 100% Basic Sum Assured + Accrued Guaranteed Additions (Survival payouts already paid are bonus on top!).',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 20,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 200000, rebatePerThousand: 0 },
      { minSa: 500000, rebatePerThousand: 1.5 },
      { minSa: 1000000, rebatePerThousand: 2.5 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 20,
      ratePerThousand: 96.40,
      ageSlope: 0.45,
      termSlope: -1.90,
    },
  },
  {
    id: 'aadhaar-stambh-943',
    planNo: '943 / 944',
    uin: '512N310V03',
    name: 'LIC Aadhaar Stambh & Shila',
    tagline: 'Low-Ticket High-ROI Endowment Plan for Aadhaar Cardholders with Loyalty Additions & Auto Cover',
    category: 'Endowment',
    minAge: 8,
    maxAge: 55,
    minTerm: 10,
    maxTerm: 20,
    pptRule: 'equal_to_term',
    minSumAssured: 75000,
    saMultiple: 5000,
    gstType: 'endowment',
    defaultBonusPerThousand: {
      shortTerm: 38,
      midTerm: 42,
      longTerm: 44,
    },
    hasFab: true,
    wholeLifeCoverAfterMaturity: false,
    survivalBenefitDescription: 'Includes Auto Risk Cover after 3 full years of premium payment plus Loyalty Additions on maturity.',
    deathBenefitDescription: '100% Basic Sum Assured + Loyalty Additions + Auto Cover Period Protection.',
    maturityBenefitDescription: 'Basic Sum Assured + Loyalty Additions at end of 10–20 year Policy Term.',
    loanAvailableAfterYears: 2,
    taxSection80C: true,
    taxSection10_10D: true,
    commissionFirstYearPct: 25,
    commissionBonusPct: 40,
    commissionYear2To3Pct: 7.5,
    commissionYear4PlusPct: 5,
    hsaSlabs: [
      { minSa: 75000, rebatePerThousand: 0 },
      { minSa: 200000, rebatePerThousand: 1.5 },
    ],
    baseRateAnchor: {
      refAge: 30,
      refTerm: 20,
      ratePerThousand: 42.80,
      ageSlope: 0.40,
      termSlope: -1.65,
    },
  },
];

export interface LicCalculationInput {
  clientName: string;
  clientPhone: string;
  planId: string;
  entryAge: number;
  policyTerm: number;
  ppt: number;
  sumAssured: number;
  paymentMode: PaymentMode;
  addbRider: boolean;
  termRider: boolean;
  criticalIllnessRider: boolean;
  pwbRider: boolean;
  proposerAge: number;
  customBonusRatePerThousand?: number; // Allows agent to adjust assumed bonus rate
}

export interface YearlyScheduleRow {
  policyYear: number;
  age: number;
  annualPremiumWithGst: number;
  cumulativePremiumPaid: number;
  annualBonusOrGaAccrued: number;
  cumulativeBonusOrGa: number;
  survivalOrMoneyBackPayout: number;
  normalRiskCover: number;
  accidentalRiskCover: number;
  surrenderValue: number;
  loanEligibility: number;
}

export interface LicActuarialResult {
  plan: LicPlanDefinition;
  input: LicCalculationInput;
  effectivePolicyTerm: number;
  effectivePpt: number;
  tabularRatePerThousand: number;
  modeRebatePct: number;
  modeRebatePerThousand: number;
  hsaRebatePerThousand: number;
  netBaseRatePerThousand: number;
  annualBasePremiumExclGst: number;
  addbRiderAnnualPremium: number;
  termRiderAnnualPremium: number;
  criticalIllnessAnnualPremium: number;
  pwbRiderAnnualPremium: number;
  totalAnnualRidersExclGst: number;
  totalAnnualPremiumExclGst: number;
  modalInstallmentExclGst: number;
  firstYearGstRatePct: number;
  subsequentYearGstRatePct: number;
  firstYearModalGst: number;
  firstYearModalPremiumInclGst: number;
  subsequentYearModalGst: number;
  subsequentYearModalPremiumInclGst: number;
  firstYearAnnualizedInclGst: number;
  subsequentYearAnnualizedInclGst: number;
  dailySavingEquivalentYear1: number;
  totalPremiumPaidOverPptInclGst: number;
  bonusRatePerThousandUsed: number;
  fabRatePerThousandUsed: number;
  annualBonusOrGaAmount: number;
  totalBonusOrGaAtMaturity: number;
  fabAmountAtMaturity: number;
  totalSurvivalMoneyBackReceived: number;
  maturityPayoutAtEndOfTerm: number;
  totalValueDelivered: number; // Maturity + Cumulative Survival Payouts
  netGainOverPremiums: number;
  estimatedIrrPct: number;
  agentFirstYearBaseCommission: number;
  agentFirstYearBonusCommission: number;
  agentFirstYearTotalCommission: number;
  agentRenewalCommissionTotal: number;
  agentLifetimeCommission: number;
  schedule: YearlyScheduleRow[];
}

/**
 * Calculates Final Additional Bonus (FAB) rate per ₹1,000 SA based on LIC historical FAB tables
 */
export function getFabRatePerThousand(plan: LicPlanDefinition, policyTerm: number, sumAssured: number): number {
  if (!plan.hasFab || policyTerm < 15) return 0;
  const termExcess = Math.max(0, policyTerm - 15);
  // Base FAB starts at ₹20/1000 at 15 yrs and scales quadratically for 20, 25, 30, 35 yrs
  let baseFab = 20 + termExcess * 12 + Math.pow(termExcess, 1.55) * 4.5;
  if (sumAssured >= 500000) baseFab += 10;
  if (sumAssured >= 1000000) baseFab += 15;
  return Math.round(baseFab);
}

/**
 * Exact 7-Step LIC Actuarial Calculation Engine
 */
export function calculateLicActuarial(input: LicCalculationInput): LicActuarialResult {
  const plan = LIC_PLANS.find((p) => p.id === input.planId) || LIC_PLANS[0];

  // Clamp age and term within valid plan rules
  const age = Math.max(plan.minAge, Math.min(plan.maxAge, input.entryAge));

  let effectivePolicyTerm = input.policyTerm;
  let effectivePpt = input.ppt;

  if (plan.pptRule === 'whole_life_100') {
    effectivePolicyTerm = Math.max(15, 100 - age);
    const validPpts = plan.pptOptions || [15, 20, 25, 30];
    effectivePpt = validPpts.includes(input.ppt) ? input.ppt : validPpts[0];
    if (age + effectivePpt > 75) {
      effectivePpt = validPpts.filter((p) => age + p <= 75).pop() || validPpts[0];
    }
  } else if (plan.pptRule === 'fixed_map' && plan.pptMap) {
    const allowedTerms = Object.keys(plan.pptMap).map(Number);
    if (!allowedTerms.includes(effectivePolicyTerm)) {
      effectivePolicyTerm = allowedTerms[1] || allowedTerms[0];
    }
    effectivePpt = plan.pptMap[effectivePolicyTerm];
  } else if (plan.id === 'jeevan-tarun-734') {
    // Jeevan Tarun: Policy Term = 25 - Entry Age, PPT = 20 - Entry Age
    effectivePolicyTerm = Math.max(13, 25 - age);
    effectivePpt = Math.max(8, 20 - age);
  } else if (plan.id === 'bima-jyoti-760') {
    // Bima Jyoti: PPT = Policy Term - 5 years
    effectivePolicyTerm = Math.max(plan.minTerm, Math.min(plan.maxTerm, effectivePolicyTerm));
    effectivePpt = Math.max(10, effectivePolicyTerm - 5);
  } else if (plan.pptRule === 'term_minus_3') {
    effectivePolicyTerm = Math.max(plan.minTerm, Math.min(plan.maxTerm, effectivePolicyTerm));
    effectivePpt = effectivePolicyTerm - 3;
  } else if (plan.pptRule === 'custom_options' && plan.pptOptions) {
    effectivePolicyTerm = Math.max(plan.minTerm, Math.min(plan.maxTerm, effectivePolicyTerm));
    effectivePpt = plan.pptOptions.includes(input.ppt) ? input.ppt : plan.pptOptions[0];
  } else if (plan.pptRule === 'single') {
    effectivePolicyTerm = Math.max(plan.minTerm, Math.min(plan.maxTerm, effectivePolicyTerm));
    effectivePpt = 1;
  } else {
    effectivePolicyTerm = Math.max(plan.minTerm, Math.min(plan.maxTerm, effectivePolicyTerm));
    effectivePpt = effectivePolicyTerm;
  }

  const sa = Math.max(plan.minSumAssured, input.sumAssured);
  const saUnits = sa / 1000;

  // Step 1: Tabular Rate Lookup per ₹1,000 SA
  const { refAge, refTerm, ratePerThousand, ageSlope, termSlope } = plan.baseRateAnchor;
  const termVariableForRate = plan.pptRule === 'whole_life_100' || plan.pptRule === 'custom_options'
    ? effectivePpt
    : effectivePolicyTerm;

  const ageDelta = age - refAge;
  const termDelta = termVariableForRate - refTerm;

  // Non-linear mortality curvature for higher ages + term discounting
  const mortalityCurveAdjustment = age > 35 ? Math.pow(age - 35, 1.45) * 0.18 : 0;
  const termInverseFactor =
    plan.id !== 'jeevan-amar-955' && plan.id !== 'money-back-20-720' && plan.id !== 'money-back-25-721'
      ? (1000 / Math.max(5, termVariableForRate)) - (1000 / refTerm)
      : 0;

  let rawTabularRate =
    ratePerThousand +
    ageDelta * ageSlope +
    termDelta * (termSlope * 0.35) +
    termInverseFactor * 0.52 +
    mortalityCurveAdjustment;

  if (plan.id === 'jeevan-amar-955') {
    // Pure term rate formula
    rawTabularRate = Math.max(1.15, 1.92 + ageDelta * 0.14 + Math.max(0, age - 35) * 0.19 + termDelta * 0.035);
  }

  const tabularRatePerThousand = Number(Math.max(1.1, rawTabularRate).toFixed(2));

  // Step 2: Mode Rebate
  const effectiveMode: PaymentMode = plan.pptRule === 'single' ? 'Single' : input.paymentMode;
  let modeRebatePct = 0;
  if (effectiveMode === 'Yearly') modeRebatePct = 2.0;
  else if (effectiveMode === 'Half-Yearly') modeRebatePct = 1.0;

  const modeRebatePerThousand = Number(((tabularRatePerThousand * modeRebatePct) / 100).toFixed(2));

  // Step 3: High Sum Assured (HSA) Rebate per ₹1,000 SA
  let hsaRebatePerThousand = 0;
  for (const slab of plan.hsaSlabs) {
    if (sa >= slab.minSa) {
      hsaRebatePerThousand = slab.rebatePerThousand;
    }
  }

  // Step 4: Net Base Rate & Annual Base Premium
  const netBaseRatePerThousand = Number(
    Math.max(0.85, tabularRatePerThousand - modeRebatePerThousand - hsaRebatePerThousand).toFixed(2)
  );
  const annualBasePremiumExclGst = Math.round(saUnits * netBaseRatePerThousand);

  // Step 5: Riders Calculation
  const riderSaUnits = Math.min(sa, 10000000) / 1000; // ADDB & Term Riders capped at ₹1 Crore or Basic SA
  const isChildAge = age < 18;

  const addbRiderAnnualPremium =
    input.addbRider && !isChildAge && plan.pptRule !== 'single'
      ? Math.round(riderSaUnits * (effectivePpt < effectivePolicyTerm ? 1.2 : 1.0))
      : 0;

  const termRiderRatePerThousand = Math.max(1.4, 2.1 + (age - 25) * 0.16);
  const termRiderAnnualPremium =
    input.termRider && !isChildAge && plan.id !== 'jeevan-amar-955' && plan.pptRule !== 'single'
      ? Math.round((Math.min(sa, 2500000) / 1000) * termRiderRatePerThousand)
      : 0;

  const ciRiderRatePerThousand = Math.max(1.8, 2.85 + (age - 25) * 0.24);
  const criticalIllnessAnnualPremium =
    input.criticalIllnessRider && !isChildAge && plan.pptRule !== 'single'
      ? Math.round((Math.min(sa, 2500000) / 1000) * ciRiderRatePerThousand)
      : 0;

  const pwbPct = Math.max(1.8, 2.2 + (input.proposerAge - 30) * 0.15);
  const pwbRiderAnnualPremium =
    input.pwbRider && plan.pptRule !== 'single'
      ? Math.round((annualBasePremiumExclGst * pwbPct) / 100)
      : 0;

  const totalAnnualRidersExclGst =
    addbRiderAnnualPremium + termRiderAnnualPremium + criticalIllnessAnnualPremium + pwbRiderAnnualPremium;

  const totalAnnualPremiumExclGst = annualBasePremiumExclGst + totalAnnualRidersExclGst;

  // Step 6: Modal Installment Conversion
  let installmentsPerYear = 1;
  if (effectiveMode === 'Half-Yearly') installmentsPerYear = 2;
  else if (effectiveMode === 'Quarterly') installmentsPerYear = 4;
  else if (effectiveMode === 'Monthly (NACH)') installmentsPerYear = 12;

  const modalInstallmentExclGst = Math.round(totalAnnualPremiumExclGst / installmentsPerYear);

  // Step 7: GST Calculation (1st Year vs Subsequent Years)
  let firstYearGstRatePct = 4.5;
  let subsequentYearGstRatePct = 2.25;
  if (plan.gstType === 'term') {
    firstYearGstRatePct = 18.0;
    subsequentYearGstRatePct = 18.0;
  } else if (plan.gstType === 'single') {
    firstYearGstRatePct = 4.5;
    subsequentYearGstRatePct = 0;
  }

  const firstYearModalGst = Math.round((modalInstallmentExclGst * firstYearGstRatePct) / 100);
  const firstYearModalPremiumInclGst = modalInstallmentExclGst + firstYearModalGst;

  const subsequentYearModalGst =
    plan.gstType === 'single' ? 0 : Math.round((modalInstallmentExclGst * subsequentYearGstRatePct) / 100);
  const subsequentYearModalPremiumInclGst =
    plan.gstType === 'single' ? 0 : modalInstallmentExclGst + subsequentYearModalGst;

  const firstYearAnnualizedInclGst = firstYearModalPremiumInclGst * installmentsPerYear;
  const subsequentYearAnnualizedInclGst = subsequentYearModalPremiumInclGst * installmentsPerYear;

  const dailySavingEquivalentYear1 = Math.round(firstYearAnnualizedInclGst / 365);

  const totalPremiumPaidOverPptInclGst =
    plan.gstType === 'single'
      ? firstYearAnnualizedInclGst
      : firstYearAnnualizedInclGst + subsequentYearAnnualizedInclGst * Math.max(0, effectivePpt - 1);

  // Step 8: Bonus / Guaranteed Additions & FAB Projections
  let defaultBonusRate = plan.defaultBonusPerThousand.midTerm;
  if (effectivePolicyTerm <= 15) defaultBonusRate = plan.defaultBonusPerThousand.shortTerm;
  else if (effectivePolicyTerm >= 21) defaultBonusRate = plan.defaultBonusPerThousand.longTerm;

  const bonusRatePerThousandUsed =
    plan.guaranteedAdditionPerThousand !== undefined
      ? plan.guaranteedAdditionPerThousand
      : input.customBonusRatePerThousand !== undefined
      ? input.customBonusRatePerThousand
      : defaultBonusRate;

  const fabRatePerThousandUsed = getFabRatePerThousand(plan, effectivePolicyTerm, sa);

  const annualBonusOrGaAmount = Math.round(saUnits * bonusRatePerThousandUsed);
  const fabAmountAtMaturity = Math.round(saUnits * fabRatePerThousandUsed);

  // Build Year-by-Year Schedule
  const schedule: YearlyScheduleRow[] = [];
  let cumulativePremium = 0;
  let cumulativeBonusOrGa = 0;
  let totalSurvivalMoneyBackReceived = 0;

  // For Whole Life plans (Umang/Utsav), schedule runs up to age 100 (or min 35 rows)
  const scheduleHorizon =
    plan.pptRule === 'whole_life_100'
      ? Math.min(50, 100 - age) // Show up to 50 policy years or age 100
      : plan.wholeLifeCoverAfterMaturity
      ? Math.min(effectivePolicyTerm + 10, 100 - age) // Show 10 post-maturity whole life cover years for Jeevan Anand
      : effectivePolicyTerm;

  for (let yr = 1; yr <= scheduleHorizon; yr++) {
    const currentAge = age + yr;
    const isPayingYear = yr <= effectivePpt;
    const annualPrem = isPayingYear
      ? yr === 1
        ? firstYearAnnualizedInclGst
        : subsequentYearAnnualizedInclGst
      : 0;
    cumulativePremium += annualPrem;

    // Bonus / GA accrual logic
    let yrBonus = 0;
    if (plan.id === 'jeevan-utsav-771') {
      // Jeevan Utsav accrues ₹40/1000 GA strictly during PPT
      yrBonus = yr <= effectivePpt ? annualBonusOrGaAmount : 0;
    } else if (plan.id === 'jeevan-umang-745') {
      // Jeevan Umang accrues higher reversionary bonus during PPT, and differential bonus after PPT
      yrBonus = yr <= effectivePpt ? annualBonusOrGaAmount : Math.round(annualBonusOrGaAmount * 0.45);
    } else if (plan.id === 'jeevan-anand-715') {
      yrBonus = yr <= effectivePolicyTerm ? annualBonusOrGaAmount : 0;
    } else {
      yrBonus = yr <= effectivePolicyTerm ? annualBonusOrGaAmount : 0;
    }
    cumulativeBonusOrGa += yrBonus;

    // Survival / Money Back / Guaranteed Income Payout
    let survivalPayout = 0;
    if (plan.id === 'money-back-20-720') {
      if (yr === 5 || yr === 10 || yr === 15) survivalPayout = Math.round(sa * 0.2);
      else if (yr === 20) survivalPayout = Math.round(sa * 0.4) + cumulativeBonusOrGa + fabAmountAtMaturity;
    } else if (plan.id === 'money-back-25-721') {
      if (yr === 5 || yr === 10 || yr === 15 || yr === 20) survivalPayout = Math.round(sa * 0.15);
      else if (yr === 25) survivalPayout = Math.round(sa * 0.4) + cumulativeBonusOrGa + fabAmountAtMaturity;
    } else if (plan.id === 'jeevan-umang-745') {
      if (yr >= effectivePpt && yr < scheduleHorizon) {
        survivalPayout = Math.round(sa * 0.08);
      } else if (yr === scheduleHorizon) {
        survivalPayout = sa + cumulativeBonusOrGa + fabAmountAtMaturity;
      }
    } else if (plan.id === 'jeevan-utsav-771') {
      const incomeStartYear = Math.max(effectivePpt + 3, 11);
      if (yr >= incomeStartYear) {
        survivalPayout = Math.round(sa * 0.1);
      }
    } else if (plan.id === 'jeevan-tarun-734') {
      // Jeevan Tarun Option 3: 10% of SA at child ages 20, 21, 22, 23, 24 + 50% SA + Full Bonus + FAB at age 25
      if (currentAge >= 20 && currentAge <= 24 && yr < effectivePolicyTerm) {
        survivalPayout = Math.round(sa * 0.1);
      } else if (yr === effectivePolicyTerm) {
        survivalPayout = Math.round(sa * 0.5) + cumulativeBonusOrGa + fabAmountAtMaturity;
      }
    } else if (plan.id === 'dhan-rekha-863') {
      if (yr === 10 || yr === 15) {
        survivalPayout = Math.round(sa * 0.1);
      } else if (yr === effectivePolicyTerm) {
        survivalPayout = sa + cumulativeBonusOrGa;
      }
    } else if (plan.id === 'jeevan-anand-715') {
      if (yr === effectivePolicyTerm) {
        survivalPayout = sa + cumulativeBonusOrGa + fabAmountAtMaturity;
      }
    } else if (plan.id !== 'jeevan-amar-955') {
      if (yr === effectivePolicyTerm) {
        survivalPayout = sa + cumulativeBonusOrGa + fabAmountAtMaturity;
      }
    }

    if (yr < effectivePolicyTerm || plan.pptRule === 'whole_life_100') {
      if (
        (plan.id === 'money-back-20-720' && yr < 20) ||
        (plan.id === 'money-back-25-721' && yr < 25) ||
        (plan.id === 'jeevan-tarun-734' && yr < effectivePolicyTerm) ||
        (plan.id === 'dhan-rekha-863' && yr < effectivePolicyTerm) ||
        (plan.id === 'jeevan-umang-745' && yr < scheduleHorizon) ||
        plan.id === 'jeevan-utsav-771'
      ) {
        totalSurvivalMoneyBackReceived += survivalPayout;
      }
    }

    // Normal & Accidental Risk Cover
    let normalRiskCover = 0;
    if (plan.id === 'jeevan-anand-715') {
      if (yr <= effectivePolicyTerm) {
        normalRiskCover = Math.round(sa * 1.25) + cumulativeBonusOrGa + (yr >= 15 ? fabAmountAtMaturity : 0);
      } else {
        // Free Whole Life Risk Cover of 100% Basic SA continues after maturity!
        normalRiskCover = sa;
      }
    } else if (plan.id === 'money-back-20-720' || plan.id === 'money-back-25-721' || plan.id === 'single-premium-endowment-717') {
      normalRiskCover = Math.round(sa * 1.25) + cumulativeBonusOrGa + (yr >= 15 ? fabAmountAtMaturity : 0);
    } else if (plan.id === 'jeevan-lakshya-733') {
      // Jeevan Lakshya includes 110% SA + Bonus + PV of 10% annual income stream
      const remainingYears = Math.max(0, effectivePolicyTerm - yr);
      normalRiskCover = Math.round(sa * 1.1) + Math.round(sa * 0.1 * remainingYears) + cumulativeBonusOrGa;
    } else if (plan.id === 'jeevan-amar-955') {
      normalRiskCover = sa;
    } else {
      normalRiskCover = sa + cumulativeBonusOrGa + (yr >= 15 ? fabAmountAtMaturity : 0);
    }

    const riderDeathBoost =
      (input.addbRider && yr <= effectivePolicyTerm ? Math.min(sa, 10000000) : 0) +
      (input.termRider && yr <= effectivePolicyTerm ? Math.min(sa, 2500000) : 0);
    const accidentalRiskCover = normalRiskCover + riderDeathBoost;

    // Surrender Value (GSV / SSV) & Policy Loan Eligibility (90% of SV)
    let surrenderValue = 0;
    if (plan.loanAvailableAfterYears > 0 && yr >= plan.loanAvailableAfterYears && yr <= effectivePolicyTerm) {
      const durationFactor = Math.min(0.92, 0.3 + (yr / effectivePolicyTerm) * 0.62);
      const bonusSvFactor = Math.min(0.35, 0.15 + (yr / effectivePolicyTerm) * 0.2);
      surrenderValue = Math.round(cumulativePremium * 0.955 * durationFactor + cumulativeBonusOrGa * bonusSvFactor);
    }
    const loanEligibility = Math.round(surrenderValue * 0.9);

    schedule.push({
      policyYear: yr,
      age: currentAge,
      annualPremiumWithGst: annualPrem,
      cumulativePremiumPaid: cumulativePremium,
      annualBonusOrGaAccrued: yrBonus,
      cumulativeBonusOrGa,
      survivalOrMoneyBackPayout: survivalPayout,
      normalRiskCover,
      accidentalRiskCover,
      surrenderValue,
      loanEligibility,
    });
  }

  // Maturity summary figures
  const totalBonusOrGaAtMaturity =
    plan.pptRule === 'whole_life_100'
      ? schedule[schedule.length - 1]?.cumulativeBonusOrGa || annualBonusOrGaAmount * effectivePpt
      : annualBonusOrGaAmount * effectivePolicyTerm;

  let maturityPayoutAtEndOfTerm = 0;
  if (plan.id === 'jeevan-amar-955') {
    maturityPayoutAtEndOfTerm = 0;
  } else if (plan.id === 'money-back-20-720' || plan.id === 'money-back-25-721') {
    maturityPayoutAtEndOfTerm = Math.round(sa * 0.4) + totalBonusOrGaAtMaturity + fabAmountAtMaturity;
  } else if (plan.id === 'jeevan-tarun-734') {
    maturityPayoutAtEndOfTerm = Math.round(sa * 0.5) + totalBonusOrGaAtMaturity + fabAmountAtMaturity;
  } else {
    maturityPayoutAtEndOfTerm = sa + totalBonusOrGaAtMaturity + fabAmountAtMaturity;
  }

  const totalValueDelivered =
    maturityPayoutAtEndOfTerm +
    totalSurvivalMoneyBackReceived +
    (plan.id === 'jeevan-anand-715' ? sa : 0); // Includes post-maturity whole-life cover value

  const netGainOverPremiums = Math.max(0, totalValueDelivered - totalPremiumPaidOverPptInclGst);

  // Approximate IRR %
  const avgDurationYears = Math.max(5, effectivePolicyTerm - effectivePpt * 0.42);
  const growthRatio = Math.max(1, totalValueDelivered / Math.max(1, totalPremiumPaidOverPptInclGst));
  const estimatedIrrPct =
    plan.id === 'jeevan-amar-955'
      ? 0
      : Number(((Math.pow(growthRatio, 1 / avgDurationYears) - 1) * 100).toFixed(2));

  // Agent Commission Calculation
  const agentFirstYearBaseCommission = Math.round((annualBasePremiumExclGst * plan.commissionFirstYearPct) / 100);
  const agentFirstYearBonusCommission = Math.round((agentFirstYearBaseCommission * plan.commissionBonusPct) / 100);
  const agentFirstYearTotalCommission = agentFirstYearBaseCommission + agentFirstYearBonusCommission;

  const yr2To3Count = Math.max(0, Math.min(2, effectivePpt - 1));
  const yr4PlusCount = Math.max(0, effectivePpt - 3);
  const agentRenewalCommissionTotal =
    Math.round((annualBasePremiumExclGst * plan.commissionYear2To3Pct) / 100) * yr2To3Count +
    Math.round((annualBasePremiumExclGst * plan.commissionYear4PlusPct) / 100) * yr4PlusCount;

  const agentLifetimeCommission = agentFirstYearTotalCommission + agentRenewalCommissionTotal;

  return {
    plan,
    input: {
      ...input,
      entryAge: age,
      policyTerm: effectivePolicyTerm,
      ppt: effectivePpt,
      sumAssured: sa,
      paymentMode: effectiveMode,
    },
    effectivePolicyTerm,
    effectivePpt,
    tabularRatePerThousand,
    modeRebatePct,
    modeRebatePerThousand,
    hsaRebatePerThousand,
    netBaseRatePerThousand,
    annualBasePremiumExclGst,
    addbRiderAnnualPremium,
    termRiderAnnualPremium,
    criticalIllnessAnnualPremium,
    pwbRiderAnnualPremium,
    totalAnnualRidersExclGst,
    totalAnnualPremiumExclGst,
    modalInstallmentExclGst,
    firstYearGstRatePct,
    subsequentYearGstRatePct,
    firstYearModalGst,
    firstYearModalPremiumInclGst,
    subsequentYearModalGst,
    subsequentYearModalPremiumInclGst,
    firstYearAnnualizedInclGst,
    subsequentYearAnnualizedInclGst,
    dailySavingEquivalentYear1,
    totalPremiumPaidOverPptInclGst,
    bonusRatePerThousandUsed,
    fabRatePerThousandUsed,
    annualBonusOrGaAmount,
    totalBonusOrGaAtMaturity,
    fabAmountAtMaturity,
    totalSurvivalMoneyBackReceived,
    maturityPayoutAtEndOfTerm,
    totalValueDelivered,
    netGainOverPremiums,
    estimatedIrrPct,
    agentFirstYearBaseCommission,
    agentFirstYearBonusCommission,
    agentFirstYearTotalCommission,
    agentRenewalCommissionTotal,
    agentLifetimeCommission,
    schedule,
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatInrCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  return formatInr(amount);
}
