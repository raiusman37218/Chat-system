import React from 'react';
import Link from 'next/link';
import { LandingNav } from '@/components/marketing/LandingNav';
import { PricingView } from '@/components/pricing/PricingView';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getPublicPlansAction } from '@/app/actions/plans';

export const metadata = {
  title: 'Pricing & Plans — Zen-try',
  description:
    'Transparent, predictable plans for modern customer care teams. Omnichannel inbox, AI agent, custom help center, and SLA enforcement.',
};

export default async function PricingPage() {
  const plans = await getPublicPlansAction();

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <LandingNav />

      <main className="flex-1">
        <PricingView initialPlans={plans} />
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-canvas-alt">
        <div className="u-container py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2 max-w-xs">
              <Logo size={32} />
              <p className="mt-4 text-ui leading-relaxed text-ink-2">
                Real-time human support & omnichannel ticketing for any website.
              </p>
              <div className="mt-5">
                <ThemeToggle />
              </div>
            </div>

            {[
              {
                h: 'Product',
                links: [
                  ['Features', '/#product'],
                  ['Pricing', '/pricing'],
                  ['How it works', '/#how'],
                  ['Install', '/#install'],
                  ['Live demo', '/demo.html'],
                  ['Help Center', '/help'],
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
                        className="text-ui text-ink-2 hover:text-ink transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-3">
            <span>© {new Date().getFullYear()} Zen-try. All rights reserved.</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="live-dot" />
              All systems operational
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
