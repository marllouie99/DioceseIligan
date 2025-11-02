/**
 * Post Management Module
 * Handles post creation, editing, and management functionality
 */

class PostManagement {
  constructor() {
    this.isInitialized = false;
    this.isSubmitting = false;
    this.selectedFiles = [];
  }

  /**
   * Initialize the post management module
   */
  init() {
    if (this.isInitialized) {
      console.warn('PostManagement already initialized');
      return;
    }

    console.log('🚀 Initializing PostManagement...');
    this.setupCreatePostModal();
    this.setupEditPostModal();
    this.setupCharacterCounter();
    this.setupImagePreview();
    this.setupEditImagePreview();
    this.setupDonationToggle();
    this.setupMultipleImageUpload();
    this.isInitialized = true;
    console.log('✅ PostManagement initialized successfully');
  }

  /**
   * Show create post modal
   */
  showCreatePostModal() {
    const modal = document.getElementById('createPostModal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Focus on textarea
      const textarea = modal.querySelector('textarea[name="content"]');
      if (textarea) {
        setTimeout(() => textarea.focus(), 100);
      }
    }
  }

  /**
   * Hide create post modal
   */
  hideCreatePostModal() {
    const modal = document.getElementById('createPostModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      this.resetForm();
    }
  }

  /**
   * Reset the create post form
   */
  resetForm() {
    const form = document.getElementById('createPostForm');
    if (form) {
      form.reset();
      this.updateCharacterCount();
      this.hideImagePreview();
    }
  }

