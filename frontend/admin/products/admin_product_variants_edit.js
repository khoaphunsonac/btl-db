import apiClient from '../../js/api-client.js';
import { showSuccess, showError, confirm } from '../../js/utils.js';

let productId = null;
let variants = [];

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  productId = urlParams.get('id');
  if (!productId) {
    showError('Không tìm thấy sản phẩm');
    return;
  }
  document.getElementById('productIdLabel').textContent = productId;

  loadVariant();
});

// ------------------ LOAD VARIANTS ------------------
async function loadVariant() {
  try {
    const res = await apiClient.get(`product-variants/${productId}`);
    if (res.success) {
    variants = Array.isArray(res.data) ? res.data : [res.data]; 
    renderVariants();
  } else {
      showError(res.message || 'Không thể tải biến thể sản phẩm');
    }
  } catch (err) {
    console.error(err);
    showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
  }
}

function renderVariants() {
  const tbody = document.querySelector('tbody');
  tbody.innerHTML = '';
  variants.forEach(v => {
    const tr = document.createElement('tr');
    tr.dataset.id = v.id;

    tr.innerHTML = `
      <td>${v.id}</td>
      <td><input type="text" class="form-control color-input" value="${v.color}"></td>
      <td><input type="number" class="form-control quantity-input" value="${v.quantity}"></td>
      <td class="status-cell">${v.status}</td>
      <td>
        <button class="btn btn-sm btn-success btn-save">Lưu</button>
      </td>
    `;
    tbody.appendChild(tr);

    tr.querySelector('.btn-save').addEventListener('click', () => handleSaveVariant(v.id, tr));
  });
}

// ------------------ SAVE VARIANT ------------------
async function handleSaveVariant(id, tr) {
  const color = tr.querySelector('.color-input').value.trim();
  const quantity = parseInt(tr.querySelector('.quantity-input').value);

  try {
    const res = await apiClient.put(`product-variants/${id}`, { color, quantity });
    if (res.success) {
      showSuccess(res.message || 'Cập nhật thành công');
      tr.querySelector('.status-cell').textContent = quantity > 0 ? 'Còn hàng' : 'Hết hàng';
      loadVariant(); // reload lại list để đảm bảo check màu trùng
    } else {
      showError(res.message || 'Không thể cập nhật biến thể');
    }
  } catch (err) {
    console.error(err);
    showError(err?.data?.errors.message || 'Lỗi khi cập nhật biến thể');
  }
}