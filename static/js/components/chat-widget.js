/**
 * Floating Chat Widget
 * Handles real-time messaging between users and churches
 */

class ChatWidget {
  constructor() {
    this.isOpen = false;
    this.isMinimized = true;
    this.activeConversationId = null;
    this.conversations = [];
    this.allConversations = []; // Store all conversations for filtering
    this.messages = [];
    this.unreadCount = 0;
    this.typingTimeout = null;
    this.messagePollingInterval = null;
    this.typingPollingInterval = null;
    this.selectedFile = null;
    this.selectedChurchFilter = 'all';
    
    this.initElements();
    this.initEventListeners();
    this.loadConversations();
    this.startMessagePolling();
  }

  initElements() {
    // Main elements
    this.widget = document.getElementById('chat-widget');
    this.toggleBtn = document.getElementById('chat-widget-toggle');
    this.window = document.getElementById('chat-widget-window');
    this.unreadBadge = document.getElementById('chat-unread-badge');
    
    // Header elements
    this.churchAvatar = document.getElementById('chat-church-avatar');
    this.churchName = document.getElementById('chat-church-name');
    this.chatStatus = document.getElementById('chat-status');
    this.minimizeBtn = document.getElementById('chat-minimize-btn');
    this.closeBtn = document.getElementById('chat-close-btn');
    
    // Conversations list
    this.conversationsList = document.getElementById('chat-conversations-list');
    this.conversationsScroll = document.getElementById('chat-conversations-scroll');
    this.churchFilter = document.getElementById('chat-church-filter');
    this.filterContainer = document.getElementById('chat-filter-container');
    
    // Active chat view
    this.activeView = document.getElementById('chat-active-view');
    this.backBtn = document.getElementById('chat-back-btn');
    this.messagesContainer = document.getElementById('chat-messages');
    this.messageForm = document.getElementById('chat-message-form');
    this.messageInput = document.getElementById('chat-message-input');
    this.sendBtn = document.getElementById('chat-send-btn');
    this.typingIndicator = document.getElementById('chat-typing-indicator');
    
    // File upload elements
    this.fileInput = document.getElementById('chat-file-input');
    this.attachBtn = document.getElementById('chat-attach-btn');
    this.filePreview = document.getElementById('chat-file-preview');
    this.filePreviewImage = document.getElementById('chat-file-preview-image');
    this.filePreviewDoc = document.getElementById('chat-file-preview-doc');
    this.filePreviewName = document.getElementById('chat-file-preview-name');
    this.fileRemoveBtn = document.getElementById('chat-file-remove-btn');
    
    // Loading
    this.loadingEl = document.getElementById('chat-loading');
  }

  initEventListeners() {
    // Toggle widget
    this.toggleBtn.addEventListener('click', () => this.toggleWidget());
    
    // Header actions
    this.minimizeBtn.addEventListener('click', () => this.minimizeWidget());
    this.closeBtn.addEventListener('click', () => this.closeWidget());
    
    // Navigation
    this.backBtn.addEventListener('click', () => this.showConversationsList());
    
    // Church filter
    if (this.churchFilter) {
      this.churchFilter.addEventListener('change', (e) => this.filterByChurch(e.target.value));
    }
    
    // Message form
    this.messageForm.addEventListener('submit', (e) => this.handleSendMessage(e));
    this.messageInput.addEventListener('input', () => this.handleMessageInput());
    this.messageInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Auto-resize textarea
    this.messageInput.addEventListener('input', () => this.autoResizeTextarea());
    
    // File upload
    this.attachBtn.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    this.fileRemoveBtn.addEventListener('click', () => this.removeFile());
    
    // Click outside to close (optional)
    document.addEventListener('click', (e) => this.handleClickOutside(e));
  }

  toggleWidget() {
    if (this.isMinimized) {
      this.openWidget();
    } else {
      this.minimizeWidget();
    }
  }

  openWidget() {
    this.widget.style.display = 'block';
    this.window.style.display = 'flex';
    this.toggleBtn.style.display = 'none';
    this.isMinimized = false;
    this.isOpen = true;
    
    // Mark messages as read
    this.markConversationAsRead(this.activeConversationId);
  }