  /**
   * Setup create post modal functionality
   */
  setupCreatePostModal() {
    const form = document.getElementById('createPostForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Close modal when clicking outside
    const modal = document.getElementById('createPostModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideCreatePostModal();
        }
      });
    }

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('createPostModal');
        if (modal && modal.style.display === 'flex') {
          this.hideCreatePostModal();
        }
      }
    });
  }

  /**
   * Setup character counter for textarea
   */
  setupCharacterCounter() {
    const textarea = document.getElementById('manage-post-content');
    const counter = document.getElementById('manage-char-count');
    
    if (textarea && counter) {
      textarea.addEventListener('input', () => this.updateCharacterCount());
      // Initialize counter
      this.updateCharacterCount();
    }
    
    // Edit form character counter
    const editTextarea = document.querySelector('#editPostForm textarea[name="content"]');
    const editCounter = document.getElementById('editCharCount');
    
    if (editTextarea && editCounter) {
      editTextarea.addEventListener('input', () => this.updateEditCharacterCount());
    }
  }

  /**
   * Update character count display
   */
  updateCharacterCount() {
    const textarea = document.getElementById('manage-post-content');
    const counter = document.getElementById('manage-char-count');
    
    if (textarea && counter) {
      const count = textarea.value.length;
      counter.textContent = count;
      
      // Update styling based on character limit
      if (count > 900) {
        counter.style.color = '#ef4444';
      } else if (count > 800) {
        counter.style.color = '#f59e0b';
      } else {
        counter.style.color = '#6b7280';
      }
    }
  }

  /**
   * Update character count display for edit form
   */
  updateEditCharacterCount() {
    const textarea = document.querySelector('#editPostForm textarea[name="content"]');
    const counter = document.getElementById('editCharCount');
    
    if (textarea && counter) {
      const count = textarea.value.length;
      counter.textContent = count;
      
      // Update styling based on character limit
      if (count > 900) {
        counter.style.color = '#ef4444';
      } else if (count > 800) {
        counter.style.color = '#f59e0b';
      } else {
        counter.style.color = '#6b7280';
      }
    }
  }

  /**
   * Setup image preview functionality
   */
  setupImagePreview() {
    const imageInput = document.getElementById('post-images');
    if (imageInput) {
      imageInput.addEventListener('change', (e) => this.handleImageSelect(e));
      console.log('✅ Dashboard multi-image upload initialized');
    } else {
      console.warn('⚠️ Image input #post-images not found');
    }
  }

  /**
   * Setup edit post modal functionality
   */
  setupEditPostModal() {
    const form = document.getElementById('editPostForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleEditFormSubmit(e));
    }

    // Close modal when clicking outside
    const modal = document.getElementById('editPostModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hideEditPostModal();
        }
      });
    }
  }

  /**
   * Setup edit image preview functionality
   */
  setupEditImagePreview() {
    const imageInput = document.getElementById('edit-post-image');
    if (imageInput) {
      imageInput.addEventListener('change', (e) => this.handleEditImageSelect(e));
    }
  }

  /**
   * Handle multiple image selection and preview
   */
  handleImageSelect(event) {
    const files = Array.from(event.target.files);
    const maxImages = 10;
    
    console.log(`📷 Dashboard: Selected ${files.length} file(s)`);
    
    // Check total count
    if (this.selectedFiles.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images.`);
      event.target.value = '';
      return;
    }
    
    // Validate each file
    const validFiles = [];
    for (const file of files) {
      // Check file size (10MB per image)
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 10MB per image.`);
        continue;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file.`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    console.log(`✅ Dashboard: ${validFiles.length} valid file(s), total: ${this.selectedFiles.length + validFiles.length}`);
    
    // Add valid files to selected files
    this.selectedFiles = this.selectedFiles.concat(validFiles);
    
    // Update preview
    this.updateDashboardImagesPreview();
    
    // Clear input
    event.target.value = '';
  }

  /**
   * Update images preview for dashboard
   */
  updateDashboardImagesPreview() {
    const container = document.getElementById('dashboard-images-preview');
    const photoLabel = document.getElementById('dashboard-photo-label');
    
    console.log(`🖼️ Dashboard: Updating preview for ${this.selectedFiles.length} image(s)`);
    
    if (!container) {
      console.error('❌ Dashboard: #dashboard-images-preview container not found!');
      return;
    }
    
    if (this.selectedFiles.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      if (photoLabel) photoLabel.textContent = 'Photo/Video';
      console.log('🔄 Dashboard: Preview hidden (no images)');
      return;
    }
    
    container.innerHTML = '';
    container.style.display = 'grid';
    console.log(`✅ Dashboard: Container set to grid display`);
    
    this.selectedFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        previewItem.innerHTML = `
          <img src="${e.target.result}" alt="Preview ${index + 1}">
          <button type="button" class="remove-btn" data-index="${index}">&times;</button>
          <div class="image-order">${index + 1}</div>
        `;
        container.appendChild(previewItem);
        console.log(`📸 Dashboard: Added preview for image ${index + 1}`);
        
        // Add remove handler
        previewItem.querySelector('.remove-btn').addEventListener('click', () => {
          this.removeDashboardImage(index);
        });
      };
      reader.readAsDataURL(file);
    });
    
    // Update photo label
    if (photoLabel) {
      photoLabel.textContent = `${this.selectedFiles.length} image${this.selectedFiles.length > 1 ? 's' : ''} selected`;
      console.log(`🏷️ Dashboard: Updated label to "${photoLabel.textContent}"`);
    }
  }

  /**
   * Remove image from dashboard selection
   */
  removeDashboardImage(index) {
    this.selectedFiles.splice(index, 1);
    this.updateDashboardImagesPreview();
  }

  /**
   * Hide image preview
   */
  hideImagePreview() {
    this.selectedFiles = [];
    this.updateDashboardImagesPreview();
  }

  /**
   * Remove image preview (alias for backward compatibility)
   */
  removeImagePreview() {
    this.hideImagePreview();
  }

  /**
   * Handle form submission
   */
  async handleFormSubmit(event) {
    event.preventDefault();
    
    if (this.isSubmitting) return;
    
    const form = event.target;
    const submitBtn = document.getElementById('submitPostBtn');
    const originalText = submitBtn.innerHTML;
    
    try {
      this.isSubmitting = true;
      
      // Show loading state
      submitBtn.innerHTML = `
        <svg class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Publishing...
      `;
      submitBtn.disabled = true;

      // Submit form
      const formData = new FormData(form);
      
      // Add multiple images to form data
      if (this.selectedFiles && this.selectedFiles.length > 0) {
        this.selectedFiles.forEach((file) => {
          formData.append('images', file);
        });
      }
      
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        // Success - redirect or refresh
        window.location.reload();
      } else {
        throw new Error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      this.isSubmitting = false;
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  /**
   * Edit post functionality
   */
  async editPost(postId) {
    try {
      // Fetch post data
      const response = await fetch(`/app/edit-post/${postId}/`, {
        method: 'GET',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        this.populateEditForm(data.post);
        this.showEditPostModal();
      } else {
        alert(data.message || 'Failed to load post data');
      }
    } catch (error) {
      console.error('Error loading post data:', error);
      alert('An error occurred while loading the post. Please try again.');
    }
  }

  /**
   * Show edit post modal
   */
  showEditPostModal() {
    const modal = document.getElementById('editPostModal');
    if (modal) {
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      
      // Focus on textarea
      const textarea = modal.querySelector('textarea[name="content"]');
      if (textarea) {
        setTimeout(() => textarea.focus(), 100);
      }
    }
  }

  /**
   * Hide edit post modal
   */
  hideEditPostModal() {
    const modal = document.getElementById('editPostModal');
    if (modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
      this.resetEditForm();
    }
  }

  /**
   * Populate edit form with post data
   */
  populateEditForm(post) {
    document.getElementById('editPostId').value = post.id;
    document.getElementById('editPostContent').value = post.content;
    
    // Update character count
    this.updateEditCharacterCount();
    
    // Handle current image
    const currentImagePreview = document.getElementById('currentImagePreview');
    const currentImg = document.getElementById('currentImg');
    
    if (post.image_url) {
      currentImg.src = post.image_url;
      currentImagePreview.style.display = 'block';
      document.getElementById('removeCurrentImageFlag').value = 'false';
    } else {
      currentImagePreview.style.display = 'none';
    }
    
    // Hide new image preview
    document.getElementById('editImagePreview').style.display = 'none';
  }

  /**
   * Reset the edit post form
   */
  resetEditForm() {
    const form = document.getElementById('editPostForm');
    if (form) {
      form.reset();
      document.getElementById('editPostId').value = '';
      document.getElementById('removeCurrentImageFlag').value = 'false';
      this.updateEditCharacterCount();
      this.hideCurrentImage();
      this.hideEditImagePreview();
    }
  }

  /**
   * Delete post functionality
   */
  async deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/app/posts/${postId}/delete/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': window.csrfToken || document.querySelector('[name=csrfmiddlewaretoken]').value,
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        // Remove the post card from the DOM
        const postCard = document.querySelector(`[data-post-id="${postId}"]`);
        if (postCard) {
          postCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          postCard.style.opacity = '0';
          postCard.style.transform = 'scale(0.95)';
          
          setTimeout(() => {
            postCard.remove();
            
            // Check if there are any posts left
            const postsContainer = document.querySelector('.posts-list');
            if (postsContainer && postsContainer.children.length === 0) {
              // Reload page to show empty state
              window.location.reload();
            }
          }, 300);
        }
        
        // Show success message
        this.showNotification(data.message || 'Post deleted successfully', 'success');
      } else {
        alert(data.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting the post. Please try again.');
    }
  }
  
  /**
   * Show notification message
   */
  showNotification(message, type = 'info') {
    // Simple notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  /**
   * Remove image preview
   */
  removeImagePreview() {
    this.hideImagePreview();
  }

  /**
   * Handle edit image selection and preview
   */
  handleEditImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        event.target.value = '';
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB.');
        event.target.value = '';
        return;
      }

      // Show preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.showEditImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Show edit image preview
   */
  showEditImagePreview(imageSrc) {
    const preview = document.getElementById('editImagePreview');
    const previewImg = document.getElementById('editPreviewImg');
    
    if (preview && previewImg) {
      previewImg.src = imageSrc;
      preview.style.display = 'block';
    }
  }

  /**
   * Hide edit image preview
   */
  hideEditImagePreview() {
    const preview = document.getElementById('editImagePreview');
    const imageInput = document.getElementById('edit-post-image');
    
    if (preview) {
      preview.style.display = 'none';
    }
    if (imageInput) {
      imageInput.value = '';
    }
  }

  /**
   * Remove current image
   */
  removeCurrentImage() {
    const currentImagePreview = document.getElementById('currentImagePreview');
    const removeFlag = document.getElementById('removeCurrentImageFlag');
    
    if (currentImagePreview) {
      currentImagePreview.style.display = 'none';
    }
    if (removeFlag) {
      removeFlag.value = 'true';
    }
  }

  /**
   * Hide current image
   */
  hideCurrentImage() {
    const currentImagePreview = document.getElementById('currentImagePreview');
    if (currentImagePreview) {
      currentImagePreview.style.display = 'none';
    }
  }

  /**
   * Remove edit image preview
   */
  removeEditImagePreview() {
    this.hideEditImagePreview();
  }

  /**
   * Handle edit form submission
   */
  async handleEditFormSubmit(event) {
    event.preventDefault();
    
    if (this.isSubmitting) return;
    
    const form = event.target;
    const submitBtn = document.getElementById('updatePostBtn');
    const originalText = submitBtn.innerHTML;
    
    try {
      this.isSubmitting = true;
      
      // Show loading state
      submitBtn.innerHTML = `
        <svg class="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Updating...
      `;
      submitBtn.disabled = true;

      // Get post ID
      const postId = document.getElementById('editPostId').value;
      
      // Submit form
      const formData = new FormData(form);
      const response = await fetch(`/app/edit-post/${postId}/`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (data.success) {
        // Success - hide modal and refresh page or update UI
        this.hideEditPostModal();
        window.location.reload();
      } else {
        alert(data.message || 'Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post. Please try again.');
    } finally {
      this.isSubmitting = false;
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  /**
   * Setup donation toggle functionality
   */
  setupDonationToggle() {
    const donationCheckbox = document.getElementById('manage-enable-donation');
    const donationFields = document.getElementById('manage-donation-fields');
    
    if (donationCheckbox && donationFields) {
      donationCheckbox.addEventListener('change', function() {
        donationFields.style.display = this.checked ? 'block' : 'none';
      });
    }
  }

  /**
   * Setup multiple image upload functionality
   */
  setupMultipleImageUpload() {
    const imageInput = document.getElementById('manage-post-images');
    const previewContainer = document.getElementById('manage-main-images-preview');
    const uploadText = document.getElementById('manage-upload-text');
    
    if (!imageInput || !previewContainer) return;
    
    imageInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      
      if (files.length === 0) {
        previewContainer.style.display = 'none';
        if (uploadText) uploadText.textContent = 'Click to add photos (up to 10)';
        return;
      }
      
      // Limit to 10 images
      if (files.length > 10) {
        alert('You can only upload up to 10 images');
        e.target.value = '';
        return;
      }
      
      // Show preview container
      previewContainer.style.display = 'grid';
      previewContainer.innerHTML = '';
      
      // Update upload text
      if (uploadText) {
        uploadText.textContent = `${files.length} image${files.length > 1 ? 's' : ''} selected`;
      }
      
      // Preview each image
      files.forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
          const previewItem = document.createElement('div');
          previewItem.className = 'image-preview-item';
          previewItem.innerHTML = `
            <img src="${e.target.result}" alt="Preview ${index + 1}">
            <button type="button" class="remove-image-btn" onclick="window.postManagement.removeImageAtIndex(${index})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          `;
          previewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  /**
   * Remove image at specific index
   */
  removeImageAtIndex(index) {
    const imageInput = document.getElementById('manage-post-images');
    if (!imageInput) return;
    
    const dt = new DataTransfer();
    const files = imageInput.files;
    
    for (let i = 0; i < files.length; i++) {
      if (i !== index) {
        dt.items.add(files[i]);
      }
    }
    
    imageInput.files = dt.files;
    
    // Trigger change event to update preview
    imageInput.dispatchEvent(new Event('change'));
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.isInitialized = false;
  }
}

