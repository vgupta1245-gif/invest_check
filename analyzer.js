/**
 * Analyzer - aggregates transaction data for dashboard visualizations
 */
const Analyzer = {
    analyze(transactions) {
        const expenses = transactions.filter(t => t.amount < 0);
        const income = transactions.filter(t => t.amount > 0);
        const totalSpend = Math.abs(expenses.reduce((s, t) => s + t.amount, 0));
        const totalIncome = income.reduce((s, t) => s + t.amount, 0);

        const analysis = {
            totalSpend,
            totalIncome,
            netFlow: totalIncome - totalSpend,
            transactionCount: transactions.length,
            categories: this._byCategory(transactions),
            institutions: this._byInstitution(transactions),
            dailyTrend: this._dailyTrend(transactions),
            topMerchants: this._topMerchants(expenses),
            crossTab: this._crossTab(transactions),
            transactions: transactions // Store rawtxns
        };

        this.lastAnalysis = analysis;
        return analysis;
    },

    _byCategory(txns) {
        const cats = {};
        txns.forEach(t => {
            const c = t.category || 'Uncategorized';
            if (!cats[c]) cats[c] = { total: 0, count: 0, transactions: [] };
            cats[c].total += t.amount;
            cats[c].count++;
            cats[c].transactions.push(t);
        });
        return Object.entries(cats)
            .map(([name, d]) => ({
                name, total: d.total, absTotal: Math.abs(d.total),
                count: d.count, transactions: d.transactions,
                avg: d.total / d.count,
                color: Categorizer.getColor(name),
                icon: Categorizer.getIcon(name),
                merchants: this._topMerchants(d.transactions),
            }))
            .sort((a, b) => b.absTotal - a.absTotal);
    },

    _byInstitution(txns) {
        const insts = {};
        txns.forEach(t => {
            const i = t.institution || 'Unknown';
            if (!insts[i]) insts[i] = { total: 0, spend: 0, income: 0, count: 0, transactions: [], categories: {} };
            insts[i].total += t.amount;
            insts[i].count++;
            insts[i].transactions.push(t);
            if (t.amount < 0) insts[i].spend += Math.abs(t.amount);
            else insts[i].income += t.amount;
            const c = t.category || 'Uncategorized';
            if (!insts[i].categories[c]) insts[i].categories[c] = 0;
            insts[i].categories[c] += Math.abs(t.amount);
        });
        return Object.entries(insts)
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.spend - a.spend);
    },

    _dailyTrend(txns) {
        const daily = {};
        txns.forEach(t => {
            if (!t.date) return;
            const key = t.date.toISOString().split('T')[0];
            if (!daily[key]) daily[key] = { spend: 0, income: 0 };
            if (t.amount < 0) daily[key].spend += Math.abs(t.amount);
            else daily[key].income += t.amount;
        });
        return Object.entries(daily)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, d]) => ({ date, ...d }));
    },

    _topMerchants(txns, limit = 5) {
        const merchants = {};
        txns.forEach(t => {
            const v = t.vendor || 'Unknown';
            if (!merchants[v]) merchants[v] = { total: 0, count: 0 };
            merchants[v].total += Math.abs(t.amount);
            merchants[v].count++;
        });
        return Object.entries(merchants)
            .map(([name, d]) => ({ name, ...d }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
    },

    _crossTab(txns) {
        const tab = {};
        txns.forEach(t => {
            const i = t.institution || 'Unknown';
            const c = t.category || 'Uncategorized';
            if (!tab[i]) tab[i] = {};
            if (!tab[i][c]) tab[i][c] = 0;
            tab[i][c] += Math.abs(t.amount);
        });
        return tab;
    }
};
