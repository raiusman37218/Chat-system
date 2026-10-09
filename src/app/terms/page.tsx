import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export const metadata = {
  title: 'Terms of Service | Zen-try',
  description: 'Zen-try Terms of Service and legal agreements.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="u-container h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 text-ui font-medium text-ink-2 hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign up
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Terms of Service
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-ink-3">
            Last updated: October 2026
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-ink-2">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">1. Acceptance of Terms</h2>
            <p>
              By signing up for an account, accessing, or using Zen-try (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not create an account or use the Service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">2. Workspace and Account Security</h2>
            <p>
              You are responsible for maintaining the confidentiality of your workspace credentials, API keys, and email access. Email verification is required before workspaces become active to ensure verified ownership. You must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">3. Acceptable Use Policy</h2>
            <p>
              You agree not to use Zen-try to transmit spam, unlawful, abusive, or malicious content. Automated scraping of visitor data without consent or interference with widget delivery across subscriber websites is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">4. AI Features & Customer Data</h2>
            <p>
              Zen-try offers AI copilot features that process conversations and knowledge notes to provide automated assistance. Your customer conversations are your proprietary data and will never be shared with third parties for general model training without explicit consent.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">5. Service Availability & Modifications</h2>
            <p>
              We strive for 99.9% uptime. However, we reserve the right to modify, suspend, or discontinue aspects of the Service with reasonable notice for maintenance, security upgrades, or feature enhancements.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">6. Contact Information</h2>
            <p>
              For legal inquiries regarding these terms, please contact us through our Help Center at <Link href="/help" className="text-accent underline">Zen-try Help Center</Link>.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-line flex items-center justify-between text-ui text-ink-3">
          <span>&copy; {new Date().getFullYear()} Zen-try Inc. All rights reserved.</span>
          <Link href="/privacy" className="hover:text-ink underline">
            Privacy Policy
          </Link>
        </div>
      </main>
    </div>
  );
}
