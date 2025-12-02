/**
 * Rating Edit/Create Management
 * NEMTHUNG E-commerce Admin
 */

import apiClient from '../../js/api-client.js';

// Global state
let isEditMode = false;
let currentRatingId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkEditMode();
    loadDropdownData();
    initializeForm();
});

/**
 * Check if this is edit mode
 */
function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    currentRatingId = urlParams.get('id');
    
    if (currentRatingId) {
        isEditMode = true;
        document.getElementById('pageTitle').textContent = 'Sửa đánh giá';
        document.getElementById('btnSave').innerHTML = '<i class="ti ti-device-floppy"></i> Cập nhật đánh giá';
        document.getElementById('currentInfoCard').style.display = 'block';
        
        // Show view detail button and reorganize layout
        document.getElementById('viewDetailSection').style.display = 'block';
        document.getElementById('cancelSection1').className = 'col-6';
        document.getElementById('cancelSection2').style.display = 'none';
        
        // Add view detail button event
        document.getElementById('btnViewDetail').addEventListener('click', () => {
            window.location.href = `./detail.html?id=${currentRatingId}`;
        });
        
        loadRatingData(currentRatingId);
    } else {
        // Show full width cancel button for create mode
        document.getElementById('cancelSection1').className = 'col-12';
    }
}

/**
 * Load dropdown data (customers and products)
 */
async function loadDropdownData() {
    try {
        // Load customers
        try {
            const customersResponse = await apiClient.get('ratings/customers');
            if (customersResponse.success) {
                const customerSelect = document.getElementById('customer_id');
                customerSelect.innerHTML = '<option value="">Chọn khách hàng</option>';
                
                customersResponse.data.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.id;
                    option.textContent = `${customer.name} (${customer.email})`;
                    customerSelect.appendChild(option);
                });
            } else {
                throw new Error(customersResponse.message || 'Failed to load customers');
            }
        } catch (error) {
            console.error('Error loading customers:', error);
            showToast('Không thể tải danh sách khách hàng: ' + error.message, 'error');
            
            // Add a fallback empty option
            const customerSelect = document.getElementById('customer_id');
            customerSelect.innerHTML = '<option value="">Không thể tải khách hàng</option>';
        }

        // Load products  
        try {
            const productsResponse = await apiClient.get('ratings/products');
            if (productsResponse.success) {
                const productSelect = document.getElementById('product_id');
                productSelect.innerHTML = '<option value="">Chọn sản phẩm</option>';
                
                productsResponse.data.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.name} (${product.trademark})`;
                    productSelect.appendChild(option);
                });
            } else {
                throw new Error(productsResponse.message || 'Failed to load products');
            }
        } catch (error) {
            console.error('Error loading products:', error);
            showToast('Không thể tải danh sách sản phẩm: ' + error.message, 'error');
            
            // Add a fallback empty option
            const productSelect = document.getElementById('product_id');
            productSelect.innerHTML = '<option value="">Không thể tải sản phẩm</option>';
        }
    } catch (error) {
        console.error('Error loading dropdown data:', error);
        showToast('Có lỗi khi tải dữ liệu dropdown', 'error');
    }
}

/**
 * Load rating data for editing
 */
async function loadRatingData(id) {
    try {
        showLoadingState(true);
        
        const response = await apiClient.get(`ratings/${id}`);
        
        if (response.success) {
            const rating = response.data;
            
            // Wait for dropdown data to load first
            await new Promise(resolve => {
                const checkDropdowns = () => {
                    const customerOptions = document.getElementById('customer_id').options.length;
                    const productOptions = document.getElementById('product_id').options.length;
                    
                    if (customerOptions > 1 && productOptions > 1) {
                        resolve();
                    } else {
                        setTimeout(checkDropdowns, 100);
                    }
                };
                checkDropdowns();
            });
            
            // Fill form
            document.getElementById('customer_id').value = rating.customer_id;
            document.getElementById('product_id').value = rating.product_id;
            document.getElementById('comment_content').value = rating.comment_content;
            
            // Set star rating
            const starInput = document.querySelector(`input[name="star"][value="${rating.star}"]`);
            if (starInput) {
                starInput.checked = true;
                updateStarDisplay(rating.star);
            }
            
            // Fill current info card
            document.getElementById('currentId').textContent = `#${rating.id}`;
            document.getElementById('currentDate').textContent = formatDateTime(rating.date);
            
            showLoadingState(false);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error loading rating:', error);
        showToast('Không thể tải thông tin đánh giá: ' + error.message, 'error');
        showLoadingState(false);
        
        // Redirect back to list
        setTimeout(() => {
            window.location.href = './index.html';
        }, 2000);
    }
}

