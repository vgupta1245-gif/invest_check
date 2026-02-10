/**
 * Filter Manager - Handles customizable analysis (Accounts & Categories)
 */
const FilterManager = {
    activeFilters: {
        accounts: [], // Empty means all
        categories: [] // Empty means all
    },

    init() {
        // Wait for DOM
        setTimeout(() => this.addFilterButton(), 100);
        this.renderModal();
    },

    addFilterButton() {
        // Add before the "Import New" button in dashboard header
        const btnContainer = document.querySelector('.dashboard-header');
        if (!btnContainer) return;

        if (document.getElementById('filterBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'filterBtn';
        btn.className = 'btn btn-outline btn-sm';
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            Filter
        `;
        btn.style.marginRight = '8px';
        btn.onclick = () => this.showModal();

        // Order: Import -> Share -> Filter -> Play Summary
        // We want Filter to be after Share/Import.
        // Let's just append to container, and we'll control order by init sequence or by re-appending.
        // Actually, best way is to find the container and append.
        // But main.js runs: Export.init, Filter.init, Voice.init.
        // Import/Share are in HTML or init earlier.

        // Let's try to find "Share" button and insert after. 
        // Or if not found, after "Import".
        const shareBtn = document.getElementById('shareBtn'); // Assuming ID from ShareManager
        const importBtn = document.getElementById('importNewBtn');

        if (shareBtn) {
            shareBtn.parentNode.insertBefore(btn, shareBtn.nextSibling);
        } else if (importBtn) {
            importBtn.parentNode.insertBefore(btn, importBtn.nextSibling);
        } else {
            btnContainer.appendChild(btn);
        }
    },

    renderModal() {
        if (document.getElementById('filterModal')) return;

        const div = document.createElement('div');
        div.className = 'modal-overlay';
        div.id = 'filterModal';
        div.innerHTML = `
            <div class="modal" style="max-width: 400px">
                <div class="modal-header">
                    <h2 class="view-title" style="font-size: 1.25rem">Filter Analysis</h2>
                    <button class="modal-close" onclick="FilterManager.hideModal()">✕</button>
                </div>
                
                <h3 class="section-title" style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 1rem">Accounts</h3>
                <div class="account-checklist" id="filterAccList" style="max-height: 150px; border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem;"></div>

                <h3 class="section-title" style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 1rem">Categories</h3>
                <div class="account-checklist" id="filterCatList" style="max-height: 150px; border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem;"></div>

                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem">
                    <button class="btn btn-ghost" onclick="FilterManager.resetFilters()">Reset All</button>
                    <button class="btn btn-primary" onclick="FilterManager.apply()">Apply Filters</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        div.addEventListener('click', (e) => {
            if (e.target === div) this.hideModal();
        });
    },

    showModal() {
        const accList = document.getElementById('filterAccList');
        const catList = document.getElementById('filterCatList');

        const accounts = AccountManager.getAccounts().map(a => a.name);
        // Categories hardcoded or derived? Let's use hardcoded + Income
        const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Subscriptions', 'Utilities', 'Housing', 'Healthcare', 'Entertainment', 'Transfers/Fees', 'Income', 'Travel', 'Loans', 'Other'];

        this.renderList(accList, accounts, this.activeFilters.accounts, 'acc');
        this.renderList(catList, categories, this.activeFilters.categories, 'cat');

        document.getElementById('filterModal').classList.add('active');
    },

    renderList(container, items, activeItems, prefix) {
        const isAll = activeItems.length === 0;

        let html = `
            <label class="checkbox-item" style="display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer;">
                <input type="checkbox" id="all_${prefix}" ${isAll ? 'checked' : ''} onchange="FilterManager.toggleAll('${prefix}', this.checked)">
                <span style="font-weight: 600">All</span>
            </label>
            <hr style="margin: 4px 0; border: 0; border-top: 1px solid var(--border-color)">
        `;

        html += items.map(item => {
            const checked = isAll || activeItems.includes(item);
            return `
                <label class="checkbox-item" style="display: flex; align-items: center; gap: 8px; padding: 4px 0; cursor: pointer;">
                    <input type="checkbox" class="${prefix}-cb" value="${item}" ${checked ? 'checked' : ''} onchange="FilterManager.updateAllState('${prefix}')">
                    <span>${item}</span>
                </label>
            `;
        }).join('');

        container.innerHTML = html;
    },

    toggleAll(prefix, checked) {
        document.querySelectorAll(`.${prefix}-cb`).forEach(cb => cb.checked = checked);
    },

    updateAllState(prefix) {
        const allCb = document.getElementById(`all_${prefix}`);
        const checkboxes = document.querySelectorAll(`.${prefix}-cb`);
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        allCb.checked = allChecked;
    },

    hideModal() {
        document.getElementById('filterModal').classList.remove('active');
    },

    resetFilters() {
        this.activeFilters = { accounts: [], categories: [] };
        // Clean UI or just apply?
        // Just apply empty
        if (typeof applyGlobalFilters === 'function') {
            applyGlobalFilters(this.activeFilters);
        }
        this.hideModal();
    },

    apply() {
        // Build filters
        const accs = Array.from(document.querySelectorAll('.acc-cb:checked')).map(cb => cb.value);
        const cats = Array.from(document.querySelectorAll('.cat-cb:checked')).map(cb => cb.value);

        // If 'All' is checked or ALL items are checked, filter is empty (meaning all)
        const allAccChecked = document.getElementById('all_acc').checked;
        const allCatChecked = document.getElementById('all_cat').checked;

        this.activeFilters.accounts = allAccChecked ? [] : accs;
        this.activeFilters.categories = allCatChecked ? [] : cats;

        // Call main
        if (typeof applyGlobalFilters === 'function') {
            applyGlobalFilters(this.activeFilters);
        }
        this.hideModal();
    }
};