// Make available globally
window.PostManagement = PostManagement;

// Global functions for template compatibility
window.showCreatePostModal = function() {
  if (window.postManagement) {
    window.postManagement.showCreatePostModal();
  }
};

window.hideCreatePostModal = function() {
  if (window.postManagement) {
    window.postManagement.hideCreatePostModal();
  }
};

window.editPost = function(postId) {
  if (window.postManagement) {
    window.postManagement.editPost(postId);
  }
};

window.deletePost = function(postId) {
  if (window.postManagement) {
    window.postManagement.deletePost(postId);
  }
};

window.removeImagePreview = function() {
  if (window.postManagement) {
    window.postManagement.removeImagePreview();
  }
};

window.showEditPostModal = function() {
  if (window.postManagement) {
    window.postManagement.showEditPostModal();
  }
};

window.hideEditPostModal = function() {
  if (window.postManagement) {
    window.postManagement.hideEditPostModal();
  }
};

window.removeCurrentImage = function() {
  if (window.postManagement) {
    window.postManagement.removeCurrentImage();
  }
};

window.removeEditImagePreview = function() {
  if (window.postManagement) {
    window.postManagement.removeEditImagePreview();
  }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check for manage-church page or any page with post management elements
  const hasManageChurch = window.location.pathname.includes('manage-church');
  const hasPostModal = document.getElementById('createPostModal') || document.getElementById('editPostModal');
  
  if (hasManageChurch || hasPostModal) {
    window.postManagement = new PostManagement();
    window.postManagement.init();
  }
});
