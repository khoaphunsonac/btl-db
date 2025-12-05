import { ready } from '../../js/main.js';
import { Popup } from '../../components/PopUp.js';
import { BASE_URL } from '../../js/config.js';
// Import các hàm tiện ích
import { showSuccess, showError, confirm, formatDate, formatCurrency, renderPagination } from '../../js/utils.js'; // Giả định utils.js có các hàm này

ready(async () => {
  const popup = new Popup();

  // --- 1. DỊCH VỤ API (TÁI CẤU TRÚC) --- (Giữ nguyên từ file gốc)
  const http = {
    async request(url, options = {}) {
      try {
        const fullUrl = `${BASE_URL}/api/${url}`; // Thêm /api/ vào BASE_URL
        const res = await fetch(fullUrl, options);
        // Tái cấu trúc: Backend trả về { success: true, data: [...] } hoặc { success: false, message: '...' }
        const json = await res.json();
        
        if (res.ok && json.success) {
            return json; // Trả về toàn bộ response để lấy cả pagination
        } else {
            // Xử lý lỗi từ backend
            throw new Error(json.message || `Lỗi API HTTP ${res.status}`);
        }
      } catch (err) {
        console.error(`Lỗi API từ ${url}:`, err);
        // Hiển thị lỗi chung cho người dùng
        showError(`Lỗi kết nối hoặc xử lý API: ${err.message}`);
        return null;
      }
    },
    get(url) {
      return this.request(url);
    },
    post(url, body) {
      return this.request(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    put(url, body) {
      return this.request(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    delete(url) {
      return this.request(url, {
        method: "DELETE",
      });
    },
  };

  // --- 2. STATE VÀ ELEMENTS ---
  const state = {
    products: [],
    categories: [], // Cần cho form Thêm/Sửa
    currentPage: 1,
    limit: 10,
    keyword: '',
    totalPages: 1,
  };

  const elements = {
    tableBody: document.getElementById('productTableBody'),
    searchEl: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    paginationContainer: document.getElementById('pagination-container'),
    paginationControls: document.getElementById('pagination-controls'),
    paginationSummary: document.getElementById('pagination-summary'),
    // PopUp Form elements
    popupForm: document.getElementById('productForm'),
    btnSave: document.getElementById('btnSave'),
    productPopupTitle: document.getElementById('productPopupTitle'),
    // ... Thêm các element form khác (ví dụ: name, price, category, description...)
    nameInput: document.getElementById('name'),
    priceInput: document.getElementById('price'),
    categorySelect: document.getElementById('category'),
    descriptionInput: document.getElementById('description'),
    imageInput: document.getElementById('image'),
    imagePreview: document.getElementById('image-preview'),
  };

  // --- 3. LOGIC CHÍNH ---

  /**
   * Tải danh sách sản phẩm và render ra bảng
   */
  const fetchAndRenderProducts = async (page = 1, keyword = state.keyword) => {
    state.currentPage = page;
    state.keyword = keyword;
    
    // Hiển thị trạng thái tải
    elements.tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Đang tải dữ liệu...</td></tr>`;
    elements.paginationContainer.style.display = 'none';

    try {
      // Giả định API endpoint là /products
      const url = `products?page=${page}&limit=${state.limit}&search=${encodeURIComponent(keyword)}`;
      const response = await http.get(url);

      if (response && response.success) {
        state.products = response.data.items || [];
        state.totalPages = response.data.totalPages || 1;
        state.limit = response.data.limit || 10;
        
        renderProductTable(state.products);
        renderPagination(state.currentPage, state.totalPages, elements.paginationControls, elements.paginationSummary, response.data.totalItems);
        elements.paginationContainer.style.display = state.totalPages > 1 ? 'flex' : 'none';

      } else {
        renderProductTable([]);
      }
    } catch (error) {
        // Lỗi đã được xử lý trong http.request
        renderProductTable([]);
    }
  };

  /**
   * Render danh sách sản phẩm
   */
  const renderProductTable = (products) => {
    if (products.length === 0) {
      elements.tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Không tìm thấy sản phẩm nào.</td></tr>`;
      return;
    }

    elements.tableBody.innerHTML = products.map((p, index) => `
      <tr>
        <td>${index + 1 + (state.currentPage - 1) * state.limit}</td>
        <td><img src="${p.image_url || 'default.jpg'}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"></td>
        <td>${p.id}</td>
        <td><div class="text-truncate" style="max-width: 200px">${p.name}</div></td>
        <td>${p.category_name || '-'}</td>
        <td>${formatCurrency(p.price)}</td>
        <td>${p.stock_quantity || 0}</td>
        <td>${formatDate(p.created_at)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-ghost-primary btn-edit" data-id="${p.id}">
            <i class="ti ti-edit"></i> Sửa
          </button>
          <button class="btn btn-sm btn-ghost-danger btn-delete" data-id="${p.id}">
            <i class="ti ti-trash"></i> Xóa
          </button>
        </td>
      </tr>
    `).join('');
  };
  
  /**
   * Tải danh mục cho form Thêm/Sửa
   */
  const fetchCategories = async () => {
      try {
          // Giả định API endpoint là /categories
          const response = await http.get('categories');
          if (response && response.success) {
              state.categories = response.data.items || [];
              renderCategoryOptions();
          }
      } catch (error) {
          console.error("Không thể tải danh mục:", error);
      }
  };

  /**
   * Render options cho Category Select
   */
  const renderCategoryOptions = () => {
      elements.categorySelect.innerHTML = state.categories.map(c => 
          `<option value="${c.id}">${c.name}</option>`
      ).join('');
  };


  // --- 4. POPUP VÀ XỬ LÝ FORM ---
  let currentProductId = null;

  const onEditAddPopupShow = (product = null) => {
    currentProductId = product ? product.id : null;
    elements.productPopupTitle.textContent = product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới';
    elements.popupForm.reset();
    
    // Điền dữ liệu nếu là Sửa
    if (product) {
      elements.nameInput.value = product.name;
      elements.priceInput.value = product.price;
      elements.descriptionInput.value = product.description;
      // Chọn Category đúng
      elements.categorySelect.value = product.category_id;
      // Hiển thị ảnh cũ
      elements.imagePreview.innerHTML = product.image_url ? `<img src="${product.image_url}" alt="Ảnh cũ">` : '';
    } else {
        elements.imagePreview.innerHTML = '';
    }
    
    popup.show();
  };

  const onSaveProduct = async (e) => {
    e.preventDefault();
    const isEdit = currentProductId !== null;
    const action = isEdit ? 'Cập nhật' : 'Thêm mới';
    
    // Tạm thời bỏ qua việc xử lý file ảnh phức tạp (cần FormData, không phải JSON)
    // Giả sử chỉ gửi các trường văn bản
    const productData = {
        name: elements.nameInput.value,
        price: Number(elements.priceInput.value),
        category_id: Number(elements.categorySelect.value),
        description: elements.descriptionInput.value,
        // Dữ liệu ảnh cần xử lý phức tạp hơn (VD: Base64 hoặc upload riêng)
        // Hiện tại bỏ qua Image
    };
    
    let response;
    try {
        if (isEdit) {
            response = await http.put(`products/${currentProductId}`, productData);
        } else {
            response = await http.post('products', productData);
        }

        if (response && response.success) {
            showSuccess(`${action} sản phẩm thành công!`);
            popup.hide();
            await fetchAndRenderProducts(state.currentPage, state.keyword);
        } else {
            // Lỗi đã được bắt trong http.request và show ra
        }
    } catch (error) {
        // Lỗi đã được bắt trong http.request
    }
  };
  
  /**
   * Xóa sản phẩm
   */
  const onDeleteProduct = async (id) => {
      const confirmed = await confirm('Bạn có chắc muốn xóa sản phẩm này?');
      if (!confirmed) return;
      
      try {
          const response = await http.delete(`products/${id}`);
          if (response && response.success) {
              showSuccess('Đã xóa sản phẩm thành công!');
              await fetchAndRenderProducts(state.currentPage, state.keyword);
          } else {
              // Lỗi đã được bắt trong http.request
          }
      } catch (error) {
          // Lỗi đã được bắt trong http.request
      }
  };

  // --- 5. INITIALIZATION VÀ EVENT LISTENERS ---

  const initializeEventListeners = () => {
    // Search
    if (elements.searchEl) {
      // Sử dụng debounce để giới hạn tần suất gọi API khi gõ
      elements.searchEl.addEventListener('input', debounce((e) => {
        fetchAndRenderProducts(1, e.target.value.trim());
      }, 300));
    }

    // Refresh
    if (elements.refreshBtn) {
      elements.refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (elements.searchEl) elements.searchEl.value = '';
        fetchAndRenderProducts(1, '');
      });
    }
    
    // Xử lý sự kiện PopUp Save
    elements.btnSave.addEventListener('click', onSaveProduct);

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
            if (newPage) fetchAndRenderProducts(newPage, state.keyword);
            return;
        }

        // Click vào Sửa / Thêm / Xóa
        if (e.target.matches('.btn-edit')) {
            const id = Number(e.target.dataset.id);
            const product = state.products.find((p) => p.id === id);
            if (product) onEditAddPopupShow(product);
        } else if (e.target.matches('.btn-add-product')) {
            onEditAddPopupShow(null);
        } else if (e.target.matches('.btn-delete')) {
            const id = Number(e.target.dataset.id);
            onDeleteProduct(id);
        }
    });
  };
  
  // Hàm debounce utility (từ file gốc)
  function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // Khởi chạy
  initializeEventListeners();
  fetchCategories();
  fetchAndRenderProducts();
});