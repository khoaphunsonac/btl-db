export function AdminSidebar({ current = '' } = {}) {
  var items = [
    { 
      href: '../index.html', 
      key: 'dashboard', 
      label: 'Dashboard', 
      icon: 'ti ti-home',
      badge: null
    },
    {
      type: 'section',
      label: 'Quản lý Sản phẩm'
    },
    { 
      href: '../products/admin_products.html', 
      key: 'admin-products', 
      label: 'Danh sách Sản phẩm', 
      icon: 'ti ti-package' 
    },
    { 
      href: '../products/categories.html', 
      key: 'admin-categories', 
      label: 'Danh mục Sản phẩm', 
      icon: 'ti ti-folder' 
    },
    { 
      href: '../products/variants.html', 
      key: 'admin-variants', 
      label: 'Biến thể & Thuộc tính', 
      icon: 'ti ti-stack-2' 
    },
    {
      type: 'section',
      label: 'Quản lý Đơn hàng'
    },
    { 
      href: '../products/admin_orders.html', 
      key: 'admin-orders', 
      label: 'Tất cả Đơn hàng', 
      icon: 'ti ti-shopping-cart',
      badge: 'pending_orders'
    },
    { 
      href: '../products/admin_orders.html?status=pending', 
      key: 'admin-orders-pending', 
      label: 'Chờ xác nhận', 
      icon: 'ti ti-clock',
      badge: null
    },
    { 
      href: '../products/admin_orders.html?status=shipping', 
      key: 'admin-orders-shipping', 
      label: 'Đang giao hàng', 
      icon: 'ti ti-truck',
      badge: null
    },
    {
      type: 'section',
      label: 'Khách hàng & Marketing'
    },
    { 
      href: '../customers/index.html', 
      key: 'admin-customers', 
      label: 'Quản lý Khách hàng', 
      icon: 'ti ti-users' 
    },
    { 
      href: '../discounts/index.html', 
      key: 'admin-discounts', 
      label: 'Mã Giảm giá', 
      icon: 'ti ti-ticket' 
    },
    { 
      href: '../ratings/index.html', 
      key: 'admin-ratings', 
      label: 'Đánh giá Sản phẩm', 
      icon: 'ti ti-star' 
    },
    {
      type: 'section',
      label: 'Hỗ trợ & Báo cáo'
    },
    { 
      href: '../contact/index.html', 
      key: 'admin-contact', 
      label: 'Yêu cầu Liên hệ', 
      icon: 'ti ti-mail',
      badge: 'pending_contacts'
    },
    { 
      href: '../reports/index.html', 
      key: 'admin-reports', 
      label: 'Báo cáo & Thống kê', 
      icon: 'ti ti-chart-bar' 
    },
    {
      type: 'section',
      label: 'Hệ thống'
    },
    { 
      href: '../settings/index.html', 
      key: 'settings', 
      label: 'Cài đặt', 
      icon: 'ti ti-settings' 
    },
  ];

  if (current === 'dashboard') {
    items = items.map(item => ({
      ...item,
      href: item.href ? item.href.replace(/^\.\.\//, '') : undefined
    }));
  }

  const links = items
    .map((item) => {
      if (item.type === 'section') {
        return `
          <li class="nav-item dropdown-header">
            ${item.label}
          </li>
        `;
      }
      
      const { href, key, label, icon, badge } = item;
      const badgeHtml = badge ? `<span class="badge badge-sm bg-red ms-auto" id="badge-${badge}">0</span>` : '';
      
      return `
        <li class="nav-item${current === key ? ' active' : ''}">
          <a class="nav-link" href="${href}">
            <span class="nav-link-icon d-md-none d-lg-inline-block"><i class="${icon}"></i></span>
            <span class="nav-link-title">${label}</span>
            ${badgeHtml}
          </a>
        </li>
      `;
    })
    .join('');

  // Get user info from localStorage
  let userInfoHtml = '';
  try {
    const userStr = localStorage.getItem('admin_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      
      // Role color mapping for Vietnamese roles
      const roleColors = {
        'Quản trị viên': 'bg-red',
        'Nhân viên kho': 'bg-blue',
        'admin': 'bg-red',
        'staff': 'bg-blue'
      };
      
      // Get role color
      const roleColor = roleColors[user.role] || 'bg-secondary';
      
      // Display name
      const displayName = user.name || (user.fname && user.lname ? `${user.fname} ${user.lname}` : user.email?.split('@')[0] || 'Admin');
      
      // Settings link - adjust based on current page
      const settingsPath = current === 'dashboard' ? 'settings/index.html' : '../settings/index.html';
      
      userInfoHtml = `
        <div class="nav-item px-3 py-3 border-bottom" style="background: rgba(255,255,255,0.03);">
          <div class="d-flex align-items-center mb-3">
            <div class="avatar avatar-md rounded-circle me-3" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.25rem; width: 40px; height: 40px;">
              ${displayName.charAt(0).toUpperCase()}
            </div>
            <div class="flex-fill" style="min-width: 0;">
              <div class="text-white fw-bold text-truncate" style="font-size: 0.95rem;">${displayName}</div>
              <div class="text-muted small text-truncate" style="font-size: 0.8rem;">${user.email || ''}</div>
            </div>
          </div>
          <div class="d-flex gap-2 align-items-center">
            <span class="badge ${roleColor} flex-fill text-center text-white" style="padding: 6px 10px; font-size: 0.75rem; font-weight: 600;">
              <i class="ti ti-shield-check me-1"></i>${user.role}
            </span>
            <button class="btn btn-sm" onclick="window.location.href='${settingsPath}'" title="Cài đặt tài khoản" style="padding: 6px 10px; background: rgba(255,255,255,0.1); color: white; border: none; transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
              <i class="ti ti-settings" style="font-size: 1rem;"></i>
            </button>
            <button class="btn btn-sm" onclick="logoutAdmin()" title="Đăng xuất" style="padding: 6px 10px; background: rgba(220,38,38,0.2); color: #fca5a5; border: none; transition: all 0.2s;" onmouseover="this.style.background='rgba(220,38,38,0.3)'; this.style.color='#fff'" onmouseout="this.style.background='rgba(220,38,38,0.2)'; this.style.color='#fca5a5'">
              <i class="ti ti-logout" style="font-size: 1rem;"></i>
            </button>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading user info:', error);
  }

  return `
    <aside class="navbar navbar-vertical navbar-expand-lg navbar-dark fixed-sidebar">
      <div class="container-fluid">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#sidebar-menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <h1 class="navbar-brand navbar-brand-autodark">
          <a href="../index.html">
            <i class="ti ti-package" style="font-size: 1.5rem; color: #3b82f6;"></i>
            <span class="text-white ms-2">NEMTHUNG Admin</span>
          </a>
        </h1>
        <div class="collapse navbar-collapse" id="sidebar-menu">
          ${userInfoHtml}
          <ul class="navbar-nav pt-lg-3">
            ${links}
          </ul>
        </div>
      </div>
    </aside>
  `;
}

export function mountAdminSidebar(containerSelector, current) {
  const container = typeof containerSelector === 'string'
    ? document.querySelector(containerSelector)
    : containerSelector;
  if (!container) return;
  container.innerHTML = AdminSidebar({ current });
  
  // Load badge counts after mounting
  loadBadgeCounts();
}

// Load badge counts from API
async function loadBadgeCounts() {
  try {
    const API_URL = window.ENV?.API_URL || 'http://localhost/btl-db/backend';
    const response = await fetch(`${API_URL}/api/statistics/dashboard`);
    const data = await response.json();
    
    if (data.success) {
      // Update pending orders badge
      const pendingOrdersBadge = document.getElementById('badge-pending_orders');
      if (pendingOrdersBadge && data.data.pending_orders > 0) {
        pendingOrdersBadge.textContent = data.data.pending_orders;
        pendingOrdersBadge.style.display = 'inline-block';
      }
      
      // Update pending contacts badge
      const pendingContactsBadge = document.getElementById('badge-pending_contacts');
      if (pendingContactsBadge && data.data.pending_contacts > 0) {
        pendingContactsBadge.textContent = data.data.pending_contacts;
        pendingContactsBadge.style.display = 'inline-block';
      }
    }
  } catch (error) {
    console.error('Failed to load badge counts:', error);
  }
}

// Refresh badge counts every 30 seconds
setInterval(loadBadgeCounts, 30000);

/**
 * Logout function for admin
 */
window.logoutAdmin = async function() {
  if (!confirm('Bạn có chắc chắn muốn đăng xuất?')) {
    return;
  }
  
  try {
    // Call logout API
    const API_URL = window.ENV?.API_URL || 'http://localhost/btl-db/backend';
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
      }
    });
  } catch (error) {
    console.error('Logout API error:', error);
  }
  
  // Clear local storage
  localStorage.removeItem('admin_user');
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_remember');
  
  // Redirect to login page (frontend/index.html)
  // Check current location to determine correct path
  const currentPath = window.location.pathname;
  if (currentPath.includes('/admin/') && !currentPath.includes('/admin/index.html')) {
    // From admin subpages: go up two levels
    window.location.href = '../../index.html';
  } else {
    // From admin/index.html: go up one level
    window.location.href = '../index.html';
  }
};
