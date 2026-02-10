/**
 * Login Component - Handles authentication flow
 */
const Login = {
    init() {
        const form = document.getElementById('loginForm');
        form.addEventListener('submit', this.handleLogin.bind(this));

        // Check for existing session
        if (localStorage.getItem('spark_session')) {
            this.showApp();
        }
    },

    handleLogin(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const btn = document.getElementById('loginBtn');
        const originalText = btn.innerHTML;

        // Simulate network request
        btn.innerHTML = 'Signing in...';
        btn.disabled = true;

        setTimeout(() => {
            if (email && password) {
                this.success(btn);
            } else {
                alert('Please enter valid credentials');
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }, 800);
    },

    success(btn) {
        btn.innerHTML = `Success <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        btn.style.background = 'var(--accent-emerald)';

        // Save session
        localStorage.setItem('spark_session', 'true');

        setTimeout(() => {
            this.showApp();
        }, 600);
    },

    showApp() {
        document.getElementById('loginView').classList.remove('active');
        document.getElementById('uploadView').classList.add('active');

        // Show navigation
        document.getElementById('mainNav').style.display = 'flex';

        // Reset login button if returning
        const btn = document.getElementById('loginBtn');
        if (btn) {
            btn.disabled = false;
            btn.style.background = '';
            btn.innerHTML = `Sign In <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
        }
    },

    logout() {
        localStorage.removeItem('spark_session');
        window.location.reload();
    }
};
