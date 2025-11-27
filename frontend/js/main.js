export function ready(callback) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
  }

  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');

  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const keyword = searchInput.value.trim();

      if (keyword) {
        window.location.href = `products.html?search=${encodeURIComponent(keyword)}`;
      }
    });
  }
});