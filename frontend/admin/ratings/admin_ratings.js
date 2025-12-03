/**
 * Admin Ratings Management
 */

import apiClient from '../../js/api-client.js';

class AdminRatings {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filters = {
            search: '',
            star: '',
            sort: 'date-desc'
        };
        this.init();
    }

    async init() {
        await this.loadStats();
        await this.loadRatings();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        const btnSearch = document.getElementById('btnSearch');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadRatings();
                }, 500);
            });
        }

        if (btnSearch) {
            btnSearch.addEventListener('click', () => {
                this.filters.search = searchInput.value;
                this.currentPage = 1;
                this.loadRatings();
            });
        }

        // Star filter
        const starFilter = document.getElementById('starFilter');
        if (starFilter) {
            starFilter.addEventListener('change', (e) => {
                this.filters.star = e.target.value;
                this.currentPage = 1;
                this.loadRatings();
            });
        }

        // Sort filter
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.filters.sort = e.target.value;
                this.currentPage = 1;
                this.loadRatings();
            });
        }

        // Limit filter  
        const limitSelect = document.getElementById('limitSelect');
        if (limitSelect) {
            limitSelect.addEventListener('change', (e) => {
                this.itemsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.loadRatings();
            });
        }
    }

    async loadStats() {
        try {
            const response = await apiClient.get('ratings/stats');
            if (response.success) {
                this.displayStats(response.data);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    displayStats(stats) {
        document.getElementById('total-ratings').textContent = stats.total_ratings || 0;
        document.getElementById('average-rating').textContent = 
            stats.average_star ? parseFloat(stats.average_star).toFixed(1) : '0.0';
        document.getElementById('five-star-count').textContent = stats.five_star || 0;
        document.getElementById('one-star-count').textContent = stats.one_star || 0;
    }

    async loadRatings() {
        this.showLoading();
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.filters
            });

            const response = await apiClient.get(`ratings?${params}`);
            
            if (response.success) {
                this.displayRatings(response.data);
                this.displayPagination(response.pagination);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error loading ratings:', error);
            this.showToast('Không thể tải danh sách đánh giá', 'error');
        } finally {
            this.hideLoading();
        }
    }

    displayRatings(ratings) {
        const tbody = document.getElementById('ratingsTableBody');
        
        if (!ratings || ratings.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="ti ti-inbox fa-2x mb-2"></i><br>
                        Không có đánh giá nào
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = ratings.map(rating => `
            <tr>
                <td><span class="badge bg-secondary">${rating.id}</span></td>
                <td>
                    <div>
                        <strong>${rating.product_name}</strong>
                        <div class="text-muted small">${rating.trademark}</div>
                    </div>
                </td>
                <td>${rating.customer_name}</td>
                <td>
                    <div class="d-flex align-items-center">
                        ${this.renderStars(rating.star)}
                        <span class="ms-2 badge bg-${this.getStarColor(rating.star)}">${rating.star}/5</span>
                    </div>
                </td>
                <td>
                    <div class="text-truncate" style="max-width: 200px;" title="${this.escapeHtml(rating.comment_content)}">
                        ${this.truncateText(rating.comment_content, 50)}
                    </div>
                </td>
                <td>
                    <span class="text-muted">${this.formatDateTime(rating.date)}</span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-info" onclick="viewDetail(${rating.id})" title="Xem chi tiết">
                            <i class="ti ti-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="editRating(${rating.id})" title="Sửa đánh giá">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteRating(${rating.id})" title="Xóa đánh giá">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getStarColor(star) {
        if (star >= 5) return 'success';
        if (star >= 4) return 'primary'; 
        if (star >= 3) return 'warning';
        if (star >= 2) return 'orange';
        return 'danger';
    }

    renderStars(rating) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(`<i class="ti ti-star-filled rating-stars ${i <= rating ? '' : 'empty'}"></i>`);
        }
        return stars.join('');
    }

    async viewDetail(ratingId) {
        // Navigate to detail page
        window.location.href = `./detail.html?id=${ratingId}`;
    }

    showDetailModal(rating) {
        // Legacy modal method - keeping for backwards compatibility
        const content = document.getElementById('ratingDetailContent');
        content.innerHTML = `
            <div class="rating-detail">
                <div class="row mb-3">
                    <div class="col-sm-3 fw-bold">ID:</div>
                    <div class="col-sm-9">#${rating.id}</div>
                </div>
                <div class="row mb-3">
                    <div class="col-sm-3 fw-bold">Đánh giá:</div>
                    <div class="col-sm-9">
                        <div class="rating-badge rating-${rating.star}">
                            ${this.renderStars(rating.star)}
                            <span>${rating.star}/5</span>
                        </div>
                    </div>
                </div>
                <div class="row mb-4">
                    <div class="col-sm-3 fw-bold">Ngày:</div>
                    <div class="col-sm-9">${this.formatDateTime(rating.date)}</div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header">
                        <h4 class="card-title"><i class="ti ti-box me-2"></i> Sản phẩm</h4>
                    </div>
                    <div class="card-body">
                        <div class="row mb-2">
                            <div class="col-sm-3 fw-bold">Tên:</div>
                            <div class="col-sm-9">${rating.product_name}</div>
                        </div>
                        <div class="row">
                            <div class="col-sm-3 fw-bold">Thương hiệu:</div>
                            <div class="col-sm-9">${rating.trademark}</div>
                        </div>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header">
                        <h4 class="card-title"><i class="ti ti-user me-2"></i> Khách hàng</h4>
                    </div>
                    <div class="card-body">
                        <div class="row mb-2">
                            <div class="col-sm-3 fw-bold">Tên:</div>
                            <div class="col-sm-9">${rating.customer_name}</div>
                        </div>
                        ${rating.phone ? `
                            <div class="row mb-2">
                                <div class="col-sm-3 fw-bold">SĐT:</div>
                                <div class="col-sm-9">${rating.phone}</div>
                            </div>
                        ` : ''}
                        ${rating.address ? `
                            <div class="row">
                                <div class="col-sm-3 fw-bold">Địa chỉ:</div>
                                <div class="col-sm-9">${rating.address}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h4 class="card-title"><i class="ti ti-message me-2"></i> Nội dung đánh giá</h4>
                    </div>
                    <div class="card-body">
                        <div class="alert alert-info mb-0">
                            ${this.escapeHtml(rating.comment_content)}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Show modal (if still needed)
        const modal = new bootstrap.Modal(document.getElementById('ratingDetailModal'));
        modal.show();
    }

    async deleteRating(ratingId) {
        if (!confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
            return;
        }

        try {
            const response = await apiClient.delete(`ratings/${ratingId}?is_admin=true`);
            
            if (response.success) {
                this.showToast('Xóa đánh giá thành công', 'success');
                await this.loadRatings();
                await this.loadStats();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Error deleting rating:', error);
            this.showToast('Không thể xóa đánh giá', 'error');
        }
    }

    editRating(ratingId) {
        window.location.href = `./edit.html?id=${ratingId}`;
    }

    displayPagination(pagination) {
        const paginationContainer = document.getElementById('pagination');
        const showingFrom = document.getElementById('showingFrom');
        const showingTo = document.getElementById('showingTo');
        const totalRecords = document.getElementById('totalRecords');

        // Safety check for pagination object
        if (!pagination) {
            if (showingFrom) showingFrom.textContent = '0';
            if (showingTo) showingTo.textContent = '0';
            if (totalRecords) totalRecords.textContent = '0';
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        // Update pagination info
        if (showingFrom && showingTo && totalRecords) {
            const total = pagination.total || 0;
            const currentPage = pagination.current_page || 1;
            const perPage = pagination.per_page || this.itemsPerPage;
            
            const from = total > 0 ? ((currentPage - 1) * perPage) + 1 : 0;
            const to = Math.min(currentPage * perPage, total);
            
            showingFrom.textContent = from;
            showingTo.textContent = to;
            totalRecords.textContent = total;
        }
        
        const totalPages = pagination.total_pages || 0;
        if (!paginationContainer || totalPages <= 1) {
            if (paginationContainer) paginationContainer.innerHTML = '';
            return;
        }

        let paginationHtml = '';
        
        // Previous button
        if (pagination.has_prev) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="goToPage(${pagination.current_page - 1}); return false;">
                        <i class="ti ti-chevron-left"></i> Trước
                    </a>
                </li>
            `;
        } else {
            paginationHtml += `
                <li class="page-item disabled">
                    <span class="page-link"><i class="ti ti-chevron-left"></i> Trước</span>
                </li>
            `;
        }

        // Page numbers
        const startPage = Math.max(1, pagination.current_page - 2);
        const endPage = Math.min(totalPages, pagination.current_page + 2);

        if (startPage > 1) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="goToPage(1); return false;">1</a>
                </li>
            `;
            if (startPage > 2) {
                paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <li class="page-item ${i === pagination.current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHtml += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">
                        ${totalPages}
                    </a>
                </li>
            `;
        }

        // Next button
        if (pagination.has_next) {
            paginationHtml += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="goToPage(${pagination.current_page + 1}); return false;">
                        Sau <i class="ti ti-chevron-right"></i>
                    </a>
                </li>
            `;
        } else {
            paginationHtml += `
                <li class="page-item disabled">
                    <span class="page-link">Sau <i class="ti ti-chevron-right"></i></span>
                </li>
            `;
        }

        paginationContainer.innerHTML = paginationHtml;
    }

    showLoading() {
        const tbody = document.getElementById('ratingsTableBody');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="spinner-border" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    hideLoading() {
        // Loading is handled by displayRatings
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return this.escapeHtml(text);
        return this.escapeHtml(text.substring(0, maxLength)) + '...';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
    }

    showToast(message, type = 'info') {
        const colorClass = type === 'success' ? 'alert-success' : 
                          type === 'error' ? 'alert-danger' : 
                          'alert-info';
        const iconClass = type === 'success' ? 'ti-check' : 
                         type === 'error' ? 'ti-x' : 
                         'ti-info-circle';

        const toast = document.createElement('div');
        toast.className = `alert ${colorClass} alert-dismissible position-fixed`;
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        toast.innerHTML = `
            <div class="d-flex">
                <div><i class="ti ${iconClass} me-2"></i></div>
                <div>${message}</div>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }
}

// Global functions - attach to window object for module compatibility
window.viewDetail = function(ratingId) {
    if (window.ratingsManager) {
        window.ratingsManager.viewDetail(ratingId);
    }
};

window.editRating = function(ratingId) {
    if (window.ratingsManager) {
        window.ratingsManager.editRating(ratingId);
    }
};

window.deleteRating = function(ratingId) {
    if (window.ratingsManager) {
        window.ratingsManager.deleteRating(ratingId);
    }
};

window.applyFilters = function() {
    if (window.ratingsManager) {
        window.ratingsManager.currentPage = 1;
        window.ratingsManager.loadRatings();
    }
};

window.clearFilters = function() {
    document.getElementById('searchInput').value = '';
    document.getElementById('starFilter').value = '';
    if (window.ratingsManager) {
        window.ratingsManager.filters = { search: '', star: '' };
        window.ratingsManager.currentPage = 1;
        window.ratingsManager.loadRatings();
    }
};

window.refreshData = function() {
    if (window.ratingsManager) {
        window.ratingsManager.loadStats();
        window.ratingsManager.loadRatings();
        
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'alert alert-success alert-dismissible position-fixed';
        toast.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        toast.innerHTML = `
            <div class="d-flex">
                <div><i class="ti ti-check me-2"></i></div>
                <div>Dữ liệu đã được làm mới</div>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 3000);
    }
};

window.goToPage = function(page) {
    if (window.ratingsManager) {
        window.ratingsManager.currentPage = page;
        window.ratingsManager.loadRatings();
    }
};

// Initialize
let ratingsManager;
document.addEventListener('DOMContentLoaded', () => {
    ratingsManager = new AdminRatings();
    // Make it globally accessible
    window.ratingsManager = ratingsManager;
});