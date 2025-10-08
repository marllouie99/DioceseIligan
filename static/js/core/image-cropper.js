/**
 * Image Cropper Module
 * @module ImageCropper
 */

class ImageCropper {
  constructor() {
    this.currentCropType = null;
    this.cropper = null;
    this.stagedFiles = {};
    this.stagedObjectURLs = {};
    this.previousMarkup = {};
  }

  /**
   * Initialize image preview functionality
   */
  init() {
    this.initializeImagePreviews();
    this.initializePreviewButtons();
    this.initializeConfirmDiscardButtons();
  }

  /**
   * Initialize image preview inputs
   */
  initializeImagePreviews() {
    // Settings page inputs
    const logoInput = document.getElementById('id_logo');
    const coverInput = document.getElementById('id_cover_image');
    
    // Preview section inputs
    const previewLogoInput = document.getElementById('preview_logo_input');
    const previewCoverInput = document.getElementById('preview_cover_input');
    
    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
          this.openCropper('logo', f);
        }
      });
    }
    
    if (coverInput) {
      coverInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
          this.openCropper('cover', f);
        }
      });
    }
    
    if (previewLogoInput) {
      previewLogoInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
          this.openCropper('logo', f);
        }
      });
    }
    
    if (previewCoverInput) {
      previewCoverInput.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
          this.openCropper('cover', f);
        }
      });
    }
  }

  /**
   * Initialize preview buttons
   */
  initializePreviewButtons() {
    const previewButtons = document.querySelectorAll('.preview-btn[data-target]');
    previewButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const targetId = e.currentTarget.getAttribute('data-target');
        const targetInput = document.getElementById(targetId);
        if (targetInput) {
          targetInput.click();
        }
      });
    });
  }

  /**
   * Initialize confirm/discard buttons
   */
  initializeConfirmDiscardButtons() {
    // Confirm/Discard actions
    const confirmBtns = document.querySelectorAll('.preview-confirm-btn[data-type]');
    confirmBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        this.confirmStaged(type);
      });
    });
    
    const discardBtns = document.querySelectorAll('.preview-discard-btn[data-type]');
    discardBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        this.discardStaged(type);
      });
    });

    // Inline confirm/discard in Media settings section
    const inlineConfirmBtns = document.querySelectorAll('.media-confirm-btn[data-type]');
    inlineConfirmBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        this.confirmStaged(type);
      });
    });
    
    const inlineDiscardBtns = document.querySelectorAll('.media-discard-btn[data-type]');
    inlineDiscardBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        this.discardStaged(type);
      });
    });
  }

  /**
   * Open cropper modal
   * @param {string} type - Type of image (logo or cover)
   * @param {File} file - Selected file
   */
  openCropper(type, file) {
    const isLogo = type === 'logo';
    this.currentCropType = type;
    const modal = document.getElementById('cropper-modal');
    const imgEl = document.getElementById('cropper-image');
    if (!modal || !imgEl) return;

    // Destroy any previous cropper instance
    if (this.cropper) {
      try { this.cropper.destroy(); } catch (e) {}
      this.cropper = null;
    }

    // Load selected file into the cropper image element
    const objectUrl = URL.createObjectURL(file);
    imgEl.src = objectUrl;
    imgEl.onload = () => {
      // Ensure clean instance
      if (this.cropper) { try { this.cropper.destroy(); } catch (e) {} }
      this.cropper = new Cropper(imgEl, {
        aspectRatio: isLogo ? 1 : 16/9,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 1,
        background: false,
        movable: true,
        zoomable: true,
        responsive: true,
        checkCrossOrigin: false,
      });
    };

    // Show modal
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close cropper modal
   */
  closeCropper() {
    const modal = document.getElementById('cropper-modal');
    if (this.cropper) {
      try { this.cropper.destroy(); } catch (e) {}
      this.cropper = null;
    }
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = '';
    this.currentCropType = null;
  }

  /**
   * Confirm crop and process image
   */
  confirmCrop() {
    if (!this.cropper || !this.currentCropType) return;
    const isLogo = this.currentCropType === 'logo';
    const targetSize = isLogo ? { width: 400, height: 400 } : { width: 1280, height: 720 };
    const canvas = this.cropper.getCroppedCanvas(targetSize);
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const fileName = isLogo ? 'logo.jpg' : 'cover.jpg';
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      // Stage the cropped image and show confirm/discard controls
      this.stageCroppedImage(this.currentCropType, file);
      this.closeCropper();
    }, 'image/jpeg', 0.92);
  }

  /**
   * Zoom the cropper
   * @param {number} delta - Zoom delta
   */
  cropperZoom(delta) {
    if (this.cropper) {
      this.cropper.zoom(delta);
    }
  }

  /**
   * Rotate the cropper
   * @param {number} deg - Rotation degrees
   */
  cropperRotate(deg) {
    if (this.cropper) {
      this.cropper.rotate(deg);
    }
  }

  /**
   * Reset the cropper
   */
  cropperReset() {
    if (this.cropper) {
      this.cropper.reset();
    }
  }

  /**
   * Stage cropped image for confirmation
   * @param {string} type - Type of image
   * @param {File} file - Cropped file
   */
  stageCroppedImage(type, file) {
    if (!file) return;
    this.stagedFiles[type] = file;
    const url = URL.createObjectURL(file);
    this.stagedObjectURLs[type] = url;

    const isLogo = type === 'logo';
    const container = isLogo ? document.querySelector('.preview-avatar') : document.querySelector('.preview-cover-section');
    if (!container) return;

    // Store previous markup for discard
    if (!this.previousMarkup[type]) {
      this.previousMarkup[type] = container.innerHTML;
    }

    let img = container.querySelector(isLogo ? 'img.preview-avatar-image' : 'img.preview-cover-image');
    if (!img) {
      // Replace placeholder with image
      container.innerHTML = '';
      img = document.createElement('img');
      img.className = isLogo ? 'preview-avatar-image' : 'preview-cover-image';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.alt = isLogo ? 'Church logo' : 'Cover image';
      container.appendChild(img);
    }
    img.src = url;
    this.showConfirmControls(type, true);
  }

  /**
   * Show/hide confirm controls
   * @param {string} type - Type of image
   * @param {boolean} show - Whether to show controls
   */
  showConfirmControls(type, show) {
    const display = show ? 'inline-flex' : 'none';
    // Top preview controls
    const confirmBtn = document.querySelector(`.preview-confirm-btn[data-type="${type}"]`);
    const discardBtn = document.querySelector(`.preview-discard-btn[data-type="${type}"]`);
    if (confirmBtn) confirmBtn.style.display = display;
    if (discardBtn) discardBtn.style.display = display;
    // Inline controls in Media settings
    const inlineConfirm = document.querySelector(`.media-confirm-btn[data-type="${type}"]`);
    const inlineDiscard = document.querySelector(`.media-discard-btn[data-type="${type}"]`);
    if (inlineConfirm) inlineConfirm.style.display = display;
    if (inlineDiscard) inlineDiscard.style.display = display;
  }

  /**
   * Confirm staged image
   * @param {string} type - Type of image
   */
  confirmStaged(type) {
    const file = this.stagedFiles[type];
    if (!file) {
      window.Utils.showNotification('No pending changes to confirm.', 'error');
      return;
    }
    this.uploadMedia(type, file);
  }

  /**
   * Discard staged image
   * @param {string} type - Type of image
   */
  discardStaged(type) {
    const isLogo = type === 'logo';
    const container = isLogo ? document.querySelector('.preview-avatar') : document.querySelector('.preview-cover-section');
    if (container && this.previousMarkup[type] !== undefined) {
      container.innerHTML = this.previousMarkup[type];
    }
    if (this.stagedObjectURLs[type]) {
      try { URL.revokeObjectURL(this.stagedObjectURLs[type]); } catch (e) {}
    }
    delete this.stagedFiles[type];
    delete this.stagedObjectURLs[type];
    delete this.previousMarkup[type];
    this.showConfirmControls(type, false);
    window.Utils.showNotification('Changes discarded.', 'info');
  }

  /**
   * Clear staged image
   * @param {string} type - Type of image
   */
  clearStaged(type) {
    if (this.stagedObjectURLs[type]) {
      try { URL.revokeObjectURL(this.stagedObjectURLs[type]); } catch (e) {}
    }
    delete this.stagedFiles[type];
    delete this.stagedObjectURLs[type];
    delete this.previousMarkup[type];
    this.showConfirmControls(type, false);
  }

  /**
   * Upload media file
   * @param {string} type - Type of image
   * @param {File} file - File to upload
   */
  uploadMedia(type, file) {
    const csrfToken = window.Utils.getCsrfToken();
    if (!csrfToken || !file) return;

    const url = type === 'logo' ? window.djangoUrls.updateChurchLogo : window.djangoUrls.updateChurchCover;
    const fd = new FormData();
    if (type === 'logo') fd.append('logo', file);
    else fd.append('cover_image', file);

    const btnSelector = type === 'logo' ? '.preview-btn[data-target="id_logo"]' : '.preview-btn[data-target="id_cover_image"]';
    const btn = document.querySelector(btnSelector);
    const inlineBtn = document.querySelector(`.media-confirm-btn[data-type="${type}"]`);
    
    if (btn) {
      btn.disabled = true;
      btn.dataset.origText = btn.textContent.trim();
      btn.textContent = 'Uploading...';
    }
    if (inlineBtn) {
      inlineBtn.disabled = true;
      inlineBtn.dataset.origText = inlineBtn.textContent.trim();
      inlineBtn.textContent = 'Uploading...';
    }

    // Show progress overlay
    this.showUploadProgress(type);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('X-CSRFToken', csrfToken);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        this.updateUploadProgress(type, percent);
      }
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        this.hideUploadProgress(type);
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.origText || (type === 'logo' ? 'Change profile' : 'Change cover');
        }
        if (inlineBtn) {
          inlineBtn.disabled = false;
          inlineBtn.textContent = inlineBtn.dataset.origText || (type === 'logo' ? 'Confirm logo' : 'Confirm cover');
        }
        
        try {
          let data = null;
          if (xhr.responseText) {
            // Check if response is JSON
            const contentType = xhr.getResponseHeader('Content-Type');
            if (contentType && contentType.includes('application/json')) {
              data = JSON.parse(xhr.responseText);
            } else {
              // Response is HTML (likely an error page)
              console.error('Received HTML instead of JSON:', xhr.responseText.substring(0, 200));
              window.Utils.handleError(new Error(`Server returned HTML instead of JSON. Status: ${xhr.status}`), 'Image Upload');
              return;
            }
          }
          
          if (xhr.status >= 200 && xhr.status < 300 && data && data.success) {
            this.applyPreviewUpdate(type, data.url);
            this.clearStaged(type);
            window.Utils.showNotification(data.message || 'Updated successfully.', 'success');
          } else {
            const errorMessage = (data && data.message) || `Upload failed with status ${xhr.status}`;
            window.Utils.handleError(new Error(errorMessage), 'Image Upload');
          }
        } catch (err) {
          console.error('Image upload error:', err);
          window.Utils.handleError(err, 'Image Upload Response Parsing');
        }
      }
    };

    xhr.onerror = () => {
      this.hideUploadProgress(type);
      if (btn) {
        btn.disabled = false;
        btn.textContent = btn.dataset.origText || (type === 'logo' ? 'Change profile' : 'Change cover');
      }
      if (inlineBtn) {
        inlineBtn.disabled = false;
        inlineBtn.textContent = inlineBtn.dataset.origText || (type === 'logo' ? 'Confirm logo' : 'Confirm cover');
      }
      window.Utils.handleError(new Error('Network error occurred'), 'Image Upload');
    };

    xhr.send(fd);
  }

  /**
   * Apply preview update after successful upload
   * @param {string} type - Type of image
   * @param {string} url - New image URL
   */
  applyPreviewUpdate(type, url) {
    if (type === 'logo') {
      const avatarContainer = document.querySelector('.preview-avatar');
      if (!avatarContainer) return;
      let img = avatarContainer.querySelector('img.preview-avatar-image');
      if (!img) {
        avatarContainer.innerHTML = '';
        img = document.createElement('img');
        img.className = 'preview-avatar-image';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = 'Church logo';
        avatarContainer.appendChild(img);
      }
      img.src = `${url}?t=${Date.now()}`;
    } else {
      const coverSection = document.querySelector('.preview-cover-section');
      if (!coverSection) return;
      let img = coverSection.querySelector('img.preview-cover-image');
      if (!img) {
        coverSection.innerHTML = '';
        img = document.createElement('img');
        img.className = 'preview-cover-image';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = 'Cover image';
        coverSection.appendChild(img);
      }
      img.src = `${url}?t=${Date.now()}`;
    }

    // Also refresh the preview shown in the Settings > Media section
    const inputEl = document.getElementById(type === 'logo' ? 'id_logo' : 'id_cover_image');
    if (inputEl) {
      const settingItem = inputEl.closest('.setting-item');
      const infoEl = settingItem ? settingItem.querySelector('.setting-info') : null;
      if (infoEl) {
        let current = infoEl.querySelector('.current-media-preview');
        if (!current) {
          current = document.createElement('div');
          current.className = 'current-media-preview';
          current.innerHTML = `<img class=\"media-preview-image\" alt=\"Current\" loading=\"lazy\" decoding=\"async\"><span class=\"media-status\">Current ${type === 'logo' ? 'logo' : 'cover image'}\</span>`;
          infoEl.appendChild(current);
        }
        const img = current.querySelector('img.media-preview-image');
        if (img) img.src = `${url}?t=${Date.now()}`;
      }
    }
  }

  /**
   * Show upload progress
   * @param {string} type - Type of image
   */
  showUploadProgress(type) {
    const container = this.getProgressContainer(type);
    if (!container) return;
    let overlay = container.querySelector('.upload-progress-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'upload-progress-overlay';
      overlay.innerHTML = `
        <div class=\"upload-progress\">
          <div class=\"upload-progress-bar\" style=\"width:0%\"></div>
          <div class=\"upload-progress-text\">0%</div>
        </div>
      `;
      container.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    this.updateUploadProgress(type, 0);
  }

  /**
   * Update upload progress
   * @param {string} type - Type of image
   * @param {number} percent - Progress percentage
   */
  updateUploadProgress(type, percent) {
    const container = this.getProgressContainer(type);
    if (!container) return;
    const bar = container.querySelector('.upload-progress-bar');
    const text = container.querySelector('.upload-progress-text');
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = `${percent}%`;
  }

  /**
   * Hide upload progress
   * @param {string} type - Type of image
   */
  hideUploadProgress(type) {
    const container = this.getProgressContainer(type);
    if (!container) return;
    const overlay = container.querySelector('.upload-progress-overlay');
    if (overlay) overlay.style.display = 'none';
  }

  /**
   * Get progress container for type
   * @param {string} type - Type of image
   * @returns {HTMLElement} Progress container
   */
  getProgressContainer(type) {
    return type === 'logo' ? document.querySelector('.preview-avatar') : document.querySelector('.preview-cover-section');
  }
}

// Export for use in main application
window.ImageCropper = ImageCropper;

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (!window.imageCropperInstance) {
    window.imageCropperInstance = new ImageCropper();
    window.imageCropperInstance.init();
    console.log('ImageCropper initialized');
    
    // Expose methods as global functions for inline onclick handlers
    window.closeCropper = () => window.imageCropperInstance.closeCropper();
    window.cropperZoom = (delta) => window.imageCropperInstance.cropperZoom(delta);
    window.cropperRotate = (deg) => window.imageCropperInstance.cropperRotate(deg);
    window.cropperReset = () => window.imageCropperInstance.cropperReset();
    window.confirmCrop = () => window.imageCropperInstance.confirmCrop();
  }
});
