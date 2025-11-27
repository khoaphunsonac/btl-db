/**
 * SIDEBAR FIX - Đảm bảo sidebar luôn hiển thị đúng 
 * Áp dụng inline style và MutationObserver để override CSS
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initial fix
    applyNavbarFix();
    
    // Setup observer to fix DOM changes
    const sidebarElem = document.querySelector('.fixed-sidebar');
    if (sidebarElem) {
        const observer = new MutationObserver(function(mutations) {
            applyNavbarFix();
        });
        
        // Observe all changes to the sidebar and its children
        observer.observe(sidebarElem, { 
            childList: true, 
            subtree: true, 
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
    
    // Add window load event for extra safety
    window.addEventListener('load', applyNavbarFix);
    
    // Add periodic check for really stubborn menus
    setInterval(applyNavbarFix, 1000);
});

// Function to apply fixes to all navbar elements
function applyNavbarFix() {
    // Ensure all sidebar links are visible
    const navItems = document.querySelectorAll('.fixed-sidebar .nav-item, .fixed-sidebar .nav-link');
    navItems.forEach(item => {
        item.style.setProperty('opacity', '1', 'important');
        item.style.setProperty('visibility', 'visible', 'important');
        item.style.setProperty('display', item.classList.contains('nav-item') ? 'block' : 'flex', 'important');
        item.style.setProperty('pointer-events', 'auto', 'important');
    });
    
    // Make all text and icons white and visible
    const navElements = document.querySelectorAll('.fixed-sidebar .nav-link-title, .fixed-sidebar .nav-link-icon, .fixed-sidebar .nav-link i, .fixed-sidebar .nav-link span');
    navElements.forEach(el => {
        el.style.setProperty('color', '#ffffff', 'important');
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('pointer-events', 'auto', 'important');
    });
    
    // Add hover event listeners
    const navLinks = document.querySelectorAll('.fixed-sidebar .nav-link');
    navLinks.forEach(link => {
        if (!link.dataset.hoverListenerAdded) {
            link.addEventListener('mouseenter', function() {
                this.style.setProperty('background-color', 'rgba(32, 107, 196, 0.3)', 'important');
            });
            link.addEventListener('mouseleave', function() {
                if (!this.classList.contains('active')) {
                    this.style.removeProperty('background-color');
                }
            });
            link.dataset.hoverListenerAdded = 'true';
        }
    });
}

