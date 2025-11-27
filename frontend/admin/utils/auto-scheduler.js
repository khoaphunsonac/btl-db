/**
 * Auto Scheduler - Tự động cập nhật bài viết scheduled
 * 
 * Script này tự động gọi API để cập nhật trạng thái bài viết
 * từ "scheduled" sang "published" khi đến giờ xuất bản
 */

const API_BASE_URL = 'http://localhost:8000';
const SCHEDULER_ENDPOINT = `${API_BASE_URL}/scheduler/update-scheduled`;

// Cấu hình
const CONFIG = {
    // Khoảng thời gian kiểm tra (5 phút = 300000ms)
    checkInterval: 5 * 60 * 1000,
    // Thời gian chờ sau khi trang load (30 giây)
    initialDelay: 30 * 1000,
    // Hiển thị log trong console
    enableLogging: true
};

class PostScheduler {
    constructor() {
        this.intervalId = null;
        this.lastUpdate = null;
    }

    /**
     * Log thông tin
     */
    log(message, data = null) {
        if (!CONFIG.enableLogging) return;
        
        const timestamp = new Date().toLocaleString('vi-VN');
        console.log(`[PostScheduler ${timestamp}] ${message}`, data || '');
    }

    /**
     * Gọi API để cập nhật scheduled posts
     */
    async updateScheduledPosts() {
        try {
            this.log('Đang kiểm tra scheduled posts...');
            
            const response = await fetch(SCHEDULER_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.lastUpdate = new Date();
                
                if (result.updated > 0) {
                    this.log(`✓ Đã cập nhật ${result.updated} bài viết`, result.posts);
                    
                    // Hiển thị thông báo cho admin (tùy chọn)
                    this.showNotification(result.updated);
                } else {
                    this.log('Không có bài viết nào cần cập nhật');
                }
            } else {
                this.log('Lỗi từ server:', result.message);
            }

            return result;
        } catch (error) {
            this.log('Lỗi khi cập nhật scheduled posts:', error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Hiển thị thông báo khi có bài viết được cập nhật
     */
    showNotification(count) {
        // Tạo toast notification (nếu có thư viện)
        if (typeof Toastify !== 'undefined') {
            Toastify({
                text: `✓ Đã tự động xuất bản ${count} bài viết`,
                duration: 5000,
                gravity: "top",
                position: "right",
                style: {
                    background: "linear-gradient(to right, #00b09b, #96c93d)",
                }
            }).showToast();
        } else {
            // Fallback: log ra console
            this.log(`📢 Thông báo: Đã tự động xuất bản ${count} bài viết`);
        }
    }

    /**
     * Bắt đầu auto-scheduler
     */
    start() {
        if (this.intervalId) {
            this.log('Scheduler đã đang chạy');
            return;
        }

        this.log('Khởi động Auto Scheduler...');
        this.log(`Sẽ kiểm tra mỗi ${CONFIG.checkInterval / 1000 / 60} phút`);

        // Lần đầu tiên sau khi load trang
        setTimeout(() => {
            this.updateScheduledPosts();
        }, CONFIG.initialDelay);

        // Sau đó kiểm tra định kỳ
        this.intervalId = setInterval(() => {
            this.updateScheduledPosts();
        }, CONFIG.checkInterval);

        this.log('Auto Scheduler đã khởi động');
    }

    /**
     * Dừng auto-scheduler
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.log('Auto Scheduler đã dừng');
        }
    }

    /**
     * Lấy thông tin trạng thái
     */
    getStatus() {
        return {
            isRunning: this.intervalId !== null,
            lastUpdate: this.lastUpdate,
            checkInterval: CONFIG.checkInterval,
            nextCheck: this.intervalId ? new Date(Date.now() + CONFIG.checkInterval) : null
        };
    }
}

// Export instance
const postScheduler = new PostScheduler();

// Tự động khởi động khi load trang
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        postScheduler.start();
    });
} else {
    postScheduler.start();
}

// Export để có thể sử dụng từ console hoặc code khác
window.postScheduler = postScheduler;

export default postScheduler;
