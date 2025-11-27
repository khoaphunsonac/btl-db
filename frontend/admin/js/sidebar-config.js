/**
 * Sidebar Configuration for Papyrus Admin Dashboard
 * 
 * Cấu hình menu sidebar cho hệ thống quản trị
 */

const sidebarConfig = {
    sections: [
        {
            title: 'Dashboard',
            icon: 'layout-dashboard',
            items: [
                {
                    id: 'dashboard',
                    label: 'Tổng quan',
                    icon: 'home',
                    url: '/admin/dashboard.html',
                    badge: null
                }
            ]
        },
        {
            title: 'Quản lý Sản phẩm',
            icon: 'package',
            items: [
                {
                    id: 'products',
                    label: 'Danh sách Sản phẩm',
                    icon: 'package',
                    url: '/admin/products/index.html',
                    badge: null
                },
                {
                    id: 'products-add',
                    label: 'Thêm Sản phẩm',
                    icon: 'plus-circle',
                    url: '/admin/products/add.html',
                    badge: null
                },
                {
                    id: 'product-variants',
                    label: 'Biến thể Sản phẩm',
                    icon: 'layers',
                    url: '/admin/products/variants.html',
                    badge: null
                },
                {
                    id: 'product-attributes',
                    label: 'Thuộc tính',
                    icon: 'tag',
                    url: '/admin/products/attributes.html',
                    badge: null
                }
            ]
        },
        {
            title: 'Quản lý Danh mục',
            icon: 'folder',
            items: [
                {
                    id: 'categories',
                    label: 'Danh mục Sản phẩm',
                    icon: 'folder-tree',
                    url: '/admin/categories/index.html',
                    badge: null
                },
                {
                    id: 'categories-add',
                    label: 'Thêm Danh mục',
                    icon: 'folder-plus',
                    url: '/admin/categories/add.html',
                    badge: null
                }
            ]
        },
        {
            title: 'Quản lý Đơn hàng',
            icon: 'shopping-cart',
            items: [
                {
                    id: 'orders',
                    label: 'Tất cả Đơn hàng',
                    icon: 'shopping-bag',
                    url: '/admin/orders/index.html',
                    badge: {
                        type: 'pending',
                        count: 0,
                        apiEndpoint: '/api/statistics/dashboard'
                    }
                },
                {
                    id: 'orders-pending',
                    label: 'Chờ xác nhận',
                    icon: 'clock',
                    url: '/admin/orders/index.html?status=pending',
                    badge: {
                        type: 'warning',
                        count: 0,
                        apiEndpoint: '/api/statistics/dashboard'
                    }
                },
                {
                    id: 'orders-confirmed',
                    label: 'Đã xác nhận',
                    icon: 'check-circle',
                    url: '/admin/orders/index.html?status=confirmed',
                    badge: null
                },
                {
                    id: 'orders-shipping',
                    label: 'Đang giao hàng',
                    icon: 'truck',
                    url: '/admin/orders/index.html?status=shipping',
                    badge: null
                },
                {
                    id: 'orders-completed',
                    label: 'Đã hoàn thành',
                    icon: 'check-square',
                    url: '/admin/orders/index.html?status=completed',
                    badge: null
                },
                {
                    id: 'orders-cancelled',
                    label: 'Đã hủy',
                    icon: 'x-circle',
                    url: '/admin/orders/index.html?status=cancelled',
                    badge: null
                }
            ]
        },
        {
            title: 'Quản lý Khách hàng',
            icon: 'users',
            items: [
                {
                    id: 'customers',
                    label: 'Danh sách Khách hàng',
                    icon: 'users',
                    url: '/admin/customers/index.html',
                    badge: null
                },
                {
                    id: 'customers-active',
                    label: 'Khách hàng Hoạt động',
                    icon: 'user-check',
                    url: '/admin/customers/index.html?status=active',
                    badge: null
                },
                {
                    id: 'customers-inactive',
                    label: 'Khách hàng Ngưng hoạt động',
                    icon: 'user-x',
                    url: '/admin/customers/index.html?status=inactive',
                    badge: null
                }
            ]
        },
        {
            title: 'Khuyến mãi & Giảm giá',
            icon: 'percent',
            items: [
                {
                    id: 'discounts',
                    label: 'Mã Giảm giá',
                    icon: 'ticket',
                    url: '/admin/discounts/index.html',
                    badge: null
                },
                {
                    id: 'discounts-add',
                    label: 'Tạo Mã Giảm giá',
                    icon: 'plus-square',
                    url: '/admin/discounts/add.html',
                    badge: null
                },
                {
                    id: 'discounts-active',
                    label: 'Mã Đang hoạt động',
                    icon: 'zap',
                    url: '/admin/discounts/index.html?status=active',
                    badge: null
                },
                {
                    id: 'discounts-expired',
                    label: 'Mã Đã hết hạn',
                    icon: 'calendar-x',
                    url: '/admin/discounts/index.html?status=expired',
                    badge: null
                }
            ]
        },
        {
            title: 'Đánh giá & Nhận xét',
            icon: 'star',
            items: [
                {
                    id: 'ratings',
                    label: 'Tất cả Đánh giá',
                    icon: 'star',
                    url: '/admin/ratings/index.html',
                    badge: null
                },
                {
                    id: 'ratings-pending',
                    label: 'Chờ duyệt',
                    icon: 'alert-circle',
                    url: '/admin/ratings/index.html?status=pending',
                    badge: {
                        type: 'info',
                        count: 0
                    }
                }
            ]
        },
        {
            title: 'Liên hệ & Hỗ trợ',
            icon: 'message-square',
            items: [
                {
                    id: 'contacts',
                    label: 'Yêu cầu Liên hệ',
                    icon: 'mail',
                    url: '/admin/contacts/index.html',
                    badge: {
                        type: 'danger',
                        count: 0
                    }
                },
                {
                    id: 'contacts-pending',
                    label: 'Chờ xử lý',
                    icon: 'inbox',
                    url: '/admin/contacts/index.html?status=pending',
                    badge: null
                },
                {
                    id: 'contacts-resolved',
                    label: 'Đã xử lý',
                    icon: 'check',
                    url: '/admin/contacts/index.html?status=resolved',
                    badge: null
                }
            ]
        },
        {
            title: 'Báo cáo & Thống kê',
            icon: 'bar-chart',
            items: [
                {
                    id: 'reports-revenue',
                    label: 'Doanh thu',
                    icon: 'dollar-sign',
                    url: '/admin/reports/revenue.html',
                    badge: null
                },
                {
                    id: 'reports-products',
                    label: 'Sản phẩm Bán chạy',
                    icon: 'trending-up',
                    url: '/admin/reports/products.html',
                    badge: null
                },
                {
                    id: 'reports-categories',
                    label: 'Theo Danh mục',
                    icon: 'pie-chart',
                    url: '/admin/reports/categories.html',
                    badge: null
                },
                {
                    id: 'reports-customers',
                    label: 'Khách hàng',
                    icon: 'user-plus',
                    url: '/admin/reports/customers.html',
                    badge: null
                }
            ]
        },
        {
            title: 'Hệ thống',
            icon: 'settings',
            items: [
                {
                    id: 'users-admin',
                    label: 'Quản trị viên',
                    icon: 'shield',
                    url: '/admin/users/index.html',
                    badge: null
                },
                {
                    id: 'settings',
                    label: 'Cài đặt',
                    icon: 'settings',
                    url: '/admin/settings/index.html',
                    badge: null
                },
                {
                    id: 'logs',
                    label: 'Nhật ký Hệ thống',
                    icon: 'file-text',
                    url: '/admin/logs/index.html',
                    badge: null
                }
            ]
        }
    ]
};

