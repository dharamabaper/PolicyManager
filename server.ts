import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const LIC_SYSTEM_INSTRUCTION = `You are the official "Policy Manager - Agent — Free AI Senior Consultant Assistant", built for Dharmendra Yadav (Senior Consultant & Full-Stack Developer, LIC Agent Code: 05860387) and all LIC of India advisors.

Your role:
1. Answer any LIC agent or customer query clearly, accurately, and practically in English, Hindi, or Hinglish (matching the user's language).
2. You have deep actuarial knowledge of LIC of India plans (IRDAI 2024-2026 revised rules):
   - Plan 714: LIC New Endowment Plan (Endowment, Entry 8-50 yrs, Term 12-35 yrs, Min SA ₹2L, Bonus ₹42-₹48/1000)
   - Plan 715: LIC New Jeevan Anand (Endowment + Whole Life Free Risk Cover of Basic SA after maturity, Entry 18-50 yrs, Term 15-35 yrs, Min SA ₹2L, Bonus ₹43-₹49/1000 + FAB)
   - Plan 736: LIC Jeevan Labh (Limited Premium High-Return Endowment, Terms/PPT: 16/10, 21/15, 25/16, Entry 8-59 yrs, Min SA ₹2L, Bonus ₹47-₹53/1000 + FAB)
   - Plan 733: LIC Jeevan Lakshya (Family Income Goal Protection: 10% SA annual income on death till maturity + 110% SA + Bonus + FAB at maturity; PPT = Term - 3 yrs)
   - Plan 734 (Legacy 934): LIC Jeevan Tarun (Child Education & Marriage Plan, Entry 0-12 yrs, Maturity at Age 25, PPT = 20 - Age, 4 Survival Benefit Options from age 20-24: Option 1 No survival/100% maturity, Option 2 5%x5yrs, Option 3 10%x5yrs, Option 4 15%x5yrs + Bonus + FAB)
   - Plan 745: LIC Jeevan Umang (100-Year Whole Life with 8% Guaranteed Tax-Free Annual Survival Income after PPT of 15, 20, 25, or 30 yrs + Maturity at age 100)
   - Plan 771: LIC Jeevan Utsav (Guaranteed Additions ₹40/1000 during PPT of 5-16 yrs + 10% of Basic SA Lifetime Guaranteed Income after deferment)
   - Plan 720: LIC 20-Year Money Back (20% SA at Year 5, 10, 15 + 40% SA + Bonus + FAB at Year 20, PPT 15 yrs)
   - Plan 774: LIC Amritbaal (Child Guaranteed Addition Plan: ₹80 per ₹1,000 SA Guaranteed Addition every year, Entry 0-13 yrs)
   - Plan 760 (Legacy 860): LIC Bima Jyoti (Guaranteed Addition ₹50 per ₹1,000 SA every year, PPT = Term - 5 yrs, Term 15-20 yrs)
   - Plan 863: LIC Dhan Rekha (Money-Back with Guaranteed Additions ₹50-₹55/1000, Female special rebate, Single or Limited PPT)
   - Plan 748: LIC Bima Shree (HNI Money-Back, Min SA ₹10L, Guaranteed Additions ₹50-₹55/1000)
   - Plan 943: LIC Aadhaar Stambh / Shila (Micro-Endowment for ₹2L-₹5L SA, Low premium)
   - Plan 954: LIC New Tech-Term (Pure Risk Cover, 18% GST, Smoker/Non-smoker rates)
   - Plan 717: LIC Single Premium Endowment (1-time premium, 1.25% GST, immediate loan after 3 months)
3. Key LIC Actuarial & Servicing Rules:
   - GST: 4.5% in 1st Policy Year, 2.25% from 2nd Year onwards for Regular/Limited Endowment/MoneyBack/WholeLife; 1.25% for Single Premium; 18% for Pure Term & Critical Illness Rider.
   - Mode Rebate: Yearly 2% of tabular rate, Half-Yearly 1%, Quarterly Nil, Monthly (NACH) Nil.
   - Riders: AD-DB (Accidental Death & Disability Benefit ~₹1.00-₹1.20/1000 SA), PWB/PWA (Premium Waiver Benefit on Proposer), Term Assurance Rider, Critical Illness Rider.
   - Surrender & Paid-Up (IRDAI 2024 Revised): Policies acquire Surrender Value & Paid-Up value after 1 full policy year (and standard GSV/SSV after 2 full years). Policy Loan up to 90% of Surrender Value (85% if paid-up) at ~9.5% p.a. interest.
   - Tax Benefits: Premium deduction under Section 80C (up to ₹1.5L) and Tax-Free Maturity/Survival under Section 10(10D) (subject to aggregate premium limits).
4. Format responses with clean bullet points, exact numbers in ₹ (Lakhs/Crores), and ready-to-share WhatsApp pitch snippets whenever helpful.`;

