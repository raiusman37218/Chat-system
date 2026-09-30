'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';

// Custom types for BeforeInstallPromptEvent
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

class PwaManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private listeners = new Set<() => void>();
  private isStandalone = false;
  private isInstalled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.checkStandalone();
      this.initListeners();
    }
  }

  private checkStandalone() {
    const isStandaloneDisplay =
      typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches;
    const isNavigatorStandalone =
      typeof window !== 'undefined' && (window.navigator as any).standalone === true;
    this.isStandalone = !!(isStandaloneDisplay || isNavigatorStandalone);
    if (this.isStandalone) {
      this.isInstalled = true;
    }
  }

  private initListeners() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notify();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled = true;
      this.notify();
    });

    // Check display-mode media query change
    try {
      window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
        this.isStandalone = e.matches;
        if (e.matches) this.isInstalled = true;
        this.notify();
      });
    } catch (e) {}
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public getSnapshot = () => {
    return {
      canInstall: !!this.deferredPrompt,
      isStandalone: this.isStandalone,
      isInstalled: this.isInstalled,
    };
  };

  public async promptInstall(): Promise<'accepted' | 'dismissed' | 'unsupported'> {
    if (!this.deferredPrompt) {
      return 'unsupported';
    }

    try {
      await this.deferredPrompt.prompt();
      const choice = await this.deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        this.deferredPrompt = null;
        this.isInstalled = true;
        this.notify();
      }
      return choice.outcome;
    } catch (err) {
      console.error('[PWA] Install prompt error:', err);
      return 'unsupported';
    }
  }
}

export const pwaManager = new PwaManager();

export function usePwa() {
  const [deviceInfo, setDeviceInfo] = useState({
    isIOS: false,
    isAndroid: false,
    isMobile: false,
    isSafari: false,
  });

  const pwaState = useSyncExternalStore(
    pwaManager.subscribe,
    pwaManager.getSnapshot,
    () => ({ canInstall: false, isStandalone: false, isInstalled: false })
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroid = /Android/i.test(ua);
    const isMobile = isIOS || isAndroid || /Mobi|Tablet|iPad/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

    setDeviceInfo({
      isIOS,
      isAndroid,
      isMobile,
      isSafari,
    });
  }, []);

  return {
    ...pwaState,
    ...deviceInfo,
    promptInstall: () => pwaManager.promptInstall(),
  };
}
