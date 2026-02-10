/**
 * File Parser - routes files to the appropriate parser based on type
 */
const FileParser = {
    async parse(file) {
        const ext = file.name.split('.').pop().toLowerCase();
        if (ext === 'csv') {
            const text = await this._readText(file);
            return CSVParser.parse(text);
        } else if (ext === 'pdf') {
            const buf = await this._readBuffer(file);
            return PDFParser.parse(buf);
        }
        throw new Error(`Unsupported file type: .${ext}`);
    },

    parseCSVText(text) {
        return CSVParser.parse(text);
    },

    _readText(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.onerror = () => reject(new Error('Failed to read file'));
            r.readAsText(file);
        });
    },

    _readBuffer(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.onerror = () => reject(new Error('Failed to read file'));
            r.readAsArrayBuffer(file);
        });
    }
};
