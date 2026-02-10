/**
 * CSV Parser for SparkReceipt exports
 * Parses CSV text, fuzzy-matches column headers, normalizes data
 */
const CSVParser = {
    // Canonical column mappings - fuzzy match against these
    COLUMN_MAP: {
        date: ['date', 'transaction date', 'trans date', 'posted date', 'post date', 'txn date', 'created', 'timestamp'],
        vendor: ['vendor', 'merchant', 'payee', 'description', 'name', 'merchant name', 'store', 'company', 'from', 'to'],
        amount: ['amount', 'total', 'value', 'sum', 'price', 'cost', 'debit', 'charge', 'transaction amount'],
        category: ['category', 'type', 'group', 'classification', 'expense type', 'spending category'],
        currency: ['currency', 'curr', 'ccy'],
        description: ['description', 'memo', 'notes', 'details', 'reference', 'note', 'transaction description'],
        institution: ['institution', 'bank', 'account', 'source', 'financial institution', 'account name', 'bank name', 'card', 'card name'],
        credit: ['credit', 'deposit', 'income'],
    },

    /**
     * Parse CSV string into normalized transactions
     * @param {string} csvText - Raw CSV content
     * @returns {Array} Normalized transaction objects
     */
    parse(csvText) {
        const result = Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            transformHeader: h => h.trim().toLowerCase(),
        });

        if (result.errors.length > 0) {
            console.warn('CSV parsing warnings:', result.errors);
        }

        const headerMap = this._mapHeaders(result.meta.fields || []);
        return result.data
            .map(row => this._normalizeRow(row, headerMap))
            .filter(txn => txn.date && (txn.amount !== 0));
    },

    /**
     * Fuzzy-match CSV headers to canonical fields
     */
    _mapHeaders(headers) {
        const map = {};
        for (const [canonical, aliases] of Object.entries(this.COLUMN_MAP)) {
            for (const header of headers) {
                const normalized = header.trim().toLowerCase();
                if (aliases.includes(normalized)) {
                    map[canonical] = header;
                    break;
                }
            }
            // Partial match fallback
            if (!map[canonical]) {
                for (const header of headers) {
                    const normalized = header.trim().toLowerCase();
                    for (const alias of aliases) {
                        if (normalized.includes(alias) || alias.includes(normalized)) {
                            map[canonical] = header;
                            break;
                        }
                    }
                    if (map[canonical]) break;
                }
            }
        }
        return map;
    },

    /**
     * Normalize a single CSV row into a transaction object
     */
    _normalizeRow(row, headerMap) {
        const get = field => {
            const key = headerMap[field];
            return key ? (row[key] || '').trim() : '';
        };

        let amount = this._parseAmount(get('amount'));
        const credit = this._parseAmount(get('credit'));
        if (credit && !amount) {
            amount = credit;
        } else if (credit && amount) {
            // If both exist, amount might be debit and credit is income
            amount = amount || credit;
        }

        const dateStr = get('date');
        const parsedDate = this._parseDate(dateStr);

        return {
            date: parsedDate,
            dateStr: parsedDate ? this._formatDate(parsedDate) : dateStr,
            vendor: get('vendor') || get('description') || 'Unknown',
            amount: amount,
            category: get('category'),
            currency: get('currency') || 'USD',
            description: get('description'),
            institution: get('institution') || 'Unknown',
            raw: row,
        };
    },

    /**
     * Parse amount string to number
     */
    _parseAmount(str) {
        if (!str) return 0;
        // Remove currency symbols and whitespace
        const cleaned = str.replace(/[^\d.\-\(\)]/g, '');
        // Handle parenthetical negatives: (100.00) = -100.00
        if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            return -parseFloat(cleaned.slice(1, -1)) || 0;
        }
        return parseFloat(cleaned) || 0;
    },

    /**
     * Parse various date formats
     */
    _parseDate(str) {
        if (!str) return null;
        // Try ISO format first
        let d = new Date(str);
        if (!isNaN(d.getTime())) return d;

        // Try MM/DD/YYYY
        const parts = str.split(/[\/\-\.]/);
        if (parts.length === 3) {
            const [a, b, c] = parts.map(Number);
            // MM/DD/YYYY
            if (a <= 12 && b <= 31) {
                d = new Date(c < 100 ? 2000 + c : c, a - 1, b);
                if (!isNaN(d.getTime())) return d;
            }
            // DD/MM/YYYY
            if (b <= 12 && a <= 31) {
                d = new Date(c < 100 ? 2000 + c : c, b - 1, a);
                if (!isNaN(d.getTime())) return d;
            }
        }
        return null;
    },

    _formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    }
};
