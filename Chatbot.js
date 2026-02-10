/**
 * AI Chatbot Widget - floating corner chat for financial questions
 */
const Chatbot = {
    isOpen: false,
    isMinimized: true,
    messages: [],
    isTyping: false,

    init() {
        this._injectHTML();
        this._bindEvents();
        // Initial welcome message
        this.messages.push({
            role: 'assistant',
            text: "👋 Hi! I'm your **SparkReceipt AI**. Import your data and ask me about your finances!",
            time: new Date(),
        });
        this._renderMessages();
    },

    _injectHTML() {
        const widget = document.createElement('div');
        widget.id = 'chatbotWidget';
        widget.innerHTML = `
      <button class="chatbot-fab" id="chatbotFab" title="AI Financial Assistant">
        <svg class="chatbot-fab-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
          <line x1="10" y1="22" x2="14" y2="22"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
          <path d="M9.5 13a3.5 3.5 0 0 0 5 0"/>
        </svg>
        <span class="chatbot-fab-pulse"></span>
      </button>

      <div class="chatbot-panel" id="chatbotPanel">
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
              </svg>
            </div>
            <div>
              <div class="chatbot-title">SparkReceipt AI</div>
              <div class="chatbot-status" id="chatbotStatus">Ready</div>
            </div>
          </div>
          <div class="chatbot-header-actions">
            <button class="chatbot-btn" id="chatbotClear" title="Clear chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
            <button class="chatbot-btn" id="chatbotClose" title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div class="chatbot-messages" id="chatbotMessages"></div>

        <div class="chatbot-suggestions" id="chatbotSuggestions">
          <button class="chatbot-suggestion" data-query="Give me a budget summary">📊 Budget summary</button>
          <button class="chatbot-suggestion" data-query="Break down spending by category">🏷️ By category</button>
          <button class="chatbot-suggestion" data-query="What will my spending look like next month?">📈 Projections</button>
          <button class="chatbot-suggestion" data-query="Where can I save money?">💡 Save tips</button>
        </div>

        <form class="chatbot-input-form" id="chatbotForm">
          <input type="text" class="chatbot-input" id="chatbotInput" placeholder="Ask about your finances..." autocomplete="off">
          <button type="submit" class="chatbot-send" id="chatbotSend">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    `;
        document.body.appendChild(widget);
    },

    _bindEvents() {
        const fab = document.getElementById('chatbotFab');
        const panel = document.getElementById('chatbotPanel');
        const closeBtn = document.getElementById('chatbotClose');
        const clearBtn = document.getElementById('chatbotClear');
        const form = document.getElementById('chatbotForm');
        const suggestions = document.querySelectorAll('.chatbot-suggestion');

        fab.addEventListener('click', () => this.toggle());
        closeBtn.addEventListener('click', () => this.close());
        clearBtn.addEventListener('click', () => this.clearChat());

        form.addEventListener('submit', e => {
            e.preventDefault();
            const input = document.getElementById('chatbotInput');
            const q = input.value.trim();
            if (q) { this.sendMessage(q); input.value = ''; }
        });

        suggestions.forEach(btn => {
            btn.addEventListener('click', () => {
                this.sendMessage(btn.dataset.query);
            });
        });
    },

    toggle() {
        this.isOpen ? this.close() : this.open();
    },

    open() {
        this.isOpen = true;
        document.getElementById('chatbotPanel').classList.add('open');
        document.getElementById('chatbotFab').classList.add('hidden');
        document.getElementById('chatbotInput').focus();
    },

    close() {
        this.isOpen = false;
        document.getElementById('chatbotPanel').classList.remove('open');
        document.getElementById('chatbotFab').classList.remove('hidden');
    },

    clearChat() {
        this.messages = [{
            role: 'assistant',
            text: "Chat cleared. Ask me anything about your finances!",
            time: new Date(),
        }];
        this._renderMessages();
    },

    async sendMessage(text) {
        // Add user message
        this.messages.push({ role: 'user', text, time: new Date() });
        this._renderMessages();
        this._scrollToBottom();

        // Show typing indicator
        this.isTyping = true;
        this._renderMessages();
        document.getElementById('chatbotStatus').textContent = 'Thinking...';

        // Simulate slight delay for natural feel
        await new Promise(r => setTimeout(r, 400 + Math.random() * 600));

        // Get AI response
        const response = await AIEngine.respond(text);
        this.isTyping = false;

        this.messages.push({ role: 'assistant', text: response.text, type: response.type, time: new Date() });
        document.getElementById('chatbotStatus').textContent = 'Ready';
        this._renderMessages();
        this._scrollToBottom();
    },

    _renderMessages() {
        const el = document.getElementById('chatbotMessages');
        let html = '';

        this.messages.forEach(msg => {
            const time = msg.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            if (msg.role === 'user') {
                html += `<div class="chat-msg chat-user"><div class="chat-bubble chat-bubble-user">${this._escapeHtml(msg.text)}</div><div class="chat-time">${time}</div></div>`;
            } else {
                const rendered = this._renderMarkdown(msg.text);
                html += `<div class="chat-msg chat-assistant"><div class="chat-bubble chat-bubble-assistant">${rendered}</div><div class="chat-time">${time}</div></div>`;
            }
        });

        if (this.isTyping) {
            html += `<div class="chat-msg chat-assistant"><div class="chat-bubble chat-bubble-assistant"><div class="typing-indicator"><span></span><span></span><span></span></div></div></div>`;
        }

        el.innerHTML = html;
    },

    _scrollToBottom() {
        const el = document.getElementById('chatbotMessages');
        setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
    },

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    _renderMarkdown(text) {
        // Simple markdown renderer for chat
        return text
            .replace(/## (.+)/g, '<h4 class="chat-h2">$1</h4>')
            .replace(/### (.+)/g, '<h5 class="chat-h3">$1</h5>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/• /g, '<span class="chat-bullet">•</span> ')
            .replace(/\n\| .+\|/g, match => {
                // Render tables
                return match;
            })
            .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" class="chat-link">$1</a>')
            .replace(/\n/g, '<br>');
    },

    /** Called when data is loaded to update the chatbot context */
    onDataLoaded(transactions, analysis, accounts) {
        AIEngine.train(transactions, analysis, accounts);
        document.getElementById('chatbotStatus').textContent = `Trained on ${transactions.length} transactions`;

        // Add context message
        this.messages.push({
            role: 'assistant',
            text: `✅ I've analyzed **${transactions.length} transactions** across **${accounts.length} accounts**. I'm trained on your spending patterns and ready to answer questions!\n\nTry asking:\n• "Give me a budget summary"\n• "How much did I spend on food?"\n• "What are my spending projections?"\n• "How do I add a new account?"`,
            time: new Date(),
            type: 'system'
        });
        this._renderMessages();
    }
};
