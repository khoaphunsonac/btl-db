export class Popup {
  constructor() {
    this.createPopup();
  }

  createPopup() {
    if (document.querySelector('.popup-overlay')) return;

    // CẬP NHẬT HTML: Thêm div.popup-actions
    const popupHTML = `
      <div class="popup-overlay hidden">
        <div class="popup">
          <div class="popup-header">
            <h3 class="popup-title">Thông tin</h3>
            <button class="btn-close">&times;</button>
          </div>
          <div class="popup-content"></div>
          
          <div class="popup-actions"></div> 
          
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', popupHTML);

    this.overlay = document.querySelector('.popup-overlay');
    this.titleEl = this.overlay.querySelector('.popup-title');
    this.contentEl = this.overlay.querySelector('.popup-content');
    this.closeBtn = this.overlay.querySelector('.btn-close');

    // THÊM MỚI: Chọn vùng actions
    this.actionsEl = this.overlay.querySelector('.popup-actions');

    this.closeBtn.addEventListener('click', () => this.hide());
    this.overlay.addEventListener('click', e => {
      if (e.target === this.overlay) this.hide();
    });
  }

  /**
   * CẬP NHẬT HÀM SHOW
   * @param {object} options
   * @param {string} options.title - Tiêu đề của popup
   * @param {string} options.content - Nội dung HTML của popup
   * @param {Array<object>} options.actions - Mảng các đối tượng nút bấm
   * - { label: 'Tên nút', type: 'css-class', close: boolean, onClick: function }
   */
  show({ title = 'Thông tin', content = '', actions = [] }) {
    this.titleEl.textContent = title;
    this.contentEl.innerHTML = content;

    // --- LOGIC MỚI ĐỂ RENDER NÚT BẤM ---

    // 1. Xóa các nút cũ (nếu có)
    this.actionsEl.innerHTML = '';

    // 2. Ẩn/hiện vùng actions dựa trên số lượng nút
    if (actions.length === 0) {
      this.actionsEl.style.display = 'none';
    } else {
      this.actionsEl.style.display = 'flex';

      // 3. Tạo và gắn từng nút
      actions.forEach(action => {
        const button = document.createElement('button');

        // Gán nhãn và class CSS
        button.textContent = action.label;
        button.className = 'btn'; // Class 'btn' cơ sở
        if (action.type) {
          // Thêm các class phụ (ví dụ: 'btn-danger', 'btn-primary')
          action.type.split(' ').forEach(cls => button.classList.add(cls));
        }

        // Gắn sự kiện click
        button.addEventListener('click', () => {
          // Gọi hàm onClick của nút (nếu có)
          if (action.onClick) {
            action.onClick();
          }

          // Tự động đóng popup trừ khi 'close' được đặt là false
          if (action.close !== false) {
            this.hide();
          }
        });

        // Thêm nút vào vùng actions
        this.actionsEl.appendChild(button);
      });
    }

    // 4. Hiển thị popup
    this.overlay.classList.remove('hidden');
  }

  hide() {
    this.overlay.classList.add('hidden');
  }
}