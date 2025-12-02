import { ready } from '../../js/main.js';
import { Popup } from '../../components/PopUp.js';
import { BASE_URL } from '../../js/config.js';

ready(async () => {
  const popup = new Popup();

  // --- 1. DỊCH VỤ API (TÁI CẤU TRÚC) ---
  // Gộp 4 hàm fetchData, postData, putData, deleteData thành 1 service
  const http = {
    async request(url, options = {}) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (typeof json.data !== 'undefined') {
          return json.data;
        }
        return json;
      } catch (err) {
        console.error(`Lỗi API từ ${url}:`, err);
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

  // --- 2. DOM SELECTORS VÀ STATE ---
  const elements = {
    tableBody: document.querySelector('#productsTableBody'),
    searchEl: document.querySelector('.product-search'),
    refreshBtn: document.getElementById('btnRefresh'),
    paginationContainer: document.getElementById('pagination-container'),
    paginationSummary: document.getElementById('pagination-summary'),
    paginationControls: document.getElementById('pagination-controls'),
  };

  const state = {
    products: [], // Chỉ lưu sản phẩm của trang HIỆN TẠI
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    keyword: '',
  };

  // --- 3. CÁC HÀM RENDER (Hiển thị) ---

  function renderRows(list) {
    if (!Array.isArray(list) || list.length === 0) {
      elements.tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Không tìm thấy sản phẩm nào.</td></tr>`;
      return;
    }
    elements.tableBody.innerHTML = list.map(p => `
      <tr>
        <td><img src="${p.imageLink}" width="60" style="border-radius:8px;"></td>
        <td>${p.name}</td>
        <td>${Number(p.price).toLocaleString('vi-VN')} VNĐ</td>
        <td>${(Number(p.discount) * 100).toFixed(0)}%</td>
        <td>${p.stock}</td>
        <td>${p.size}</td>
        <td>${p.color}</td>
        <td>${p.category}</td>
        <td class="text-end">
          <button data-action="edit" data-id="${p.id}" class="btn btn-outline-success btn-sm btn-edit me-1">Sửa</button>
          <button data-action="delete" data-id="${p.id}" class="btn btn-outline-danger btn-sm btn-delete" >Xóa</button>
        </td>
      </tr>
    `).join('');
  }

  function renderPagination() {
    const { currentPage, totalPages, totalItems } = state;

    if (totalPages <= 1) {
      elements.paginationContainer.style.display = 'none';
      return;
    }

    elements.paginationContainer.style.display = 'flex';
    elements.paginationSummary.textContent = `Hiển thị trang ${currentPage} / ${totalPages} (Tổng cộng ${totalItems} sản phẩm)`;

    let html = '';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}"><i class="ti ti-chevron-left"></i></a></li>`;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    if (startPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
      if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}"><i class="ti ti-chevron-right"></i></a></li>`;

    elements.paginationControls.innerHTML = html;
  }

  // --- 4. HÀM LOGIC CHÍNH VÀ XỬ LÝ POPUP ---

  async function fetchAndRenderProducts(page = 1, keyword = '') {
    state.currentPage = page;
    state.keyword = keyword;

    elements.tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Đang tải dữ liệu...</td></tr>`;
    elements.paginationContainer.style.display = 'none';

    try {
      const url = `${BASE_URL}/products?page=${page}&search=${encodeURIComponent(keyword)}`;
      const res = await http.get(url); // Sử dụng http service

      if (!res || !res.products || !res.pagination) {
        throw new Error('Định dạng dữ liệu trả về không hợp lệ');
      }

      state.products = res.products.map(p => ({
        id: p.id,
        imageLink: `${BASE_URL + '/' + p.image || '../../assets/images/placeholder.png'}`,
        name: p.name,
        price: parseInt(p.price),
        discount: parseFloat(p.discount) / 100,
        stock: p.stock,
        size: p.size,
        color: p.color,
        category: p.category_name
      }));
      state.totalPages = res.pagination.total_pages || 1;
      state.totalItems = res.pagination.total || 0;

      renderRows(state.products);
      renderPagination();

    } catch (err) {
      console.error('Lỗi khi tải sản phẩm:', err);
      elements.tableBody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-danger">Không thể tải dữ liệu sản phẩm.</td></tr>`;
    }
  }

  // Tách hàm xử lý popup cho dễ đọc
  const onEditAddPopupShow = (product = null) => {
    const isEdit = !!product;
    const title = isEdit ? `Chỉnh sửa sản phẩm #${product.name}` : 'Thêm sản phẩm mới';

    const content = `
      <div class="popup-card">
        <form id="product-form" class="product-form">
          <div class="form-grid">
            <label>Tên sản phẩm<input type="text" name="name" value="${product?.name || ''}" required></label>
            <label>Giá<input type="text" name="price" inputmode="decimal" pattern="^[0-9]+([.,][0-9]+)?$" placeholder="VD: 123000" value="${product?.price || ''}" required></label>
            <label>Giảm giá (%)<input type="number" name="discount" step="any" value="${product?.discount ? product.discount * 100 : ''}"></label>
            <label>Số lượng tồn<input type="number" name="stock" step="1" value="${product?.stock || ''}"></label>
            <label>Size<input type="text" name="size" value="${product?.size || ''}"></label>
            <label>Màu sắc<input type="text" name="color" value="${product?.color || ''}"></label>
            <label>
              Ảnh sản phẩm
              <input type="file" name="imageFile" accept="image/*" id="imageFile">
              <input type="hidden" name="imageLink" value="${product?.imageLink || ''}">
              <div class="image-preview"><img id="imagePreview" src="${product?.imageLink || '../../assets/images/placeholder.png'}" alt="Preview"></div>
            </label>
            <label>
              Danh mục
              <select name="category" id="categorySelect"><option value="">-- Đang tải... --</option></select>
              <textarea name="newCategory" id="newCategory" placeholder="Nhập danh mục mới..." style="display:none;"></textarea>
            </label>
          </div>
          <div class="popup-actions">
            <button type="button" class="btn-cancel">Hủy</button>
            <button type="submit" class="btn-save">${isEdit ? 'Cập nhật' : 'Thêm mới'}</button>
          </div>
        </form>
      </div>`;

    popup.show({ title, content });

    // Lấy các element trong popup
    const form = document.getElementById('product-form');
    const categorySelect = document.getElementById('categorySelect');
    const newCategory = document.getElementById('newCategory');
    const fileInput = document.getElementById('imageFile');
    const previewImg = document.getElementById('imagePreview');

    // Gắn sự kiện cho các element trong popup
    form.querySelector('.btn-cancel').addEventListener('click', () => popup.hide());
    form.addEventListener('submit', (e) => handleProductFormSubmit(e, product));

    // Gọi các hàm logic phụ
    populateCategories(categorySelect, newCategory, product?.category, !isEdit);
    setupImagePreview(fileInput, previewImg);
  };

  async function populateCategories(selectEl, newCategoryEl, currentCategoryName, showNew) {
    if (showNew) {
      newCategoryEl.style.display = 'block';
    }

    selectEl.addEventListener('change', () => {
      newCategoryEl.style.display = selectEl.value === '' ? 'block' : 'none';
      if (selectEl.value !== '') newCategoryEl.value = '';
    });

    const res = await http.get(`${BASE_URL}/categories`); // Dùng http service
    if (res && Array.isArray(res.categories)) {
      selectEl.innerHTML = '<option value="">-- Nhập danh mục --</option>'; // Xóa "Đang tải..."
      res.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        if (currentCategoryName === c.name) {
          opt.selected = true;
          newCategoryEl.style.display = 'none'; // Ẩn nếu đang edit và đã có danh mục
        }
        selectEl.appendChild(opt);
      });
    } else {
      selectEl.innerHTML = '<option value="">-- Lỗi tải danh mục --</option>';
    }
  }

  function setupImagePreview(fileInput, previewImg) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => { previewImg.src = e.target.result; };
        reader.readAsDataURL(file);
      }
    });
  }

  async function handleProductFormSubmit(e, product) {
    e.preventDefault();
    const isEdit = !!product;
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      // 1. Xử lý danh mục mới (nếu có)
      if (data.newCategory) {
        const body = { name: data.newCategory, description: '' };
        const res = await http.post('http://localhost/btl-db/backend/categories', body); // Dùng http service
        if (res && res.id) {
          data.category = res.id;
        } else {
          throw new Error("Không thể tạo danh mục mới.");
        }
      }

      // 2. Xử lý upload ảnh (nếu có)
      let imageUrl = product?.imageLink || '';
      const file = formData.get('imageFile'); // Lấy file từ FormData
      if (file && file.size > 0) {
        const uploadData = new FormData(); // FormData riêng cho upload
        uploadData.append('file', file);
        // Lưu ý: Upload file không phải JSON nên dùng fetch_request
        const uploadRes = await http.request(`${BASE_URL}/upload`, { method: 'POST', body: uploadData });
        console.log(uploadRes);
        imageUrl = uploadRes.url;
      }

      // 3. Chuẩn bị body để Gửi/Cập nhật sản phẩm
      // console.log('imageUrl', imageUrl, imageUrl.replace(BASE_URL + '/', ''));
      // console.log(BASE_URL);
      const body = {
        name: data.name,
        price: parseFloat(data.price || 0),
        discount: parseFloat(data.discount || 0),
        stock: parseInt(data.stock || 0),
        size: data.size,
        color: data.color,
        image: imageUrl.replace(BASE_URL + '/', ''),
        category_id: data.category,
      };

      // 4. Gửi
      if (isEdit) {
        await http.put(`${BASE_URL}/products/${product.id}`, body); // Dùng http service
      } else {
        await http.post(`${BASE_URL}/products`, body); // Dùng http service
      }

      popup.hide();
      await fetchAndRenderProducts(state.currentPage, state.keyword);
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm:', err);
      alert(`Lỗi khi lưu sản phẩm: ${err.message}`);
    }
  }

  const onDeleteConfirmPopup = (product) => {
    if (!product) return;

    // 1. Tạo chuỗi HTML có chứa các nút
    //    Tôi dùng ID (popup-btn-cancel, popup-btn-confirm) để query an toàn hơn
    const contentHtml = `
      <p>Bạn có chắc chắn muốn xóa sản phẩm này không?</p>
      
      <div class="popup-actions">
        <button type="button" class="btn btn-outline-secondary" id="popup-btn-cancel">Hủy</button>
        <button type="button" class="btn btn-danger" id="popup-btn-confirm">Xác nhận Xóa</button>
      </div>
    `;

    // 2. Hiển thị popup, chỉ truyền 'content'
    popup.show({
      title: `Xóa sản phẩm #${product.name}`,
      content: contentHtml
      // Không dùng mảng 'actions'
    });

    // 3. Tìm các nút chúng ta vừa tạo (ngay trong document)
    //    Dùng document.getElementById thay vì tìm qua 'form'
    const cancelBtn = document.getElementById('popup-btn-cancel');
    const confirmBtn = document.getElementById('popup-btn-confirm');

    // 4. Gán sự kiện 'click' cho nút Hủy
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        popup.hide();
      });
    }

    // 5. Gán sự kiện 'click' cho nút Xác nhận
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        try {
          // Thực hiện hành động xóa
          await http.delete(`${BASE_URL}/products/${product.id}`); // Dùng http service
          popup.hide();
          await fetchAndRenderProducts(state.currentPage, state.keyword);
        } catch (err) {
          console.error('Lỗi khi xóa sản phẩm:', err);
          alert('Không thể xóa sản phẩm. Vui lòng thử lại!');
        }
      });
    }
  };

  // --- 5. HÀM TIỆN ÍCH ---
  let debounceTimer;
  function debounce(func, delay) {
    return function (...args) {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };
  }

  // --- 6. GẮN CÁC SỰ KIỆN ---

  if (elements.searchEl) {
    elements.searchEl.addEventListener('input', debounce((e) => {
      fetchAndRenderProducts(1, e.target.value.trim());
    }, 300));
  }

  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (elements.searchEl) elements.searchEl.value = '';
      fetchAndRenderProducts(1, '');
    });
  }

  // Event Delegation cho toàn bộ trang
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
      onEditAddPopupShow(product);
    } else if (e.target.matches('.btn-add-product')) {
      onEditAddPopupShow();
    } else if (e.target.matches('.btn-delete')) {
      const id = Number(e.target.dataset.id);
      const product = state.products.find((p) => p.id === id);
      onDeleteConfirmPopup(product);
    }
  });


  // --- 7. KHỞI CHẠY ---
  await fetchAndRenderProducts(1, '');

}); // Hết hàm ready()