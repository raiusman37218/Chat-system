'use client';

import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  Palette
} from 'lucide-react';
import { Workspace } from '@/types/database';

interface InstallationGuideProps {
  workspace: Workspace | null;
  hasVisitors: boolean;
  latestVisitorUrl?: string;
}

export function InstallationGuide({ workspace, hasVisitors, latestVisitorUrl }: InstallationGuideProps) {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'html' | 'wordpress' | 'shopify' | 'react'>('html');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const workspaceId = workspace?.id || 'YOUR_WORKSPACE_ID';

  const embedScript = `<!-- Chatify Live Chat Support -->
<script 
  src="${origin}/widget.js" 
  data-workspace-id="${workspaceId}" 
  defer>
</script>`;

  const copyCode = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b101d] overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-800/80 bg-[#0d1424] flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Widget Installation &amp; Embed Code</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
              1-Line Setup
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Integrate live chat on your website. Paste the snippet once and we handle the rest.
          </p>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2">
          {hasVisitors ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Widget Connected &amp; Receiving Traffic</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Awaiting First Website Visit</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8 max-w-4xl space-y-6">
        {/* Workspace Card Summary */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
              style={{ backgroundColor: workspace?.brand_color || '#2563eb' }}
            >
              {workspace?.name?.charAt(0) || 'W'}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{workspace?.name || 'My Business Workspace'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  ID: {workspaceId.slice(0, 13)}...
                </span>
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                {workspace?.website_url && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-slate-500" />
                    <span>{workspace.website_url}</span>
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: workspace?.brand_color || '#2563eb' }} />
                  <span className="font-mono">{workspace?.brand_color || '#2563eb'}</span>
                </span>
              </div>
            </div>
          </div>

          <a
            href={`/demo.html`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Demo Site</span>
          </a>
        </div>

        {/* 1-Line Embed Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-400" />
              <span>Your Unique Website Embed Code</span>
            </label>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Snippet'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="p-4 bg-[#070b14] border border-slate-700/80 rounded-xl text-xs font-mono text-blue-300 overflow-x-auto leading-relaxed selection:bg-blue-600 selection:text-white">
              {embedScript}
            </pre>
          </div>
          <p className="text-[11px] text-slate-400">
            Paste this snippet immediately before the closing <code className="text-slate-300 font-mono">&lt;/body&gt;</code> or <code className="text-slate-300 font-mono">&lt;/head&gt;</code> tag on any webpage where you want live support.
          </p>
        </div>

        {/* CMS / Platform Guides Tabs */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Platform-Specific Integration Guides
            </h4>
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              {(['html', 'wordpress', 'shopify', 'react'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setActivePlatform(p)}
                  className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                    activePlatform === p ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === 'react' ? 'React / Next.js' : p}
                </button>
              ))}
            </div>
          </div>

          {/* Guide Content */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 text-xs space-y-3">
            {activePlatform === 'html' && (
              <div className="space-y-2">
                <h5 className="font-bold text-white text-sm">Static HTML / Custom Web Applications</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>Open your website&apos;s main HTML template or master layout file.</li>
                  <li>Scroll down to the bottom of the file to find the closing <code className="text-blue-400 font-mono">&lt;/body&gt;</code> tag.</li>
                  <li>Paste your unique Chatify snippet directly above the <code className="text-blue-400 font-mono">&lt;/body&gt;</code> tag.</li>
                  <li>Save and deploy. The floating chat bubble will appear automatically for all visitors.</li>
                </ol>
              </div>
            )}

            {activePlatform === 'wordpress' && (
              <div className="space-y-2">
                <h5 className="font-bold text-white text-sm">WordPress Installation</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>Log in to your WordPress Admin Dashboard.</li>
                  <li>Go to <strong>Plugins &gt; Add New</strong> and install the free plugin <em>&quot;WPCode&quot;</em> or <em>&quot;Insert Headers and Footers&quot;</em>.</li>
                  <li>Navigate to <strong>Code Snippets &gt; Header &amp; Footer</strong>.</li>
                  <li>Paste your Chatify embed snippet into the <strong>Footer</strong> box.</li>
                  <li>Click <strong>Save Changes</strong>. Your WordPress site is now connected!</li>
                </ol>
              </div>
            )}

            {activePlatform === 'shopify' && (
              <div className="space-y-2">
                <h5 className="font-bold text-white text-sm">Shopify Storefront</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed">
                  <li>Log in to your Shopify store admin.</li>
                  <li>Click on <strong>Online Store &gt; Themes</strong>.</li>
                  <li>Next to your current live theme, click <strong>Actions (...) &gt; Edit code</strong>.</li>
                  <li>In the left sidebar, click on <code className="text-blue-400 font-mono">theme.liquid</code> under Layout.</li>
                  <li>Search for the closing <code className="text-blue-400 font-mono">&lt;/body&gt;</code> tag and paste your snippet directly above it.</li>
                  <li>Click <strong>Save</strong>.</li>
                </ol>
              </div>
            )}

            {activePlatform === 'react' && (
              <div className="space-y-2">
                <h5 className="font-bold text-white text-sm">Next.js 14/15 App Router</h5>
                <p className="text-slate-400">
                  Inside your root <code className="text-blue-400 font-mono">app/layout.tsx</code>, import Next.js Script:
                </p>
                <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-200 border border-slate-800">
{`import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="${origin}/widget.js"
          data-workspace-id="${workspaceId}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Live Verification box */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              {hasVisitors
                ? `Last visitor connection detected: ${latestVisitorUrl || 'Live Site'}`
                : 'Waiting for traffic. Open your website after installing the code to verify connection.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
