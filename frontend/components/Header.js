import { updateCartCounter } from "../js/updateCartCounter.js";

const API_BASE = 'http://localhost:8000';

async function fetchUser(userId) {
  if (!userId) return null;

  try {
    const response = await fetch(`${API_BASE}/users/${userId}`);

    if (!response.ok) {
      console.error(`Lỗi ${response.status} khi tải user`);
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      return result.data;
    }
    if (result.id) {
      return result;
    }

    return null;

  } catch (err) {
    console.error("Lỗi khi tải thông tin user:", err);
    return null;
  }
}

export async function Header({ current, userName = null, userId = null }) {
  const navItems = [
    { href: '/fe/pages/home/index.html', label: 'Home', key: 'home' },
    { href: '/fe/pages/about/index.html', label: 'About', key: 'about' },
    { href: '/fe/pages/about/faq.html', label: 'FAQ', key: 'faq' },
    { href: '/fe/pages/products/products.html', label: 'Products', key: 'products' },
    { href: '/fe/pages/news/news.html', label: 'News', key: 'news' },
    { href: '/fe/pages/home/contact.html', label: 'Contact', key: 'contact' },
  ];

  const cartHref = {
    href: '/fe/pages/products/cart.html', label: 'Cart', key: 'cart'
  }

  const navLinks = navItems
    .map(({ href, label, key }) => {
      const active = current === key ? ' class="active"' : '';
      return `<a href="${href}"${active}>${label}</a>`;
    })
    .join('');

  let userAuthBlock = '';
  if (userName != null) {
    userAuthBlock = `
      <div class="user-profile-menu">
        <a href="/fe/pages/profile/profile.html?id=${userId}" class="profile-link">
          Chào, ${userName}
        </a>
        <button id="logout-btn" class="btn-logout">(Đăng xuất)</button>
      </div>
    `;
  } else {
    userAuthBlock = `
      <a href="/fe/pages/home/login.html" class="nav-auth-link">Đăng nhập</a>
    `;
  }

  const site_name = await loadSiteSettings();

  return `
    <header class="site-header">
      <nav class="navbar">
        <div class="nav-left">
          <a href="/fe/" class="logo">${site_name}</a>
        </div>

        <nav class="site-nav">
          ${navLinks}
          
          <div class="nav-auth">
            ${userAuthBlock}
          </div>
        </nav>

        <div class="nav-right">
          <form class="search-bar" id="search-form">
            <input type="search" id="search-input" placeholder="Tìm kiếm sản phẩm...">
            <button type="submit" class="search-button">&#128269;</button>
          </form>

          <a href="${cartHref.href}" class="cart-icon" key="${cartHref.key}">
            &#128722;
            <span class="cart-counter" id="cart-counter">0</span>
          </a>

          <button id="mobile-nav-toggle" class="mobile-nav-toggle" aria-label="Mở menu">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
        </div>
      </nav>
    </header>
  `;
}

async function loadSiteSettings() {
  try {
    const response = await fetch(`${API_BASE}/site-settings`);
    const result = await response.json();
    if (result.success && result.data) {
      return result.data.site_name;
    }
    return "Shoe Store";
  } catch (error) {
    return "Shoe Store";
  }
}

export async function mountHeader(containerSelector, current) {
  const container =
    typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;
  if (!container) return;

 
  container.innerHTML = `
    <header class="site-header skeleton">
      </header>
  `;

 
  let userName = null;
  const userId = localStorage.getItem('userId');

  if (userId) {
    const user = await fetchUser(userId);
    if (user) {
      userName = user.name;
    }
  }

 
  const headerHTML = await Header({ current, userName, userId });
  container.innerHTML = headerHTML;
 
  const headerElement = container.querySelector('.site-header');

 
  if (userId) {
    await updateCartCounter(userId);
  }

 
  const searchForm = container.querySelector('#search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = container.querySelector('#search-input').value.trim();
      if (query) {
        window.location.href = `/fe/pages/products/products.html?product_query=${encodeURIComponent(query)}`;
      }
    });
  }

 
  const logoutBtn = container.querySelector('#logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('userId');
      alert('Bạn đã đăng xuất.');
      window.location.href = '/fe/pages/home/login.html';
    });
  }

 
  const mobileToggle = container.querySelector('#mobile-nav-toggle');
  if (mobileToggle && headerElement) {
    mobileToggle.addEventListener('click', () => {
     
      headerElement.classList.toggle('mobile-nav-open');
    });
  }
}