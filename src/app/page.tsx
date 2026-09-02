import Link from 'next/link';
import Script from 'next/script';
import {
  ArrowRight,
  Blocks,
  Check,
  Code2,
  Fingerprint,
  Gauge,
  Layers,
  MessageSquare,
  MousePointerClick,
  Palette,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ProductShowcase } from '@/components/marketing/ProductShowcase';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Logo } from '@/components/ui/Logo';

const PLATFORMS = [
  'WordPress',
  'Shopify',
  'Webflow',
  'Next.js',
  'Framer',
  'Squarespace',
  'Laravel',
  'Wix',
];

const STEPS = [
  {
    n: '01',
    title: 'Create your workspace',
    body: 'Name your business, add your site, pick a brand colour. Your agent profile is provisioned automatically.',
    detail: (
      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-ink-3">workspace</span>
          <span className="text-ink">Northwind</span>
        </div>
        <div className="flex justify-between">
          <span className="text-ink-3">owner</span>
          <span className="text-ink">alex@northwind.com</span>
        </div>
      </div>
    ),
  },
  {
    n: '02',
    title: 'Make it look like you',
    body: 'Brand colour, greeting, reply-time promise and launcher position — all previewed live before you publish.',
    detail: (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-ink-3">Brand</span>
          <span className="flex items-center gap-1.5 font-mono text-ink">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            #2E5BFF
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-ink-3">Greeting</span>
          <span className="text-ink">Hi there 👋</span>
        </div>
      </div>
    ),
  },
  {
    n: '03',
    title: 'Paste one line, go live',
    body: 'Drop the script tag anywhere in your site. The launcher appears for every visitor, instantly.',
    detail: (
      <div className="font-mono text-[10.5px] text-ink-2 truncate">
        &lt;script src=&quot;…/widget.js&quot; data-workspace-id=&quot;…&quot;&gt;
      </div>
    ),
  },
];

