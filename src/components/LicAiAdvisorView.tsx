import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  Share2,
  Trash2,
  MessageSquare,
  RefreshCw,
  BookOpen,
  Calculator,
} from 'lucide-react';
import { CustomerPolicyRecord } from '../services/policyService';
import {
  AiChatMessage,
  QUICK_AGENT_AI_PROMPTS,
  askLicAiAdvisor,
} from '../services/licAiAdvisorService';
import { LicAgentFamilyIcon, DHARMENDRA_FOUNDER_INFO } from './LicAgentFamilyBrand';

interface LicAiAdvisorViewProps {
  agentName: string;
  agencyCode: string;
  agentMobile: string;
  policies: CustomerPolicyRecord[];
}

export const LicAiAdvisorView: React.FC<LicAiAdvisorViewProps> = ({
  agentName = DHARMENDRA_FOUNDER_INFO.name,
  agencyCode = DHARMENDRA_FOUNDER_INFO.agencyCode,
  agentMobile = '+91 98201 44510',
  policies,
}) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: [
        `Namaste **${agentName}** (Senior Consultant · LIC Agent Code: **${agencyCode}**)!`,
        ``,
        `I am your **100% Free Policy Manager - Agent AI Assistant**. You can ask me any query directly in **English, Hindi, or Hinglish**:`,
        `• **Plan Rules & Eligibility:** Jeevan Tarun (734), Jeevan Labh (736), Jeevan Umang (745), Jeevan Utsav (771), New Jeevan Anand (715), Bima Jyoti (760), Dhan Rekha (863), Amritbaal (774), etc.`,
        `• **Instant Premium & Maturity Quotes:** Ask for any age, term, Sum Assured, or rider (AD-DB / PWB).`,
        `• **Customer Objection Handling:** Mutual Fund SIP vs LIC, Tax-Free Maturity u/s 10(10D), Surrender Value, Paid-Up, or 90% Policy Loan rules.`,
        `• **WhatsApp Pitches:** Generate ready-to-send Hindi & English customer explanations.`,
      ].join('\n'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'Free AI Advisor',
    },
  ]);

  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendQuery = async (customPrompt?: string) => {
    const text = (customPrompt ?? queryInput).trim();
    if (!text || loading) return;

    const userMsg: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setQueryInput('');
    setLoading(true);

    try {
      const response = await askLicAiAdvisor({
        prompt: text,
        agentName,
        agencyCode,
        agentMobile,
        policies,
        history: messages,
      });

      const aiMsg: AiChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: response.source === 'gemini-3.8-flash' ? 'Gemini AI (Free)' : 'LIC Actuarial AI',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (msg: AiChatMessage) => {
    const cleanText = msg.content.replace(/\*\*/g, '*');
    navigator.clipboard.writeText(cleanText);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWhatsAppShareUrl = (msg: AiChatMessage) => {
    const cleanText = msg.content.replace(/\*\*/g, '*');
    const footer = `\n\n— *${agentName}*\nSenior Consultant · Policy Manager - Agent (Code: ${agencyCode})\n📞 ${agentMobile}`;
    return `https://wa.me/?text=${encodeURIComponent(cleanText + footer)}`;
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <LicAgentFamilyIcon className="w-11 h-11 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs text-amber-400 font-medium">
              100% Free Forever · Direct LIC Agent Query Assistant
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">
              Policy Manager - Agent — Free AI Advisor
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Ask any question on LIC Plans, Premium Calculation, Jeevan Tarun, Loan/Surrender Rules, or Customer Pitches in English or Hindi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() =>
              setMessages((prev) => (prev.length > 0 ? [prev[0]] : []))
            }
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* 1-Tap Quick LIC Agent Question Prompts */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>1-Tap Popular LIC Agent Queries (Tap to Ask Instantly):</span>
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Supports English, Hindi & Hinglish
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {QUICK_AGENT_AI_PROMPTS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleSendQuery(item.prompt)}
              disabled={loading}
              className="px-3 py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-800 border border-slate-200 hover:border-blue-300 text-slate-800 text-xs font-medium rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Conversation Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-3.5 sm:p-5 space-y-4 max-h-[520px] overflow-y-auto bg-slate-50/60">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-full sm:max-w-[85%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed break-words ${
                    isUser
                      ? 'bg-blue-700 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5 pb-1.5 border-b border-current/10 text-[11px] opacity-80">
                    <span className="font-semibold">
                      {isUser
                        ? `${agentName} (${agencyCode})`
                        : `Policy Manager - Agent AI · ${msg.source || 'Free Advisor'}`}
                    </span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-wrap space-y-1">
                    {msg.content}
                  </div>

                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleCopyMessage(msg)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Answer</span>
                          </>
                        )}
                      </button>

                      <a
                        href={getWhatsAppShareUrl(msg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share on WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center gap-2.5 shadow-xs">
                <RefreshCw className="w-4 h-4 text-blue-700 animate-spin shrink-0" />
                <span>Calculating LIC actuarial & policy response for {agentName}...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Direct Query Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="relative flex-1 min-w-0">
            <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask any LIC plan, premium, maturity, loan, or Hindi pitch query..."
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !queryInput.trim()}
            className="h-11 px-5 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
            <span>Ask Free AI</span>
          </button>
        </form>
      </div>
    </div>
  );
};
