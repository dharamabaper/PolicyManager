import {
  LIC_PLANS,
  calculateLicActuarial,
  formatInr,
  formatInrCompact,
} from '../data/licPlans';
import {
  CustomerPolicyRecord,
  buildPolicyNotifications,
} from './policyService';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  source?: string;
}

export const QUICK_AGENT_AI_PROMPTS = [
  {
    label: 'Jeevan Tarun (734) Child Plan',
    prompt:
      'Explain LIC Jeevan Tarun (Plan 734) eligibility, 4 survival benefit options from age 20 to 24, and give a sample illustration for a 5-year-old child with ₹10 Lakh Sum Assured.',
  },
  {
    label: 'Labh (736) vs Umang (745)',
    prompt:
      'Compare LIC Jeevan Labh (Plan 736) vs LIC Jeevan Umang (Plan 745) for a 32-year-old customer with ₹10 Lakh Sum Assured. Which is better for lump-sum vs 8% pension?',
  },
  {
    label: '₹10L Jeevan Anand Quote',
    prompt:
      'Calculate the exact 1st year premium, 2nd year premium, vested bonus, FAB, and total maturity for LIC New Jeevan Anand (Plan 715) for age 30, term 21 years, Sum Assured ₹10,00,000 with AD-DB rider.',
  },
  {
    label: 'Hindi WhatsApp Pitch (Utsav 771)',
    prompt:
      'Write a persuasive Hindi / Hinglish and English WhatsApp message for LIC Jeevan Utsav (Plan 771) highlighting ₹40/1000 Guaranteed Additions and 10% Lifetime Guaranteed Tax-Free Income.',
  },
  {
    label: 'Loan & Surrender Rules 2024',
    prompt:
      'What are the latest IRDAI 2024/2026 rules for LIC policy surrender value, paid-up value, revival of lapsed policy, and policy loan eligibility?',
  },
  {
    label: 'Mutual Fund vs LIC Objection',
    prompt:
      'A customer says "Mutual SIP gives 12-15%, why should I buy LIC?". Give me 5 strong points with Section 10(10D) tax-free guarantee, sovereign guarantee, and life risk cover to convince them.',
  },
  {
    label: 'My Policy Book & Alerts Summary',
    prompt:
      'Analyze my active customer policies, upcoming renewal dues, maturity alerts, and customer birthdays, and tell me whom I should contact today.',
  },
];

/**
 * Generates an accurate, detailed LIC actuarial answer locally when offline or if API key is not configured
 */
