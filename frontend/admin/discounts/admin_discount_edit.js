/**
 * Discount Management - Edit Page
 * NEMTHUNG E-commerce Admin
 */

import apiClient from '../../js/api-client.js';
import { formatDateTime, showSuccess, showError, confirm } from '../../js/utils.js';

// State
let discountId = null;
let isEditMode = false;

document.addEventListener('DOMContentLoaded', () => {
  initializePage();
  initializeEventListeners();
});

/** ---------- Helpers to convert between API datetime and datetime-local ---------- **/
function sqlToLocalInput(sqlDateTime) {
  // sqlDateTime: "YYYY-MM-DD HH:MM:SS" -> returns "YYYY-MM-DDTHH:MM"
  if (!sqlDateTime) return '';
  const parts = sqlDateTime.split(' ');
  if (parts.length < 2) return '';
  const date = parts[0];
  const time = parts[1].slice(0,5); // HH:MM
  return `${date}T${time}`;
}

function localInputToSql(localValue) {
  // localValue: "YYYY-MM-DDTHH:MM" -> returns "YYYY-MM-DD HH:MM:00"
  if (!localValue) return null;
  return localValue.replace('T', ' ') + ':00';
}

/** ---------- Init page ---------- **/
function initializePage() {
  const urlParams = new URLSearchParams(window.location.search);
  discountId = urlParams.get('id');

  if (discountId) {
    isEditMode = true;
    setupEditMode();
    loadDiscountData(discountId);
  } else {
    isEditMode = false;
    setupAddMode();
  }
}

function setupEditMode() {
  document.getElementById('pageTitle').textContent = 'Chỉnh sửa mã giảm giá';
  document.getElementById('btnDelete').style.display = 'block';
  document.getElementById('infoCard').style.display = 'block';
}

function setupAddMode() {
  document.getElementById('pageTitle').textContent = 'Thêm mã giảm giá mới';
  document.getElementById('btnDelete').style.display = 'none';
  document.getElementById('infoCard').style.display = 'none';
}

/** ---------- Event listeners ---------- **/
function initializeEventListeners() {
  document.getElementById('discountForm').addEventListener('submit', handleSubmit);

  const btnDelete = document.getElementById('btnDelete');
  btnDelete?.addEventListener('click', handleDelete);

  // Basic validation: when time inputs change, remove validity hints
  document.getElementById('time_start')?.addEventListener('change', () => {
    document.getElementById('time_start').classList.remove('is-invalid');
    document.getElementById('time_end').classList.remove('is-invalid');
  });
  document.getElementById('time_end')?.addEventListener('change', () => {
    document.getElementById('time_start').classList.remove('is-invalid');
    document.getElementById('time_end').classList.remove('is-invalid');
  });
}

/** ---------- Load discount for edit ---------- **/
async function loadDiscountData(id) {
  try {
    const response = await apiClient.get(`discounts/${id}`);
    if (response.success) {
      populateForm(response.data);
    } else {
      showError(response.message || 'Không thể tải dữ liệu mã giảm giá');
      setTimeout(() => window.location.href = './index.html', 1200);
    }
  } catch (err) {
    console.error('Error loading discount:', err);
    showError('Lỗi khi tải dữ liệu mã giảm giá');
    setTimeout(() => window.location.href = './index.html', 1200);
  }
}

function populateForm(d) {
  document.getElementById('value').value = d.value ?? '';
  document.getElementById('condition').value = d.condition ?? '';
  document.getElementById('time_start').value = sqlToLocalInput(d.time_start);
  document.getElementById('time_end').value = sqlToLocalInput(d.time_end);
  document.getElementById('type').value = d.type ?? '';

  // Info card
  document.getElementById('infoId').textContent = d.id ?? '-';
  document.getElementById('createdAt').textContent = d.created_at ? formatDateTime(d.created_at) : '-';
  document.getElementById('updatedAt').textContent = d.updated_at ? formatDateTime(d.updated_at) : '-';
}

/** ---------- Form handling ---------- **/
function getFormData() {
  return {
    value: document.getElementById('value').value.trim(),
    condition: document.getElementById('condition').value.trim(),
    time_start: localInputToSql(document.getElementById('time_start').value),
    time_end: localInputToSql(document.getElementById('time_end').value),
    type: document.getElementById('type').value
  };
}

function validateForm() {
  const form = document.getElementById('discountForm');

  // native validation
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return false;
  }

  // custom datetime check
  const ts = document.getElementById('time_start').value;
  const te = document.getElementById('time_end').value;
  if (!ts || !te) {
    document.getElementById('time_start').classList.add('is-invalid');
    document.getElementById('time_end').classList.add('is-invalid');
    showError('Vui lòng chọn thời gian bắt đầu và kết thúc');
    return false;
  }
  if (new Date(ts) >= new Date(te)) {
    document.getElementById('time_start').classList.add('is-invalid');
    document.getElementById('time_end').classList.add('is-invalid');
    showError('Thời gian bắt đầu phải sớm hơn thời gian kết thúc');
    return false;
  }

  // value positive
  const value = parseFloat(document.getElementById('value').value);
  if (isNaN(value) || value <= 0) {
    document.getElementById('value').classList.add('is-invalid');
    showError('Giá trị phải là số lớn hơn 0');
    return false;
  }

  // type must be chosen
  const type = document.getElementById('type').value;
  if (!type) {
    document.getElementById('type').classList.add('is-invalid');
    showError('Vui lòng chọn loại giảm giá');
    return false;
  }

  return true;
}

/** ---------- Submit (Create / Update) ---------- **/
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const btn = document.getElementById('btnSubmit');
  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

  const payload = getFormData();

  try {
    let response;
    if (isEditMode) {
      response = await apiClient.put(`discounts/${discountId}`, payload);
    } else {
      response = await apiClient.post('discounts', payload);
    }

    if (response.success) {
      showSuccess(isEditMode ? 'Cập nhật mã giảm giá thành công' : 'Thêm mã giảm giá thành công');
      setTimeout(() => window.location.href = './index.html', 1200);
    } else {
      showError(response.message || 'Không thể lưu mã giảm giá');
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  } catch (err) {
    console.error('Save error:', err);
    showError('Lỗi khi lưu mã giảm giá');
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/** ---------- Delete ---------- **/
async function handleDelete() {
  const ok = await confirm('Bạn có chắc muốn xóa mã giảm giá này?');
  if (!ok) return;

  try {
    const response = await apiClient.delete(`discounts/${discountId}`);
    if (response.success) {
      showSuccess('Đã xóa mã giảm giá');
      setTimeout(() => window.location.href = './index.html', 1000);
    } else {
      showError(response.message || 'Không thể xóa mã giảm giá');
    }
  } catch (err) {
    console.error('Delete error:', err);
    showError('Lỗi khi xóa mã giảm giá');
  }
}

export {}; // module scope
