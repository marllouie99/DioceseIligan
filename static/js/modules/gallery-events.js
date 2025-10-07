/**
 * Gallery Events Module
 * @module GalleryEvents
 */

class GalleryEvents {
  constructor() {
    this.elements = null;
    this.isInitialized = false;
    this.lightbox = null;
    this.navigation = null;
  }

  /**
   * Initialize the gallery events module
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
      closeButton: document.querySelector('.lightbox-close')
    };
  }

  /**
   * Validate required elements exist
   */
  validateElements() {
    if (!this.elements.lightbox) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      this.handleKeydown(e);
    });

    // Close button click
    if (this.elements.closeButton) {
      this.elements.closeButton.addEventListener('click', () => {
        this.handleClose();
      });
    }
  }

  /**
   * Set the lightbox reference
   * @param {ImageLightbox} lightbox - Lightbox instance
   */
  setLightbox(lightbox) {
    this.lightbox = lightbox;
  }

  /**
   * Set the navigation reference
   * @param {GalleryNavigation} navigation - Navigation instance
   */
  setNavigation(navigation) {
    this.navigation = navigation;
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeydown(e) {
    if (!this.lightbox || !this.lightbox.isOpen()) return;

    switch (e.key) {
      case 'Escape':
        this.handleClose();
        break;
      case 'ArrowLeft':
        this.handlePrevious();
        break;
      case 'ArrowRight':
        this.handleNext();
        break;
    }
  }

  /**
   * Handle close action
   */
  handleClose() {
    if (this.lightbox) {
      this.lightbox.close();
    }
  }

  /**
   * Handle previous image
   */
  handlePrevious() {
    if (this.lightbox) {
      this.lightbox.previous();
    }
  }

  /**
   * Handle next image
   */
  handleNext() {
    if (this.lightbox) {
      this.lightbox.next();
    }
  }

  /**
   * Handle image click to open lightbox
   * @param {number} index - Image index
   */
  handleImageClick(index) {
    if (this.lightbox) {
      this.lightbox.open(index);
    }
  }

  /**
   * Setup image click handlers for gallery images
   */
  setupImageClickHandlers() {
    const galleryImages = document.querySelectorAll('.gallery-image');
    
    galleryImages.forEach((image, index) => {
      image.addEventListener('click', () => {
        this.handleImageClick(index);
      });
    });
  }

  /**
   * Remove event listeners (cleanup)
   */
  destroy() {
    // Remove keyboard event listener
    document.removeEventListener('keydown', this.handleKeydown);
    
    // Remove close button listener
    if (this.elements.closeButton) {
      this.elements.closeButton.removeEventListener('click', this.handleClose);
    }
  }
}

// Export for use in main application
window.GalleryEvents = GalleryEvents;


