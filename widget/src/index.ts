import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CHATIFY_ICON_DATA_URI } from './icon';

const DEFAULT_SUPABASE_URL = 'https://vfjsaynnubxywdbevxtx.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmanNheW5udWJ4eXdkYmV2eHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNTA5MDEsImV4cCI6MjEwMzgyNjkwMX0.YyBCXMqwrOk5BRhQafYLFw8tiM5PC8lc8Yocodw9wf0';

interface WidgetConfig {
  supabaseUrl: string;
  supabaseKey: string;
  workspaceId: string | null;
  title: string;
  subtitle: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  helpTabLabel: string;
  showHelpTab: boolean;
  helpTabIcon: string;
  logoUrl?: string;
  greetingTitle?: string;
  welcomeText?: string;
}

interface MessageItem {
  id: string;
  sender_type: 'visitor' | 'agent' | 'ai';
  content: string;
  created_at: string;
  is_internal?: boolean;
  /** Set once the agent's client acknowledged receipt. */
  delivered_at?: string | null;
  read_at?: string | null;
  /** Client-only: still in flight, shown as a clock rather than a tick. */
  pending?: boolean;
}

interface FAQItem {
  id?: string;
  q: string;
  a: string;
  summary?: string;
  category: string;
  icon?: string;
}

class ChatifyWidget {
  private config: WidgetConfig;
  private supabase: SupabaseClient;
  private container: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;

  // Session state
  private visitorId: string;
  private conversationId: string | null = null;
  private conversationStatus: string = 'open';
  private visitorName: string = '';
  private visitorEmail: string = '';

  // UI state
  private isOpen: boolean = false;
  private activeTab: 'home' | 'messages' | 'help' = 'home';
  private unreadCount: number = 0;
  private messages: MessageItem[] = [];
  private faqs: FAQItem[] = [];
  private isPreChatCompleted: boolean = false;
  private csatRated: boolean = false;

  private audioCtx: AudioContext | null = null;

  constructor() {
    this.config = this.parseConfig();
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);

    // Initialize or restore visitor ID (scoped to workspace)
    const storageKeySuffix = this.config.workspaceId ? `_${this.config.workspaceId.slice(0, 8)}` : '';
    this.visitorId = this.getOrCreateVisitorId(storageKeySuffix);
    this.conversationId = localStorage.getItem(`chatify_conversation_id${storageKeySuffix}`);
    this.visitorName = localStorage.getItem(`chatify_visitor_name${storageKeySuffix}`) || '';
    this.visitorEmail = localStorage.getItem(`chatify_visitor_email${storageKeySuffix}`) || '';
    if (this.visitorName || this.conversationId) {
      this.isPreChatCompleted = true;
    }

