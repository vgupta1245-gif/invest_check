/**
 * Transaction Categorizer
 * Maps transactions to standardized spending categories via keyword matching
 */
const Categorizer = {
    CATEGORIES: [
        'Income', 'Housing', 'Food & Dining', 'Transportation', 'Utilities',
        'Shopping', 'Healthcare', 'Entertainment', 'Subscriptions', 'Transfers/Fees', 'Uncategorized'
    ],

    CATEGORY_COLORS: {
        'Income': '#10b981',
        'Housing': '#6366f1',
        'Food & Dining': '#f59e0b',
        'Transportation': '#3b82f6',
        'Utilities': '#06b6d4',
        'Shopping': '#ec4899',
        'Healthcare': '#ef4444',
        'Entertainment': '#a78bfa',
        'Subscriptions': '#f97316',
        'Transfers/Fees': '#64748b',
        'Uncategorized': '#475569',
    },

    CATEGORY_ICONS: {
        'Income': '💰', 'Housing': '🏠', 'Food & Dining': '🍽️', 'Transportation': '🚗',
        'Utilities': '⚡', 'Shopping': '🛍️', 'Healthcare': '🏥', 'Entertainment': '🎬',
        'Subscriptions': '📱', 'Transfers/Fees': '🔄', 'Uncategorized': '📋',
    },

    KEYWORDS: {
        'Income': ['payroll', 'salary', 'direct deposit', 'income', 'dividend', 'interest earned', 'refund', 'cashback', 'reimbursement', 'venmo from', 'zelle from', 'deposit'],
        'Housing': ['rent', 'mortgage', 'hoa', 'property tax', 'home insurance', 'landlord', 'apartment', 'lease', 'housing', 'real estate', 'realty'],
        'Food & Dining': ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'chipotle', 'grubhub', 'doordash', 'uber eats', 'instacart', 'whole foods', 'trader joe', 'kroger', 'safeway', 'grocery', 'food', 'pizza', 'burger', 'sushi', 'taco', 'diner', 'bakery', 'dunkin', 'panera', 'chick-fil-a', 'wendy', 'subway', 'panda express', 'domino', 'popeye', 'five guys', 'shake shack', 'sweetgreen', 'postmates'],
        'Transportation': ['uber', 'lyft', 'gas', 'shell', 'chevron', 'exxon', 'bp ', 'parking', 'toll', 'transit', 'metro', 'subway fare', 'amtrak', 'airline', 'delta', 'united', 'american air', 'southwest', 'car wash', 'auto', 'vehicle', 'fuel', 'speedway', 'wawa gas'],
        'Utilities': ['electric', 'water', 'gas bill', 'internet', 'comcast', 'verizon', 'at&t', 'att', 't-mobile', 'spectrum', 'utility', 'power', 'sewer', 'trash', 'waste', 'phone bill', 'xfinity'],
        'Shopping': ['amazon', 'walmart', 'target', 'best buy', 'costco', 'etsy', 'ebay', 'nordstrom', 'macy', 'nike', 'adidas', 'zara', 'h&m', 'gap', 'old navy', 'ikea', 'home depot', 'lowe', 'clothing', 'apparel', 'shop', 'store', 'retail', 'purchase', 'apple store'],
        'Healthcare': ['pharmacy', 'cvs', 'walgreens', 'doctor', 'hospital', 'medical', 'dental', 'vision', 'health', 'insurance premium', 'clinic', 'urgent care', 'lab', 'prescription', 'therapy', 'optometrist'],
        'Entertainment': ['netflix', 'hulu', 'disney', 'hbo', 'movie', 'theater', 'cinema', 'concert', 'ticket', 'event', 'game', 'steam', 'playstation', 'xbox', 'twitch', 'spotify', 'apple music', 'youtube premium', 'museum', 'zoo', 'amusement', 'bowling', 'golf', 'gym'],
        'Subscriptions': ['subscription', 'membership', 'monthly', 'annual fee', 'prime', 'cloud storage', 'dropbox', 'google one', 'icloud', 'adobe', 'microsoft 365', 'notion', 'slack', 'zoom', 'canva', 'linkedin premium', 'patreon', 'substack'],
        'Transfers/Fees': ['transfer', 'fee', 'atm', 'withdrawal', 'wire', 'overdraft', 'service charge', 'maintenance fee', 'late fee', 'interest charge', 'finance charge', 'venmo to', 'zelle to', 'paypal', 'cash app', 'payment to'],
    },

    /**
     * Categorize an array of transactions
     */
    categorize(transactions) {
        return transactions.map(txn => ({
            ...txn,
            category: this._classify(txn),
        }));
    },

    _classify(txn) {
        // If SparkReceipt already provided a category, try to map it
        if (txn.category) {
            const mapped = this._mapExistingCategory(txn.category);
            if (mapped) return mapped;
        }

        const searchText = `${txn.vendor} ${txn.description}`.toLowerCase();

        // Income heuristic: positive amounts
        if (txn.amount > 0) {
            for (const kw of this.KEYWORDS['Income']) {
                if (searchText.includes(kw)) return 'Income';
            }
            // Large positive amounts are likely income
            if (txn.amount > 500) return 'Income';
        }

        // Keyword matching for expenses
        for (const [category, keywords] of Object.entries(this.KEYWORDS)) {
            if (category === 'Income') continue;
            for (const kw of keywords) {
                if (searchText.includes(kw)) return category;
            }
        }

        return 'Uncategorized';
    },

    _mapExistingCategory(cat) {
        const lower = cat.toLowerCase();
        for (const stdCat of this.CATEGORIES) {
            if (lower === stdCat.toLowerCase()) return stdCat;
            if (lower.includes(stdCat.toLowerCase().split('/')[0].split('&')[0].trim())) return stdCat;
        }
        const catMap = {
            'food': 'Food & Dining', 'dining': 'Food & Dining', 'restaurant': 'Food & Dining', 'groceries': 'Food & Dining',
            'travel': 'Transportation', 'transport': 'Transportation', 'auto': 'Transportation', 'gas': 'Transportation',
            'bills': 'Utilities', 'utility': 'Utilities',
            'health': 'Healthcare', 'medical': 'Healthcare',
            'fun': 'Entertainment', 'leisure': 'Entertainment',
            'home': 'Housing', 'rent': 'Housing', 'mortgage': 'Housing',
            'personal': 'Shopping', 'retail': 'Shopping',
            'transfer': 'Transfers/Fees', 'fee': 'Transfers/Fees', 'bank': 'Transfers/Fees',
            'income': 'Income', 'salary': 'Income', 'paycheck': 'Income',
        };
        for (const [key, val] of Object.entries(catMap)) {
            if (lower.includes(key)) return val;
        }
        return null;
    },

    getColor(category) {
        return this.CATEGORY_COLORS[category] || this.CATEGORY_COLORS['Uncategorized'];
    },

    getIcon(category) {
        return this.CATEGORY_ICONS[category] || '📋';
    }
};
