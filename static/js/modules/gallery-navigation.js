/**
 * Gallery Navigation Module
 * @module GalleryNavigation
 */

class GalleryNavigation {
  constructor() {
    this.elements = null;
    this.isInitialized = false;
    this.lightbox = null;
  }

  /**
   * Initialize the gallery navigation module
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
      prevButton: document.querySelector('.lightbox-nav.prev'),
      nextButton: document.querySelector('.lightbox-nav.next')
    };
  }

  /**
   * Validate required elements exist
   */
  validateElements() {
    if (!this.elements.prevButton) {
      return false;
    }
    if (!this.elements.nextButton) {
      return false;
    }
    return true;
  }

  /**
   * Bind event listeners
   */
  bindEvents() {
    if (this.elements.prevButton) {
      this.elements.prevButton.addEventListener('click', () => {
        this.handlePrevious();
      });
    }

    if (this.elements.nextButton) {
      this.elements.nextButton.addEventListener('click', () => {
        this.handleNext();
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
   * Handle previous button click
   */
  handlePrevious() {
    if (this.lightbox) {
      this.lightbox.previous();
    }
  }

  /**
   * Handle next button click
   */
  handleNext() {
    if (this.lightbox) {
      this.lightbox.next();
    }
  }

  /**
   * Update navigation button states
   */
  updateButtonStates() {
    if (!this.lightbox) return;

    const totalImages = this.lightbox.getTotalImages();
    const currentIndex = this.lightbox.getCurrentIndex();

    // Update button visibility based on image count
    if (totalImages <= 1) {
      this.elements.prevButton.style.display = 'none';
      this.elements.nextButton.style.display = 'none';
    } else {
      this.elements.prevButton.style.display = 'block';
      this.elements.nextButton.style.display = 'block';
    }

    // Update button states for single image
    if (totalImages === 1) {
      this.elements.prevButton.disabled = true;
      this.elements.nextButton.disabled = true;
    } else {
      this.elements.prevButton.disabled = false;
      this.elements.nextButton.disabled = false;
    }
  }

  /**
   * Show navigation buttons
   */
  show() {
    if (this.elements.prevButton) {
      this.elements.prevButton.style.display = 'block';
    }
    if (this.elements.nextButton) {
      this.elements.nextButton.style.display = 'block';
    }
  }

  /**
   * Hide navigation buttons
   */
  hide() {
    if (this.elements.prevButton) {
      this.elements.prevButton.style.display = 'none';
    }
    if (this.elements.nextButton) {
      this.elements.nextButton.style.display = 'none';
    }
  }
}

// Export for use in main application
window.GalleryNavigation = GalleryNavigation;


