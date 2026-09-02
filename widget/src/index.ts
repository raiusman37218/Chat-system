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
}

interface MessageItem {
  id: string;
  sender_type: 'visitor' | 'agent' | 'ai';
  content: string;
  created_at: string;
  is_internal?: boolean;
}

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    q: 'How do I install Chatify on my website?',
    a: 'Copy the 1-line script tag from your Embed Code tab and paste it directly above the closing </body> tag on your website.',
    category: 'Installation'
  },
  {
    q: 'What are your pricing plans?',
    a: 'We offer a Starter plan at $29/mo and an Enterprise plan with custom SLAs and high-concurrency websocket clusters.',
    category: 'Billing'
  },
  {
    q: 'How does live visitor tracking work?',
    a: 'Our beacon tracks website visits in real-time. When you browse between pages, your support agent sees your active URL on their live radar.',
    category: 'Features'
  },
  {
    q: 'Can I add multiple agents to my team?',
    a: 'Yes! Chatify is fully multi-tenant and supports unlimited agent seats per business workspace.',
    category: 'Team'
  }
];

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

        this.updateThemeAndTexts();
      }
    } catch (e) {
      console.warn('[Chatify] Could not fetch workspace config:', e);
    }
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
    } catch (e) {
      console.warn('[Chatify] Visitor tracking error:', e);
    }

    setInterval(() => {
      this.sendHeartbeat();
    }, 15000);
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
            }
          }
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
      <svg id="chatifyIconClose" style="display:none;" viewBox="0 0 24 24">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
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
              <img src="${CHATIFY_ICON_DATA_URI}" alt="Chatify" style="width:100%;height:100%;object-fit:contain;" />
            </div>
            <button class="chatify-icon-btn" id="homeCloseBtn" title="Close">✕</button>
          </div>
          <h2 class="chatify-home-title" id="homeGreetingTitle">Hello there 👋</h2>
          <p class="chatify-home-sub" id="homeGreetingSub">How can our support team help you today?</p>
        </div>

        <div class="chatify-home-content">
          <!-- Start Chat Card -->
          <div class="chatify-card chatify-card-action" id="cardStartChat">
            <div class="chatify-card-head">
              <div class="chatify-avatars-stack">
                <div class="chatify-mini-avatar" style="background:var(--w-brand);">A</div>
                <div class="chatify-mini-avatar" style="background:var(--w-brand-deep);">S</div>
              </div>
              <span class="chatify-status-pill">● Typically replies in 5m</span>
            </div>
            <h4>Send us a message</h4>
            <p>Our team of support engineers is online right now.</p>
            <button class="chatify-btn-link" id="btnGoToMessages">Send message →</button>
          </div>

          <!-- Quick-Reply Action Chips -->
          <div class="chatify-chips-section">
            <div class="chatify-section-title">Quick Inquiries</div>
            <div class="chatify-chips-grid">
              <button class="chatify-chip" data-query="Hello! I would like to talk to someone about pricing.">
                💳 Pricing Question
              </button>
              <button class="chatify-chip" data-query="Hi! Can you provide more info on enterprise integrations?">
                ⚡ Enterprise Features
              </button>
              <button class="chatify-chip" data-query="Hello, I need technical support with my setup.">
                🛠️ Technical Help
              </button>
              <button class="chatify-chip" data-query="Hi there! I would like to speak with a human agent.">
                🙋 Speak with Human
              </button>
            </div>
          </div>

          <!-- Help Center Quick Search -->
          <div class="chatify-card chatify-card-help" id="cardHelpSearch">
            <div class="chatify-section-title">Knowledge Base</div>
            <p style="font-size:13px; color:var(--w-ink-2);">Search common answers and documentation:</p>
            <div class="chatify-search-box" id="homeSearchTrigger">
              <span>🔍 Search for help articles...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: MESSAGES TAB (Active Chat Thread) -->
      <div class="chatify-tab-pane" id="tabMessages" style="display: none;">
        <div class="chatify-header">
          <div class="chatify-header-info">
            <button class="chatify-back-btn" id="btnBackToHome" title="Back to Home">←</button>
            <div class="chatify-avatar" id="chatifyHeaderAvatar">
              <img src="${CHATIFY_ICON_DATA_URI}" alt="Chatify" style="width:100%;height:100%;object-fit:contain;" />
              <span class="chatify-online-dot"></span>
            </div>
            <div class="chatify-header-text">
              <h3 id="chatifyHeaderTitle">${this.config.title}</h3>
              <p id="chatifyHeaderSubtitle">${this.config.subtitle}</p>
            </div>
          </div>
          <button class="chatify-close-btn" id="chatifyCloseBtn">✕</button>
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
          <button id="chatifySendBtn" class="chatify-send-btn">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
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
          <button class="chatify-close-btn" id="helpCloseBtn">✕</button>
        </div>

        <div class="chatify-help-body">
          <div class="chatify-help-search-bar">
            <input type="text" id="helpSearchInput" placeholder="Search answers..." />
          </div>

          <div class="chatify-faq-list" id="faqList">
            ${DEFAULT_FAQS.map(
              (faq, idx) => `
              <div class="chatify-faq-item" data-idx="${idx}">
                <div class="chatify-faq-q">
                  <span>${faq.q}</span>
                  <span class="chatify-faq-arrow">›</span>
                </div>
                <div class="chatify-faq-a">${faq.a}</div>
              </div>
            `
            ).join('')}
          </div>
        </div>
      </div>

      <!-- Bottom Intercom Navigation Bar -->
      <nav class="chatify-bottom-nav">
        <button class="chatify-nav-item active" data-tab="home" id="navHome">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
          <span>Home</span>
        </button>
        <button class="chatify-nav-item" data-tab="messages" id="navMessages">
          <div class="nav-msg-icon-wrap">
            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
            <span class="chatify-nav-badge" id="navMsgBadge" style="display:none;">1</span>
          </div>
          <span>Messages</span>
        </button>
        <button class="chatify-nav-item" data-tab="help" id="navHelp">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>
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
    });

    // Quick-Reply Action Chips
    this.shadow.querySelectorAll('.chatify-chip').forEach((chip) => {
      chip.addEventListener('click', async (e) => {
        const query = (e.currentTarget as HTMLElement).getAttribute('data-query');
        if (query) {
          this.switchTab('messages');
          await this.sendMessage(query);
        }
      });
    });

    // FAQ Accordion
    this.shadow.querySelectorAll('.chatify-faq-item').forEach((item) => {
      item.addEventListener('click', () => {
        item.classList.toggle('open');
      });
    });

    // FAQ Search Input
    const faqSearch = this.shadow.getElementById('helpSearchInput') as HTMLInputElement | null;
    faqSearch?.addEventListener('input', (e) => {
      const q = (e.target as HTMLInputElement).value.toLowerCase();
      this.shadow?.querySelectorAll('.chatify-faq-item').forEach((item) => {
        const text = item.textContent?.toLowerCase() || '';
        (item as HTMLElement).style.display = text.includes(q) ? 'block' : 'none';
      });
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
    if (brandAvatar) brandAvatar.textContent = this.config.title.charAt(0);

    // Carry the workspace's own greeting through to the Home tab, so the
    // messenger opens speaking in the customer's voice rather than ours.
    const homeSub = this.shadow?.getElementById('homeGreetingSub');
    if (homeSub && this.config.subtitle) homeSub.textContent = this.config.subtitle;
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
        transform: scale(1.06);
        box-shadow: 0 12px 32px var(--w-brand-a28), 0 4px 12px rgba(11,11,15,.2);
      }

      .chatify-launcher:active { transform: scale(.97); }

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
        padding: 22px 22px 50px;
        background:
          radial-gradient(120% 90% at 12% 0%, ${this.alpha(brand, 0.55)}, transparent 62%),
          linear-gradient(150deg, var(--w-brand), var(--w-brand-deep));
        color: var(--w-on-brand);
        flex-shrink: 0;
      }

      .chatify-brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 26px;
      }

      .chatify-home-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255,255,255,.2);
        border: 1px solid rgba(255,255,255,.26);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
        backdrop-filter: blur(6px);
      }

      .chatify-icon-btn {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: rgba(255,255,255,.14);
        color: inherit;
        font-size: 14px;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background .16s var(--w-ease), transform .16s var(--w-ease);
      }

      .chatify-icon-btn:hover {
        background: rgba(255,255,255,.26);
        transform: rotate(90deg);
      }

      .chatify-home-title {
        font-size: 25px;
        font-weight: 600;
        letter-spacing: -.024em;
        line-height: 1.2;
      }

      .chatify-home-sub {
        margin-top: 6px;
        font-size: 14px;
        line-height: 1.5;
        opacity: .82;
      }

      /* The whole sheet lifts over the gradient hero. Lifting only the first
         card instead would put it outside this scroll box, which clips it. */
      .chatify-home-content {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        margin-top: -26px;
        padding: 16px;
        background: var(--w-canvas);
        border-radius: var(--w-r-lg) var(--w-r-lg) 0 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .chatify-card {
        background: var(--w-surface);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md);
        padding: 16px;
        box-shadow: var(--w-shadow-sm);
      }

      .chatify-card-action { transition: box-shadow .2s var(--w-ease), transform .2s var(--w-ease); }
      .chatify-card-action:hover { box-shadow: var(--w-shadow-md); transform: translateY(-1px); }

      .chatify-card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .chatify-avatars-stack { display: flex; }

      .chatify-mini-avatar {
        width: 26px;
        height: 26px;
        border-radius: 50%;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid var(--w-surface);
        margin-left: -8px;
      }
      .chatify-mini-avatar:first-child { margin-left: 0; }

      .chatify-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 22px;
        padding: 0 9px;
        border-radius: 999px;
        background: var(--w-surface-2);
        border: 1px solid var(--w-line);
        font-size: 11px;
        font-weight: 600;
        color: var(--w-ink-2);
        white-space: nowrap;
      }

      .chatify-card h4 {
        font-size: 15px;
        font-weight: 600;
        letter-spacing: -.012em;
        color: var(--w-ink);
      }

      .chatify-card p {
        margin-top: 4px;
        font-size: 13px;
        line-height: 1.55;
        color: var(--w-ink-2);
      }

      .chatify-btn-link {
        margin-top: 14px;
        width: 100%;
        height: 40px;
        border: none;
        border-radius: var(--w-r-sm);
        background: var(--w-brand);
        color: var(--w-on-brand);
        font-size: 13.5px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: var(--w-shadow-sm);
        transition: filter .16s var(--w-ease), transform .12s var(--w-ease);
      }

      .chatify-btn-link:hover { filter: brightness(1.08); }
      .chatify-btn-link:active { transform: scale(.985); }

      .chatify-section-title {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .09em;
        text-transform: uppercase;
        color: var(--w-ink-3);
        margin-bottom: 9px;
      }

      .chatify-chips-section { padding: 0 2px; }

      .chatify-chips-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .chatify-chip {
        padding: 11px 12px;
        border-radius: var(--w-r-sm);
        border: 1px solid var(--w-line);
        background: var(--w-surface);
        color: var(--w-ink-2);
        font-size: 12.5px;
        font-weight: 500;
        text-align: left;
        line-height: 1.35;
        transition: border-color .16s var(--w-ease), color .16s var(--w-ease),
          background .16s var(--w-ease), transform .12s var(--w-ease);
      }

      .chatify-chip:hover {
        border-color: var(--w-brand);
        color: var(--w-ink);
        background: var(--w-brand-a08);
        transform: translateY(-1px);
      }

      .chatify-card-help p { margin-bottom: 10px; }

      .chatify-search-box {
        height: 40px;
        padding: 0 12px;
        border-radius: var(--w-r-sm);
        border: 1px solid var(--w-line);
        background: var(--w-surface-2);
        color: var(--w-ink-3);
        font-size: 13px;
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: border-color .16s var(--w-ease), color .16s var(--w-ease);
      }

      .chatify-search-box:hover { border-color: var(--w-line-2); color: var(--w-ink-2); }

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
        animation: w-rise .26s var(--w-ease) both;
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
        background: var(--w-brand);
        color: var(--w-on-brand);
        border-radius: var(--w-r-md) var(--w-r-md) 4px var(--w-r-md);
        box-shadow: var(--w-shadow-sm);
      }

      .chatify-msg-agent {
        margin-right: auto;
        background: var(--w-surface);
        color: var(--w-ink);
        border: 1px solid var(--w-line);
        border-radius: var(--w-r-md) var(--w-r-md) var(--w-r-md) 4px;
      }

      .chatify-msg-time {
        margin-top: 4px;
        font-size: 10.5px;
        color: var(--w-ink-3);
        text-align: right;
      }

      .chatify-msg-visitor .chatify-msg-time { color: inherit; opacity: .68; }

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

      .chatify-send-btn:hover { filter: brightness(1.08); }
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
        border-top: 1px solid var(--w-line);
        background: var(--w-surface);
        padding: 6px 6px calc(6px + env(safe-area-inset-bottom, 0px));
        flex-shrink: 0;
      }

      .chatify-nav-item {
        position: relative;
        flex: 1;
        border: none;
        background: transparent;
        color: var(--w-ink-3);
        padding: 7px 0 6px;
        border-radius: var(--w-r-sm);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        font-size: 11px;
        font-weight: 600;
        transition: color .16s var(--w-ease), background .16s var(--w-ease);
      }

      .chatify-nav-item svg { transition: transform .2s var(--w-spring); }
      .chatify-nav-item:hover { color: var(--w-ink-2); background: var(--w-surface-2); }

      .chatify-nav-item.active { color: var(--w-brand); }
      .chatify-nav-item.active svg { transform: translateY(-1px) scale(1.06); }

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

    await this.ensureConversation();
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
      bubble.innerHTML = `<div class="chatify-msg-text">${this.escapeHTML(msg.content)}</div><div class="chatify-msg-time">${timeStr}</div>`;

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
