import { showToast } from '../utils/toast.js';

(function(){
  const API_BASE = window.__ENV__?.API_BASE || 'http://localhost:8000';

  function qs(sel){return document.querySelector(sel)}

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  const titleEl = qs('#postTitle');
  const contentEl = qs('#postContent');
  const btnEdit = qs('#btnEdit');
  const btnDelete = qs('#btnDelete');

  if(!id){
    titleEl.textContent = 'Không tìm thấy id bài viết';
    btnEdit.style.display = 'none';
    btnDelete.style.display = 'none';
  } else {
    // Load post
    fetch(`${API_BASE}/posts/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Lỗi tải bài viết'))
      .then(data => {
        const post = (data && data.data) ? data.data : data;
        displayPost(post);
        btnEdit.href = `edit.html?id=${post.id}`;
      })
      .catch(err => {
        titleEl.textContent = 'Lỗi khi tải bài viết';
        contentEl.textContent = err.message || err;
      });

    // Load comments
    fetch(`${API_BASE}/comments?type=post&id=${id}`)
      .then(r => r.ok ? r.json() : Promise.reject('Lỗi tải comments'))
      .then(data => {
        const comments = (data && data.data) ? data.data : (Array.isArray(data) ? data : []);
        displayComments(comments);
      })
      .catch(err => {
        qs('#commentsContainer').innerHTML = '<p class="text-muted">Không thể tải bình luận</p>';
      });

    btnDelete.addEventListener('click', function(){
      fetch(`${API_BASE}/posts/${id}`, { method: 'DELETE' })
        .then(r => r.json())
        .then(resp => {
          showToast({ message: 'Xoá thành công', type: 'success' });
          setTimeout(() => window.location.href = 'index.html', 1000);
        })
        .catch(err => showToast({ message: 'Lỗi khi xoá', type: 'error' }));
    });
  }

  function displayPost(post) {
    // Title
    qs('#postTitle').textContent = post.title || '—';

    // Status badge
    const status = post.status || 'draft';
    const statusConfig = {
      'published': { label: 'Xuất bản', class: 'bg-success' },
      'draft': { label: 'Bản nháp', class: 'bg-secondary' },
      'scheduled': { label: 'Lên lịch', class: 'bg-info' },
      'archived': { label: 'Lưu trữ', class: 'bg-warning' }
    };
    const statusInfo = statusConfig[status] || statusConfig['draft'];
    qs('#statusBadge').innerHTML = `<span class="badge ${statusInfo.class} text-white">${statusInfo.label}</span>`;

    // Author
    qs('#authorName').textContent = post.author_name || `User #${post.author_id || '-'}`;

    // Dates
    const createdDate = post.created_at ? new Date(post.created_at).toLocaleString('vi-VN') : '-';
    const publishedDate = post.published_at ? new Date(post.published_at).toLocaleString('vi-VN') : 'Chưa xuất bản';
    qs('#createdDate').textContent = `Tạo: ${createdDate}`;
    qs('#publishedDate').textContent = `Xuất bản: ${publishedDate}`;

    // Image
    if(post.image) {
      const imgContainer = qs('#postImageContainer');
      const img = qs('#postImage');
      img.src = post.image.startsWith('http') ? post.image : `../../${post.image}`;
      imgContainer.style.display = 'block';
    }

    // Excerpt
    if(post.excerpt) {
      const excerptEl = qs('#postExcerpt');
      excerptEl.innerHTML = `<strong>Tóm tắt:</strong> ${post.excerpt}`;
      excerptEl.style.display = 'block';
    }

    // Content
    qs('#postContent').innerHTML = post.content || '<p class="text-muted">Không có nội dung</p>';
  }

  function displayComments(comments) {
    const container = qs('#commentsContainer');
    const countEl = qs('#commentCount');
    
    countEl.textContent = comments.length;
    
    if(comments.length === 0) {
      container.innerHTML = '<p class="text-muted">Chưa có bình luận nào</p>';
      return;
    }

    container.innerHTML = comments.map(c => `
      <div class="card mb-2 comment-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <strong><i class="ti ti-user me-1"></i>${c.user_name || 'User #' + c.user_id}</strong>
              ${c.rating ? `<div class="mt-1"><span class="text-warning">${'★'.repeat(c.rating)}${'☆'.repeat(5-c.rating)}</span></div>` : ''}
            </div>
            <span class="text-muted small">
              <i class="ti ti-clock me-1"></i>${new Date(c.created_at).toLocaleString('vi-VN')}
            </span>
          </div>
          <div class="mt-2">${c.content || ''}</div>
        </div>
      </div>
    `).join('');
  }
})();