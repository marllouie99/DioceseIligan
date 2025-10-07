/**
 * Hero Carousel - Landing Page Interactive Slides
 * Handles slide transitions, touch gestures, and auto-play
 */

class HeroCarousel {
  constructor() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll('.hero-slide');
    this.dots = document.querySelectorAll('.dot');
    this.prevBtn = document.getElementById('prevSlide');
    this.nextBtn = document.getElementById('nextSlide');
    this.totalSlides = this.slides.length;
    this.autoPlayInterval = null;
    this.autoPlayDelay = 5000; // 5 seconds
    
    this.init();
  }

  init() {
    if (this.slides.length === 0) return;
    
    this.setupEventListeners();
    this.setupTouchGestures();
    this.startAutoPlay();
    
    // Initialize first slide
    this.goToSlide(0);
  }

  setupEventListeners() {
    // Navigation buttons
    this.prevBtn?.addEventListener('click', () => this.previousSlide());
    this.nextBtn?.addEventListener('click', () => this.nextSlide());
    
    // Dot navigation
    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goToSlide(index));
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.previousSlide();
      if (e.key === 'ArrowRight') this.nextSlide();
    });
    
    // Pause auto-play on hover
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
      heroContent.addEventListener('mouseenter', () => this.pauseAutoPlay());
      heroContent.addEventListener('mouseleave', () => this.startAutoPlay());
    }
  }

  setupTouchGestures() {
    const carousel = document.querySelector('.hero-carousel');
    if (!carousel) return;
    
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    carousel.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
      this.pauseAutoPlay();
    }, { passive: true });
    
    carousel.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;
      
      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        e.preventDefault();
      }
    }, { passive: false });
    
    carousel.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      
      const endX = e.changedTouches[0].clientX;
      const diffX = startX - endX;
      const threshold = 50;
      
      if (Math.abs(diffX) > threshold) {
        if (diffX > 0) {
          this.nextSlide();
        } else {
          this.previousSlide();
        }
      }
      
      isDragging = false;
      this.startAutoPlay();
    }, { passive: true });
  }

  goToSlide(index) {
    // Remove active classes
    this.slides.forEach(slide => {
      slide.classList.remove('active', 'prev');
    });
    this.dots.forEach(dot => dot.classList.remove('active'));
    
    // Add prev class to current slide for exit animation
    if (this.slides[this.currentSlide]) {
      this.slides[this.currentSlide].classList.add('prev');
    }
    
    // Update current slide
    this.currentSlide = index;
    
    // Add active classes
    this.slides[this.currentSlide].classList.add('active');
    if (this.dots[this.currentSlide]) {
      this.dots[this.currentSlide].classList.add('active');
    }
    
    // Clean up prev class after animation
    setTimeout(() => {
      this.slides.forEach(slide => slide.classList.remove('prev'));
    }, 300);
  }

  nextSlide() {
    const next = (this.currentSlide + 1) % this.totalSlides;
    this.goToSlide(next);
  }

  previousSlide() {
    const prev = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
    this.goToSlide(prev);
  }

  startAutoPlay() {
    this.pauseAutoPlay();
    this.autoPlayInterval = setInterval(() => {
      this.nextSlide();
    }, this.autoPlayDelay);
  }

  pauseAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
    }
  }

  // Public method to stop auto-play permanently
  stopAutoPlay() {
    this.pauseAutoPlay();
  }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HeroCarousel();
});

// Re-initialize if needed (for SPA navigation)
window.HeroCarousel = HeroCarousel;
