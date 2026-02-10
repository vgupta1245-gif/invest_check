/**
 * ShareManager - Handles secure data sharing with 2FA
 */
const ShareManager = {
    init() {
        this.injectShareButton();
        this.renderModal();
    },

    injectShareButton() {
        const header = document.querySelector('#dashboardView .dashboard-header');
        if (!header || document.getElementById('shareBtn')) return;

        const btn = document.createElement('button');
        btn.id = 'shareBtn';
        btn.className = 'btn btn-primary';
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            Share Securely
        `;
        btn.style.marginLeft = 'auto';
        btn.onclick = () => this.openModal();

        // Insert after the Import button (Import -> Share)
        const importBtn = document.getElementById('importNewBtn');
        if (importBtn && importBtn.parentNode) {
            importBtn.parentNode.insertBefore(btn, importBtn.nextSibling);
        } else {
            header.appendChild(btn);
        }
    },

    renderModal() {
        if (document.getElementById('shareModal')) return;

        const modal = document.createElement('div');
        modal.id = 'shareModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal share-modal">
                <div class="share-step" id="shareStep1">
                    <h2 class="modal-title">Secure Data Sharing</h2>
                    <p class="modal-subtitle">Share your financial dashboard with an authorized user.</p>
                    
                    <div class="form-group">
                        <label class="form-label">Recipient Email</label>
                        <input type="email" class="form-input" id="shareEmail" placeholder="advisor@example.com">
                    </div>
                    
                    <div class="share-info">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        <span>Protected by End-to-End Encryption</span>
                    </div>

                    <div class="modal-actions">
                        <button class="btn btn-ghost" onclick="ShareManager.close()">Cancel</button>
                        <button class="btn btn-primary" onclick="ShareManager.goToMethodSelection()">Next</button>
                    </div>
                </div>

                <div class="share-step hidden" id="shareStepMethod">
                    <h2 class="modal-title">Select Authentication Method</h2>
                    <p class="modal-subtitle">Choose how you want to receive your 2FA code.</p>
                    
                    <div class="method-selection">
                        <div class="method-card" onclick="ShareManager.selectMethod('email')">
                            <div class="method-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            </div>
                            <div class="method-details">
                                <span class="method-name">Email Code</span>
                                <span class="method-contact">d***@sparkreceipt.com</span>
                            </div>
                            <div class="method-arrow">→</div>
                        </div>

                        <div class="method-card" onclick="ShareManager.selectMethod('sms')">
                            <div class="method-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 17l6-6v-3l18-18M4 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"></path><path d="M12 19h.01"></path><path d="M21 21v-4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"></path></svg> 
                                <!-- Simpler Phone Icon -->
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                            </div>
                            <div class="method-details">
                                <span class="method-name">Text Message (SMS)</span>
                                <span class="method-contact">(***) ***-8901</span>
                            </div>
                            <div class="method-arrow">→</div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button class="btn btn-ghost" onclick="ShareManager.backToEmail()">Back</button>
                    </div>
                </div>

                <div class="share-step hidden" id="shareStep2">
                    <h2 class="modal-title">Verify Identity</h2>
                    <p class="modal-subtitle">For security, please enter the 2FA code sent to your device.</p>
                    
                    <div class="code-input-wrapper">
                        <input type="text" class="code-input" maxlength="1">
                        <input type="text" class="code-input" maxlength="1">
                        <input type="text" class="code-input" maxlength="1">
                        <input type="text" class="code-input" maxlength="1">
                        <input type="text" class="code-input" maxlength="1">
                        <input type="text" class="code-input" maxlength="1">
                    </div>

                    <p class="resend-link">Resend Code</p>

                    <div class="modal-actions">
                        <button class="btn btn-ghost" onclick="ShareManager.prevStep()">Back</button>
                        <button class="btn btn-primary" onclick="ShareManager.verifyCode()">Verify & Share</button>
                    </div>
                </div>

                <div class="share-step hidden" id="shareStep3">
                    <div class="success-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <h2 class="modal-title">Secure Link Generated</h2>
                    <p class="modal-subtitle">This link will expire in 24 hours. The recipient will also need 2FA to access it.</p>
                    
                    <div class="link-box">
                        <span id="shareLink">https://sparkreceipt.com/s/7x9d-2k3m-8p4n</span>
                        <button class="btn-icon" onclick="ShareManager.copyLink()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        </button>
                    </div>

                    <div class="modal-actions">
                        <button class="btn btn-primary full-width" onclick="ShareManager.close()">Done</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.setupCodeInputs();
    },

    setupCodeInputs() {
        const inputs = document.querySelectorAll('.code-input');
        inputs.forEach((input, i) => {
            input.addEventListener('input', (e) => {
                if (e.target.value.length === 1 && i < inputs.length - 1) {
                    inputs[i + 1].focus();
                }
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && i > 0) {
                    inputs[i - 1].focus();
                }
            });
        });
    },

    openModal() {
        document.getElementById('shareModal').classList.add('active');
        this.reset();
    },

    close() {
        document.getElementById('shareModal').classList.remove('active');
    },

    reset() {
        document.getElementById('shareStep1').classList.remove('hidden');
        document.getElementById('shareStepMethod').classList.add('hidden');
        document.getElementById('shareStep2').classList.add('hidden');
        document.getElementById('shareStep3').classList.add('hidden');
        document.getElementById('shareEmail').value = '';
        document.querySelectorAll('.code-input').forEach(i => i.value = '');
    },

    goToMethodSelection() {
        const email = document.getElementById('shareEmail').value;
        if (!email.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }
        document.getElementById('shareStep1').classList.add('hidden');
        document.getElementById('shareStepMethod').classList.remove('hidden');
    },

    selectMethod(method) {
        document.getElementById('shareStepMethod').classList.add('hidden');
        document.getElementById('shareStep2').classList.remove('hidden');

        // Update subtitle based on method
        const subtitle = document.querySelector('#shareStep2 .modal-subtitle');
        if (method === 'sms') {
            subtitle.textContent = "Enter the code sent to (***) ***-8901";
        } else {
            subtitle.textContent = "Enter the code sent to d***@sparkreceipt.com";
        }

        document.querySelector('.code-input').focus();
    },

    backToEmail() {
        document.getElementById('shareStepMethod').classList.add('hidden');
        document.getElementById('shareStep1').classList.remove('hidden');
    },

    prevStep() {
        document.getElementById('shareStep2').classList.add('hidden');
        document.getElementById('shareStepMethod').classList.remove('hidden');
    },

    verifyCode() {
        const inputs = Array.from(document.querySelectorAll('.code-input'));
        const code = inputs.map(i => i.value).join('');
        if (code.length < 6) {
            alert('Please enter the full 6-digit code');
            return;
        }

        // Simulate verification
        const btn = document.querySelector('#shareStep2 .btn-primary');
        const origText = btn.innerText;
        btn.innerText = 'Verifying...';

        setTimeout(() => {
            btn.innerText = origText;
            document.getElementById('shareStep2').classList.add('hidden');
            document.getElementById('shareStep3').classList.remove('hidden');
        }, 1200);
    },

    copyLink() {
        const link = document.getElementById('shareLink').innerText;
        navigator.clipboard.writeText(link);
        alert('Link copied to clipboard!');
    }
};
