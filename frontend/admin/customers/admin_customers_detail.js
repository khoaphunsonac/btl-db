/**
 * Customer Management - Detail Page
 * NEMTHUNG E-commerce Admin
 */

import apiClient from '../../js/api-client.js';
import { formatDate, formatDateTime, formatCurrency, showError } from '../../js/utils.js';

// State
let customerId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
});

/**
 * Initialize page
 */
function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    customerId = urlParams.get('id');
    
    if (!customerId) {
        showError('ID khách hàng không hợp lệ');
        setTimeout(() => window.location.href = './index.html', 2000);
        return;
    }
    
    // Edit button
    document.getElementById('btnEdit').addEventListener('click', () => {
        window.location.href = `./edit.html?id=${customerId}`;
    });
    
    loadCustomerData();
    loadOrderHistory();
}

/**
 * Load customer data
 */
async function loadCustomerData() {
    try {
        const response = await apiClient.get(`users/${customerId}`);
        
        if (response.success) {
            renderCustomerInfo(response.data);
        } else {
            showError('Không thể tải thông tin khách hàng');
            setTimeout(() => window.location.href = './index.html', 2000);
        }
    } catch (error) {
        console.error('Error loading customer:', error);
        showError('Lỗi khi tải thông tin khách hàng');
        setTimeout(() => window.location.href = './index.html', 2000);
    }
}

/**
 * Render customer information
 */
function renderCustomerInfo(customer) {
    // Profile card
    const initials = (customer.fname?.charAt(0) || '') + (customer.lname?.charAt(0) || '');
    document.getElementById('customerAvatar').textContent = initials.toUpperCase();
    document.getElementById('customerName').textContent = `${customer.fname || ''} ${customer.lname || ''}`.trim();
    document.getElementById('customerEmail').textContent = customer.email || '-';
    
    // Status badge
    const statusEl = document.getElementById('customerStatus');
    if (customer.status === 'Hoạt động') {
        statusEl.className = 'badge bg-green';
        statusEl.innerHTML = '<i class="ti ti-check"></i> Hoạt động';
    } else {
        statusEl.className = 'badge bg-red';
        statusEl.innerHTML = '<i class="ti ti-x"></i> Ngưng hoạt động';
    }
    
    // Contact info
    document.getElementById('detailEmail').textContent = customer.email || '-';
    document.getElementById('detailPhone').textContent = customer.phone || '-';
    document.getElementById('detailAddress').textContent = customer.address || '-';
    
    // Account info
    document.getElementById('createdAt').textContent = formatDateTime(customer.created_at);
    document.getElementById('lastLogin').textContent = formatDateTime(customer.last_login);
    document.getElementById('customerId').textContent = `#${customer.id}`;
    
    // Statistics
    document.getElementById('statOrders').textContent = customer.total_orders || 0;
    document.getElementById('statSpent').textContent = formatCurrency(customer.total_spent || 0);
    document.getElementById('statCompleted').textContent = customer.completed_orders || 0;
}

/**
 * Load order history
 */
async function loadOrderHistory() {
    try {
        const response = await apiClient.get(`orders`, {
            customer_id: customerId,
            limit: 5,
            sort: 'date-desc'
        });
        
        if (response.success && response.data) {
            renderOrderTable(response.data);
        } else {
            renderEmptyOrderTable();
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        renderEmptyOrderTable();
    }
}

/**
 * Render order table
 */
function renderOrderTable(orders) {
    const tbody = document.getElementById('orderTableBody');
    
    if (!orders || orders.length === 0) {
        renderEmptyOrderTable();
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>#${order.id}</strong></td>
            <td>${formatDate(order.date)}</td>
            <td><strong>${formatCurrency(order.total_cost)}</strong></td>
            <td>${renderOrderStatus(order.payment_status)}</td>
            <td class="text-end">
                <a href="../products/admin_orders.html?id=${order.id}" class="btn btn-sm btn-ghost-primary">
                    <i class="ti ti-eye"></i> Xem
                </a>
            </td>
        </tr>
    `).join('');
}

/**
 * Render empty order table
 */
function renderEmptyOrderTable() {
    const tbody = document.getElementById('orderTableBody');
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center text-muted py-4">
                <i class="ti ti-shopping-cart-off" style="font-size: 2rem; opacity: 0.3;"></i>
                <p class="mt-2">Chưa có đơn hàng nào</p>
            </td>
        </tr>
    `;
}

/**
 * Render order status badge
 */
function renderOrderStatus(status) {
    let badgeClass = 'bg-secondary';
    let icon = 'clock';
    
    switch (status) {
        case 'Đã thanh toán':
            badgeClass = 'bg-green';
            icon = 'check';
            break;
        case 'Chưa thanh toán':
            badgeClass = 'bg-yellow';
            icon = 'clock';
            break;
        case 'Hoàn tiền':
            badgeClass = 'bg-red';
            icon = 'arrow-back-up';
            break;
    }
    
    return `<span class="badge ${badgeClass}">
        <i class="ti ti-${icon}"></i> ${status}
    </span>`;
}
