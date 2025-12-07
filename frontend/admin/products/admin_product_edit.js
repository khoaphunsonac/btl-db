import apiClient from '../../js/api-client.js';
import { showSuccess, showError, confirm } from '../../js/utils.js';

let productId = null;
let isEditMode = false;

// ===========================================
// INIT
// ===========================================
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  productId = params.get("id");
  isEditMode = !!productId;

  if (isEditMode) {
    document.getElementById("pageTitle").textContent = "Chỉnh sửa sản phẩm";
    document.getElementById("btnDelete").style.display = "block";
    loadProduct(productId);
  }

  document.getElementById("btnAddAttr").addEventListener("click", () => addAttributeRow());
  document.getElementById("btnAddVariant").addEventListener("click", () => addVariantRow());

  document.getElementById("productForm").addEventListener("submit", handleSubmit);
  document.getElementById("btnDelete").addEventListener("click", handleDelete);
});

// ===========================================
// ATTRIBUTE ROW
// ===========================================
function addAttributeRow(attr = {}) {
  const row = document.createElement("div");
  row.className = "attr-row";
  row.innerHTML = `
    <input type="text" class="form-control attr-name" placeholder="Tên thuộc tính" value="${attr.name || ""}" required>
    <input type="text" class="form-control attr-value" placeholder="Giá trị" value="${attr.value || ""}" required>
    <button type="button" class="btn btn-outline-primary btn-sm btnAddRowAttribute">Thêm</button>
    <button type="button" class="btn btn-outline-danger btn-sm btnDeleteAttribute">Xóa</button>
  `;

  // Xóa Attribute
  row.querySelector(".btnDeleteAttribute").onclick = async () => {
    const oke = await handleDeleteAttribute(attr.id);
    if (oke) row.remove();
  };

  // Thêm Attribute
  row.querySelector(".btnAddRowAttribute").onclick = () => {
    const name = row.querySelector(".attr-name").value.trim();
    const value = row.querySelector(".attr-value").value.trim();

    handleAddAttribute(productId, name, value, attr.id);
  };


  document.getElementById("attributesContainer").appendChild(row);
}

// ===========================================
// VARIANT ROW 
// ===========================================
function addVariantRow(v = {}) {
  const row = document.createElement("div");
  row.className = "variant-row";
  row.innerHTML = `
    <input type="text" class="form-control var-color" placeholder="Màu sắc" value="${v.color || ""}" required>
    <input type="number" class="form-control var-qty" placeholder="Số lượng" value="${v.quantity || 0}" min="0" required>
    <button type="button" class="btn btn-outline-primary btn-sm btnAddRowVariant">Thêm</button>
    <button type="button" class="btn btn-outline-danger btn-sm btnDeleteVariant">Xóa</button>
  `;

  // Xóa variant
  row.querySelector(".btnDeleteVariant").onclick = async () => {
    const ok = await handleDeleteVariant(v.id);
    if (ok) row.remove();
  };  

  // Thêm variant
  row.querySelector(".btnAddRowVariant").onclick = () => {
    const color = row.querySelector(".var-color").value.trim();
    const quantity = parseInt(row.querySelector(".var-qty").value);

    handleAddVariant(productId, color, quantity, v.id);
  };

  document.getElementById("variantsContainer").appendChild(row);
}

// ===========================================
// LOAD PRODUCT
// ===========================================
async function loadProduct(id) {
  try {
    const res = await apiClient.get(`products/${id}`);

    if (!res.success) return showError("Không thể tải sản phẩm");

    const p = res.data;

    document.getElementById("name").value = p.name;
    document.getElementById("trademark").value = p.trademark;
    document.getElementById("cost_current").value = p.cost_current;
    document.getElementById("cost_old").innerHTML = `
      <input type="number" class="form-control" value="${p.cost_old}" disabled>
    `;
    document.getElementById("description").value = p.description;
    document.getElementById("status").innerHTML = `
      <input type="text" class="form-control" value="${p.status}" disabled>
    `;

    // Load attributes
    p.attributes.forEach(a => addAttributeRow(a));

    // Load variants
    p.variants.forEach(v => {
      addVariantRow(v);
    });

  } catch (err) {
    console.error(err);
    showError("Lỗi khi tải dữ liệu");
  }
}

