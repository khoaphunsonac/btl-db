export class TableList {
    constructor({
        containerSelector,
        data = [],
        columns = [],
        itemsPerPage = 5,
        searchSelector = null,
    }) {
        this.container = document.querySelector(containerSelector);
        this.data = data;
        this.filteredData = [...data];
        this.columns = columns;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.searchInput = searchSelector
            ? document.querySelector(searchSelector)
            : null;

        this.paginationContainer = document.createElement("div");
        this.paginationContainer.classList.add("pagination");

        this.render();
        this.bindSearch();
    }

    get totalPages() {
        return Math.ceil(this.filteredData.length / this.itemsPerPage);
    }

    get paginatedData() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        return this.filteredData.slice(start, start + this.itemsPerPage);
    }

    render() {
        if (!this.container) return;

        if (this.filteredData.length === 0) {
            this.container.innerHTML =
                `<tr><td colspan="${this.columns.length}" style="text-align:center; padding:20px;">Không có dữ liệu</td></tr>`;
            this.paginationContainer.innerHTML = "";
            return;
        }

        this.container.innerHTML = this.paginatedData
            .map((item) => {
                return `
          <tr>
            ${this.columns.map((col) => {
                    if (col.render) return `<td>${col.render(item[col.key], item)}</td>`;
                    return `<td>${item[col.key] ?? ""}</td>`;
                }).join('')}
          </tr>
        `;
            })
            .join("");

        this.renderPagination();
        this.bindRowEvents();
    }

    renderPagination() {
        if (this.totalPages <= 1) {
            this.paginationContainer.innerHTML = "";
            return;
        }

        const pageButtons = Array.from({ length: this.totalPages }, (_, i) => {
            const page = i + 1;
            const active = page === this.currentPage ? "active" : "";
            return `<button class="btn-page ${active}" data-page="${page}">${page}</button>`;
        }).join("");

        this.paginationContainer.innerHTML = `
      <button class="btn-prev" ${this.currentPage === 1 ? "disabled" : ""}>←</button>
      ${pageButtons}
      <button class="btn-next" ${this.currentPage === this.totalPages ? "disabled" : ""}>→</button>
    `;

        const wrapper = this.container.closest(".table-wrapper");
        if (wrapper && !wrapper.contains(this.paginationContainer)) {
            wrapper.appendChild(this.paginationContainer);
        }

        this.bindPaginationEvents();
    }

    bindPaginationEvents() {
        this.paginationContainer.querySelectorAll(".btn-page").forEach((btn) => {
            btn.onclick = () => {
                this.currentPage = Number(btn.dataset.page);
                this.render();
            };
        });

        this.paginationContainer.querySelector(".btn-prev")?.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.render();
            }
        });

        this.paginationContainer.querySelector(".btn-next")?.addEventListener("click", () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.render();
            }
        });
    }

    bindRowEvents() {
        this.container.querySelectorAll("[data-action]").forEach((btn) => {
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action && this[`on${action[0].toUpperCase() + action.slice(1)}`]) {
                btn.onclick = () =>
                    this[`on${action[0].toUpperCase() + action.slice(1)}`](id);
            }
        });
    }

    bindSearch() {
        if (!this.searchInput) return;
        this.searchInput.addEventListener("input", (e) => {
            const keyword = e.target.value.trim().toLowerCase();
            this.filteredData = this.data.filter((item) =>
                Object.values(item).some((val) =>
                    String(val).toLowerCase().includes(keyword)
                )
            );
            this.currentPage = 1;
            this.render();
        });
    }

    remove(id) {
        this.data = this.data.filter((d) => d.id != id);
        this.filteredData = this.filteredData.filter((d) => d.id != id);
        if (this.currentPage > this.totalPages) this.currentPage = this.totalPages || 1;
        this.render();
    }

    updateData(newData) {
        this.data = newData;
        this.filteredData = [...newData];
        this.currentPage = 1; 
        this.render();
    }
}