/**
 * Initialize sidebar with configuration
 */
function initializeSidebar() {
    const sidebarContainer = document.getElementById('sidebar-menu');
    if (!sidebarContainer) return;
    
    let html = '';
    
    sidebarConfig.sections.forEach(section => {
        html += `
            <div class="sidebar-section">
                <div class="sidebar-section-title">
                    <i data-lucide="${section.icon}"></i>
                    <span>${section.title}</span>
                </div>
                <ul class="sidebar-menu">
        `;
        
        section.items.forEach(item => {
            const badgeHtml = item.badge ? 
                `<span class="badge badge-${item.badge.type}">${item.badge.count}</span>` : '';
            
            html += `
                <li class="sidebar-menu-item" data-item-id="${item.id}">
                    <a href="${item.url}" class="sidebar-link">
                        <i data-lucide="${item.icon}"></i>
                        <span>${item.label}</span>
                        ${badgeHtml}
                    </a>
                </li>
            `;
        });
        
        html += `
                </ul>
            </div>
        `;
    });
    
    sidebarContainer.innerHTML = html;
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Highlight active menu item
    highlightActiveMenuItem();
    
    // Load badge counts
    loadBadgeCounts();
}

/**
 * Highlight active menu item based on current URL
 */
function highlightActiveMenuItem() {
    const currentPath = window.location.pathname + window.location.search;
    const menuItems = document.querySelectorAll('.sidebar-menu-item');
    
    menuItems.forEach(item => {
        const link = item.querySelector('.sidebar-link');
        const href = link.getAttribute('href');
        
        if (currentPath.includes(href) || (href !== '/' && currentPath === href)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

/**
 * Load badge counts from API
 */
async function loadBadgeCounts() {
    try {
        const response = await fetch('/api/statistics/dashboard');
        const data = await response.json();
        
        if (data.success) {
            // Update pending orders badge
            updateBadge('orders-pending', data.data.pending_orders);
            
            // Update other badges as needed
            // updateBadge('contacts', data.data.pending_contacts);
        }
    } catch (error) {
        console.error('Failed to load badge counts:', error);
    }
}

/**
 * Update badge count
 */
function updateBadge(itemId, count) {
    const menuItem = document.querySelector(`[data-item-id="${itemId}"]`);
    if (!menuItem) return;
    
    const badge = menuItem.querySelector('.badge');
    if (badge && count > 0) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
    } else if (badge && count === 0) {
        badge.style.display = 'none';
    }
}

/**
 * Toggle sidebar collapse on mobile
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSidebar();
    
    // Refresh badge counts every 30 seconds
    setInterval(loadBadgeCounts, 30000);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sidebarConfig, initializeSidebar };
}
