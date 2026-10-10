import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Cake,
  Download,
  Share2,
  Copy,
  Check,
  Sparkles,
  Send,
  Calendar,
} from 'lucide-react';
import { CustomerPolicyRecord, calculateAgeFromDob } from '../services/policyService';
import { formatInr } from '../data/licPlans';

interface CustomerBirthdayStudioProps {
  policies: CustomerPolicyRecord[];
  agentName: string;
  agentMobile: string;
  agencyCode: string;
  branchCode: string;
}

type CardThemeId = 'royal_blue' | 'festive_saffron' | 'executive_emerald';
type MessagePresetId = 'english_warm' | 'hindi_hinglish' | 'milestone_advisory';

interface BirthdayCustomerEntry {
  policy: CustomerPolicyRecord;
  currentAge: number;
  turningAge: number;
  daysUntilBirthday: number;
  nextBirthdayFormatted: string;
}

const CARD_THEMES: Record<
  CardThemeId,
  {
    label: string;
    bgStart: string;
    bgEnd: string;
    borderAccent: string;
    badgeBg: string;
    titleColor: string;
    nameColor: string;
    bodyColor: string;
    footerBg: string;
  }
> = {
  royal_blue: {
    label: 'Royal LIC Blue & Gold',
    bgStart: '#0F172A',
    bgEnd: '#1E3A8A',
    borderAccent: '#F59E0B',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
    titleColor: '#FBBF24',
    nameColor: '#FFFFFF',
    bodyColor: '#E2E8F0',
    footerBg: 'rgba(15, 23, 42, 0.85)',
  },
  festive_saffron: {
    label: 'Festive Saffron & Gold',
    bgStart: '#431407',
    bgEnd: '#9A3412',
    borderAccent: '#FBBF24',
    badgeBg: 'rgba(251, 191, 36, 0.18)',
    titleColor: '#FDE68A',
    nameColor: '#FFFFFF',
    bodyColor: '#FFEDD5',
    footerBg: 'rgba(67, 20, 7, 0.88)',
  },
  executive_emerald: {
    label: 'Executive Emerald & Gold',
    bgStart: '#022C22',
    bgEnd: '#065F46',
    borderAccent: '#34D399',
    badgeBg: 'rgba(52, 211, 153, 0.16)',
    titleColor: '#6EE7B7',
    nameColor: '#FFFFFF',
    bodyColor: '#D1FAE5',
    footerBg: 'rgba(2, 44, 34, 0.88)',
  },
};

