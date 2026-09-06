'use client';

import React, { useState } from 'react';
import {
  Check,
  Copy,
  Lightbulb,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface MarkdownArticleContentProps {
  content: string;
  className?: string;
}

/**
 * Stable anchor for a heading, so a table of contents can link to it and a
 * shared URL can land on the right part of a long article. Headings carried no
 * id at all before, which made both impossible.
 */
export function headingId(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[`*~_[\]()]/g, '')
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section'
  );
}

export interface ArticleHeading {
  id: string;
  text: string;
  level: 1 | 2 | 3;
}

/** Pulls the heading outline out of markdown, skipping fenced code blocks. */
export function extractHeadings(content: string): ArticleHeading[] {
  const out: ArticleHeading[] = [];
  const seen = new Map<string, number>();
  let inFence = false;

  for (const line of (content || '').split('\n')) {
    const t = line.trim();
    if (t.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{1,3})\s+(.*)$/.exec(t);
    if (!m || !m[2].trim()) continue;

    const text = m[2].trim();
    const base = headingId(text);
    // Two headings can read the same; the anchor still has to be unique.
    const n = (seen.get(base) || 0) + 1;
    seen.set(base, n);

    out.push({
      id: n === 1 ? base : `${base}-${n}`,
      text,
      level: m[1].length as 1 | 2 | 3,
    });
  }
  return out;
}

/**
 * Parses inline formatting like **bold**, *italic*, `code`, ~~strike~~, [links](url)
 */
export function formatInlineText(text: string): React.ReactNode[] {
  // Tokenize regex for **bold**, *italic*, `code`, ~~strike~~, [link](url)
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|~~.*?~~|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Italic
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-ink-2">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Inline code
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-surface-3 dark:bg-slate-800 text-accent font-mono text-[12px] font-semibold border border-line/60"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Strikethrough
    if (part.startsWith('~~') && part.endsWith('~~') && part.length >= 4) {
      return (
        <del key={index} className="line-through text-ink-3">
          {part.slice(2, -2)}
        </del>
      );
    }

    // Link [title](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline font-medium inline-flex items-center gap-0.5"
        >
          {label}
        </a>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function CodeBlockWithCopy({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl border border-slate-700/80 bg-slate-950 text-slate-100 overflow-hidden shadow-md">
      <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          type="button"
          className="hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-[12.5px] font-mono leading-relaxed overflow-x-auto selection:bg-blue-600 selection:text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownArticleContent({
  content,
  className = '',
}: MarkdownArticleContentProps) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let index = 0;

  // Must produce the same ids, in the same order, as extractHeadings — the
  // table of contents links to these anchors.
  const headingCounts = new Map<string, number>();
  const nextHeadingId = (raw: string) => {
    const base = headingId(raw);
    const n = (headingCounts.get(base) || 0) + 1;
    headingCounts.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    // 1. Empty lines
    if (!trimmed) {
      elements.push(<div key={`empty-${index}`} className="h-2" />);
      index++;
      continue;
    }

    // 2. Fenced Code Blocks (```lang ... ```)
    if (trimmed.startsWith('```')) {
      const language = trimmed.replace('```', '').trim();
      index++;
      const codeLines: string[] = [];
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        codeLines.push(lines[index]);
        index++;
      }
      if (index < lines.length && lines[index].trim().startsWith('```')) {
        index++; // Skip closing fence
      }
      elements.push(
        <CodeBlockWithCopy
          key={`code-${index}`}
          language={language}
          code={codeLines.join('\n')}
        />
      );
      continue;
    }

    // 3. Tables (| Col 1 | Col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (
        index < lines.length &&
        lines[index].trim().startsWith('|') &&
        lines[index].trim().endsWith('|')
      ) {
        tableLines.push(lines[index].trim());
        index++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        // Check if second line is a divider row (---|---)
        const hasDivider = tableLines[1].includes('---');
        const dataRows = hasDivider ? tableLines.slice(2) : tableLines.slice(1);

        elements.push(
          <div
            key={`table-${index}`}
            className="overflow-x-auto my-4 rounded-xl border border-line shadow-xs bg-surface"
          >
            <table className="w-full text-left text-[13px] divide-y divide-line">
              <thead className="bg-surface-2 text-ink font-semibold">
                <tr>
                  {headerCells.map((header, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5 font-bold">
                      {formatInlineText(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {dataRows.map((rowStr, rIdx) => {
                  const cells = rowStr
                    .split('|')
                    .slice(1, -1)
                    .map((c) => c.trim());
                  return (
                    <tr
                      key={rIdx}
                      className={rIdx % 2 === 1 ? 'bg-surface-2/40' : 'bg-surface'}
                    >
                      {cells.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3.5 py-2 text-ink-2">
                          {formatInlineText(cell)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 4. Callout Alerts (> [!NOTE], > [!TIP], > [!WARNING], > [!CAUTION])
    if (
      trimmed.startsWith('> [!NOTE]') ||
      trimmed.startsWith('> [!INFO]') ||
      trimmed.startsWith('> [!TIP]') ||
      trimmed.startsWith('> [!WARNING]') ||
      trimmed.startsWith('> [!CAUTION]')
    ) {
      let calloutType: 'note' | 'tip' | 'warning' | 'caution' = 'note';
      if (trimmed.includes('[!TIP]')) calloutType = 'tip';
      if (trimmed.includes('[!WARNING]')) calloutType = 'warning';
      if (trimmed.includes('[!CAUTION]')) calloutType = 'caution';

      index++;
      const calloutLines: string[] = [];
      while (
        index < lines.length &&
        lines[index].trim().startsWith('>') &&
        !lines[index].trim().startsWith('> [!')
      ) {
        calloutLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index++;
      }

      const styles = {
        note: {
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200',
          icon: <Lightbulb className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />,
          title: 'Note',
        },
        tip: {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />,
          title: 'Pro Tip',
        },
        warning: {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200',
          icon: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />,
          title: 'Warning',
        },
        caution: {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200',
          icon: <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />,
          title: 'Caution',
        },
      }[calloutType];

      elements.push(
        <div
          key={`callout-${index}`}
          className={`p-4 my-3.5 rounded-xl border flex items-start gap-3 text-[13px] leading-relaxed ${styles.bg}`}
        >
          {styles.icon}
          <div className="flex-1 space-y-1">
            <span className="font-bold uppercase tracking-wider text-[11px] block">
              {styles.title}
            </span>
            <div className="space-y-1">
              {calloutLines.map((cLine, cIdx) => (
                <p key={cIdx}>{formatInlineText(cLine)}</p>
              ))}
            </div>
          </div>
        </div>
      );
      continue;
    }

    // 5. Blockquote (> text)
    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (
        index < lines.length &&
        lines[index].trim().startsWith('>') &&
        !lines[index].trim().startsWith('> [!')
      ) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index++;
      }

      elements.push(
        <blockquote
          key={`quote-${index}`}
          className="pl-4 py-1.5 border-l-3 border-accent text-ink-2 italic bg-surface-2/40 rounded-r-lg my-3 space-y-1 text-[13.5px]"
        >
          {quoteLines.map((qLine, qIdx) => (
            <p key={qIdx}>{formatInlineText(qLine)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 6. Horizontal Divider (--- or ***)
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      elements.push(
        <hr key={`hr-${index}`} className="my-6 border-t border-line" />
      );
      index++;
      continue;
    }

    // 7. Headings
    if (trimmed.startsWith('# ')) {
      const raw = trimmed.replace('# ', '');
      elements.push(
        <h1
          key={`h1-${index}`}
          id={nextHeadingId(raw)}
          className="scroll-mt-24 text-[24px] sm:text-[28px] font-extrabold text-ink mt-7 mb-3 tracking-tight pb-2 border-b border-line"
        >
          {formatInlineText(trimmed.replace('# ', ''))}
        </h1>
      );
      index++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const raw = trimmed.replace('## ', '');
      elements.push(
        <h2
          key={`h2-${index}`}
          id={nextHeadingId(raw)}
          className="scroll-mt-24 text-[19px] sm:text-[22px] font-bold text-ink mt-6 mb-2 tracking-tight pb-1.5 border-b border-line/60"
        >
          {formatInlineText(trimmed.replace('## ', ''))}
        </h2>
      );
      index++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      const raw = trimmed.replace('### ', '');
      elements.push(
        <h3
          key={`h3-${index}`}
          id={nextHeadingId(raw)}
          className="scroll-mt-24 text-[16px] sm:text-[17px] font-bold text-ink mt-5 mb-1 tracking-tight"
        >
          {formatInlineText(trimmed.replace('### ', ''))}
        </h3>
      );
      index++;
      continue;
    }

    // 8. Task Checklists (- [ ] or - [x])
    if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      const taskItems: React.ReactNode[] = [];
      while (
        index < lines.length &&
        (lines[index].trim().startsWith('- [ ] ') || lines[index].trim().startsWith('- [x] '))
      ) {
        const curTrim = lines[index].trim();
        const isChecked = curTrim.startsWith('- [x] ');
        const label = curTrim.replace(/^- \[( |x)\]\s*/, '');
        taskItems.push(
          <div key={`task-item-${index}`} className="flex items-center gap-2.5 py-1 text-[13.5px]">
            <input
              type="checkbox"
              readOnly
              checked={isChecked}
              className="w-4 h-4 rounded border-line text-accent cursor-default pointer-events-none"
            />
            <span className={isChecked ? 'line-through text-ink-3' : 'text-ink leading-relaxed'}>
              {formatInlineText(label)}
            </span>
          </div>
        );
        index++;
      }
      elements.push(
        <div key={`task-group-${index}`} className="my-2 space-y-1">
          {taskItems}
        </div>
      );
      continue;
    }

    // 9. Bullet Lists (- or *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: React.ReactNode[] = [];
      while (
        index < lines.length &&
        (lines[index].trim().startsWith('- ') || lines[index].trim().startsWith('* ')) &&
        !lines[index].trim().startsWith('- [ ] ') &&
        !lines[index].trim().startsWith('- [x] ')
      ) {
        const curTrim = lines[index].trim();
        const itemText = curTrim.substring(2).trim();
        listItems.push(
          <li key={`bullet-item-${index}`} className="text-[14px] text-ink-2 leading-relaxed">
            {formatInlineText(itemText)}
          </li>
        );
        index++;
      }
      elements.push(
        <ul key={`ul-${index}`} className="list-disc pl-6 space-y-1 my-2 text-ink">
          {listItems}
        </ul>
      );
      continue;
    }

    // 10. Numbered Lists (1., 2., etc.)
    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: React.ReactNode[] = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        const curTrim = lines[index].trim();
        const itemText = curTrim.replace(/^\d+\.\s+/, '').trim();
        listItems.push(
          <li key={`ordered-item-${index}`} className="text-[14px] text-ink-2 leading-relaxed">
            {formatInlineText(itemText)}
          </li>
        );
        index++;
      }
      elements.push(
        <ol key={`ol-${index}`} className="list-decimal pl-6 space-y-1 my-2 text-ink">
          {listItems}
        </ol>
      );
      continue;
    }

    // 11. Standalone Images (![alt](url))
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const [, alt, src] = imgMatch;
      elements.push(
        <figure key={`img-${index}`} className="my-4 rounded-xl overflow-hidden border border-line bg-surface-2/40 shadow-xs">
          <img src={src} alt={alt} className="w-full h-auto object-contain max-h-[500px] mx-auto rounded-t-xl" loading="lazy" />
          {alt && (
            <figcaption className="text-[12px] text-ink-3 text-center py-2 px-4 italic border-t border-line/50 bg-surface">
              {alt}
            </figcaption>
          )}
        </figure>
      );
      index++;
      continue;
    }

    // 12. Normal Paragraph
    elements.push(
      <p key={`p-${index}`} className="text-[14px] text-ink leading-relaxed">
        {formatInlineText(trimmed)}
      </p>
    );
    index++;
  }

  return <div className={`space-y-2 text-ink ${className}`}>{elements}</div>;
}
