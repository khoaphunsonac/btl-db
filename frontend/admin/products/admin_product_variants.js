import apiClient from '../../js/api-client.js';
import { showSuccess, showError, confirm } from '../../js/utils.js';

let currentPage = 1;
let currentLimit = 10;

const currentFilters = {
    productId: "",
    color: "",
    status: "",
    sortBy: ""
};

document.addEventListener("DOMContentLoaded", () => {
    initEvents();
    loadVariants();
});

function initEvents() {
    // Filter form
    document.getElementById("variantFilterForm").addEventListener("submit", e => {
        e.preventDefault();
        currentFilters.productId = document.getElementById("filterProductId").value.trim();
        currentFilters.color = document.getElementById("filterColor").value.trim();
        currentFilters.status = document.getElementById("filterStatus").value;
        currentFilters.sortBy = document.getElementById("filterSort").value;
        currentPage = 1;
        loadVariants();
    });

    // Limit per page change
    document.querySelector('input.form-control-sm')?.addEventListener('change', e => {
        currentLimit = parseInt(e.target.value) || 10;
        currentPage = 1;
        loadVariants();
    });

    // Add variant
    document.getElementById("btnAddVariant").addEventListener("click", handleAddVariant);
}

async function loadVariants() {
    try {
        const params = {
            page: currentPage,
            limit: currentLimit,
            product_id: currentFilters.productId,
            color: currentFilters.color,
            status: currentFilters.status,
            sortBy: currentFilters.sortBy
        };

        const res = await apiClient.get("product-variants", params);

        if (!res.success) return showError(res.message || "Lỗi khi tải biến thể");

        renderVariantTable(res.data);
        renderPagination(res.pagination);

    } catch (err) {
        console.error(err);
        showError("Lỗi khi tải biến thể");
    }
}

function renderVariantTable(list) {
    const tbody = document.getElementById('variant-table-body');

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-5">
            Không có dữ liệu
        </td></tr>`;
        document.getElementById("count-show").textContent = 0;
        return;
    }

    tbody.innerHTML = list.map(v => `
        <tr>
            <td>${v.id}</td>
            <td>${v.product_id}</td>
            <td>${v.color}</td>
            <td>${v.quantity}</td>
            <td>${v.status}</td>
            <td class="text-end">
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-ghost-primary" onclick="editVariant(${v.id})" title="Chỉnh sửa">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="btn btn-ghost-danger" onclick="deleteVariant(${v.id})" title="Xóa">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join("");

    document.getElementById("count-show").textContent = list.length;
}

function renderPagination(pagination) {
    const ul = document.getElementById("pagination");
    const { current_page, total_pages, total_items, from, to } = pagination;

    document.getElementById("total-records").textContent = total_items;
    document.getElementById("count-show").textContent = to - from + 1;

    if (total_pages <= 1) {
        ul.innerHTML = '';
        return;
    }

    let html = '';

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

    html += `<li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${current_page + 1}); return false;">
                    <i class="ti ti-chevron-right"></i>
                </a>
            </li>`;

    ul.innerHTML = html;
}

window.changePage = (p) => {
    currentPage = p;
    loadVariants();
};

async function handleAddVariant() {
    const product_id = document.getElementById("add-variant-product-id").value.trim();
    const color = document.getElementById("add-variant-color").value.trim();
    const quantity = document.getElementById("add-variant-quantity").value.trim();

    try {
        const res = await apiClient.post("product-variants", { product_id, color, quantity });

        if (res.success) {
            showSuccess(res.message || "Thêm biến thể thành công");
            document.querySelector("#modal-add-variant .btn-close").click();
            loadVariants();
        } else if(res.errors) {
            showError(Object.values(res.errors).join('<br>'));
        } else {
            showError(res.message || "Lỗi khi thêm biến thể");
        }

    } catch (err) {
        console.error(err);
        showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
    }
}

window.editVariant = function(id) {
    window.location.href = `./edit_variant.html?id=${id}`;
};

window.deleteVariant = async (id) => {
    const ok = await confirm("Bạn có chắc muốn xóa biến thể này?");
    if (!ok) return;

    try {
        const res = await apiClient.delete(`product-variants/${id}`);
        if (res.success) {
            showSuccess(res.message || "Đã xóa biến thể");
            loadVariants();
        } else {
            showError(res.message || "Không thể xóa biến thể");
        }
    } catch (err) {
        console.error(err);
        showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
    }
};

export { loadVariants };