const MESSAGE_PRESETS: Record<MessagePresetId, { label: string; getText: (name: string, age: number) => string }> = {
  english_warm: {
    label: 'Warm English Wishes',
    getText: (name, age) =>
      `Wishing you a wonderful ${age}th Birthday, ${name}! May the year ahead bring you abundant health, happiness, and lifelong financial prosperity for you and your family.`,
  },
  hindi_hinglish: {
    label: 'Hindi / Hinglish Festive',
    getText: (name) =>
      `Janamdin ki hardik shubhkamnayein, ${name} ji! Ishwar se prarthana hai ki aapka aur aapke parivar ka har sapna sakar ho aur bhavishya hamesha surakshit rahe.`,
  },
  milestone_advisory: {
    label: 'Executive Milestone Note',
    getText: (name, age) =>
      `Happy ${age}th Birthday, ${name}! On your special day, we celebrate your journey of disciplined planning and family protection. Wishing you continued success and peace of mind.`,
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

export const CustomerBirthdayStudio: React.FC<CustomerBirthdayStudioProps> = ({
  policies,
  agentName,
  agentMobile,
  agencyCode,
  branchCode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const birthdayEntries = useMemo<BirthdayCustomerEntry[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return policies
      .map((policy) => {
        const dob = new Date(policy.dateOfBirth);
        const validDob = !isNaN(dob.getTime()) ? dob : new Date('1991-10-15');
        const currentAge = calculateAgeFromDob(policy.dateOfBirth);

        const nextBday = new Date(today.getFullYear(), validDob.getMonth(), validDob.getDate());
        if (nextBday.getTime() < today.getTime()) {
          nextBday.setFullYear(today.getFullYear() + 1);
        }
        const daysUntilBirthday = Math.round(
          (nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const turningAge = nextBday.getFullYear() - validDob.getFullYear();
        const nextBirthdayFormatted = nextBday.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        return {
          policy,
          currentAge,
          turningAge,
          daysUntilBirthday,
          nextBirthdayFormatted,
        };
      })
      .sort((a, b) => a.daysUntilBirthday - b.daysUntilBirthday);
  }, [policies]);

  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(
    birthdayEntries[0]?.policy.id || ''
  );
  const [themeId, setThemeId] = useState<CardThemeId>('royal_blue');
  const [presetId, setPresetId] = useState<MessagePresetId>('english_warm');
  const [customWishText, setCustomWishText] = useState<string>('');
  const [showPolicyBadgeOnCard, setShowPolicyBadgeOnCard] = useState<boolean>(true);
  const [copiedImageStatus, setCopiedImageStatus] = useState<boolean>(false);
  const [sharedStatus, setSharedStatus] = useState<string | null>(null);

  const activeEntry = useMemo(() => {
    return (
      birthdayEntries.find((e) => e.policy.id === selectedPolicyId) || birthdayEntries[0] || null
    );
  }, [birthdayEntries, selectedPolicyId]);

  useEffect(() => {
    if (activeEntry) {
      setCustomWishText(
        MESSAGE_PRESETS[presetId].getText(activeEntry.policy.customerName, activeEntry.turningAge)
      );
    }
  }, [activeEntry, presetId]);

  // Draw High-Resolution 1080x1080 Birthday Greeting Card on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeEntry) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;

    const theme = CARD_THEMES[themeId];
    const { policy, turningAge, nextBirthdayFormatted } = activeEntry;

    // 1. Background Gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, theme.bgStart);
    grad.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 2. Subtle Radial Glow in Center
    const radial = ctx.createRadialGradient(W / 2, H * 0.38, 40, W / 2, H * 0.38, 480);
    radial.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
    radial.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, W, H);

    // 3. Outer & Inner Ornamental Gold/Accent Borders
    ctx.strokeStyle = theme.borderAccent;
    ctx.lineWidth = 4;
    ctx.strokeRect(44, 44, W - 88, H - 88);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(60, 60, W - 120, H - 120);

    // Corner Accents
    const cornerSize = 26;
    ctx.fillStyle = theme.borderAccent;
    [
      [44, 44],
      [W - 44 - cornerSize, 44],
      [44, H - 44 - cornerSize],
      [W - 44 - cornerSize, H - 44 - cornerSize],
    ].forEach(([cx, cy]) => {
      ctx.fillRect(cx, cy, cornerSize, cornerSize);
    });

    // 4. Top Header Kicker
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.titleColor;
    ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('POLICY MANAGER - AGENT · SPECIAL BIRTHDAY GREETINGS', W / 2, 135);

    // Ornamental Divider Line
    ctx.beginPath();
    ctx.moveTo(W / 2 - 140, 162);
    ctx.lineTo(W / 2 + 140, 162);
    ctx.strokeStyle = theme.borderAccent;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Birthday Milestone Medallion Circle
    ctx.beginPath();
    ctx.arc(W / 2, 265, 68, 0, Math.PI * 2);
    ctx.fillStyle = theme.badgeBg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = theme.borderAccent;
    ctx.stroke();

    ctx.fillStyle = theme.titleColor;
    ctx.font = '700 48px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${turningAge}`, W / 2, 272);
    ctx.font = '600 16px "Public Sans", sans-serif';
    ctx.fillText('YEARS', W / 2, 298);

    // 6. Main Headline & Customer Name
    ctx.fillStyle = theme.titleColor;
    ctx.font = '600 32px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Happy Birthday', W / 2, 395);

    ctx.fillStyle = theme.nameColor;
    ctx.font = '700 62px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(policy.customerName, W / 2, 468);

    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.fillText(`Celebrated on ${nextBirthdayFormatted} (DOB: ${policy.dateOfBirth})`, W / 2, 512);

    // 7. Personalized Birthday Wish Paragraph
    ctx.fillStyle = theme.bodyColor;
    ctx.font = '400 30px "Public Sans", sans-serif';
    const messageToDraw =
      customWishText.trim() ||
      MESSAGE_PRESETS[presetId].getText(policy.customerName, turningAge);
    const nextY = wrapCanvasText(ctx, `"${messageToDraw}"`, W / 2, 595, W - 240, 46);

    // 8. Optional Policy Trust Box
    if (showPolicyBadgeOnCard) {
      const boxWidth = W - 240;
      const boxHeight = 96;
      const boxX = 120;
      const boxY = Math.max(735, nextY + 24);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      ctx.fillStyle = theme.titleColor;
      ctx.font = '600 21px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `LIC Family Protection: ${policy.planName} (Policy #${policy.policyNumber})`,
        W / 2,
        boxY + 38
      );

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '500 19px "JetBrains Mono", monospace';
      ctx.fillText(
        `Sum Assured: ${formatInr(policy.sumAssured)}  ·  Projected Maturity: ${formatInr(policy.maturityAmount)}`,
        W / 2,
        boxY + 72
      );
    }

    // 9. Bottom Advisor Signature Strip
    const footerH = 135;
    const footerY = H - 60 - footerH;
    ctx.fillStyle = theme.footerBg;
    ctx.fillRect(60, footerY, W - 120, footerH);

    ctx.beginPath();
    ctx.moveTo(60, footerY);
    ctx.lineTo(W - 60, footerY);
    ctx.strokeStyle = theme.borderAccent;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = theme.titleColor;
    ctx.font = '600 19px "Public Sans", sans-serif';
    ctx.fillText('WARM REGARDS FROM YOUR TRUSTED LIC ADVISOR', 100, footerY + 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(agentName, 100, footerY + 82);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillText(
      `Agency Code: ${agencyCode}  ·  Branch: ${branchCode}`,
      100,
      footerY + 114
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = theme.titleColor;
    ctx.font = '700 26px "JetBrains Mono", monospace';
    ctx.fillText(agentMobile, W - 100, footerY + 82);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 18px "Public Sans", sans-serif';
    ctx.fillText('WhatsApp & Policy Helpline', W - 100, footerY + 112);
  }, [
    activeEntry,
    themeId,
    presetId,
    customWishText,
    showPolicyBadgeOnCard,
    agentName,
    agentMobile,
    agencyCode,
    branchCode,
  ]);

  const handleDownloadCardPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeEntry) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `LIC_Birthday_Wish_${activeEntry.policy.customerName.replace(/\s+/g, '_')}.png`;
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
        setCopiedImageStatus(true);
        setTimeout(() => setCopiedImageStatus(false), 2500);
      } catch {
        handleDownloadCardPng();
      }
    }, 'image/png');
  };

  const handleSendBirthdayImageOnWhatsApp = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeEntry) return;
    const { policy, turningAge } = activeEntry;

    const whatsappCaption = [
      `🎂 *Happy ${turningAge}th Birthday, ${policy.customerName}!* 🎉`,
      ``,
      customWishText,
      ``,
      `Warm Regards,`,
      `*${agentName}*`,
      `LIC Advisor (${agencyCode} · ${branchCode})`,
      `📞 ${agentMobile}`,
    ].join('\n');

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const fileName = `LIC_Birthday_${policy.customerName.replace(/\s+/g, '_')}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // 1. Try native Android / Web Share API with PNG Image File attachment
      const nav = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await nav.share({
            title: `Happy Birthday ${policy.customerName}!`,
            text: whatsappCaption,
            files: [file],
          });
          setSharedStatus('Opened native WhatsApp / Android image share sheet!');
          setTimeout(() => setSharedStatus(null), 3500);
          return;
        } catch {
          // User cancelled or fallback needed
        }
      }

      // 2. Fallback for desktop: Copy image to clipboard + download PNG + copy/launch WhatsApp text
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch {
        // ignore if clipboard image not permitted
      }
      handleDownloadCardPng();
      await navigator.clipboard.writeText(whatsappCaption);
      setSharedStatus(
        'Birthday Card PNG downloaded & WhatsApp caption copied! Attach or paste directly in WhatsApp.'
      );
      setTimeout(() => setSharedStatus(null), 4500);
    }, 'image/png');
  };

  if (!activeEntry) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
        <Cake className="w-8 h-8 text-amber-500 mx-auto" />
        <div className="text-base font-bold text-slate-900">
          Add a Customer Policy with Date of Birth to Generate Birthday Cards
        </div>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Once you store customer policies with their Date of Birth, this studio automatically tracks upcoming birthdays and creates personalized WhatsApp greeting images.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column (5 cols): Customer Birthday Queue & Customization Controls */}
      <div className="lg:col-span-5 space-y-6">
        {/* Customer Birthday Selector List */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Sorted by Upcoming Date of Birth</div>
              <h3 className="text-base font-bold text-slate-900">
                Customer Birthday Calendar ({birthdayEntries.length})
              </h3>
            </div>
            <Cake className="w-5 h-5 text-amber-500" />
          </div>

          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {birthdayEntries.map((entry) => {
              const isSelected = entry.policy.id === activeEntry.policy.id;
              return (
                <button
                  key={entry.policy.id}
                  onClick={() => setSelectedPolicyId(entry.policy.id)}
                  className={`w-full text-left p-3.5 transition-colors flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-blue-50/80' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {entry.policy.customerName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      DOB: {entry.policy.dateOfBirth} · Turning {entry.turningAge} Yrs · #
                      {entry.policy.policyNumber}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono tabular-nums">
                    <div
                      className={`text-xs font-bold ${
                        entry.daysUntilBirthday === 0
                          ? 'text-emerald-700'
                          : entry.daysUntilBirthday <= 30
                          ? 'text-amber-700'
                          : 'text-slate-700'
                      }`}
                    >
                      {entry.daysUntilBirthday === 0
                        ? 'Birthday Today!'
                        : `In ${entry.daysUntilBirthday}d`}
                    </div>
                    <div className="text-[11px] text-slate-400">{entry.nextBirthdayFormatted}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Theme & Greeting Customizer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <div className="text-xs text-slate-500">Dynamic Canvas Generator</div>
            <h3 className="text-base font-bold text-slate-900">
              Customize Birthday Wish Image
            </h3>
          </div>

          {/* Visual Theme Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Card Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CARD_THEMES) as CardThemeId[]).map((tKey) => (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => setThemeId(tKey)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium transition-colors text-center ${
                    themeId === tKey
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {CARD_THEMES[tKey].label.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Language / Message Preset */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Greeting Template (English / Hindi)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(MESSAGE_PRESETS) as MessagePresetId[]).map((mKey) => (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setPresetId(mKey)}
                  className={`py-2 px-2 rounded-xl border text-xs font-medium transition-colors truncate ${
                    presetId === mKey
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {MESSAGE_PRESETS[mKey].label.split(' ')[0]}{' '}
                  {MESSAGE_PRESETS[mKey].label.split(' ')[1]}
                </button>
              ))}
            </div>
          </div>

          {/* Editable Wish Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Personalized Wish Text on Image
            </label>
            <textarea
              rows={3}
              value={customWishText}
              onChange={(e) => setCustomWishText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Policy Badge Toggle */}
          <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <span className="text-xs font-medium text-slate-800">
              Show Customer Policy & Maturity Summary on Card
            </span>
            <input
              type="checkbox"
              checked={showPolicyBadgeOnCard}
              onChange={(e) => setShowPolicyBadgeOnCard(e.target.checked)}
              className="w-4 h-4 accent-blue-700 rounded"
            />
          </label>
        </div>
      </div>

      {/* Right Column (7 cols): Live High-Res Birthday Image Canvas & Direct WhatsApp Share */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="text-xs text-slate-500">
              1080×1080 HD WhatsApp Greeting Card · Customer: {activeEntry.policy.customerName}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Dynamic Birthday Wish Image Preview
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSendBirthdayImageOnWhatsApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap shadow-xs"
            >
              <Share2 className="w-4 h-4" />
              <span>Send Birthday Image on WhatsApp</span>
            </button>
            <button
              onClick={handleCopyImageToClipboard}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {copiedImageStatus ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Image Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Image</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownloadCardPng}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </button>
          </div>
        </div>

        {sharedStatus && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
            {sharedStatus}
          </div>
        )}

        {/* Canvas Container */}
        <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="w-full max-w-[480px] aspect-square rounded-xl shadow-lg border border-slate-300"
          />
        </div>
      </div>
    </div>
  );
};
