/**
 * Customer Management - List Page
 * NEMTHUNG E-commerce Admin
 */

import apiClient from '../../js/api-client.js';
import { formatDate, formatDateTime, showToast, showSuccess, showError, confirm } from '../../js/utils.js';

// State
let currentPage = 1;
let currentLimit = 10;
let currentFilters = {
    search: '',
    status: '',
    sortBy: 'id-desc'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadCustomers();
    loadStatistics();
});

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Add button
    document.getElementById('btnAdd')?.addEventListener('click', () => {
        window.location.href = './edit.html';
    });

    // Search
    document.getElementById('btnSearch')?.addEventListener('click', handleSearch);
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Filters
    document.getElementById('filterStatus')?.addEventListener('change', handleFilterChange);
    document.getElementById('sortBy')?.addEventListener('change', handleFilterChange);
    document.getElementById('limitSelect')?.addEventListener('change', (e) => {
        currentLimit = parseInt(e.target.value);
        currentPage = 1;
        loadCustomers();
    });
}

/**
 * Load customers with filters and pagination
 */
async function loadCustomers() {
    try {
        // Build params object, only include non-empty values
        const params = {
            page: currentPage,
            limit: currentLimit
        };
        
        // Add filters only if they have values
        if (currentFilters.search) {
            params.search = currentFilters.search;
        }
        if (currentFilters.status) {
            params.status = currentFilters.status;
        }
        if (currentFilters.sortBy) {
            params.sortBy = currentFilters.sortBy;
        }

        console.log('Loading customers with params:', params); // Debug log

        const response = await apiClient.get('users', params);
        
        if (response.success) {
            renderCustomerTable(response.data);
            renderPagination(response.pagination);
        } else {
            showError(response.message || 'Không thể tải danh sách khách hàng');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showError('Lỗi khi tải danh sách khách hàng');
        renderEmptyTable();
    }
}

/**
 * Load statistics
 */
async function loadStatistics() {
    try {
        const response = await apiClient.get('users/statistics');
        
        if (response.success) {
            const stats = response.data;
            document.getElementById('stat-total').textContent = stats.total || 0;
            document.getElementById('stat-active').textContent = stats.active || 0;
            document.getElementById('stat-inactive').textContent = stats.inactive || 0;
            document.getElementById('stat-new').textContent = stats.new_this_month || 0;
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
        // Set default values
        document.getElementById('stat-total').textContent = '0';
        document.getElementById('stat-active').textContent = '0';
        document.getElementById('stat-inactive').textContent = '0';
        document.getElementById('stat-new').textContent = '0';
    }
}

/**
 * Render customer table
 */
function renderCustomerTable(customers) {
    const tbody = document.getElementById('customerTableBody');
    
    if (!customers || customers.length === 0) {
        renderEmptyTable();
        return;
    }

    tbody.innerHTML = customers.map(customer => `
        <tr>
            <td><strong>#${customer.id}</strong></td>
            <td>
                <div><strong>${escapeHtml(customer.fname)} ${escapeHtml(customer.lname)}</strong></div>
                <div class="customer-email">${escapeHtml(customer.email)}</div>
            </td>
            <td class="customer-phone">${escapeHtml(customer.phone || '-')}</td>
            <td>
                <span class="text-muted" title="${escapeHtml(customer.address || '-')}">
                    ${truncateText(customer.address || '-', 40)}
                </span>
            </td>
            <td>
                ${renderStatusBadge(customer.status)}
            </td>
            <td>
                <small class="text-muted">${formatDateTime(customer.last_login)}</small>
            </td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-ghost-info" onclick="viewCustomer(${customer.id})" title="Xem chi tiết">
                        <i class="ti ti-eye"></i>
                    </button>
                    <button class="btn btn-ghost-primary" onclick="editCustomer(${customer.id})" title="Chỉnh sửa">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn btn-ghost-warning" onclick="toggleStatus(${customer.id}, '${customer.status}')" 
                            title="${customer.status === 'Hoạt động' ? 'Vô hiệu hóa' : 'Kích hoạt'}">
                        <i class="ti ti-${customer.status === 'Hoạt động' ? 'lock' : 'lock-open'}"></i>
                    </button>
                    <button class="btn btn-ghost-danger" onclick="deleteCustomer(${customer.id})" title="Xóa">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Render empty table
 */
function renderEmptyTable() {
    const tbody = document.getElementById('customerTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted py-5">
                <i class="ti ti-users-off" style="font-size: 3rem; opacity: 0.3;"></i>
                <p class="mt-3">Không có khách hàng nào</p>
            </td>
        </tr>
    `;
}

/**
 * Render status badge
 */
function renderStatusBadge(status) {
    const badgeClass = status === 'Hoạt động' ? 'bg-green' : 'bg-red';
    const icon = status === 'Hoạt động' ? 'check' : 'x';
    
    return `<span class="badge ${badgeClass} status-badge text-white">
        <i class="ti ti-${icon}"></i> ${status}
    </span>`;
}

/**
 * Render pagination
 */
function renderPagination(pagination) {
    const { current_page, total_pages, total_items, from, to } = pagination;
    
    // Update showing text
    document.getElementById('showingFrom').textContent = from || 0;
    document.getElementById('showingTo').textContent = to || 0;
    document.getElementById('totalRecords').textContent = total_items || 0;
    
    // Generate pagination buttons
    const paginationEl = document.getElementById('pagination');
    if (total_pages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    html += `
        <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${current_page - 1}); return false;">
                <i class="ti ti-chevron-left"></i> Trước
            </a>
        </li>
    `;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let endPage = Math.min(total_pages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    if (startPage > 1) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(1); return false;">1</a></li>`;
        if (startPage > 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <li class="page-item ${i === current_page ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>
        `;
    }
    
    if (endPage < total_pages) {
        if (endPage < total_pages - 1) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(${total_pages}); return false;">${total_pages}</a></li>`;
    }
    
    // Next button
    html += `
        <li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${current_page + 1}); return false;">
                Sau <i class="ti ti-chevron-right"></i>
            </a>
        </li>
    `;
    
    paginationEl.innerHTML = html;
}

/**
 * Handle search
 */
function handleSearch() {
    currentFilters.search = document.getElementById('searchInput').value.trim();
    currentPage = 1;
    loadCustomers();
}

/**
 * Handle filter change
 */
function handleFilterChange() {
    currentFilters.status = document.getElementById('filterStatus').value;
    currentFilters.sortBy = document.getElementById('sortBy').value;
    currentPage = 1;
    loadCustomers();
}

/**
 * Change page
 */
window.changePage = function(page) {
    currentPage = page;
    loadCustomers();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * View customer detail
 */
window.viewCustomer = function(id) {
    window.location.href = `./detail.html?id=${id}`;
};

/**
 * Edit customer
 */
window.editCustomer = function(id) {
    window.location.href = `./edit.html?id=${id}`;
};

/**
 * Toggle customer status
 */
window.toggleStatus = async function(id, currentStatus) {
    const newStatus = currentStatus === 'Hoạt động' ? 'Ngưng hoạt động' : 'Hoạt động';
    const action = newStatus === 'Hoạt động' ? 'kích hoạt' : 'vô hiệu hóa';
    
    const confirmed = await confirm(`Bạn có chắc muốn ${action} khách hàng này?`);
    if (!confirmed) return;
    
    try {
        const response = await apiClient.put(`users/${id}/status`, { status: newStatus });
        
        if (response.success) {
            showSuccess(`Đã ${action} khách hàng thành công`);
            loadCustomers();
            loadStatistics();
        } else {
            showError(response.message || `Không thể ${action} khách hàng`);
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        showError(`Lỗi khi ${action} khách hàng`);
    }
};

/**
 * Delete customer
 */
window.deleteCustomer = async function(id) {
    const confirmed = await confirm(
        'Bạn có chắc muốn xóa khách hàng này?\nLưu ý: Không thể xóa khách hàng có đơn hàng đang xử lý.'
    );
    if (!confirmed) return;
    
    try {
        const response = await apiClient.delete(`users/${id}`);
        
        if (response.success) {
            showSuccess('Đã xóa khách hàng thành công');
            loadCustomers();
            loadStatistics();
        } else {
            showError(response.message || 'Không thể xóa khách hàng');
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        showError('Lỗi khi xóa khách hàng');
    }
};

/**
 * Utility functions
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}