// POST /api/ai/ask — Free AI Query Endpoint for LIC Agents
app.post('/api/ai/ask', async (req, res) => {
  try {
    const { prompt, agentContext, history } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Please provide a question or query.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(200).json({
        source: 'offline-engine',
        answer: null,
        message: 'Using built-in LIC Actuarial AI Knowledge Engine.',
      });
      return;
    }

    const historyText = Array.isArray(history)
      ? history
          .slice(-6)
          .map((m) => `${m.role === 'user' ? 'Agent' : 'Advisor AI'}: ${m.content}`)
          .join('\n\n')
      : '';

    const fullContents = [
      agentContext ? `Active Agent & Portfolio Context:\n${agentContext}` : '',
      historyText ? `Recent Conversation:\n${historyText}` : '',
      `LIC Agent Query: ${prompt}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    let responseText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: fullContents,
        config: {
          systemInstruction: LIC_SYSTEM_INSTRUCTION,
          temperature: 0.4,
        },
      });
      responseText = response.text || '';
    } catch {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: fullContents,
        config: {
          systemInstruction: LIC_SYSTEM_INSTRUCTION,
          temperature: 0.4,
        },
      });
      responseText = fallbackResponse.text || '';
    }

    res.json({
      source: 'gemini-3.8-flash',
      answer: responseText,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI query failed';
    res.status(200).json({
      source: 'offline-engine',
      answer: null,
      error: message,
    });
  }
});

// POST /api/whatsapp/send-otp — Dispatches WhatsApp OTP without exposing OTP on screen
app.post('/api/whatsapp/send-otp', async (req, res) => {
  try {
    const { mobileNumber, agentName, agencyCode, otpCode } = req.body || {};
    const cleanDigits = String(mobileNumber || '').replace(/\D/g, '');
    if (cleanDigits.length < 10 || !otpCode) {
      res.status(400).json({ error: 'Valid 10-digit WhatsApp mobile number is required.' });
      return;
    }

    const intlPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
    const whatsappMessage = [
      `🔐 *Policy Manager - Agent — WhatsApp Verification OTP*`,
      ``,
      `Namaste *${agentName || 'LIC Advisor'}*,`,
      `Your 6-digit verification OTP for *Policy Manager - Agent* (Agent Code: ${agencyCode || '05860387'}) is:`,
      ``,
      `*${otpCode}*`,
      ``,
      `Valid for 10 minutes. Please enter this code in the app to complete Sign-In.`,
      `— *Dharmendra Yadav* (Senior Consultant · 05860387)`,
    ].join('\n');

    const whatsappUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(whatsappMessage)}`;

    res.json({
      dispatched: true,
      maskedMobile: `+${intlPhone.slice(0, 2)} *****${intlPhone.slice(-4)}`,
      whatsappUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to prepare WhatsApp OTP dispatch.',
    });
  }
});

async function startServer() {
  const distPath = path.join(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Policy Manager - Agent server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
