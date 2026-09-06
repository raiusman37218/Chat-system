'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Workspace } from '@/types/database';

/**
 * Shared shell for the public help centre.
 *
 * The index and the article page used to be built independently — one hardcoded
 * zinc colours, the other used the app's design tokens — so moving between them
 * changed the background, the header height and the type scale. Both render
 * through here now, which is also the only place the customer's brand colour is
 * turned into CSS.
 */

/** Reads the workspace's brand colour, falling back to a neutral indigo. */
export function brandOf(workspace: Workspace | null | undefined): string {
  const c = workspace?.brand_color?.trim();
  return c && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c) ? c : '#2E5BFF';
}

/** Header links the owner configured, ignoring malformed rows. */
export function headerLinksOf(
  workspace: Workspace | null | undefined
): { label: string; url: string; target?: string }[] {
  const raw = workspace?.help_center_header_links;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (l: any) => l && typeof l.label === 'string' && typeof l.url === 'string'
  );
}

export function helpTitleOf(workspace: Workspace | null | undefined): string {
  return workspace?.help_center_title || workspace?.name || 'Help Center';
}

/** Opens the embedded chat widget if it has loaded. */
export function openChat() {
  const w = window as unknown as { Chatify?: { open?: () => void } };
  w.Chatify?.open?.();
}

/** Copies text, reporting whether it worked rather than assuming it did. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Minutes to read, from the article body. */
export function readingTime(content: string | null | undefined): string {
  const words = (content || '').trim().split(/\s+/).filter(Boolean).length;
  if (!words) return '1 min read';
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface HelpHeaderProps {
  workspace: Workspace;
  /** Rendered at the far left, before the brand — e.g. a back button. */
  leading?: React.ReactNode;
  /** Rendered just before the configured links — e.g. Share. */
  trailing?: React.ReactNode;
  onHome: () => void;
}

export function HelpHeader({
  workspace,
  leading,
  trailing,
  onHome,
}: HelpHeaderProps) {
  const title = helpTitleOf(workspace);
  const logo = workspace.help_center_logo_url || workspace.logo_url;
  const links = headerLinksOf(workspace);
  const brand = brandOf(workspace);

  // The website link is only shown when the owner actually gave one. It used to
  // fall back to a hardcoded URL belonging to one specific customer, which
  // every other workspace then advertised as its own website.
  const website = workspace.website_url?.trim();

  return (
    <header className="sticky top-0 z-40 bg-[#0b0b0f] border-b border-white/10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center gap-4">
        {leading}

        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2.5 min-w-0 group cursor-pointer"
        >
          {logo ? (
            <img
              src={logo}
              alt=""
              className="w-8 h-8 rounded-lg object-contain shrink-0"
            />
          ) : (
            <span
              className="w-8 h-8 rounded-lg grid place-items-center text-white text-[13px] font-bold shrink-0"
              style={{ backgroundColor: brand }}
            >
              {title.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="text-[15px] font-semibold text-white truncate group-hover:text-white/80 transition-colors">
            {title}
          </span>
        </button>

        <div className="flex-1" />

        <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
          {trailing}

          {links.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target={link.target || '_blank'}
              rel={link.target === '_self' ? undefined : 'noreferrer'}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 h-8 rounded-lg text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              {link.label}
            </a>
          ))}

          {website && links.length === 0 && (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 h-8 rounded-lg text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>Website</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60" />
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}

export function HelpFooter({ workspace }: { workspace: Workspace }) {
  const title = helpTitleOf(workspace);

  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-ink-3">
        <span>
          {workspace.help_center_footer_text ||
            `© ${new Date().getFullYear()} ${title}. All rights reserved.`}
        </span>
        <span className="text-ink-3/80">
          Powered by <span className="font-medium text-ink-2">Chatify</span>
        </span>
      </div>
    </footer>
  );
}

/** The chat widget, loaded once per page. */
export function HelpWidget({ workspace }: { workspace: Workspace }) {
  return (
    <script
      async
      src="/widget.js"
      data-workspace-id={workspace.id}
      data-color={brandOf(workspace)}
      data-title={`${workspace.name} Support`}
    />
  );
}
