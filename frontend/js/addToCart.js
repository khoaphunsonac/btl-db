import { Popup } from "../components/PopUp.js";
import { updateCartCounter } from "./updateCartCounter.js";

const API_BASE = 'http://localhost/btl-db/backend';

export async function addToCart(productId, userId = 2) {

    // 1. Khởi tạo popup MỘT LẦN ở ngoài
    // Chúng ta sẽ dùng nó cho cả thông báo thành công và thất bại
    const popup = new Popup();

    try {
        const response = await fetch(`${API_BASE}/carts/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                product_id: productId,
                quantity: 1
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {

            // --- ĐÃ SỬA LỖI ---
            // 2. Xóa bỏ hàm confirmPopup() và gọi popup.show() trực tiếp
            popup.show({
                title: "Thêm thành công!",
                content: `<p>Sản phẩm đã được thêm vào giỏ hàng của bạn.</p>`,

                // 3. Dùng 'actions' để tạo nút "OK" cho sạch sẽ
                //    Nó tự động đóng khi bấm, không cần addEventListener
                actions: [
                    {
                        label: "OK",
                        type: "btn-primary", // Class của nút
                        close: true          // Tự động đóng popup
                    }
                ]
            });

            // 4. Cập nhật counter
            await updateCartCounter(userId);

        } else {
            throw new Error(result.message || 'Không thể thêm sản phẩm vào giỏ');
        }
    } catch (error) {
        console.error('Lỗi khi thêm sản phẩm vào giỏ:', error);

        // 5. (Cải tiến) Dùng popup để báo lỗi thay vì alert()
        popup.show({
            title: "Thêm thất bại!",
            content: `<p>Đã xảy ra lỗi: ${error.message}</p>`,
            actions: [
                { label: "Đóng", type: "btn-secondary", close: true }
            ]
        });
    }
}