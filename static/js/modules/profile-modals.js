/**
 * Profile Modals Module
 * @module ProfileModalsModule
 * @description Handles modal management for profile-related dialogs
 * @version 1.0.0
 */

class ProfileModalsModule {
  constructor() {
    this.isInitialized = false;
    this.modals = {};
    this.activeModal = null;
  }

  /**
   * Initialize modals functionality
   * @returns {boolean} Success status
   */
  init() {
    try {
      if (this.isInitialized) {
        return true;
      }

      this.getElements();
      this.bindEvents();
      this.isInitialized = true;
      return true;
    } catch (error) {
      window.Utils?.handleError(error, 'ProfileModalsModule Initialization');
      return false;
    }
  }

  /**
   * Get DOM elements
   * @private
   */
  getElements() {
    this.modals = {
      profileEdit: document.getElementById('profile-edit-modal'),
      passwordChange: null,
      deleteAccount: null,
      loginHistory: null,
      sessions: null
    };
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEvents() {
    // Global escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeActiveModal();
      }
    });
  }

  /**
   * Open profile edit modal
   */
  openProfileEditModal() {
    const modal = this.modals.profileEdit;
    if (!modal) return;

    this.activeModal = modal;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Reset form state
    this.resetProfileForm();
    
    // Add event listeners for closing modal
    modal.addEventListener('click', this.handleModalClick);
    document.addEventListener('keydown', this.handleModalKeydown);
    
    this.triggerEvent('modalOpened', { modalType: 'profileEdit' });
  }

  /**
   * Close profile edit modal
   */
  closeProfileEditModal() {
    const modal = this.modals.profileEdit;
    if (!modal) return;

    this.activeModal = null;
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Remove event listeners
    modal.removeEventListener('click', this.handleModalClick);
    document.removeEventListener('keydown', this.handleModalKeydown);
    
    this.triggerEvent('modalClosed', { modalType: 'profileEdit' });
  }

  /**
   * Open password change modal
   */
  openPasswordModal() {
    const modal = this.createPasswordModal();
    this.showModal(modal, 'passwordChange');
  }

  /**
   * Open delete account modal
   */
  openDeleteAccountModal() {
    const modal = this.createDeleteAccountModal();
    this.showModal(modal, 'deleteAccount');
  }

  /**
   * Open login history modal
   */
  openLoginHistoryModal() {
    const modal = this.createLoginHistoryModal();
    this.showModal(modal, 'loginHistory');
  }

  /**
   * Open sessions modal
   */
  openSessionsModal() {
    const modal = this.createSessionsModal();
    this.showModal(modal, 'sessions');
  }

  /**
   * Create password change modal
   * @returns {HTMLElement} Modal element
   * @private
   */
  createPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Change Password</h3>
          <button class="modal-close" onclick="window.profileModals.closeModal(this)">&times;</button>
        </div>
        <div class="modal-body">
          <form id="password-form">
            <div class="form-group">
              <label for="current-password">Current Password</label>
              <input type="password" id="current-password" name="current_password" required>
            </div>
            <div class="form-group">
              <label for="new-password">New Password</label>
              <input type="password" id="new-password" name="new_password" required>
            </div>
            <div class="form-group">
              <label for="confirm-password">Confirm New Password</label>
              <input type="password" id="confirm-password" name="confirm_password" required>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="window.profileModals.closeModal(this)">Cancel</button>
              <button type="submit" class="btn btn-primary">Update Password</button>
            </div>
          </form>
        </div>
      </div>
    `;
    return modal;
  }

  /**
   * Create delete account modal
   * @returns {HTMLElement} Modal element
   * @private
   */
  createDeleteAccountModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content danger">
        <div class="modal-header">
          <h3>Delete Account</h3>
          <button class="modal-close" onclick="window.profileModals.closeModal(this)">&times;</button>
        </div>
        <div class="modal-body">
          <div class="warning-message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h4>This action cannot be undone</h4>
            <p>This will permanently delete your account and remove all data from our servers. You will lose access to all your church activities, donations, and community connections.</p>
          </div>
          <form id="delete-account-form">
            <div class="form-group">
              <label for="confirm-delete">Type "DELETE" to confirm</label>
              <input type="text" id="confirm-delete" name="confirm_delete" placeholder="Type DELETE here" required>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="window.profileModals.closeModal(this)">Cancel</button>
              <button type="submit" class="btn btn-danger">Delete Account</button>
            </div>
          </form>
        </div>
      </div>
    `;
    return modal;
  }

  /**
   * Create login history modal
   * @returns {HTMLElement} Modal element
   * @private
   */
  createLoginHistoryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Login History</h3>
          <button class="modal-close" onclick="window.profileModals.closeModal(this)">&times;</button>
        </div>
        <div class="modal-body">
          <div class="login-history">
            <div class="login-item">
              <div class="login-info">
                <div class="login-device">Chrome on Windows</div>
                <div class="login-location">Iligan City, Philippines</div>
              </div>
              <div class="login-time">2 hours ago</div>
            </div>
            <div class="login-item">
              <div class="login-info">
                <div class="login-device">Safari on iPhone</div>
                <div class="login-location">Iligan City, Philippines</div>
              </div>
              <div class="login-time">1 day ago</div>
            </div>
            <div class="login-item">
              <div class="login-info">
                <div class="login-device">Chrome on Windows</div>
                <div class="login-location">Iligan City, Philippines</div>
              </div>
              <div class="login-time">3 days ago</div>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-primary" onclick="window.profileModals.closeModal(this)">Close</button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  /**
   * Create sessions modal
   * @returns {HTMLElement} Modal element
   * @private
   */
  createSessionsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Active Sessions</h3>
          <button class="modal-close" onclick="window.profileModals.closeModal(this)">&times;</button>
        </div>
        <div class="modal-body">
          <div class="sessions-list">
            <div class="session-item current">
              <div class="session-info">
                <div class="session-device">Chrome on Windows</div>
                <div class="session-location">Iligan City, Philippines</div>
                <div class="session-time">Current session</div>
              </div>
              <span class="session-status">Active</span>
            </div>
            <div class="session-item">
              <div class="session-info">
                <div class="session-device">Safari on iPhone</div>
                <div class="session-location">Iligan City, Philippines</div>
                <div class="session-time">Last active 1 day ago</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="window.profileModals.revokeSession(this)">Revoke</button>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-danger" onclick="window.profileModals.revokeAllSessions()">Revoke All Other Sessions</button>
            <button type="button" class="btn btn-secondary" onclick="window.profileModals.closeModal(this)">Close</button>
          </div>
        </div>
      </div>
    `;
    return modal;
  }

  /**
   * Show modal
   * @param {HTMLElement} modal - Modal element
   * @param {string} modalType - Modal type
   * @private
   */
  showModal(modal, modalType) {
    this.activeModal = modal;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    // Add click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal(modal.querySelector('.modal-close'));
      }
    });
    
    this.triggerEvent('modalOpened', { modalType });
  }

  /**
   * Close modal
   * @param {HTMLElement} button - Close button element
   */
  closeModal(button) {
    const modal = button.closest('.modal-overlay');
    if (modal) {
      modal.remove();
      document.body.style.overflow = 'auto';
      this.activeModal = null;
      this.triggerEvent('modalClosed', { modalType: 'dynamic' });
    }
  }

  /**
   * Close active modal
   * @private
   */
  closeActiveModal() {
    if (this.activeModal) {
      if (this.activeModal.id === 'profile-edit-modal') {
        this.closeProfileEditModal();
      } else {
        this.closeModal(this.activeModal.querySelector('.modal-close'));
      }
    }
  }

  /**
   * Handle modal click
   * @param {Event} e - Click event
   * @private
   */
  handleModalClick = (e) => {
    if (e.target === this.activeModal) {
      this.closeProfileEditModal();
    }
  };

  /**
   * Handle modal keydown
   * @param {Event} e - Keydown event
   * @private
   */
  handleModalKeydown = (e) => {
    if (e.key === 'Escape') {
      this.closeProfileEditModal();
    }
  };

  /**
   * Reset profile form
   * @private
   */
  resetProfileForm() {
    const form = this.modals.profileEdit?.querySelector('#profile-edit-form');
    if (!form) return;

    const submitBtn = form.querySelector('#profile-save-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');
    
    if (submitBtn) {
      submitBtn.disabled = false;
      btnText.textContent = 'Save Changes';
      btnSpinner.style.display = 'none';
      submitBtn.style.opacity = '1';
    }
  }

  /**
   * Revoke session
   * @param {HTMLElement} button - Revoke button
   */
  revokeSession(button) {
    const sessionItem = button.closest('.session-item');
    sessionItem.remove();
    this.showNotification('Session revoked successfully', 'success');
  }

  /**
   * Revoke all sessions
   */
  revokeAllSessions() {
    const sessions = document.querySelectorAll('.session-item:not(.current)');
    sessions.forEach(session => session.remove());
    this.showNotification('All other sessions revoked successfully', 'success');
  }

  /**
   * Download user data
   */
  downloadUserData() {
    const link = document.createElement('a');
    link.href = '#';
    link.download = 'user-data.json';
    link.click();
    
    this.showNotification('Data download started. You will receive an email when ready.', 'success');
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type
   * @private
   */
  showNotification(message, type) {
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      console.log(`${type}: ${message}`);
    }
  }

  /**
   * Trigger custom event
   * @param {string} eventName - Event name
   * @param {Object} data - Event data
   * @private
   */
  triggerEvent(eventName, data = {}) {
    const event = new CustomEvent(`profile:${eventName}`, {
      detail: { ...data, module: this }
    });
    document.dispatchEvent(event);
  }

  /**
   * Cleanup modals module
   */
  destroy() {
    this.modals = {};
    this.activeModal = null;
    this.isInitialized = false;
  }
}

// Export for use in main application
window.ProfileModalsModule = ProfileModalsModule;


