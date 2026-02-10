/**
 * Payment Manager - default account selection and payment form
 */
const PaymentManager = {
    HISTORY_KEY: 'sparkreceipt_payments',
    accounts: [],
    selectedAccount: null,

    render(accounts) {
        this.accounts = accounts;
        const defaultName = AccountManager.getDefaultAccount();
        this.selectedAccount = defaultName || (accounts[0]?.name || null);
        const el = document.getElementById('paymentContent');
        const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

        el.innerHTML = `
      <div class="payment-layout">
        <div>
          <div class="payment-card">
            <h3>🏦 Linked Accounts</h3>
            <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:var(--space-4)">Select a default payment account</p>
            <div class="account-list" id="accountList">
              ${accounts.map((a, i) => `
                <div class="account-item ${a.name === defaultName ? 'selected default' : ''}" data-account="${a.name}">
                  ${a.name === defaultName ? '<span class="default-badge">Default</span>' : ''}
                  <div class="account-icon" style="background:${AccountManager.getColor(i)}">${a.name.charAt(0)}</div>
                  <div class="account-info">
                    <div class="account-name">${a.name}</div>
                    <div class="account-detail">${a.type} • ${a.txnCount} transactions</div>
                  </div>
                  <div class="account-actions">
                    <button class="btn btn-sm btn-outline set-default-btn" data-account="${a.name}">
                      ${a.name === defaultName ? '✓ Default' : 'Set Default'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="payment-card" style="margin-top:var(--space-4)">
            <h3>📜 Payment History</h3>
            <div id="paymentHistory">${this._renderHistory()}</div>
          </div>
        </div>
        <div>
          <div class="payment-card">
            <h3>💳 Send Payment</h3>
            <form id="paymentForm">
              <div class="form-group">
                <label class="form-label">From Account</label>
                <select class="form-input" id="payFromAccount">
                  ${accounts.map(a => `<option value="${a.name}" ${a.name === this.selectedAccount ? 'selected' : ''}>${a.name} (${a.type})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Recipient</label>
                <input class="form-input" type="text" id="payRecipient" placeholder="Name or email" required>
              </div>
              <div class="form-group">
                <label class="form-label">Amount</label>
                <div class="form-input-prefix">
                  <span class="prefix">$</span>
                  <input class="form-input" type="number" id="payAmount" placeholder="0.00" step="0.01" min="0.01" required>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Memo (optional)</label>
                <input class="form-input" type="text" id="payMemo" placeholder="What's this for?">
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:var(--space-3)">
                Send Payment
              </button>
            </form>
          </div>
        </div>
      </div>
      <div class="confirm-overlay" id="confirmOverlay">
        <div class="confirm-modal" id="confirmModal"></div>
      </div>
    `;

        // Event delegation
        el.querySelectorAll('.set-default-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                this._setDefault(btn.dataset.account);
            });
        });

        document.getElementById('paymentForm').addEventListener('submit', e => {
            e.preventDefault();
            this._confirmPayment();
        });
    },

    _setDefault(name) {
        AccountManager.setDefaultAccount(name);
        this.render(this.accounts);
    },

    _confirmPayment() {
        const from = document.getElementById('payFromAccount').value;
        const recipient = document.getElementById('payRecipient').value;
        const amount = parseFloat(document.getElementById('payAmount').value);
        const memo = document.getElementById('payMemo').value;
        const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

        const overlay = document.getElementById('confirmOverlay');
        const modal = document.getElementById('confirmModal');
        modal.innerHTML = `
      <div class="confirm-icon" style="background:rgba(99,102,241,0.15)">💳</div>
      <div class="confirm-title">Confirm Payment</div>
      <div class="confirm-detail">
        Send <strong>${fmt(amount)}</strong> to <strong>${recipient}</strong><br>
        From: <strong>${from}</strong>
        ${memo ? `<br>Memo: ${memo}` : ''}
      </div>
      <div class="confirm-actions">
        <button class="btn btn-outline" id="cancelPayment">Cancel</button>
        <button class="btn btn-primary" id="executePayment">Confirm & Send</button>
      </div>
    `;
        overlay.classList.add('active');

        document.getElementById('cancelPayment').addEventListener('click', () => overlay.classList.remove('active'));
        document.getElementById('executePayment').addEventListener('click', () => {
            this._savePayment({ from, recipient, amount, memo, date: new Date().toISOString(), status: 'completed' });
            overlay.classList.remove('active');
            document.getElementById('paymentForm').reset();
            // Set from account back to default
            const def = AccountManager.getDefaultAccount();
            if (def) document.getElementById('payFromAccount').value = def;
            document.getElementById('paymentHistory').innerHTML = this._renderHistory();
        });
    },

    _savePayment(payment) {
        const history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
        history.unshift(payment);
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
    },

    _renderHistory() {
        const history = JSON.parse(localStorage.getItem(this.HISTORY_KEY) || '[]');
        const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
        if (history.length === 0) return '<p style="color:var(--text-tertiary);font-size:var(--font-sm);padding:var(--space-4)">No payments yet</p>';
        return history.slice(0, 10).map(p => `
      <div class="payment-history-item">
        <div class="payment-status"></div>
        <div class="payment-history-info">
          <div class="payment-history-recipient">${p.recipient}</div>
          <div class="payment-history-meta">${new Date(p.date).toLocaleDateString()} • From ${p.from}</div>
        </div>
        <div class="payment-history-amount">${fmt(p.amount)}</div>
      </div>
    `).join('');
    }
};
