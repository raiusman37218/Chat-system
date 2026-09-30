'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Sparkles } from 'lucide-react';
import { usePwa } from '@/lib/pwa';
import { cn } from '@/lib/utils';

interface MobileInstallBannerProps {
  onOpenModal: () => void;
  className?: string;
}

export function MobileInstallBanner({ onOpenModal, className }: MobileInstallBannerProps) {
  const { isStandalone, isMobile, canInstall, promptInstall } = usePwa();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDismissed = localStorage.getItem('chatify-mobile-banner-dismissed');
    if (!isDismissed) {
      setDismissed(false);
    }
  }, []);

  // Do not show if already running in standalone app mode or dismissed
  if (isStandalone || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('chatify-mobile-banner-dismissed', '1');
    } catch (e) {}
  };

  const handleAction = async () => {
    if (canInstall) {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        handleDismiss();
        return;
      }
    }
    // Otherwise open the guide modal
    onOpenModal();
  };

  return (
    <div
      className={cn(
        'relative bg-gradient-to-r from-accent/15 via-accent/10 to-surface border border-accent/25 rounded-2xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3 text-ink select-none animate-fade-in',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-accent text-accent-ink flex items-center justify-center shrink-0 shadow-sm">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12.5px] font-bold text-ink truncate leading-tight">
              Get Mobile App Shortcut
            </span>
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-accent/20 text-accent uppercase">
              No Play Store Needed
            </span>
          </div>
          <p className="text-[11px] text-ink-3 truncate mt-0.5">
            Add Chatify directly to your phone screen for instant live alerts.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleAction}
          className="btn btn-sm btn-primary text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Add Shortcut</span>
        </button>

        <button
          onClick={handleDismiss}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          title="Dismiss"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
