export function showToast({ message = '', type = 'info', timeout = 3000 } = {}) {
  try {
    let container = document.getElementById('app-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'app-toast-container';
      container.style.position = 'fixed';
      container.style.right = '16px';
      container.style.top = '16px';
      container.style.zIndex = 99999;
      document.body.appendChild(container);
    }

    const el = document.createElement('div');
    el.className = 'app-toast app-toast-' + type;
    el.style.background = type === 'error' ? '#ff6b6b' : (type === 'success' ? '#3adb76' : '#2b7cff');
    el.style.color = '#fff';
    el.style.padding = '8px 12px';
    el.style.marginTop = '8px';
    el.style.borderRadius = '6px';
    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
    el.style.fontSize = '13px';
    el.textContent = message;

    container.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 200ms ease, transform 200ms ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-6px)';
    }, timeout - 250);
    setTimeout(() => { try { container.removeChild(el); } catch (e) {} }, timeout + 50);
  } catch (err) {
    try { alert(message); } catch (e) { console.log(message); }
  }
}
