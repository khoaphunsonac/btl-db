// Admin Contact Management

import { showToast } from '../utils/toast.js';

const API_BASE = 'http://localhost/btl-db/backend';

let currentPage = 1;
let currentStatus = '';
let currentSearch = '';
let selectedContactId = null;

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/contacts/stats`);
        const result = await response.json();
        
        if (result.success) {
            document.getElementById('stat-total').textContent = result.data.total || 0;
            document.getElementById('stat-new').textContent = result.data.new_count || 0;
            document.getElementById('stat-read').textContent = result.data.read_count || 0;
            document.getElementById('stat-replied').textContent = result.data.replied_count || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load contacts list
async function loadContacts(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('contactsTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Đang tải...</span>
                </div>
            </td>
        </tr>
    `;

    try {
        const params = new URLSearchParams({
            page: page,
            limit: 10
        });

        if (currentStatus) {
            params.append('status', currentStatus);
        }

        if (currentSearch) {
            params.append('search', currentSearch);
        }

        const response = await fetch(`${API_BASE}/api/contacts?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Failed to load contacts');
        }

        displayContacts(result.data);
        displayPagination(result.pagination);

    } catch (error) {
        console.error('Error loading contacts:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-danger py-4">
                    <i class="ti ti-alert-circle me-2"></i>
                    Không thể tải dữ liệu. Vui lòng thử lại.
                </td>
            </tr>
        `;
    }
}

// Display contacts in table
function displayContacts(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    
    if (contacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center text-muted py-4">
                    <i class="ti ti-inbox me-2"></i>
                    Không có liên hệ nào
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = contacts.map(contact => {
        const statusClass = `status-${contact.status}`;
        const statusText = {
            'new': 'Mới',
            'read': 'Đã đọc',
            'replied': 'Đã phản hồi'
        }[contact.status] || contact.status;

        const messagePreview = contact.message.length > 50 
            ? contact.message.substring(0, 50) + '...' 
            : contact.message;

        const date = new Date(contact.created_at).toLocaleString('vi-VN');

        return `
            <tr>
                <td><strong>#${contact.id}</strong></td>
                <td>${escapeHtml(contact.name)}</td>
                <td><a href="mailto:${contact.email}">${escapeHtml(contact.email)}</a></td>
                <td>${contact.phone || '-'}</td>
                <td>${contact.subject || '-'}</td>
                <td class="message-preview">${escapeHtml(messagePreview)}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>${date}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-primary" onclick="viewContact(${contact.id})" title="Xem chi tiết">
                            <i class="ti ti-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-success" onclick="markAsRead(${contact.id})" title="Đánh dấu đã đọc">
                            <i class="ti ti-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteContact(${contact.id})" title="Xóa">
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
    document.getElementById('totalContacts').textContent = pagination.total;
    
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
            <a class="page-link" href="#" onclick="loadContacts(${currentPage - 1}); return false;">
                <i class="ti ti-chevron-left"></i> Trước
            </a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="loadContacts(${i}); return false;">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="loadContacts(${currentPage + 1}); return false;">
                Sau <i class="ti ti-chevron-right"></i>
            </a>
        </li>
    `;

    paginationEl.innerHTML = html;
}

// View contact detail
async function viewContact(id) {
    try {
        const response = await fetch(`${API_BASE}/api/contacts/${id}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        const contact = result.data;
        selectedContactId = id;

        document.getElementById('detailName').textContent = contact.name;
        document.getElementById('detailEmail').textContent = contact.email;
        document.getElementById('detailPhone').textContent = contact.phone || '-';
        document.getElementById('detailSubject').textContent = contact.subject || '-';
        document.getElementById('detailMessage').textContent = contact.message;
        document.getElementById('detailDate').textContent = new Date(contact.created_at).toLocaleString('vi-VN');

        const statusText = {
            'new': 'Mới',
            'read': 'Đã đọc',
            'replied': 'Đã phản hồi'
        }[contact.status] || contact.status;
        const statusClass = `status-${contact.status}`;
        document.getElementById('detailStatus').innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('viewModal'));
        modal.show();

        // Auto mark as read if status is new
        if (contact.status === 'new') {
            markAsRead(id, false);
        }

    } catch (error) {
        console.error('Error viewing contact:', error);
        showToast({ message: 'Không thể tải chi tiết liên hệ. Vui lòng thử lại.', type: 'error' });
    }
}

// Mark as read
async function markAsRead(id, reload = true) {
    try {
        const response = await fetch(`${API_BASE}/api/contacts/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'read' })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        if (reload) {
            loadContacts(currentPage);
            loadStats();
        }

    } catch (error) {
        console.error('Error updating status:', error);
        if (reload) {
            showToast({ message: 'Không thể cập nhật trạng thái. Vui lòng thử lại.', type: 'error' });
        }
    }
}

// Mark as replied
async function markAsReplied() {
    if (!selectedContactId) return;

    try {
        const response = await fetch(`${API_BASE}/api/contacts/${selectedContactId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'replied' })
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('viewModal'));
        modal.hide();

        // Reload
        loadContacts(currentPage);
        loadStats();

        showToast({ message: 'Đã đánh dấu là đã phản hồi!', type: 'success' });

    } catch (error) {
        console.error('Error updating status:', error);
        showToast({ message: 'Không thể cập nhật trạng thái. Vui lòng thử lại.', type: 'error' });
    }
}

// Delete contact
async function deleteContact(id) {
    try {
        const response = await fetch(`${API_BASE}/api/contacts/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error);
        }

        loadContacts(currentPage);
        loadStats();
        showToast({ message: 'Đã xóa liên hệ thành công!', type: 'success' });

    } catch (error) {
        console.error('Error deleting contact:', error);
        showToast({ message: 'Không thể xóa liên hệ. Vui lòng thử lại.', type: 'error' });
    }
}

// Filter
function applyFilter() {
    currentStatus = document.getElementById('filterStatus').value;
    currentSearch = document.getElementById('searchInput').value.trim();
    loadContacts(1);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible for onclick handlers
window.loadContacts = loadContacts;
window.viewContact = viewContact;
window.markAsRead = markAsRead;
window.deleteContact = deleteContact;

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    loadContacts(1);

    document.getElementById('btnFilter').addEventListener('click', applyFilter);
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilter();
        }
    });
    document.getElementById('btnMarkReplied').addEventListener('click', markAsReplied);
});

