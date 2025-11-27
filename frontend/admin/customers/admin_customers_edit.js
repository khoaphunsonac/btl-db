/**
 * Customer Management - Edit Page
 * NEMTHUNG E-commerce Admin
 */

import apiClient from '../../js/api-client.js';
import { formatDateTime, showSuccess, showError, confirm } from '../../js/utils.js';

// State
let customerId = null;
let isEditMode = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializePage();
    initializeEventListeners();
});

/**
 * Initialize page based on URL params
 */
function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    customerId = urlParams.get('id');
    
    if (customerId) {
        isEditMode = true;
        loadCustomerData(customerId);
        setupEditMode();
    } else {
        setupAddMode();
    }
}

/**
 * Setup edit mode
 */
function setupEditMode() {
    document.getElementById('pageTitle').textContent = 'Chỉnh sửa khách hàng';
    document.getElementById('passwordSection').style.display = 'none';
    document.getElementById('changePasswordSection').style.display = 'block';
    document.getElementById('btnDelete').style.display = 'block';
    document.getElementById('infoCard').style.display = 'block';
    
    // Password is not required in edit mode
    document.getElementById('password').removeAttribute('required');
    document.getElementById('confirmPassword').removeAttribute('required');
}

/**
 * Setup add mode
 */
function setupAddMode() {
    document.getElementById('pageTitle').textContent = 'Thêm khách hàng mới';
    document.getElementById('passwordSection').style.display = 'block';
    document.getElementById('changePasswordSection').style.display = 'none';
    document.getElementById('btnDelete').style.display = 'none';
    document.getElementById('infoCard').style.display = 'none';
    
    // Password is required in add mode
    document.getElementById('password').setAttribute('required', 'required');
    document.getElementById('confirmPassword').setAttribute('required', 'required');
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Form submit
    document.getElementById('customerForm').addEventListener('submit', handleSubmit);
    
    // Delete button
    document.getElementById('btnDelete')?.addEventListener('click', handleDelete);
    
    // Change password toggle
    document.getElementById('enableChangePassword')?.addEventListener('change', (e) => {
        document.getElementById('changePasswordFields').style.display = e.target.checked ? 'block' : 'none';
        if (!e.target.checked) {
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmNewPassword').value = '';
        }
    });
    
    // Password validation
    document.getElementById('password')?.addEventListener('input', validatePassword);
    document.getElementById('confirmPassword')?.addEventListener('input', validatePasswordMatch);
    document.getElementById('newPassword')?.addEventListener('input', validateNewPassword);
    document.getElementById('confirmNewPassword')?.addEventListener('input', validateNewPasswordMatch);
}

/**
 * Load customer data
 */
