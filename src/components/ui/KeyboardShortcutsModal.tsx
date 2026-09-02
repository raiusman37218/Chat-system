'use client';

import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcutGroups = [
    {
      group: 'General & Navigation',
      items: [
        { keys: [`${modKey}`, 'K'], description: 'Focus conversation deep search' },
        { keys: ['Esc'], description: 'Close modal / deselect conversation' },
        { keys: ['?'], description: 'Toggle this keyboard shortcuts cheatsheet' },
      ],
    },
    {
      group: 'Chat Composer & Replying',
      items: [
        { keys: [`${modKey}`, 'Enter'], description: 'Send message / private internal note' },
        { keys: ['/'], description: 'Trigger canned response saved replies' },
        { keys: ['@'], description: 'Mention agent in private internal notes' },
      ],
    },
    {
      group: 'Ticket Management',
      items: [
        { keys: ['E'], description: 'Mark conversation as Closed / Resolved' },
        { keys: ['S'], description: 'Open snooze schedule dialog' },
        { keys: ['M'], description: 'Open thread merge dialog' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-surface border border-line rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-ink">Keyboard Shortcuts</h3>
              <p className="text-[12px] text-ink-3">Speed up your support workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((grp) => (
            <div key={grp.group} className="space-y-3">
              <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wider">
                {grp.group}
              </div>
              <div className="divide-y divide-line/60 border border-line rounded-xl overflow-hidden">
                {grp.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-surface hover:bg-surface-2/50 transition-colors text-xs"
                  >
                    <span className="text-ink font-medium">{item.description}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 min-w-[22px] text-center text-[11px] font-mono font-semibold bg-surface-2 border border-line rounded shadow-2xs text-ink"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-line bg-surface-2 flex items-center justify-between text-xs text-ink-3">
          <span>Press <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-surface-2 border border-line rounded">Esc</kbd> anytime to dismiss</span>
          <button onClick={onClose} className="btn btn-sm btn-secondary">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