/**
 * Show/hide loading state
 */
function showLoadingState(isLoading) {
    const form = document.getElementById('ratingForm');
    const btnSave = document.getElementById('btnSave');
    
    if (isLoading) {
        form.style.opacity = '0.5';
        form.style.pointerEvents = 'none';
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="ti ti-loader-2 animate-spin"></i> Đang tải...';
    } else {
        form.style.opacity = '1';
        form.style.pointerEvents = 'auto';
        btnSave.disabled = false;
        btnSave.innerHTML = isEditMode ? 
            '<i class="ti ti-device-floppy"></i> Cập nhật đánh giá' : 
            '<i class="ti ti-device-floppy"></i> Lưu đánh giá';
    }
}

/**
 * Initialize form events
 */
function initializeForm() {
    const form = document.getElementById('ratingForm');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        await saveRating();
    });

    // Star rating interaction
    const starInputs = document.querySelectorAll('input[name="star"]');
    starInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            updateStarDisplay(e.target.value);
        });
    });
}

/**
 * Update star display
 */
function updateStarDisplay(rating) {
    const labels = document.querySelectorAll('.star-rating label');
    labels.forEach((label, index) => {
        const starValue = 5 - index;
        if (starValue <= rating) {
            label.style.color = '#ffc107';
        } else {
            label.style.color = '#ddd';
        }
    });
}

/**
 * Validate form
 */
function validateForm() {
    let isValid = true;
    
    // Clear previous validation
    document.querySelectorAll('.is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
    });
    
    // Check required fields
    const requiredFields = ['customer_id', 'product_id', 'comment_content'];
    requiredFields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        }
    });
    
    // Check star rating
    const starChecked = document.querySelector('input[name="star"]:checked');
    if (!starChecked) {
        showToast('Vui lòng chọn số sao đánh giá', 'error');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Save rating
 */
async function saveRating() {
    const formData = new FormData(document.getElementById('ratingForm'));
    const data = {
        customer_id: parseInt(formData.get('customer_id')),
        product_id: parseInt(formData.get('product_id')),
        star: parseInt(formData.get('star')),
        comment_content: formData.get('comment_content').trim(),
        is_admin: true // Flag to bypass purchase validation
    };
    
    // Disable submit button
    const btnSave = document.getElementById('btnSave');
    const originalText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML = '<i class="ti ti-loader-2 animate-spin"></i> Đang xử lý...';
    
    try {
        let response;
        
        if (isEditMode) {
            response = await apiClient.put(`ratings/${currentRatingId}`, data);
        } else {
            response = await apiClient.post('ratings', data);
        }
        
        if (response.success) {
            showToast(isEditMode ? 'Cập nhật đánh giá thành công' : 'Thêm đánh giá thành công', 'success');
            
            // Redirect back to list
            setTimeout(() => {
                window.location.href = './index.html';
            }, 1500);
        } else {
            throw new Error(response.message || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Error saving rating:', error);
        let errorMessage = 'Không thể lưu đánh giá';
        
        if (error.message.includes('already rated')) {
            errorMessage = 'Khách hàng đã đánh giá sản phẩm này rồi';
        } else if (error.message.includes('not purchased')) {
            errorMessage = 'Khách hàng chưa mua sản phẩm này';
        } else if (error.status === 400 && error.data?.errors) {
            errorMessage = Object.values(error.data.errors)[0];
        }
        
        showToast(errorMessage, 'error');
    } finally {
        // Re-enable submit button
        btnSave.disabled = false;
        btnSave.innerHTML = originalText;
    }
}

/**
 * Utility functions
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN');
}

function showToast(message, type = 'info') {
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
    }, 5000);
}