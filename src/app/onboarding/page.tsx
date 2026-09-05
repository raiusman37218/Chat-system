'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Send,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';
import { cleanDomain, getDefaultSubdomain } from '@/lib/domain';

const PRESET_COLORS = [
  { name: 'Electric Blue', hex: '#2e5bff' },
  { name: 'Deep Ink', hex: '#0b0b0f' },
  { name: 'Jade', hex: '#0f9d76' },
  { name: 'Violet', hex: '#7c5cff' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber', hex: '#d97706' },
];

const STEP_LABELS = ['Business', 'Branding', 'Install'] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#2e5bff');
  const [greetingTitle, setGreetingTitle] = useState('Support Team');
  const [greetingMessage, setGreetingMessage] = useState(
    'We typically reply in under 5 minutes'
  );

  // Created Workspace State
  const [createdWorkspaceId, setCreatedWorkspaceId] = useState<string | null>(null);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login');
      }
    });
  }, [supabase, router]);

  const handleCreateWorkspace = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Generate slug and default help subdomain
      const cleanWeb = cleanDomain(websiteUrl);
      const baseSlug = (businessName || 'workspace')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'workspace';
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      const customDomain = cleanWeb ? `help.${cleanWeb}` : null;
      const verificationToken = `chatify_tok_${Math.random().toString(36).substring(2, 10)}`;

      // 1. Create Workspace
      const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .insert({
          name: businessName,
          website_url: websiteUrl || null,
          brand_color: brandColor,
          greeting_title: greetingTitle,
          greeting_message: greetingMessage,
          owner_id: session.user.id,
          slug,
          custom_domain: customDomain,
          custom_domain_status: 'pending',
          custom_domain_verification_token: verificationToken,
        })
        .select()
        .single();

      if (wsError || !ws) {
        throw wsError || new Error('Failed to create workspace');
      }

      // 2. Link current agent to workspace
      await supabase
        .from('agents')
        .update({
          workspace_id: ws.id,
          role: 'owner',
        })
        .eq('id', session.user.id);

      setCreatedWorkspaceId(ws.id);
      setStep(3);
    } catch (err: any) {
      console.error('Error creating workspace:', err);
      alert(err.message || 'Failed to create workspace. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getEmbedSnippet = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    return `<!-- Chatify Live Chat Support -->
<script
  src="${origin}/widget.js"
  data-workspace-id="${createdWorkspaceId || 'YOUR_WORKSPACE_ID'}"
  defer>
</script>`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getEmbedSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="border-b border-line">
        <div className="u-container h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size={32} />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-3xl">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-10">
            {STEP_LABELS.map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const done = step > n;
              const current = step === n;
              return (
                <React.Fragment key={label}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${
                        done
                          ? 'bg-success text-white'
                          : current
                          ? 'bg-ink text-ink-inv'
                          : 'bg-surface-3 text-ink-3'
                      }`}
                    >
                      {done ? <Check className="w-3.5 h-3.5" /> : n}
                    </span>
                    <span
                      className={`text-[13px] font-medium ${
                        current ? 'text-ink' : 'text-ink-3'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEP_LABELS.length - 1 && (
                    <span
                      className={`flex-1 h-px ${
                        step > n ? 'bg-success' : 'bg-line-2'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* STEP 1: Business Info */}
          {step === 1 && (
            <div className="animate-rise">
              <h1 className="text-[1.9rem] leading-tight font-semibold">
                Tell us about your business
              </h1>
              <p className="mt-2 text-[14.5px] text-ink-2">
                We&apos;ll provision a dedicated, isolated workspace for your
                conversations.
              </p>

              <div className="mt-8 card p-7 space-y-5">
                <div>
                  <label htmlFor="biz" className="field-label">
                    Company name <span className="text-danger">*</span>
                  </label>
                  <input
                    id="biz"
                    type="text"
                    required
                    placeholder="Northwind Studio"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (!greetingTitle || greetingTitle === 'Support Team') {
                        setGreetingTitle(`${e.target.value} Support`);
                      }
                    }}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="site" className="field-label">
                    Website URL
                  </label>
                  <input
                    id="site"
                    type="url"
                    placeholder="https://northwind.com"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    className="input"
                  />
                  <p className="mt-1.5 text-[12px] text-ink-3">
                    Where the chat widget will live. You can change this later.
                  </p>

                  {websiteUrl && cleanDomain(websiteUrl) && (
                    <div className="mt-3.5 p-3.5 rounded-xl bg-accent-soft/40 border border-accent-line/60 flex items-center justify-between text-xs animate-in fade-in">
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <span className="text-[10.5px] font-bold text-accent uppercase tracking-wider block">
                            Public Help Center Domain
                          </span>
                          <span className="font-mono text-[12.5px] text-ink font-semibold">
                            https://{getDefaultSubdomain(websiteUrl)}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent whitespace-nowrap">
                        Workspace Scoped
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!businessName.trim()}
                  onClick={() => setStep(2)}
                  className="btn btn-lg btn-primary"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Branding */}
          {step === 2 && (
            <div className="animate-rise">
              <h1 className="text-[1.9rem] leading-tight font-semibold">
                Make it look like you
              </h1>
              <p className="mt-2 text-[14.5px] text-ink-2">
                Everything below updates the preview in real time.
              </p>

              <div className="mt-8 grid md:grid-cols-[1fr_280px] gap-6 items-start">
                <div className="card p-7 space-y-6">
                  <div>
                    <span className="field-label">Brand colour</span>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setBrandColor(c.hex)}
                          title={c.name}
                          aria-label={c.name}
                          aria-pressed={brandColor === c.hex}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 ${
                            brandColor === c.hex
                              ? 'ring-2 ring-offset-2 ring-ink ring-offset-[var(--ds-surface)]'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {brandColor === c.hex && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </button>
                      ))}

                      <label className="flex items-center gap-2 h-9 px-2.5 rounded-lg border border-line-2 bg-surface-2 cursor-pointer">
                        <input
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded p-0"
                          aria-label="Custom brand colour"
                        />
                        <span className="font-mono text-[12px] text-ink-2 uppercase">
                          {brandColor}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gt" className="field-label">
                      Messenger title
                    </label>
                    <input
                      id="gt"
                      type="text"
                      value={greetingTitle}
                      onChange={(e) => setGreetingTitle(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div>
                    <label htmlFor="gm" className="field-label">
                      Subtitle
                    </label>
                    <input
                      id="gm"
                      type="text"
                      value={greetingMessage}
                      onChange={(e) => setGreetingMessage(e.target.value)}
                      className="input"
                    />
                  </div>
                </div>

                {/* Live preview */}
                <div className="panel p-4">
                  <div className="eyebrow mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Live preview
                  </div>

                  <div className="rounded-2xl border border-line bg-surface shadow-lg overflow-hidden">
                    <div
                      className="px-4 pt-4 pb-5 text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[12px] font-bold mb-2.5">
                        {greetingTitle.charAt(0) || 'S'}
                      </div>
                      <div className="text-[14px] font-semibold leading-tight truncate">
                        {greetingTitle || 'Support Team'}
                      </div>
                      <div className="text-[11px] opacity-80 mt-0.5 line-clamp-2">
                        {greetingMessage}
                      </div>
                    </div>

                    <div className="p-3 space-y-2 min-h-[128px] flex flex-col justify-end">
                      <div className="self-start max-w-[85%] rounded-2xl rounded-bl-md bg-surface-2 border border-line px-3 py-2 text-[11.5px] leading-relaxed">
                        Hi! How can we help today?
                      </div>
                      <div
                        className="self-end max-w-[85%] rounded-2xl rounded-br-md px-3 py-2 text-[11.5px] leading-relaxed text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        A question about your plans!
                      </div>
                    </div>

                    <div className="p-2.5 border-t border-line flex items-center gap-2">
                      <div className="flex-1 h-8 rounded-lg border border-line bg-surface-2 flex items-center px-2.5 text-[11px] text-ink-3">
                        Type a message…
                      </div>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: brandColor }}
                      >
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[11.5px] text-ink-3">Launcher</span>
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center p-2.5 shadow-lg transition-transform hover:scale-105"
                      style={{ backgroundColor: brandColor }}
                    >
                      <img
                        src="/chat-icon-white.png"
                        alt="Chat"
                        className="w-full h-full object-contain filter drop-shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-ghost"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCreateWorkspace}
                  className="btn btn-lg btn-primary"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin-slow" />
                      Creating workspace…
                    </>
                  ) : (
                    <>
                      Create workspace
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Install */}
          {step === 3 && (
            <div className="animate-rise">
              <div className="w-11 h-11 rounded-xl bg-success-soft border border-success-line text-success flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <h1 className="mt-5 text-[1.9rem] leading-tight font-semibold">
                {businessName} is ready
              </h1>
              <p className="mt-2 text-[14.5px] text-ink-2 max-w-lg">
                Paste this snippet on your site — anywhere before the closing{' '}
                <code className="font-mono text-[13px] text-ink">
                  &lt;/body&gt;
                </code>{' '}
                tag — and live chat is on.
              </p>

              <div className="mt-8 card overflow-hidden">
                <div className="h-11 px-4 flex items-center justify-between border-b border-line bg-surface-2">
                  <span className="font-mono text-[11.5px] text-ink-3">
                    Embed code
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="btn btn-sm btn-secondary"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-success" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="code-block rounded-none border-0">
                  {getEmbedSnippet()}
                </pre>
              </div>

              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                {[
                  {
                    h: 'WordPress',
                    b: 'Use any "Insert Headers and Footers" plugin, or your child theme\'s footer.php.',
                  },
                  {
                    h: 'Shopify',
                    b: 'Online Store → Themes → Edit code → paste before </body> in theme.liquid.',
                  },
                  {
                    h: 'Next.js / React',
                    b: 'Add a <Script src="…" /> tag inside your root layout.tsx.',
                  },
                ].map((c) => (
                  <div key={c.h} className="panel p-4">
                    <div className="text-[13px] font-semibold">{c.h}</div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
                      {c.b}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                <a
                  href={`/demo.html?workspaceId=${createdWorkspaceId || ''}&name=${encodeURIComponent(businessName)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary w-full sm:w-auto"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Test in simulator
                </a>

                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="btn btn-lg btn-primary w-full sm:w-auto"
                >
                  Go to inbox
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
