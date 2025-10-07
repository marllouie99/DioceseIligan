/**
 * Clock Synchronization Utility
 * Helps detect and handle clock sync issues for OAuth
 */

class ClockSyncChecker {
    constructor() {
        this.serverTimeOffset = 0;
        this.lastSyncCheck = 0;
        this.syncCheckInterval = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Check if system clock is synchronized with server
     */
    async checkClockSync() {
        try {
            const startTime = Date.now();
            const response = await fetch('/api/server-time/', {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const endTime = Date.now();
                const networkDelay = (endTime - startTime) / 2;
                const serverTime = new Date(data.server_time).getTime();
                const clientTime = endTime - networkDelay;
                
                this.serverTimeOffset = serverTime - clientTime;
                this.lastSyncCheck = Date.now();
                
                // If offset is more than 5 seconds, show warning
                if (Math.abs(this.serverTimeOffset) > 5000) {
                    this.showClockSyncWarning();
                    return false;
                }
                return true;
            }
        } catch (error) {
            console.warn('Clock sync check failed:', error);
        }
        return true; // Assume OK if check fails
    }

    /**
     * Show clock synchronization warning
     */
    showClockSyncWarning() {
        const warning = document.createElement('div');
        warning.className = 'clock-sync-warning';
        warning.innerHTML = `
            <div class="alert alert-warning" style="position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 400px;">
                <strong>Clock Sync Issue Detected</strong><br>
                Your system clock may be out of sync. This can cause login issues.<br>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn-sm btn-secondary mt-2">Dismiss</button>
                <button onclick="window.location.reload()" class="btn btn-sm btn-primary mt-2 ml-2">Refresh Page</button>
            </div>
        `;
        document.body.appendChild(warning);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (warning.parentElement) {
                warning.remove();
            }
        }, 10000);
    }

    /**
     * Get adjusted time accounting for server offset
     */
    getAdjustedTime() {
        return new Date(Date.now() + this.serverTimeOffset);
    }

    /**
     * Initialize clock sync checking
     */
    init() {
        // Check immediately
        this.checkClockSync();
        
        // Check periodically
        setInterval(() => {
            if (Date.now() - this.lastSyncCheck > this.syncCheckInterval) {
                this.checkClockSync();
            }
        }, this.syncCheckInterval);
        
        // Check before OAuth operations
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-google, [href*="google/login"]')) {
                this.checkClockSync();
            }
        });
    }
}

// Initialize clock sync checker
const clockSyncChecker = new ClockSyncChecker();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => clockSyncChecker.init());
} else {
    clockSyncChecker.init();
}

// Export for use in other modules
window.ClockSyncChecker = clockSyncChecker;