// ===========================================
// SUBMIT
// ===========================================
async function handleSubmit(e) {
  e.preventDefault();

  const productData = {
    id: productId,
    name: document.getElementById("name").value.trim(),
    trademark: document.getElementById("trademark").value.trim(),
    cost_current: document.getElementById("cost_current").value,
    description: document.getElementById("description").value.trim(),
    status: document.getElementById("status").value
  };

  try {
      const response = await apiClient.put(`products/${productData.id}`, productData);

      if (response.success) {
          showSuccess(response.message || 'Đã chỉnh sản phẩm');
      } else {
          showError(response.message || 'Không thể chỉnh sản phẩm');
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

async function loadVariants() {
  try {
    const res = await apiClient.get(`products/${productId}`);
    if (!res.success) return showError("Không thể tải biến thể");

    const container = document.getElementById("variantsContainer");
    container.innerHTML = ""; // xóa cũ
    res.data.variants.forEach(v => addVariantRow(v));
  } catch (err) {
    console.error(err);
    showError("Lỗi khi tải biến thể");
  }
}

// ===========================================
// DELETE
// ===========================================
async function handleDelete() {
  if (!(await confirm("Xóa sản phẩm này?"))) return;

  try {
    const res = await apiClient.delete(`products/${productId}`);
    if (!res.success) return showError(res.message);

    showSuccess("Đã xóa!");
    window.location.href = "./admin_products.html";

  } catch (err) {
    console.error(err);
    showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
  }
}

async function handleDeleteVariant(id) {
  const ok = await confirm("Bạn có chắc muốn xóa biến thể này?");
  if (!ok) return;

  try {
      const res = await apiClient.delete(`product-variants/${id}`);
      if (res.success) {
          showSuccess(res.message || "Đã xóa biến thể");
          return true;
      } else {
          showError(res.message || "Không thể xóa biến thể");
          return false;
      }
  } catch (err) {
      console.error(err);
      showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
      return false;
  }
};

async function handleAddVariant(productId, color, quantity, id = null) {
  if (!color) return showError("Màu sắc không được để trống");
  if (quantity < 0) return showError("Số lượng không hợp lệ");

  // UPDATE
  if (id) {
    try {
      const res = await apiClient.put(`product-variants/${id}`, { color, quantity });
      if (!res.success) return showError(res.message || "Không thể cập nhật");

      showSuccess("Cập nhật biến thể thành công");
      return loadVariants();

    } catch (err) {
        console.error(err);
        showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
        return;
    }
  }

  // CREATE
  try {
    const res = await apiClient.post(`product-variants`, {
      product_id: productId,
      color,
      quantity
    });

    if (!res.success) {
      if (res.errors) return showError(Object.values(res.errors).join("<br>"));
      return showError(res.message || "Không thể thêm biến thể");
    }

    showSuccess("Thêm biến thể thành công");
    loadVariants();

  } catch (err) {
    console.error(err);
    showError("Lỗi khi thêm biến thể");
  }
}

// Attribute
async function handleDeleteAttribute(id) {
  const ok = await confirm("Bạn có chắc muốn xóa thuộc tính này?");
  if (!ok) return;

  try {
      const res = await apiClient.delete(`product-attributes/${id}`);
      if (res.success) {
          showSuccess(res.message || "Đã xóa thuộc tính");
          return true;
      } else {
          showError(res.message || "Không thể xóa thuộc tính");
          return false;
      }
  } catch (err) {
      console.error(err);
      showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
      return false;
  }
}

async function handleAddAttribute(productId, name, value, id = null) {
  // if (!name) return showError("Màu sắc không được để trống");
  // if (value < 0) return showError("Số lượng không hợp lệ");

  // UPDATE
  if (id) {
    try {
      const res = await apiClient.put(`product-attributes/${id}`, { name, value, product_id : productId });
      if (!res.success) return showError(res.message || "Không thể cập nhật");

      showSuccess("Cập nhật biến thể thành công");
      return loadVariants();

    } catch (err) {
        console.error(err);
        showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
        return;
    }
  }

  // CREATE
  try {
    const res = await apiClient.post(`product-attributes`, {
      product_id: productId,
      name,
      value
    });

    if (!res.success) {
      if (res.errors) return showError(Object.values(res.errors).join("<br>"));
      return showError(res.message || "Không thể thêm biến thể");
    }

    showSuccess("Thêm biến thể thành công");
    loadVariants();

  } catch (err) {
    console.error(err);
    showError(err.data?.errors ? Object.values(err.data.errors).join('<br>') : err.message);
    return;
  }
}