export function generateLocalLicActuarialAnswer(
  query: string,
  agentName: string,
  agencyCode: string,
  policies: CustomerPolicyRecord[]
): string {
  const q = query.toLowerCase();
  const notifications = buildPolicyNotifications(policies);

  // Extract custom age or sum assured from query if mentioned
  const saMatch = q.match(/(\d+)\s*(lakh|lac|l\b)/i);
  const parsedSa = saMatch ? Number(saMatch[1]) * 100000 : 1000000;
  const ageMatch = q.match(/age\s*(\d{1,2})/i) || q.match(/(\d{1,2})\s*year\s*old/i);
  const parsedAge = ageMatch ? Number(ageMatch[1]) : 30;

  // 1. Portfolio / Renewals / Birthdays query
  if (
    q.includes('my active customer') ||
    q.includes('my policy book') ||
    q.includes('whom i should contact') ||
    q.includes('due renewal')
  ) {
    const totalSa = policies.reduce((acc, p) => acc + p.sumAssured, 0);
    const totalPrem = policies.reduce((acc, p) => acc + p.premiumAmount, 0);
    const urgentAlerts = notifications.slice(0, 5);

    return [
      `### 📊 Portfolio Intelligence Summary for ${agentName} (Code: ${agencyCode})`,
      ``,
      `• **Total Active Policies in Book:** ${policies.length} Policies`,
      `• **Total Sum Assured Under Management:** ${formatInr(totalSa)} (${formatInrCompact(totalSa)})`,
      `• **Annualized Premium Collection Book:** ${formatInr(totalPrem)}`,
      `• **Pending Renewal & Maturity Alerts:** ${notifications.length} Alerts`,
      ``,
      urgentAlerts.length > 0
        ? `#### 🔔 Top Priority Customers to Contact Today:\n` +
          urgentAlerts
            .map(
              (n, idx) =>
                `${idx + 1}. **${n.policy.customerName}** (Policy \`#${n.policy.policyNumber}\` — ${n.policy.planName})\n   • **Status:** ${n.badgeText} on \`${n.dueDate}\` · Installment: **${formatInr(n.amount)}**\n   • **Mobile:** ${n.policy.customerMobile}`
            )
            .join('\n\n')
        : `✅ All customer policies are currently up to date with no overdue renewals.`,
      ``,
      `💡 **Advisor Action Tip:** Open the **Notifications** or **Birthday Studio** tab to send 1-tap personalized WhatsApp reminders or HD Birthday Greeting Cards.`,
    ].join('\n');
  }

  // 2. Jeevan Tarun (Plan 734 / 934)
  if (q.includes('tarun') || q.includes('734') || q.includes('934') || q.includes('child')) {
    const childAge = Math.min(12, Math.max(0, ageMatch ? parsedAge : 5));
    const calc = calculateLicActuarial({
      clientName: 'Child Policyholder',
      clientPhone: '+91 98201 44510',
      planId: 'jeevan-tarun-734',
      entryAge: childAge,
      policyTerm: 25 - childAge,
      ppt: 20 - childAge,
      sumAssured: parsedSa,
      paymentMode: 'Yearly',
      addbRider: false,
      termRider: false,
      criticalIllnessRider: false,
      pwbRider: true,
      proposerAge: 32,
    });

    return [
      `### 🎓 LIC Jeevan Tarun (Plan No. 734 · Legacy 934) — Complete Advisor Guide`,
      `**Category:** Non-Linked, Participating Child Money-Back & Education Plan`,
      ``,
      `#### 1. Eligibility & Term Structure`,
      `• **Child Entry Age:** 90 Days (0 Yrs) to 12 Years`,
      `• **Policy Term:** \`(25 - Entry Age)\` Years (Matures when child turns 25)`,
      `• **Premium Paying Term (PPT):** \`(20 - Entry Age)\` Years (Pay only till child turns 20)`,
      `• **Minimum Sum Assured:** ₹75,000 (No Upper Limit, in multiples of ₹5,000)`,
      ``,
      `#### 2. Four Flexible Survival Benefit Options (Chosen at Proposal)`,
      `• **Option 1:** No survival payout during ages 20–24 → **100% Sum Assured + Vested Bonus + FAB** at Age 25.`,
      `• **Option 2:** **5% of SA** every year for 5 years (Age 20 to 24) + **75% SA + Bonus + FAB** at Age 25.`,
      `• **Option 3:** **10% of SA** every year for 5 years (Age 20 to 24) + **50% SA + Bonus + FAB** at Age 25.`,
      `• **Option 4:** **15% of SA** every year for 5 years (Age 20 to 24) + **25% SA + Bonus + FAB** at Age 25.`,
      ``,
      `#### 3. Live Actuarial Quote (Child Age: ${childAge} Yrs · Sum Assured: ${formatInr(parsedSa)})`,
      `• **Policy Term:** ${calc.effectivePolicyTerm} Years · **PPT:** ${calc.effectivePpt} Years (incl. PWB Waiver Rider)`,
      `• **1st Year Yearly Premium (incl. 4.5% GST):** **${formatInr(calc.firstYearModalPremiumInclGst)}** (${formatInr(calc.dailySavingEquivalentYear1)}/day)`,
      `• **2nd Year Onwards (incl. 2.25% GST):** **${formatInr(calc.subsequentYearModalPremiumInclGst)}**`,
      `• **Total Premium Invested:** ${formatInr(calc.totalPremiumPaidOverPptInclGst)}`,
      `• **Survival Money-Back (Ages 20–24 @ 10% Option 3):** ${formatInr(calc.totalSurvivalMoneyBackReceived)}`,
      `• **Vested Bonus + FAB at Age 25:** ${formatInr(calc.totalBonusOrGaAtMaturity + calc.fabAmountAtMaturity)}`,
      `• **Total Projected Education & Marriage Benefit:** **${formatInr(calc.totalValueDelivered)}** (Tax-Free u/s 10(10D))`,
      ``,
      `💡 **Pro-Tip:** Always attach **LIC Premium Waiver Benefit (PWB) Rider** so all future premiums are automatically waived if anything happens to the proposing parent.`,
    ].join('\n');
  }

  // 3. Compare Jeevan Labh (736) vs Jeevan Umang (745)
  if ((q.includes('labh') && q.includes('umang')) || q.includes('compare')) {
    const age = Math.min(50, Math.max(18, parsedAge));
    const labh = calculateLicActuarial({
      clientName: 'Valued Client',
      clientPhone: '',
      planId: 'jeevan-labh-736',
      entryAge: age,
      policyTerm: 21,
      ppt: 15,
      sumAssured: parsedSa,
      paymentMode: 'Yearly',
      addbRider: true,
      termRider: false,
      criticalIllnessRider: false,
      pwbRider: false,
      proposerAge: age,
    });
    const umang = calculateLicActuarial({
      clientName: 'Valued Client',
      clientPhone: '',
      planId: 'jeevan-umang-745',
      entryAge: age,
      policyTerm: 100 - age,
      ppt: 15,
      sumAssured: parsedSa,
      paymentMode: 'Yearly',
      addbRider: true,
      termRider: false,
      criticalIllnessRider: false,
      pwbRider: false,
      proposerAge: age,
    });

    return [
      `### ⚖️ Side-by-Side Comparison: Jeevan Labh (736) vs Jeevan Umang (745)`,
      `**Customer Profile:** Age ${age} Yrs · Basic Sum Assured: **${formatInr(parsedSa)}** · PPT: **15 Years**`,
      ``,
      `#### 1. LIC Jeevan Labh (Plan 736 — 21 Yr Term / 15 Yr PPT)`,
      `• **Best For:** High Lump-Sum Wealth Creation (Child Marriage, House, Retirement Corpus)`,
      `• **1st Year Yearly Premium:** **${formatInr(labh.firstYearModalPremiumInclGst)}**`,
      `• **Total Premium Paid in 15 Yrs:** ${formatInr(labh.totalPremiumPaidOverPptInclGst)}`,
      `• **6-Year Premium Holiday:** No premium from Year 16 to Year 21 while full bonus accrues`,
      `• **Lump-Sum Maturity at Year 21:** **${formatInr(labh.totalValueDelivered)}** (Tax-Free u/s 10(10D))`,
      ``,
      `#### 2. LIC Jeevan Umang (Plan 745 — Whole Life to Age 100 / 15 Yr PPT)`,
      `• **Best For:** Lifetime Tax-Free Annual Pension (8% of Sum Assured every year for life)`,
      `• **1st Year Yearly Premium:** **${formatInr(umang.firstYearModalPremiumInclGst)}**`,
      `• **Total Premium Paid in 15 Yrs:** ${formatInr(umang.totalPremiumPaidOverPptInclGst)}`,
      `• **Guaranteed Annual Survival Pension (from Yr 16 to Age 99):** **${formatInr(Math.round(parsedSa * 0.08))} / year**`,
      `• **Total Projected Value (Survival + Age 100 Maturity):** **${formatInr(umang.totalValueDelivered)}**`,
      ``,
      `✅ **Advisor Recommendation by ${agentName}:** Suggest a **50:50 Combo** — half Sum Assured in **Jeevan Labh 736** for a lump-sum milestone at Year 21, and half in **Jeevan Umang 745** for lifetime guaranteed tax-free pension!`,
    ].join('\n');
  }

  // 4. Jeevan Utsav (771) or Hindi Pitch
  if (q.includes('utsav') || q.includes('771') || q.includes('hindi')) {
    const calc = calculateLicActuarial({
      clientName: 'Valued Client',
      clientPhone: '',
      planId: 'jeevan-utsav-771',
      entryAge: 30,
      policyTerm: 35,
      ppt: 12,
      sumAssured: parsedSa,
      paymentMode: 'Yearly',
      addbRider: true,
      termRider: false,
      criticalIllnessRider: false,
      pwbRider: false,
      proposerAge: 30,
    });

    return [
      `### 🌟 LIC Jeevan Utsav (Plan 771) — Ready-to-Share Hindi & English WhatsApp Pitch`,
      ``,
      `#### 📱 WhatsApp Message (Hindi / Hinglish):`,
      `> *🙏 नमस्ते सर/मैडम,*`,
      `> *LIC जीवन उत्सव (Plan 771)* के साथ अपने परिवार के भविष्य को 100% गारंटीड आजीवन पेंशन से सुरक्षित करें!`,
      `> `,
      `> ✅ *बीमा धन (Sum Assured):* ${formatInr(parsedSa)}`,
      `> ✅ *प्रीमियम भुगतान अवधि (PPT):* केवल 12 वर्ष (${formatInr(calc.firstYearModalPremiumInclGst)}/वर्ष)`,
      `> ✅ *गारंटीड एडिशन:* प्रीमियम अवधि के दौरान हर साल ₹40 प्रति ₹1,000 SA (कुल ${formatInr(calc.totalBonusOrGaAtMaturity)} गारंटीड बोनस)`,
      `> ✅ *आजीवन गारंटीड पेंशन:* 15वें वर्ष से जीवन भर **${formatInr(Math.round(parsedSa * 0.1))} प्रति वर्ष (10% of SA)** टैक्स-फ्री इनकम!`,
      `> ✅ *आजीवन रिस्क कवर + लोन सुविधा + धारा 80C एवं 10(10D) टैक्स छूट।*`,
      `> `,
      `> 📞 अधिक जानकारी के लिए संपर्क करें:`,
      `> *${agentName}* (Senior Consultant · LIC Code: ${agencyCode})`,
      ``,
      `#### 📊 Key Actuarial Highlights (Plan 771):`,
      `• **PPT Options:** 5 to 16 Years (Deferment period before lifetime 10% income begins)`,
      `• **Guaranteed Additions:** ₹40 per ₹1,000 Basic Sum Assured during every year of PPT`,
      `• **Flexi Income Option:** Customer can accumulate the 10% annual payouts with LIC at **5.5% p.a. compounding interest** and withdraw anytime!`,
    ].join('\n');
  }

  // 5. Loan, Surrender Value & Revival Rules (IRDAI 2024/2026)
  if (q.includes('surrender') || q.includes('loan') || q.includes('paid-up') || q.includes('irdai')) {
    return [
      `### 🏛️ LIC Policy Loan, Surrender Value & Paid-Up Rules (IRDAI 2024–2026 Revised)`,
      ``,
      `#### 1. Special Surrender Value (SSV) & Paid-Up Rules`,
      `• **After 1 Full Policy Year (New IRDAI 2024 Mandate):** Policies issued under revised 2024 UINs acquire a Special Surrender Value after completion of **1 full policy year** provided 1 full year's premium has been paid.`,
      `• **Guaranteed Surrender Value (GSV):** Acquires after **2 full policy years** of premiums paid:\n  - Years 2–3: **30%** of total premiums paid (excl. GST & rider premiums)\n  - Years 4–7: **50%** of total premiums paid\n  - Last 2 policy years: Up to **90%** of total premiums paid + Surrender Value factor of Vested Bonus.`,
      `• **Paid-Up Policy Formula:**\n  \`Paid-Up Sum Assured = Basic Sum Assured × (No. of Premiums Paid ÷ Total Premiums Payable)\`\n  Existing vested bonuses remain attached in full; policy stops earning future reversionary bonuses.`,
      ``,
      `#### 2. LIC Policy Loan Eligibility`,
      `• **In-Force Policies:** Up to **90% of Surrender Value**`,
      `• **Paid-Up Policies:** Up to **85% of Surrender Value**`,
      `• **Current Interest Rate:** ~9.5% p.a. payable half-yearly (No EMI burden; principal can be repaid anytime or adjusted at maturity).`,
      ``,
      `#### 3. Revival of Lapsed Policies`,
      `• Can be revived within **5 consecutive years** from the date of first unpaid premium (FUP) by paying arrears + late fee (often discounted up to 30%–100% during LIC Special Revival Campaigns).`,
    ].join('\n');
  }

  // 6. Mutual Fund vs LIC Objection Handling
  if (q.includes('mutual fund') || q.includes('sip') || q.includes('objection') || q.includes('why lic')) {
    return [
      `### 🛡️ 5 Winning Points to Handle "Mutual Fund SIP vs LIC" Customer Objection`,
      ``,
      `1. **Day-1 Family Protection (Zero Market Risk):**\n   • If a customer starts a ₹5,000/month SIP and an unfortunate event occurs in Month 6, the family only receives ~₹30,000. In LIC, the family immediately receives **100% Sum Assured (₹10 Lakh – ₹20 Lakh in Accidental Cover) from Day 1**!`,
      `2. **Sovereign Guarantee under Section 37 of the LIC Act, 1956:**\n   • Every rupee of Sum Assured and declared Vested Bonus in LIC carries an explicit **Government of India Sovereign Guarantee** — zero equity crash risk when the child's college fee or daughter's marriage date arrives.`,
      `3. **Tax-Free Maturity u/s 10(10D) vs 12.5% LTCG Tax:**\n   • Equity Mutual Funds now attract **12.5% Long-Term Capital Gains (LTCG) Tax** on profits above ₹1.25L, whereas LIC maturity & survival benefits (for aggregate annual premiums up to ₹5 Lakh) are **100% Tax-Free under Section 10(10D)** + Section 80C deduction.`,
      `4. **Premium Waiver Benefit (PWB / PWA):**\n   • Mutual Fund SIPs stop the day the earning member is no longer around. With LIC Jeevan Tarun / Jeevan Lakshya / PWB Rider, **LIC pays all remaining future premiums** and still delivers the full maturity corpus to the child!`,
      `5. **Instant Liquidity via 90% Policy Loan:**\n   • Instead of selling units in a market downturn, an LIC policyholder can avail a **90% loan on Surrender Value** within 24 hours while the policy continues to earn full annual bonus on 100% Sum Assured.`,
    ].join('\n');
  }

  // 7. Specific Plan or Default Calculation Query (e.g., Jeevan Anand 715 or matched plan)
  const matchedPlan =
    LIC_PLANS.find(
      (p) =>
        q.includes(p.name.toLowerCase().replace('lic ', '')) ||
        q.includes(p.planNo.split(' ')[0])
    ) || LIC_PLANS[1]; // Default to New Jeevan Anand 715

  const defaultTerm = matchedPlan.fixedTerms ? matchedPlan.fixedTerms[1] || matchedPlan.fixedTerms[0] : 21;
  const clampedAge = Math.max(matchedPlan.minAge, Math.min(matchedPlan.maxAge, parsedAge));
  const calc = calculateLicActuarial({
    clientName: 'Valued Client',
    clientPhone: '+91 98201 44510',
    planId: matchedPlan.id,
    entryAge: clampedAge,
    policyTerm: defaultTerm,
    ppt: matchedPlan.pptMap?.[defaultTerm] || defaultTerm,
    sumAssured: Math.max(matchedPlan.minSumAssured, parsedSa),
    paymentMode: 'Yearly',
    addbRider: true,
    termRider: false,
    criticalIllnessRider: false,
    pwbRider: false,
    proposerAge: clampedAge,
  });

  return [
    `### 📘 ${matchedPlan.name} (Plan ${matchedPlan.planNo} · UIN ${matchedPlan.uin})`,
    `**Category:** ${matchedPlan.category} · *${matchedPlan.tagline}*`,
    ``,
    `#### 🔢 Live Actuarial Illustration (Age: ${clampedAge} Yrs · Term: ${calc.effectivePolicyTerm} Yrs · PPT: ${calc.effectivePpt} Yrs)`,
    `• **Basic Sum Assured:** **${formatInr(calc.input.sumAssured)}**`,
    `• **1st Year Yearly Premium (incl. ${calc.firstYearGstRatePct}% GST):** **${formatInr(calc.firstYearModalPremiumInclGst)}** (${formatInr(calc.dailySavingEquivalentYear1)}/day)`,
    calc.effectivePpt > 1
      ? `• **2nd Year Onwards (incl. ${calc.subsequentYearGstRatePct}% GST):** **${formatInr(calc.subsequentYearModalPremiumInclGst)}**`
      : `• **Payment Type:** Single One-Time Premium`,
    `• **Total Premium Invested:** ${formatInr(calc.totalPremiumPaidOverPptInclGst)}`,
    `• **Projected Bonus / Guaranteed Additions (@ ₹${calc.bonusRatePerThousandUsed}/1000):** +${formatInr(calc.totalBonusOrGaAtMaturity)}`,
    calc.fabAmountAtMaturity > 0
      ? `• **Final Additional Bonus (FAB @ ₹${calc.fabRatePerThousandUsed}/1000):** +${formatInr(calc.fabAmountAtMaturity)}`
      : null,
    calc.totalSurvivalMoneyBackReceived > 0
      ? `• **Periodic Survival / Money-Back Payouts:** +${formatInr(calc.totalSurvivalMoneyBackReceived)}`
      : null,
    `• **Total Projected Maturity & Survival Value:** **${formatInr(calc.totalValueDelivered)}**`,
    `• **1st Year Agent Commission (incl. Bonus):** ${formatInr(calc.agentFirstYearTotalCommission)}`,
    ``,
    `#### ✨ Key Highlights:`,
    ...matchedPlan.keyHighlights.map((h) => `• ${h}`),
  ]
    .filter(Boolean)
    .join('\n');
}

