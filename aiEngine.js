/**
 * AI Financial Engine - trained on user transaction data
 * Provides intelligent responses about budgets, spending, projections, and account management
 */
const AIEngine = {
    context: null,     // current period analysis
    historical: null,  // historical data for training
    allTransactions: [],
    accounts: [],

    /**
     * Train the engine on all available transaction data
     * Separates current month from historical for deeper insights
     */
    train(transactions, analysis, accounts) {
        this.allTransactions = transactions;
        this.context = analysis;
        this.accounts = accounts;

        // Build historical profile from all data
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const currentPeriod = transactions.filter(t => t.date && t.date >= thirtyDaysAgo);
        const historical = transactions.filter(t => t.date && t.date < thirtyDaysAgo);

        this.historical = {
            hasData: historical.length > 0,
            count: historical.length,
            totalSpend: Math.abs(historical.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
            totalIncome: historical.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0),
            categories: this._aggregateByCategory(historical),
            institutions: this._aggregateByInstitution(historical),
            avgDailySpend: 0,
        };

        if (historical.length > 0) {
            const dates = historical.filter(t => t.date).map(t => t.date.getTime());
            const span = Math.max(1, (Math.max(...dates) - Math.min(...dates)) / 86400000);
            this.historical.avgDailySpend = this.historical.totalSpend / span;
        }

        // Build spending patterns
        this._buildPatterns();
    },

    _aggregateByCategory(txns) {
        const cats = {};
        txns.forEach(t => {
            const c = t.category || 'Uncategorized';
            if (!cats[c]) cats[c] = { total: 0, count: 0 };
            cats[c].total += Math.abs(t.amount);
            cats[c].count++;
        });
        return cats;
    },

    _aggregateByInstitution(txns) {
        const insts = {};
        txns.forEach(t => {
            const i = t.institution || 'Unknown';
            if (!insts[i]) insts[i] = { spend: 0, income: 0, count: 0 };
            if (t.amount < 0) insts[i].spend += Math.abs(t.amount);
            else insts[i].income += t.amount;
            insts[i].count++;
        });
        return insts;
    },

    _buildPatterns() {
        this.patterns = {
            topCategory: null,
            fastestGrowing: null,
            avgTxnSize: 0,
            spendingRate: 0,
        };

        if (!this.context) return;

        const expenses = this.context.categories.filter(c => c.name !== 'Income');
        if (expenses.length > 0) {
            this.patterns.topCategory = expenses[0];
        }

        const allExpenses = this.allTransactions.filter(t => t.amount < 0);
        if (allExpenses.length > 0) {
            this.patterns.avgTxnSize = Math.abs(allExpenses.reduce((s, t) => s + t.amount, 0)) / allExpenses.length;
        }

        // Daily spending rate for current period
        const trend = this.context.dailyTrend;
        if (trend.length > 0) {
            this.patterns.spendingRate = trend.reduce((s, d) => s + d.spend, 0) / trend.length;
        }
    },

    /**
     * Process a user query and return an intelligent response
     */
    async respond(query) {
        const q = query.toLowerCase().trim();

        // Route to the best handler
        if (this._matches(q, ['budget', 'summary', 'overview', 'how much', 'total', 'spending overview', 'overall'])) {
            return this._budgetSummary(q);
        }
        if (this._matches(q, ['category', 'categories', 'food', 'dining', 'housing', 'transport', 'shop', 'health', 'entertain', 'subscription', 'utilities', 'transfer', 'income'])) {
            return this._categoryAnalysis(q);
        }
        if (this._matches(q, ['increase', 'project', 'forecast', 'future', 'predict', 'next month', 'trend', 'growing', 'rising'])) {
            return this._projections(q);
        }
        if (this._matches(q, ['account', 'add account', 'new account', 'bank', 'institution', 'link', 'connect'])) {
            return this._accountGuidance(q);
        }
        if (this._matches(q, ['save', 'saving', 'reduce', 'cut', 'tip', 'advice', 'suggest', 'recommend'])) {
            return this._savingsTips(q);
        }
        if (this._matches(q, ['merchant', 'vendor', 'store', 'where', 'top spend'])) {
            return this._merchantAnalysis(q);
        }
        if (this._matches(q, ['compare', 'vs', 'versus', 'historical', 'last month', 'previous'])) {
            return this._historicalComparison(q);
        }
        if (this._matches(q, ['invest', 'retirement', '401k', 'roth', 'ira', '529', 'college', 'portfolio', 'stock', 'bond', 'fund'])) {
            return this._investmentAdvice(q);
        }
        if (this._matches(q, ['secure', 'security', 'share', 'sharing', '2fa', 'two-factor', 'encrypt', 'protection', 'privacy'])) {
            return this._securityInfo(q);
        }
        if (this._matches(q, ['hello', 'hi', 'hey', 'help', 'what can you'])) {
            return this._greeting();
        }

        return this._generalResponse(q);
    },

    _matches(q, keywords) {
        return keywords.some(kw => q.includes(kw));
    },

    _fmt(n) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    },

    _greeting() {
        return {
            text: `👋 Hi! I'm your **SparkReceipt AI Assistant**. I've analyzed your financial data and I'm ready to help.\n\nHere's what I can do:\n• 📊 **Budget summaries** — "How much did I spend?"\n• 🏷️ **Category analysis** — "Break down my food spending"\n• 📈 **Future projections** — "What will next month look like?"\n• 🏦 **Account guidance** — "How do I add a new account?"\n• 💡 **Savings tips** — "Where can I save money?"\n• 💰 **Investment advice** — "Tell me about Roth IRAs"\n• 🔒 **Security** — "How is my data protected?"\n\nJust ask me anything about your finances!`,
            type: 'greeting'
        };
    },

    _budgetSummary(q) {
        const a = this.context;
        if (!a) return { text: 'Please import your financial data first so I can analyze it.', type: 'info' };

        const expenses = a.categories.filter(c => c.name !== 'Income');
        const topCats = expenses.slice(0, 3);
        const daysInPeriod = a.dailyTrend.length || 30;
        const dailyAvg = a.totalSpend / daysInPeriod;
        const projectedMonthly = dailyAvg * 30;

        let resp = `## 📊 Budget Summary\n\n`;
        resp += `**Total Spending:** ${this._fmt(a.totalSpend)}\n`;
        resp += `**Total Income:** ${this._fmt(a.totalIncome)}\n`;
        resp += `**Net Cash Flow:** ${a.netFlow >= 0 ? '✅' : '⚠️'} ${this._fmt(a.netFlow)}\n`;
        resp += `**Daily Average:** ${this._fmt(dailyAvg)}/day\n\n`;
        resp += `### Top Spending Categories\n`;
        topCats.forEach((c, i) => {
            const pct = ((c.absTotal / a.totalSpend) * 100).toFixed(1);
            resp += `${i + 1}. **${c.name}** — ${this._fmt(c.absTotal)} (${pct}%)\n`;
        });
        resp += `\n**${a.transactionCount}** transactions across **${a.institutions.length}** accounts.`;

        if (a.netFlow < 0) {
            resp += `\n\n⚠️ *You're spending more than you're earning this period. Consider reviewing your ${topCats[0]?.name || 'top'} expenses.*`;
        }

        return { text: resp, type: 'analysis' };
    },

    _categoryAnalysis(q) {
        const a = this.context;
        if (!a) return { text: 'No data loaded yet. Import your SparkReceipt export first!', type: 'info' };

        // Find specific category if mentioned
        const catMatch = a.categories.find(c => q.includes(c.name.toLowerCase()));
        if (catMatch) {
            const pct = ((catMatch.absTotal / a.totalSpend) * 100).toFixed(1);
            let resp = `## ${Categorizer.getIcon(catMatch.name)} ${catMatch.name}\n\n`;
            resp += `**Total:** ${this._fmt(catMatch.absTotal)} (${pct}% of spending)\n`;
            resp += `**Transactions:** ${catMatch.count}\n`;
            resp += `**Average:** ${this._fmt(Math.abs(catMatch.avg))}/transaction\n\n`;

            if (catMatch.merchants && catMatch.merchants.length > 0) {
                resp += `### Top Merchants\n`;
                catMatch.merchants.slice(0, 3).forEach(m => {
                    resp += `• **${m.name}** — ${this._fmt(m.total)} (${m.count}x)\n`;
                });
            }

            // Historical comparison
            if (this.historical?.hasData && this.historical.categories[catMatch.name]) {
                const hist = this.historical.categories[catMatch.name].total;
                const diff = catMatch.absTotal - hist;
                const pctChange = hist > 0 ? ((diff / hist) * 100).toFixed(1) : 'N/A';
                resp += `\n### vs Historical\n`;
                resp += diff > 0
                    ? `📈 Up **${this._fmt(Math.abs(diff))}** (+${pctChange}%) from prior periods`
                    : `📉 Down **${this._fmt(Math.abs(diff))}** (${pctChange}%) from prior periods`;
            }

            return { text: resp, type: 'analysis' };
        }

        // General category breakdown
        let resp = `## 🏷️ All Categories\n\n`;
        a.categories.forEach(c => {
            const pct = ((c.absTotal / (a.totalSpend + a.totalIncome)) * 100).toFixed(1);
            const icon = Categorizer.getIcon(c.name);
            resp += `${icon} **${c.name}** — ${this._fmt(c.absTotal)} (${c.count} txns)\n`;
        });
        resp += `\n*Click any category in the dashboard for a detailed deep-dive!*`;
        return { text: resp, type: 'analysis' };
    },

    _projections(q) {
        const a = this.context;
        if (!a) return { text: 'Import data first to get projections.', type: 'info' };

        const daysInPeriod = a.dailyTrend.length || 30;
        const dailyRate = a.totalSpend / daysInPeriod;
        const projected30 = dailyRate * 30;

        // Find growing categories
        let growthInsights = '';
        if (this.historical?.hasData) {
            const growing = [];
            a.categories.filter(c => c.name !== 'Income').forEach(c => {
                const hist = this.historical.categories[c.name];
                if (hist && hist.total > 0) {
                    const change = ((c.absTotal - hist.total) / hist.total) * 100;
                    if (change > 10) growing.push({ name: c.name, change: change.toFixed(0), current: c.absTotal });
                }
            });
            if (growing.length > 0) {
                growthInsights += `\n### ⚠️ Growing Categories\n`;
                growing.sort((a, b) => b.change - a.change).forEach(g => {
                    growthInsights += `• **${g.name}** is up **${g.change}%** — currently ${this._fmt(g.current)}\n`;
                });
            }
        }

        let resp = `## 📈 Financial Projections\n\n`;
        resp += `**Current daily rate:** ${this._fmt(dailyRate)}/day\n`;
        resp += `**Projected 30-day spend:** ${this._fmt(projected30)}\n`;
        resp += `**Projected monthly income:** ${this._fmt(a.totalIncome)}\n`;
        resp += `**Projected net flow:** ${a.totalIncome - projected30 >= 0 ? '✅' : '⚠️'} ${this._fmt(a.totalIncome - projected30)}\n`;

        if (growthInsights) resp += growthInsights;

        // Spending velocity analysis
        const trend = a.dailyTrend;
        if (trend.length >= 7) {
            const recentWeek = trend.slice(-7).reduce((s, d) => s + d.spend, 0) / 7;
            const earlierWeek = trend.slice(0, 7).reduce((s, d) => s + d.spend, 0) / 7;
            if (earlierWeek > 0) {
                const velocity = ((recentWeek - earlierWeek) / earlierWeek * 100).toFixed(0);
                resp += `\n### Spending Velocity\n`;
                resp += Number(velocity) > 0
                    ? `Your recent spending rate is **${velocity}% higher** than the start of the period. Consider tightening your budget.`
                    : `Your recent spending rate is **${Math.abs(velocity)}% lower** than the start of the period. Great trend! 👏`;
            }
        }

        return { text: resp, type: 'projection' };
    },

    _accountGuidance(q) {
        let resp = `## 🏦 Account Management\n\n`;
        resp += `### Currently Linked Accounts\n`;
        this.accounts.forEach(a => {
            resp += `• **${a.name}** (${a.type}) — ${a.txnCount} transactions\n`;
        });

        resp += `\n### How to Add New Accounts\n`;
        resp += `1. **Log into SparkReceipt** at [sparkreceipt.com](https://sparkreceipt.com)\n`;
        resp += `2. Go to **Settings → Bank Statements**\n`;
        resp += `3. Upload your bank statement (CSV or PDF)\n`;
        resp += `4. SparkReceipt will extract transactions automatically\n`;
        resp += `5. **Export** the data as CSV from SparkReceipt\n`;
        resp += `6. Drag & drop the CSV into this dashboard\n\n`;
        resp += `### Supported Formats\n`;
        resp += `• **CSV** — Most bank exports and SparkReceipt exports\n`;
        resp += `• **PDF** — Bank statements (auto-parsed with visual reader)\n\n`;
        resp += `💡 *Tip: Include the institution/account column in your export so transactions are properly grouped by account.*`;

        return { text: resp, type: 'guide' };
    },

    _savingsTips(q) {
        const a = this.context;
        if (!a) return { text: 'Import your data first for personalized savings tips!', type: 'info' };

        const expenses = a.categories.filter(c => c.name !== 'Income');
        let resp = `## 💡 Personalized Savings Tips\n\n`;

        // Find highest non-essential categories
        const discretionary = expenses.filter(c => ['Food & Dining', 'Shopping', 'Entertainment', 'Subscriptions'].includes(c.name));
        const totalDiscretionary = discretionary.reduce((s, c) => s + c.absTotal, 0);
        const pctDiscretionary = ((totalDiscretionary / a.totalSpend) * 100).toFixed(0);

        resp += `**Discretionary spending:** ${this._fmt(totalDiscretionary)} (${pctDiscretionary}% of total)\n\n`;

        discretionary.forEach(c => {
            const icon = Categorizer.getIcon(c.name);
            resp += `### ${icon} ${c.name} — ${this._fmt(c.absTotal)}\n`;
            if (c.name === 'Food & Dining') {
                resp += `• Consider meal prepping — could save up to **30%** (~${this._fmt(c.absTotal * 0.3)})\n`;
                resp += `• Reduce delivery orders (check DoorDash/UberEats frequency)\n`;
            } else if (c.name === 'Shopping') {
                resp += `• Try a 24-hour rule before non-essential purchases\n`;
                resp += `• Check for duplicate or impulse purchases\n`;
            } else if (c.name === 'Entertainment') {
                resp += `• Look for free alternatives and discount days\n`;
            } else if (c.name === 'Subscriptions') {
                resp += `• Audit each subscription — do you actively use all of them?\n`;
                resp += `• Consider annual plans for savings\n`;
            }
            resp += `\n`;
        });

        const potentialSaving = totalDiscretionary * 0.2;
        resp += `**Potential monthly savings:** ~${this._fmt(potentialSaving)} by reducing discretionary spending by 20%\n\n`;
        resp += `💡 *Consider investing these savings into a Roth IRA or 529 Plan. Ask me "How can I invest?" for more details.*`;

        return { text: resp, type: 'tips' };
    },

    _investmentAdvice(q) {
        // Generic investment advice based on keywords, drawing from investor.gov concepts
        let resp = `## 💰 Investment Opportunities\n\n`;

        if (q.includes('529') || q.includes('college') || q.includes('education')) {
            resp += `### 🎓 529 Education Savings Plans\n`;
            resp += `A tax-advantaged savings plan designed to encourage saving for future education costs.\n\n`;
            resp += `**Key Benefits:**\n`;
            resp += `• **Tax-Free Growth:** Earnings grow federal tax-free.\n`;
            resp += `• **Tax-Free Withdrawals:** No tax when used for qualified education expenses (tuition, books, room & board).\n`;
            resp += `• **State Tax Breaks:** Many states offer tax deductions or credits for contributions.\n`;
            resp += `• **Flexibility:** Can be used for K-12 tuition (up to $10k/year) and student loan repayments ($10k lifetime).\n\n`;
            resp += `*Source: investor.gov*`;
        }
        else if (q.includes('roth') || q.includes('ira')) {
            resp += `### 🛡️ Roth IRA\n`;
            resp += `An individual retirement account that offers tax-free growth and tax-free withdrawals in retirement.\n\n`;
            resp += `**Key Benefits:**\n`;
            resp += `• **Tax-Free Withdrawals:** You pay taxes on contributions now, but withdrawals in retirement are tax-free.\n`;
            resp += `• **Flexibility:** You can withdraw your *contributions* (not earnings) at any time without penalty.\n`;
            resp += `• **No RMDs:** No required minimum distributions during your lifetime.\n\n`;
            resp += `**2026 Limits (Estimated):**\n`;
            resp += `• Contribution limit: **$7,000** ($8,000 if age 50+)\n`;
            resp += `• Income limits apply for eligibility.\n\n`;
            resp += `*Best for: Those who expect to be in a higher tax bracket in retirement.*`;
        }
        else if (q.includes('401') || q.includes('employer') || q.includes('match')) {
            resp += `### 🏢 401(k) Plans\n`;
            resp += `An employer-sponsored retirement savings plan that often includes matching contributions.\n\n`;
            resp += `**Key Benefits:**\n`;
            resp += `• **Employer Match:** Free money! Always contribute enough to get the full match.\n`;
            resp += `• **Tax Advantages:** Traditional 401(k) contributions lower your taxable income now. Roth 401(k)s offer tax-free withdrawals later.\n`;
            resp += `• **High Limits:** Contribution limit is **$23,500** (2025/2026 est.) + catch-up contributions if 50+.\n\n`;
            resp += `*Strategy: Prioritize the 401(k) match before other investments.*`;
        }
        else {
            resp += `Building wealth starts with a plan. Here are three powerful accounts to consider:\n\n`;
            resp += `1. **401(k):** Employer-sponsored plan. **Priority #1** if your company offers a match (it's free money).\n`;
            resp += `2. **Roth IRA:** Tax-free growth for retirement. Great if you want flexibility and expect higher taxes later.\n`;
            resp += `3. **529 Plan:** Tax-advantaged savings for education costs (college, K-12).\n\n`;

            if (this.context && this.context.netFlow > 0) {
                resp += `Based on your current net flow of **${this._fmt(this.context.netFlow)}**, you have surplus cash to start investing!\n\n`;
            }

            resp += `*Ask me specifically about "Roth IRA", "401k", or "529 plans" for more details.*`;
        }

        return { text: resp, type: 'guide' };
    },

    _securityInfo(q) {
        let resp = `## 🔒 Security & Data Sharing\n\n`;

        if (q.includes('share') || q.includes('sharing')) {
            resp += `### Secure Data Sharing\n`;
            resp += `Per your request, we use a **Double 2FA Protocol** for sharing data:\n\n`;
            resp += `1. **Sender Authorization:** You must authenticate with a 2FA code to generate a share link.\n`;
            resp += `2. **Recipient Authorization:** The recipient must also authenticate with a separate 2FA code to access the data.\n`;
            resp += `3. **Expiration:** Share links expire automatically after 24 hours.\n\n`;
            resp += `*Click the "Share Securely" button in the dashboard to start.*`;
        } else {
            resp += `### Data Protection Standards\n`;
            resp += `• **Encryption:** All data is encrypted with 256-bit AES protection.\n`;
            resp += `• **Local Processing:** Your financial data is processed client-side in your browser.\n`;
            resp += `• **Authentication:** We use strict 2FA for sensitive actions like data sharing.\n`;
            resp += `• **Privacy:** We never sell your personal financial data to third parties.`;
        }

        return { text: resp, type: 'security' };
    },

    _merchantAnalysis(q) {
        const a = this.context;
        if (!a) return { text: 'Load your data to see merchant insights.', type: 'info' };

        let resp = `## 🏪 Top Merchants\n\n`;
        const topM = a.topMerchants || [];
        topM.forEach((m, i) => {
            resp += `${i + 1}. **${m.name}** — ${this._fmt(m.total)} (${m.count} transactions)\n`;
        });

        // Per institution breakdown
        resp += `\n### By Institution\n`;
        a.institutions.slice(0, 4).forEach(inst => {
            resp += `\n**${inst.name}:**\n`;
            const instTxns = this.allTransactions.filter(t => t.institution === inst.name && t.amount < 0);
            const merchants = {};
            instTxns.forEach(t => {
                if (!merchants[t.vendor]) merchants[t.vendor] = 0;
                merchants[t.vendor] += Math.abs(t.amount);
            });
            Object.entries(merchants).sort(([, a], [, b]) => b - a).slice(0, 3).forEach(([name, total]) => {
                resp += `  • ${name}: ${this._fmt(total)}\n`;
            });
        });

        return { text: resp, type: 'analysis' };
    },

    _historicalComparison(q) {
        const a = this.context;
        if (!a) return { text: 'Import data first.', type: 'info' };
        if (!this.historical?.hasData) {
            return { text: 'No historical data available yet. Import data spanning more than 30 days for comparisons.', type: 'info' };
        }

        let resp = `## 📊 Current vs Historical\n\n`;
        resp += `| Metric | Current Period | Historical |\n`;
        resp += `|--------|---------------|------------|\n`;
        resp += `| Total Spend | ${this._fmt(a.totalSpend)} | ${this._fmt(this.historical.totalSpend)} |\n`;
        resp += `| Total Income | ${this._fmt(a.totalIncome)} | ${this._fmt(this.historical.totalIncome)} |\n`;
        resp += `| Transactions | ${a.transactionCount} | ${this.historical.count} |\n\n`;

        resp += `### Category Changes\n`;
        a.categories.filter(c => c.name !== 'Income').forEach(c => {
            const hist = this.historical.categories[c.name];
            if (hist) {
                const diff = c.absTotal - hist.total;
                const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
                resp += `${arrow} **${c.name}**: ${this._fmt(c.absTotal)} (was ${this._fmt(hist.total)})\n`;
            } else {
                resp += `🆕 **${c.name}**: ${this._fmt(c.absTotal)} (new)\n`;
            }
        });

        return { text: resp, type: 'analysis' };
    },

    _generalResponse(q) {
        const a = this.context;
        if (!a) {
            return { text: "I'm your financial AI assistant. Please import your SparkReceipt data (CSV or PDF) to get started. I can help with budget summaries, category analysis, spending projections, and more!", type: 'info' };
        }

        // Try to extract any useful context
        let resp = `I'm not sure I fully understand that question, but here's a quick snapshot:\n\n`;
        resp += `• **Total Spend:** ${this._fmt(a.totalSpend)}\n`;
        resp += `• **Total Income:** ${this._fmt(a.totalIncome)}\n`;
        resp += `• **Accounts:** ${a.institutions.length}\n`;
        resp += `• **Top Category:** ${a.categories.filter(c => c.name !== 'Income')[0]?.name || 'N/A'}\n\n`;
        resp += `Try asking about:\n`;
        resp += `• "Give me a budget summary"\n`;
        resp += `• "How much did I spend on food?"\n`;
        resp += `• "What will my spending look like next month?"\n`;
        resp += `• "How do I add a new account?"`;

        return { text: resp, type: 'info' };
    }
};
