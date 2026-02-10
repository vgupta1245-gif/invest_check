/**
 * Meeting View Component
 * Displays detailed meeting notes, transcripts, and financial context
 */
const MeetingView = {
    init() {
        this.render();
    },

    render() {
        const container = document.getElementById('meetingViewContent');
        if (!container) return;

        const data = MeetingData; // From src/data/meetingData.js

        container.innerHTML = `
            <div class="meeting-header">
                <div>
                    <h1 class="view-title">${data.title}</h1>
                    <div class="meeting-meta">
                        <span>${data.date} • ${data.time}</span>
                        <span class="meta-dot">•</span>
                        <span>Duration: ${data.duration}</span>
                    </div>
                </div>
                <div class="participants">
                    ${data.participants.map(p => `
                        <div class="avatar" style="background: ${p.avatarColor}" title="${p.name} (${p.role})">
                            ${p.initials}
                        </div>
                    `).join('')}
                    <button class="btn btn-outline btn-sm" style="margin-left: 1rem">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                        Export
                    </button>
                </div>
            </div>

            <div class="meeting-grid">
                <!-- Left Column: Insights -->
                <div class="meeting-col-main">
                    <div class="card insight-card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-indigo)"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                AI Insight Summary
                            </h3>
                            <span class="badge badge-success">${data.sentiment}</span>
                        </div>
                        <p class="insight-text">${data.summary}</p>
                        
                        <h4 class="section-subtitle" style="margin-top: 1.5rem">Action Items</h4>
                        <div class="action-list">
                            ${data.actionItems.map(item => `
                                <label class="action-item">
                                    <input type="checkbox" ${item.status === 'completed' ? 'checked' : ''}>
                                    <span class="action-text">${item.text}</span>
                                    <span class="action-owner">${item.owner}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="card transcript-card" style="margin-top: 1.5rem">
                        <div class="card-header">
                            <h3 class="card-title">Transcript</h3>
                            <div class="search-box">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input type="text" placeholder="Search..." onkeyup="MeetingView.filterTranscript(this.value)">
                            </div>
                        </div>
                        
                        <!-- Audio Player Stub -->
                        <div class="audio-stub">
                            <button class="play-btn">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                            </button>
                            <div class="waveform-viz"></div>
                            <span class="time-display">00:00 / ${data.duration}</span>
                        </div>

                        <div class="transcript-list" id="transcriptList">
                            ${data.transcript.map(entry => `
                                <div class="transcript-entry">
                                    <div class="t-meta">
                                        <span class="t-time">${entry.time}</span>
                                        <span class="t-speaker speaker-${entry.speaker.toLowerCase()}">${entry.speaker}</span>
                                    </div>
                                    <p class="t-text">${entry.text}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Right Column: Context -->
                <div class="meeting-col-side">
                    <div class="card context-card">
                        <div class="card-header">
                            <h3 class="card-title">Mentioned Assets</h3>
                        </div>
                        <div class="asset-list">
                            ${data.financialContext.assets.map(asset => `
                                <div class="asset-item">
                                    <div class="asset-info">
                                        <span class="asset-symbol">${asset.symbol}</span>
                                        <span class="asset-name">${asset.name}</span>
                                    </div>
                                    <span class="asset-change ${asset.trend === 'up' ? 'text-green' : 'text-red'}">
                                        ${asset.change}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="card context-card" style="margin-top: 1rem">
                        <div class="card-header">
                            <h3 class="card-title">Key Concepts</h3>
                        </div>
                        <div class="concept-list">
                            ${data.financialContext.concepts.map(concept => `
                                <div class="concept-item">
                                    <span class="concept-term">${concept.term}</span>
                                    <p class="concept-def">${concept.definition}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    filterTranscript(query) {
        const text = query.toLowerCase();
        const entries = document.querySelectorAll('.transcript-entry');
        entries.forEach(entry => {
            const content = entry.textContent.toLowerCase();
            entry.style.display = content.includes(text) ? 'flex' : 'none';
        });
    }
};
