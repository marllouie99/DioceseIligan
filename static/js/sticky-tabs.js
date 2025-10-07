/**
 * Sticky Tabs functionality for Manage Church page
 * Makes the tabs navigation sticky when scrolling
 */

class StickyTabs {
    constructor() {
        this.tabsNav = null;
        this.tabsContainer = null;
        this.spacer = null;
        this.settingsSidebar = null;
        this.sidebarOriginalOffsetTop = 0;
        this.sidebarOriginalLeft = 0;
        this.originalOffsetTop = 0;
        this.isSticky = false;
        this.isSidebarSticky = false;
        this.useContainerSticky = false; // Use CSS sticky within page container when available
        
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
        // Find the tabs navigation element
        this.tabsNav = document.querySelector('.tabs-nav');
        this.tabsContainer = document.querySelector('.tabs-container');
        this.settingsSidebar = document.querySelector('.settings-sidebar');
        // Detect Manage Church page container to switch to container-aware sticky
        this.useContainerSticky = !!document.querySelector('.manage-church-page');
        
        // console.log('StickyTabs: Setup called');
        // console.log('StickyTabs: Found elements:', {
        //     tabsNav: !!this.tabsNav,
        //     tabsContainer: !!this.tabsContainer,
        //     settingsSidebar: !!this.settingsSidebar
        // });
        
        if (!this.tabsNav || !this.tabsContainer) {
            console.log('StickyTabs: Required elements not found');
            return;
        }

        // Create and insert spacer element
        this.createSpacer();
        
        // Calculate the original offset position
        this.calculateOffsetTop();
        
        // Bind scroll event
        this.bindScrollEvent();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.calculateOffsetTop();
            this.handleScroll();
        });

        console.log('StickyTabs: Initialized successfully');
        console.log('Settings sidebar found:', !!this.settingsSidebar);
        
        // Start periodic check for settings sidebar
        this.startSidebarCheck();
    }

    createSpacer() {
        // Create a spacer div to prevent content jumping
        this.spacer = document.createElement('div');
        this.spacer.className = 'sticky-spacer';
        
        // Insert the spacer right before the tabs nav
        this.tabsNav.parentNode.insertBefore(this.spacer, this.tabsNav);
    }

    calculateOffsetTop() {
        // Calculate when the tabs should become sticky
        const rect = this.tabsNav.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        this.originalOffsetTop = rect.top + scrollTop;
        
        // console.log('StickyTabs: Calculated offset:', {
        //     rectTop: rect.top,
        //     scrollTop: scrollTop,
        //     originalOffsetTop: this.originalOffsetTop
        // });
        
        // If tabs are already near the top, make them sticky immediately
        if (this.originalOffsetTop <= 60) {
            console.log('StickyTabs: Tabs are already near top, making sticky immediately');
            setTimeout(() => this.makeSticky(), 100);
        }
        
        // Also calculate sidebar position if it exists
        if (this.settingsSidebar) {
            const sidebarRect = this.settingsSidebar.getBoundingClientRect();
            this.sidebarOriginalOffsetTop = sidebarRect.top + scrollTop;
            this.sidebarOriginalLeft = sidebarRect.left;
            // console.log('Sidebar original position:', { top: this.sidebarOriginalOffsetTop, left: this.sidebarOriginalLeft });
        }
    }

    bindScrollEvent() {
        // Use throttled scroll event for better performance
        let ticking = false;
        
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', onScroll, { passive: true });
    }

    handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const shouldBeSticky = scrollTop > this.originalOffsetTop;
        
        // Debug logging disabled for production performance
        // Enable only when debugging: window.stickyTabsDebug = true
        if (window.stickyTabsDebug && scrollTop % 100 === 0) {
            console.log('StickyTabs: Scroll debug:', {
                scrollTop: scrollTop,
                originalOffsetTop: this.originalOffsetTop,
                shouldBeSticky: shouldBeSticky,
                isSticky: this.isSticky
            });
        }
        
        // Sidebar debug logging also disabled for performance
        if (window.stickyTabsDebug && this.settingsSidebar && scrollTop % 100 === 0) {
            console.log(`Scroll: ${scrollTop}, SidebarOffset: ${this.sidebarOriginalOffsetTop}, IsSticky: ${this.isSidebarSticky}`);
        }

        // Handle main tabs
        if (shouldBeSticky && !this.isSticky) {
            this.makeSticky();
        } else if (!shouldBeSticky && this.isSticky) {
            this.removeSticky();
        }
        
        // Update sidebar position when main tabs change state
        if (this.settingsSidebar && this.isSidebarSticky) {
            if (this.isSticky) {
                this.settingsSidebar.classList.add('tabs-are-sticky');
            } else {
                this.settingsSidebar.classList.remove('tabs-are-sticky');
            }
        }
        
        // Settings sidebar navigation is now handled by settings-navigation.js
    }

    makeSticky() {
        if (this.isSticky) return;

        console.log('StickyTabs: Making tabs sticky');
        
        // Container-aware mode: rely on CSS sticky scoped to .manage-church-page
        if (this.useContainerSticky) {
            // Add class only; CSS handles position: sticky and top offset
            this.tabsNav.classList.add('sticky');
            // Ensure no conflicting inline styles
            this.tabsNav.style.position = '';
            this.tabsNav.style.top = '';
            this.tabsNav.style.left = '';
            this.tabsNav.style.right = '';
            this.tabsNav.style.zIndex = '';
            // No spacer needed when using CSS sticky within container
            this.spacer && this.spacer.classList.remove('active');
            this.isSticky = true;
            this.dispatchEvent('stickyTabsActivated');
            return;
        }

        // Default behavior (non-container pages): use fixed positioning
        this.tabsNav.classList.add('sticky');
        this.tabsNav.style.position = 'fixed';
        this.tabsNav.style.top = '60px';
        this.tabsNav.style.left = '0';
        this.tabsNav.style.right = '0';
        this.tabsNav.style.zIndex = '1000';
        // Activate spacer to prevent content jump
        this.spacer.classList.add('active');
        
        // Main tabs sticky behavior only
        
        // Mark as sticky
        this.isSticky = true;
        
        // Add smooth transition
        this.tabsNav.style.transform = 'translateY(-10px)';
        requestAnimationFrame(() => {
            this.tabsNav.style.transform = 'translateY(0)';
        });

        // Dispatch custom event
        this.dispatchEvent('stickyTabsActivated');
    }

    removeSticky() {
        if (!this.isSticky) return;

        // Container-aware mode: clear class and ensure no inline overrides
        if (this.useContainerSticky) {
            this.tabsNav.classList.remove('sticky');
            this.tabsNav.style.position = '';
            this.tabsNav.style.top = '';
            this.tabsNav.style.left = '';
            this.tabsNav.style.right = '';
            this.tabsNav.style.zIndex = '';
            // Spacer remains inactive in container mode
            this.spacer && this.spacer.classList.remove('active');
            this.isSticky = false;
            this.dispatchEvent('stickyTabsDeactivated');
            return;
        }

        // Default behavior: reset fixed positioning and spacer
        this.tabsNav.classList.remove('sticky');
        this.tabsNav.style.position = '';
        this.tabsNav.style.top = '';
        this.tabsNav.style.left = '';
        this.tabsNav.style.right = '';
        this.tabsNav.style.zIndex = '';
        this.spacer.classList.remove('active');
        
        // Main tabs unsticky behavior only
        
        // Mark as not sticky
        this.isSticky = false;

        // Dispatch custom event
        this.dispatchEvent('stickyTabsDeactivated');
    }

    makeSidebarSticky() {
        if (!this.settingsSidebar || this.isSidebarSticky) return;

        console.log('Making sidebar sticky - using simple approach');
        
        // Just ensure the sidebar has proper sticky positioning
        this.settingsSidebar.style.position = 'sticky';
        this.settingsSidebar.style.top = '20px';
        this.settingsSidebar.style.zIndex = '999';
        
        this.isSidebarSticky = true;
    }

    removeSidebarSticky() {
        if (!this.settingsSidebar || !this.isSidebarSticky) return;

        console.log('Removing sidebar sticky');
        
        // Reset to normal
        this.settingsSidebar.style.position = 'static';
        this.settingsSidebar.style.top = '';
        this.settingsSidebar.style.zIndex = '';
        
        this.isSidebarSticky = false;
    }

    startSidebarCheck() {
        // Check every 500ms if settings sidebar exists and needs to be made sticky
        setInterval(() => {
            const settingsTab = document.getElementById('settings');
            if (settingsTab && settingsTab.classList.contains('active')) {
                // Settings tab is active, ensure sidebar is detected
                if (!this.settingsSidebar) {
                    this.settingsSidebar = document.querySelector('.settings-sidebar');
                    if (this.settingsSidebar) {
                        console.log('Sidebar detected via periodic check');
                        // Calculate position immediately
                        const rect = this.settingsSidebar.getBoundingClientRect();
                        this.sidebarOriginalLeft = rect.left;
                        console.log('Sidebar position set:', { left: this.sidebarOriginalLeft });
                    }
                }
                
                // If sidebar exists and not already sticky, make it sticky
                if (this.settingsSidebar && !this.isSidebarSticky) {
                    console.log('Making sidebar sticky via periodic check');
                    this.makeSidebarSticky();
                }
            }
        }, 500);
    }

    dispatchEvent(eventName) {
        const event = new CustomEvent(eventName, {
            detail: {
                tabsNav: this.tabsNav,
                isSticky: this.isSticky
            }
        });
        document.dispatchEvent(event);
    }

    // Public method to recalculate offset (useful after dynamic content changes)
    recalculate() {
        this.calculateOffsetTop();
        // Re-find settings sidebar in case it was just loaded
        this.settingsSidebar = document.querySelector('.settings-sidebar');
        this.handleScroll();
    }

    // Public method to temporarily disable sticky behavior
    disable() {
        this.removeSticky();
        window.removeEventListener('scroll', this.handleScroll);
    }

    // Public method to enable sticky behavior
    enable() {
        this.bindScrollEvent();
        this.handleScroll();
    }
}

