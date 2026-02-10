/**
 * Main Application - orchestrates file import, data processing, and view switching
 */
(function () {
    let appState = { transactions: [], analysis: null, accounts: [] };

    // Navigation
    const tabs = document.querySelectorAll('.nav-tab');
    const views = document.querySelectorAll('.view');

    function switchView(viewName) {
        if (!appState.analysis && viewName !== 'upload') return;
        views.forEach(v => v.classList.remove('active'));
        tabs.forEach(t => t.classList.remove('active'));
        if (viewName === 'upload') {
            document.getElementById('uploadView').classList.add('active');
            return;
        }
        if (viewName === 'login') {
            document.getElementById('loginView').classList.add('active');
            return;
        }
        const viewMap = {
            dashboard: 'dashboardView',
            institutions: 'institutionsView',
            transactions: 'transactionsView',
            payments: 'paymentsView',
            meeting: 'meetingView'
        };
        const el = document.getElementById(viewMap[viewName]);
        if (el) el.classList.add('active');
        const tab = document.querySelector(`[data-view="${viewName}"]`);
        if (tab) tab.classList.add('active');
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // File Upload
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const loadSampleBtn = document.getElementById('loadSampleBtn');
    const importNewBtn = document.getElementById('importNewBtn');

    browseBtn.addEventListener('click', e => { e.stopPropagation(); fileInput.click(); });
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    });

    fileInput.addEventListener('change', e => {
        if (e.target.files[0]) processFile(e.target.files[0]);
    });

    importNewBtn.addEventListener('click', () => switchView('upload'));

    loadSampleBtn.addEventListener('click', async () => {
        showProcessing('Loading sample data...');
        try {
            const csv = generateSampleData();
            const raw = FileParser.parseCSVText(csv);
            await animateProcessing();
            finalizeData(raw);
        } catch (err) {
            alert('Error loading sample data: ' + err.message);
            hideProcessing();
        }
    });

    async function processFile(file) {
        if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return; }
        showProcessing(`Processing ${file.name}...`);
        try {
            const raw = await FileParser.parse(file);
            await animateProcessing();
            finalizeData(raw);
        } catch (err) {
            alert('Error processing file: ' + err.message);
            console.error(err);
            hideProcessing();
        }
    }

    function showProcessing(text) {
        dropZone.classList.add('processing');
        document.getElementById('progressText').textContent = text;
        document.getElementById('progressFill').style.width = '10%';
    }

    function animateProcessing() {
        return new Promise(resolve => {
            const fill = document.getElementById('progressFill');
            const text = document.getElementById('progressText');
            let progress = 10;
            const steps = [
                { p: 30, t: 'Parsing transactions...' },
                { p: 55, t: 'Categorizing spending...' },
                { p: 75, t: 'Analyzing patterns...' },
                { p: 90, t: 'Building dashboard...' },
                { p: 100, t: 'Complete!' },
            ];
            let step = 0;
            const interval = setInterval(() => {
                if (step < steps.length) {
                    fill.style.width = steps[step].p + '%';
                    text.textContent = steps[step].t;
                    step++;
                } else {
                    clearInterval(interval);
                    resolve();
                }
            }, 300);
        });
    }

    function hideProcessing() {
        dropZone.classList.remove('processing');
        document.getElementById('progressFill').style.width = '0%';
    }

    function finalizeData(rawTransactions) {
        // Filter to last 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        let txns = rawTransactions.filter(t => {
            if (!t.date) return true; // keep transactions without dates
            return t.date >= thirtyDaysAgo && t.date <= now;
        });

        // If no transactions in last 30 days, use all
        if (txns.length === 0) txns = rawTransactions;

        // Categorize
        txns = Categorizer.categorize(txns);

        // Analyze
        // Store raw transactions
        appState.rawTransactions = txns;

        // Initial Analysis (No filters)
        applyGlobalFilters({ accounts: [], categories: [] });
    }

    // Expose finalizeData for BankLinkManager
    window.finalizeData = finalizeData;

    // Expose Global Filter Function
    window.applyGlobalFilters = function (filters) {
        let filteredTxns = appState.rawTransactions;

        // Apply Accounts Filter
        if (filters.accounts && filters.accounts.length > 0) {
            filteredTxns = filteredTxns.filter(t => filters.accounts.includes(t.institution || 'Unknown'));
        }

        // Apply Categories Filter
        if (filters.categories && filters.categories.length > 0) {
            filteredTxns = filteredTxns.filter(t => filters.categories.includes(t.category));
        }

        // Re-Analyze
        const analysis = Analyzer.analyze(filteredTxns);
        const accounts = AccountManager.getAccounts(); // Use stored accounts (from full data) or filter them?
        // Let's keep AccountManager static (showing all accounts available) but analysis dynamic

        appState.transactions = filteredTxns;
        appState.analysis = analysis;

        // Render Views
        Dashboard.render(analysis);
        InstitutionAnalysis.render(analysis);
        TransactionTable.render(filteredTxns, analysis);

        // Update Chart colors if needed?
        // Charts should auto-update in Dashboard.render'
    };

    // Disable tabs initially
    tabs.forEach(t => t.classList.add('disabled'));

    // Initialize Components
    Chatbot.init();
    Login.init();
    ShareManager.init();
    ExportManager.init();
    FilterManager.init();
    // Initialize Voice Manager
    VoiceManager.init();
    // Initialize Bank Link Manager
    BankLinkManager.init();
    // Initialize Meeting View
    MeetingView.init();


    // Sample data generator
    function generateSampleData() {
        const now = new Date();
        const institutions = ['Chase Checking', 'Bank of America Savings', 'Amex Platinum Card', 'Capital One Venture Card'];
        const vendors = [
            { name: 'Whole Foods Market', cat: 'Food & Dining', range: [25, 120] },
            { name: 'Starbucks', cat: 'Food & Dining', range: [4, 8] },
            { name: 'Chipotle', cat: 'Food & Dining', range: [10, 18] },
            { name: 'DoorDash', cat: 'Food & Dining', range: [15, 45] },
            { name: 'Shell Gas Station', cat: 'Transportation', range: [30, 65] },
            { name: 'Uber', cat: 'Transportation', range: [8, 35] },
            { name: 'Lyft', cat: 'Transportation', range: [10, 30] },
            { name: 'Amazon.com', cat: 'Shopping', range: [12, 200] },
            { name: 'Target', cat: 'Shopping', range: [15, 80] },
            { name: 'Nike Store', cat: 'Shopping', range: [40, 180] },
            { name: 'Netflix', cat: 'Subscriptions', range: [15.99, 22.99] },
            { name: 'Spotify Premium', cat: 'Subscriptions', range: [10.99, 10.99] },
            { name: 'Adobe Creative Cloud', cat: 'Subscriptions', range: [54.99, 54.99] },
            { name: 'Google One Storage', cat: 'Subscriptions', range: [2.99, 2.99] },
            { name: 'Comcast Internet', cat: 'Utilities', range: [79.99, 89.99] },
            { name: 'Electric Company', cat: 'Utilities', range: [85, 150] },
            { name: 'Water Utility', cat: 'Utilities', range: [35, 55] },
            { name: 'T-Mobile', cat: 'Utilities', range: [70, 85] },
            { name: 'Rent Payment - Apartment', cat: 'Housing', range: [2200, 2200] },
            { name: 'Renters Insurance', cat: 'Housing', range: [25, 25] },
            { name: 'CVS Pharmacy', cat: 'Healthcare', range: [10, 45] },
            { name: 'Doctor Visit Copay', cat: 'Healthcare', range: [30, 50] },
            { name: 'AMC Theaters', cat: 'Entertainment', range: [12, 25] },
            { name: 'Gym Membership', cat: 'Entertainment', range: [49.99, 49.99] },
            { name: 'Concert Tickets', cat: 'Entertainment', range: [50, 150] },
            { name: 'ATM Withdrawal', cat: 'Transfers/Fees', range: [40, 200] },
            { name: 'Venmo Transfer', cat: 'Transfers/Fees', range: [20, 100] },
            { name: 'Wire Transfer Fee', cat: 'Transfers/Fees', range: [15, 25] },
            { name: 'Employer Payroll', cat: 'Income', range: [3200, 4800] },
            { name: 'Freelance Payment', cat: 'Income', range: [500, 2000] },
            { name: 'Interest Earned', cat: 'Income', range: [5, 25] },
        ];

        let rows = ['Date,Vendor,Amount,Category,Institution,Description'];
        for (let i = 0; i < 85; i++) {
            const daysAgo = Math.floor(Math.random() * 29);
            const d = new Date(now.getTime() - daysAgo * 86400000);
            const dateStr = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
            const v = vendors[Math.floor(Math.random() * vendors.length)];
            let amount = v.range[0] + Math.random() * (v.range[1] - v.range[0]);
            amount = Math.round(amount * 100) / 100;
            if (v.cat !== 'Income') amount = -amount;
            const inst = institutions[Math.floor(Math.random() * institutions.length)];
            rows.push(`${dateStr},"${v.name}",${amount},${v.cat},"${inst}","${v.name} transaction"`);
        }
        return rows.join('\\n');
    }
})();
