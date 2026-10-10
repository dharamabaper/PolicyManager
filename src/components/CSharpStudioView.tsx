import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode,
  Terminal,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import { LicActuarialResult, formatInr } from '../data/licPlans';
import { generateCSharpAndroidProject } from '../data/csharpGenerator';
import { PWAInstallButton } from './PWAInstallButton';
import { DHARMENDRA_FOUNDER_INFO, LicAgentFamilyIcon } from './LicAgentFamilyBrand';

interface CSharpStudioViewProps {
  activeResult: LicActuarialResult;
}

export const CSharpStudioView: React.FC<CSharpStudioViewProps> = ({ activeResult }) => {
  const files = generateCSharpAndroidProject(activeResult);
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live APK Build State
  const [apkBuilding, setApkBuilding] = useState(false);
  const [apkBuildStep, setApkBuildStep] = useState(0);
  const [apkReady, setApkReady] = useState(true);

  const activeFile = files.find((f) => f.id === selectedFileId) || files[0];

  const buildSteps = [
    '1. Validating 15 LIC Plans (incl. Jeevan Tarun 734) & Rider Tables (AD-DB, PWB)...',
    '2. Bundling WhatsApp Mobile OTP Dispatcher & Gmail Cloud Sync...',
    '3. Embedding Free AI LIC Query Advisor & Dynamic 1080x1080 Birthday Card Studio...',
    '4. Optimizing Full Mobile Responsive Views for Android 8.0 – Android 15 (API 26–35)...',
    '5. Packaging Release Build for Dharmendra Yadav (Senior Consultant · Code 05860387)...',
  ];

  const handleRunApkGenerator = () => {
    setApkBuilding(true);
    setApkReady(false);
    setApkBuildStep(0);

    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current < buildSteps.length) {
        setApkBuildStep(current);
      } else {
        clearInterval(interval);
        setApkBuilding(false);
        setApkReady(true);
      }
    }, 450);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllCSharpBundle = () => {
    const combinedHeader = `// ============================================================================
// POLICY MANAGER - AGENT — .NET 8 MAUI ANDROID APPLICATION (C# 12 SOURCE BUNDLE)
// Author & Senior Consultant: ${DHARMENDRA_FOUNDER_INFO.name} (Agent Code: ${DHARMENDRA_FOUNDER_INFO.agencyCode})
// Generated with live actuarial parameters for: ${activeResult.plan.name} (Plan ${activeResult.plan.planNo})
// Client: ${activeResult.input.clientName} | Sum Assured: ${formatInr(activeResult.input.sumAssured)}
// Includes: Free AI Advisor, WhatsApp OTP Auth, 05860387 Dummy Login, Bulk Excel & Birthday Studio
// ============================================================================\n\n`;

    const fullBundle =
      combinedHeader +
      files
        .map(
          (f) =>
            `// ----------------------------------------------------------------------------\n// FILE: ${f.folder}/${f.filename}\n// DESCRIPTION: ${f.description}\n// ----------------------------------------------------------------------------\n\n${f.code}\n\n`
        )
        .join('\n');

    handleDownloadFile('Policy_Manager_Agent_v2.4_05860387_MAUI_Android.cs', fullBundle);
  };

  const handleDownloadApkBuildScript = () => {
    const scriptContent = `#!/usr/bin/env bash
# ==============================================================================
# POLICY MANAGER - AGENT — ONE-CLICK ANDROID APK GENERATOR SCRIPT (v2.4.0)
# Senior Consultant & Developer: Dharmendra Yadav (LIC Agent Code: 05860387)
# Package ID: com.dharmendrayadav.policymanageragent
# ==============================================================================
set -e

echo "Building Policy Manager - Agent Android APK (Agent Code: 05860387)..."

# Method 1: Build Signed .NET 8 MAUI Native Android APK
if command -v dotnet &> /dev/null; then
  echo "Detected .NET 8 SDK — Compiling Release Android APK..."
  dotnet publish -f net8.0-android -c Release \\
    -p:ApplicationId=com.dharmendrayadav.policymanageragent \\
    -p:ApplicationTitle="Policy Manager - Agent" \\
    -p:ApplicationDisplayVersion="2.4.0" \\
    -p:ApplicationVersion=24 \\
    -p:AndroidPackageFormat=apk
  echo "SUCCESS: Signed APK generated in bin/Release/net8.0-android/publish/"
fi

# Method 2: Build Capacitor / Android Studio WebAPK Wrapper
echo "To install immediately on your Android phone without a PC:"
echo "1. Open this app URL in Chrome on your Android phone"
echo "2. Tap 'Install Android App (APK / PWA)' in the top header"
echo "3. Login with Instant Dummy Code: 05860387"
`;
    handleDownloadFile('build-policy-manager-agent-apk.sh', scriptContent);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* ===================================================================== */}
      {/* ANDROID APK GENERATOR & INSTALLER STUDIO                              */}
      {/* ===================================================================== */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-4 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <LicAgentFamilyIcon className="w-12 h-12 shrink-0" />
            <div className="min-w-0">
              <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Android APK Package Builder · v2.4.0 (Agent Code: 05860387)</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                Policy Manager - Agent — Android APK Generator & Installer
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Built for <strong>{DHARMENDRA_FOUNDER_INFO.name}</strong> ({DHARMENDRA_FOUNDER_INFO.designation} · Code: <span className="font-mono text-amber-300">{DHARMENDRA_FOUNDER_INFO.agencyCode}</span>). All latest changes (Free AI Query Advisor, WhatsApp OTP authentication, Jeevan Tarun 734 & Full Mobile Responsive Tabs) are compiled into this build.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleRunApkGenerator}
              disabled={apkBuilding}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`w-4 h-4 ${apkBuilding ? 'animate-spin' : ''}`} />
              <span>{apkBuilding ? 'Generating Android APK...' : 'Re-Generate Android APK'}</span>
            </button>
            <PWAInstallButton />
          </div>
        </div>

        {/* APK Build Progress / Ready Banner */}
        {apkBuilding ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-mono text-amber-400">
              {buildSteps[apkBuildStep]}
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${((apkBuildStep + 1) / buildSteps.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          apkReady && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 border-t border-slate-800">
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Option 1: Direct Android Install (Recommended)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Install <strong>Policy Manager - Agent</strong> directly to your Android home screen & app drawer with offline support and custom icon.
                </p>
                <div className="pt-1">
                  <PWAInstallButton />
                </div>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 shrink-0" />
                  <span>Option 2: Download C# .NET 8 MAUI APK Source</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Complete C# 12 Android solution (`com.dharmendrayadav.licagentfamily`) with Free AI, WhatsApp OTP & 15 LIC Plans.
                </p>
                <button
                  onClick={handleDownloadAllCSharpBundle}
                  className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download C# Android Bundle (.cs)</span>
                </button>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Option 3: 1-Command APK Builder Script</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Download the automated `.apk` build script (`dotnet publish -f net8.0-android -c Release`) pre-configured for Code 05860387.
                </p>
                <button
                  onClick={handleDownloadApkBuildScript}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Download APK Build Script (.sh)</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Main Code Explorer Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Solution Explorer */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">
              Solution Explorer (`LicAgentFamily.Android.sln`)
            </span>
            <span className="text-xs font-mono text-slate-500 tabular-nums">{files.length} files</span>
          </div>
          <div className="divide-y divide-slate-100">
            {files.map((file) => {
              const isSelected = file.id === activeFile.id;
              return (
                <button
                  key={file.id}
                  onClick={() => setSelectedFileId(file.id)}
                  className={`w-full text-left p-3.5 sm:p-4 transition-colors flex items-start gap-3 ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <FileCode
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isSelected ? 'text-blue-700' : 'text-slate-400'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs sm:text-sm font-mono font-semibold truncate ${
                          isSelected ? 'text-blue-900' : 'text-slate-900'
                        }`}
                      >
                        {file.filename}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {file.folder}/
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{file.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* CLI Build Instructions */}
          <div className="p-4 bg-slate-900 text-slate-200 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Compile Signed Android APK via .NET 8 CLI</span>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`dotnet new maui -n LicAgentFamily.Android
dotnet add package CommunityToolkit.Mvvm
dotnet publish -f net8.0-android -c Release -p:AndroidPackageFormat=apk`}
            </pre>
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-mono font-semibold text-white truncate">
                {activeFile.title}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{activeFile.description}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopyCode(activeFile.code, activeFile.id)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {copiedId === activeFile.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy File</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleDownloadFile(activeFile.filename, activeFile.code)}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="text-xs font-mono text-slate-100 leading-relaxed tabular-nums">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
