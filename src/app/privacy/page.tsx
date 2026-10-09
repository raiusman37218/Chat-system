import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

export const metadata = {
  title: 'Privacy Policy | Zen-try',
  description: 'Zen-try Privacy Policy and data protection practices.',
};

export default function PrivacyPage() {
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
            <Lock className="w-3.5 h-3.5" />
            Privacy & Security
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-ink-3">
            Last updated: October 2026
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-ink-2">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">1. Information We Collect</h2>
            <p>
              When you create an account, we collect your name, business email address, and authentication credentials. For website visitors chatting via the Zen-try widget, we collect session metadata including IP address, browser type, referral URLs, and active page paths to enable live routing.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">2. How We Use Your Information</h2>
            <p>
              We use collected information to provision your multi-tenant workspace, deliver real-time messages, calculate platform analytics, and send necessary transactional notifications (such as email confirmations and unread message alerts).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">3. Data Retention and Isolation</h2>
            <p>
              Each workspace operates in strict tenant isolation protected by PostgreSQL Row Level Security (RLS). You can request data exports or deletion of your workspace and conversation history at any time from your administration settings.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">4. Third-Party Integrations</h2>
            <p>
              We integrate with trusted infrastructure providers including Supabase (authentication and database hosting), Cloudinary (secure media attachments), and Vercel (custom domain SSL edge termination). We do not sell your personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-ink">5. Contact Our Privacy Team</h2>
            <p>
              If you have any questions or data protection requests under GDPR or CCPA, reach out through our Help Center at <Link href="/help" className="text-accent underline">Zen-try Help Center</Link>.
            </p>
          </section>
        </div>

        <div className="pt-8 border-t border-line flex items-center justify-between text-ui text-ink-3">
          <span>&copy; {new Date().getFullYear()} Zen-try Inc. All rights reserved.</span>
          <Link href="/terms" className="hover:text-ink underline">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
