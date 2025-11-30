/**
 * Discount Management - List Page
 * NEMTHUNG E-commerce Admin
 */

import apiClient from '../../js/api-client.js';
import { formatDateTime, showToast, showSuccess, showError, confirm } from '../../js/utils.js';

// State
let currentPage = 1;
let currentLimit = 2;
let currentFilters = {
    search: '',
    sortBy: 'id-desc'
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadDiscounts();
});

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Search
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    document.querySelector('input.form-control-sm')?.addEventListener('change', (e) => {
        currentLimit = parseInt(e.target.value) || 2;
        loadDiscounts();
    });

    // Add discount modal save button
    document.querySelector('#modal-add-discount .btn-primary')?.addEventListener('click', handleAddDiscount);
}

/**
 * Handle search
 */
function handleSearch() {
    currentFilters.search = document.getElementById('searchInput').value.trim();
    currentPage = 1;
    loadDiscounts();
}

/**
 * Load discounts
 */
async function loadDiscounts() {
    try {
        const params = {
            page: currentPage,
            limit: currentLimit,
        };
        if (currentFilters.search) params.search = currentFilters.search;
        if (currentFilters.sortBy) params.sortBy = currentFilters.sortBy;

        const response = await apiClient.get('discounts', params);

        if (response.success) {
            renderDiscountTable(response.data);
            renderPagination(response.pagination);
        } else {
            showError(response.message || 'Không thể tải danh sách mã giảm giá');
            renderEmptyTable();
        }
    } catch (error) {
        console.error('Error loading discounts:', error);
        showError('Lỗi khi tải danh sách mã giảm giá');
        renderEmptyTable();
    }
}

/**
 * Render discount table
 */
function renderDiscountTable(discounts) {
    const tbody = document.getElementById('discount-table-body');
    

    if (!discounts || discounts.length === 0) {
        renderEmptyTable();
        return;
    }

    tbody.innerHTML = discounts.map(d => `
        <tr>
            <td><strong>#${d.id}</strong></td>
            <td>${d.value}</td>
            <td>${d.condition}</td>
            <td>${formatDateTime(d.time_start)}</td>
            <td>${formatDateTime(d.time_end)}</td>
            <td>${d.type}</td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-ghost-primary" onclick="editDiscount(${d.id})" title="Chỉnh sửa">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn btn-ghost-warning" onclick="toggleDiscount(${d.id}, '${d.type}')" title="Bật/Tắt">
                        <i class="ti ti-power"></i>
                    </button>
                    <button class="btn btn-ghost-danger" onclick="deleteDiscount(${d.id})" title="Xóa">
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
    const tbody = document.getElementById('discount-table-body');
    tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center text-muted py-5">
                <i class="ti ti-discount-off" style="font-size: 3rem; opacity: 0.3;"></i>
                <p class="mt-3">Không có mã giảm giá nào</p>
            </td>
        </tr>
    `;
}

/**
 * Pagination
 */
function renderPagination(pagination) {
    const { current_page, total_pages } = pagination;

    const paginationEl = document.getElementById('pagination');

    const total_records = document.getElementById('total-records');
    const count_show = document.getElementById('count-show');

    if (total_pages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    total_records.innerHTML = pagination.total_items;
    count_show.innerHTML = pagination.per_page;

    const from = pagination.from;
    const to = pagination.to;

    const fromInt = parseInt(from);
    const toInt = parseInt(to);
    const count_show_int = toInt - fromInt + 1;
    count_show.innerHTML = count_show_int.toString();

    let html = '';
    // Previous
    html += `<li class="page-item ${current_page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${current_page - 1}); return false;">
                    <i class="ti ti-chevron-left"></i>
                </a>
            </li>`;

    const maxVisible = 5;
    let start = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let end = Math.min(total_pages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
                </li>`;
    }

    // Next
    html += `<li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${current_page + 1}); return false;">
                    <i class="ti ti-chevron-right"></i>
                </a>
            </li>`;

    paginationEl.innerHTML = html;
}

window.changePage = function(page) {
    currentPage = page;
    loadDiscounts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Add discount
 */
async function handleAddDiscount() {
    const value = document.getElementById("add-discount-value").value.trim();
    const condition = document.getElementById("add-discount-condition").value.trim();
    const time_start = document.getElementById("add-discount-start").value;
    const time_end = document.getElementById("add-discount-end").value;
    const type = document.getElementById("add-discount-type").value;

    if (!value || !condition || !time_start || !time_end) {
        showError('Vui lòng điền đầy đủ thông tin');
        return;
    }

    try {
        const response = await apiClient.post('discounts', {
            value,
            condition,
            time_start,
            time_end,
            type
        });

        if (response.success) {
            showSuccess('Đã thêm mã giảm giá thành công');
            loadDiscounts();

            // đóng modal
            const modal = document.getElementById('modal-add-discount');
            modal.querySelector('.btn-close').click();

        } else {
            showError(response.message || 'Không thể thêm mã giảm giá');
        }
    } catch (error) {
        console.error('Error adding discount:', error);
        showError('Lỗi khi thêm mã giảm giá');
    }
}

/**
 * Edit discount
 */
window.editDiscount = function(id) {
    window.location.href = `./edit.html?id=${id}`;
};

/**
 * Toggle discount (active/inactive)
 */
window.toggleDiscount = async function(id) {
    const confirmed = await confirm('Bạn có chắc muốn bật/tắt mã giảm giá này?');
    if (!confirmed) return;

    try {
        const response = await apiClient.put(`discounts/${id}/toggle`);
        if (response.success) {
            showSuccess('Đã cập nhật trạng thái mã giảm giá');
            loadDiscounts();
        } else {
            showError(response.message || 'Không thể cập nhật trạng thái');
        }
    } catch (error) {
        console.error('Error toggling discount:', error);
        showError('Lỗi khi cập nhật trạng thái');
    }
};

/**
 * Delete discount
 */
window.deleteDiscount = async function(id) {
    const confirmed = await confirm('Bạn có chắc muốn xóa mã giảm giá này?');
    if (!confirmed) return;

    try {
        const response = await apiClient.delete(`discounts/${id}`);
        if (response.success) {
            showSuccess('Đã xóa mã giảm giá');
            loadDiscounts();
        } else {
            showError(response.message || 'Không thể xóa mã giảm giá');
        }
    } catch (error) {
        console.error('Error deleting discount:', error);
        showError('Lỗi khi xóa mã giảm giá');
    }
};
