/**
 * Utility Functions for NEMTHUNG E-commerce
 * Common helper functions for frontend
 */

/**
 * Format currency in Vietnamese Dong
 */
export function formatCurrency(amount) {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Format currency compact (K, M, B)
 */
export function formatCurrencyCompact(amount) {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  if (amount >= 1000000000) {
    return (amount / 1000000000).toFixed(1) + 'B đ';
  } else if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M đ';
  } else if (amount >= 1000) {
    return (amount / 1000).toFixed(1) + 'K đ';
  }
  
  return formatCurrency(amount);
}

/**
 * Format date to Vietnamese format
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };
  
  return new Intl.DateTimeFormat('vi-VN', defaultOptions).format(date);
}

/**
 * Format datetime to Vietnamese format
 */
export function formatDateTime(dateString) {
  if (!dateString) return '';
  
  return formatDate(dateString, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Vừa xong';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  } else {
    return formatDate(dateString);
  }
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Show toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="ti ti-${getIconForType(type)}"></i>
      <span>${message}</span>
    </div>
  `;
  
  // Add to container
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  container.appendChild(toast);
  
  // Show toast
  setTimeout(() => toast.classList.add('show'), 100);
  
  // Remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Get icon for toast type
 */
function getIconForType(type) {
  const icons = {
    success: 'check-circle',
    error: 'x-circle',
    warning: 'alert-triangle',
    info: 'info-circle'
  };
  return icons[type] || 'info-circle';
}

/**
 * Show success message
 */
export function showSuccess(message) {
  showToast(message, 'success');
}

/**
 * Show error message
 */
export function showError(message) {
  showToast(message, 'error');
}

/**
 * Show warning message
 */
export function showWarning(message) {
  showToast(message, 'warning');
}

/**
 * Show info message
 */
export function showInfo(message) {
  showToast(message, 'info');
}

/**
 * Confirm dialog
 */
export function confirm(message, title = 'Xác nhận') {
  return new Promise((resolve) => {
    if (window.confirm(message)) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

/**
 * Get query parameters from URL
 */
export function getQueryParams() {
  const params = {};
  const searchParams = new URLSearchParams(window.location.search);
  
  for (const [key, value] of searchParams) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Update query parameters in URL
 */
export function updateQueryParams(params) {
  const url = new URL(window.location);
  
  Object.keys(params).forEach(key => {
    if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
      url.searchParams.set(key, params[key]);
    } else {
      url.searchParams.delete(key);
    }
  });
  
  window.history.pushState({}, '', url);
}

/**
 * Validate email
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone number (Vietnamese)
 */
export function isValidPhone(phone) {
  const re = /^(0|\+84)[0-9]{9,10}$/;
  return re.test(phone);
}

/**
 * Truncate text
 */
export function truncate(text, length = 100, suffix = '...') {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + suffix;
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('Đã sao chép vào clipboard');
    return true;
  } catch (error) {
    showError('Không thể sao chép');
    return false;
  }
}

/**
 * Generate random ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sleep/delay function
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!localStorage.getItem('auth_token');
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Logout user
 */
export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user');
  window.location.href = '/admin/login.html';
}

/**
 * Get order status badge class
 */
export function getOrderStatusClass(status) {
  const classes = {
    pending: 'badge-warning',
    confirmed: 'badge-info',
    shipping: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-danger'
  };
  return classes[status] || 'badge-secondary';
}

/**
 * Get order status label
 */
export function getOrderStatusLabel(status) {
  const labels = {
    pending: 'Chờ xử lý',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  };
  return labels[status] || status;
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Render pagination
 */
export function renderPagination(container, currentPage, totalPages, onPageChange) {
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '<ul class="pagination">';
  
  // Previous button
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage - 1}">
        <i class="ti ti-chevron-left"></i> Trước
      </a>
    </li>
  `;
  
  // Page numbers
  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
  }
  
  // Next button
  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}">
        Sau <i class="ti ti-chevron-right"></i>
      </a>
    </li>
  `;
  
  html += '</ul>';
  
  container.innerHTML = html;
  
  // Add click handlers
  container.querySelectorAll('a[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(link.dataset.page);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
      }
    });
  });
}

// Export all as default object as well
export default {
  formatCurrency,
  formatCurrencyCompact,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  debounce,
  throttle,
  showToast,
  showSuccess,
  showError,
  showWarning,
  showInfo,
  confirm,
  getQueryParams,
  updateQueryParams,
  isValidEmail,
  isValidPhone,
  truncate,
  escapeHtml,
  copyToClipboard,
  generateId,
  sleep,
  isAuthenticated,
  getCurrentUser,
  logout,
  getOrderStatusClass,
  getOrderStatusLabel,
  formatFileSize,
  renderPagination
};
