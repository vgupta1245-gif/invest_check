/**
 * PDF Parser for bank statements and SparkReceipt PDF exports
 * Uses PDF.js to extract text, then parses tabular transaction data
 */
const PDFParser = {
    /**
     * Parse PDF file into normalized transactions
     * @param {ArrayBuffer} buffer - PDF file content
     * @returns {Promise<Array>} Normalized transaction objects
     */
    async parse(buffer) {
        // Load PDF.js from CDN
        const pdfjsLib = window['pdfjs-dist/build/pdf'] || window.pdfjsLib;

        if (!pdfjsLib) {
            // Fallback: try loading from global
            throw new Error('PDF.js library not loaded. Please ensure the PDF.js script is included.');
        }

        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        const allText = [];

        // Extract text from all pages
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = this._extractStructuredText(textContent);
            allText.push(...pageText);
        }

        // Parse transactions from extracted text
        return this._parseTransactions(allText);
    },

    /**
     * Extract structured text with position data for visual reading
     * Groups text items by their Y position (lines)
     */
    _extractStructuredText(textContent) {
        const items = textContent.items;
        if (!items || items.length === 0) return [];

        // Group by Y position (same line)
        const lines = {};
        const tolerance = 3; // pixels tolerance for same line

        items.forEach(item => {
            const y = Math.round(item.transform[5] / tolerance) * tolerance;
            if (!lines[y]) lines[y] = [];
            lines[y].push({
                text: item.str,
                x: item.transform[4],
                width: item.width,
            });
        });

        // Sort lines by Y (top to bottom = descending Y)
        const sortedLines = Object.entries(lines)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([y, items]) => {
                // Sort items within line by X position (left to right)
                items.sort((a, b) => a.x - b.x);
                return {
                    y: Number(y),
                    text: items.map(i => i.text).join(' ').trim(),
                    items: items,
                };
            });

        return sortedLines;
    },

    /**
     * Parse transaction data from extracted text lines
     * Looks for patterns: date, description/vendor, amount
     */
    _parseTransactions(lines) {
        const transactions = [];
        const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
        const amountPattern = /[\$]?\s*[\-]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;

        let currentInstitution = 'Unknown';

        // Try to detect institution from header lines
        const headerKeywords = ['bank', 'credit union', 'financial', 'capital', 'chase', 'wells fargo', 'citi', 'amex', 'american express', 'discover', 'usaa', 'navy federal'];
        for (const line of lines.slice(0, 10)) {
            const lower = line.text.toLowerCase();
            for (const kw of headerKeywords) {
                if (lower.includes(kw)) {
                    currentInstitution = line.text.trim();
                    break;
                }
            }
        }

        for (const line of lines) {
            const text = line.text;
            if (!text || text.length < 5) continue;

            const dateMatch = text.match(datePattern);
            if (!dateMatch) continue;

            // Extract amounts from the line
            const amounts = [];
            let amountMatch;
            const amountRegex = /[\$]?\s*[\-\(]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2})\)?/g;
            while ((amountMatch = amountRegex.exec(text)) !== null) {
                const amountStr = amountMatch[0].replace(/[\$\s,]/g, '');
                let val;
                if (amountStr.startsWith('(') && amountStr.endsWith(')')) {
                    val = -parseFloat(amountStr.slice(1, -1));
                } else {
                    val = parseFloat(amountStr);
                }
                if (!isNaN(val) && Math.abs(val) > 0.01 && Math.abs(val) < 1000000) {
                    amounts.push(val);
                }
            }

            if (amounts.length === 0) continue;

            // The vendor/description is the text between the date and the first amount
            const dateEnd = dateMatch.index + dateMatch[0].length;
            const firstAmountMatch = text.match(/[\$]?\s*[\-\(]?\s*\d{1,3}(?:,\d{3})*\.\d{2}/);
            const amountStart = firstAmountMatch ? firstAmountMatch.index : text.length;

            let vendor = text.substring(dateEnd, amountStart).trim();
            // Clean up vendor - remove common prefixes
            vendor = vendor.replace(/^[\s\-\*#]+/, '').trim();
            if (!vendor) vendor = 'Unknown Transaction';

            const dateStr = dateMatch[1];
            const parsedDate = this._parseDate(dateStr);

            // Use the last amount (usually the transaction total)
            const amount = amounts[amounts.length - 1];

            transactions.push({
                date: parsedDate,
                dateStr: parsedDate ? parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : dateStr,
                vendor: vendor.substring(0, 60),
                amount: amount,
                category: '',
                currency: 'USD',
                description: vendor,
                institution: currentInstitution,
                raw: { text: text },
            });
        }

        return transactions;
    },

    _parseDate(str) {
        if (!str) return null;
        const parts = str.split(/[\/\-\.]/);
        if (parts.length === 3) {
            const [a, b, c] = parts.map(Number);
            let year = c < 100 ? 2000 + c : c;
            if (a <= 12 && b <= 31) {
                const d = new Date(year, a - 1, b);
                if (!isNaN(d.getTime())) return d;
            }
        }
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
    }
};
