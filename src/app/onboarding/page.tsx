'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Globe, 
  Palette, 
  Check, 
  Copy, 
  ArrowRight, 
  MessageSquare, 
  ExternalLink,
  Code2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const PRESET_COLORS = [
  { name: 'Electric Blue', hex: '#2563eb' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Royal Violet', hex: '#7c3aed' },
  { name: 'Rose', hex: '#e11d48' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Slate Dark', hex: '#334155' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [brandColor, setBrandColor] = useState('#2563eb');
  const [greetingTitle, setGreetingTitle] = useState('Support Team');
  const [greetingMessage, setGreetingMessage] = useState('We typically reply in under 5 minutes');

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
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center p-6 selection:bg-blue-600 selection:text-white">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

      <div className="w-full max-w-3xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-600/30 text-white mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set up your Business Workspace</h1>
          <p className="text-sm text-slate-400 mt-1">
            Connect Chatify to your website and start receiving live customer inquiries
          </p>

          {/* Stepper Progress */}
          <div className="flex items-center justify-center gap-3 mt-6">
            <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${step >= 1 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-500'}`}>
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
              <span>Business Info</span>
            </div>
            <div className="w-6 h-[1px] bg-slate-800" />
            <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${step >= 2 ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-slate-500'}`}>
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
              <span>Widget Branding</span>
            </div>
            <div className="w-6 h-[1px] bg-slate-800" />
            <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${step === 3 ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500'}`}>
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">3</span>
              <span>Install & Launch</span>
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {/* STEP 1: Business Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-semibold text-white">Tell us about your business</h2>
                <p className="text-xs text-slate-400 mt-0.5">We will generate your dedicated workspace and isolated chat database.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Company / Business Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Apparel or Nova Cloud"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        if (!greetingTitle || greetingTitle === 'Support Team') {
                          setGreetingTitle(`${e.target.value} Support`);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Website URL (Where the chat widget will be embedded)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!businessName.trim()}
                  onClick={() => setStep(2)}
                  className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
                >
                  <span>Next: Customize Widget Branding</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Widget Branding & Customizer */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Left: Customizer controls */}
              <div className="space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-white">Customize your Live Chat</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Match the widget with your company&apos;s brand look and feel.</p>
                </div>

                {/* Color presets */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setBrandColor(c.hex)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${brandColor === c.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'}`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      >
                        {brandColor === c.hex && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2 bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1">
                      <input
                        type="color"
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded"
                      />
                      <span className="font-mono text-xs text-slate-300">{brandColor}</span>
                    </div>
                  </div>
                </div>

                {/* Header Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Widget Header Title
                  </label>
                  <input
                    type="text"
                    value={greetingTitle}
                    onChange={(e) => setGreetingTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Subtitle / Greeting */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Welcome Subtitle
                  </label>
                  <input
                    type="text"
                    value={greetingMessage}
                    onChange={(e) => setGreetingMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleCreateWorkspace}
                    className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <span>{loading ? 'Creating Workspace...' : 'Finish & Generate Embed Code'}</span>
                    <Sparkles className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right: Live Interactive Widget Preview */}
              <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center select-none">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Live Preview</span>
                </div>

                {/* Mock Widget Card */}
                <div className="w-full max-w-[280px] bg-[#0f172a] border border-slate-700/60 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow"
                        style={{ backgroundColor: brandColor }}
                      >
                        {greetingTitle.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white truncate max-w-[150px]">
                          {greetingTitle}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {greetingMessage}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Preview */}
                  <div className="p-3 space-y-2 bg-[#090d16] min-h-[140px] flex flex-col justify-end text-[11px]">
                    <div className="bg-slate-800 text-slate-200 p-2 rounded-xl rounded-bl-none max-w-[85%] border border-slate-700/50">
                      Hello! How can we help your business today?
                    </div>
                    <div
                      className="text-white p-2 rounded-xl rounded-br-none max-w-[85%] self-end shadow"
                      style={{ backgroundColor: brandColor }}
                    >
                      I have a question about your plans!
                    </div>
                  </div>

                  {/* Input Mock */}
                  <div className="p-2 border-t border-slate-800 bg-[#0f172a] flex items-center gap-1.5 text-xs text-slate-500">
                    <div className="flex-1 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px]">
                      Send a message...
                    </div>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: brandColor }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* Mock Floating Bubble */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Floating Button:</span>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: brandColor }}
                  >
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Embed Script & Platform Guides */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-2">
                  <Check className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-white">Your Workspace is Ready!</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  Install this 1-line script tag on <span className="text-blue-400 font-semibold">{businessName}</span> to launch live chat immediately.
                </p>
              </div>

              {/* Code Box */}
              <div className="relative">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-t border-x border-slate-700/80 rounded-t-xl text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span className="font-mono">HTML Embed Code (Paste in &lt;head&gt; or &lt;body&gt;)</span>
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-[#070b14] border border-slate-700/80 rounded-b-xl text-xs font-mono text-blue-300 overflow-x-auto selection:bg-blue-600 selection:text-white">
                  {getEmbedSnippet()}
                </pre>
              </div>

              {/* Installation CMS Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>WordPress</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Use any &quot;Insert Headers and Footers&quot; plugin or paste into your child theme&apos;s <code className="text-slate-300 font-mono">footer.php</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Shopify</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Go to Online Store &gt; Themes &gt; Edit Code, and paste before the <code className="text-slate-300 font-mono">&lt;/body&gt;</code> tag in <code className="text-slate-300 font-mono">theme.liquid</code>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>Next.js / React</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Add via Next.js <code className="text-slate-300 font-mono">&lt;Script src=&quot;...&quot; /&gt;</code> component inside your root <code className="text-slate-300 font-mono">layout.tsx</code>.
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <a
                  href="/demo.html"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview in Demo Site</span>
                </a>

                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Go to Agent Inbox</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
