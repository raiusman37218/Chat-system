'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Hash,
  Mail,
  MapPin,
  Monitor,
  User,
} from 'lucide-react';
import { Visitor, Conversation } from '@/types/database';
import { formatTimeAgo, parseUserAgent } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';

interface VisitorDetailsSidebarProps {
  visitor: Visitor | null | undefined;
  conversation: Conversation;
}

function Row({
  Icon,
  label,
  children,
}: {
  Icon: typeof Globe;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2.5">
      <span className="flex items-center gap-2 text-[12px] text-ink-3 shrink-0">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
      <span className="text-[12.5px] font-medium text-ink text-right min-w-0 truncate">
        {children}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="eyebrow mb-2">{title}</h3>
      <div className="rounded-xl border border-line bg-surface-2 divide-y divide-line">
        {children}
      </div>
    </div>
  );
}

export function VisitorDetailsSidebar({
  visitor,
  conversation,
}: VisitorDetailsSidebarProps) {
  if (!visitor) {
    return (
      <aside className="hidden 2xl:flex w-[304px] shrink-0 h-screen border-l border-line bg-surface flex-col items-center justify-center gap-3 px-8 text-center">
        <div className="w-11 h-11 rounded-xl bg-surface-2 border border-line flex items-center justify-center text-ink-3">
          <User className="w-5 h-5" />
        </div>
        <p className="text-[12.5px] text-ink-3">No visitor details loaded</p>
      </aside>
    );
  }

  const { browser, os } = parseUserAgent(visitor.user_agent);
  const isOnline = visitor.last_seen
    ? (Date.now() - new Date(visitor.last_seen).getTime()) / 1000 < 60
    : false;

  const displayName =
    visitor.name ||
    (visitor.email ? visitor.email.split('@')[0] : 'Anonymous visitor');

  return (
    <aside className="hidden 2xl:flex w-[304px] shrink-0 h-screen border-l border-line bg-surface flex-col overflow-y-auto">
      {/* Identity */}
      <div className="px-6 py-7 flex flex-col items-center text-center border-b border-line">
        <Avatar
          name={displayName}
          seed={visitor.id}
          size="lg"
          online={isOnline}
        />
        <h2 className="mt-3.5 text-[15px] font-semibold tracking-tight">
          {displayName}
        </h2>
        {visitor.email ? (
          <a
            href={`mailto:${visitor.email}`}
            className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-ink-2 hover:text-accent transition-colors max-w-full truncate"
          >
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{visitor.email}</span>
          </a>
        ) : (
          <p className="mt-1 text-[12.5px] text-ink-3">No email provided</p>
        )}

        <span
          className={`mt-3.5 pill ${isOnline ? 'pill-success' : 'pill-neutral'}`}
        >
          {isOnline ? (
            <>
              <span className="live-dot" />
              Online now
            </>
          ) : (
            <>Last seen {formatTimeAgo(visitor.last_seen)}</>
          )}
        </span>
      </div>

      <div className="p-5 space-y-6">
        <Section title="Currently viewing">
          <div className="px-3 py-2.5">
            <a
              href={visitor.current_url}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 group"
            >
              <Globe className="w-3.5 h-3.5 text-ink-3 mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[11.5px] leading-relaxed text-accent break-all group-hover:underline underline-offset-2">
                  {visitor.current_url}
                </span>
              </span>
              <ExternalLink className="w-3 h-3 text-ink-3 mt-0.5 shrink-0" />
            </a>
          </div>
        </Section>

        <Section title="Device & location">
          <Row Icon={MapPin} label="Location">
            {visitor.location || 'Unknown'}
          </Row>
          <Row Icon={Monitor} label="Device">
            {browser} · {os}
          </Row>
          <Row Icon={Hash} label="IP address">
            <span className="font-mono text-[11.5px]">
              {visitor.ip_address || '—'}
            </span>
          </Row>
        </Section>

        <Section title="Session">
          <Row Icon={Calendar} label="First seen">
            {formatTimeAgo(visitor.first_seen)}
          </Row>
          <Row Icon={Clock} label="Last active">
            {formatTimeAgo(visitor.last_seen)}
          </Row>
        </Section>

        <Section title="Conversation">
          <Row Icon={Hash} label="ID">
            <span className="font-mono text-[11.5px]">
              {conversation.id.slice(0, 8)}
            </span>
          </Row>
          <Row Icon={Clock} label="Status">
            <span className="capitalize">{conversation.status}</span>
          </Row>
          {conversation.priority && (
            <Row Icon={Clock} label="Priority">
              <span className="capitalize">{conversation.priority}</span>
            </Row>
          )}
        </Section>
      </div>
    </aside>
  );
}
