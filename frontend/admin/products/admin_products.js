    import apiClient from '../../js/api-client.js';
    import { showSuccess, showError, confirm } from '../../js/utils.js';

    let currentPage = 1;
    let currentLimit = 10;
    const currentFilters = { search: "", status: "", sortBy: "" };

    document.addEventListener('DOMContentLoaded', () => {
        initializeEventListeners();
        loadProducts();
    });

    function initializeEventListeners() {
        document.getElementById('searchInput')?.addEventListener('keypress', e => {
            if (e.key === 'Enter') handleSearch();
        });

        document.querySelector('input.form-control-sm')?.addEventListener('change', e => {
            currentLimit = parseInt(e.target.value) || 10;
            loadProducts();
        });

        document.getElementById('btnAddProduct')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleAddProduct();
        });

        document.getElementById("productFilterForm").addEventListener("submit", e => {
            e.preventDefault();
            currentFilters.search = document.getElementById("searchInput").value.trim();
            currentFilters.status = document.getElementById("filterStatus").value;
            currentFilters.sortBy = document.getElementById("filterSort").value;
            loadProducts();
        });
    }

    function handleSearch() {
        currentFilters.search = document.getElementById('searchInput').value.trim();
        loadProducts();
    }

    async function loadProducts() {
        try {
            const params = {
                page: currentPage,
                limit: currentLimit,
                search: currentFilters.search,
                status: currentFilters.status,
                sortBy: currentFilters.sortBy
            };

            const response = await apiClient.get('products', params);

            if (response.success) {
                renderProductTable(response.data);
                renderPagination(response.pagination);
            } else {
                showError(response.message || 'Không thể tải danh sách sản phẩm');
            }
        } catch (err) {
            console.error(err);
            showError('Lỗi khi tải danh sách sản phẩm');
        }
    }

    function renderProductTable(products) {
        const tbody = document.getElementById('product-table-body');
        if (!products || products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-5">Không có sản phẩm nào</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>#${p.id}</td>
                <td>${p.name}</td>
                <td>${p.trademark}</td>
                <td>${p.cost_current}</td>
                <td>${p.cost_old || ''}</td>
                <td>${p.status}</td>
                <td>${p.overall_rating_star} (${p.rating_count})</td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-ghost-primary" onclick="editProduct(${p.id})" title="Chỉnh sửa">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="btn btn-ghost-danger" onclick="deleteProduct(${p.id})" title="Xóa">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    window.changePage = function(page) {
        currentPage = page;
        loadProducts();
    };

    async function handleAddProduct() {
        const product = {
            name: document.getElementById("add-product-name").value.trim(),
            trademark: document.getElementById("add-product-trademark").value.trim(),
            cost_current: document.getElementById("add-product-cost-current").value,
            description: document.getElementById("add-product-description").value.trim(),
            status: document.getElementById("add-product-status").value
        };

        try {
            const response = await apiClient.post('products', product);

            if (response.success) {
                showSuccess(response.message || 'Đã thêm sản phẩm');
                loadProducts();
                document
                    .getElementById('modal-add-product')
                    .querySelector('.btn-close')
                    .click();
            } else {
                showError(response.message || 'Không thể thêm sản phẩm');
            }

        } catch (err) {
            console.error(err);

            const errors = err.data?.errors;

            if (errors) {
                showError(
                    Object.values(errors).join("<br>")
                );
            } else {
                showError(err.message);
            }
        }
    }

    /**
     * Pagination
     */
    function renderPagination(pagination) {
    const { current_page, total_pages } = pagination;

    const paginationEl = document.getElementById('pagination');

    const total_records = document.getElementById('total-records');
    const count_show = document.getElementById('count-show');

    total_records.innerHTML = pagination.total_items;
    count_show.innerHTML = pagination.per_page;

    const from = pagination.from;
    const to = pagination.to;

    const fromInt = parseInt(from);
    const toInt = parseInt(to);
    const count_show_int = toInt - fromInt + 1;
    count_show.innerHTML = count_show_int.toString();

    if (total_pages <= 1) {
        paginationEl.innerHTML = '';
        return;
    }

    let html = '';
    // Previous
    html += `<li class="page-item ${current_page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${current_page - 1}); return false;">
                    <i class="ti ti-chevron-left"></i>
                </a>
            </li>`;

    const maxVisible = 5;
    let start = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let end = Math.min(total_pages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
        html += `<li class="page-item ${i === current_page ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
                </li>`;
    }

    // Next
    html += `<li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${current_page + 1}); return false;">
                    <i class="ti ti-chevron-right"></i>
                </a>
            </li>`;

    paginationEl.innerHTML = html;
    }

    window.editProduct = function(id) {
        window.location.href = `./edit.html?id=${id}`;
    };

    window.deleteProduct = async function(id) {
        const confirmed = await confirm('Bạn có chắc muốn xóa sản phẩm này?');
        if (!confirmed) return;
        try {
            const response = await apiClient.delete(`products/${id}`);
            if (response.success) {
                showSuccess(response.message || 'Đã xóa sản phẩm');
                loadProducts();
            } else {
                showError(response.message || 'Không thể xóa sản phẩm');
            }
        } catch (err) {
            console.error(err);
        
            const errors = err.data?.errors;
        
            if (errors) {
                showError(
                    Object.values(errors).join("<br>")
                );
            } else {
                showError(err.message);
            }
        }
    };
