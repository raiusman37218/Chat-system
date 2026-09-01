import Link from 'next/link';
import Script from 'next/script';
import { 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  Code2, 
  Radio, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Palette, 
  Users, 
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-blue-600 selection:text-white flex flex-col">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/10 to-transparent" />

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#070b14]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">Chatify</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SaaS
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#integration" className="hover:text-white transition-colors">Integration</a>
            <Link href="/demo.html" target="_blank" className="hover:text-white transition-colors flex items-center gap-1">
              <span>Customer Demo</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Multi-Tenant Live Chat Support Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-6">
            Instant Live Support for Your <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Business Website
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-400 leading-relaxed mb-10">
            Connect with your website visitors in real time. Register your company workspace in seconds, customize your live chat branding, and embed our lightweight widget with a single line of code.
          </p>

          {/* Intercom-style Hero Email Capture Form */}
          <div className="max-w-md mx-auto mb-6">
            <form action="/signup" method="GET" className="flex items-center gap-2 p-1.5 bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl focus-within:border-blue-500 transition-colors">
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your work email..."
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/demo.html"
              target="_blank"
              className="px-5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <span>Try Interactive Demo</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </Link>

            <Link
              href="/login"
              className="px-5 py-2.5 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
            >
              Existing Agent Sign In →
            </Link>
          </div>

          {/* Social Proof Pills */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>1-Line WordPress &amp; Shopify integration</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Supabase Realtime WebSocket engine</span>
            </div>
          </div>
        </section>

        {/* VISUAL REGISTRATION PROCESS: How It Works */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Registration &amp; Setup Journey
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              How Business Registration Works in 3 Simple Steps
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Getting started is effortless. Here is exactly what happens when you sign up:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-base">
                    1
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Step 1</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Create Your Account</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Register with your name, business email, and password. Your personal agent profile is generated automatically.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1 font-mono">
                <div className="text-[10px] text-slate-500 uppercase">Input:</div>
                <div className="text-blue-400">name: Alex Morgan</div>
                <div className="text-slate-300">email: alex@company.com</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold text-base">
                    2
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Step 2</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Workspace &amp; Branding</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Provide your company name and website URL. Choose your brand color and greeting message with our live preview tool.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Brand Color:</span>
                  <span className="flex items-center gap-1.5 text-white font-mono">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    #2563eb
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Header Title:</span>
                  <span className="text-slate-200 font-medium">Acme Support</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-base">
                    3
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Step 3</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">Embed &amp; Start Chatting</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Copy your unique 1-line script tag and paste it on WordPress, Shopify, or custom HTML. Visitors immediately see live support!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#070b14] border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-hidden text-ellipsis whitespace-nowrap">
                &lt;script src=&quot;.../widget.js&quot; data-workspace-id=&quot;...&quot;&gt;
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <span>Start Step 1: Register Business Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-slate-800/80">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              Everything Your Support Team Needs
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Designed from the ground up for high-touch customer support with real-time responsiveness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Live Visitors Radar</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                See visitors live on your site in real time. View the exact page URL they are browsing, time on site, location, and device details.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Realtime WebSocket Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sub-second message delivery powered by Supabase Realtime Postgres subscriptions. Typing indicators and read receipts built-in.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Multi-Tenant Isolation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every business has its own dedicated workspace. Your conversations, visitors, and agent assignments are 100% private.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Code2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Shadow DOM Widget</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The embeddable widget uses Shadow DOM isolation so host website CSS styles can never conflict with or break the chat interface.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Palette className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Brand Customization</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Match your website aesthetics with custom brand colors, personalized support titles, and welcoming greeting cards.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Human-Only in Phase 1</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Pure human-to-human support with agent assignment and status management. Ready to plug into AI auto-reply in Phase 2.
              </p>
            </div>
          </div>
        </section>

        {/* INTEGRATION SNIPPET PREVIEW */}
        <section id="integration" className="max-w-4xl mx-auto px-6 py-20 border-t border-slate-800/80">
          <div className="text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
              Seamless Embed
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
              How You Embed It On Any Website
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              No complex backend APIs or build pipelines. Just copy and paste this single line:
            </p>
          </div>

          <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3">
              <span className="font-mono text-blue-400">index.html / theme.liquid / footer.php</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Zero Dependencies
              </span>
            </div>

            <pre className="p-4 bg-[#070b14] border border-slate-700/80 rounded-xl text-xs font-mono text-blue-300 overflow-x-auto leading-relaxed">
{`<!-- Chatify Live Chat Support -->
<script 
  src="http://localhost:3000/widget.js" 
  data-workspace-id="YOUR_WORKSPACE_ID" 
  defer>
</script>`}
            </pre>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                WordPress
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                Shopify
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                Next.js / React
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-medium">
                Webflow / Wix
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="max-w-5xl mx-auto px-6 py-20 text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-tr from-blue-900/30 via-indigo-900/20 to-purple-900/10 border border-blue-500/30 shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to Upgrade Your Customer Support?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
              Create your business workspace now. In less than a minute, you will have a live support widget active on your website.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Create Free Business Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
              >
                <span>Sign In as Agent</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 bg-[#090d16] text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
              C
            </div>
            <span className="text-slate-300 font-bold">Chatify</span>
            <span>— Intercom-Style Live Support Platform</span>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <Link href="/signup" className="hover:text-white transition-colors">Register Business</Link>
            <Link href="/login" className="hover:text-white transition-colors">Agent Sign In</Link>
            <Link href="/demo.html" target="_blank" className="hover:text-white transition-colors">Customer Demo</Link>
          </div>
        </div>
      </footer>

      {/* Live embedded widget on landing page for instant demonstration */}
      <Script
        src="/widget.js"
        data-workspace-id="a0000000-0000-0000-0000-000000000001"
        strategy="lazyOnload"
      />
    </div>
  );
}
