/**
 * Institution Analysis Component
 */
const InstitutionAnalysis = {
  chartInstance: null,

  render(analysis) {
    const el = document.getElementById('institutionContent');
    const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    const insts = analysis.institutions;

    el.innerHTML = `
      <div class="inst-chart-card">
        <h3 class="card-title">Spending by Institution</h3>
        <div class="chart-wrapper" style="max-height:280px">
          <canvas id="instStackedChart" style="max-height:280px"></canvas>
        </div>
      </div>
      <div class="institution-grid">
        ${insts.map((inst, i) => `
          <div class="institution-card" style="animation-delay:${i * 0.06}s">
            <div class="institution-header">
              <div class="institution-icon" style="background:${AccountManager.getColor(i)}">${inst.name.charAt(0).toUpperCase()}</div>
              <div>
                <div class="institution-name">${inst.name}</div>
                <div class="institution-detail">${inst.count} transactions</div>
              </div>
            </div>
            <div class="institution-stats">
              <div class="inst-stat">
                <div class="inst-stat-value" style="color:var(--accent-red)">${fmt(inst.spend)}</div>
                <div class="inst-stat-label">Total Spent</div>
              </div>
              <div class="inst-stat">
                <div class="inst-stat-value" style="color:var(--accent-emerald)">${fmt(inst.income)}</div>
                <div class="inst-stat-label">Total Income</div>
              </div>
            </div>
            <div class="institution-categories">
              ${Object.entries(inst.categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, amt]) => `
                  <div class="inst-cat-item">
                    <div class="inst-cat-name">
                      <span class="category-dot" style="background:${Categorizer.getColor(cat)}"></span>
                      ${cat}
                    </div>
                    <div class="inst-cat-amount">${fmt(amt)}</div>
                  </div>
                `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this._renderStackedChart(analysis);
  },

  _renderStackedChart(analysis) {
    const canvas = document.getElementById('instStackedChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (this.chartInstance) this.chartInstance.destroy();

    const insts = analysis.institutions;
    const allCats = [...new Set(insts.flatMap(i => Object.keys(i.categories)))];

    this.chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: insts.map(i => i.name),
        datasets: allCats.map(cat => ({
          label: cat,
          data: insts.map(i => i.categories[cat] || 0),
          backgroundColor: Categorizer.getColor(cat) + 'CC',
          borderRadius: 3,
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: true,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: '#555555', font: { family: 'Inter', size: 10 } } },
          y: { stacked: true, grid: { color: '#E0E0E0' }, ticks: { color: '#555555', font: { size: 10 }, callback: v => '$' + v.toLocaleString() } }
        },
        plugins: {
          legend: { labels: { color: '#555555', font: { family: 'Inter', size: 10 }, usePointStyle: true, pointStyleWidth: 8, padding: 10 } },
          tooltip: { backgroundColor: '#FFFFFF', titleColor: '#111111', bodyColor: '#555555', borderColor: '#E0E0E0', borderWidth: 1 }
        }
      }
    });
  }
};
