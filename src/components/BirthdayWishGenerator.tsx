import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  Cake,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { CustomerPolicyRecord, calculateAgeFromDob } from '../services/policyService';

interface BirthdayWishGeneratorProps {
  policies: CustomerPolicyRecord[];
  agentName: string;
  agentMobile: string;
  agencyCode: string;
  branchCode: string;
}

type CardThemeId = 'royal-navy' | 'festive-saffron' | 'emerald-gold' | 'pearl-minimal';
type WishLanguageId = 'english' | 'hindi' | 'family';

interface BirthdayCustomerEntry {
  policy: CustomerPolicyRecord;
  daysUntilBirthday: number;
  turningAge: number;
  nextBirthdayDateStr: string;
}

const WISH_TEMPLATES: Record<WishLanguageId, { label: string; headline: string; body: string }> = {
  english: {
    label: 'English Executive',
    headline: 'Wishing You a Very Happy Birthday',
    body: 'May the coming year bring you abundant health, happiness, prosperity, and lasting peace of mind for you and your family.',
  },
  hindi: {
    label: 'Hindi (जन्मदिन शुभकामनाएं)',
    headline: 'जन्मदिन की हार्दिक शुभकामनाएं',
    body: 'ईश्वर आपको उत्तम स्वास्थ्य, दीर्घायु, सुख-समृद्धि और आपके पूरे परिवार को सदैव खुशहाली प्रदान करें।',
  },
  family: {
    label: 'Warm Family Advisory',
    headline: 'Happy Birthday & Best Wishes',
    body: 'Thank you for trusting us with your family’s financial milestones. Wishing you a joyful birthday and a wonderful year ahead!',
  },
};

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export const BirthdayWishGenerator: React.FC<BirthdayWishGeneratorProps> = ({
  policies,
  agentName,
  agentMobile,
  agencyCode,
  branchCode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute sorted list of customers by upcoming birthday
  const birthdayList = useMemo<BirthdayCustomerEntry[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return policies
      .map((policy) => {
        const dob = new Date(policy.dateOfBirth);
        if (isNaN(dob.getTime())) {
          return {
            policy,
            daysUntilBirthday: 365,
            turningAge: 35,
            nextBirthdayDateStr: policy.dateOfBirth,
          };
        }
        const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
        if (nextBday.getTime() < today.getTime()) {
          nextBday.setFullYear(today.getFullYear() + 1);
        }
        const daysUntilBirthday = Math.round(
          (nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const turningAge = nextBday.getFullYear() - dob.getFullYear();
        return {
          policy,
          daysUntilBirthday,
          turningAge,
          nextBirthdayDateStr: nextBday.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
          }),
        };
      })
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  }, [policies]);

  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    birthdayList[0]?.policy.id || ''
  );
  const [customCustomerName, setCustomCustomerName] = useState<string>(
    birthdayList[0]?.policy.customerName || 'Rajesh Sharma'
  );
  const [customCustomerMobile, setCustomCustomerMobile] = useState<string>(
    birthdayList[0]?.policy.customerMobile || '+91 98201 44510'
  );
  const [customDob, setCustomDob] = useState<string>(
    birthdayList[0]?.policy.dateOfBirth || '1991-10-15'
  );
  const [customPolicyNo, setCustomPolicyNo] = useState<string>(
    birthdayList[0]?.policy.policyNumber || '894512039'
  );
  const [customPlanName, setCustomPlanName] = useState<string>(
    birthdayList[0]?.policy.planName || 'LIC New Jeevan Anand'
  );

  const [theme, setTheme] = useState<CardThemeId>('royal-navy');
  const [wishLang, setWishLang] = useState<WishLanguageId>('english');
  const [customHeadline, setCustomHeadline] = useState<string>(WISH_TEMPLATES.english.headline);
  const [customBodyMessage, setCustomBodyMessage] = useState<string>(WISH_TEMPLATES.english.body);
  const [showPolicyBadgeOnCard, setShowPolicyBadgeOnCard] = useState<boolean>(true);
  const [copiedImageStatus, setCopiedImageStatus] = useState<string | null>(null);

  useEffect(() => {
    if (birthdayList.length > 0 && !selectedPolicyId) {
      const first = birthdayList[0].policy;
      setSelectedPolicyId(first.id);
      setCustomCustomerName(first.customerName);
      setCustomCustomerMobile(first.customerMobile);
      setCustomDob(first.dateOfBirth);
      setCustomPolicyNo(first.policyNumber);
      setCustomPlanName(first.planName);
    }
  }, [birthdayList, selectedPolicyId]);

  const handleSelectCustomer = (pol: CustomerPolicyRecord) => {
    setSelectedPolicyId(pol.id);
    setCustomCustomerName(pol.customerName);
    setCustomCustomerMobile(pol.customerMobile);
    setCustomDob(pol.dateOfBirth);
    setCustomPolicyNo(pol.policyNumber);
    setCustomPlanName(pol.planName);
  };

  const handleLanguageChange = (lang: WishLanguageId) => {
    setWishLang(lang);
    setCustomHeadline(WISH_TEMPLATES[lang].headline);
    setCustomBodyMessage(WISH_TEMPLATES[lang].body);
  };

  // Draw 1080x1080 Dynamic Birthday Greeting Card on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    // Theme Palettes
    const palettes: Record<
      CardThemeId,
      {
        bgStart: string;
        bgEnd: string;
        borderOuter: string;
        borderInner: string;
        accentGold: string;
        titleText: string;
        nameText: string;
        bodyText: string;
        footerBg: string;
        footerText: string;
      }
    > = {
      'royal-navy': {
        bgStart: '#08142C',
        bgEnd: '#132A56',
        borderOuter: '#D97706',
        borderInner: '#FBBF24',
        accentGold: '#FBBF24',
        titleText: '#E2E8F0',
        nameText: '#FFFFFF',
        bodyText: '#CBD5E1',
        footerBg: '#060E20',
        footerText: '#F8FAFC',
      },
      'festive-saffron': {
        bgStart: '#6B1D0F',
        bgEnd: '#9A3412',
        borderOuter: '#FDE047',
        borderInner: '#FBBF24',
        accentGold: '#FDE047',
        titleText: '#FEF08A',
        nameText: '#FFFFFF',
        bodyText: '#FFEDD5',
        footerBg: '#451208',
        footerText: '#FFF7ED',
      },
      'emerald-gold': {
        bgStart: '#052E24',
        bgEnd: '#064E3B',
        borderOuter: '#F59E0B',
        borderInner: '#FCD34D',
        accentGold: '#FCD34D',
        titleText: '#D1FAE5',
        nameText: '#FFFFFF',
        bodyText: '#ECFDF5',
        footerBg: '#021E17',
        footerText: '#F0FDF4',
      },
      'pearl-minimal': {
        bgStart: '#F8FAFC',
        bgEnd: '#EEF2FF',
        borderOuter: '#1E3A8A',
        borderInner: '#D97706',
        accentGold: '#B45309',
        titleText: '#334155',
        nameText: '#0F172A',
        bodyText: '#475569',
        footerBg: '#0F172A',
        footerText: '#FFFFFF',
      },
    };

    const pal = palettes[theme];

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, pal.bgStart);
    grad.addColorStop(1, pal.bgEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 2. Subtle Radial Glow in Center
    const radial = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, 460);
    radial.addColorStop(0, theme === 'pearl-minimal' ? 'rgba(29, 78, 216, 0.06)' : 'rgba(251, 191, 36, 0.14)');
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    // 3. Double Architectural Frame Border
    ctx.strokeStyle = pal.borderOuter;
    ctx.lineWidth = 4;
    ctx.strokeRect(42, 42, W - 84, H - 84);

    ctx.strokeStyle = pal.borderInner;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(58, 58, W - 116, H - 116);

    // Corner Ornaments
    const corners = [
      [58, 58],
      [W - 58, 58],
      [58, H - 58],
      [W - 58, H - 58],
    ];
    ctx.fillStyle = pal.accentGold;
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Top Crest / Celebration Emblem
    ctx.textAlign = 'center';
    ctx.fillStyle = pal.accentGold;
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('★   CELEBRATING A SPECIAL MILESTONE   ★', W / 2, 145);

    // Formatted Birthday Date
    const dobDate = new Date(customDob);
    const formattedBday = !isNaN(dobDate.getTime())
      ? dobDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })
      : customDob;
    ctx.fillStyle = pal.titleText;
    ctx.font = '500 22px "Public Sans", sans-serif';
    ctx.fillText(formattedBday.toUpperCase(), W / 2, 185);

    // 5. Greeting Headline
    ctx.fillStyle = pal.accentGold;
    ctx.font = '700 42px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(customHeadline, W / 2, 275);

    // Decorative Divider Line
    ctx.strokeStyle = pal.accentGold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 140, 310);
    ctx.lineTo(W / 2 + 140, 310);
    ctx.stroke();

    // 6. Customer Full Name (Focal Hero Text)
    ctx.fillStyle = pal.nameText;
    ctx.font = '700 68px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(customCustomerName || 'Valued Policyholder', W / 2, 410);

    // 7. Optional Policy & Plan Trust Ribbon
    let bodyStartY = 500;
    if (showPolicyBadgeOnCard && customPolicyNo) {
      ctx.fillStyle = pal.accentGold;
      ctx.font = '600 25px "JetBrains Mono", monospace';
      ctx.fillText(
        `Valued LIC Family Member  ·  Policy #${customPolicyNo}  ·  ${customPlanName}`,
        W / 2,
        470
      );
      bodyStartY = 550;
    }

    // 8. Body Wish Message
    ctx.fillStyle = pal.bodyText;
    ctx.font = '400 33px "Public Sans", sans-serif';
    wrapCanvasText(ctx, customBodyMessage, W / 2, bodyStartY, W - 240, 50);

    // 9. Quote / Tagline above Footer
    ctx.fillStyle = pal.accentGold;
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('“Zindagi Ke Saath Bhi, Zindagi Ke Baad Bhi”', W / 2, 795);

    // 10. Official Advisor Signature Footer Box
    ctx.fillStyle = pal.footerBg;
    ctx.fillRect(60, 835, W - 120, 185);

    ctx.strokeStyle = pal.borderInner;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 835);
    ctx.lineTo(W - 60, 835);
    ctx.stroke();

    ctx.fillStyle = pal.accentGold;
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('WARM REGARDS & PERSONAL FINANCIAL ADVISORY', W / 2, 882);

    ctx.fillStyle = pal.footerText;
    ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(agentName || 'LIC Advisor', W / 2, 932);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 23px "JetBrains Mono", monospace';
    ctx.fillText(
      `Agency Code: ${agencyCode}  ·  Branch: ${branchCode}  ·  WhatsApp: ${agentMobile}`,
      W / 2,
      980
    );
  }, [
    theme,
    customHeadline,
    customBodyMessage,
    customCustomerName,
    customDob,
    customPolicyNo,
    customPlanName,
    showPolicyBadgeOnCard,
    agentName,
    agentMobile,
    agencyCode,
    branchCode,
  ]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `LIC_Birthday_Wish_${(customCustomerName || 'Client').replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleCopyImageToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopiedImageStatus('Image copied to clipboard! Paste directly into WhatsApp.');
        setTimeout(() => setCopiedImageStatus(null), 3500);
      } catch {
        handleDownloadPng();
        setCopiedImageStatus('Birthday card downloaded as PNG!');
        setTimeout(() => setCopiedImageStatus(null), 3500);
      }
    }, 'image/png');
  };

  const handleShareDirectToWhatsApp = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanPhone = customCustomerMobile.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const caption = [
      `🎂 *${customHeadline}, ${customCustomerName}!*`,
      ``,
      customBodyMessage,
      ``,
      `Warm Regards,`,
      `*${agentName}*`,
      `LIC Advisor (${agencyCode} · ${branchCode})`,
      `📞 ${agentMobile}`,
    ].join('\n');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File(
        [blob],
        `Birthday_Wish_${(customCustomerName || 'Customer').replace(/\s+/g, '_')}.png`,
        { type: 'image/png' }
      );

      // 1. If running on Android / Mobile browser supporting Web Share API Level 2 with files:
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Happy Birthday ${customCustomerName}`,
            text: caption,
            files: [file],
          });
          return;
        } catch {
          // User cancelled or fallback needed
        }
      }

      // 2. Desktop / Fallback: Copy image to clipboard + trigger PNG download + copy WhatsApp text
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch {
        // ignore clipboard write restriction if any
      }
      handleDownloadPng();
      navigator.clipboard.writeText(caption);
      setCopiedImageStatus(
        `Card downloaded & copied! Send to ${customCustomerName} (${waPhone || customCustomerMobile}) on WhatsApp.`
      );
      setTimeout(() => setCopiedImageStatus(null), 4000);
    }, 'image/png');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (5 cols): Customer Birthday Roster & Customization Controls */}
      <div className="lg:col-span-5 space-y-6">
        {/* Customer Birthday Roster */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="text-xs text-slate-500">Sorted by Upcoming Date of Birth</div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cake className="w-4 h-4 text-amber-600" />
                <span>Select Customer for Birthday Wish</span>
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {birthdayList.length} Customers
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1">
            {birthdayList.map((entry) => {
              const isSelected = entry.policy.id === selectedPolicyId;
              return (
                <button
                  key={entry.policy.id}
                  onClick={() => handleSelectCustomer(entry.policy)}
                  className={`w-full text-left py-2.5 px-3 rounded-xl transition-colors flex items-center justify-between gap-2 ${
                    isSelected ? 'bg-blue-50/90 text-blue-950' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {entry.policy.customerName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums">
                      DOB: {entry.policy.dateOfBirth} · Turning {entry.turningAge} Yrs · #
                      {entry.policy.policyNumber}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-xs tabular-nums">
                    {entry.daysUntilBirthday === 0 ? (
                      <span className="font-bold text-amber-600">Today!</span>
                    ) : (
                      <span className="text-slate-600">
                        In {entry.daysUntilBirthday}d ({entry.nextBirthdayDateStr})
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Customization Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <div className="text-xs text-slate-500">Dynamic Greeting Card Studio</div>
            <h3 className="text-base font-bold text-slate-900">Customize Birthday Card & Theme</h3>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Card Visual Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'royal-navy', label: 'Royal LIC Navy & Gold' },
                  { id: 'festive-saffron', label: 'Festive Saffron & Marigold' },
                  { id: 'emerald-gold', label: 'Executive Emerald & Gold' },
                  { id: 'pearl-minimal', label: 'Minimalist Pearl & Blue' },
                ] as { id: CardThemeId; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium text-left transition-colors ${
                    theme === t.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Language Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Greeting Language & Tone
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['english', 'hindi', 'family'] as WishLanguageId[]).map((langKey) => (
                <button
                  key={langKey}
                  type="button"
                  onClick={() => handleLanguageChange(langKey)}
                  className={`py-2 px-2 rounded-lg border text-xs font-medium transition-colors truncate ${
                    wishLang === langKey
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {WISH_TEMPLATES[langKey].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Customer Name on Card
              </label>
              <input
                type="text"
                value={customCustomerName}
                onChange={(e) => setCustomCustomerName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                WhatsApp Mobile
              </label>
              <input
                type="text"
                value={customCustomerMobile}
                onChange={(e) => setCustomCustomerMobile(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-mono text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Card Headline
            </label>
            <input
              type="text"
              value={customHeadline}
              onChange={(e) => setCustomHeadline(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Personalized Wish Message
            </label>
            <textarea
              rows={3}
              value={customBodyMessage}
              onChange={(e) => setCustomBodyMessage(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 leading-relaxed"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={showPolicyBadgeOnCard}
              onChange={(e) => setShowPolicyBadgeOnCard(e.target.checked)}
              className="w-4 h-4 accent-blue-700 rounded"
            />
            <span className="text-xs text-slate-700">
              Include Policy Number (#{customPolicyNo}) & Plan Name on Card
            </span>
          </label>
        </div>
      </div>

      {/* Right Column (7 cols): Live High-Res Dynamic Birthday Image Preview & Share Actions */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="text-xs text-slate-500">
              1080 × 1080 HD PNG · Instant WhatsApp Ready
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Dynamic Customer Birthday Greeting Card
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleShareDirectToWhatsApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Image to Customer on WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={handleCopyImageToClipboard}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Image</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPng}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {copiedImageStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-medium text-emerald-800">
            <Check className="w-4 h-4 shrink-0" />
            <span>{copiedImageStatus}</span>
          </div>
        )}

        {/* Canvas Preview Container */}
        <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[520px] aspect-square rounded-xl shadow-lg border border-slate-200"
          />
        </div>

        <div className="text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2 pt-1">
          <span>
            Tip: On Android devices, clicking Share Image opens the native Android Share Sheet with the PNG image pre-attached for WhatsApp.
          </span>
          <span className="font-mono text-slate-600">
            DOB: {customDob} ({calculateAgeFromDob(customDob)} Yrs)
          </span>
        </div>
      </div>
    </div>
  );
};
