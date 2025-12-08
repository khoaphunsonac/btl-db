import { ready } from '../../js/main.js';
import { Popup } from '../../components/PopUp.js';
import { BASE_URL } from '../../js/config.js';
// Giả định utils.js có các hàm này
import { showSuccess, showError, confirm, formatDate, renderPagination } from '../../js/utils.js'; 

ready(async () => {
  const popup = new Popup();
  const LIMIT = 10;

  // --- 1. DỊCH VỤ API ---
  const http = {
    async request(url, options = {}) {
      try {
        const fullUrl = `${BASE_URL}/api/${url}`;
        const res = await fetch(fullUrl, options);
        const json = await res.json();
        
        if (res.ok && json.success) {
            return json; 
        } else {
            throw new Error(json.message || `Lỗi API HTTP ${res.status}`);
        }
      } catch (err) {
        console.error(`Lỗi API từ ${url}:`, err);
        showError(`Lỗi kết nối hoặc xử lý API: ${err.message}`);
        return { success: false, data: [], meta: { total: 0 } };
      }
    },
    get(url) { return this.request(url); },
    post(url, body) { return this.request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); },
    put(url, body) { return this.request(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); },
    delete(url) { return this.request(url, { method: "DELETE" }); },
  };

  // --- 2. STATE VÀ CÁC ELEMENTS ---
  const state = {
    categories: [],
    page: 1,
    totalPages: 1,
    keyword: '',
    
    // Selectors
    tableBody: document.getElementById('categoryTableBody'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    btnAddCategory: document.getElementById('btnAddCategory'),
    
    paginationContainer: document.getElementById('pagination-container'),
    paginationSummary: document.getElementById('pagination-summary'),
    paginationControls: document.getElementById('pagination-controls'),
  };

  // --- 3. HÀM TẢI VÀ RENDER DỮ LIỆU ---

  async function fetchAndRenderCategories(page = state.page, keyword = state.keyword) {
    state.tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">Đang tải dữ liệu...</td></tr>';
    state.paginationContainer.style.display = 'none';

    try {
        // Gọi API: /api/categories?page=...&limit=...&keyword=...
        const response = await http.get(`categories?page=${page}&limit=${LIMIT}&keyword=${keyword}`);
        
        if (response.success && response.data) {
            state.categories = response.data;
            state.page = page;
            state.totalPages = response.meta.total_pages;

            renderCategoryTable(response.data);
            renderPaginationControls(response.meta);
        } else {
            renderEmptyTable(response.message || 'Không tìm thấy danh mục nào.');
        }
    } catch (err) {
        renderEmptyTable('Lỗi tải dữ liệu danh mục.');
    }
  }

  function renderCategoryTable(categories) {
    if (categories.length === 0) {
        return renderEmptyTable('Không tìm thấy danh mục nào.');
    }

    state.tableBody.innerHTML = categories.map((cat, index) => {
        const globalIndex = ((state.page - 1) * LIMIT) + index + 1;
        return `
            <tr>
                <td class="w-1 text-center">${globalIndex}</td>
                <td>
                    <strong>${cat.name}</strong>
                    ${cat.description ? `<br><small class="text-muted">${cat.description}</small>` : ''}
                </td>
                <td class="text-center">${cat.product_count || 0}</td>
                <td class="text-center text-muted">${formatDate(cat.created_at)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-ghost-primary btn-edit" data-id="${cat.id}">Sửa</button>
                    <button class="btn btn-sm btn-ghost-danger btn-delete" data-id="${cat.id}">Xóa</button>
                </td>
            </tr>
        `;
    }).join('');
  }

  function renderEmptyTable(message) {
    state.tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-4 text-muted">${message}</td>
        </tr>
    `;
    state.paginationContainer.style.display = 'none';
  }

  function renderPaginationControls(meta) {
    renderPagination(state.paginationControls, meta, (newPage) => {
        fetchAndRenderCategories(newPage, state.keyword);
    });

    state.paginationSummary.textContent = 
        `Hiển thị ${(meta.page - 1) * meta.limit + 1} đến ${Math.min(meta.page * meta.limit, meta.total)} trong tổng số ${meta.total} danh mục`;
    
    state.paginationContainer.style.display = meta.total > 0 ? 'flex' : 'none';
  }
  
  // --- 4. POPUP VÀ CRUD HANDLERS ---

  function onEditAddPopupShow(category = null) {
    const isEdit = !!category;
    const title = isEdit ? `Chỉnh sửa Danh mục: ${category.name}` : 'Thêm Danh mục mới';
    
    const popupContent = `
        <form id="categoryForm" class="category-form" onsubmit="return false;">
            <input type="hidden" name="id" value="${category ? category.id : ''}">
            <div class="form-grid">
                <label>
                    Tên danh mục <span class="text-danger">*</span>
                    <input type="text" name="name" id="categoryName" value="${category ? category.name : ''}" required>
                </label>
            </div>
            <div class="form-group">
                <label>
                    Mô tả (tùy chọn)
                    <textarea name="description" rows="3">${category ? category.description || '' : ''}</textarea>
                </label>
            </div>
            
            <div class="form-actions mt-4">
                <button type="button" class="btn btn-ghost-secondary me-2" onclick="popup.hide()">Hủy</button>
                <button type="submit" class="btn btn-primary" id="btnSaveCategory">
                    <i class="ti ti-device-floppy me-2"></i>${isEdit ? 'Lưu Thay Đổi' : 'Thêm Danh mục'}
                </button>
            </div>
        </form>
    `;

    popup.show({ title, content: popupContent, elementId: 'categoryPopup' });
    document.getElementById('categoryForm').addEventListener('submit', onSaveCategory);
  }

  async function onSaveCategory(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    const categoryData = {
        name: formData.get('name').trim(),
        description: formData.get('description').trim() || null,
        id: formData.get('id') ? Number(formData.get('id')) : null,
    };
    
    if (!categoryData.name) {
        return showError('Vui lòng nhập Tên danh mục.');
    }

    const isEdit = !!categoryData.id;
    const url = isEdit ? `categories/${categoryData.id}` : 'categories';
    const method = isEdit ? http.put : http.post;
    
    try {
        const response = await method(url, categoryData);
        
        if (response.success) {
            showSuccess(isEdit ? 'Đã cập nhật danh mục thành công.' : 'Đã thêm danh mục mới thành công.');
            popup.hide();
            fetchAndRenderCategories(state.page, state.keyword);
        } else {
            showError(response.message || 'Lưu danh mục thất bại.');
        }
    } catch (error) {
        showError(`Lỗi hệ thống: ${error.message}`);
    }
  }

  async function onDeleteCategory(id) {
    const category = state.categories.find(c => c.id === id);
    if (!category) return;

    const confirmed = await confirm(`Bạn có chắc muốn xóa danh mục: ${category.name}?`);
    if (!confirmed) return;

    try {
        const response = await http.delete(`categories/${id}`);
        
        if (response.success) {
            showSuccess('Đã xóa danh mục thành công.');
            fetchAndRenderCategories(state.page, state.keyword);
        } else {
            showError(response.message || 'Xóa danh mục thất bại.');
        }
    } catch (error) {
        showError(`Lỗi hệ thống: ${error.message}`);
    }
  }


  // --- 5. KHỞI TẠO VÀ XỬ LÝ SỰ KIỆN ---
  
  // Khởi tạo và tải dữ liệu lần đầu
  fetchAndRenderCategories(1, '');
  
  // Xử lý tìm kiếm
  const debounce = (func, delay) => { // Giả định hàm debounce có sẵn
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  };

  state.searchInput.addEventListener('input', debounce((e) => {
    fetchAndRenderCategories(1, e.target.value.trim());
  }, 300));
  
  // Xử lý làm mới
  state.refreshBtn.addEventListener('click', (e) => {
    e.preventDefault();
    state.searchInput.value = '';
    fetchAndRenderCategories(1, '');
  });

  // Xử lý thêm mới
  state.btnAddCategory.addEventListener('click', () => {
    onEditAddPopupShow(null);
  });
  
  // Event Delegation cho toàn bộ trang (Sửa/Xóa/Phân trang)
  document.addEventListener('click', (e) => {
    // Click vào nút phân trang
    const pageLink = e.target.closest('.page-link');
    if (pageLink) {
        e.preventDefault();
        const pageItem = pageLink.closest('.page-item');
        if (pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) {
            return;
        }
        const newPage = parseInt(pageLink.dataset.page);
        if (newPage) fetchAndRenderCategories(newPage, state.keyword);
        return;
    }

    // Click vào Sửa
    if (e.target.matches('.btn-edit')) {
        const id = Number(e.target.dataset.id);
        const category = state.categories.find((c) => c.id === id);
        if (category) onEditAddPopupShow(category);
    } 
    // Click vào Xóa
    else if (e.target.matches('.btn-delete')) {
        const id = Number(e.target.dataset.id);
        onDeleteCategory(id);
    }
  });

});