/**
 * Export Manager - Handles PDF export with account selection
 */
const ExportManager = {
    init() {
        this.renderModal();
        this.addExportButton();
    },

    addExportButton() {
        // Add export button to Filter Bar in Transactions View
        const filterBar = document.getElementById('filterBar');
        if (!filterBar) return;

        const btn = document.createElement('button');
        btn.className = 'btn btn-outline btn-sm';
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
        `;
        btn.onclick = () => this.showModal();
        filterBar.appendChild(btn);
    },

    renderModal() {
        const div = document.createElement('div');
        div.className = 'modal-overlay';
        div.id = 'exportModal';
        div.innerHTML = `
            <div class="modal" style="max-width: 500px">
                <div class="modal-header">
                    <h2 class="view-title" style="font-size: 1.25rem">Export Transactions</h2>
                    <button class="modal-close" onclick="ExportManager.hideModal()">✕</button>
                </div>
                <p class="modal-subtitle" style="margin-bottom: 1.5rem">Select accounts to include in the PDF report.</p>
                
                <div id="accountList" class="account-checklist">
                    <!-- Checkboxes injected here -->
                </div>

                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem">
                    <button class="btn btn-ghost" onclick="ExportManager.hideModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="ExportManager.generatePDF()">Download PDF</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        // Close on click outside
        div.addEventListener('click', (e) => {
            if (e.target === div) this.hideModal();
        });
    },

    showModal() {
        const list = document.getElementById('accountList');
        const accounts = AccountManager.getAccounts(); // Assuming AccountManager has this

        // If AccountManager doesn't expose accounts directly, we might need to fetch them from analysis or stored data
        // For now, let's assume we can get them. If not, we'll fix AccountManager.
        // Actually, AccountManager tracks accounts. Let's verify we can get them.
        // If not, we can extract from DOM or global analysis object if accessible.
        // Let's rely on AccountManager.accounts if available, or pass it in.

        // Better: Use the global 'filteredParams' or access data from DOM? 
        // Best: Read from AccountManager. If it doesn't have a getter, I'll add it.

        const uniqueAccounts = AccountManager.accounts || [];

        if (uniqueAccounts.length === 0) {
            alert("No accounts found to export.");
            return;
        }

        list.innerHTML = `
            <label class="checkbox-item" style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 0.75rem; cursor: pointer; margin-bottom: 0.5rem">
                <input type="checkbox" id="selectAll" checked onchange="ExportManager.toggleAll(this)">
                <span style="font-weight: 600">Select All</span>
            </label>
        ` + uniqueAccounts.map(acc => `
            <label class="checkbox-item" style="padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; align-items: center; gap: 0.75rem; cursor: pointer; margin-bottom: 0.5rem">
                <input type="checkbox" class="acc-checkbox" value="${acc.name}" checked>
                <span>${acc.name} <span style="color: var(--text-tertiary); font-size: 0.8em">(${acc.type})</span></span>
            </label>
        `).join('');

        document.getElementById('exportModal').classList.add('active');
    },

    hideModal() {
        document.getElementById('exportModal').classList.remove('active');
    },

    toggleAll(source) {
        document.querySelectorAll('.acc-checkbox').forEach(cb => cb.checked = source.checked);
    },

    async generatePDF() {
        // verify jspdf is loaded
        if (!window.jspdf) {
            alert('PDF library not loaded');
            return;
        }

        const inputs = document.querySelectorAll('.acc-checkbox:checked');
        const selectedNames = Array.from(inputs).map(cb => cb.value);

        if (selectedNames.length === 0) {
            alert('Please select at least one account');
            return;
        }

        // Get transactions
        // We need access to all transactions. 
        // Analyzer has them? Or main.js?
        // Let's assume we can access `Analyzer.lastAnalysis` or we need to pass data.
        // I will update Analyzer to store the last analysis result for easy access.

        const analysis = Analyzer.lastAnalysis;
        if (!analysis) {
            alert('No data to export');
            return;
        }

        const txns = analysis.transactions.filter(t => selectedNames.includes(t.institution || 'Unknown'));

        // Sort by date desc
        txns.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Calculate totals
        const totalSpend = txns.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const totalIncome = txns.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

        // Generate PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.text('Transaction Report', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.font = 'helvetica';
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 28);

        // Summary
        doc.setDrawColor(220, 220, 220);
        doc.line(14, 35, 196, 35);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Accounts: ${selectedNames.length} selected`, 14, 45);

        doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, 52);
        doc.text(`Total Spend: $${totalSpend.toFixed(2)}`, 80, 52);
        doc.text(`Net Flow: $${(totalIncome - totalSpend).toFixed(2)}`, 146, 52);

        // Table
        const tableData = txns.map(t => [
            t.dateStr,
            t.vendor,
            t.category,
            t.institution,
            t.amount > 0 ? `+${t.amount.toFixed(2)}` : t.amount.toFixed(2)
        ]);

        doc.autoTable({
            startY: 60,
            head: [['Date', 'Merchant', 'Category', 'Account', 'Amount']],
            body: tableData,
            theme: 'plain',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [240, 240, 240], textColor: 50, fontStyle: 'bold' },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 35 },
                3: { cellWidth: 35 },
                4: { cellWidth: 25, halign: 'right' }
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 4) {
                    const val = parseFloat(data.cell.raw.replace('+', ''));
                    if (val > 0) data.cell.styles.textColor = [0, 128, 0]; // Green
                }
            }
        });

        doc.save(`SparkReceipt_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        this.hideModal();
    }
};
