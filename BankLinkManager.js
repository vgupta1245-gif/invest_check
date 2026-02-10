/**
 * Bank Link Manager - Handles simulated bank connections and data extraction
 */
const BankLinkManager = {
    banks: [
        { id: 'chase', name: 'Chase', color: '#117aca' },
        { id: 'bofa', name: 'Bank of America', color: '#e31837' },
        { id: 'citi', name: 'Citibank', color: '#003b70' },
        { id: 'wells', name: 'Wells Fargo', color: '#cd1409' },
        { id: 'usbank', name: 'U.S. Bank', color: '#0c2074' },
        { id: 'capone', name: 'Capital One', color: '#004879' },
        { id: 'goldman', name: 'Goldman Sachs', color: '#7399c6' },
        { id: 'pnc', name: 'PNC Bank', color: '#f48f00' },
        { id: 'truist', name: 'Truist', color: '#240e36' },
        { id: 'td', name: 'TD Bank', color: '#008a00' },
        { id: 'bmo', name: 'BMO', color: '#0079c1' },
        { id: 'firstcitizens', name: 'First Citizens', color: '#003a70' },
        { id: 'citizens', name: 'Citizens Bank', color: '#008655' },
        { id: 'fifththird', name: 'Fifth Third', color: '#006a4d' },
        { id: 'mt', name: 'M&T Bank', color: '#007a53' },
        { id: 'huntington', name: 'Huntington', color: '#59c36a' },
        { id: 'amex', name: 'American Express', color: '#006fcf' },
        { id: 'key', name: 'KeyBank', color: '#ff0000' },
        { id: 'ally', name: 'Ally Bank', color: '#3d0d56' },
        { id: 'hsbc', name: 'HSBC', color: '#db0011' }
    ],

    connectedBanks: JSON.parse(localStorage.getItem('connected_banks') || '[]'),

    init() {
        this.renderBankSelector();
        this.loadConnectedBanks();
    },

    renderBankSelector() {
        const uploadContainer = document.querySelector('.upload-container');
        if (!uploadContainer) return;

        // Check if already injected
        if (document.getElementById('bankSelectorSection')) return;

        const section = document.createElement('div');
        section.id = 'bankSelectorSection';
        section.className = 'bank-selector-section';
        section.innerHTML = `
            <div class="divider" style="margin: 2rem 0; display: flex; align-items: center; color: var(--text-secondary);">
                <span style="flex: 1; height: 1px; background: var(--border-color);"></span>
                <span style="padding: 0 1rem; font-size: 0.875rem;">OR CONNECT INSTITUTION</span>
                <span style="flex: 1; height: 1px; background: var(--border-color);"></span>
            </div>
            <div class="bank-grid" id="bankGrid"></div>
        `;

        // Insert after upload hero
        const hero = document.querySelector('.upload-hero');
        if (hero && hero.nextSibling) {
            hero.parentNode.insertBefore(section, hero.nextSibling);
        } else {
            uploadContainer.appendChild(section);
        }

        this.renderGrid();
    },

    renderGrid() {
        const grid = document.getElementById('bankGrid');
        if (!grid) return;

        grid.innerHTML = this.banks.map(bank => {
            const isConnected = this.connectedBanks.includes(bank.id);
            return `
                <button class="bank-card ${isConnected ? 'connected' : ''}" onclick="BankLinkManager.handleBankClick('${bank.id}')">
                    <div class="bank-icon" style="background-color: ${bank.color}20; color: ${bank.color}">
                        ${this.getBankInitial(bank.name)}
                    </div>
                    <span class="bank-name">${bank.name}</span>
                    ${isConnected ? '<span class="status-indicator">Connected</span>' : ''}
                </button>
            `;
        }).join('');
    },

    getBankInitial(name) {
        return name.charAt(0);
    },

    handleBankClick(bankId) {
        if (this.connectedBanks.includes(bankId)) {
            // Already connected? Maybe show disconnect option or just sync
            alert('Account already connected. Syncing data...');
            this.syncData(bankId);
            return;
        }
        this.openAuthModal(bankId);
    },

    openAuthModal(bankId) {
        const bank = this.banks.find(b => b.id === bankId);
        if (!bank) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'bankAuthModal';
        modal.innerHTML = `
            <div class="modal auth-modal" style="max-width: 400px">
                <div class="modal-header">
                    <h3 class="view-title" style="display: flex; align-items: center; gap: 10px;">
                        <span style="display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; background: ${bank.color}20; color: ${bank.color}; font-size: 14px;">
                            ${this.getBankInitial(bank.name)}
                        </span>
                        Connect to ${bank.name}
                    </h3>
                    <button class="modal-close" onclick="BankLinkManager.closeAuthModal()">✕</button>
                </div>
                <div class="modal-body" style="padding: 1.5rem 0;">
                    <div class="form-group">
                        <label class="form-label">User ID</label>
                        <input type="text" class="input input-bordered full-width" placeholder="Enter User ID">
                    </div>
                    <div class="form-group" style="margin-top: 1rem;">
                        <label class="form-label">Password</label>
                        <input type="password" class="input input-bordered full-width" placeholder="Enter Password">
                    </div>
                    <p style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 1rem; display: flex; align-items: center; gap: 6px;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Secure Connection via SparkLink
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary full-width" onclick="BankLinkManager.authenticate('${bankId}')">
                        Secure Sign In
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    closeAuthModal() {
        const modal = document.getElementById('bankAuthModal');
        if (modal) modal.remove();
    },

    authenticate(bankId) {
        const btn = document.querySelector('#bankAuthModal .btn-primary');
        if (btn) {
            btn.innerHTML = `
                <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                Connecting...
            `;
        }

        setTimeout(() => {
            this.connectedBanks.push(bankId);
            localStorage.setItem('connected_banks', JSON.stringify(this.connectedBanks));
            this.closeAuthModal();
            this.renderGrid();
            this.syncData(bankId);

            // Generate mock data and reload dashboard
            const newData = this.generateMockData(bankId);
            this.mergeAndReload(newData);

        }, 1500);
    },

    loadConnectedBanks() {
        if (this.connectedBanks.length > 0 && window.appState) {
            // On page load, simulate loading data for connected banks
            // In a real app we'd fetch from API
            let allData = [];
            this.connectedBanks.forEach(id => {
                allData = allData.concat(this.generateMockData(id));
            });
            // Don't overwrite, merge with existing if any? 
            // For now, let's just make it available to main.js
            // Or easier: main.js calls this?
        }
    },

    syncData(bankId) {
        // Visual feedback
        const btn = document.querySelector(`.bank-card[onclick*="${bankId}"]`);
        if (btn) {
            btn.innerHTML = `
                <div class="bank-icon">
                   <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
                </div>
                <span class="bank-name">Syncing...</span>
            `;
            setTimeout(() => this.renderGrid(), 1000);
        }
    },

    mergeAndReload(newTransactions) {
        // Assuming appState has rawTransactions
        if (!window.appState) window.appState = { rawTransactions: [] };

        window.appState.rawTransactions = [
            ...(window.appState.rawTransactions || []),
            ...newTransactions
        ];

        // Trigger analysis
        finalizeData(window.appState.rawTransactions);

        // Switch to dashboard
        document.getElementById('tabDashboard').click();
    },

    generateMockData(bankId) {
        const bank = this.banks.find(b => b.id === bankId);
        const count = 30 + Math.floor(Math.random() * 20); // 30-50 txns
        const txns = [];

        const categories = {
            'chase': ['Food & Dining', 'Groceries', 'Shopping'],
            'amex': ['Travel', 'Business Services', 'Dining'],
            'bofa': ['Utilities', 'Insurance', 'Transfer'],
            'default': ['Entertainment', 'Health & Fitness', 'Personal Care']
        };

        const cats = categories[bankId] || categories['default'];

        for (let i = 0; i < count; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 60));

            const isCredit = Math.random() > 0.8;
            const amount = isCredit
                ? (Math.random() * 2000 + 1000).toFixed(2)
                : (-1 * (Math.random() * 100 + 10)).toFixed(2);

            txns.push({
                Date: date.toISOString().split('T')[0],
                Description: `${bank.name} Transaction ${i + 1}`,
                Amount: parseFloat(amount),
                Category: cats[Math.floor(Math.random() * cats.length)],
                Account: `${bank.name} Checking`
            });
        }
        return txns;
    }
};
