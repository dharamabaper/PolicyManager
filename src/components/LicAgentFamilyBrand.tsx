import React from 'react';
import { Code2, ShieldCheck, Award, Phone, Mail, Building2, UserCheck } from 'lucide-react';

/**
 * Custom vector emblem for "Policy Manager - Agent"
 * Protective shield + family silhouettes + cupped hands of security
 */
export const LicAgentFamilyIcon: React.FC<{ className?: string }> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Policy Manager - Agent Icon"
  >
    <defs>
      <linearGradient id="licBgGrad" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0F172A" />
        <stop offset="55%" stopColor="#1E3A8A" />
        <stop offset="100%" stopColor="#172554" />
      </linearGradient>
      <linearGradient id="licGoldGrad" x1="96" y1="64" x2="416" y2="448" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="50%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#D97706" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" rx="112" fill="url(#licBgGrad)" />
    <rect
      x="24"
      y="24"
      width="464"
      height="464"
      rx="92"
      stroke="url(#licGoldGrad)"
      strokeWidth="8"
      strokeOpacity="0.7"
    />
    <path
      d="M256 68L404 126V248C404 345 340 418 256 448C172 418 108 345 108 248V126L256 68Z"
      fill="#0F172A"
      fillOpacity="0.6"
      stroke="url(#licGoldGrad)"
      strokeWidth="14"
      strokeLinejoin="round"
    />
    {/* Parents & Child Family Iconography */}
    <circle cx="206" cy="204" r="24" fill="url(#licGoldGrad)" />
    <path
      d="M164 278C164 252 183 236 206 236C229 236 248 252 248 278V304H164V278Z"
      fill="url(#licGoldGrad)"
    />
    <circle cx="306" cy="204" r="24" fill="url(#licGoldGrad)" />
    <path
      d="M264 278C264 252 283 236 306 236C329 236 348 252 348 278V304H264V278Z"
      fill="url(#licGoldGrad)"
    />
    <circle cx="256" cy="238" r="19" fill="#FFFFFF" />
    <path
      d="M224 304C224 282 238 268 256 268C274 268 288 282 288 304V322H224V304Z"
      fill="#FFFFFF"
    />
    <path
      d="M148 316C174 358 212 382 256 382C300 382 338 358 364 316"
      stroke="url(#licGoldGrad)"
      strokeWidth="16"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Official Multi-Color Gmail Envelope Icon SVG for Gmail Sign-In / Sign-Up Button
 */
export const GmailColorIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M2 6.5V18C2 19.1046 2.89543 20 4 20H6V10.8L12 15.3L18 10.8V20H20C21.1046 20 22 19.1046 22 18V6.5C22 4.84315 20.1085 3.89742 18.783 4.89155L18 5.4788L12 9.9788L6 5.4788L5.217 4.89155C3.8915 3.89742 2 4.84315 2 6.5Z"
      fill="#EA4335"
    />
    <path d="M2 6.5V18C2 19.1046 2.89543 20 4 20H6V10.8L2 7.8V6.5Z" fill="#4285F4" />
    <path d="M22 6.5V18C22 19.1046 21.1046 20 20 20H18V10.8L22 7.8V6.5Z" fill="#34A853" />
    <path d="M18 5.4788L12 9.9788L6 5.4788V10.8L12 15.3L18 10.8V5.4788Z" fill="#FBBC05" />
  </svg>
);

export const DHARMENDRA_FOUNDER_INFO = {
  name: 'Dharmendra Yadav',
  designation: 'Senior Consultant & Software Developer',
  agencyCode: '05860387',
  branchCode: 'LIC of India · Senior Advisory Division',
  email: 'dharamabaper@gmail.com',
  bio: 'Application Architect, Software Developer, and Senior LIC Consultant (Agent Code: 05860387). Designed Policy Manager - Agent to empower LIC advisors with 100% free, zero-trial actuarial tools, customer policy vaults, renewal alerts, and automated WhatsApp birthday greetings.',
};

interface AboutDharmendraCardProps {
  compact?: boolean;
}

export const AboutDharmendraCard: React.FC<AboutDharmendraCardProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-slate-900/95 border border-amber-500/30 rounded-2xl p-4 text-left">
        <div className="flex items-center gap-3">
          <LicAgentFamilyIcon className="w-11 h-11 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Created by Developer & Senior LIC Consultant
            </div>
            <div className="text-sm font-bold text-white truncate">
              {DHARMENDRA_FOUNDER_INFO.name}
            </div>
            <div className="text-xs text-slate-300 font-mono truncate">
              Senior Consultant · Agent Code: {DHARMENDRA_FOUNDER_INFO.agencyCode}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl border border-amber-500/30 p-5 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3.5">
          <LicAgentFamilyIcon className="w-14 h-14 shrink-0" />
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <Award className="w-3.5 h-3.5 shrink-0" />
              <span>About Creator & Senior LIC Advisor</span>
            </div>
            <h3 className="text-xl font-bold text-white font-display tracking-tight mt-0.5">
              {DHARMENDRA_FOUNDER_INFO.name}
            </h3>
            <p className="text-xs text-blue-200">
              {DHARMENDRA_FOUNDER_INFO.designation}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-amber-400/30 rounded-xl px-3.5 py-2.5 text-left sm:text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Official LIC Agency Code
          </div>
          <div className="text-base font-bold font-mono text-amber-400 tabular-nums">
            {DHARMENDRA_FOUNDER_INFO.agencyCode}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium">
            Senior Consultant · Verified Developer
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mt-4">
        {DHARMENDRA_FOUNDER_INFO.bio}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-2.5">
          <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px]">Role & Expertise</div>
            <div className="font-semibold text-white truncate">LIC Agent & App Developer</div>
          </div>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-2.5">
          <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px]">Designation & Code</div>
            <div className="font-semibold text-white font-mono truncate">
              Sr. Consultant · {DHARMENDRA_FOUNDER_INFO.agencyCode}
            </div>
          </div>
        </div>
        <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-2.5">
          <Code2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-slate-400 text-[11px]">License Guarantee</div>
            <div className="font-semibold text-emerald-300 truncate">100% Free Open-Source Stack</div>
          </div>
        </div>
      </div>
    </div>
  );
};
