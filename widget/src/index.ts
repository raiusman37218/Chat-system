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
}

class ChatifyWidget {
  private config: WidgetConfig;
  private supabase: SupabaseClient;
  private container: HTMLDivElement | null = null;
  private shadow: ShadowRoot | null = null;

  // Session state
  private visitorId: string;
  private conversationId: string | null = null;
  private visitorName: string = '';
  private visitorEmail: string = '';

  // UI state
  private isOpen: boolean = false;
  private unreadCount: number = 0;
  private messages: MessageItem[] = [];
  private isPreChatCompleted: boolean = false;

  private audioCtx: AudioContext | null = null;

  constructor() {
    this.config = this.parseConfig();
    this.supabase = createClient(this.config.supabaseUrl, this.config.supabaseKey);

    // Initialize or restore visitor ID (scoped to workspace if present)
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
    const currentScript = document.currentScript as HTMLScriptElement | null;
    return {
      supabaseUrl: currentScript?.getAttribute('data-supabase-url') || DEFAULT_SUPABASE_URL,
      supabaseKey: currentScript?.getAttribute('data-supabase-key') || DEFAULT_SUPABASE_KEY,
      workspaceId: currentScript?.getAttribute('data-workspace-id') || null,
      title: currentScript?.getAttribute('data-title') || 'Support Team',
      subtitle: currentScript?.getAttribute('data-subtitle') || 'We reply in under 5 minutes',
      primaryColor: currentScript?.getAttribute('data-color') || '#2563eb',
      position: (currentScript?.getAttribute('data-position') as 'bottom-right' | 'bottom-left') || 'bottom-right',
    };
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
    } catch {
      // Fallback
    }

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
          if (this.messages.some((m) => m.id === newMsg.id)) return;

          this.messages.push(newMsg);
          this.renderMessages();

          if (newMsg.sender_type !== 'visitor') {
            this.playIncomingSound();
            if (!this.isOpen) {
              this.unreadCount += 1;
              this.updateUnreadBadge();
            }
          }
        }
      )
      .subscribe();
  }

  // 8. Message History
  private async loadMessageHistory() {
    if (!this.conversationId) return;

    const { data } = await this.supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', this.conversationId)
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
    localStorage.setItem(`chatify_conversation_id${suffix}`, data.id);
    this.subscribeToRealtime();
    return data.id;
  }

  private async sendMessage(content: string) {
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
    }).select().single();

    if (data) {
      const idx = this.messages.findIndex((m) => m.id === tempMsg.id);
      if (idx !== -1) {
        this.messages[idx] = data as MessageItem;
      }
    }
  }

  // 10. DOM & Shadow Root
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

    // Window HTML
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chatify-window';
    chatWindow.id = 'chatifyWindow';
    chatWindow.innerHTML = `
      <div class="chatify-header">
        <div class="chatify-header-info">
          <div class="chatify-avatar" id="chatifyHeaderAvatar">
            ${this.config.title.charAt(0)}
            <span class="chatify-online-dot"></span>
          </div>
          <div class="chatify-header-text">
            <h3 id="chatifyHeaderTitle">${this.config.title}</h3>
            <p id="chatifyHeaderSubtitle">${this.config.subtitle}</p>
          </div>
        </div>
        <button class="chatify-close-btn" id="chatifyCloseBtn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
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

      <div class="chatify-footer" id="chatifyFooter" style="${!this.isPreChatCompleted ? 'display:none;' : ''}">
        <textarea id="chatifyTextarea" class="chatify-textarea" rows="1" placeholder="Type a message..."></textarea>
        <button id="chatifySendBtn" class="chatify-send-btn">
          <svg viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;

    this.shadow.appendChild(chatWindow);

    this.shadow.getElementById('chatifyCloseBtn')?.addEventListener('click', () => this.toggleWindow());

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

  private updateThemeAndTexts() {
    const styleEl = this.shadow?.getElementById('chatify-theme-style');
    if (styleEl) {
      styleEl.textContent = this.generateCSS();
    }
    const titleEl = this.shadow?.getElementById('chatifyHeaderTitle');
    if (titleEl) titleEl.textContent = this.config.title;
    const subEl = this.shadow?.getElementById('chatifyHeaderSubtitle');
    if (subEl) subEl.textContent = this.config.subtitle;
    const avatarEl = this.shadow?.getElementById('chatifyHeaderAvatar');
    if (avatarEl) avatarEl.childNodes[0].textContent = this.config.title.charAt(0);
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
        top: -2px;
        right: -2px;
        background: #ef4444;
        color: white;
        font-size: 11px;
        font-weight: 700;
        height: 20px;
        min-width: 20px;
        padding: 0 5px;
        border-radius: 10px;
        border: 2px solid white;
        display: none;
        align-items: center;
        justify-content: center;
      }

      .chatify-window {
        position: fixed;
        ${this.config.position === 'bottom-left' ? 'left: 24px;' : 'right: 24px;'}
        bottom: 96px;
        width: 380px;
        max-width: calc(100vw - 32px);
        height: 560px;
        max-height: calc(100vh - 120px);
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 20px;
        box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05);
        z-index: 999999;
        display: none;
        flex-direction: column;
        overflow: hidden;
      }

      .chatify-header {
        background: linear-gradient(135deg, #1e293b, #0f172a);
        border-bottom: 1px solid #334155;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .chatify-header-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chatify-avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: ${this.config.primaryColor};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
        position: relative;
      }

      .chatify-online-dot {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #10b981;
        border: 2px solid #0f172a;
      }

      .chatify-header-text h3 {
        font-size: 14px;
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
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chatify-close-btn:hover {
        color: white;
        background: #334155;
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
        line-height: 1.4;
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
        max-width: 80%;
        font-size: 13px;
        line-height: 1.4;
        word-break: break-word;
      }

      .chatify-msg-agent {
        align-self: flex-start;
        background: #1e293b;
        color: #f1f5f9;
        border: 1px solid #334155;
        padding: 10px 14px;
        border-radius: 16px 16px 16px 2px;
        max-width: 80%;
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

  private toggleWindow() {
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

        const body = this.shadow?.getElementById('chatifyBody');
        if (body) body.scrollTop = body.scrollHeight;

        setTimeout(() => {
          (this.shadow?.getElementById('chatifyTextarea') as HTMLTextAreaElement | null)?.focus();
        }, 100);
      } else {
        win.style.display = 'none';
        openIcon.style.display = 'block';
        closeIcon.style.display = 'none';
      }
    }
  }

  private updateUnreadBadge() {
    const badge = this.shadow?.getElementById('chatifyBadge');
    if (!badge) return;
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount.toString();
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
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