// Auto-initialize when script loads
const stickyTabs = new StickyTabs();

// Make it available globally for debugging or external control
window.stickyTabs = stickyTabs;

// Listen for tab changes to ensure proper sticky behavior
document.addEventListener('click', (e) => {
    if (e.target.matches('.tab-btn') || e.target.closest('.tab-btn')) {
        const tabBtn = e.target.matches('.tab-btn') ? e.target : e.target.closest('.tab-btn');
        const isSettingsTab = tabBtn.dataset.tab === 'settings';
        
        // Small delay to ensure tab content has loaded
        setTimeout(() => {
            if (isSettingsTab) {
                console.log('Settings tab clicked, re-detecting sidebar');
                // Re-detect settings sidebar since it might have just been loaded
                stickyTabs.settingsSidebar = document.querySelector('.settings-sidebar');
                console.log('Settings sidebar after re-detection:', !!stickyTabs.settingsSidebar);
                
                // Recalculate sidebar position when settings tab is active
                if (stickyTabs.settingsSidebar) {
                    const sidebarRect = stickyTabs.settingsSidebar.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    stickyTabs.sidebarOriginalOffsetTop = sidebarRect.top + scrollTop;
                    stickyTabs.sidebarOriginalLeft = sidebarRect.left;
                    console.log('Recalculated sidebar position:', { 
                        top: stickyTabs.sidebarOriginalOffsetTop, 
                        left: stickyTabs.sidebarOriginalLeft 
                    });
                }
            }
            stickyTabs.recalculate();
        }, 300); // Even longer delay to ensure settings content is loaded
    }
});
