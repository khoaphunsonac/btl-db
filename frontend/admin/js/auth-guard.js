/**
 * Authentication Guard for Admin Pages
 * Include this at the top of every admin page to protect it
 */

(function() {
    // Check if user is logged in and is admin
    const adminUserStr = localStorage.getItem('admin_user');
    
    if (!adminUserStr) {
        // Not logged in, redirect to login page
        window.location.href = '../index.html';
        return;
    }
    
    try {
        const user = JSON.parse(adminUserStr);
        
        // Check if user is admin
        if (user.role !== 'admin') {
            alert('Bạn không có quyền truy cập trang này');
            localStorage.removeItem('admin_user');
            localStorage.removeItem('admin_token');
            window.location.href = '../index.html';
            return;
        }
        
        // User is authenticated and is admin, allow access
        console.log('✅ Admin authenticated:', user.name || user.email);
        
    } catch (error) {
        console.error('Error parsing admin user data:', error);
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        window.location.href = '../index.html';
    }
})();
