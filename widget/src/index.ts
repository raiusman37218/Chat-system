import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
      primaryColor: script?.getAttribute('data-color') || '#2563eb',
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
      <svg id="chatifyIconOpen" viewBox="0 0 24 24">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
      </svg>
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
              ${this.config.title.charAt(0)}
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
                <div class="chatify-mini-avatar" style="background:#2563eb;">A</div>
                <div class="chatify-mini-avatar" style="background:#7c3aed;">S</div>
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
            <p style="font-size:12px; color:#94a3b8; margin-bottom:8px;">Search common answers and documentation:</p>
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
              ${this.config.title.charAt(0)}
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
  }

  private generateCSS(): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }

      .chatify-launcher {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
        bottom: 24px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
      }

      .chatify-launcher:hover {
        transform: scale(1.06) translateY(-2px);
        box-shadow: 0 14px 28px -5px rgba(0, 0, 0, 0.5);
      }

      .chatify-launcher svg {
        width: 26px;
        height: 26px;
        fill: currentColor;
      }

      .chatify-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: #ef4444;
        color: white;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 700;
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        display: none;
        align-items: center;
        justify-content: center;
        border: 2px solid #0f172a;
      }

      .chatify-window {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
        bottom: 96px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 600px;
        max-height: calc(100vh - 120px);
        background: #0b101d;
        border: 1px solid #1e293b;
        border-radius: 20px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(255, 255, 255, 0.08);
        z-index: 999999;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .chatify-tab-pane {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Home Tab Styles */
      .chatify-home-hero {
        background: linear-gradient(135deg, ${this.config.primaryColor}, #4338ca);
        padding: 24px 20px 20px;
        color: white;
      }

      .chatify-brand-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      .chatify-home-avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.2);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 16px;
        backdrop-filter: blur(8px);
      }

      .chatify-icon-btn {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
      }

      .chatify-icon-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        color: white;
      }

      .chatify-home-title {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.5px;
        margin-bottom: 4px;
      }

      .chatify-home-sub {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.85);
      }

      .chatify-home-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        background: #090d16;
      }

      .chatify-card {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 16px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
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
        width: 26px;
        height: 26px;
        border-radius: 50%;
        color: white;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #0f172a;
        margin-right: -6px;
      }

      .chatify-status-pill {
        font-size: 11px;
        color: #34d399;
        background: rgba(16, 185, 129, 0.1);
        padding: 3px 8px;
        border-radius: 9999px;
        font-weight: 600;
      }

      .chatify-card h4 {
        font-size: 14px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }

      .chatify-card p {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.4;
        margin-bottom: 12px;
      }

      .chatify-btn-link {
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        transition: background 0.15s;
      }

      .chatify-btn-link:hover {
        filter: brightness(1.1);
      }

      .chatify-section-title {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #64748b;
        margin-bottom: 8px;
      }

      .chatify-chips-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .chatify-chip {
        background: #1e293b;
        border: 1px solid #334155;
        color: #cbd5e1;
        padding: 9px 10px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s;
      }

      .chatify-chip:hover {
        background: #2563eb;
        color: white;
        border-color: #3b82f6;
        transform: translateY(-1px);
      }

      .chatify-search-box {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 10px 14px;
        font-size: 12px;
        color: #64748b;
        cursor: pointer;
        transition: border-color 0.2s;
      }

      .chatify-search-box:hover {
        border-color: #475569;
        color: #94a3b8;
      }

      /* Messages Tab Styles */
      .chatify-header {
        background: #0f172a;
        border-bottom: 1px solid #1e293b;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .chatify-header-info {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .chatify-back-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 16px;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;
      }

      .chatify-back-btn:hover {
        color: white;
        background: #1e293b;
      }

      .chatify-avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: ${this.config.primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
        position: relative;
      }

      .chatify-online-dot {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: #10b981;
        border: 2px solid #0f172a;
      }

      .chatify-header-text h3 {
        font-size: 13px;
        font-weight: 700;
        color: #f8fafc;
      }

      .chatify-header-text p {
        font-size: 11px;
        color: #94a3b8;
      }

      .chatify-close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 6px;
        font-size: 14px;
      }

      .chatify-close-btn:hover {
        color: white;
      }

      .chatify-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #090d16;
      }

      .chatify-prechat {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 14px;
        padding: 20px;
        text-align: center;
        margin: auto 0;
      }

      .chatify-prechat h4 {
        font-size: 15px;
        font-weight: 700;
        color: white;
        margin-bottom: 6px;
      }

      .chatify-prechat p {
        font-size: 12px;
        color: #94a3b8;
        margin-bottom: 16px;
      }

      .chatify-form-group {
        text-align: left;
        margin-bottom: 12px;
      }

      .chatify-form-group label {
        font-size: 11px;
        font-weight: 600;
        color: #cbd5e1;
        display: block;
        margin-bottom: 4px;
      }

      .chatify-input {
        width: 100%;
        padding: 9px 12px;
        border-radius: 8px;
        border: 1px solid #475569;
        background: #0f172a;
        color: white;
        font-size: 12px;
        outline: none;
      }

      .chatify-input:focus {
        border-color: ${this.config.primaryColor};
      }

      .chatify-start-btn {
        width: 100%;
        padding: 10px;
        border-radius: 8px;
        border: none;
        background: ${this.config.primaryColor};
        color: white;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        margin-top: 6px;
      }

      .chatify-message-row {
        display: flex;
        flex-direction: column;
      }

      .chatify-msg-visitor {
        align-self: flex-end;
        background: ${this.config.primaryColor};
        color: white;
        padding: 10px 14px;
        border-radius: 16px 16px 2px 16px;
        max-width: 82%;
        font-size: 13px;
        line-height: 1.4;
        word-break: break-word;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }

      .chatify-msg-agent {
        align-self: flex-start;
        background: #1e293b;
        color: #f1f5f9;
        border: 1px solid #334155;
        padding: 10px 14px;
        border-radius: 16px 16px 16px 2px;
        max-width: 82%;
        font-size: 13px;
        line-height: 1.4;
        word-break: break-word;
      }

      .chatify-msg-time {
        font-size: 10px;
        color: #64748b;
        margin-top: 3px;
      }

      .chatify-msg-visitor .chatify-msg-time {
        color: rgba(255, 255, 255, 0.7);
        text-align: right;
      }

      /* Post-Chat CSAT Rating Box */
      .chatify-csat-box {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 14px;
        padding: 16px;
        text-align: center;
        margin: 12px 0;
      }

      .chatify-csat-title {
        font-size: 13px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }

      .chatify-csat-sub {
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 12px;
      }

      .chatify-csat-emojis {
        display: flex;
        justify-content: center;
        gap: 12px;
      }

      .chatify-csat-btn {
        background: transparent;
        border: none;
        font-size: 24px;
        cursor: pointer;
        transition: transform 0.15s;
      }

      .chatify-csat-btn:hover {
        transform: scale(1.3);
      }

      .chatify-footer {
        padding: 12px 14px;
        background: #0f172a;
        border-top: 1px solid #1e293b;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .chatify-textarea {
        flex: 1;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 10px;
        padding: 9px 12px;
        color: white;
        font-size: 13px;
        resize: none;
        outline: none;
        max-height: 80px;
      }

      .chatify-textarea:focus {
        border-color: ${this.config.primaryColor};
      }

      .chatify-send-btn {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        background: ${this.config.primaryColor};
        color: white;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .chatify-send-btn svg {
        width: 16px;
        height: 16px;
        fill: currentColor;
      }

      /* Help Tab Styles */
      .chatify-help-body {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #090d16;
      }

      .chatify-help-search-bar input {
        width: 100%;
        padding: 10px 14px;
        border-radius: 10px;
        background: #1e293b;
        border: 1px solid #334155;
        color: white;
        font-size: 12px;
        outline: none;
        margin-bottom: 14px;
      }

      .chatify-faq-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .chatify-faq-item {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 12px 14px;
        cursor: pointer;
        transition: border-color 0.15s;
      }

      .chatify-faq-item:hover {
        border-color: #334155;
      }

      .chatify-faq-q {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 12px;
        font-weight: 600;
        color: white;
      }

      .chatify-faq-arrow {
        font-size: 16px;
        color: #64748b;
        transition: transform 0.2s;
      }

      .chatify-faq-item.open .chatify-faq-arrow {
        transform: rotate(90deg);
      }

      .chatify-faq-a {
        display: none;
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.5;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #1e293b;
      }

      .chatify-faq-item.open .chatify-faq-a {
        display: block;
      }

      /* Bottom Navigation Bar (Intercom style) */
      .chatify-bottom-nav {
        height: 56px;
        background: #0f172a;
        border-top: 1px solid #1e293b;
        display: flex;
        align-items: center;
        justify-content: space-around;
      }

      .chatify-nav-item {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 6px 16px;
        border-radius: 8px;
        transition: color 0.15s;
      }

      .chatify-nav-item:hover {
        color: #cbd5e1;
      }

      .chatify-nav-item.active {
        color: ${this.config.primaryColor};
      }

      .nav-msg-icon-wrap {
        position: relative;
      }

      .chatify-nav-badge {
        position: absolute;
        top: -2px;
        right: -6px;
        background: #ef4444;
        color: white;
        border-radius: 9999px;
        font-size: 9px;
        font-weight: 800;
        min-width: 14px;
        height: 14px;
        padding: 0 3px;
        display: flex;
        align-items: center;
        justify-content: center;
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
        <div style="text-align:center; margin:auto 0; color:#64748b; font-size:12px;">
          <p style="color:#94a3b8; font-weight:600; margin-bottom:4px;">How can we help you today?</p>
          <p>Send a message below and our support team will join the chat.</p>
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
      bubble.innerHTML = `
        <div>${this.escapeHTML(msg.content)}</div>
        <div class="chatify-msg-time">${timeStr}</div>
      `;

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
      thankYou.style.cssText = 'text-align:center; padding:10px; font-size:12px; color:#34d399; font-weight:600;';
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
