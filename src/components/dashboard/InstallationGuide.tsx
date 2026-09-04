'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Palette,
} from 'lucide-react';
import { Workspace } from '@/types/database';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

interface InstallationGuideProps {
  workspace: Workspace | null;
  hasVisitors: boolean;
  latestVisitorUrl?: string;
  /** Rendered inside the Settings hub, which supplies its own page header. */
  embedded?: boolean;
}

type Platform = 'html' | 'wordpress' | 'shopify' | 'react';

const PLATFORM_LABEL: Record<Platform, string> = {
  html: 'HTML',
  wordpress: 'WordPress',
  shopify: 'Shopify',
  react: 'React / Next.js',
};

export function InstallationGuide({
  workspace,
  hasVisitors,
  latestVisitorUrl,
  embedded = false,
}: InstallationGuideProps) {
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform>('html');

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
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

  const GUIDES: Record<Platform, React.ReactNode> = {
    html: (
      <ol className="space-y-2.5">
        {[
          'Open your site\'s main HTML template or master layout file.',
          'Scroll to the bottom and find the closing </body> tag.',
          'Paste the Chatify snippet directly above it.',
          'Save and deploy — the launcher appears for every visitor.',
        ].map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-md bg-surface-3 text-ink-2 text-[11px] font-semibold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-[13px] leading-relaxed text-ink-2">{s}</span>
          </li>
        ))}
      </ol>
    ),
    wordpress: (
      <ol className="space-y-2.5">
        {[
          'Log in to your WordPress admin dashboard.',
          'Install a free header/footer plugin such as WPCode.',
          'Go to Code Snippets → Header & Footer.',
          'Paste the snippet into the Footer box and save.',
        ].map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-md bg-surface-3 text-ink-2 text-[11px] font-semibold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-[13px] leading-relaxed text-ink-2">{s}</span>
          </li>
        ))}
      </ol>
    ),
    shopify: (
      <ol className="space-y-2.5">
        {[
          'Open your Shopify store admin.',
          'Go to Online Store → Themes.',
          'Next to your live theme: Actions (…) → Edit code.',
          'Open theme.liquid, paste above </body>, then Save.',
        ].map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-md bg-surface-3 text-ink-2 text-[11px] font-semibold flex items-center justify-center">
              {i + 1}
            </span>
            <span className="text-[13px] leading-relaxed text-ink-2">{s}</span>
          </li>
        ))}
      </ol>
    ),
    react: (
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-ink-2">
          Render the script from your root{' '}
          <code className="font-mono text-[12px] text-ink">app/layout.tsx</code>{' '}
          using the Next.js Script component:
        </p>
        <pre className="code-block">{`import Script from 'next/script';

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
}`}</pre>
      </div>
    ),
  };

  return (
    <div
      className={cn(
        'flex-1 min-w-0 flex flex-col bg-canvas',
        !embedded && 'h-screen'
      )}
    >
      {!embedded && (
        <header className="shrink-0 px-7 h-16 flex items-center justify-between gap-4 border-b border-line bg-surface">
          <div className="min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight">
              Install the widget
            </h1>
            <p className="text-[12px] text-ink-3 mt-0.5">
              One script tag. Works on any site, no build step required.
            </p>
          </div>

          <span
            className={cn(
              'pill shrink-0',
              hasVisitors ? 'pill-success' : 'pill-warn'
            )}
          >
            {hasVisitors ? (
              <>
                <span className="live-dot" />
                Connected — receiving traffic
              </>
            ) : (
              'Awaiting first visit'
            )}
          </span>
        </header>
      )}

      <div className={cn('flex-1 p-7', !embedded && 'overflow-y-auto')}>
        <div className="max-w-3xl space-y-6">
          {/* Workspace summary */}
          <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4 min-w-0">
              <Avatar
                name={workspace?.name || 'W'}
                seed={workspace?.id || 'workspace'}
                color={workspace?.brand_color || undefined}
                size="md"
              />
              <div className="min-w-0">
                <h2 className="text-[14px] font-semibold truncate">
                  {workspace?.name || 'My workspace'}
                </h2>
                <div className="mt-1 flex items-center gap-3 flex-wrap text-[12px] text-ink-3">
                  {workspace?.website_url && (
                    <span className="inline-flex items-center gap-1.5 truncate">
                      <Globe className="w-3.5 h-3.5" />
                      {workspace.website_url}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-line"
                      style={{
                        backgroundColor: workspace?.brand_color || '#2e5bff',
                      }}
                    />
                    <span className="font-mono uppercase">
                      {workspace?.brand_color || '#2e5bff'}
                    </span>
                  </span>
                  <span className="font-mono truncate">
                    id: {workspaceId.slice(0, 13)}…
                  </span>
                </div>
              </div>
            </div>

            <a
              href={`/demo.html?workspaceId=${workspaceId}&name=${encodeURIComponent(workspace?.name || '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-secondary shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open demo site
            </a>
          </div>

          {/* Snippet */}
          <div>
            <div className="flex items-baseline justify-between mb-2.5">
              <h2 className="text-[14px] font-semibold">Your embed code</h2>
              <button onClick={copyCode} className="btn btn-sm btn-primary">
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy snippet
                  </>
                )}
              </button>
            </div>

            <pre className="code-block">{embedScript}</pre>

            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-3">
              Paste it immediately before the closing{' '}
              <code className="font-mono text-ink-2">&lt;/body&gt;</code> or{' '}
              <code className="font-mono text-ink-2">&lt;/head&gt;</code> tag on
              every page that should offer live support.
            </p>
          </div>

          {/* Platform guides */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
              <h2 className="text-[14px] font-semibold">
                Platform-specific steps
              </h2>
              <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-2 border border-line">
                {(Object.keys(PLATFORM_LABEL) as Platform[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setActivePlatform(p)}
                    className={cn(
                      'h-7 px-3 rounded-md text-[12px] font-medium transition-colors',
                      activePlatform === p
                        ? 'bg-surface text-ink shadow-xs'
                        : 'text-ink-3 hover:text-ink'
                    )}
                  >
                    {PLATFORM_LABEL[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-5">{GUIDES[activePlatform]}</div>
          </div>

          {/* Verify */}
          <div className="panel p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-2.5 min-w-0">
              <Check
                className={cn(
                  'w-4 h-4 mt-px shrink-0',
                  hasVisitors ? 'text-success' : 'text-ink-3'
                )}
              />
              <span className="text-[12.5px] leading-relaxed text-ink-2 min-w-0">
                {hasVisitors ? (
                  <>
                    Traffic detected on{' '}
                    <span className="font-mono text-ink">
                      {latestVisitorUrl || 'your site'}
                    </span>
                  </>
                ) : (
                  'No traffic yet. Open the simulator to verify your install in seconds.'
                )}
              </span>
            </div>

            <a
              href={`/demo.html?workspaceId=${workspaceId}&name=${encodeURIComponent(
                workspace?.name || 'Workspace'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm btn-secondary shrink-0"
            >
              Test in simulator
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
