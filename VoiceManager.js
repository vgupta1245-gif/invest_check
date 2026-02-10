/**
 * Voice Manager - Handles Text-to-Speech using Eleven Labs API
 */
const VoiceManager = {
    apiKey: localStorage.getItem('eleven_api_key') || 'sk_ddad928b1cf0c140d89cf8de45be791369ed7c061d8c74f2',
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel (default)
    isPlaying: false,
    audio: null,

    init() {
        setTimeout(() => this.addVoiceButton(), 100);
    },

    addVoiceButton() {
        const btnContainer = document.querySelector('.dashboard-header');
        if (!btnContainer || document.getElementById('voiceBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'voiceBtn';
        btn.className = 'btn btn-outline btn-sm';
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
            </svg>
            Play Summary
        `;
        btn.style.marginRight = '8px';
        btn.onclick = () => this.handlePlayClick();

        // Check for imports to place correctly
        const importBtn = document.getElementById('importNewBtn');
        const filterBtn = document.getElementById('filterBtn');

        // Place after Filter if exists, else after Import, else append
        if (filterBtn && filterBtn.parentNode) {
            filterBtn.parentNode.insertBefore(btn, filterBtn.nextSibling);
        } else if (importBtn && importBtn.parentNode) {
            importBtn.parentNode.insertBefore(btn, importBtn.nextSibling);
        } else {
            btnContainer.appendChild(btn);
        }
    },

    handlePlayClick() {
        if (this.isPlaying) {
            this.stop();
            return;
        }

        if (!this.apiKey) {
            this.showSettings();
            return;
        }

        this.playSummary();
    },

    showSettings() {
        // Remove existing if open
        const existing = document.getElementById('voiceSettingsModal');
        if (existing) existing.remove();

        const div = document.createElement('div');
        div.className = 'modal-overlay';
        div.id = 'voiceSettingsModal';
        div.innerHTML = `
            <div class="modal" style="max-width: 400px">
                <div class="modal-header">
                    <h2 class="view-title" style="font-size: 1.25rem">Voice Settings</h2>
                    <button class="modal-close" onclick="document.getElementById('voiceSettingsModal').remove()">✕</button>
                </div>
                
                <div style="margin-top: 1rem">
                    <label style="display: block; margin-bottom: 0.5rem; font-weight: 500">Eleven Labs API Key</label>
                    <input type="password" id="elevenApiKey" class="input input-bordered" style="width: 100%" placeholder="sk_..." value="${this.apiKey}">
                    <p style="font-size: 0.8rem; color: #666; margin-top: 0.5rem">
                        Your key is stored locally in your browser.
                    </p>
                </div>

                <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem">
                    <button class="btn btn-primary" onclick="VoiceManager.saveSettings()">Save Key</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);
        div.classList.add('active'); // CSS requires 'active' class for visibility? check modal logic

        // Ensure modal styles work (reusing app modal styles)
    },

    saveSettings() {
        const input = document.getElementById('elevenApiKey');
        if (input) {
            this.apiKey = input.value.trim();
            localStorage.setItem('eleven_api_key', this.apiKey);
            document.getElementById('voiceSettingsModal').remove();
            // Auto play if just saved? Maybe implies user wants to likely play.
            // But let's require click again to be safe.
        }
    },

    generateSummary() {
        // Get data from global state
        const analysis = window.appState ? window.appState.analysis : null;
        if (!analysis) return "No financial data available to summarize.";

        // Gather metrics
        const income = analysis.totalIncome || 0;
        const spend = analysis.totalSpend || 0;
        const net = income - spend;
        const topCat = analysis.categoryBreakdown && analysis.categoryBreakdown.length > 0
            ? analysis.categoryBreakdown[0]
            : { category: 'None', total: 0 };

        // Format Currency
        const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

        // Build Script
        const intro = `Here is your financial summary.`;
        const overview = `This period, your total income was ${fmt(income)}, and your total spending was ${fmt(spend)}.`;
        const netFlow = `This results in a net flow of ${fmt(net)}.`;
        const topSpending = `Your highest spending category was ${topCat.category}, with a total of ${fmt(topCat.total)}.`;

        let closing = "";
        if (net > 0) closing = "You are cash flow positive. Great job!";
        else if (net < 0) closing = "You spent more than you earned this period.";

        return `${intro} ${overview} ${netFlow} ${topSpending} ${closing}`;
    },

    async playSummary() {
        const text = this.generateSummary();
        const btn = document.getElementById('voiceBtn');

        try {
            if (btn) btn.innerHTML = 'Generating...';

            const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': this.apiKey
                },
                body: JSON.stringify({
                    text: text,
                    model_id: "eleven_flash_v2_5",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5
                    }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.detail?.message || 'API request failed');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            if (this.audio) this.audio.pause();

            this.audio = new Audio(url);
            this.audio.onended = () => this.stop();

            this.audio.play();
            this.isPlaying = true;
            this.updateButtonState(true);

        } catch (err) {
            console.error('Voice Error:', err);
            alert('Error generating audio: ' + err.message);
            this.stop();
        }
    },

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }
        this.isPlaying = false;
        this.updateButtonState(false);
    },

    updateButtonState(playing) {
        const btn = document.getElementById('voiceBtn');
        if (!btn) return;

        if (playing) {
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-pulse">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
                Stop
            `;
            btn.classList.add('btn-active');
        } else {
            btn.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
                Play Summary
            `;
            btn.classList.remove('btn-active');
        }
    }
};