async function loadCustomerData(id) {
    try {
        const response = await apiClient.get(`users/${id}`);
        
        if (response.success) {
            populateForm(response.data);
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
 * Populate form with customer data
 */
function populateForm(customer) {
    document.getElementById('fname').value = customer.fname || '';
    document.getElementById('lname').value = customer.lname || '';
    document.getElementById('email').value = customer.email || '';
    document.getElementById('phone').value = customer.phone || '';
    document.getElementById('address').value = customer.address || '';
    document.getElementById('status').value = customer.status || 'Hoạt động';
    
    // Populate info card
    document.getElementById('createdAt').textContent = formatDateTime(customer.created_at);
    document.getElementById('lastLogin').textContent = formatDateTime(customer.last_login);
    document.getElementById('totalOrders').textContent = customer.total_orders || '0';
}

/**
 * Handle form submit
 */
async function handleSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    const formData = getFormData();
    const btnSubmit = document.getElementById('btnSubmit');
    
    // Disable button
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';
    
    try {
        let response;
        if (isEditMode) {
            response = await apiClient.put(`users/${customerId}`, formData);
        } else {
            response = await apiClient.post('users', formData);
        }
        
        if (response.success) {
            showSuccess(isEditMode ? 'Cập nhật khách hàng thành công' : 'Thêm khách hàng thành công');
            setTimeout(() => window.location.href = './index.html', 1500);
        } else {
            showError(response.message || 'Không thể lưu thông tin khách hàng');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = '<i class="ti ti-device-floppy"></i> Lưu thông tin';
        }
    } catch (error) {
        console.error('Error saving customer:', error);
        showError('Lỗi khi lưu thông tin khách hàng');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="ti ti-device-floppy"></i> Lưu thông tin';
    }
}

/**
 * Get form data
 */
function getFormData() {
    const data = {
        fname: document.getElementById('fname').value.trim(),
        lname: document.getElementById('lname').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        status: document.getElementById('status').value
    };
    
    // Add password for new customer
    if (!isEditMode) {
        data.password = document.getElementById('password').value;
    }
    
    // Add new password if changing
    if (isEditMode && document.getElementById('enableChangePassword').checked) {
        const newPassword = document.getElementById('newPassword').value;
        if (newPassword) {
            data.password = newPassword;
        }
    }
    
    return data;
}

/**
 * Validate form
 */
function validateForm() {
    const form = document.getElementById('customerForm');
    
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return false;
    }
    
    // Validate password in add mode
    if (!isEditMode) {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!isValidPassword(password)) {
            showError('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số');
            return false;
        }
        
        if (password !== confirmPassword) {
            showError('Mật khẩu xác nhận không khớp');
            return false;
        }
    }
    
    // Validate new password if changing
    if (isEditMode && document.getElementById('enableChangePassword').checked) {
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword && !isValidPassword(newPassword)) {
            showError('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số');
            return false;
        }
        
        if (newPassword !== confirmNewPassword) {
            showError('Mật khẩu xác nhận không khớp');
            return false;
        }
    }
    
    return true;
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
}

/**
 * Validate password field
 */
function validatePassword(e) {
    const password = e.target.value;
    const isValid = !password || isValidPassword(password);
    
    if (isValid) {
        e.target.classList.remove('is-invalid');
        e.target.classList.add('is-valid');
    } else {
        e.target.classList.remove('is-valid');
        e.target.classList.add('is-invalid');
    }
}

/**
 * Validate password match
 */
function validatePasswordMatch(e) {
    const password = document.getElementById('password').value;
    const confirmPassword = e.target.value;
    const isValid = password === confirmPassword;
    
    if (isValid) {
        e.target.classList.remove('is-invalid');
        e.target.classList.add('is-valid');
    } else {
        e.target.classList.remove('is-valid');
        e.target.classList.add('is-invalid');
    }
}

/**
 * Validate new password
 */
function validateNewPassword(e) {
    const password = e.target.value;
    const isValid = !password || isValidPassword(password);
    
    if (isValid) {
        e.target.classList.remove('is-invalid');
        e.target.classList.add('is-valid');
    } else {
        e.target.classList.remove('is-valid');
        e.target.classList.add('is-invalid');
    }
}

/**
 * Validate new password match
 */
function validateNewPasswordMatch(e) {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = e.target.value;
    const isValid = password === confirmPassword;
    
    if (isValid) {
        e.target.classList.remove('is-invalid');
        e.target.classList.add('is-valid');
    } else {
        e.target.classList.remove('is-valid');
        e.target.classList.add('is-invalid');
    }
}

/**
 * Handle delete customer
 */
async function handleDelete() {
    const confirmed = await confirm(
        'Bạn có chắc muốn xóa khách hàng này?\n\nLưu ý: Không thể xóa khách hàng có đơn hàng đang xử lý.'
    );
    
    if (!confirmed) return;
    
    try {
        const response = await apiClient.delete(`users/${customerId}`);
        
        if (response.success) {
            showSuccess('Đã xóa khách hàng thành công');
            setTimeout(() => window.location.href = './index.html', 1500);
        } else {
            showError(response.message || 'Không thể xóa khách hàng');
        }
    } catch (error) {
        console.error('Error deleting customer:', error);
        showError('Lỗi khi xóa khách hàng');
    }
}
