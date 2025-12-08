/**
 * Rating Detail Management
 * NEMTHUNG E-commerce Admin
 */

import apiClient from '../../js/api-client.js';

// Global state
let currentRatingId = null;
let ratingData = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkRatingId();
    initializeEventListeners();
});

/**
 * Check rating ID from URL
 */
function checkRatingId() {
    const urlParams = new URLSearchParams(window.location.search);
    currentRatingId = urlParams.get('id');
    
    if (!currentRatingId) {
        showToast('Không tìm thấy ID đánh giá', 'error');
        setTimeout(() => {
            window.location.href = './index.html';
        }, 2000);
        return;
    }
    
    document.getElementById('ratingId').textContent = currentRatingId;
    loadRatingDetail();
}

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
    // Edit buttons
    document.getElementById('btnEdit')?.addEventListener('click', () => {
        window.location.href = `./edit.html?id=${currentRatingId}`;
    });
    
    document.getElementById('btnEditQuick')?.addEventListener('click', () => {
        window.location.href = `./edit.html?id=${currentRatingId}`;
    });
    
    // Delete buttons
    document.getElementById('btnDelete')?.addEventListener('click', deleteRating);
    document.getElementById('btnDeleteQuick')?.addEventListener('click', deleteRating);
}

/**
 * Load rating detail data
 */
async function loadRatingDetail() {
    try {
        const response = await apiClient.get(`ratings/${currentRatingId}`);
        
        if (response.success) {
            ratingData = response.data;
            displayRatingDetail(ratingData);
            hideLoading();
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error loading rating detail:', error);
        showToast('Không thể tải thông tin đánh giá', 'error');
        hideLoading();
        
        // Redirect back to list after error
        setTimeout(() => {
            window.location.href = './index.html';
        }, 2000);
    }
}

/**
 * Display rating detail information
 */
function displayRatingDetail(rating) {
    // Basic info
    document.getElementById('detailId').textContent = rating.id;
    document.getElementById('detailDate').textContent = formatDateTime(rating.date);
    
    // Star rating
    const starsHtml = renderStars(rating.star);
    document.getElementById('detailStars').innerHTML = starsHtml;
    document.getElementById('detailStarText').textContent = `${rating.star}/5 sao`;
    document.getElementById('detailStarText').className = `ms-2 badge bg-${getStarColor(rating.star)}`;
    
    // Content
    document.getElementById('detailContent').textContent = rating.comment_content;
    
    // Product info
    document.getElementById('detailProductName').textContent = rating.product_name;
    document.getElementById('detailTrademark').textContent = rating.trademark;
    
    // Customer info
    document.getElementById('detailCustomerName').textContent = rating.customer_name;
    document.getElementById('detailEmail').textContent = rating.email || 'Không có';
    document.getElementById('detailPhone').textContent = rating.phone || 'Không có';
    document.getElementById('detailAddress').textContent = rating.address || 'Không có';
    
    // Rating type
    const ratingTypeText = getRatingTypeText(rating.star);
    document.getElementById('ratingType').innerHTML = `<span class="badge bg-${getStarColor(rating.star)}">${ratingTypeText}</span>`;
    
    // Display images if available
    if (rating.images && rating.images.length > 0) {
        displayRatingImages(rating.images);
    }
}

/**
 * Display rating images
 */
function displayRatingImages(images) {
    const container = document.getElementById('ratingImagesContainer');
    const card = document.getElementById('ratingImagesCard');
    const countBadge = document.getElementById('imageCount');
    
    // Show card
    card.style.display = 'block';
    countBadge.textContent = `${images.length} ảnh`;
    
    // Clear container
    container.innerHTML = '';
    
    // Add images
    images.forEach((image, index) => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3';
        col.innerHTML = `
            <div class="card card-link" onclick="viewImage('${image.url_path}')">
                <div class="card-body p-2">
                    <img src="${image.url_path}" class="img-fluid rounded" alt="Rating image ${index + 1}" 
                         style="width: 100%; height: 150px; object-fit: cover; cursor: pointer;">
                    <div class="text-muted small mt-1 text-center">Ảnh ${index + 1}</div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

/**
 * View image in modal/new tab
 */
window.viewImage = function(url) {
    window.open(url, '_blank');
}

/**
 * Render star rating
 */
function renderStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars.push(`<i class="ti ti-star-filled"></i>`);
        } else {
            stars.push(`<i class="ti ti-star-filled empty"></i>`);
        }
    }
    return stars.join('');
}

/**
 * Get star color class
 */
function getStarColor(star) {
    if (star >= 5) return 'success';
    if (star >= 4) return 'primary';
    if (star >= 3) return 'warning';
    if (star >= 2) return 'orange';
    return 'danger';
}

/**
 * Get rating type text
 */
function getRatingTypeText(star) {
    if (star >= 5) return 'Xuất sắc';
    if (star >= 4) return 'Tốt';
    if (star >= 3) return 'Bình thường';
    if (star >= 2) return 'Kém';
    return 'Rất kém';
}

/**
 * Delete rating
 */
async function deleteRating() {
    const confirmed = confirm(`Bạn có chắc chắn muốn xóa đánh giá #${currentRatingId}?\n\nHành động này không thể hoàn tác.`);
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await apiClient.delete(`ratings/${currentRatingId}?is_admin=true`);
        
        if (response.success) {
            showToast('Xóa đánh giá thành công', 'success');
            
            // Redirect to list after successful deletion
            setTimeout(() => {
                window.location.href = './index.html';
            }, 1500);
        } else {
            throw new Error(response.message);
        }
    } catch (error) {
        console.error('Error deleting rating:', error);
        showToast('Không thể xóa đánh giá', 'error');
    }
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('ratingContent').style.display = 'block';
}

/**
 * Utility functions
 */
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    return date.toLocaleDateString('vi-VN', options);
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