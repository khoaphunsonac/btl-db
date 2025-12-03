import { showToast } from '../utils/toast.js';

const API_BASE = 'http://localhost/btl-db/backend';

let editor = null;
let users = [];
let uploadedImagePath = null; // Store uploaded image path

function qs(sel){ return document.querySelector(sel); }

function getIdFromQuery(){ 
  const p = new URLSearchParams(window.location.search); 
  return p.get('id'); 
}

// Generate slug from title
function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Initialize Quill Editor
function initEditor(){
  try {
    const toolbarOptions = [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ];

    editor = new Quill('#editor-container', {
      theme: 'snow',
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            image: imageHandler
          }
        }
      },
      placeholder: 'Nhập nội dung bài viết...'
    });
    
    return editor;
  } catch(e) {
    console.warn('Quill init failed', e);
  }
}

// Custom image handler for Quill editor
function imageHandler() {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();

  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast({ message: 'Vui lòng chọn file ảnh!', type: 'error' });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast({ message: 'Kích thước ảnh không được vượt quá 5MB!', type: 'error' });
      return;
    }

    try {
      showToast({ message: 'Đang upload ảnh...', type: 'info' });
      
      // Upload image
      const imagePath = await uploadImage(file);
      
      // Get current cursor position
      const range = editor.getSelection(true);
      
      // Insert image at cursor position
      // Convert relative path to full URL for display
      const imageUrl = imagePath.startsWith('http') ? imagePath : `../../${imagePath}`;
      editor.insertEmbed(range.index, 'image', imageUrl);
      
      // Move cursor to next position
      editor.setSelection(range.index + 1);
      
      showToast({ message: 'Thêm ảnh thành công!', type: 'success' });
    } catch (error) {
      console.error('Image upload error:', error);
      showToast({ message: 'Lỗi upload ảnh: ' + error.message, type: 'error' });
    }
  };
}

function getEditorContent(){
  if(editor) {
    return editor.root.innerHTML;
  }
  return qs('#content').value;
}

function setEditorContent(html){
  if(editor) {
    editor.root.innerHTML = html || '';
  } else {
    qs('#content').value = html;
  }
}

// Upload image to server
async function uploadImage(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'news'); // Upload to assets/uploads/news
    formData.append('target', 'assets');
    
    const uploadUrl = `${API_BASE}/upload`;
    console.log('[Upload] URL:', uploadUrl);
    console.log('[Upload] File:', file.name, file.type, file.size);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    console.log('[Upload] Response status:', response.status);
    console.log('[Upload] Response headers:', response.headers);
    
    // Get response text first to see what we're getting
    const responseText = await response.text();
    console.log('[Upload] Response text:', responseText.substring(0, 500));
    
    if (!response.ok) {
      throw new Error('Upload failed: ' + response.status + ' - ' + responseText.substring(0, 200));
    }
    
    // Try to parse as JSON
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('[Upload] JSON parse error:', e);
      console.error('[Upload] Response was:', responseText);
      throw new Error('Server returned invalid JSON. Response: ' + responseText.substring(0, 200));
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    console.log('[Upload] Success! Path:', result.relativePath);
    
    // Return relative path (e.g., "assets/uploads/news/image-name.jpg")
    return result.relativePath;
  } catch (error) {
    console.error('[Upload] Error:', error);
    throw error;
  }
}

// Load users list
async function loadUsers(){
  try{
    const res = await fetch(`${API_BASE}/users`);
    if(!res.ok) throw new Error('Không tải được danh sách users');
    const payload = await res.json();
    users = (payload && payload.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    
    // Populate author select
    const authorSelect = qs('#author_id');
    authorSelect.innerHTML = '<option value="">-- Chọn tác giả --</option>';
    
    users.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.name}${user.role === 'admin' ? ' (Admin)' : ''}`;
      authorSelect.appendChild(option);
    });
    
    // Set default to current user or first admin
    const currentUser = users.find(u => u.role === 'admin');
    if(currentUser) {
      authorSelect.value = currentUser.id;
    }
  }catch(err){
    console.error(err);
    showToast({ message: 'Không thể tải danh sách tác giả', type: 'warning' });
  }
}

async function loadPost(id){
  try{
    const res = await fetch(`${API_BASE}/posts/${id}`);
    if(!res.ok) throw new Error('Không tải được bài viết');
    const payload = await res.json();
    const post = (payload && payload.data) ? payload.data : payload;
    
    // Update page title
    qs('#pageTitle').textContent = 'Sửa bài viết';
    qs('#pageSubtitle').textContent = `Chỉnh sửa bài viết #${id}`;
    
    // Fill form
    const titleInput = qs('#title');
    const slugInput = qs('#slug');
    const excerptInput = qs('#excerpt');
    const authorSelect = qs('#author_id');
    const statusSelect = qs('#status');
    const publishedInput = qs('#published_at');
    const imageUrlInput = qs('#imageUrl');
    const imagePreview = qs('#imagePreview');
    
    if(titleInput) titleInput.value = post.title || '';
    if(slugInput) slugInput.value = post.slug || '';
    if(excerptInput) excerptInput.value = post.excerpt || '';
    
    // Set author (wait for users to be loaded)
    if(authorSelect) {
      authorSelect.value = post.author_id || post.user_id || 1;
    }
    
    // Set status
    if(statusSelect) {
      statusSelect.value = post.status || 'draft';
      console.log('Setting status to:', post.status || 'draft');
    }
    
    // Set published date
    if(post.published_at && publishedInput) {
      const date = new Date(post.published_at);
      publishedInput.value = date.toISOString().slice(0, 16);
    }
    
    // Set image
    if(post.image) {
      if(imageUrlInput) imageUrlInput.value = post.image;
      if(imagePreview) {
        imagePreview.src = post.image;
        imagePreview.classList.add('show');
      }
    }
    
    // Set content
    setEditorContent(post.content || '');
  }catch(err){
    console.error(err);
    showToast({ message: err.message || 'Lỗi khi tải bài viết', type: 'error' });
  }
}