    this.initDOM();
    this.loadWorkspaceArticles();
    this.fetchWorkspaceSettingsAndApply().then(() => {
      this.initVisitorTracking();
      this.initSPANavigationTracking();

      if (this.conversationId) {
        this.loadMessageHistory();
        this.subscribeToRealtime();
      }
    });
  }

  // 1. Read Script Config
  private parseConfig(): WidgetConfig {
    let script = document.currentScript as HTMLScriptElement | null;
    if (!script) {
      script = document.querySelector('script[src*="widget.js"]');
    }
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const urlWs = urlParams?.get('workspaceId') || urlParams?.get('ws') || urlParams?.get('chatify_workspace');

    return {
      supabaseUrl: script?.getAttribute('data-supabase-url') || DEFAULT_SUPABASE_URL,
      supabaseKey: script?.getAttribute('data-supabase-key') || DEFAULT_SUPABASE_KEY,
      workspaceId: urlWs || script?.getAttribute('data-workspace-id') || null,
      title: script?.getAttribute('data-title') || 'Support Team',
      subtitle: script?.getAttribute('data-subtitle') || 'We reply in under 5 minutes',
      primaryColor: script?.getAttribute('data-color') || '#2e5bff',
      position: (script?.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || 'bottom-right',
      helpTabLabel: script?.getAttribute('data-help-label') || 'Help',
      showHelpTab: script?.getAttribute('data-show-help') !== 'false',
      helpTabIcon: script?.getAttribute('data-help-icon') || '📖',
    };
  }

  // Helper for simulators: reset visitor session
  public resetSession() {
    const storageKeySuffix = this.config.workspaceId ? `_${this.config.workspaceId.slice(0, 8)}` : '';
    localStorage.removeItem(`chatify_visitor_id${storageKeySuffix}`);
    localStorage.removeItem(`chatify_conversation_id${storageKeySuffix}`);
    localStorage.removeItem(`chatify_visitor_name${storageKeySuffix}`);
    localStorage.removeItem(`chatify_visitor_email${storageKeySuffix}`);
    window.location.reload();
  }

  // 2. Fetch custom business workspace settings if workspaceId provided
  private async fetchWorkspaceSettingsAndApply() {
    if (!this.config.workspaceId) return;

    try {
      const { data, error } = await this.supabase.rpc('fn_get_workspace_config', {
        p_workspace_id: this.config.workspaceId,
      });

      if (!error && data) {
        if (data.brand_color) this.config.primaryColor = data.brand_color;
        if (data.greeting_title) this.config.title = data.greeting_title;
        if (data.greeting_message) this.config.subtitle = data.greeting_message;
        if (data.widget_position) {
          this.config.position = data.widget_position === 'left' ? 'bottom-left' : 'bottom-right';
        }
        if (data.help_center_tab_label) {
          this.config.helpTabLabel = data.help_center_tab_label;
        }
        if (data.logo_url) this.config.logoUrl = data.logo_url;
        if (data.greeting_title) this.config.greetingTitle = data.greeting_title;
        if (typeof data.show_help_tab === 'boolean') {
          this.config.showHelpTab = data.show_help_tab;
        }
        if (data.help_center_tab_icon) {
          this.config.helpTabIcon = data.help_center_tab_icon;
        }

        this.updateThemeAndTexts();

        // Check Business Hours schedule
        if (data.business_hours?.enabled) {
          const isOutside = this.isOutsideBusinessHours(data.business_hours);
          const statusPill = this.shadow?.getElementById('homeStatusPill');
          const cardSub = this.shadow?.getElementById('homeCardSub');
          const btnCta = this.shadow?.querySelector('#btnGoToMessages span');
          if (isOutside) {
            if (statusPill) {
              statusPill.innerHTML = '<span class="chatify-pulse-dot away"></span> Typically replies in a few hours';
            }
            if (cardSub) {
              cardSub.textContent = "Leave a message and we'll reply as soon as we're back online.";
            }
            if (btnCta) {
              btnCta.textContent = "Leave us a message";
            }
          } else {
            if (statusPill) {
              statusPill.innerHTML = '<span class="chatify-pulse-dot online"></span> Typically replies in 5m';
            }
            if (cardSub) {
              cardSub.textContent = "Ask us anything, or share your feedback.";
            }
            if (btnCta) {
              btnCta.textContent = "Send us a message";
            }
          }
        }
      }

      // Load Help Desk / Knowledge Base articles dynamically
      await this.loadWorkspaceArticles();
    } catch (e) {
      console.warn('[Chatify] Could not fetch workspace config:', e);
    }
  }

  private isOutsideBusinessHours(businessHours: any): boolean {
    if (!businessHours || !businessHours.enabled || !businessHours.schedule) return false;
    try {
      const now = new Date();
      const tz = businessHours.timezone || 'UTC';
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: tz }).format(now).toLowerCase();
      const daySchedule = businessHours.schedule[dayName];
      if (!daySchedule || !daySchedule.enabled) return true;

      const timeStr = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(now);
      if (timeStr < daySchedule.start || timeStr > daySchedule.end) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // 2b. Dynamic Knowledge Base Articles
  private async loadWorkspaceArticles() {
    if (!this.config.workspaceId) {
      this.faqs = [];
      this.renderFaqList();
      return;
    }

    try {
      const { data: articles, error } = await this.supabase
        .from('articles')
        .select('id, title, summary, content, category, section:help_sections(name, icon)')
        .eq('workspace_id', this.config.workspaceId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (!error && articles && articles.length > 0) {
        this.faqs = articles.map((a: any) => ({
          id: a.id,
          q: a.title,
          summary: a.summary || '',
          a: a.content,
          category: a.section?.name || a.category || 'General',
          icon: a.section?.icon || '📚',
        }));
      } else {
        this.faqs = [];
      }
      this.renderFaqList();
    } catch (err) {
      console.warn('[Chatify] Failed to fetch dynamic articles:', err);
      this.faqs = [];
      this.renderFaqList();
    }
  }

  private renderFaqList() {
    const listEl = this.shadow?.getElementById('faqList');
    if (!listEl) return;

    const cardHelpSearch = this.shadow?.getElementById('cardHelpSearch') as HTMLElement | null;
    if (cardHelpSearch) {
      cardHelpSearch.style.display = (this.config.showHelpTab !== false && this.faqs.length > 0) ? 'block' : 'none';
    }

    if (this.faqs.length === 0) {
      listEl.innerHTML = `
        <div style="padding: 36px 16px; text-align: center; color: var(--w-ink-3); font-size: 13px;">
          <div style="font-size: 28px; margin-bottom: 8px;">📖</div>
          <p style="margin: 0; font-weight: 600; color: var(--w-ink-2); font-size: 13.5px;">No help articles published yet</p>
          <p style="margin: 6px 0 0; font-size: 12px; color: var(--w-ink-3); line-height: 1.5;">Articles created in your Help Desk dashboard will appear here.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = `
      ${this.faqs
        .map(
          (faq, idx) => `
        <div class="chatify-faq-item" data-idx="${idx}" data-id="${faq.id || ''}">
          ${faq.category ? `
            <div style="font-size:11px; font-weight:600; color:var(--w-brand); margin-bottom:4px; display:flex; align-items:center; gap:4px;">
              <span>${faq.icon || '📚'}</span>
              <span>${faq.category}</span>
            </div>
          ` : ''}
          <div class="chatify-faq-q">
            <span>${faq.q}</span>
            <span class="chatify-faq-arrow">›</span>
          </div>
          <div class="chatify-faq-a">
            ${faq.summary ? `<p style="font-size:12px; font-weight:600; color:var(--w-ink); margin-bottom:6px; line-height:1.4;">${faq.summary}</p>` : ''}
            <div style="white-space:pre-wrap; line-height:1.6;">${faq.a}</div>
            ${faq.id ? `
              <div style="margin-top:12px; padding-top:8px; border-top:1px solid var(--w-line); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:11px; color:var(--w-ink-3);">Helpful?</span>
                <div class="chatify-vote-group" style="display:flex; gap:6px;">
                  <button class="chatify-vote-btn" data-art-id="${faq.id}" data-helpful="true" style="padding:3px 8px; border-radius:4px; border:1px solid var(--w-line); background:var(--w-surface); font-size:11.5px; cursor:pointer; color:var(--w-ink);">👍 Yes</button>
                  <button class="chatify-vote-btn" data-art-id="${faq.id}" data-helpful="false" style="padding:3px 8px; border-radius:4px; border:1px solid var(--w-line); background:var(--w-surface); font-size:11.5px; cursor:pointer; color:var(--w-ink);">👎 No</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `
        )
        .join('')}
      <div id="faqNoResults" style="display:none; padding: 32px 16px; text-align: center; color: var(--w-ink-3); font-size: 13px;">
        <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
        <p style="margin: 0; font-weight: 500;">No articles match your search.</p>
      </div>
    `;

    this.bindFaqListeners();
  }

  private bindFaqListeners() {
    this.shadow?.querySelectorAll('.chatify-faq-item').forEach((item) => {
      (item as HTMLElement).onclick = (e: MouseEvent) => {
        if ((e.target as HTMLElement).closest('.chatify-vote-btn')) return;
        item.classList.toggle('open');
      };
    });

    this.shadow?.querySelectorAll('.chatify-vote-btn').forEach((btn) => {
      (btn as HTMLElement).onclick = async (e) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const artId = target.getAttribute('data-art-id');
        const helpful = target.getAttribute('data-helpful') === 'true';
        const group = target.closest('.chatify-vote-group');

        if (group) {
          group.innerHTML = '<span style="font-size:11px; color:var(--w-brand); font-weight:600;">✓ Feedback sent</span>';
        }

        if (artId && this.config.workspaceId) {
          try {
            await this.supabase.rpc('fn_submit_article_feedback', {
              p_article_id: artId,
              p_workspace_id: this.config.workspaceId,
              p_visitor_id: this.visitorId,
              p_is_helpful: helpful,
              p_feedback_text: null,
            });
          } catch (err) {}
        }
      };
    });
  }

  // 3. Visitor ID Management
  private getOrCreateVisitorId(suffix: string): string {
    let id = localStorage.getItem(`chatify_visitor_id${suffix}`);
    if (!id) {
      id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      localStorage.setItem(`chatify_visitor_id${suffix}`, id);
    }
    return id;
  }

  // 4. Visitor Tracking
  private async initVisitorTracking() {
    let locationStr = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';

    try {
      const geoRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.city && geoData.country_name) {
          locationStr = `${geoData.city}, ${geoData.country_name}`;
        }
      }
    } catch {}

    try {
      await this.supabase.rpc('fn_upsert_visitor', {
        p_id: this.visitorId,
        p_name: this.visitorName || null,
        p_email: this.visitorEmail || null,
        p_current_url: window.location.href,
        p_user_agent: navigator.userAgent,
        p_ip_address: null,
        p_location: locationStr,
        p_workspace_id: this.config.workspaceId || null,
      });

      // Sent separately because fn_upsert_visitor is overloaded and cannot take
      // extra parameters. Fails quietly on projects that have not run the
      // visitor timezone/language migration yet.
      try {
        await this.supabase.rpc('fn_update_visitor_meta', {
          p_id: this.visitorId,
          p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
          p_language: navigator.language || null,
        });
      } catch {}
    } catch (e) {
      console.warn('[Chatify] Visitor tracking error:', e);
    }

    setInterval(() => {
      this.sendHeartbeat();
    }, 15000);

    const notifyOffline = () => {
      try {
        fetch(`${this.config.supabaseUrl}/rest/v1/rpc/fn_visitor_offline`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': this.config.supabaseKey,
            'Authorization': `Bearer ${this.config.supabaseKey}`,
          },
          body: JSON.stringify({ p_visitor_id: this.visitorId }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    window.addEventListener('beforeunload', notifyOffline);
    window.addEventListener('pagehide', notifyOffline);
  }

  private async sendHeartbeat() {
    try {
      await this.supabase.rpc('fn_visitor_heartbeat', {
        p_visitor_id: this.visitorId,
        p_current_url: window.location.href,
      });
    } catch {}
  }

  // 5. SPA Navigation Tracking
  private initSPANavigationTracking() {
    const notifyURLChange = () => {
      setTimeout(() => this.sendHeartbeat(), 200);
    };

    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      notifyURLChange();
      return result;
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      notifyURLChange();
      return result;
    };

    window.addEventListener('popstate', notifyURLChange);
  }

  // 6. Sound chime
  private playIncomingSound() {
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(784, now);
      osc.frequency.setValueAtTime(1046.5, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // 7. Supabase Realtime Subscription
  private subscribeToRealtime() {
    if (!this.conversationId) return;

    this.supabase
      .channel(`chatify-widget-${this.conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${this.conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          // CRITICAL SECURITY: Never render team internal notes to visitor!
          if (newMsg.is_internal) return;

          if (this.messages.some((m) => m.id === newMsg.id)) return;

          this.messages.push(newMsg);
          this.renderMessages();

          if (newMsg.sender_type !== 'visitor') {
            this.playIncomingSound();
            if (!this.isOpen || this.activeTab !== 'messages') {
              this.unreadCount += 1;
              this.updateUnreadBadge();
              // It reached this browser, so it is delivered — but the visitor
              // has not looked at it, so it is not read.
              this.markMessagesAsDelivered();
            } else {
              this.markMessagesAsRead();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${this.conversationId}`,
        },
        (payload) => {
          // The agent's receipts arrive as UPDATEs; this is what turns the
          // visitor's own ticks grey-double and then blue.
          const updated = payload.new as MessageItem;
          const i = this.messages.findIndex((m) => m.id === updated.id);
          if (i === -1) return;
          this.messages[i] = { ...this.messages[i], ...updated };
          this.renderMessages();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${this.conversationId}`,
        },
        (payload) => {
          const conv = payload.new as { status: string };
          if (conv.status) {
            this.conversationStatus = conv.status;
            this.renderMessages();
          }
        }
      )
      .subscribe();
  }

  // 8. Message History (Filters out internal notes)
  private async loadMessageHistory() {
    if (!this.conversationId) return;

    const { data } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', this.conversationId)
      .or('is_internal.is.null,is_internal.eq.false')
      .order('created_at', { ascending: true });

    if (data) {
      this.messages = data as MessageItem[];
      this.renderMessages();
      if (this.isOpen && this.activeTab === 'messages') {
        this.markMessagesAsRead();
      }
    }
  }

  /** Receipt only — the visitor has received these but not necessarily seen them. */
  private async markMessagesAsDelivered() {
    if (!this.conversationId) return;
    try {
      await this.supabase.rpc('fn_mark_messages_delivered', {
        p_conversation_id: this.conversationId,
        p_exclude_sender: 'visitor',
      });
    } catch {
      // Project has not run the receipts migration yet; ticks stay at "sent".
    }
  }

  private async markMessagesAsRead() {
    if (!this.conversationId) return;
    try {
      // Backfills delivered_at too, so a read receipt never exists on its own.
      await this.supabase.rpc('fn_mark_messages_read', {
        p_conversation_id: this.conversationId,
        p_exclude_sender: 'visitor',
      });
    } catch {
      // ignored
    }

    try {
      await this.supabase.rpc('fn_mark_conversation_messages_as_read', {
        p_conversation_id: this.conversationId,
        p_reader_type: 'visitor',
      });
    } catch {
      // ignored
    }
  }

  // 9. Conversation Management
  private async ensureConversation(): Promise<string> {
    if (this.conversationId) return this.conversationId;

    const suffix = this.config.workspaceId ? `_${this.config.workspaceId.slice(0, 8)}` : '';
    const { data, error } = await this.supabase.rpc('fn_get_or_create_conversation', {
      p_visitor_id: this.visitorId,
      p_workspace_id: this.config.workspaceId || null,
    });

    if (error || !data) {
      throw new Error('Failed to create conversation');
    }

    this.conversationId = data.id;
    this.conversationStatus = data.status || 'open';
    localStorage.setItem(`chatify_conversation_id${suffix}`, data.id);
    this.subscribeToRealtime();
    return data.id;
  }

  public async sendMessage(content: string) {
    if (!content.trim()) return;

    const convId = await this.ensureConversation();

    const tempMsg: MessageItem = {
      id: 'temp-' + Date.now(),
      sender_type: 'visitor',
      content: content.trim(),
      created_at: new Date().toISOString(),
      pending: true,
    };
    this.messages.push(tempMsg);
    this.renderMessages();

    const { data } = await this.supabase.from('messages').insert({
      conversation_id: convId,
      sender_type: 'visitor',
      content: content.trim(),
      is_internal: false,
    }).select().single();

    if (data) {
      const idx = this.messages.findIndex((m) => m.id === tempMsg.id);
      if (idx !== -1) {
        this.messages[idx] = data as MessageItem;
        this.renderMessages();
      }
    }
  }

  // Post-chat CSAT Rating
  public async submitCSAT(rating: number) {
    if (!this.conversationId) return;
    this.csatRated = true;

    await this.supabase
      .from('conversations')
      .update({ csat_rating: rating })
      .eq('id', this.conversationId);

    this.renderMessages();
  }

  // 10. DOM & Shadow Root Initialization (Intercom Messenger 2.0)
  private initDOM() {
    this.container = document.createElement('div');
    this.container.id = 'chatify-widget-root';
    document.body.appendChild(this.container);

    this.shadow = this.container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.id = 'chatify-theme-style';
    style.textContent = this.generateCSS();
    this.shadow.appendChild(style);

    // Launcher HTML
    const launcher = document.createElement('button');
    launcher.className = 'chatify-launcher';
    launcher.id = 'chatifyLauncherBtn';
    launcher.innerHTML = `
      <div class="chatify-badge" id="chatifyBadge">0</div>
      <img id="chatifyIconOpen" src="${CHATIFY_ICON_DATA_URI}" alt="Chat" class="chatify-launcher-icon" />
      <svg id="chatifyIconClose" style="display:none;" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    launcher.onclick = () => this.toggleWindow();
    this.shadow.appendChild(launcher);

    // Intercom Messenger 2.0 Multi-Tab Window
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chatify-window';
    chatWindow.id = 'chatifyWindow';
    chatWindow.innerHTML = `
      <!-- TAB 1: HOME TAB -->
      <div class="chatify-tab-pane" id="tabHome" style="display: flex;">
        <div class="chatify-home-hero">
          <div class="chatify-brand-row">
            <div class="chatify-home-avatar" id="homeBrandAvatar">
              <img src="${CHATIFY_ICON_DATA_URI}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;" />
            </div>
            <button class="chatify-icon-btn" id="homeCloseBtn" title="Close Messenger">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <h2 class="chatify-home-title" id="homeGreetingTitle">Hello there 👋</h2>
          <p class="chatify-home-sub" id="homeGreetingSub">How can our support team help you today?</p>
        </div>

        <div class="chatify-home-content">
          <!-- Start Chat Card -->
          <div class="chatify-card chatify-card-action" id="cardStartChat">
            <div class="chatify-card-head">
              <div class="chatify-avatars-stack" id="homeAvatarsStack">
                <div class="chatify-mini-avatar" style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);">A</div>
                <div class="chatify-mini-avatar" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9);">S</div>
                <div class="chatify-mini-avatar" style="background:linear-gradient(135deg,#10b981,#047857);">M</div>
              </div>
              <span class="chatify-status-pill" id="homeStatusPill">
                <span class="chatify-pulse-dot online"></span>
                <span>Typically replies in 5m</span>
              </span>
            </div>
            <h4 class="chatify-card-title">Send us a message</h4>
            <p class="chatify-card-sub" id="homeCardSub">Ask us anything, or share your feedback.</p>
            <button class="chatify-primary-cta" id="btnGoToMessages">
              <span>Send us a message</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          <!-- Help Center Quick Search (shown only when workspace has published articles) -->
          <div class="chatify-card chatify-card-help" id="cardHelpSearch" style="display: none;">
            <div class="chatify-section-title" id="homeHelpSectionTitle">Knowledge Base</div>
            <p class="chatify-card-sub" style="margin-bottom:12px;">Search self-service answers and guides:</p>
            <div class="chatify-search-trigger" id="homeSearchTrigger">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Search for help articles...</span>
              <span class="chatify-search-kbd">Search</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: MESSAGES TAB (Active Chat Thread) -->
      <div class="chatify-tab-pane" id="tabMessages" style="display: none;">
        <div class="chatify-header">
          <div class="chatify-header-info">
            <button class="chatify-back-btn" id="btnBackToHome" title="Back to Home">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <div class="chatify-avatar" id="chatifyHeaderAvatar">
              <img src="${CHATIFY_ICON_DATA_URI}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;" />
              <span class="chatify-online-dot"></span>
            </div>
            <div class="chatify-header-text">
              <h3 id="chatifyHeaderTitle">${this.config.title}</h3>
              <p id="chatifyHeaderSubtitle">${this.config.subtitle}</p>
            </div>
          </div>
          <button class="chatify-close-btn" id="chatifyCloseBtn" title="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="chatify-body" id="chatifyBody">
          ${
            !this.isPreChatCompleted
              ? `
            <div class="chatify-prechat" id="chatifyPreChat">
              <h4>👋 Welcome to Live Support</h4>
              <p>Please introduce yourself so our support team can best assist you.</p>
              <div class="chatify-form-group">
                <label>Your Name</label>
                <input type="text" id="chatifyInputName" class="chatify-input" placeholder="e.g. Sarah Connor" />
              </div>
              <div class="chatify-form-group">
                <label>Email Address</label>
                <input type="email" id="chatifyInputEmail" class="chatify-input" placeholder="sarah@example.com" />
              </div>
              <button class="chatify-start-btn" id="chatifyStartBtn">Start Live Conversation</button>
            </div>
          `
              : ''
          }
        </div>

        <div class="chatify-footer" id="chatifyFooter" style="${!this.isPreChatCompleted ? 'display:none;' : 'display:flex;'}">
          <textarea id="chatifyTextarea" class="chatify-textarea" rows="1" placeholder="Type a message..."></textarea>
          <button id="chatifySendBtn" class="chatify-send-btn" title="Send message">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <!-- TAB 3: HELP TAB (Knowledge Base) -->
      <div class="chatify-tab-pane" id="tabHelp" style="display: none;">
        <div class="chatify-header">
          <div class="chatify-header-text">
            <h3>Knowledge Base</h3>
            <p>Self-service guides &amp; FAQs</p>
          </div>
          <button class="chatify-close-btn" id="helpCloseBtn" title="Close">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="chatify-help-body">
          <div class="chatify-help-search-bar">
            <input type="text" id="helpSearchInput" placeholder="Search answers..." />
          </div>

          <div class="chatify-faq-list" id="faqList">
            <div style="padding: 36px 16px; text-align: center; color: var(--w-ink-3); font-size: 13px;">
              <div style="font-size: 28px; margin-bottom: 8px;">📖</div>
              <p style="margin: 0; font-weight: 600; color: var(--w-ink-2); font-size: 13.5px;">No help articles published yet</p>
              <p style="margin: 6px 0 0; font-size: 12px; color: var(--w-ink-3); line-height: 1.5;">Articles created in your Help Desk dashboard will appear here.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Intercom Navigation Bar -->
      <nav class="chatify-bottom-nav">
        <button class="chatify-nav-item active" data-tab="home" id="navHome">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Home</span>
        </button>
        <button class="chatify-nav-item" data-tab="messages" id="navMessages">
          <div class="nav-msg-icon-wrap">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span class="chatify-nav-badge" id="navMsgBadge" style="display:none;">1</span>
          </div>
          <span>Messages</span>
        </button>
        <button class="chatify-nav-item" data-tab="help" id="navHelp">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          <span>Help</span>
        </button>
      </nav>
    `;

    this.shadow.appendChild(chatWindow);

    // Event listeners
    this.shadow.getElementById('homeCloseBtn')?.addEventListener('click', () => this.toggleWindow());
    this.shadow.getElementById('chatifyCloseBtn')?.addEventListener('click', () => this.toggleWindow());
    this.shadow.getElementById('helpCloseBtn')?.addEventListener('click', () => this.toggleWindow());

    // Navigation Tab Switching
    this.shadow.querySelectorAll('.chatify-nav-item').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as 'home' | 'messages' | 'help';
        this.switchTab(tab);
      });
    });

    this.shadow.getElementById('btnGoToMessages')?.addEventListener('click', () => {
      this.switchTab('messages');
    });

    this.shadow.getElementById('btnBackToHome')?.addEventListener('click', () => {
      this.switchTab('home');
    });

    this.shadow.getElementById('homeSearchTrigger')?.addEventListener('click', () => {
      this.switchTab('help');
      setTimeout(() => {
        (this.shadow?.getElementById('helpSearchInput') as HTMLInputElement)?.focus();
      }, 100);
    });

    // FAQ Accordion & Reactions
    this.bindFaqListeners();

    // FAQ Search Input
    const faqSearch = this.shadow.getElementById('helpSearchInput') as HTMLInputElement | null;
    faqSearch?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value.toLowerCase().trim();
      let matchCount = 0;
      this.shadow?.querySelectorAll('.chatify-faq-item').forEach((item) => {
        const text = item.textContent?.toLowerCase() || '';
        const matches = text.includes(q);
        (item as HTMLElement).style.display = matches ? 'block' : 'none';
        if (matches) matchCount++;
      });
      const noResultsEl = this.shadow?.getElementById('faqNoResults');
      if (noResultsEl) {
        noResultsEl.style.display = (this.faqs.length > 0 && q && matchCount === 0) ? 'block' : 'none';
      }
    });

    const startBtn = this.shadow.getElementById('chatifyStartBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.handleStartPreChat());
    }

    const sendBtn = this.shadow.getElementById('chatifySendBtn');
    const textarea = this.shadow.getElementById('chatifyTextarea') as HTMLTextAreaElement | null;

    sendBtn?.addEventListener('click', () => this.handleSendMessage());
    textarea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    });
  }

  public switchTab(tab: 'home' | 'messages' | 'help') {
    this.activeTab = tab;

    const tabHome = this.shadow?.getElementById('tabHome');
    const tabMessages = this.shadow?.getElementById('tabMessages');
    const tabHelp = this.shadow?.getElementById('tabHelp');

    if (tabHome) tabHome.style.display = tab === 'home' ? 'flex' : 'none';
    if (tabMessages) tabMessages.style.display = tab === 'messages' ? 'flex' : 'none';
    if (tabHelp) tabHelp.style.display = tab === 'help' ? 'flex' : 'none';

    this.shadow?.querySelectorAll('.chatify-nav-item').forEach((nav) => {
      nav.classList.toggle('active', nav.getAttribute('data-tab') === tab);
    });

    if (tab === 'messages') {
      this.unreadCount = 0;
      this.updateUnreadBadge();
      this.markMessagesAsRead();
      const body = this.shadow?.getElementById('chatifyBody');
      if (body) body.scrollTop = body.scrollHeight;
      setTimeout(() => {
        (this.shadow?.getElementById('chatifyTextarea') as HTMLTextAreaElement | null)?.focus();
      }, 100);
    }
  }

  private updateThemeAndTexts() {
    const styleEl = this.shadow?.getElementById('chatify-theme-style');
    if (styleEl) {
      styleEl.textContent = this.generateCSS();
    }
    const titleEl = this.shadow?.getElementById('chatifyHeaderTitle');
    if (titleEl) titleEl.textContent = this.config.title;
    const subEl = this.shadow?.getElementById('chatifyHeaderSubtitle');
    if (subEl) subEl.textContent = this.config.subtitle;

    const brandAvatar = this.shadow?.getElementById('homeBrandAvatar');
    if (brandAvatar) {
      const logoSrc = this.config.logoUrl || CHATIFY_ICON_DATA_URI;
      brandAvatar.innerHTML = `<img src="${logoSrc}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit;" />`;
    }

    const homeGreeting = this.shadow?.getElementById('homeGreetingTitle');
    if (homeGreeting && this.config.title) {
      // Strip a trailing emoji as well as the boilerplate: workspace titles
      // often already end in a wave, which produced "Hello from Chatify 👋 👋".
      const cleanTitle = this.config.title
        .replace(/^Welcome to\s+/i, '')
        .replace(/Support!?/i, '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}️]+\s*$/u, '')
        .trim();
      homeGreeting.textContent = cleanTitle ? `Hello from ${cleanTitle} 👋` : 'Hello there 👋';
    }

    // Carry the workspace's own greeting through to the Home tab
    const homeSub = this.shadow?.getElementById('homeGreetingSub');
    if (homeSub && this.config.subtitle) homeSub.textContent = this.config.subtitle;

    // Apply custom Help Tab label, header title, and search placeholder
    const navHelpText = this.shadow?.querySelector('#navHelp span');
    if (navHelpText && this.config.helpTabLabel) {
      navHelpText.textContent = this.config.helpTabLabel;
    }

    const helpTabTitle = this.shadow?.querySelector('#tabHelp .chatify-header-text h3');
    if (helpTabTitle && this.config.helpTabLabel) {
      helpTabTitle.textContent = this.config.helpTabLabel;
    }

    const homeHelpCardTitle = this.shadow?.querySelector('#cardHelpSearch .chatify-section-title');
    if (homeHelpCardTitle && this.config.helpTabLabel) {
      homeHelpCardTitle.textContent = this.config.helpTabLabel;
    }

    const homeSearchSpan = this.shadow?.querySelector('#homeSearchTrigger span');
    if (homeSearchSpan && this.config.helpTabLabel) {
      homeSearchSpan.textContent = `🔍 Search for ${this.config.helpTabLabel.toLowerCase()} articles...`;
    }

    // Toggle Help Tab & Home Card Visibility based on showHelpTab setting
    const navHelpBtn = this.shadow?.getElementById('navHelp') as HTMLElement | null;
    const cardHelpSearch = this.shadow?.getElementById('cardHelpSearch') as HTMLElement | null;
    if (this.config.showHelpTab === false) {
      if (navHelpBtn) navHelpBtn.style.display = 'none';
      if (cardHelpSearch) cardHelpSearch.style.display = 'none';
    } else {
      if (navHelpBtn) navHelpBtn.style.display = 'flex';
      if (cardHelpSearch) cardHelpSearch.style.display = this.faqs.length > 0 ? 'block' : 'none';
    }
  }

  /* ---------------------------------------------------------------- theme */

  /** Parses #rgb / #rrggbb into an [r,g,b] triple. Falls back to the default blue. */
  private rgb(hex: string): [number, number, number] {
    let h = (hex || '').trim().replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (!/^[0-9a-fA-F]{6}$/.test(h)) h = '2e5bff';
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }

  /** Relative luminance, used to decide black-vs-white text on the brand colour. */
  private luminance(hex: string): number {
    const [r, g, b] = this.rgb(hex).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /** Mixes the brand colour toward black (amount < 0) or white (amount > 0). */
  private shade(hex: string, amount: number): string {
    const [r, g, b] = this.rgb(hex);
    const target = amount > 0 ? 255 : 0;
    const t = Math.abs(amount);
    const mix = (c: number) => Math.round(c + (target - c) * t);
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
  }

  private alpha(hex: string, a: number): string {
    const [r, g, b] = this.rgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  private generateCSS(): string {
    const brand = this.config.primaryColor || '#2e5bff';
    // White text on anything but a very light brand colour.
    const onBrand = this.luminance(brand) > 0.62 ? '#0b0b0f' : '#ffffff';
    const brandDeep = this.shade(brand, -0.34);
    const left = this.config.position === 'bottom-left';

    return `
      :host {
        --w-brand: ${brand};
        --w-brand-deep: ${brandDeep};
        --w-on-brand: ${onBrand};
        --w-brand-a08: ${this.alpha(brand, 0.08)};
        --w-brand-a16: ${this.alpha(brand, 0.16)};
        --w-brand-a28: ${this.alpha(brand, 0.28)};

        --w-surface: #ffffff;
        --w-surface-2: #f7f7f5;
        --w-surface-3: #efefec;
        --w-canvas: #fbfbf9;

        --w-ink: #0b0b0f;
        --w-ink-2: #56575e;
        --w-ink-3: #8b8c93;

        --w-line: #e7e7e3;
        --w-line-2: #d6d6d1;

        --w-success: #0f9d76;

        --w-r-sm: 10px;
        --w-r-md: 14px;
        --w-r-lg: 18px;
        --w-r-xl: 22px;

        --w-shadow-sm: 0 1px 3px rgba(11,11,15,.07), 0 1px 2px rgba(11,11,15,.04);
        --w-shadow-md: 0 6px 18px rgba(11,11,15,.09), 0 2px 6px rgba(11,11,15,.05);
        --w-shadow-xl: 0 32px 68px rgba(11,11,15,.18), 0 12px 26px rgba(11,11,15,.10);

        --w-ease: cubic-bezier(.22,.61,.36,1);
        --w-ease-out: cubic-bezier(.16,1,.3,1);
        --w-spring: cubic-bezier(.34,1.4,.64,1);

        color-scheme: light;
      }

      /* Follows the host site's colour scheme so the messenger never looks
         pasted onto a dark page. */
      @media (prefers-color-scheme: dark) {
        :host {
          --w-surface: #101013;
          --w-surface-2: #17171b;
          --w-surface-3: #202026;
          --w-canvas: #0b0b0e;

          --w-ink: #f5f5f3;
          --w-ink-2: #a2a2aa;
          --w-ink-3: #6e6e78;

          --w-line: #232329;
          --w-line-2: #2f2f37;

          --w-success: #34d9a7;

          --w-shadow-sm: 0 1px 3px rgba(0,0,0,.5);
          --w-shadow-md: 0 6px 18px rgba(0,0,0,.55);
          --w-shadow-xl: 0 32px 68px rgba(0,0,0,.7), 0 12px 26px rgba(0,0,0,.5);

          color-scheme: dark;
        }
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
          "Helvetica Neue", Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }

      button { font: inherit; cursor: pointer; }

      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: var(--w-line-2);
        border-radius: 999px;
        border: 2px solid transparent;
        background-clip: content-box;
      }

      /* ── Launcher ─────────────────────────────────────────────────── */

      .chatify-launcher {
        position: fixed;
        ${left ? 'left: 20px;' : 'right: 20px;'}
        bottom: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        border: none;
        background: var(--w-brand);
        color: var(--w-on-brand);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px var(--w-brand-a28), 0 2px 8px rgba(11,11,15,.16);
        z-index: 2147483000;
        transition: transform .28s var(--w-spring), box-shadow .2s var(--w-ease);
      }

      .chatify-launcher:hover {
        transform: scale(1.07) translateY(-1px);
        box-shadow: 0 16px 38px var(--w-brand-a28), 0 6px 14px rgba(11,11,15,.22);
      }

      .chatify-launcher:active { transform: scale(.95); }

      /* An expanding ring, drawn only while messages are waiting. A launcher
         that pulses permanently is just noise the visitor learns to ignore. */
      .chatify-launcher::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 2px solid var(--w-brand);
        opacity: 0;
        pointer-events: none;
      }

      .chatify-launcher.has-unread::after {
        animation: w-halo 2.4s var(--w-ease-out) infinite;
      }

      .chatify-launcher-icon {
        width: 36px;
        height: 36px;
        object-fit: contain;
        display: block;
        pointer-events: none;
        transition: transform .25s var(--w-ease), opacity .18s var(--w-ease);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.22));
      }

      .chatify-launcher:hover .chatify-launcher-icon {
        transform: scale(1.1);
      }

      .chatify-launcher svg {
        width: 25px;
        height: 25px;
        fill: currentColor;
        transition: transform .25s var(--w-ease), opacity .18s var(--w-ease);
      }

      .chatify-badge {
        position: absolute;
        top: -2px;
        ${left ? 'left: -2px;' : 'right: -2px;'}
        min-width: 20px;
        height: 20px;
        padding: 0 5px;
        border-radius: 999px;
        background: #e11d48;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        display: none;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--w-surface);
        animation: w-pop .28s var(--w-spring);
      }

      /* ── Window ───────────────────────────────────────────────────── */

      .chatify-window {
        position: fixed;
        ${left ? 'left: 20px;' : 'right: 20px;'}
        bottom: 88px;
        width: 396px;
        max-width: calc(100vw - 40px);
        height: 640px;
        max-height: calc(100vh - 120px);
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-xl);
        box-shadow: var(--w-shadow-xl);
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483000;
        animation: w-window-in .34s var(--w-ease) both;
      }

      @media (max-width: 480px) {
        .chatify-window {
          left: 0; right: 0; bottom: 0;
          width: 100vw;
          max-width: 100vw;
          height: 100dvh;
          max-height: 100dvh;
          border-radius: 0;
          border: none;
        }
      }

      .chatify-tab-pane {
        flex: 1;
        min-height: 0;
        flex-direction: column;
        overflow: hidden;
        animation: w-fade .22s var(--w-ease);
      }

      /* ── Home tab ─────────────────────────────────────────────────── */

      .chatify-home-hero {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        padding: 24px 22px 56px;
        background: linear-gradient(150deg, var(--w-brand) 0%, var(--w-brand-deep) 100%);
        color: #ffffff;
        flex-shrink: 0;
      }

      /* Two offset colour pools that drift against each other. The movement is
         slow and low-contrast on purpose — it should read as depth, not as an
         animation demanding attention. */
      .chatify-home-hero::before {
        content: '';
        position: absolute;
        inset: -40%;
        z-index: -1;
        background:
          radial-gradient(38% 42% at 22% 26%, rgba(255, 255, 255, 0.30), transparent 62%),
          radial-gradient(34% 38% at 78% 12%, rgba(255, 255, 255, 0.18), transparent 60%),
          radial-gradient(44% 46% at 62% 88%, var(--w-brand-a28), transparent 64%);
        animation: w-aurora 22s var(--w-ease) infinite alternate;
      }

      /* A whisper of grain stops the gradient from banding on wide screens. */
      .chatify-home-hero::after {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        opacity: 0.055;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E");
      }

      .chatify-brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 22px;
      }

      .chatify-home-avatar {
        width: 38px;
        height: 38px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.2);
        border: 1.5px solid rgba(255, 255, 255, 0.32);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 7px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      .chatify-home-avatar img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .chatify-icon-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.22);
        background: rgba(255, 255, 255, 0.16);
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        transition: all .2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .chatify-icon-btn:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.06);
      }

      .chatify-home-title {
        font-size: 27px;
        font-weight: 700;
        letter-spacing: -0.032em;
        line-height: 1.18;
        color: #ffffff;
        text-wrap: balance;
        text-shadow: 0 1px 12px rgba(0, 0, 0, 0.14);
      }

      .chatify-home-sub {
        margin-top: 6px;
        font-size: 14px;
        line-height: 1.45;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
      }

      /* Each block rises a beat after the one above it. The whole sequence is
         under a third of a second, so it reads as the panel settling rather
         than as something the visitor has to wait for. */
      .chatify-home-content > * {
        animation: w-rise .34s var(--w-ease-out) both;
      }
      .chatify-home-content > *:nth-child(1) { animation-delay: .04s; }
      .chatify-home-content > *:nth-child(2) { animation-delay: .10s; }
      .chatify-home-content > *:nth-child(3) { animation-delay: .16s; }
      .chatify-home-content > *:nth-child(4) { animation-delay: .22s; }

      .chatify-home-content {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        margin-top: -30px;
        padding: 16px;
        background: var(--w-canvas);
        border-radius: 20px 20px 0 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .chatify-card {
        background: var(--w-surface);
        border: 1px solid rgba(0, 0, 0, 0.07);
        border-radius: 18px;
        padding: 18px;
        box-shadow: 0 4px 18px -2px rgba(15, 23, 42, 0.06), 0 10px 28px -4px rgba(15, 23, 42, 0.08);
      }

      .chatify-card-action {
        transition: box-shadow .24s var(--w-ease), transform .24s var(--w-ease);
      }

      .chatify-card-action:hover {
        box-shadow: 0 8px 28px -2px rgba(15, 23, 42, 0.10), 0 18px 42px -6px rgba(15, 23, 42, 0.14);
        transform: translateY(-2px);
        border-color: var(--w-brand-a28);
      }

      .chatify-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .chatify-avatars-stack {
        display: flex;
        align-items: center;
      }

      .chatify-mini-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--w-surface);
        margin-left: -8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }

      .chatify-mini-avatar:first-child {
        margin-left: 0;
      }

      .chatify-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        height: 24px;
        padding: 0 10px;
        border-radius: 999px;
        background: var(--w-surface-2);
        border: 1px solid var(--w-line);
        font-size: 11.5px;
        font-weight: 600;
        color: var(--w-ink-2);
        white-space: nowrap;
      }

      .chatify-pulse-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        display: inline-block;
      }

      .chatify-pulse-dot.online {
        background: #10b981;
        box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
      }

      .chatify-pulse-dot.away {
        background: #f59e0b;
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
      }

      .chatify-card-title {
        font-size: 17px;
        font-weight: 700;
        color: var(--w-ink);
        letter-spacing: -0.015em;
        margin-bottom: 4px;
      }

      .chatify-card-sub {
        font-size: 13px;
        color: var(--w-ink-2);
        line-height: 1.45;
        margin-bottom: 16px;
      }

      .chatify-primary-cta {
        width: 100%;
        height: 44px;
        border-radius: 12px;
        background: var(--w-brand);
        color: #ffffff;
        font-weight: 600;
        font-size: 14px;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 4px 14px var(--w-brand-a28);
        transition: all .2s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .chatify-primary-cta:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px var(--w-brand-a28);
        filter: brightness(1.04);
      }

      .chatify-primary-cta:active {
        transform: translateY(0);
        filter: brightness(0.98);
      }

      .chatify-chips-section {
        margin-top: 4px;
      }

      .chatify-section-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--w-ink-3);
        margin-bottom: 8px;
        padding-left: 2px;
      }

      .chatify-chips-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .chatify-chip {
        width: 100%;
        padding: 11px 14px;
        border-radius: 12px;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        color: var(--w-ink);
        font-size: 13px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        transition: all .18s var(--w-ease);
      }

      .chatify-chip:hover {
        background: var(--w-brand-a08);
        border-color: var(--w-brand-a28);
        transform: translateX(3px);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
      }

      .chatify-chip-arrow {
        color: var(--w-ink-3);
        font-size: 16px;
        font-weight: 600;
        transition: transform .18s var(--w-ease), color .18s var(--w-ease);
      }

      .chatify-chip:hover .chatify-chip-arrow {
        color: var(--w-brand);
        transform: translateX(3px);
      }

      .chatify-search-trigger {
        background: var(--w-surface-2);
        border: 1px solid var(--w-line);
        border-radius: 12px;
        padding: 11px 14px;
        color: var(--w-ink-3);
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 10px;
        cursor: pointer;
        transition: all .18s var(--w-ease);
      }

      .chatify-search-trigger:hover {
        background: var(--w-surface);
        border-color: var(--w-brand-a28);
        color: var(--w-ink);
      }

      .chatify-search-kbd {
        margin-left: auto;
        font-size: 10px;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: 6px;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        color: var(--w-ink-3);
      }

      /* ── Thread header ────────────────────────────────────────────── */

      .chatify-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 13px 16px;
        border-bottom: 1px solid var(--w-line);
        background: var(--w-surface);
        flex-shrink: 0;
      }

      .chatify-header-info { display: flex; align-items: center; gap: 10px; min-width: 0; }

      .chatify-back-btn,
      .chatify-close-btn {
        width: 30px;
        height: 30px;
        border-radius: var(--w-r-sm);
        border: none;
        background: transparent;
        color: var(--w-ink-3);
        font-size: 15px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: background .16s var(--w-ease), color .16s var(--w-ease);
      }

      .chatify-back-btn:hover,
      .chatify-close-btn:hover { background: var(--w-surface-3); color: var(--w-ink); }

      .chatify-avatar {
        position: relative;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: var(--w-brand);
        color: var(--w-on-brand);
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chatify-online-dot {
        position: absolute;
        right: -1px;
        bottom: -1px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--w-success);
        border: 2px solid var(--w-surface);
      }

      .chatify-header-text { min-width: 0; }

      .chatify-header-text h3 {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: -.012em;
        color: var(--w-ink);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .chatify-header-text p {
        font-size: 12px;
        color: var(--w-ink-3);
        margin-top: 1px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ── Message body ─────────────────────────────────────────────── */

      .chatify-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 16px;
        background: var(--w-canvas);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .chatify-prechat {
        margin: auto 0;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md);
        padding: 20px;
        box-shadow: var(--w-shadow-sm);
        animation: w-rise .35s var(--w-ease) both;
      }

      .chatify-prechat h4 {
        font-size: 16px;
        font-weight: 600;
        letter-spacing: -.014em;
        color: var(--w-ink);
      }

      .chatify-prechat p {
        margin: 5px 0 18px;
        font-size: 13px;
        line-height: 1.55;
        color: var(--w-ink-2);
      }

      .chatify-form-group { margin-bottom: 12px; }

      .chatify-form-group label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: var(--w-ink-2);
        margin-bottom: 6px;
      }

      .chatify-input {
        width: 100%;
        height: 42px;
        padding: 0 12px;
        border-radius: var(--w-r-sm);
        border: 1px solid var(--w-line-2);
        background: var(--w-surface);
        color: var(--w-ink);
        font-size: 13.5px;
        outline: none;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease);
      }

      .chatify-input::placeholder { color: var(--w-ink-3); }

      .chatify-input:focus {
        border-color: var(--w-brand);
        box-shadow: 0 0 0 3px var(--w-brand-a16);
      }

      .chatify-start-btn {
        width: 100%;
        height: 44px;
        margin-top: 6px;
        border: none;
        border-radius: var(--w-r-sm);
        background: var(--w-brand);
        color: var(--w-on-brand);
        font-size: 14px;
        font-weight: 600;
        box-shadow: var(--w-shadow-sm);
        transition: filter .16s var(--w-ease), transform .12s var(--w-ease);
      }

      .chatify-start-btn:hover { filter: brightness(1.08); }
      .chatify-start-btn:active { transform: scale(.985); }

      .chatify-message-row {
        display: flex;
        animation: w-bubble-in .3s var(--w-ease-out) both;
      }

      .chatify-msg-visitor,
      .chatify-msg-agent {
        max-width: 82%;
        padding: 10px 13px;
        font-size: 13.5px;
        line-height: 1.55;
      }

      /* pre-wrap belongs on the text node only — on the bubble it would also
         render the markup's own indentation as blank lines. */
      .chatify-msg-text {
        white-space: pre-wrap;
        word-wrap: break-word;
        overflow-wrap: anywhere;
      }

      .chatify-msg-visitor {
        margin-left: auto;
        background: linear-gradient(145deg, var(--w-brand) 0%, var(--w-brand-deep) 130%);
        color: var(--w-on-brand);
        border-radius: 18px 18px 5px 18px;
        box-shadow: 0 2px 10px var(--w-brand-a28), 0 1px 2px rgba(11, 11, 15, 0.10);
      }

      .chatify-msg-agent {
        margin-right: auto;
        background: var(--w-surface);
        color: var(--w-ink);
        border-radius: 18px 18px 18px 5px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
        border: 1px solid var(--w-line);
      }

      .chatify-msg-time {
        margin-top: 4px;
        font-size: 10.5px;
        color: var(--w-ink-3);
        text-align: right;
      }

      .chatify-msg-visitor .chatify-msg-time {
        color: inherit;
        opacity: .78;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
      }

      .chatify-tick {
        display: inline-flex;
        align-items: center;
        color: currentColor;
        opacity: .85;
      }

      /* The single place colour carries meaning instead of decoration. */
      .chatify-tick-read {
        color: #53bdeb;
        opacity: 1;
      }

      /* ── CSAT ─────────────────────────────────────────────────────── */

      .chatify-csat-box {
        margin-top: 6px;
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md);
        padding: 16px;
        text-align: center;
        box-shadow: var(--w-shadow-sm);
        animation: w-rise .3s var(--w-ease) both;
      }

      .chatify-csat-title {
        font-size: 14px;
        font-weight: 600;
        letter-spacing: -.012em;
        color: var(--w-ink);
      }

      .chatify-csat-sub {
        margin-top: 3px;
        font-size: 12px;
        color: var(--w-ink-3);
      }

      .chatify-csat-emojis {
        margin-top: 12px;
        display: flex;
        justify-content: center;
        gap: 6px;
      }

      .chatify-csat-btn {
        width: 42px;
        height: 42px;
        border-radius: var(--w-r-sm);
        border: 1px solid var(--w-line);
        background: var(--w-surface-2);
        font-size: 20px;
        line-height: 1;
        transition: transform .18s var(--w-spring), border-color .16s var(--w-ease),
          background .16s var(--w-ease);
      }

      .chatify-csat-btn:hover {
        transform: scale(1.16) translateY(-2px);
        border-color: var(--w-brand);
        background: var(--w-brand-a08);
      }

      /* ── Composer ─────────────────────────────────────────────────── */

      .chatify-footer {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 12px 14px;
        border-top: 1px solid var(--w-line);
        background: var(--w-surface);
        flex-shrink: 0;
      }

      .chatify-textarea {
        flex: 1;
        min-height: 42px;
        max-height: 120px;
        padding: 11px 13px;
        border-radius: var(--w-r-md);
        border: 1px solid var(--w-line-2);
        background: var(--w-surface-2);
        color: var(--w-ink);
        font-size: 13.5px;
        line-height: 1.45;
        resize: none;
        outline: none;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease);
      }

      .chatify-textarea::placeholder { color: var(--w-ink-3); }

      .chatify-textarea:focus {
        border-color: var(--w-brand);
        box-shadow: 0 0 0 3px var(--w-brand-a16);
      }

      .chatify-send-btn {
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        border: none;
        border-radius: var(--w-r-md);
        background: var(--w-brand);
        color: var(--w-on-brand);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--w-shadow-sm);
        transition: filter .16s var(--w-ease), transform .12s var(--w-ease);
      }

      .chatify-send-btn:hover {
        filter: brightness(1.08);
        transform: translateY(-1px) scale(1.04);
        box-shadow: 0 6px 16px var(--w-brand-a28);
      }
      .chatify-send-btn:active { transform: scale(.94); }

      .chatify-send-btn svg { width: 19px; height: 19px; fill: currentColor; }

      /* ── Help tab ─────────────────────────────────────────────────── */

      .chatify-help-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 14px;
        background: var(--w-canvas);
      }

      .chatify-help-search-bar { margin-bottom: 12px; }

      .chatify-help-search-bar input {
        width: 100%;
        height: 42px;
        padding: 0 13px;
        border-radius: var(--w-r-sm);
        border: 1px solid var(--w-line-2);
        background: var(--w-surface);
        color: var(--w-ink);
        font-size: 13.5px;
        outline: none;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease);
      }

      .chatify-help-search-bar input::placeholder { color: var(--w-ink-3); }

      .chatify-help-search-bar input:focus {
        border-color: var(--w-brand);
        box-shadow: 0 0 0 3px var(--w-brand-a16);
      }

      .chatify-faq-list { display: flex; flex-direction: column; gap: 8px; }

      .chatify-faq-item {
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md);
        padding: 13px 14px;
        cursor: pointer;
        transition: border-color .16s var(--w-ease), box-shadow .16s var(--w-ease);
      }

      .chatify-faq-item:hover { border-color: var(--w-line-2); box-shadow: var(--w-shadow-sm); }
      .chatify-faq-item.open { border-color: var(--w-brand); }

      .chatify-faq-q {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        font-size: 13.5px;
        font-weight: 600;
        line-height: 1.4;
        color: var(--w-ink);
      }

      .chatify-faq-arrow {
        color: var(--w-ink-3);
        font-size: 17px;
        line-height: 1;
        flex-shrink: 0;
        transition: transform .22s var(--w-ease), color .16s var(--w-ease);
      }

      .chatify-faq-item.open .chatify-faq-arrow {
        transform: rotate(90deg);
        color: var(--w-brand);
      }

      .chatify-faq-a {
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        font-size: 13px;
        line-height: 1.6;
        color: var(--w-ink-2);
        transition: max-height .28s var(--w-ease), opacity .22s var(--w-ease),
          margin-top .28s var(--w-ease);
      }

      .chatify-faq-item.open .chatify-faq-a {
        max-height: 260px;
        opacity: 1;
        margin-top: 9px;
      }

      /* ── Bottom navigation ────────────────────────────────────────── */

      .chatify-bottom-nav {
        display: flex;
        border-top: 1px solid rgba(0, 0, 0, 0.07);
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        padding: 6px 10px calc(8px + env(safe-area-inset-bottom, 0px));
        flex-shrink: 0;
        height: 64px;
        box-sizing: border-box;
      }

      .chatify-nav-item {
        position: relative;
        flex: 1;
        border: none;
        background: transparent;
        color: #64748b;
        padding: 6px 0 4px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        transition: all .18s var(--w-ease);
      }

      .chatify-nav-item svg {
        transition: transform .2s var(--w-spring), color .18s var(--w-ease);
      }

      .chatify-nav-item:hover {
        color: #1e293b;
        background: rgba(0, 0, 0, 0.03);
      }

      .chatify-nav-item.active {
        color: var(--w-brand);
        font-weight: 700;
      }

      .chatify-nav-item.active svg {
        transform: translateY(-1px) scale(1.08);
      }

      .chatify-nav-item.active::after {
        content: '';
        position: absolute;
        bottom: 2px;
        width: 16px;
        height: 3px;
        border-radius: 999px;
        background: var(--w-brand);
      }

      .nav-msg-icon-wrap { position: relative; display: flex; }

      .chatify-nav-badge {
        position: absolute;
        top: -3px;
        right: -6px;
        min-width: 15px;
        height: 15px;
        padding: 0 4px;
        border-radius: 999px;
        background: #e11d48;
        color: #fff;
        font-size: 9.5px;
        font-weight: 700;
        display: none;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--w-surface);
      }

      /* ── Motion ───────────────────────────────────────────────────── */

      @keyframes w-bubble-in {
        from { opacity: 0; transform: translateY(8px) scale(.97); }
        to   { opacity: 1; transform: none; }
      }

      @keyframes w-aurora {
        from { transform: translate3d(-4%, -3%, 0) scale(1); }
        to   { transform: translate3d(5%, 4%, 0) scale(1.12); }
      }

      @keyframes w-halo {
        0%        { transform: scale(1);   opacity: .5; }
        70%, 100% { transform: scale(1.7); opacity: 0; }
      }

      @keyframes w-window-in {
        from { opacity: 0; transform: translateY(14px) scale(.985); }
        to   { opacity: 1; transform: none; }
      }

      @keyframes w-rise {
        from { opacity: 0; transform: translateY(7px); }
        to   { opacity: 1; transform: none; }
      }

      @keyframes w-fade { from { opacity: 0; } to { opacity: 1; } }

      @keyframes w-pop {
        from { opacity: 0; transform: scale(.6); }
        to   { opacity: 1; transform: none; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: .01ms !important;
          transition-duration: .01ms !important;
        }
      }
    `;
  }

  // 11. Handlers
  private async handleStartPreChat() {
    const nameInput = this.shadow?.getElementById('chatifyInputName') as HTMLInputElement | null;
    const emailInput = this.shadow?.getElementById('chatifyInputEmail') as HTMLInputElement | null;

    this.visitorName = nameInput?.value.trim() || '';
    this.visitorEmail = emailInput?.value.trim() || '';

    const suffix = this.config.workspaceId ? `_${this.config.workspaceId.slice(0, 8)}` : '';
    localStorage.setItem(`chatify_visitor_name${suffix}`, this.visitorName);
    localStorage.setItem(`chatify_visitor_email${suffix}`, this.visitorEmail);

    await this.supabase.rpc('fn_upsert_visitor', {
      p_id: this.visitorId,
      p_name: this.visitorName || null,
      p_email: this.visitorEmail || null,
      p_current_url: window.location.href,
      p_user_agent: navigator.userAgent,
      p_workspace_id: this.config.workspaceId || null,
    });

    this.isPreChatCompleted = true;

    this.shadow?.getElementById('chatifyPreChat')?.remove();
    const footer = this.shadow?.getElementById('chatifyFooter');
    if (footer) footer.style.display = 'flex';

    const convId = await this.ensureConversation();

    // Send auto welcome message immediately before visitor types/sends any message
    const { data: existingMsgs } = await this.supabase
      .from('messages')
      .select('id')
      .eq('conversation_id', convId)
      .limit(1);

    if (!existingMsgs || existingMsgs.length === 0) {
      const welcomeContent = this.config.welcomeText || 'welcome to the Range4ex';
      const { data: savedMsg } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_type: 'agent',
          content: welcomeContent,
          is_internal: false,
        })
        .select()
        .single();

      if (savedMsg) {
        this.messages.push(savedMsg as MessageItem);
      }
    }

    this.renderMessages();
  }

  private async handleSendMessage() {
    const textarea = this.shadow?.getElementById('chatifyTextarea') as HTMLTextAreaElement | null;
    if (!textarea) return;
    const text = textarea.value.trim();
    if (!text) return;
    textarea.value = '';

    await this.sendMessage(text);
  }

  private renderMessages() {
    const body = this.shadow?.getElementById('chatifyBody');
    if (!body || !this.isPreChatCompleted) return;

    body.innerHTML = '';

    if (this.messages.length === 0) {
      body.innerHTML = `
        <div style="text-align:center; margin:auto 0; padding:0 18px;">
          <p style="color:var(--w-ink); font-size:15px; font-weight:600; letter-spacing:-.012em; margin-bottom:5px;">How can we help?</p>
          <p style="color:var(--w-ink-2); font-size:13px; line-height:1.55;">Send a message below and someone from our team will pick it up.</p>
        </div>
      `;
      return;
    }

    this.messages.forEach((msg) => {
      // Security: never render internal notes to visitor!
      if (msg.is_internal) return;

      const isVisitor = msg.sender_type === 'visitor';
      const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const row = document.createElement('div');
      row.className = 'chatify-message-row';

      const bubble = document.createElement('div');
      bubble.className = isVisitor ? 'chatify-msg-visitor' : 'chatify-msg-agent';
      // Kept on one line: the text element preserves whitespace, so any
      // indentation in this template would be rendered as blank lines.
      // Ticks only on the visitor's own messages: a receipt for something the
      // other side sent you is meaningless.
      const ticks = isVisitor ? this.renderTicks(msg) : '';
      bubble.innerHTML =
        `<div class="chatify-msg-text">${this.escapeHTML(msg.content)}</div>` +
        `<div class="chatify-msg-time">${timeStr}${ticks}</div>`;

      row.appendChild(bubble);
      body.appendChild(row);
    });

    // If conversation is closed, render CSAT Satisfaction Rating Box
    if (this.conversationStatus === 'closed' && !this.csatRated) {
      const csatCard = document.createElement('div');
      csatCard.className = 'chatify-csat-box';
      csatCard.innerHTML = `
        <div class="chatify-csat-title">How was your conversation?</div>
        <div class="chatify-csat-sub">Please rate the support you received today:</div>
        <div class="chatify-csat-emojis">
          <button class="chatify-csat-btn" data-val="1" title="Terrible">😡</button>
          <button class="chatify-csat-btn" data-val="2" title="Bad">🙁</button>
          <button class="chatify-csat-btn" data-val="3" title="Okay">😐</button>
          <button class="chatify-csat-btn" data-val="4" title="Good">🙂</button>
          <button class="chatify-csat-btn" data-val="5" title="Amazing!">🤩</button>
        </div>
      `;
      csatCard.querySelectorAll('.chatify-csat-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const val = parseInt((e.currentTarget as HTMLElement).getAttribute('data-val') || '5', 10);
          this.submitCSAT(val);
        });
      });
      body.appendChild(csatCard);
    } else if (this.csatRated) {
      const thankYou = document.createElement('div');
      thankYou.style.cssText = 'text-align:center; padding:12px; font-size:12.5px; color:var(--w-success); font-weight:600;';
      thankYou.textContent = '✓ Thank you for rating our support!';
      body.appendChild(thankYou);
    }

    body.scrollTop = body.scrollHeight;
  }

  /**
   * WhatsApp's four states, each backed by a fact rather than a guess:
   *   pending   clock    not yet stored on the server
   *   sent      one tick stored, nobody has acknowledged it
   *   delivered two ticks the agent's client received it
   *   read      two blue the agent opened the conversation
   */
  private renderTicks(msg: MessageItem): string {
    const single =
      '<path d="M1 5.2 3.4 7.6 9 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
    const double =
      '<path d="M1 5.2 3.4 7.6 9 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M5.5 5.2 7.9 7.6 13.5 2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';

    if (msg.pending) {
      return (
        '<span class="chatify-tick" title="Sending">' +
        '<svg viewBox="0 0 14 10" width="15" height="11">' +
        '<circle cx="5" cy="5" r="3.6" fill="none" stroke="currentColor" stroke-width="1.4"/>' +
        '<path d="M5 3v2.2l1.5.9" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
        '</svg></span>'
      );
    }

    if (msg.read_at) {
      return (
        '<span class="chatify-tick chatify-tick-read" title="Read">' +
        '<svg viewBox="0 0 14 10" width="15" height="11">' + double + '</svg></span>'
      );
    }

    if (msg.delivered_at) {
      return (
        '<span class="chatify-tick" title="Delivered">' +
        '<svg viewBox="0 0 14 10" width="15" height="11">' + double + '</svg></span>'
      );
    }

    return (
      '<span class="chatify-tick" title="Sent">' +
      '<svg viewBox="0 0 14 10" width="15" height="11">' + single + '</svg></span>'
    );
  }

  private escapeHTML(str: string) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  public toggleWindow() {
    this.isOpen = !this.isOpen;
    const win = this.shadow?.getElementById('chatifyWindow');
    const openIcon = this.shadow?.getElementById('chatifyIconOpen');
    const closeIcon = this.shadow?.getElementById('chatifyIconClose');

    if (win && openIcon && closeIcon) {
      if (this.isOpen) {
        win.style.display = 'flex';
        openIcon.style.display = 'none';
        closeIcon.style.display = 'block';
        this.unreadCount = 0;
        this.updateUnreadBadge();

        if (this.activeTab === 'messages') {
          this.markMessagesAsRead();
          const body = this.shadow?.getElementById('chatifyBody');
          if (body) body.scrollTop = body.scrollHeight;
          setTimeout(() => {
            (this.shadow?.getElementById('chatifyTextarea') as HTMLTextAreaElement | null)?.focus();
          }, 100);
        }
      } else {
        win.style.display = 'none';
        openIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    }
  }

  private updateUnreadBadge() {
    const badge = this.shadow?.getElementById('chatifyBadge');
    const navBadge = this.shadow?.getElementById('navMsgBadge');
    const launcher = this.shadow?.getElementById('chatifyLauncherBtn');

    // The halo ring only runs while something is actually waiting.
    launcher?.classList.toggle('has-unread', this.unreadCount > 0);

    if (this.unreadCount > 0) {
      const text = this.unreadCount > 9 ? '9+' : this.unreadCount.toString();
      if (badge) {
        badge.textContent = text;
        badge.style.display = 'flex';
      }
      if (navBadge) {
        navBadge.textContent = text;
        navBadge.style.display = 'flex';
      }
    } else {
      if (badge) badge.style.display = 'none';
      if (navBadge) navBadge.style.display = 'none';
    }
  }
}

if (typeof window !== 'undefined') {
  const init = () => {
    (window as any).__ChatifyInstance = new ChatifyWidget();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
