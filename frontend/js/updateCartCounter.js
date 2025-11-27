const API_BASE = 'http://localhost:8000';

export async function updateCartCounter(userId) {
  try {
    const response = await fetch(`${API_BASE}/carts/${userId}`);
    const result = await response.json();

    const counter = document.getElementById('cart-counter');
    if (result.success && counter) {
      counter.textContent = result.data?.item_count || 0;
    }
  } catch (error) {
    console.warn('Không thể cập nhật số lượng giỏ hàng:', error);
  }
}