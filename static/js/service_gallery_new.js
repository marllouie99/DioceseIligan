/**
 * Service Gallery System
 * Main coordinator for service gallery functionality
 */

class ServiceGallerySystem {
  constructor() {
    this.modules = {
      lightbox: null,
      navigation: null,
      events: null
    };
    this.isInitialized = false;
  }

  /**
   * Initialize the service gallery system
   */
  init() {
    if (this.isInitialized) return;

    try {
      this.initializeModules();
      this.setupModuleConnections();
      this.setupImageData();
      this.setupImageClickHandlers();
      this.isInitialized = true;
      
      } catch (error) {
      }
  }

  /**
   * Initialize all modules
   */
  initializeModules() {
    // Initialize lightbox module
    if (window.ImageLightbox) {
      this.modules.lightbox = new window.ImageLightbox();
      this.modules.lightbox.init();
    }

    // Initialize navigation module
    if (window.GalleryNavigation) {
      this.modules.navigation = new window.GalleryNavigation();
      this.modules.navigation.init();
    }

    // Initialize events module
    if (window.GalleryEvents) {
      this.modules.events = new window.GalleryEvents();
      this.modules.events.init();
    }
  }

  /**
   * Setup connections between modules
   */
  setupModuleConnections() {
    // Connect navigation to lightbox
    if (this.modules.navigation && this.modules.lightbox) {
      this.modules.navigation.setLightbox(this.modules.lightbox);
    }

    // Connect events to lightbox and navigation
    if (this.modules.events) {
      if (this.modules.lightbox) {
        this.modules.events.setLightbox(this.modules.lightbox);
      }
      if (this.modules.navigation) {
        this.modules.events.setNavigation(this.modules.navigation);
      }
    }
  }

  /**
   * Setup image data from Django template
   */
  setupImageData() {
    if (!this.modules.lightbox) return;

    // Get images data from global variable or template
    const images = window.galleryImages || [];
    this.modules.lightbox.setImages(images);
  }

  /**
   * Setup image click handlers
   */
  setupImageClickHandlers() {
    if (this.modules.events) {
      this.modules.events.setupImageClickHandlers();
    }
  }

  /**
   * Get lightbox instance
   * @returns {ImageLightbox|null} Lightbox instance
   */
  getLightbox() {
    return this.modules.lightbox;
  }

  /**
   * Get navigation instance
   * @returns {GalleryNavigation|null} Navigation instance
   */
  getNavigation() {
    return this.modules.navigation;
  }

  /**
   * Get events instance
   * @returns {GalleryEvents|null} Events instance
   */
  getEvents() {
    return this.modules.events;
  }

  /**
   * Open lightbox with specific image
   * @param {number} index - Image index
   */
  openLightbox(index) {
    if (this.modules.lightbox) {
      this.modules.lightbox.open(index);
    }
  }

  /**
   * Close lightbox
   */
  closeLightbox() {
    if (this.modules.lightbox) {
      this.modules.lightbox.close();
    }
  }

  /**
   * Navigate to previous image
   */
  previousImage() {
    if (this.modules.lightbox) {
      this.modules.lightbox.previous();
    }
  }

  /**
   * Navigate to next image
   */
  nextImage() {
    if (this.modules.lightbox) {
      this.modules.lightbox.next();
    }
  }

  /**
   * Get current image index
   * @returns {number} Current image index
   */
  getCurrentImageIndex() {
    return this.modules.lightbox ? this.modules.lightbox.getCurrentIndex() : 0;
  }

  /**
   * Get total number of images
   * @returns {number} Total number of images
   */
  getTotalImages() {
    return this.modules.lightbox ? this.modules.lightbox.getTotalImages() : 0;
  }

  /**
   * Check if lightbox is open
   * @returns {boolean} True if lightbox is open
   */
  isLightboxOpen() {
    return this.modules.lightbox ? this.modules.lightbox.isOpen() : false;
  }
}

// Global functions for backward compatibility
let serviceGallerySystem = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  serviceGallerySystem = new ServiceGallerySystem();
  serviceGallerySystem.init();
});

// Expose global functions for template compatibility
window.openLightbox = function(index) {
  if (serviceGallerySystem) {
    serviceGallerySystem.openLightbox(index);
  }
};

window.closeLightbox = function() {
  if (serviceGallerySystem) {
    serviceGallerySystem.closeLightbox();
  }
};

window.previousImage = function() {
  if (serviceGallerySystem) {
    serviceGallerySystem.previousImage();
  }
};

window.nextImage = function() {
  if (serviceGallerySystem) {
    serviceGallerySystem.nextImage();
  }
};

// Export for use in other modules
window.ServiceGallerySystem = ServiceGallerySystem;


