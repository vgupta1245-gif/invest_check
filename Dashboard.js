/**
 * Dashboard Component - renders summary cards, charts, and category breakdown
 */
const Dashboard = {
    chartInstances: {},

    render(analysis) {
        this._renderSummaryCards(analysis);
        this._renderCategoryChart(analysis);
        this._renderTrendChart(analysis);
        this._renderCategoryList(analysis);
    },

    _fmt(n) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    },

    _renderSummaryCards(a) {
        const el = document.getElementById('summaryCards');
        const cards = [
            { icon: '💸', label: 'Total Spend', value: this._fmt(a.totalSpend), sub: `${a.transactionCount} transactions`, bg: 'rgba(239,68,68,0.12)', delay: '0s' },
            { icon: '💰', label: 'Total Income', value: this._fmt(a.totalIncome), sub: `Net: ${this._fmt(a.netFlow)}`, bg: 'rgba(16,185,129,0.12)', delay: '0.05s' },
            { icon: '🏦', label: 'Accounts', value: a.institutions.length, sub: 'Linked institutions', bg: 'rgba(99,102,241,0.12)', delay: '0.1s' },
            { icon: '📊', label: 'Top Category', value: a.categories.filter(c => c.name !== 'Income')[0]?.name || 'N/A', sub: a.categories.filter(c => c.name !== 'Income')[0] ? this._fmt(a.categories.filter(c => c.name !== 'Income')[0].absTotal) : '', bg: 'rgba(139,92,246,0.12)', delay: '0.15s' },
        ];
        el.innerHTML = cards.map(c => `
      <div class="summary-card" style="animation-delay:${c.delay}">
        <div class="summary-card-icon" style="background:${c.bg}">${c.icon}</div>
        <div class="summary-card-label">${c.label}</div>
        <div class="summary-card-value">${c.value}</div>
        <div class="summary-card-sub">${c.sub}</div>
      </div>
    `).join('');
    },

    _renderCategoryChart(a) {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        if (this.chartInstances.cat) this.chartInstances.cat.destroy();
        const expCats = a.categories.filter(c => c.name !== 'Income');
        this.chartInstances.cat = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: expCats.map(c => c.name),
                datasets: [{
                    data: expCats.map(c => c.absTotal),
                    backgroundColor: expCats.map(c => c.color),
                    borderWidth: 0,
                    hoverOffset: 8,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                cutout: '65%',
                plugins: {
                    legend: { position: 'right', labels: { color: '#555555', font: { family: 'Inter', size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } },
                    tooltip: {
                        backgroundColor: '#FFFFFF', titleColor: '#111111', bodyColor: '#555555', borderColor: '#E0E0E0', borderWidth: 1, padding: 12,
                        callbacks: { label: ctx => ` ${ctx.label}: ${Dashboard._fmt(ctx.raw)}` }
                    }
                }
            }
        });
    },

    _renderTrendChart(a) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        if (this.chartInstances.trend) this.chartInstances.trend.destroy();
        const trend = a.dailyTrend;
        this.chartInstances.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trend.map(d => { const dt = new Date(d.date); return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }),
                datasets: [{
                    label: 'Spending',
                    data: trend.map(d => d.spend),
                    borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)',
                    fill: true, tension: 0.4, pointRadius: 3, pointHoverRadius: 6, borderWidth: 2,
                }, {
                    label: 'Income',
                    data: trend.map(d => d.income),
                    borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.05)',
                    fill: true, tension: 0.4, pointRadius: 2, pointHoverRadius: 5, borderWidth: 2,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                scales: {
                    x: { grid: { color: '#E0E0E0' }, ticks: { color: '#555555', font: { family: 'Inter', size: 10 }, maxRotation: 45 } },
                    y: { grid: { color: '#E0E0E0' }, ticks: { color: '#555555', font: { family: 'Inter', size: 10 }, callback: v => '$' + v.toLocaleString() } }
                },
                plugins: {
                    legend: { labels: { color: '#555555', font: { family: 'Inter', size: 11 }, usePointStyle: true, pointStyleWidth: 8 } },
                    tooltip: { backgroundColor: '#FFFFFF', titleColor: '#111111', bodyColor: '#555555', borderColor: '#E0E0E0', borderWidth: 1 }
                }
            }
        });
    },

    _renderCategoryList(a) {
        const el = document.getElementById('categoryList');
        const maxAbs = Math.max(...a.categories.map(c => c.absTotal));
        el.innerHTML = a.categories.map((c, i) => `
      <div class="category-item" style="animation-delay:${i * 0.04}s" data-category="${c.name}">
        <div class="category-dot" style="background:${c.color}"></div>
        <div class="category-info">
          <div class="category-name">${c.icon} ${c.name}</div>
          <div class="category-stats">${c.count} transactions • Avg ${Dashboard._fmt(Math.abs(c.avg))}</div>
        </div>
        <div class="category-bar-wrapper">
          <div class="category-bar"><div class="category-bar-fill" style="width:${(c.absTotal / maxAbs * 100).toFixed(1)}%;background:${c.color}"></div></div>
        </div>
        <div class="category-amount" style="color:${c.name === 'Income' ? '#2E7D32' : '#111111'}">${c.name === 'Income' ? '+' : '-'}${Dashboard._fmt(c.absTotal)}</div>
      </div>
    `).join('');

        el.querySelectorAll('.category-item').forEach(item => {
            item.addEventListener('click', () => {
                const cat = a.categories.find(c => c.name === item.dataset.category);
                if (cat) CategoryDeepDive.show(cat, a);
            });
        });
    }
};
