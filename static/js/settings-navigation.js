/**
 * Settings Navigation - Handle sidebar navigation clicks to jump to sections
 */

class SettingsNavigation {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Wait a bit for all other scripts to load, then take control
        setTimeout(() => {
            this.takeControlOfNavigation();
        }, 800); // Increased timeout to ensure SettingsManager loads first
    }

    takeControlOfNavigation() {
        console.log('Taking control of settings navigation...');
        
        // First, clear all existing active classes
        this.clearAllActiveStates();
        
        // Find all settings navigation links
        const navLinks = document.querySelectorAll('.settings-nav-link');
        console.log('Found', navLinks.length, 'settings navigation links');
        
        // Remove all existing event listeners and add our own
        navLinks.forEach((link, index) => {
            // Clone the element to remove all event listeners
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            // Add our own click handler
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Get section ID
                const sectionId = newLink.getAttribute('data-section') || newLink.getAttribute('href').replace('#', '');
                
                console.log('Direct navigation to section:', sectionId);
                
                // Clear all active states first
                this.clearAllActiveStates();
                
                // Set only this one as active
                newLink.classList.add('active');
                
                // Disable SettingsManager observer temporarily if available
                if (window.settingsManager && window.settingsManager.isNavigating !== undefined) {
                    window.settingsManager.isNavigating = true;
                }
                
                // Direct scroll
                this.directScrollToSection(sectionId);
                
                // Re-enable observer after scroll
                setTimeout(() => {
                    if (window.settingsManager && window.settingsManager.isNavigating !== undefined) {
                        window.settingsManager.isNavigating = false;
                    }
                }, 1000);
            });
        });
        
        // Set initial active state (Basic Info)
        setTimeout(() => {
            this.clearAllActiveStates();
            const firstLink = document.querySelector('.settings-nav-link[data-section="basic-settings"]');
            if (firstLink) {
                firstLink.classList.add('active');
            }
        }, 100);
        
        console.log('Settings Navigation: Took control successfully');
    }

    clearAllActiveStates() {
        // Remove active class from all navigation links
        document.querySelectorAll('.settings-nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        console.log('Cleared all active states');
    }

    navigateToSection(link) {
        // Remove active class from all links
        document.querySelectorAll('.settings-nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });

        // Add active class to clicked link
        link.classList.add('active');

        // Get the target section ID from the link
        const targetSection = this.getSectionTarget(link);
        
        if (targetSection) {
            console.log('Navigating to section:', targetSection);
            this.scrollToSection(targetSection);
        }
    }

    getSectionTarget(link) {
        // Get section from data-section attribute or extract main title only
        const dataSection = link.getAttribute('data-section');
        if (dataSection) {
            console.log('Using data-section attribute:', dataSection);
            return dataSection;
        }

        // Extract only the main title (first line) from link text
        const fullText = link.textContent.trim();
        const mainTitle = link.querySelector('.nav-title')?.textContent.trim() || fullText.split('\n')[0].trim();
        
        const sectionMap = {
            'Basic Info': 'basic-settings',
            'Contact': 'contact-settings',
            'Location': 'location-settings',
            'Leadership': 'leadership-settings',
            'Media': 'media-settings',
            'Services': 'services-settings',
            'Social Media': 'social-settings',
            'Preferences': 'preferences-settings',
            'Decline Reasons': 'decline-reasons-settings',
            'Verification': 'verification-settings'
        };

        console.log('Looking for section for link:', mainTitle, 'mapped to:', sectionMap[mainTitle]);
        return sectionMap[mainTitle] || null;
    }

    scrollToSection(sectionId) {
        const settingsContent = document.querySelector('.settings-content');
        const targetSection = document.getElementById(sectionId);

        if (settingsContent && targetSection) {
            // Calculate the position relative to the settings content container
            const containerRect = settingsContent.getBoundingClientRect();
            const sectionRect = targetSection.getBoundingClientRect();
            const scrollTop = settingsContent.scrollTop;
            
            // Calculate target scroll position
            const targetScrollTop = scrollTop + (sectionRect.top - containerRect.top) - 20; // 20px offset

            // Smooth scroll to the section
            settingsContent.scrollTo({
                top: targetScrollTop,
                behavior: 'smooth'
            });

            console.log('Scrolled to section:', sectionId, 'at position:', targetScrollTop);
        } else {
            console.warn('Section not found:', sectionId);
        }
    }

    scrollToSectionSimple(sectionId) {
        const targetSection = document.getElementById(sectionId);
        const settingsContent = document.querySelector('.settings-content');
        
        if (targetSection && settingsContent) {
            // Get position of section relative to settings content
            const sectionTop = targetSection.offsetTop;
            
            // Scroll to position with smooth behavior
            settingsContent.scrollTo({
                top: sectionTop - 20, // 20px offset for better visual spacing
                behavior: 'smooth'
            });
            
            console.log('Scrolled to section:', sectionId, 'at position:', sectionTop);
        } else {
            console.warn('Section or settings content not found:', sectionId);
        }
    }

    directScrollToSection(sectionId) {
        const targetSection = document.getElementById(sectionId);
        const settingsContent = document.querySelector('.settings-content');
        
        console.log('Looking for:', sectionId);
        console.log('Target section found:', !!targetSection);
        console.log('Settings content found:', !!settingsContent);
        
        if (targetSection && settingsContent) {
            // Calculate exact position
            const sectionTop = targetSection.offsetTop;
            console.log('Section top position:', sectionTop);
            
            // Force immediate scroll
            settingsContent.scrollTop = sectionTop - 20;
            
            console.log('Scrolled directly to:', sectionId, 'at position:', sectionTop);
            
            // Also try smooth scroll as backup
            setTimeout(() => {
                settingsContent.scrollTo({
                    top: sectionTop - 20,
                    behavior: 'smooth'
                });
            }, 100);
        } else {
            console.error('Could not find section or settings content for:', sectionId);
        }
    }

    // Public method to navigate to a specific section programmatically
    goToSection(sectionId) {
        this.scrollToSection(sectionId);
        
        // Update active state based on section
        document.querySelectorAll('.settings-nav-link').forEach(link => {
            const linkSection = this.getSectionTarget(link);
            if (linkSection === sectionId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

// TEMPORARILY DISABLED TO FIX MULTIPLE HIGHLIGHTS ISSUE
// Auto-initialize
// const settingsNavigation = new SettingsNavigation();

// Make it available globally
// window.settingsNavigation = settingsNavigation;

console.log('Settings Navigation: DISABLED to prevent conflicts with main SettingsManager');
