/**
 * Account Manager - extracts and manages financial accounts from transactions
 */
const AccountManager = {
    STORAGE_KEY: 'sparkreceipt_default_account',
    accounts: [],

    getAccounts() {
        return this.accounts;
    },

    extractAccounts(transactions) {
        const accts = {};
        transactions.forEach(t => {
            const name = t.institution || 'Unknown';
            if (!accts[name]) {
                accts[name] = { name, txnCount: 0, totalSpend: 0, totalIncome: 0, type: 'Checking' };
            }
            accts[name].txnCount++;
            if (t.amount < 0) accts[name].totalSpend += Math.abs(t.amount);
            else accts[name].totalIncome += t.amount;
        });
        // Guess account type
        Object.values(accts).forEach(a => {
            const lower = a.name.toLowerCase();
            if (lower.includes('credit') || lower.includes('card') || lower.includes('visa') || lower.includes('mastercard') || lower.includes('amex'))
                a.type = 'Credit Card';
            else if (lower.includes('saving'))
                a.type = 'Savings';
            else if (lower.includes('invest') || lower.includes('brokerage'))
                a.type = 'Investment';
        });
        this.accounts = Object.values(accts).sort((a, b) => b.txnCount - a.txnCount);
        return this.accounts;
    },

    getDefaultAccount() {
        return localStorage.getItem(this.STORAGE_KEY);
    },

    setDefaultAccount(name) {
        localStorage.setItem(this.STORAGE_KEY, name);
    },

    clearDefaultAccount() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    INST_COLORS: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6', '#f97316', '#06b6d4', '#a78bfa', '#ef4444', '#64748b'],

    getColor(index) {
        return this.INST_COLORS[index % this.INST_COLORS.length];
    }
};
