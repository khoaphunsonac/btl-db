// Admin Comment Management
import { showToast } from '../utils/toast.js';

// Using PHP built-in server on port 8000
const API_BASE = 'http://localhost/btl-db/backend';

let currentPage = 1;
let currentType = '';
let currentFilterId = '';
let currentSearch = '';
let currentFromDate = '';
let currentToDate = '';
let currentRating = '';
let selectedCommentId = null;
let allFilteredComments = []; // Store filtered comments for export

// Load statistics
async function loadStats() {
    try {
        // Load all comments to calculate stats
        const [postsRes, productsRes] = await Promise.all([
            fetch(`${API_BASE}/comments`),
            fetch(`${API_BASE}/product-comments`)
        ]);
        
        // Check if response is OK
        if (!postsRes.ok || !productsRes.ok) {
            console.error('API Error:', postsRes.status, productsRes.status);
            return;
        }
        
        const postsData = await postsRes.json();
        const productsData = await productsRes.json();
        
        const postComments = Array.isArray(postsData) ? postsData : (postsData.data || []);
        const productComments = Array.isArray(productsData) ? productsData : (productsData.data || []);
        
        const total = postComments.length + productComments.length;
        
        // Count today's comments
        const today = new Date().toISOString().split('T')[0];
        const todayCount = [...postComments, ...productComments].filter(c => 
            c.created_at && c.created_at.startsWith(today)
        ).length;
        
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-posts').textContent = postComments.length;
        document.getElementById('stat-products').textContent = productComments.length;
        document.getElementById('stat-today').textContent = todayCount;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load comments list
async function loadComments(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('commentTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        let url = '';
        const params = new URLSearchParams();
        
        if (currentFilterId) {
            if (currentType === 'post') {
                params.append('post_id', currentFilterId);
            } else if (currentType === 'product') {
                params.append('product_id', currentFilterId);
            }
        }
        
        if (currentType === 'product') {
            url = `${API_BASE}/product-comments`;
        } else if (currentType === 'post') {
            url = `${API_BASE}/comments`;
        } else {
            // Load both types
            const [postsRes, productsRes] = await Promise.all([
                fetch(`${API_BASE}/comments`),
                fetch(`${API_BASE}/product-comments`)
            ]);
            
            if (!postsRes.ok || !productsRes.ok) {
                throw new Error(`API Error: ${postsRes.status} / ${productsRes.status}`);
            }
            
            const postsData = await postsRes.json();
            const productsData = await productsRes.json();
            
            const postComments = (Array.isArray(postsData) ? postsData : (postsData.data || [])).map(c => ({...c, comment_type: 'post'}));
            const productComments = (Array.isArray(productsData) ? productsData : (productsData.data || [])).map(c => ({...c, comment_type: 'product'}));
            
            let allComments = [...postComments, ...productComments];
            
            // Apply all filters
            allComments = applyFilters(allComments);
            
            displayComments(allComments);
            displayPagination({ page: currentPage, limit: 10, total: allComments.length, total_pages: Math.ceil(allComments.length / 10) });
            return;
        }
        
        const queryString = params.toString();
        if (queryString) {
            url += '?' + queryString;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const result = await response.json();

        let comments = Array.isArray(result) ? result : (result.data || []);
        
        // Apply all filters
        comments = applyFilters(comments);
        
        displayComments(comments);
        displayPagination({ page: currentPage, limit: 10, total: comments.length, total_pages: Math.ceil(comments.length / 10) });

    } catch (error) {
        console.error('Error loading comments:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger py-4">
                    <i class="ti ti-alert-circle me-2"></i>
                    Không thể tải dữ liệu. Vui lòng thử lại.
                </td>
            </tr>
        `;
    }
}

// Display comments in table
function displayComments(comments) {
    const tbody = document.getElementById('commentTableBody');
    
    if (comments.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="ti ti-inbox me-2"></i>
                    Không có bình luận nào
                </td>
            </tr>
        `;
        return;
    }

    // Pagination
    const start = (currentPage - 1) * 10;
    const end = start + 10;
    const paginatedComments = comments.slice(start, end);

    tbody.innerHTML = paginatedComments.map(comment => {
        const type = comment.comment_type || (comment.post_id ? 'post' : 'product');
        const typeText = type === 'post' ? 'Bài viết' : 'Sản phẩm';
        const refId = type === 'post' ? (comment.post_id || '-') : (comment.product_id || '-');
        const refName = type === 'post' ? (comment.post_title || '') : (comment.product_name || '');
        const userName = comment.user_name || (comment.user_id ? `User #${comment.user_id}` : 'Ẩn danh');
        
        const contentPreview = comment.content && comment.content.length > 50 
            ? comment.content.substring(0, 50) + '...' 
            : (comment.content || '');

        const date = comment.created_at ? new Date(comment.created_at).toLocaleString('vi-VN') : '-';
        
        const ratingDisplay = comment.rating ? `<span class="rating-stars">${'★'.repeat(comment.rating)}${'☆'.repeat(5-comment.rating)}</span>` : '-';

        return `
            <tr>
                <td><strong>#${comment.id}</strong></td>
                <td>${escapeHtml(userName)}</td>
                <td><span class="badge bg-${type === 'post' ? 'blue' : 'green'} text-white">${typeText}</span></td>
                <td>${refName ? escapeHtml(refName) : `#${refId}`}</td>
                <td class="content-preview">${escapeHtml(contentPreview)}</td>
                <td>${ratingDisplay}</td>
                <td>${date}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="viewComment(${comment.id})" title="Xem chi tiết">
                            <i class="ti ti-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteComment(${comment.id})" title="Xóa">
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
    document.getElementById('totalComments').textContent = pagination.total;
    
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
            <a class="page-link" href="#" onclick="loadComments(${currentPage - 1}); return false;">
                <i class="ti ti-chevron-left"></i> Trước
            </a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadComments(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadComments(${currentPage + 1}); return false;">
                Sau <i class="ti ti-chevron-right"></i>
            </a>
        </li>
    `;

    paginationEl.innerHTML = html;
}

// View comment detail
async function viewComment(id) {
    try {
        const response = await fetch(`${API_BASE}/comments/${id}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Không thể tải bình luận');
        }

        const comment = result.data;
        selectedCommentId = id;

        const type = comment.comment_type || (comment.post_id ? 'post' : 'product');
        const typeText = type === 'post' ? 'Bài viết' : 'Sản phẩm';
        const refId = type === 'post' ? (comment.post_id || '-') : (comment.product_id || '-');
        const refName = type === 'post' ? (comment.post_title || '') : (comment.product_name || '');

        document.getElementById('detailUser').textContent = comment.user_name || (comment.user_id ? `User #${comment.user_id}` : 'Ẩn danh');
        document.getElementById('detailType').innerHTML = `<span class="badge bg-${type === 'post' ? 'blue' : 'green'} text-white">${typeText}</span>`;
        document.getElementById('detailReference').textContent = refName ? `${refName} (#${refId})` : `#${refId}`;
        document.getElementById('detailContent').textContent = comment.content || '';
        document.getElementById('detailDate').textContent = comment.created_at ? new Date(comment.created_at).toLocaleString('vi-VN') : '-';
        
        const ratingDisplay = comment.rating ? `<span class="rating-stars">${'★'.repeat(comment.rating)}${'☆'.repeat(5-comment.rating)}</span> (${comment.rating}/5)` : 'Không có';
        document.getElementById('detailRating').innerHTML = ratingDisplay;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewModal'));
        modal.show();

    } catch (error) {
        console.error('Error viewing comment:', error);
        showToast({ message: 'Không thể tải chi tiết bình luận. Vui lòng thử lại.', type: 'error' });
    }
}

// Delete comment
async function deleteComment(id) {
    try {
        const response = await fetch(`${API_BASE}/comments/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Không thể xóa');
        }

        // Close modal if open
        const modalEl = document.getElementById('viewModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) {
            modal.hide();
        }

        loadComments(currentPage);
        loadStats();
        showToast({ message: 'Đã xóa bình luận thành công!', type: 'success' });

    } catch (error) {
        console.error('Error deleting comment:', error);
        showToast({ message: 'Không thể xóa bình luận. Vui lòng thử lại.', type: 'error' });
    }
}

// Apply filters to comments array
function applyFilters(comments) {
    let filtered = comments;
    
    // Search filter (keyword)
    if (currentSearch) {
        filtered = filtered.filter(c => 
            (c.user_name && c.user_name.toLowerCase().includes(currentSearch.toLowerCase())) ||
            (c.content && c.content.toLowerCase().includes(currentSearch.toLowerCase()))
        );
    }
    
    // Date range filter
    if (currentFromDate) {
        filtered = filtered.filter(c => {
            if (!c.created_at) return false;
            const commentDate = new Date(c.created_at);
            const fromDate = new Date(currentFromDate);
            return commentDate >= fromDate;
        });
    }
    
    if (currentToDate) {
        filtered = filtered.filter(c => {
            if (!c.created_at) return false;
            const commentDate = new Date(c.created_at);
            const toDate = new Date(currentToDate);
            toDate.setHours(23, 59, 59, 999); // End of day
            return commentDate <= toDate;
        });
    }
    
    // Rating filter
    if (currentRating) {
        filtered = filtered.filter(c => c.rating == currentRating);
    }
    
    // Store for export
    allFilteredComments = filtered;
    
    return filtered;
}

// Filter
function applyFilter() {
    currentType = document.getElementById('filterType').value;
    currentFilterId = document.getElementById('filterId').value.trim();
    currentSearch = document.getElementById('searchInput').value.trim();
    currentFromDate = document.getElementById('filterFromDate').value;
    currentToDate = document.getElementById('filterToDate').value;
    currentRating = document.getElementById('filterRating').value;
    loadComments(1);
}

// Reset filters
function resetFilters() {
    document.getElementById('filterType').value = '';
    document.getElementById('filterId').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    document.getElementById('filterRating').value = '';
    
    currentType = '';
    currentFilterId = '';
    currentSearch = '';
    currentFromDate = '';
    currentToDate = '';
    currentRating = '';
    
    loadComments(1);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export to Excel
function exportToExcel() {
    if (allFilteredComments.length === 0) {
        showToast({ message: 'Không có dữ liệu để xuất!', type: 'warning' });
        return;
    }
    
    // Create CSV content
    let csv = '\uFEFF'; // BOM for UTF-8
    csv += 'ID,Người dùng,Loại,Tham chiếu,Nội dung,Rating,Ngày tạo\n';
    
    allFilteredComments.forEach(c => {
        const type = c.comment_type || (c.post_id ? 'post' : 'product');
        const typeText = type === 'post' ? 'Bài viết' : 'Sản phẩm';
        const refId = type === 'post' ? (c.post_id || '-') : (c.product_id || '-');
        const refName = type === 'post' ? (c.post_title || '') : (c.product_name || '');
        const userName = c.user_name || (c.user_id ? `User #${c.user_id}` : 'Ẩn danh');
        const content = (c.content || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const rating = c.rating || '-';
        const date = c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : '-';
        
        csv += `"${c.id}","${userName}","${typeText}","${refName || '#' + refId}","${content}","${rating}","${date}"\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comments_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast({ message: 'Đã xuất file Excel thành công!', type: 'success' });
}

// Export to PDF
function exportToPDF() {
    if (allFilteredComments.length === 0) {
        showToast({ message: 'Không có dữ liệu để xuất!', type: 'warning' });
        return;
    }
    
    // Create printable HTML
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Danh sách bình luận</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { text-align: center; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #4CAF50; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .rating-stars { color: #ffc107; }
            </style>
        </head>
        <body>
            <h1>DANH SÁCH BÌNH LUẬN</h1>
            <p><strong>Ngày xuất:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <p><strong>Tổng số:</strong> ${allFilteredComments.length} bình luận</p>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Người dùng</th>
                        <th>Loại</th>
                        <th>Tham chiếu</th>
                        <th>Nội dung</th>
                        <th>Rating</th>
                        <th>Ngày tạo</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    allFilteredComments.forEach(c => {
        const type = c.comment_type || (c.post_id ? 'post' : 'product');
        const typeText = type === 'post' ? 'Bài viết' : 'Sản phẩm';
        const refId = type === 'post' ? (c.post_id || '-') : (c.product_id || '-');
        const refName = type === 'post' ? (c.post_title || '') : (c.product_name || '');
        const userName = c.user_name || (c.user_id ? `User #${c.user_id}` : 'Ẩn danh');
        const content = escapeHtml(c.content || '');
        const rating = c.rating ? '★'.repeat(c.rating) + '☆'.repeat(5-c.rating) : '-';
        const date = c.created_at ? new Date(c.created_at).toLocaleString('vi-VN') : '-';
        
        html += `
            <tr>
                <td>${c.id}</td>
                <td>${escapeHtml(userName)}</td>
                <td>${typeText}</td>
                <td>${refName ? escapeHtml(refName) : '#' + refId}</td>
                <td>${content.substring(0, 100)}${content.length > 100 ? '...' : ''}</td>
                <td class="rating-stars">${rating}</td>
                <td>${date}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Open in new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        showToast({ message: 'Đã mở cửa sổ in PDF!', type: 'success' });
    }, 250);
}

// Make functions globally accessible for onclick handlers
window.loadComments = loadComments;
window.viewComment = viewComment;
window.deleteComment = deleteComment;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadComments(1);

    document.getElementById('btnFilter').addEventListener('click', applyFilter);
    document.getElementById('btnReset').addEventListener('click', resetFilters);
    
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });
    
    document.getElementById('btnDeleteComment').addEventListener('click', function() {
        if (selectedCommentId) {
            deleteComment(selectedCommentId);
        }
    });
    
    document.getElementById('btnExportExcel').addEventListener('click', exportToExcel);
    document.getElementById('btnExportPDF').addEventListener('click', exportToPDF);
});
