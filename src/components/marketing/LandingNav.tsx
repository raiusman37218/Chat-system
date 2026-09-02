'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur-md">
      <div className="u-container h-16 flex items-center justify-between gap-6">
        <Link href="/" className="flex items-center shrink-0">
          <Logo size={34} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-[13.5px] font-medium">
          {[
            ['Product', '#product'],
            ['How it works', '#how'],
            ['Install', '#install'],
            ['FAQ', '#faq'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="px-3.5 py-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors"
            >
              {label}
            </a>
          ))}
          <a
            href="/demo.html"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-1.5 rounded-lg text-ink-2 hover:text-ink hover:bg-surface-3 transition-colors inline-flex items-center gap-1.5"
          >
            Live demo
            <span className="live-dot" />
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link
            href="/login"
            className="hidden sm:inline-flex btn btn-sm btn-ghost font-semibold text-ink-2 hover:text-ink"
          >
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-sm btn-primary shadow-xs">
            <span>Get started</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 rounded-xl text-ink-2 hover:text-ink hover:bg-surface-2 transition-colors border border-line"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-line bg-surface/95 backdrop-blur-xl px-5 py-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 shadow-lg">
          <nav className="flex flex-col space-y-1 text-[14px] font-medium">
            <a
              href="#product"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition-colors"
            >
              Product
            </a>
            <a
              href="#how"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition-colors"
            >
              How it works
            </a>
            <a
              href="#install"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition-colors"
            >
              Installation
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-ink hover:bg-surface-2 transition-colors"
            >
              FAQ
            </a>
            <a
              href="/demo.html"
              target="_blank"
              rel="noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-accent font-semibold hover:bg-accent/10 transition-colors flex items-center justify-between"
            >
              <span>Live demo</span>
              <span className="live-dot" />
            </a>
          </nav>

          <div className="pt-3 border-t border-line flex items-center justify-between gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn btn-sm btn-secondary flex-1 justify-center"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
