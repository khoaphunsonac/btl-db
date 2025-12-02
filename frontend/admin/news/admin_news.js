// Admin News Management
import { showToast } from '../utils/toast.js';

// Using PHP built-in server on port 8000
const API_BASE = 'http://localhost/btl-db/backend';

let currentPage = 1;
let currentSearch = '';
let currentAuthor = '';
let allPosts = [];

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/posts`);
        const result = await response.json();
        
        const posts = Array.isArray(result) ? result : (result.data || []);
        
        const total = posts.length;
        
        // Calculate today, week, month
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const todayCount = posts.filter(p => {
            const created = new Date(p.created_at);
            return created >= today;
        }).length;
        
        const weekCount = posts.filter(p => {
            const created = new Date(p.created_at);
            return created >= weekAgo;
        }).length;
        
        const monthCount = posts.filter(p => {
            const created = new Date(p.created_at);
            return created >= monthAgo;
        }).length;
        
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-today').textContent = todayCount;
        document.getElementById('stat-week').textContent = weekCount;
        document.getElementById('stat-month').textContent = monthCount;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load posts list
async function loadPosts(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('newsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const params = new URLSearchParams();
        if (currentSearch) {
            params.append('search', currentSearch);
        }

        const response = await fetch(`${API_BASE}/posts?${params.toString()}`);
        const result = await response.json();

        allPosts = Array.isArray(result) ? result : (result.data || []);
        
        // Apply author filter
        if (currentAuthor) {
            allPosts = allPosts.filter(p => 
                (p.author_name && p.author_name.toLowerCase().includes(currentAuthor.toLowerCase()))
            );
        }

        displayPosts(allPosts);
        displayPagination({ page: currentPage, limit: 10, total: allPosts.length, total_pages: Math.ceil(allPosts.length / 10) });

    } catch (error) {
        console.error('Error loading posts:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger py-4">
                    <i class="ti ti-alert-circle me-2"></i>
                    Không thể tải dữ liệu. Vui lòng thử lại.
                </td>
            </tr>
        `;
    }
}

// Display posts in table
function displayPosts(posts) {
    const tbody = document.getElementById('newsTableBody');
    
    if (posts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="ti ti-inbox me-2"></i>
                    Không có bài viết nào
                </td>
            </tr>
        `;
        return;
    }

    // Pagination
    const start = (currentPage - 1) * 10;
    const end = start + 10;
    const paginatedPosts = posts.slice(start, end);

    tbody.innerHTML = paginatedPosts.map(post => {
        const authorName = post.author_name || (post.author_id ? `Author #${post.author_id}` : '-');
        const createdDate = post.created_at ? new Date(post.created_at).toLocaleString('vi-VN') : '-';
        const publishedDate = post.published_at ? new Date(post.published_at).toLocaleString('vi-VN') : '-';
        
        const excerptPreview = post.excerpt && post.excerpt.length > 60 
            ? post.excerpt.substring(0, 60) + '...' 
            : (post.excerpt || '');
        
        // Status badge
        const status = post.status || 'draft';
        const statusConfig = {
            'published': { label: 'Xuất bản', class: 'bg-success' },
            'draft': { label: 'Bản nháp', class: 'bg-secondary' },
            'scheduled': { label: 'Lên lịch', class: 'bg-info' },
            'archived': { label: 'Lưu trữ', class: 'bg-warning' }
        };
        const statusInfo = statusConfig[status] || statusConfig['draft'];
        const statusBadge = `<span class="badge ${statusInfo.class} text-white">${statusInfo.label}</span>`;

        return `
            <tr>
                <td><strong>#${post.id}</strong></td>
                <td>
                    <div class="fw-semibold">${escapeHtml(post.title || '-')}</div>
                    ${excerptPreview ? `<div class="excerpt-preview">${escapeHtml(excerptPreview)}</div>` : ''}
                </td>
                <td>${escapeHtml(authorName)}</td>
                <td>${statusBadge}</td>
                <td>${publishedDate}</td>
                <td>${createdDate}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-secondary" onclick="window.viewPost(${post.id})" title="Xem chi tiết">
                            <i class="ti ti-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="window.editPost(${post.id})" title="Sửa">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="window.deletePost(${post.id})" title="Xóa">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Display pagination
function displayPagination(pagination) {
    document.getElementById('totalPosts').textContent = pagination.total;
    
    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(pagination.page * pagination.limit, pagination.total);
    document.getElementById('showingRange').textContent = `${start}-${end}`;

    const paginationEl = document.getElementById('pagination');
    const totalPages = pagination.total_pages;
    const currentPage = pagination.page;

    if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadPosts(${currentPage - 1}); return false;">
                <i class="ti ti-chevron-left"></i> Trước
            </a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadPosts(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadPosts(${currentPage + 1}); return false;">
                Sau <i class="ti ti-chevron-right"></i>
            </a>
        </li>
    `;

    paginationEl.innerHTML = html;
}

// View post detail
function viewPost(id) {
    window.location.href = `detail.html?id=${id}`;
}

// Edit post
function editPost(id) {
    window.location.href = `edit.html?id=${id}`;
}

// Delete post
async function deletePost(id) {
    try {
        const response = await fetch(`${API_BASE}/posts/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Không thể xóa');
        }

        loadPosts(currentPage);
        loadStats();
        showToast({ message: 'Đã xóa bài viết thành công!', type: 'success' });

    } catch (error) {
        console.error('Error deleting post:', error);
        showToast({ message: 'Không thể xóa bài viết. Vui lòng thử lại.', type: 'error' });
    }
}

// Filter
function applyFilter() {
    currentSearch = document.getElementById('searchPost').value.trim();
    currentAuthor = document.getElementById('filterAuthor').value.trim();
    loadPosts(1);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible for onclick handlers
window.loadPosts = loadPosts;
window.viewPost = viewPost;
window.editPost = editPost;
window.deletePost = deletePost;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadPosts(1);

    document.getElementById('btnAdd').addEventListener('click', function() {
        window.location.href = 'edit.html';
    });

    document.getElementById('btnFilter').addEventListener('click', applyFilter);
    
    document.getElementById('searchPost').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });
});