  minimizeWidget() {
    this.window.style.display = 'none';
    this.toggleBtn.style.display = 'flex';
    this.isMinimized = true;
  }

  closeWidget() {
    // Close button now just minimizes the widget instead of hiding it completely
    this.minimizeWidget();
    this.showConversationsList();
  }

  showConversationsList() {
    this.conversationsList.style.display = 'flex';
    this.activeView.style.display = 'none';
    this.activeConversationId = null;
    this.updateHeader();
    this.stopTypingPolling(); // Stop typing check when leaving chat
    this.hideTypingIndicator(); // Clear any visible typing indicator
  }

  showActiveChat(conversationId) {
    this.activeConversationId = conversationId;
    this.conversationsList.style.display = 'none';
    this.activeView.style.display = 'flex';
    this.loadMessages(conversationId);
    this.updateHeader();
    this.markConversationAsRead(conversationId);
    this.startTypingPolling(); // Start faster typing check
  }

  updateHeader() {
    if (this.activeConversationId) {
      const conversation = this.conversations.find(c => c.id === this.activeConversationId);
      if (conversation) {
        this.churchName.textContent = conversation.church_name;
        
        // Update avatar
        if (conversation.church_avatar) {
          this.churchAvatar.innerHTML = `<img src="${conversation.church_avatar}" alt="${conversation.church_name}">`;
        } else {
          this.churchAvatar.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          `;
        }
        
        // Update status (you can implement online/offline logic)
        this.chatStatus.textContent = 'Active';
        this.chatStatus.classList.add('online');
      }
    } else {
      this.churchName.textContent = 'Messages';
      this.chatStatus.textContent = '';
      this.churchAvatar.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      `;
    }
  }

  async loadConversations() {
    try {
      const response = await fetch('/app/api/conversations/', {
        headers: {
          'X-CSRFToken': this.getCsrfToken(),
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.allConversations = data.conversations || [];
        this.conversations = this.allConversations;
        this.populateChurchFilter();
        this.renderConversations();
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }

  populateChurchFilter() {
    // Check if user manages multiple churches
    const managedChurches = new Map();
    this.allConversations.forEach(conv => {
      if (conv.is_church_owner && conv.managed_church_name) {
        managedChurches.set(conv.church_id, conv.managed_church_name);
      }
    });

    // Show filter only if managing multiple churches
    if (managedChurches.size > 1 && this.churchFilter && this.filterContainer) {
      this.filterContainer.style.display = 'block';
      
      // Clear existing options except "All Churches"
      this.churchFilter.innerHTML = '<option value="all">All Churches</option>';
      
      // Add church options
      managedChurches.forEach((name, id) => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        this.churchFilter.appendChild(option);
      });
    } else if (this.filterContainer) {
      this.filterContainer.style.display = 'none';
    }
  }

  filterByChurch(churchId) {
    this.selectedChurchFilter = churchId;
    
    if (churchId === 'all') {
      this.conversations = this.allConversations;
    } else {
      this.conversations = this.allConversations.filter(conv => 
        conv.church_id == churchId
      );
    }
    
    this.renderConversations();
    this.updateUnreadCount();
  }

  renderConversations() {
    if (this.conversations.length === 0) {
      this.conversationsScroll.innerHTML = `
        <div class="chat-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>No conversations yet</p>
          <p class="text-muted">Start a conversation with a church</p>
        </div>
      `;
      return;
    }

    const html = this.conversations.map(conv => {
      // Church badge for church owners
      const churchBadge = conv.is_church_owner && conv.managed_church_name ? `
        <div class="chat-church-badge">
          ${conv.managed_church_logo 
            ? `<img src="${conv.managed_church_logo}" alt="${conv.managed_church_name}">` 
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                 <circle cx="12" cy="10" r="3"/>
               </svg>`
          }
          <span>${this.escapeHtml(conv.managed_church_name)}</span>
        </div>
      ` : '';

      return `
        <div class="chat-conversation-item ${conv.unread_count > 0 ? 'unread' : ''} ${conv.id === this.activeConversationId ? 'active' : ''}"
             data-conversation-id="${conv.id}"
             data-church-id="${conv.church_id}"
             onclick="chatWidget.showActiveChat(${conv.id})">
          <div class="chat-conversation-avatar">
            ${conv.church_avatar 
              ? `<img src="${conv.church_avatar}" alt="${conv.church_name}">` 
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                   <circle cx="12" cy="10" r="3"/>
                 </svg>`
            }
          </div>
          <div class="chat-conversation-info">
            <h4 class="chat-conversation-name">${this.escapeHtml(conv.church_name)}</h4>
            ${churchBadge}
            <p class="chat-conversation-preview">${this.escapeHtml(conv.last_message || 'No messages yet')}</p>
          </div>
          <div class="chat-conversation-meta">
            <span class="chat-conversation-time">${this.formatTime(conv.last_message_time)}</span>
            ${conv.unread_count > 0 ? `<span class="chat-conversation-unread">${conv.unread_count}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    this.conversationsScroll.innerHTML = html;
  }

  async loadMessages(conversationId, silent = false) {
    if (!silent) {
      this.showLoading();
    }
    
    try {
      const response = await fetch(`/app/api/conversations/${conversationId}/messages/`, {
        headers: {
          'X-CSRFToken': this.getCsrfToken(),
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        // Only re-render if messages have changed
        if (!silent || JSON.stringify(newMessages) !== JSON.stringify(this.messages)) {
          // Save scroll position
          const wasAtBottom = this.isScrolledToBottom();
          
          this.messages = newMessages;
          this.renderMessages();
          
          // Restore scroll position (stay at bottom if was at bottom, or keep position)
          if (wasAtBottom) {
            this.scrollToBottom();
          }
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) {
        this.hideLoading();
      }
    }
  }
  
  isScrolledToBottom() {
    const threshold = 100; // pixels from bottom
    return this.messagesContainer.scrollHeight - this.messagesContainer.scrollTop - this.messagesContainer.clientHeight < threshold;
  }

  renderMessages() {
    if (this.messages.length === 0) {
      this.messagesContainer.innerHTML = `
        <div class="chat-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p>No messages yet</p>
          <p class="text-muted">Start the conversation</p>
        </div>
      `;
      return;
    }

    let html = '';
    let lastDate = null;

    this.messages.forEach((msg, index) => {
      const msgDate = new Date(msg.created_at).toDateString();
      
      // Add date separator
      if (msgDate !== lastDate) {
        html += `
          <div class="chat-date-separator">
            <span>${this.formatDate(msg.created_at)}</span>
          </div>
        `;
        lastDate = msgDate;
      }

      // Add message
      const isSent = msg.is_sent_by_user;
      
      // Build attachment HTML if present
      let attachmentHtml = '';
      if (msg.attachment) {
        if (msg.attachment.type === 'image') {
          attachmentHtml = `
            <div class="chat-message-attachment">
              <img src="${msg.attachment.url}" alt="${msg.attachment.name}" onclick="window.open('${msg.attachment.url}', '_blank')">
            </div>
          `;
        } else {
          attachmentHtml = `
            <div class="chat-message-attachment">
              <a href="${msg.attachment.url}" target="_blank" class="chat-message-attachment-doc">
                <div class="chat-message-attachment-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                </div>
                <div class="chat-message-attachment-info">
                  <div class="chat-message-attachment-name">${this.escapeHtml(msg.attachment.name)}</div>
                  <div class="chat-message-attachment-size">${this.formatFileSize(msg.attachment.size)}</div>
                </div>
              </a>
            </div>
          `;
        }
      }
      
      // Build rank badge HTML if present
      let rankBadgeHtml = '';
      if (msg.donation_rank) {
        rankBadgeHtml = `<span class="donation-rank-badge" style="background: ${msg.donation_rank.color}22; color: ${msg.donation_rank.color}; border: 1px solid ${msg.donation_rank.color}44;" title="${msg.donation_rank.name}">${msg.donation_rank.name}</span>`;
      }
      
      // Build seen status HTML for sent messages
      let seenStatusHtml = '';
      if (isSent) {
        if (msg.read_at) {
          seenStatusHtml = `
            <div class="chat-message-seen seen">
              <span class="chat-message-seen-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                  <polyline points="20 6 9 17" transform="translate(3, 0)"></polyline>
                </svg>
              </span>
              <span>Seen</span>
            </div>
          `;
        } else {
          seenStatusHtml = `
            <div class="chat-message-seen">
              <span class="chat-message-seen-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            </div>
          `;
        }
      }
      
      html += `
        <div class="chat-message ${isSent ? 'sent' : 'received'}">
          <div class="chat-message-avatar">
            ${msg.avatar 
              ? `<img src="${msg.avatar}" alt="${msg.sender_name}">` 
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <circle cx="12" cy="12" r="10"/>
                   <path d="M12 16v-4M12 8h.01"/>
                 </svg>`
            }
          </div>
          <div class="chat-message-content">
            ${!isSent && rankBadgeHtml ? `<div class="chat-message-sender">${msg.sender_name} ${rankBadgeHtml}</div>` : ''}
            ${msg.content ? `<div class="chat-message-bubble">${this.linkifyText(msg.content)}</div>` : ''}
            ${attachmentHtml}
            <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
              <span class="chat-message-time">${this.formatMessageTime(msg.created_at)}</span>
              ${seenStatusHtml}
            </div>
          </div>
        </div>
      `;
    });

    // Add typing indicator at the end
    html += `
      <div class="chat-typing-indicator" id="chat-typing-indicator-msg">
        <div class="chat-typing-avatar" id="chat-typing-avatar-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <div class="chat-typing-bubble">
          <span class="chat-typing-text">Typing</span>
          <div class="chat-typing-dots">
            <span class="chat-typing-dot"></span>
            <span class="chat-typing-dot"></span>
            <span class="chat-typing-dot"></span>
          </div>
        </div>
      </div>
    `;
    
    this.messagesContainer.innerHTML = html;
    this.scrollToBottom();
  }

  async handleSendMessage(e) {
    e.preventDefault();
    
    const content = this.messageInput.value.trim();
    const hasFile = this.selectedFile !== null;
    
    if (!content && !hasFile) return;
    if (!this.activeConversationId) return;

    // Disable send button
    this.sendBtn.disabled = true;

    try {
      let response;
      
      if (hasFile) {
        // Send with file attachment (multipart/form-data)
        const formData = new FormData();
        formData.append('content', content);
        formData.append('attachment', this.selectedFile);
        
        response = await fetch(`/app/api/conversations/${this.activeConversationId}/messages/`, {
          method: 'POST',
          headers: {
            'X-CSRFToken': this.getCsrfToken(),
          },
          body: formData
        });
      } else {
        // Send text only (JSON)
        response = await fetch(`/app/api/conversations/${this.activeConversationId}/messages/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCsrfToken(),
          },
          body: JSON.stringify({ content })
        });
      }

      if (response.ok) {
        const data = await response.json();
        
        // Add message to UI
        this.messages.push(data.message);
        this.renderMessages();
        
        // Clear input and file
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.removeFile();
        
        // Update conversations list
        this.loadConversations();
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('An error occurred. Please try again.');
    } finally {
      this.sendBtn.disabled = false;
      this.messageInput.focus();
    }
  }

  handleMessageInput() {
    this.updateSendButton();
    
    // Send typing indicator (debounced)
    const hasContent = this.messageInput.value.trim().length > 0;
    if (hasContent && this.activeConversationId) {
      this.sendTypingIndicator();
    }
  }
  
  updateSendButton() {
    const hasContent = this.messageInput.value.trim().length > 0;
    const hasFile = this.selectedFile !== null;
    this.sendBtn.disabled = !hasContent && !hasFile;
  }

  handleKeyDown(e) {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (this.messageInput.value.trim()) {
        this.messageForm.dispatchEvent(new Event('submit'));
      }
    }
  }

  autoResizeTextarea() {
    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 100) + 'px';
  }

  sendTypingIndicator() {
    clearTimeout(this.typingTimeout);
    
    // Send typing status to server
    fetch(`/app/api/conversations/${this.activeConversationId}/typing/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.getCsrfToken(),
      },
      body: JSON.stringify({ is_typing: true })
    });

    // Clear typing status after 3 seconds
    this.typingTimeout = setTimeout(() => {
      fetch(`/app/api/conversations/${this.activeConversationId}/typing/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken(),
        },
        body: JSON.stringify({ is_typing: false })
      });
    }, 3000);
  }

  async markConversationAsRead(conversationId) {
    if (!conversationId) return;

    try {
      await fetch(`/app/api/conversations/${conversationId}/read/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': this.getCsrfToken(),
        }
      });
      
      // Update local state
      const conversation = this.conversations.find(c => c.id === conversationId);
      if (conversation) {
        conversation.unread_count = 0;
        this.updateUnreadCount();
        this.renderConversations();
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    
    if (this.unreadCount > 0) {
      this.unreadBadge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      this.unreadBadge.style.display = 'flex';
    } else {
      this.unreadBadge.style.display = 'none';
    }
  }

  startMessagePolling() {
    // Poll for new messages every 10 seconds
    this.messagePollingInterval = setInterval(() => {
      if (this.activeConversationId) {
        this.loadMessages(this.activeConversationId, true); // Silent mode to prevent flickering
        this.checkTypingStatus(); // Check if other person is typing
      }
      this.loadConversations(); // Update conversation list for unread counts
    }, 10000);
  }
  
  async checkTypingStatus() {
    if (!this.activeConversationId) return;
    
    try {
      const response = await fetch(`/app/api/conversations/${this.activeConversationId}/typing-status/`, {
        headers: {
          'X-CSRFToken': this.getCsrfToken(),
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.is_typing && data.typers.length > 0) {
          const typer = data.typers[0]; // Show first typer
          this.showTypingIndicator(typer.avatar);
          this.updateHeaderTypingStatus(true, typer.display_name);
        } else {
          this.hideTypingIndicator();
          this.updateHeaderTypingStatus(false);
        }
      }
    } catch (error) {
      console.error('Error checking typing status:', error);
    }
  }
  
  showTypingIndicator(avatar = null) {
    const indicator = document.getElementById('chat-typing-indicator-msg');
    const avatarContent = document.getElementById('chat-typing-avatar-content');
    
    if (indicator) {
      indicator.classList.add('active');
      
      // Update avatar if provided
      if (avatar && avatarContent) {
        avatarContent.innerHTML = `<img src="${avatar}" alt="Typing">`;
      }
      
      // Auto-scroll if needed
      if (this.isScrolledToBottom()) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    }
  }
  
  hideTypingIndicator() {
    const indicator = document.getElementById('chat-typing-indicator-msg');
    if (indicator) {
      indicator.classList.remove('active');
    }
  }
  
  updateHeaderTypingStatus(isTyping, name = null) {
    if (isTyping) {
      this.chatStatus.innerHTML = `
        <span class="typing">
          <span>typing</span>
          <div class="chat-typing-dots">
            <span class="chat-typing-dot"></span>
            <span class="chat-typing-dot"></span>
            <span class="chat-typing-dot"></span>
          </div>
        </span>
      `;
      this.chatStatus.classList.remove('online');
    } else {
      this.chatStatus.textContent = 'Active';
      this.chatStatus.classList.add('online');
    }
  }

  stopMessagePolling() {
    if (this.messagePollingInterval) {
      clearInterval(this.messagePollingInterval);
    }
  }
  
  startTypingPolling() {
    // Stop any existing typing poll
    this.stopTypingPolling();
    
    // Check typing status immediately
    this.checkTypingStatus();
    
    // Poll every 3 seconds for typing status (faster than message polling)
    this.typingPollingInterval = setInterval(() => {
      if (this.activeConversationId) {
        this.checkTypingStatus();
      }
    }, 3000);
  }
  
  stopTypingPolling() {
    if (this.typingPollingInterval) {
      clearInterval(this.typingPollingInterval);
      this.typingPollingInterval = null;
    }
  }

  handleClickOutside(e) {
    if (this.isOpen && !this.isMinimized && !this.widget.contains(e.target)) {
      // Optionally minimize on click outside
      // this.minimizeWidget();
    }
  }

  showLoading() {
    this.loadingEl.style.display = 'flex';
    this.messagesContainer.style.display = 'none';
  }

  hideLoading() {
    this.loadingEl.style.display = 'none';
    this.messagesContainer.style.display = 'flex';
  }

  scrollToBottom() {
    setTimeout(() => {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }, 100);
  }

  // Utility methods
  getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value || 
           document.querySelector('meta[name="csrf-token"]')?.content ||
           window.csrfToken || '';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  linkifyText(text) {
    // First escape HTML to prevent XSS
    const escaped = this.escapeHtml(text);
    
    // URL regex pattern - matches http(s), www, and common TLDs
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9.-]+\.(com|org|net|edu|gov|io|co|app|dev|tech|info|biz|me|us|uk|ca|au)[^\s]*)/gi;
    
    // Replace URLs with clickable links
    return escaped.replace(urlPattern, (url) => {
      // Add protocol if missing
      let href = url;
      if (!url.match(/^https?:\/\//i)) {
        href = 'http://' + url;
      }
      
      // Create clickable link with target="_blank" to open in new tab
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`;
    });
  }

  formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Less than 7 days
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    
    // Format as date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDate(timestamp) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  }

  formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  // Public API for external use
  openConversation(churchId, churchName, churchAvatar) {
    // Find or create conversation
    let conversation = this.conversations.find(c => c.church_id === churchId);
    
    if (conversation) {
      this.openWidget();
      this.showActiveChat(conversation.id);
    } else {
      // Create new conversation
      this.createConversation(churchId, churchName, churchAvatar);
    }
  }

  async createConversation(churchId, churchName, churchAvatar) {
    try {
      const response = await fetch('/app/api/conversations/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': this.getCsrfToken(),
        },
        body: JSON.stringify({ 
          church_id: churchId,
          church_name: churchName,
          church_avatar: churchAvatar
        })
      });

      if (response.ok) {
        const data = await response.json();
        await this.loadConversations();
        this.openWidget();
        this.showActiveChat(data.conversation.id);
      } else {
        alert('Failed to start conversation. Please try again.');
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('An error occurred. Please try again.');
    }
  }

