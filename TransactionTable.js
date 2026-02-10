/**
 * Transaction Table Component - sortable, filterable list of all transactions
 */
const TransactionTable = {
    currentSort: { field: 'date', dir: 'desc' },
    filters: { category: '', institution: '', search: '' },
    allTransactions: [],

    render(transactions, analysis) {
        this.allTransactions = transactions;
        this._renderFilters(analysis);
        this._renderTable();
    },

    _renderFilters(analysis) {
        const el = document.getElementById('filterBar');
        const cats = Categorizer.CATEGORIES;
        const insts = analysis.institutions.map(i => i.name);
        el.innerHTML = `
      <input type="text" class="filter-search" placeholder="Search transactions..." id="txnSearch">
      <select class="filter-select" id="txnCatFilter">
        <option value="">All Categories</option>
        ${cats.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <select class="filter-select" id="txnInstFilter">
        <option value="">All Institutions</option>
        ${insts.map(i => `<option value="${i}">${i}</option>`).join('')}
      </select>
    `;
        document.getElementById('txnSearch').addEventListener('input', e => { this.filters.search = e.target.value.toLowerCase(); this._renderTable(); });
        document.getElementById('txnCatFilter').addEventListener('change', e => { this.filters.category = e.target.value; this._renderTable(); });
        document.getElementById('txnInstFilter').addEventListener('change', e => { this.filters.institution = e.target.value; this._renderTable(); });
    },

    _renderTable() {
        const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
        let txns = [...this.allTransactions];

        // Filter
        if (this.filters.category) txns = txns.filter(t => t.category === this.filters.category);
        if (this.filters.institution) txns = txns.filter(t => t.institution === this.filters.institution);
        if (this.filters.search) txns = txns.filter(t =>
            (t.vendor || '').toLowerCase().includes(this.filters.search) ||
            (t.description || '').toLowerCase().includes(this.filters.search)
        );

        // Sort
        const { field, dir } = this.currentSort;
        txns.sort((a, b) => {
            let va = a[field], vb = b[field];
            if (field === 'date') { va = va ? va.getTime() : 0; vb = vb ? vb.getTime() : 0; }
            if (field === 'amount') { va = Math.abs(va); vb = Math.abs(vb); }
            if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
            return dir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });

        document.getElementById('txnCount').textContent = `${txns.length} transactions`;

        const el = document.getElementById('transactionTable');
        const arrow = field => this.currentSort.field === field ? (this.currentSort.dir === 'asc' ? '↑' : '↓') : '↕';
        el.innerHTML = `
      <table class="txn-table">
        <thead><tr>
          <th data-sort="date" class="${this.currentSort.field === 'date' ? 'sorted' : ''}">Date <span class="sort-icon">${arrow('date')}</span></th>
          <th data-sort="vendor" class="${this.currentSort.field === 'vendor' ? 'sorted' : ''}">Vendor <span class="sort-icon">${arrow('vendor')}</span></th>
          <th data-sort="category">Category <span class="sort-icon">${arrow('category')}</span></th>
          <th data-sort="institution">Institution <span class="sort-icon">${arrow('institution')}</span></th>
          <th data-sort="amount" class="${this.currentSort.field === 'amount' ? 'sorted' : ''}">Amount <span class="sort-icon">${arrow('amount')}</span></th>
        </tr></thead>
        <tbody>
          ${txns.map(t => `<tr>
            <td>${t.dateStr}</td>
            <td>${t.vendor}</td>
            <td><span class="badge"><span class="badge-dot" style="background:${Categorizer.getColor(t.category)}"></span>${t.category}</span></td>
            <td><span class="badge"><span class="badge-dot" style="background:var(--accent-indigo)"></span>${t.institution}</span></td>
            <td class="txn-amount ${t.amount > 0 ? 'positive' : 'negative'}">${t.amount > 0 ? '+' : ''}${fmt(Math.abs(t.amount))}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    `;

        el.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const f = th.dataset.sort;
                if (this.currentSort.field === f) this.currentSort.dir = this.currentSort.dir === 'asc' ? 'desc' : 'asc';
                else { this.currentSort.field = f; this.currentSort.dir = 'desc'; }
                this._renderTable();
            });
        });
    }
};
