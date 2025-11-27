

import { BASE_URL } from '../../js/config.js';

const API_BASE = BASE_URL;
const UPLOAD_API = `${API_BASE}/upload`;
let currentContents = null;


let aboutImageUrls = [];


async function loadPageContents() {
    try {
        const response = await fetch(`${API_BASE}/page-contents`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Load failed');
        }
        currentContents = result.data || {};
        fillForm(currentContents);
    } catch (err) {
        console.error(err);
        alert('Không tải được nội dung trang. Vui lòng thử lại.');
    }
}

function fillForm(data) {

    document.getElementById('homeHeroTitle').value =
        data.home_hero_title || '';
    document.getElementById('homeHeroSubtitle').value =
        data.home_hero_subtitle || '';
    document.getElementById('homeHeroButtonText').value =
        data.home_hero_button_text || '';
    document.getElementById('homeHeroButtonLink').value =
        data.home_hero_button_link || '';
    document.getElementById('homeHeroImage').value =
        data.home_hero_image || '';
    document.getElementById('homeIntroTitle').value =
        data.home_intro_title || '';
    document.getElementById('homeIntroText').value =
        data.home_intro_text || '';


    document.getElementById('aboutTitle').value =
        data.about_title || '';
    document.getElementById('aboutContent').value =
        data.about_content || '';



    document.getElementById('aboutImage').value = data.about_image || '[]';


    aboutImageUrls = [];
    if (data.about_image) {
        try {

            const decodedString = data.about_image.replace(/&quot;/g, '"');


            aboutImageUrls = JSON.parse(decodedString);


            if (!Array.isArray(aboutImageUrls)) {


                aboutImageUrls = [];
            }

        } catch (e) {


            console.warn("Không thể parse JSON, có thể là dữ liệu cũ (một URL đơn):", data.about_image);



            if (data.about_image && !data.about_image.startsWith('[')) {
                aboutImageUrls = [data.about_image];
            } else {

                aboutImageUrls = [];
            }
        }
    }
    console.log(aboutImageUrls);

    renderImagePreviews();


    if (data.updated_at) {
        document.getElementById('lastUpdate').textContent =
            new Date(data.updated_at).toLocaleString('vi-VN');
    }
}


async function handleImageUpload(files) {
    const previewContainer = document.getElementById('aboutImagePreview');
    const originalHtml = previewContainer.innerHTML;
    previewContainer.innerHTML += `
        <div id="upload-loading" class="spinner-border spinner-border-sm" role="status"></div>
    `;

    for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(UPLOAD_API, {
                method: 'POST',
                body: formData,

            });

            const result = await response.json();

            if (result && result.url) {
                aboutImageUrls.push(result.url);
            } else {
                console.warn('Upload thành công nhưng không nhận được URL:', result);
            }
        } catch (err) {
            console.error('Lỗi upload ảnh:', err);
            alert(`Tải lên file ${file.name} thất bại.`);
        }
    }


    document.getElementById('upload-loading')?.remove();


    renderImagePreviews();
    updateHiddenImageInput();
}


function renderImagePreviews() {
    const previewContainer = document.getElementById('aboutImagePreview');
    previewContainer.innerHTML = '';

    aboutImageUrls.forEach((url, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'avatar avatar-xl m-1';
        wrapper.style.position = 'relative';

        const img = document.createElement('img');
        img.className = 'avatar-img rounded';


        img.src = url.startsWith('http') ? url : `${API_BASE}${url}`;

        const removeBtn = document.createElement('a');
        removeBtn.href = '#';
        removeBtn.className = 'avatar-badge bg-danger text-white';
        removeBtn.innerHTML = '&times;';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.textDecoration = 'none';

        removeBtn.onclick = (e) => {
            e.preventDefault();
            removeImage(index);
        };

        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        previewContainer.appendChild(wrapper);
    });
}


function removeImage(index) {
    if (confirm('Bạn có chắc muốn xoá ảnh này?')) {
        aboutImageUrls.splice(index, 1);
        renderImagePreviews();
        updateHiddenImageInput();
    }
}


function updateHiddenImageInput() {
    const hiddenInput = document.getElementById('aboutImage');
    hiddenInput.value = JSON.stringify(aboutImageUrls);
}


async function savePageContents(e) {
    e.preventDefault();

    const btnSave = document.getElementById('btnSave');
    const originalText = btnSave.innerHTML;
    btnSave.disabled = true;
    btnSave.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...';

    try {
        const payload = {
            home_hero_title: document.getElementById('homeHeroTitle').value.trim(),
            home_hero_subtitle: document.getElementById('homeHeroSubtitle').value.trim(),
            home_hero_button_text: document.getElementById('homeHeroButtonText').value.trim(),
            home_hero_button_link: document.getElementById('homeHeroButtonLink').value.trim(),
            home_hero_image: document.getElementById('homeHeroImage').value.trim(),
            home_intro_title: document.getElementById('homeIntroTitle').value.trim(),
            home_intro_text: document.getElementById('homeIntroText').value.trim(),
            about_title: document.getElementById('aboutTitle').value.trim(),
            about_content: document.getElementById('aboutContent').value.trim(),
            about_image: document.getElementById('aboutImage').value.trim(),
        };

        const response = await fetch(`${API_BASE}/page-contents`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Save failed');
        }

        currentContents = result.data;
        alert('Đã lưu nội dung trang thành công!');

        if (currentContents.updated_at) {
            document.getElementById('lastUpdate').textContent =
                new Date(currentContents.updated_at).toLocaleString('vi-VN');
        }
    } catch (err) {
        console.error(err);
        alert('Không thể lưu nội dung. Vui lòng thử lại.');
    } finally {
        btnSave.disabled = false;
        btnSave.innerHTML = originalText;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    loadPageContents();
    document
        .getElementById('pageContentForm')
        .addEventListener('submit', savePageContents);


    document.getElementById('aboutImageUpload').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files);
        }
    });
});