  // File handling methods
  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      this.fileInput.value = '';
      return;
    }
    
    this.selectedFile = file;
    this.showFilePreview(file);
    this.updateSendButton();
  }
  
  showFilePreview(file) {
    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
      // Show image preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.filePreviewImage.src = e.target.result;
        this.filePreviewImage.style.display = 'block';
        this.filePreviewDoc.style.display = 'none';
      };
      reader.readAsDataURL(file);
    } else {
      // Show document preview
      this.filePreviewName.textContent = file.name;
      this.filePreviewDoc.style.display = 'flex';
      this.filePreviewImage.style.display = 'none';
    }
    
    this.filePreview.style.display = 'block';
  }
  
  removeFile() {
    this.selectedFile = null;
    this.fileInput.value = '';
    this.filePreview.style.display = 'none';
    this.filePreviewImage.src = '';
    this.updateSendButton();
  }
  
  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  destroy() {
    this.stopMessagePolling();
    this.stopTypingPolling();
  }
}

// Initialize chat widget when DOM is ready
let chatWidget;

document.addEventListener('DOMContentLoaded', function() {
  const chatWidgetEl = document.getElementById('chat-widget');
  if (chatWidgetEl) {
    chatWidget = new ChatWidget();
    
    // Make it globally accessible
    window.chatWidget = chatWidget;
    
    // Show widget if user is authenticated
    if (document.body.dataset.authenticated === 'true') {
      chatWidgetEl.style.display = 'block';
    }
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
  if (chatWidget) {
    chatWidget.destroy();
  }
});
