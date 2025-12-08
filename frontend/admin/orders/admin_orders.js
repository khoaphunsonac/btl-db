import { ready } from '../../js/main.js';
import { BASE_URL } from '../../js/config.js';
import { Popup } from '../../components/PopUp.js';
import { apiGet, apiPut, apiDelete, apiPost } from '../../js/api-client.js';



ready(async () => {
  // const API_BASE = BASE_URL;
  const popup = new Popup();
  const API_BASE = BASE_URL; 
  // --- 1. DOM SELECTORS (ĐÃ CẬP NHẬT) ---
  const tableHeadSel = '#ordersTableHead';
  const tableBodySel = '#ordersTableBody';

  // Xóa selector cũ '#ordersPagination'
  // Thêm selectors cho style mới
  const paginationContainer = document.getElementById('pagination-container');
  const paginationSummary = document.getElementById('pagination-summary');
  const paginationControls = document.getElementById('pagination-controls');


  // --- 2. STATE VÀ CÁC HẰNG SỐ ---
  const state = {
    currentTab: 'cart',
    page: 1,
    totalPages: 1,
    keyword: '',
    status: 'all',
  };

  const STATUS_OPTIONS = {
    pending: 'Chờ xử lý',
    approved: 'Đã duyệt',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy'
  };

  // --- 3. HÀM GỌI API ---
 

  // --- 4. HÀM LOGIC CHÍNH ---
  async function loadCurrentTabData() {
    const { currentTab, page, keyword, status } = state;
    if (currentTab === 'cart') {
      await fetchAndRenderCarts(page, keyword);
    } else {
      await fetchAndRenderOrders(page, keyword, status);
    }
  }

  // --- 5. CÁC HÀM RENDER (Tạo Giao Diện) ---

  function createStatusDropdown(currentStatus) {
    const optionsHtml = Object.entries(STATUS_OPTIONS)
      .map(([value, text]) => {
        const selected = (value === currentStatus) ? 'selected' : '';
        return `<option value="${value}" ${selected}>${text}</option>`;
      })
      .join('');
    return `
      <select class="form-select form-select-sm order-status-select" 
              style="min-width: 140px;">
        ${optionsHtml}
      </select>
    `;
  }

  function setHeadForCart() {
    document.querySelector(tableHeadSel).innerHTML = `
      <tr>
        <th>Người dùng</th>
        <th>Số sản phẩm</th>
        <th>Lần cập nhật cuối</th>
        <th class="text-end">Thao tác</th>
      </tr>
    `;
  }
  function setHeadForOrders() {
    document.querySelector(tableHeadSel).innerHTML = `
      <tr>
        <th>Người dùng</th>
        <th>Địa chỉ</th>
        <th>Trạng thái</th>
        <th>Phương thức thanh toán</th>
        <th>Ngày tạo đơn</th>
        <th>Trước khi giảm giá</th>
        <th>Discount</th>
        <th>Tổng cộng</th>
        <th class="text-end">Thao tác</th>
      </tr>
    `;
  }

  function renderCartRows(carts, page = 1, totalPages = 1) {
    const tbody = document.querySelector(tableBodySel);
    if (!Array.isArray(carts) || carts.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Không có dữ liệu</td></tr>`;
      renderPagination(1, 1, 0); // Cập nhật để có 3 tham số
      return;
    }
    tbody.innerHTML = carts.map(c => `
      <tr>
        <td>${c.customer_name || c.user_name || c.user || '-'}</td>         <td>${c.total_items}</td>
        <td>${c.updated_at || '-'}</td>
        <td class="text-end">
          <button class="btn btn-outline-primary btn-sm btn-view-cart me-1" data-id="${c.user_id}">Xem</button>
        </td>
      </tr>
    `).join('');
    // Chú ý: API /carts của bạn phải trả về totalItems
    renderPagination(page, totalPages, state.totalItems);
  }


  async function handleCreateOrderSubmit(popup, API_BASE) {
    const userFname = document.getElementById('orderUserFname').value.trim();
    const userLname = document.getElementById('orderUserLname').value.trim();
    const userEmail = document.getElementById('orderUserEmail').value.trim();
    const shippingAddress = document.getElementById('orderShippingAddress').value.trim();
    const paymentMethod = document.getElementById('orderPaymentMethod').value;
    const discountId = document.getElementById('orderDiscountId').value.trim();
    
    // 1. Validation cơ bản (SỬ DỤNG CÁC TRƯỜNG INPUT ĐÃ ĐỊNH NGHĨA)
    if (!userFname || !userLname || !userEmail || !shippingAddress || !paymentMethod) {
        popup.show({ title: 'Lỗi', content: 'Vui lòng điền đầy đủ Tên, Họ, Email, Địa chỉ và Phương thức thanh toán.' });
        return;
    }
    
    // 2. Xử lý chi tiết sản phẩm
    const itemElements = document.querySelectorAll('#orderItemsContainer .order-item');
    const items = [];
    let isValid = true;
    
    itemElements.forEach(row => {
        const productId = row.querySelector('.item-product-id').value; 
        const quantity = row.querySelector('.item-quantity').value;

        if (!productId || !quantity || parseInt(quantity) <= 0) {
            isValid = false;
        }

        items.push({
            product_id: parseInt(productId),
            quantity: parseInt(quantity),
        });
    });

    if (!isValid || items.length === 0) {
        popup.show({ title: 'Lỗi', content: 'Vui lòng nhập chi tiết sản phẩm hợp lệ (ID, Số lượng > 0).' });
        return;
    }
    
    let userId = null;
    
    // 3. TÌM KIẾM HOẶC TẠO NGƯỜI DÙNG DỰA TRÊN EMAIL
    try {
        const userData = { fname: userFname, lname: userLname, email: userEmail };
        // Giả định bạn có API để tạo/tìm kiếm người dùng: POST /api/users/find_or_create
        const userResult = await apiPost(API_BASE + '/users/find_or_create', userData);
        
        if (userResult && userResult.success && userResult.data && userResult.data.id) {
            userId = userResult.data.id;
        } else {
            popup.show({ title: 'Lỗi Người dùng', content: userResult.message || 'Không thể tìm hoặc tạo người dùng mới.' });
            return;
        }
    } catch (error) {
        console.error('API User Error:', error);
        popup.show({ title: 'Lỗi', content: 'Không thể kết nối API người dùng.' });
        return;
    }
    
    // 4. Tạo Đơn Hàng
    const orderData = {
        user_id: parseInt(userId),
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        discount_id: discountId ? parseInt(discountId) : null,
        items: items,
    };
    
    try {
        const result = await apiPost(API_BASE + '/orders', orderData);

        if (result && result.success) {
            popup.hide();
            await loadData(state.currentTab, state.page); // Đã sửa tên hàm tải dữ liệu (Nếu có)
            popup.show({ title: 'Thành công', content: `Đã tạo đơn hàng mới #${result.data.order_id} thành công!`, footer: `<button class="btn btn-primary" onclick="window.location.reload()">Đóng</button>` });
        } else {
            popup.show({ title: 'Lỗi tạo đơn hàng', content: result.message || 'Có lỗi xảy ra khi gọi API tạo đơn hàng.' });
        }

    } catch (error) {
        console.error('API Order Error:', error);
        popup.show({ title: 'Lỗi kết nối', content: 'Không thể kết nối đến máy chủ hoặc API.', footer: `<button class="btn btn-primary" data-dismiss="modal">Đóng</button>` });
    }
}

  // Hàm hiển thị modal tạo đơn hàng VỚI LOGIC TẠO NGƯỜI DÙNG VÀ LẤY GIÁ TỰ ĐỘNG
function showCreateOrderModal(popup, API_BASE) {
    const modalContent = `
        <div id="createOrderForm">
            <h4>Thông tin Khách hàng</h4>
            <div class="mb-3">
                <label class="form-label">Tên Người dùng (First Name)</label>
                <input type="text" class="form-control" id="orderUserFname" placeholder="Ví dụ: Nguyễn" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Họ Người dùng (Last Name)</label>
                <input type="text" class="form-control" id="orderUserLname" placeholder="Ví dụ: Văn A" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Email Người dùng</label>
                <input type="email" class="form-control" id="orderUserEmail" placeholder="Nhập Email để tạo tài khoản" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Địa chỉ giao hàng</label>
                <input type="text" class="form-control" id="orderShippingAddress" placeholder="Nhập địa chỉ" required>
            </div>
            <div class="mb-3">
                <label class="form-label">Phương thức thanh toán</label>
                <select class="form-select" id="orderPaymentMethod" required>
                    <option value="Thanh toán khi nhận hàng">Thanh toán khi nhận hàng</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                </select>
            </div>
            <div class="mb-3">
                <label class="form-label">Mã giảm giá (ID)</label>
                <input type="text" class="form-control" id="orderDiscountId" placeholder="Nhập ID mã giảm giá (Có thể bỏ trống)">
            </div>
            <hr/>
            <h4>Chi tiết sản phẩm</h4>
            <div id="orderItemsContainer">
                <div class="row g-2 mb-3 order-item" data-index="0">
                    <input type="hidden" class="item-product-id" value="" required> 
                    
                    <div class="col-10 position-relative">
                        <input type="text" class="form-control item-product-search" placeholder="Tìm kiếm tên hoặc ID sản phẩm..." required>
                        <div class="search-results-dropdown list-group position-absolute w-100 shadow-sm z-index-1" style="display: none; top: 100%;"></div>
                    </div>
                    
                    <div class="col-2">
                        <button type="button" class="btn btn-outline-danger btn-icon btn-remove-item" disabled><i class="ti ti-trash"></i></button>
                    </div>

                    <div class="col-12 mt-1 item-details">
                        <div class="row g-2">
                            <div class="col-8">
                                <input type="text" class="form-control item-product-name" placeholder="Tên sản phẩm" readonly>
                            </div>
                            <div class="col-2">
                                <input type="number" class="form-control item-quantity" placeholder="SL" min="1" value="1" required>
                            </div>
                            <div class="col-2">
                                <input type="text" class="form-control item-price" placeholder="Giá" readonly>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-outline-success btn-sm mb-3" id="btnAddItem"><i class="ti ti-plus me-1"></i> Thêm sản phẩm</button>

            <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-secondary me-2" data-dismiss="modal">Hủy</button>
                <button type="button" class="btn btn-primary" id="btnSubmitCreateOrder">Tạo Đơn Hàng</button>
            </div>
        </div>
    `;

    popup.show({
        title: 'Tạo Đơn Hàng Mới',
        content: modalContent,
        footer: ``,
        onOpen: () => {
            // ... (Logic thêm/xóa sản phẩm)
            let itemIndex = 0;
            const container = document.getElementById('orderItemsContainer');
            
            const createNewItemRow = (index) => {
                return `
                    <div class="row g-2 mb-3 order-item" data-index="${index}">
                        <input type="hidden" class="item-product-id" value="" required> 
                        <div class="col-10 position-relative">
                            <input type="text" class="form-control item-product-search" placeholder="Tìm kiếm tên hoặc ID sản phẩm..." required>
                            <div class="search-results-dropdown list-group position-absolute w-100 shadow-sm z-index-1" style="display: none; top: 100%;"></div>
                        </div>
                        <div class="col-2">
                            <button type="button" class="btn btn-outline-danger btn-icon btn-remove-item"><i class="ti ti-trash"></i></button>
                        </div>
                        <div class="col-12 mt-1 item-details">
                            <div class="row g-2">
                                <div class="col-8">
                                    <input type="text" class="form-control item-product-name" placeholder="Tên sản phẩm" readonly>
                                </div>
                                <div class="col-2">
                                    <input type="number" class="form-control item-quantity" placeholder="SL" min="1" value="1" required>
                                </div>
                                <div class="col-2">
                                    <input type="text" class="form-control item-price" placeholder="Giá" readonly>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            };

            document.getElementById('btnAddItem').addEventListener('click', () => {
                itemIndex++;
                container.insertAdjacentHTML('beforeend', createNewItemRow(itemIndex));
                attachRemoveListeners();
                setupProductSearch(API_BASE); // Gắn lại listener cho ô tìm kiếm mới
            });

            const attachRemoveListeners = () => {
                document.querySelectorAll('.btn-remove-item').forEach(btn => {
                    btn.onclick = (e) => {
                        if (document.querySelectorAll('.order-item').length > 1) {
                             e.target.closest('.order-item').remove();
                        }
                    };
                });
            };
            
            attachRemoveListeners();
            setupProductSearch(API_BASE); // Gắn listener cho ô tìm kiếm đầu tiên
            
            // Xử lý nút Submit
            document.getElementById('btnSubmitCreateOrder').addEventListener('click', () => {
                handleCreateOrderSubmit(popup, API_BASE);
            });
        }
    });
}

function setupProductSearch(API_BASE) {
    document.querySelectorAll('.item-product-search').forEach(input => {
        // Hủy bỏ các listener cũ để tránh gắn nhiều lần
        input.onkeyup = null; 
        
        let timeout = null;
        
        // Sử dụng onkeyup để lắng nghe sự kiện gõ phím
        input.onkeyup = (e) => {
            const query = e.target.value.trim();
            const resultsDropdown = e.target.parentElement.querySelector('.search-results-dropdown');
            const itemRow = e.target.closest('.order-item');
            
            clearTimeout(timeout);
            
            // Chỉ bắt đầu tìm kiếm khi có từ 2 ký tự trở lên
            if (query.length < 2) {
                resultsDropdown.style.display = 'none';
                return;
            }

            // Đặt timeout để giảm số lần gọi API
            timeout = setTimeout(async () => {
                try {
                    // Gọi API tìm kiếm sản phẩm
                    const result = await apiGet(`${API_BASE}/products/search`, { q: query });
                    
                    if (result && result.success && result.data.length > 0) {
                        // Hiển thị kết quả tìm kiếm
                        resultsDropdown.innerHTML = result.data.map(p => `
                            <button type="button" class="list-group-item list-group-item-action" 
                                data-id="${p.id}" 
                                data-name="${p.name}" 
                                data-price="${p.price}">
                                [ID: ${p.id}] ${p.name} (${Number(p.price).toLocaleString('vi-VN')} VNĐ)
                            </button>
                        `).join('');
                        resultsDropdown.style.display = 'block';
                        
                        // Gắn sự kiện khi chọn sản phẩm
                        resultsDropdown.querySelectorAll('button').forEach(button => {
                            button.onclick = () => {
                                // Điền thông tin sản phẩm vào form
                                itemRow.querySelector('.item-product-id').value = button.dataset.id;
                                itemRow.querySelector('.item-product-search').value = `[ID: ${button.dataset.id}] ${button.dataset.name}`;
                                itemRow.querySelector('.item-product-name').value = button.dataset.name;
                                itemRow.querySelector('.item-price').value = Number(button.dataset.price).toLocaleString('vi-VN');
                                resultsDropdown.style.display = 'none';
                            };
                        });
                    } else {
                        resultsDropdown.innerHTML = `<button type="button" class="list-group-item text-muted disabled">Không tìm thấy</button>`;
                        resultsDropdown.style.display = 'block';
                    }
                } catch (error) { // <--- LỖI CÚ PHÁP ĐÃ ĐƯỢC SỬA TẠI ĐÂY
                    console.error("Lỗi tìm kiếm sản phẩm (API hoặc Network):", error);
                    resultsDropdown.innerHTML = `<button type="button" class="list-group-item text-danger disabled">Lỗi kết nối API</button>`;
                    resultsDropdown.style.display = 'block';
                }
            }, 300);
        };
        
        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', (event) => {
             const resultsDropdown = input.parentElement.querySelector('.search-results-dropdown');
             if (!input.contains(event.target) && !resultsDropdown.contains(event.target)) {
                 resultsDropdown.style.display = 'none';
             }
        });
    });
}



  function renderOrderRows(orders, page = 1, totalPages = 1) {
    const tbody = document.querySelector(tableBodySel);
    
    // Đếm số cột (8 cột dữ liệu + 1 cột thao tác = 9)
    const COL_SPAN = 9; 

    if (!Array.isArray(orders) || orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${COL_SPAN}" class="text-center py-4 text-muted">Không có dữ liệu</td></tr>`;
        renderPagination(1, 1, 0); 
        return;
    }
    
    // Hàm định dạng tiền tệ
    const formatVND = (amount) => Number(amount || 0).toLocaleString('vi-VN') + ' VNĐ';
    
    /**
     * HÀM TÍNH TOÁN GIÁ TRỊ CUỐI CÙNG (Chỉ xử lý mã giảm giá đầu tiên)
     */
    function calculateFinalCost(originalCost, discountString) {
        if (!discountString || discountString === '-') {
            return originalCost;
        }

        let finalCost = originalCost;
        const discounts = discountString.split(', '); 
        const firstDiscount = discounts[0]; // Chỉ lấy mã giảm giá đầu tiên

        try {
            if (firstDiscount.endsWith('%')) {
                // Giảm giá theo phần trăm
                const percentage = parseFloat(firstDiscount.replace('%', ''));
                if (!isNaN(percentage)) {
                    finalCost = finalCost * (1 - percentage / 100);
                }
            } else if (firstDiscount.endsWith(' VNĐ')) {
                // Giảm giá theo giá trị tiền tệ
                // Loại bỏ dấu phân cách hàng nghìn (nếu có) trước khi parse
                const flatValue = parseFloat(firstDiscount.replace(' VNĐ', '').replace(/\./g, ''));
                if (!isNaN(flatValue)) {
                    finalCost = finalCost - flatValue;
                }
            }
        } catch (e) {
            console.error("Lỗi khi tính toán giảm giá:", e);
            return originalCost;
        }
        
        // Đảm bảo chi phí không âm
        return Math.max(0, finalCost);
    }
    // END HÀM TÍNH TOÁN

    tbody.innerHTML = orders.map(o => {
        const statusDropdownHtml = createStatusDropdown(o.status || 'pending'); 
        const discountValues = o.applied_discount_values || '-'; 
        
        // Tổng tiền gốc (o.total_cost)
        const originalCost = Number(o.total_cost || 0); 
        
        // Tính tổng tiền cuối cùng (sau giảm giá)
        const finalCost = calculateFinalCost(originalCost, discountValues); 

        return `
            <tr>
                <td>${o.customer_name || o.user_name || o.user || '-'}</td> 
                
                <td>${o.address || o.shipping_address || '-'}</td>
                
                <td>${statusDropdownHtml}</td> 
                
                <td>${o.payment_method || '-'}</td>
                
                <td>${o.date || '-'}</td>
                
                <td>${formatVND(originalCost)}</td> 
                
                <td>${discountValues}</td> 
                
                <td>${formatVND(finalCost)}</td> 
                
                <td class="text-end td-actions" colspan="2">
                    <button class="btn btn-outline-success btn-sm btn-save me-1" data-id="${o.id}">Lưu</button>
                    <button class="btn btn-outline-primary btn-sm btn-view-order me-1" data-id="${o.id}">Xem</button>
                </td>
            </tr>
            `;
    }).join('');
    renderPagination(page, totalPages, state.totalItems); 
}

  /**
   * --- HÀM RENDERPAGINATION (ĐÃ THAY THẾ HOÀN TOÀN) ---
   * Giờ đây sử dụng style UL/LI của Tabler
   */
  function renderPagination(page, totalPages, totalItems) {
    if (totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    paginationContainer.style.display = 'flex';

    // Cập nhật tóm tắt
    paginationSummary.textContent = `Hiển thị trang ${page} / ${totalPages} (Tổng cộng ${totalItems} mục)`;

    let html = '';

    // Nút "Previous"
    html += `<li class="page-item ${page === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page - 1}"><i class="ti ti-chevron-left"></i></a></li>`;

    // Logic hiển thị các nút số
    const maxPagesToShow = 5;
    let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    if (startPage > 1) {
      html += `<li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>`;
      if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    for (let i = startPage; i <= endPage; i++) {
      html += `<li class="page-item ${i === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
      html += `<li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
    }

    // Nút "Next"
    html += `<li class="page-item ${page === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${page + 1}"><i class="ti ti-chevron-right"></i></a></li>`;

    paginationControls.innerHTML = html;
  }

  // --- 6. TẢI DỮ LIỆU ---

  async function fetchAndRenderOrders(page, kw, status) {
    document.querySelector(tableBodySel).innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Đang tải dữ liệu...</td></tr>`;
    try {
      const params = { page: page };
      if (kw) params.search = kw;
      if (status && status !== 'all') {
        params.status = status;
      }
      
      // THAY THẾ bằng apiGet
      const response = await apiGet('orders', params);
      
      const orders = response.data || [];

      // Cập nhật state (Quan trọng: API phải trả về total và total_pages)
      state.page = response.pagination?.page || 1;
      state.totalPages = response.pagination?.total_pages || 1;
      state.totalItems = response.pagination?.total || 0;
      state.keyword = kw;
      state.status = status;

      renderOrderRows(orders, state.page, state.totalPages);
    } catch (err) {
      console.error("Lỗi khi tải đơn hàng:", err);
      renderOrderRows([], 1, 1);
    }
  }

  async function fetchAndRenderCarts(page, kw) {
    document.querySelector(tableBodySel).innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Đang tải dữ liệu...</td></tr>`;
    try {
      const params = { page: page };
      if (kw) params.search = kw;

      
      const cartsRes = await apiGet('carts', params); 
      
      const carts = cartsRes.data || cartsRes.carts || cartsRes.cart || [];

      // Cập nhật state (Quan trọng: API phải trả về total và total_pages)
      state.page = cartsRes.pagination?.page || 1; 
      state.totalPages = cartsRes.pagination?.total_pages || cartsRes.total_pages || 1;
      state.totalItems = cartsRes.pagination?.total || cartsRes.total || 0;
      state.keyword = kw;

      renderCartRows(carts, state.page, state.totalPages);
    } catch (err) {
      console.error("Lỗi khi tải giỏ hàng:", err);
      renderCartRows([], 1, 1);
    }
  }

  // --- 7. GẮN CÁC SỰ KIỆN ---

  const tabCart = document.getElementById('tab-cart');
  const tabOrders = document.getElementById('tab-orders');
  const searchEl = document.getElementById('ordersSearch');
  const refreshBtn = document.getElementById('btnRefresh');

  const statusFilter = document.createElement('select');
  statusFilter.id = 'orderStatusFilter';
  statusFilter.className = 'form-select me-2';
  statusFilter.style.width = '170px';
  statusFilter.innerHTML = `
    <option value="all">Tất cả trạng thái</option>
    ${Object.entries(STATUS_OPTIONS).map(([value, text]) =>
    `<option value="${value}">${text}</option>`
  ).join('')}
  `;
  refreshBtn.before(statusFilter);
  statusFilter.style.display = 'none';

  tabCart?.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.currentTab === 'cart') return;
    state.currentTab = 'cart';
    state.page = 1;
    state.keyword = '';
    tabCart.classList.add('active');
    tabOrders.classList.remove('active');
    statusFilter.style.display = 'none';
    setHeadForCart();
    loadCurrentTabData();
  });

  tabOrders?.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.currentTab === 'orders') return;
    state.currentTab = 'orders';
    state.page = 1;
    state.keyword = '';
    tabOrders.classList.add('active');
    tabCart.classList.remove('active');
    statusFilter.style.display = 'inline-block';
    setHeadForOrders();
    loadCurrentTabData();
  });

  refreshBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    state.page = 1;
    state.keyword = '';
    state.status = 'all';
    if (searchEl) searchEl.value = '';
    statusFilter.value = 'all';
    loadCurrentTabData();
  });

  searchEl?.addEventListener('input', (e) => {
    state.keyword = e.target.value.trim();
    state.page = 1;
    loadCurrentTabData();
  });

  statusFilter.addEventListener('change', (e) => {
    state.status = e.target.value;
    state.page = 1;
    loadCurrentTabData();
  });


  document.getElementById('btnCreateOrder')?.addEventListener('click', () => {
        showCreateOrderModal(popup, API_BASE);
    });



  document.addEventListener('click', async (e) => {
    // --- CẬP NHẬT SỰ KIỆN CLICK PHÂN TRANG ---
    const pageLink = e.target.closest('.page-link'); // Tìm thẻ <a>
    if (pageLink) {
      e.preventDefault();
      const pageItem = pageLink.closest('.page-item'); // Tìm <li>
      if (pageItem.classList.contains('disabled') || pageItem.classList.contains('active')) {
        return;
      }
      state.page = parseInt(pageLink.dataset.page);
      loadCurrentTabData();
      return;
    }

    // Nút Lưu
    if (e.target.classList.contains('btn-save')) {
      const saveButton = e.target;
      const id = saveButton.dataset.id;
      const row = saveButton.closest('tr');
      if (!row) return;
      const dropdown = row.querySelector('.order-status-select');
      if (!dropdown) return;
      const newStatus = dropdown.value;
      try {
        await apiPut(`orders/${id}/status`, { status: newStatus });
        alert('Cập nhật trạng thái thành công!');
        await loadCurrentTabData();
      } catch (err) {
        console.error("Lỗi khi lưu đơn hàng:", err);
        alert("Cập nhật trạng thái thất bại!");
      }
      return;
    }

    // Nút Xóa
    if (e.target.classList.contains('btn-delete')) {
      const id = e.target.dataset.id;
      if (!confirm('Bạn có chắc muốn xoá đơn hàng này?')) return;
      try {
        // THAY THẾ fetch TRỰC TIẾP bằng apiDelete
        await apiDelete(`orders/${id}`);
        loadCurrentTabData();
      } catch (err) {
        console.error("Lỗi khi xóa đơn hàng:", err);
        alert("Xóa đơn hàng thất bại!");
      }
      return;
    }

    if (e.target.classList.contains('btn-view-order')) {
      const id = e.target.getAttribute('data-id');
      try {
        // 1. Gọi API lấy chi tiết đơn hàng
        const response = await apiGet(`orders/${id}`);
        
        // 2. Lấy dữ liệu đơn hàng (Xử lý các cấu trúc response khác nhau)
        const orderData = response.data || response.order || response;
        const order = orderData.order || orderData;
        const items = orderData.items || [];
        
        if (!order || !order.id) {
          throw new Error('Không tìm thấy dữ liệu đơn hàng.');
        }

        let content = `
        <div><strong>ID đơn hàng:</strong> ${order.id}</div>
        <div><strong>Khách hàng:</strong> ${order.customer_name || order.user_name || order.user || '-'}</div>
        <div><strong>Địa chỉ giao hàng:</strong> ${order.address || order.shipping_address || '-'}</div>
        <div><strong>Phương thức thanh toán:</strong> ${order.payment_method || '-'}</div>
        <div><strong>Trạng thái:</strong> ${STATUS_OPTIONS[order.status] || order.status || '-'}</div>
        <div><strong>Ngày tạo:</strong> ${order.date || order.created_at || '-'}</div>
        <hr/>
        <div><strong>Chi tiết sản phẩm:</strong></div>
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr><th></th><th>Sản phẩm</th><th>Màu</th><th>Size</th><th>Số lượng</th><th>Giá</th></tr>
            </thead>
            <tbody>
              ${(items || []).map(i => `
                <tr>
                  <td><img src="${i.product_image}" alt="sp" style="width:48px;height:48px;object-fit:cover;border-radius:5px;"></td>
                  <td>${i.name || i.product_name || '-'}</td>
                  <td>${i.color || '-'}</td>
                  <td>${i.size || '-'}</td>
                  <td>${i.quantity || 1}</td>
                  <td>${Number(i.price || 0).toLocaleString('vi-VN')} VNĐ</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div><strong>Tổng tiền:</strong> ${Number(order.total_cost || order.total_value || order.total_price || 0).toLocaleString('vi-VN')} VNĐ</div>
        `;
        popup.show({ title: `Chi tiết đơn #${order.id}`, content });
      } catch (err) {
        console.error("Lỗi khi xem chi tiết đơn hàng:", err);
        popup.show({ title: 'Lỗi', content: 'Không thể tải chi tiết đơn hàng. Vui lòng kiểm tra console log hoặc API Backend.' });
      }
    }
    if (e.target.classList.contains('btn-view-cart')) {
      const id = e.target.getAttribute('data-id');
      try {
        const cartRes = await apiGet(`carts/${id}`);
        const cart = cartRes.cart || cartRes;
        const items = cartRes.items || [];
        const total = cartRes.total || 0;
        let content = `
        <div><strong>ID giỏ hàng:</strong> ${cart.id}</div>
        <div><strong>ID người dùng:</strong> ${cart.user_id || '-'}</div>
        <div><strong>Ngày tạo:</strong> ${cart.created_at || '-'}</div>
        <div><strong>Cập nhật gần nhất:</strong> ${cart.updated_at || '-'}</div>
        <hr/>
        <div><strong>Chi tiết sản phẩm:</strong></div>
        <div class="table-responsive">
          <table class="table table-striped">
              <thead>
              <tr><th></th><th>Sản phẩm</th><th>Màu</th><th>Size</th><th>Số lượng</th><th>Giá</th><th>Tạm tính</th></tr>
            </thead>
            <tbody>
              ${(items || []).map(i => `
                <tr>
                  <td><img src="${i.product_image}" alt="sp" style="width:48px;height:48px;object-fit:cover;border-radius:5px;"></td>
                  <td>${i.name || i.product_name || '-'}</td>
                  <td>${i.color || '-'}</td>
                  <td>${i.size || '-'}</td>
                  <td>${i.quantity || 1}</td>
                  <td>${Number(i.price || 0).toLocaleString('vi-VN')} VNĐ</td>
                  <td>${Number(i.subtotal || i.price * (i.quantity || 1) || 0).toLocaleString('vi-VN')} VNĐ</td>
                </tr>
              `).join('')}
            </tbody>
            </table>
        </div>
        <div><strong>Tổng sản phẩm:</strong> ${items.length}</div>
        <div><strong>Tổng tiền:</strong> ${Number(total).toLocaleString('vi-VN')} VNĐ</div>
        `;
        popup.show({ title: `Chi tiết giỏ hàng #${cart.id}`, content });
      } catch (err) {
        popup.show({ title: 'Lỗi', content: 'Không thể tải chi tiết giỏ hàng.' });
      }
    }
  });


  // --- 7. TẢI DỮ LIỆU LẦN ĐẦU ---
  await loadCurrentTabData();
});