async function savePost(id, autoPublish = false){
  const title = qs('#title').value.trim();
  const slug = qs('#slug').value.trim();
  const excerpt = qs('#excerpt').value.trim();
  const author_id = Number(qs('#author_id').value) || 1;
  let status = autoPublish ? 'published' : qs('#status').value;
  let published_at = qs('#published_at').value || null;
  const image = qs('#imageUrl').value.trim() || null;
  const content = getEditorContent();
  
  if(!title){ 
    showToast({ message: 'Tiêu đề không được để trống', type: 'error' }); 
    return; 
  }

  // Logic: Nếu chọn "published" mà không có ngày xuất bản → set ngày hiện tại
  if(status === 'published' && !published_at) {
    const now = new Date();
    // Format: YYYY-MM-DDTHH:mm (cho datetime-local input)
    published_at = now.toISOString().slice(0, 16);
  }

  // Logic: Nếu chọn "scheduled" mà không có ngày → yêu cầu nhập
  if(status === 'scheduled' && !published_at) {
    showToast({ message: 'Vui lòng chọn ngày giờ xuất bản cho bài viết lên lịch', type: 'error' });
    return;
  }
  
  try{
    const payload = { 
      title, 
      slug: slug || generateSlug(title),
      excerpt,
      content, 
      author_id,
      status,
      published_at,
      image
    };
    
    console.log('Saving post with payload:', payload);
    
    const url = id ? `${API_BASE}/posts/${id}` : `${API_BASE}/posts`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, { 
      method, 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    
    if(!res.ok) throw new Error('Lỗi lưu bài viết: ' + res.status);
    const body = await res.json().catch(()=> ({}));
    
    showToast({ 
      message: autoPublish ? 'Đã lưu và xuất bản thành công!' : 'Lưu thành công!', 
      type: 'success' 
    });
    
    // redirect back to list
    setTimeout(()=> window.location.href = 'index.html', 1000);
  }catch(err){
    console.error(err);
    showToast({ message: err.message || 'Lỗi khi lưu bài viết', type: 'error' });
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  // Load users first
  await loadUsers();
  
  // Initialize editor (synchronous for Quill)
  initEditor();
  
  // Load post if editing
  const id = getIdFromQuery();
  if(id) {
    // Wait a bit for editor to be ready
    setTimeout(() => loadPost(id), 300);
  }

  // Auto-generate slug from title
  const titleInput = qs('#title');
  if(titleInput) {
    titleInput.addEventListener('input', (e) => {
      const slug = generateSlug(e.target.value);
      const slugInput = qs('#slug');
      if(slugInput) slugInput.value = slug;
    });
  }

  // Image file preview and upload
  const imageFile = qs('#imageFile');
  if(imageFile) {
    imageFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if(file) {
        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
          const preview = qs('#imagePreview');
          if(preview) {
            preview.src = event.target.result;
            preview.classList.add('show');
          }
        };
        reader.readAsDataURL(file);
        
        // Upload to server
        try {
          showToast({ message: 'Đang upload ảnh...', type: 'info' });
          const imagePath = await uploadImage(file);
          uploadedImagePath = imagePath;
          
          // Update URL input with uploaded path
          const urlInput = qs('#imageUrl');
          if(urlInput) urlInput.value = imagePath;
          
          showToast({ message: 'Upload ảnh thành công!', type: 'success' });
        } catch (error) {
          showToast({ message: 'Lỗi upload ảnh: ' + error.message, type: 'error' });
          // Clear file input on error
          e.target.value = '';
        }
      }
    });
  }

  // Image URL preview
  const imageUrl = qs('#imageUrl');
  if(imageUrl) {
    imageUrl.addEventListener('input', (e) => {
      const url = e.target.value.trim();
      const preview = qs('#imagePreview');
      if(url && preview) {
        preview.src = url;
        preview.classList.add('show');
        const fileInput = qs('#imageFile');
        if(fileInput) fileInput.value = '';
      } else if(preview) {
        preview.classList.remove('show');
      }
    });
  }

  // Save button
  const btnSave = qs('#btnSave');
  if(btnSave) {
    btnSave.addEventListener('click', async ()=>{
      const id = getIdFromQuery();
      await savePost(id, false);
    });
  }

  // Save and Publish button
  const btnSaveAndPublish = qs('#btnSaveAndPublish');
  if(btnSaveAndPublish) {
    btnSaveAndPublish.addEventListener('click', async ()=>{
      const id = getIdFromQuery();
      await savePost(id, true);
    });
  }
});
