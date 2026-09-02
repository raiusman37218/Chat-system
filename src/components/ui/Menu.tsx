'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuOption<T extends string> {
  value: T;
  label: string;
  /** Small colour swatch shown before the label. */
  dot?: string;
  description?: string;
  danger?: boolean;
}

/**
 * Lightweight popover select. Replaces native <select>, which cannot be styled
 * consistently across platforms and looks out of place in a polished inbox.
 */
export function Menu<T extends string>({
  value,
  options,
  onChange,
  align = 'end',
  side = 'bottom',
  trigger,
  className,
  menuClassName,
  label,
}: {
  value: T;
  options: MenuOption<T>[];
  onChange: (value: T) => void;
  align?: 'start' | 'end';
  side?: 'top' | 'bottom';
  /** Custom trigger; defaults to a bordered button showing the active label. */
  trigger?: (args: { active?: MenuOption<T>; open: boolean }) => React.ReactNode;
  className?: string;
  menuClassName?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const active = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="block w-full text-left"
      >
        {trigger ? (
          trigger({ active, open })
        ) : (
          <span className="btn btn-sm btn-secondary w-full justify-between">
            <span className="flex items-center gap-1.5 truncate">
              {active?.dot && (
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: active.dot }}
                />
              )}
              <span className="truncate">{active?.label ?? 'Select'}</span>
            </span>
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-ink-3 transition-transform duration-150',
                open && 'rotate-180'
              )}
            />
          </span>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="listbox"
          className={cn(
            'absolute z-50 min-w-[190px] p-1 rounded-xl border border-line bg-surface shadow-lg animate-pop',
            side === 'bottom' ? 'top-[calc(100%+6px)]' : 'bottom-[calc(100%+6px)]',
            align === 'end' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {options.map((opt) => {
            const selected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors',
                  opt.danger
                    ? 'text-danger hover:bg-danger-soft'
                    : 'text-ink hover:bg-surface-3'
                )}
              >
                {opt.dot && (
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: opt.dot }}
                  />
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-medium truncate">
                    {opt.label}
                  </span>
                  {opt.description && (
                    <span className="block text-[11.5px] text-ink-3 truncate">
                      {opt.description}
                    </span>
                  )}
                </span>
                {selected && (
                  <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
