/**
 * Image Lightbox Module
 * @module ImageLightbox
 */

class ImageLightbox {
  constructor() {
    this.elements = null;
    this.isInitialized = false;
    this.currentImageIndex = 0;
    this.images = [];
  }

  /**
   * Initialize the lightbox module
   */
  init() {
    if (this.isInitialized) return;
    
    this.getElements();
    this.validateElements();
    this.bindEvents();
    this.isInitialized = true;
  }

  /**
   * Get and cache DOM elements
   */
  getElements() {
    this.elements = {
      lightbox: document.getElementById('image-lightbox'),
      lightboxImage: document.getElementById('lightbox-image'),
      lightboxCaption: document.getElementById('lightbox-caption'),
      lightboxCounter: document.getElementById('lightbox-counter')
    };
  }

  /**
   * Validate required elements exist
   */
  validateElements() {
    if (!this.elements.lightbox) {
      return false;
    }
    if (!this.elements.lightboxImage) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (!this.elements.lightbox) return;

    // Close lightbox when clicking outside
    this.elements.lightbox.addEventListener('click', (e) => {
      if (e.target === this.elements.lightbox) {
        this.close();
      }
    });
  }

  /**
   * Set the images array
   * @param {Array} images - Array of image objects
   */
  setImages(images) {
    this.images = images || [];
  }

  /**
   * Open lightbox with specific image index
   * @param {number} index - Index of image to display
   */
  open(index) {
    if (this.images.length === 0) return;
    
    this.currentImageIndex = index;
    this.updateDisplay();
    
    this.elements.lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close the lightbox
   */
  close() {
    this.elements.lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  /**
   * Navigate to previous image
   */
  previous() {
    if (this.images.length === 0) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.images.length) % this.images.length;
    this.updateDisplay();
  }

  /**
   * Navigate to next image
   */
  next() {
    if (this.images.length === 0) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    this.updateDisplay();
  }

  /**
   * Update lightbox display with current image
   */
  updateDisplay() {
    if (this.images.length === 0) return;
    
    const currentImage = this.images[this.currentImageIndex];
    
    this.elements.lightboxImage.src = currentImage.url;
    this.elements.lightboxImage.alt = currentImage.caption;
    
    if (this.elements.lightboxCaption) {
      this.elements.lightboxCaption.textContent = currentImage.caption;
    }
    
    if (this.elements.lightboxCounter) {
      this.elements.lightboxCounter.textContent = `${this.currentImageIndex + 1} of ${this.images.length}`;
    }
  }

  /**
   * Get current image index
   * @returns {number} Current image index
   */
  getCurrentIndex() {
    return this.currentImageIndex;
  }

  /**
   * Get total number of images
   * @returns {number} Total number of images
   */
  getTotalImages() {
    return this.images.length;
  }

  /**
   * Check if lightbox is open
   * @returns {boolean} True if lightbox is open
   */
  isOpen() {
    return this.elements.lightbox.style.display === 'flex';
  }
}

// Export for use in main application
window.ImageLightbox = ImageLightbox;