const FACTS = [
  { value: '1', label: 'line of code to install' },
  { value: '<1s', label: 'realtime message delivery' },
  { value: '100%', label: 'CSS-isolated via Shadow DOM' },
  { value: '∞', label: 'agent seats per workspace' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* ───────────────────────── Navigation ───────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-line glass">
        <div className="u-container h-16 flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center shrink-0">
            <Logo size={34} />
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-[13px] font-medium">
            {[
              ['Product', '#product'],
              ['How it works', '#how'],
              ['Install', '#install'],
            ].map(([label, href]) => (
              <a
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors"
              >
                {label}
              </a>
            ))}
            <a
              href="/demo.html"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors inline-flex items-center gap-1.5"
            >
              Live demo
              <span className="live-dot" />
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle className="hidden sm:inline-flex" />
            <Link
              href="/login"
              className="hidden sm:inline-flex btn btn-sm btn-ghost"
            >
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-sm btn-primary">
              Get started
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ───────────────────────── Hero ───────────────────────── */}
        <section className="relative aurora overflow-hidden">
          <div className="absolute inset-0 grid-lines pointer-events-none" />

          <div className="u-container relative pt-20 pb-16 sm:pt-28 sm:pb-20">
            <div className="max-w-3xl mx-auto text-center">
              <div className="animate-rise inline-flex items-center gap-2 h-7 pl-1.5 pr-3 rounded-full border border-line bg-surface shadow-xs text-[12px] font-medium text-ink-2">
                <span className="inline-flex items-center h-5 px-2 rounded-full bg-ink text-ink-inv text-[10px] font-bold tracking-wide">
                  NEW
                </span>
                Live visitor radar is here
              </div>

              <h1 className="animate-rise delay-1 mt-7 text-[2.6rem] leading-[1.05] sm:text-6xl sm:leading-[1.03] font-semibold text-ink">
                Live chat your customers
                <br className="hidden sm:block" />{' '}
                <span className="text-gradient">actually want to use.</span>
              </h1>

              <p className="animate-rise delay-2 mt-6 mx-auto max-w-xl text-[16.5px] leading-relaxed text-ink-2">
                See who&apos;s on your site right now, talk to them in one shared
                inbox, and answer before they leave. Add it to any website with a
                single line of code.
              </p>

              <div className="animate-rise delay-3 mt-9 mx-auto max-w-md">
                <form
                  action="/signup"
                  method="GET"
                  className="flex items-center gap-1.5 p-1.5 rounded-2xl border border-line-2 bg-surface shadow-md focus-within:border-accent focus-within:shadow-lg transition-all"
                >
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@company.com"
                    aria-label="Work email"
                    className="flex-1 min-w-0 bg-transparent px-3 text-[14px] text-ink placeholder:text-ink-3 focus:outline-none"
                  />
                  <button type="submit" className="btn btn-primary shrink-0">
                    Start free
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-ink-3">
                  {['No credit card', 'Free forever tier', 'Live in 2 minutes'].map(
                    (t) => (
                      <span key={t} className="inline-flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-success" />
                        {t}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Product visual */}
            <div className="animate-rise delay-4 mt-16 sm:mt-20 max-w-5xl mx-auto">
              <ProductShowcase />
            </div>
          </div>
        </section>

        {/* ───────────────────────── Platform strip ───────────────────────── */}
        <section className="border-y border-line bg-canvas-alt py-7 overflow-hidden">
          <p className="text-center eyebrow mb-5">
            Drops into any stack — no plugin required
          </p>
          <div
            className="relative flex overflow-hidden"
            style={{
              maskImage:
                'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
              WebkitMaskImage:
                'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
            }}
          >
            <div className="marquee-track flex shrink-0 items-center gap-12 pr-12">
              {[...PLATFORMS, ...PLATFORMS].map((p, i) => (
                <span
                  key={`${p}-${i}`}
                  className="text-[17px] font-semibold tracking-tight text-ink-3 whitespace-nowrap"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── Features (bento) ───────────────────────── */}
        <section id="product" className="u-container py-20 sm:py-28">
          <div className="max-w-2xl">
            <span className="eyebrow">The product</span>
            <h2 className="mt-3 text-3xl sm:text-[2.6rem] leading-[1.1] font-semibold">
              Everything a support team needs.
              <br />
              <span className="text-ink-3">Nothing it doesn&apos;t.</span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Hero cell: live visitors */}
            <div className="lg:col-span-2 card card-hover p-7 flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-md">
                  <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent-line text-accent flex items-center justify-center mb-4">
                    <Radio className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    Watch your site breathe
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                    Every visitor, live: the exact page they&apos;re reading, how
                    long they&apos;ve been there, their device and location.
                    Start the conversation before they bounce.
                  </p>
                </div>
                <span className="pill pill-success shrink-0">
                  <span className="live-dot" />
                  Realtime
                </span>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-2.5">
                {[
                  {
                    n: 'Maya C.',
                    url: '/pricing',
                    meta: 'Berlin · Chrome · 4m 12s',
                    live: true,
                  },
                  {
                    n: 'Anonymous',
                    url: '/docs/webhooks',
                    meta: 'Lahore · Safari · 47s',
                    live: true,
                  },
                ].map((v) => (
                  <div
                    key={v.url}
                    className="panel p-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center text-[11px] font-semibold text-ink-2">
                      {v.n.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-semibold truncate">
                          {v.n}
                        </span>
                        {v.live && <span className="live-dot" />}
                      </div>
                      <div className="text-[10.5px] text-ink-3 truncate font-mono">
                        {v.url}
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-3 shrink-0 hidden sm:block">
                      {v.meta.split(' · ')[2]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget preview cell */}
            <div className="card card-hover p-7 flex flex-col overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-accent-soft border border-accent-line text-accent flex items-center justify-center mb-4">
                <Palette className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-lg font-semibold">Yours, not ours</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                Colour, copy, avatar and position — the messenger inherits your
                brand, not a vendor&apos;s.
              </p>

              <div className="mt-6 -mb-14 mx-auto w-[236px] rounded-2xl border border-line bg-surface shadow-lg overflow-hidden">
                <div className="px-4 pt-4 pb-5 bg-invert text-invert-ink">
                  <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-[11px] font-bold mb-3">
                    N
                  </div>
                  <div className="text-[15px] font-semibold">Hi there 👋</div>
                  <div className="text-[11px] opacity-70 mt-0.5">
                    How can we help today?
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <div className="rounded-xl border border-line bg-surface-2 p-2.5">
                    <div className="text-[11.5px] font-semibold">
                      Send us a message
                    </div>
                    <div className="text-[10px] text-ink-3 mt-0.5">
                      Typically replies in 5m
                    </div>
                  </div>
                  <div className="h-8 rounded-xl border border-line bg-surface-2 flex items-center px-2.5 text-[10.5px] text-ink-3">
                    Search for help…
                  </div>
                </div>
              </div>
            </div>

            {/* Small cells */}
            {[
              {
                Icon: Zap,
                title: 'Sub-second delivery',
                body: 'Postgres change streams over WebSockets. Typing indicators and read receipts included.',
              },
              {
                Icon: ShieldCheck,
                title: 'Tenant isolation',
                body: 'Row-level security scopes every conversation, visitor and agent to one workspace.',
              },
              {
                Icon: Layers,
                title: 'Shadow DOM sandbox',
                body: 'The widget carries its own style tree. No host stylesheet can reach in and break it.',
              },
            ].map(({ Icon, title, body }) => (
              <div key={title} className="card card-hover p-6">
                <div className="w-9 h-9 rounded-xl bg-surface-2 border border-line text-ink-2 flex items-center justify-center mb-4">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-[15px] font-semibold">{title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">
                  {body}
                </p>
              </div>
            ))}

            {/* Wide cell: agent tooling */}
            <div className="lg:col-span-3 card card-hover p-7">
              <div className="grid lg:grid-cols-[1fr_auto] gap-8 items-center">
                <div className="max-w-lg">
                  <div className="w-9 h-9 rounded-xl bg-surface-2 border border-line text-ink-2 flex items-center justify-center mb-4">
                    <Blocks className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-lg font-semibold">
                    Built for the person doing the replying
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
                    Saved replies behind a <span className="kbd">#</span>{' '}
                    shortcut, private team notes the customer never sees,
                    priority and tags, assignment, and a CSAT rating collected
                    the moment you resolve.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  {[
                    { l: 'Saved replies', I: Sparkles },
                    { l: 'Internal notes', I: Fingerprint },
                    { l: 'Priority & tags', I: MousePointerClick },
                    { l: 'CSAT ratings', I: Gauge },
                  ].map(({ l, I }) => (
                    <span
                      key={l}
                      className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl border border-line bg-surface-2 text-[12.5px] font-medium text-ink-2"
                    >
                      <I className="w-3.5 h-3.5 text-accent" />
                      {l}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── How it works ───────────────────────── */}
        <section id="how" className="border-y border-line bg-canvas-alt">
          <div className="u-container py-20 sm:py-28">
            <div className="max-w-2xl">
              <span className="eyebrow">Setup</span>
              <h2 className="mt-3 text-3xl sm:text-[2.6rem] leading-[1.1] font-semibold">
                Three steps. About two minutes.
              </h2>
            </div>

            <div className="mt-12 grid md:grid-cols-3 gap-4">
              {STEPS.map((s) => (
                <div key={s.n} className="card p-6 flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-semibold text-accent">
                      {s.n}
                    </span>
                    <span className="flex-1 hairline" />
                  </div>
                  <h3 className="mt-4 text-[16px] font-semibold">{s.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-2 flex-1">
                    {s.body}
                  </p>
                  <div className="mt-5 panel p-3">{s.detail}</div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <Link href="/signup" className="btn btn-lg btn-primary">
                Create your workspace
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ───────────────────────── Install ───────────────────────── */}
        <section id="install" className="u-container py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="eyebrow">Install</span>
              <h2 className="mt-3 text-3xl sm:text-[2.6rem] leading-[1.1] font-semibold">
                One tag. Every page.
              </h2>
              <p className="mt-5 text-[15px] leading-relaxed text-ink-2 max-w-md">
                No build step, no npm install, no framework lock-in. Paste it
                once before <code className="font-mono text-[13px] text-ink">&lt;/body&gt;</code>{' '}
                and the launcher is live for every visitor on the site.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5 max-w-md">
                {FACTS.map((f) => (
                  <div key={f.label}>
                    <div className="text-2xl font-semibold tracking-tight text-ink">
                      {f.value}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-ink-3 leading-snug">
                      {f.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="card overflow-hidden shadow-lg">
                <div className="h-11 px-4 flex items-center justify-between border-b border-line bg-surface-2">
                  <span className="font-mono text-[11.5px] text-ink-3">
                    index.html
                  </span>
                  <span className="pill pill-accent">
                    <Code2 className="w-3 h-3" />
                    Zero dependencies
                  </span>
                </div>
                <pre className="code-block rounded-none">{`<!-- Chatify live chat -->
<script
  src="https://your-app.vercel.app/widget.js"
  data-workspace-id="ws_3f8a…"
  defer
></script>`}</pre>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['HTML', 'WordPress', 'Shopify', 'React'].map((p) => (
                  <div
                    key={p}
                    className="h-10 rounded-xl border border-line bg-surface-2 flex items-center justify-center text-[12.5px] font-medium text-ink-2"
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── CTA ───────────────────────── */}
        <section className="u-container pb-24">
          <div className="relative overflow-hidden rounded-2xl bg-invert text-invert-ink px-8 py-16 sm:px-16 sm:py-20 text-center">
            <div
              className="absolute inset-0 opacity-[0.14] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 0%, #2E5BFF, transparent 45%), radial-gradient(circle at 85% 100%, #7c5cff, transparent 45%)',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl sm:text-[2.75rem] leading-[1.08] font-semibold text-invert-ink">
                Your next customer is
                <br className="hidden sm:block" /> on the site right now.
              </h2>
              <p className="mt-5 mx-auto max-w-md text-[15px] leading-relaxed opacity-70">
                Set up a workspace, paste one line, and start the conversation
                before they close the tab.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/signup"
                  className="btn btn-lg bg-white text-[#0b0b0f] hover:bg-white/90 w-full sm:w-auto"
                >
                  Get started free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="/demo.html"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-lg bg-white/10 text-white hover:bg-white/[0.16] border-white/15 w-full sm:w-auto"
                >
                  Try the live demo
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────────────── Footer ───────────────────────── */}
      <footer className="border-t border-line bg-canvas-alt">
        <div className="u-container py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2 max-w-xs">
              <Logo size={32} />
              <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
                Real-time human support for any website. Built on Next.js and
                Supabase.
              </p>
              <div className="mt-5">
                <ThemeToggle />
              </div>
            </div>

            {[
              {
                h: 'Product',
                links: [
                  ['Features', '#product'],
                  ['How it works', '#how'],
                  ['Install', '#install'],
                  ['Live demo', '/demo.html'],
                ],
              },
              {
                h: 'Account',
                links: [
                  ['Create workspace', '/signup'],
                  ['Agent sign in', '/login'],
                  ['Dashboard', '/dashboard'],
                ],
              },
            ].map((col) => (
              <div key={col.h}>
                <h4 className="eyebrow">{col.h}</h4>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="text-[13px] text-ink-2 hover:text-ink transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] text-ink-3">
            <span>© {new Date().getFullYear()} Chatify. All rights reserved.</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="live-dot" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>

      {/* The real widget, running on our own site */}
      <Script
        src="/widget.js"
        data-workspace-id="a0000000-0000-0000-0000-000000000001"
        strategy="lazyOnload"
      />
    </div>
  );
}
