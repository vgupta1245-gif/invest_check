/**
 * Category Deep Dive - modal showing detailed analysis for a single category
 */
const CategoryDeepDive = {
  chartInstance: null,

  show(category, analysis) {
    const modal = document.getElementById('categoryModal');
    const content = document.getElementById('categoryModalContent');

    // Build institution breakdown for this category
    const instBreakdown = {};
    category.transactions.forEach(t => {
      const inst = t.institution || 'Unknown';
      if (!instBreakdown[inst]) instBreakdown[inst] = { total: 0, count: 0 };
      instBreakdown[inst].total += Math.abs(t.amount);
      instBreakdown[inst].count++;
    });
    const instList = Object.entries(instBreakdown).sort(([, a], [, b]) => b.total - a.total);

    const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

    content.innerHTML = `
      <div class="modal-header">
        <div>
          <h2 style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.5rem">${category.icon}</span>
            ${category.name}
          </h2>
          <p style="color:var(--text-secondary);font-size:var(--font-sm);margin-top:4px">${category.count} transactions this period</p>
        </div>
        <button class="modal-close" id="closeModal">✕</button>
      </div>

      <div class="modal-stats">
        <div class="modal-stat">
          <div class="modal-stat-value" style="color:${category.color}">${fmt(category.absTotal)}</div>
          <div class="modal-stat-label">Total Spent</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-value">${fmt(Math.abs(category.avg))}</div>
          <div class="modal-stat-label">Average Transaction</div>
        </div>
        <div class="modal-stat">
          <div class="modal-stat-value">${((category.absTotal / analysis.totalSpend) * 100).toFixed(1)}%</div>
          <div class="modal-stat-label">of Total Spend</div>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Top Merchants</div>
        <div class="merchant-list">
          ${category.merchants.map(m => `
            <div class="merchant-item">
              <div class="merchant-name">
                <span class="category-dot" style="background:${category.color}"></span>
                ${m.name}
                <span class="merchant-count">(${m.count}x)</span>
              </div>
              <div class="merchant-amount">${fmt(m.total)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">By Financial Institution</div>
        <div class="merchant-list">
          ${instList.map(([name, d]) => `
            <div class="merchant-item">
              <div class="merchant-name">
                <span class="category-dot" style="background:var(--accent-indigo)"></span>
                ${name}
                <span class="merchant-count">(${d.count} txns)</span>
              </div>
              <div class="merchant-amount">${fmt(d.total)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Daily Trend</div>
        <div class="chart-wrapper" style="max-height:200px">
          <canvas id="modalTrendChart" style="max-height:200px"></canvas>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Recent Transactions</div>
        <div class="table-container">
          <table class="txn-table">
            <thead><tr><th>Date</th><th>Vendor</th><th>Institution</th><th>Amount</th></tr></thead>
            <tbody>
              ${category.transactions.slice(0, 15).map(t => `
                <tr>
                  <td>${t.dateStr}</td>
                  <td>${t.vendor}</td>
                  <td><span class="badge"><span class="badge-dot" style="background:var(--accent-indigo)"></span>${t.institution}</span></td>
                  <td class="txn-amount ${t.amount > 0 ? 'positive' : 'negative'}">${t.amount > 0 ? '+' : ''}${fmt(Math.abs(t.amount))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    modal.classList.add('active');
    document.getElementById('closeModal').addEventListener('click', () => this.hide());
    modal.addEventListener('click', e => { if (e.target === modal) this.hide(); });

    this._renderMiniTrend(category);
  },

  hide() {
    document.getElementById('categoryModal').classList.remove('active');
    if (this.chartInstance) { this.chartInstance.destroy(); this.chartInstance = null; }
  },

  _renderMiniTrend(category) {
    const daily = {};
    category.transactions.forEach(t => {
      if (!t.date) return;
      const key = t.date.toISOString().split('T')[0];
      if (!daily[key]) daily[key] = 0;
      daily[key] += Math.abs(t.amount);
    });
    const sorted = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));
    const canvas = document.getElementById('modalTrendChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(([d]) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{ data: sorted.map(([, v]) => v), backgroundColor: category.color + '80', borderColor: category.color, borderWidth: 1, borderRadius: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        plugins: { legend: { display: false }, tooltip: { backgroundColor: '#FFFFFF', titleColor: '#111111', bodyColor: '#555555' } },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#555555', font: { size: 9 } } },
          y: { grid: { color: '#E0E0E0' }, ticks: { color: '#555555', font: { size: 9 }, callback: v => '$' + v } }
        }
      }
    });
  }
};
