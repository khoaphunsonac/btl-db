import apiClient from '../../js/api-client.js';
import { showSuccess, showError, confirm } from '../../js/utils.js';

let productId = null;
let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  productId = urlParams.get('id');
  isEditMode = !!productId;

  if (isEditMode) {
    document.getElementById('pageTitle').textContent = 'Chỉnh sửa sản phẩm';
    document.getElementById('btnDelete').style.display = 'block';
    loadProduct(productId);
  }

  document.getElementById('btnAddAttr').addEventListener('click', () => addAttributeRow());
  document.getElementById('productForm').addEventListener('submit', handleSubmit);
  document.getElementById('btnDelete')?.addEventListener('click', handleDelete);
});

// ------------------ ATTRIBUTE FUNCTIONS ------------------
function addAttributeRow(attr = {}) {
  const container = document.getElementById('attributesContainer');
  const div = document.createElement('div');
  div.className = 'attr-row';

  div.innerHTML = `
    <input type="text" class="form-control attr-name" placeholder="Tên thuộc tính" value="${attr.name||''}" required>
    <input type="text" class="form-control attr-value" placeholder="Giá trị" value="${attr.value||''}" required>
    <button type="button" class="btn btn-outline-danger btn-sm">Xóa</button>
  `;
  div.querySelector('button').addEventListener('click', () => div.remove());
  container.appendChild(div);
}

function getAttributes() {
  const rows = document.querySelectorAll('#attributesContainer .attr-row');
  return Array.from(rows)
    .map(r => ({
      name: r.querySelector('.attr-name').value.trim(),
      value: r.querySelector('.attr-value').value.trim()
    }))
    .filter(a => a.name && a.value);
}

// ------------------ LOAD PRODUCT ------------------
async function loadProduct(id) {
  try {
    const res = await apiClient.get(`products/${id}`);
    if (res.success) {
      const p = res.data;
      document.getElementById('name').value = p.name;
      document.getElementById('trademark').value = p.trademark;
      document.getElementById('cost_current').value = p.cost_current;
      document.getElementById('cost_old').value = p.cost_old || '';
      document.getElementById('description').value = p.description;
      document.getElementById('status').value = p.status;

      (p.attributes || []).forEach(attr => addAttributeRow(attr));
    } else {
      showError(res.message || 'Không thể tải dữ liệu sản phẩm');
    }
  } catch (err) {
    console.error(err);
    showError('Lỗi khi tải dữ liệu sản phẩm');
  }
}

// ------------------ SUBMIT ------------------
async function handleSubmit(e) {
  e.preventDefault();

  const payload = {
    name: document.getElementById('name').value.trim(),
    trademark: document.getElementById('trademark').value.trim(),
    cost_current: parseFloat(document.getElementById('cost_current').value),
    cost_old: parseFloat(document.getElementById('cost_old').value) || null,
    description: document.getElementById('description').value.trim(),
    status: document.getElementById('status').value,
    attributes: getAttributes()
  };

  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

  try {
    let res;
    if (isEditMode) {
      res = await apiClient.put(`products/${productId}`, payload);
    } 

    // show message giống delete
    if (res.success) {
      showSuccess(res.message || (isEditMode ? 'Cập nhật thành công' : 'Thêm thành công'));
      setTimeout(() => window.location.href = './admin_products.html', 1200);
    } else {
      showError(res.message || 'Không thể lưu sản phẩm');
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  } catch (err) {
    console.error(err);

    const errors = err.data?.errors;
    if (errors) {
        showError(
            Object.values(errors).join("<br>")
        );
    } else {
        showError(err.data?.errors.message);
    }

    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// ------------------ DELETE ------------------
async function handleDelete() {
  const ok = await confirm('Bạn có chắc muốn xóa sản phẩm này?');
  if (!ok) return;

  try {
    const res = await apiClient.delete(`products/${productId}`);
    if (res.success) {
      showSuccess(res.message || 'Đã xóa sản phẩm');
      setTimeout(() => window.location.href = './admin_products.html', 1000);
    } else {
      showError(res.message || 'Không thể xóa sản phẩm');
    }
  } catch (err) {
    console.error(err);
    const msg = err?.response?.data?.message || 'Lỗi khi xóa sản phẩm';
    showError(msg);
  }
}