export async function askLicAiAdvisor(params: {
  prompt: string;
  agentName: string;
  agencyCode: string;
  agentMobile: string;
  policies: CustomerPolicyRecord[];
  history: AiChatMessage[];
}): Promise<{ answer: string; source: string }> {
  const { prompt, agentName, agencyCode, agentMobile, policies, history } = params;

  const agentContext = [
    `Agent Name: ${agentName}`,
    `Agency Code: ${agencyCode}`,
    `Agent Mobile: ${agentMobile}`,
    `Active Policies in Book: ${policies.length}`,
    policies.length > 0
      ? `Sample Customer Policies:\n` +
        policies
          .slice(0, 8)
          .map(
            (p) =>
              `- ${p.customerName} (Policy #${p.policyNumber}, ${p.planName}, SA: ₹${p.sumAssured}, Premium: ₹${p.premiumAmount} ${p.paymentMode}, Next Due: ${p.nextRenewalDate}, DOB: ${p.dateOfBirth})`
          )
          .join('\n')
      : 'No policies in book yet.',
  ].join('\n');

  try {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        agentContext,
        history: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.answer && typeof data.answer === 'string' && data.answer.trim().length > 0) {
        return {
          answer: data.answer.trim(),
          source: data.source || 'gemini-3.8-flash',
        };
      }
    }
  } catch {
    // Fallback to built-in LIC actuarial engine if offline or server unreachable
  }

  return {
    answer: generateLocalLicActuarialAnswer(prompt, agentName, agencyCode, policies),
    source: 'lic-actuarial-ai-engine',
  };
}
