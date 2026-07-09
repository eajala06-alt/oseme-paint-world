// Shared across index.html (landing) and shop.html (catalog) so the cart,
// branding and checkout behave identically and stay in sync on both pages.

window.SETTINGS = { storeName: 'Your Store', currency: 'NGN' };
window.PRODUCTS = [];
window.CART = JSON.parse(localStorage.getItem('cart') || '[]'); // [{productId, qty}]

function formatMoney(n) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: window.SETTINGS.currency || 'NGN' }).format(n);
}

// ===== Settings / branding =====
async function loadSettings() {
  const res = await fetch('/api/settings');
  window.SETTINGS = await res.json();
  const s = window.SETTINGS;

  document.title = s.storeName;
  const footerName = document.getElementById('storeNameFooter');
  if (footerName) footerName.textContent = s.storeName;

  const logoWrap = document.getElementById('logoWrap');
  if (logoWrap) {
    logoWrap.innerHTML = s.logoUrl
      ? `<img src="${s.logoUrl}" alt="${s.storeName}">`
      : `<span class="logo" id="storeName">${s.storeName}</span>`;
  }

  if (s.primaryColor) document.documentElement.style.setProperty('--forest', s.primaryColor);
  if (s.accentColor) document.documentElement.style.setProperty('--brass', s.accentColor);
  if (s.headerColor) {
    document.documentElement.style.setProperty('--header-bg', s.headerColor);
    document.documentElement.style.setProperty('--header-text', pickReadableTextColor(s.headerColor));
  }

  return s;
}

// Picks black or white text depending on how light/dark the given hex color is,
// so the logo/nav stay readable no matter what banner color is chosen.
function pickReadableTextColor(hex) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#1F2A24';
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1F2A24' : '#FFFFFF';
}

// ===== Products (full list, shared so the cart can show correct info on any page) =====
async function loadProducts() {
  const res = await fetch('/api/products');
  window.PRODUCTS = await res.json();
  pruneCart(); // silently drop any cart items that no longer exist / aren't for sale
  return window.PRODUCTS;
}

// If a product was deleted, hidden, or the store data was reset since an item was
// added to a visitor's cart, that old reference would otherwise sit in localStorage
// forever and only surface as a confusing error at checkout. Clean it up quietly instead.
function pruneCart() {
  const validIds = new Set(window.PRODUCTS.map(p => p.id));
  const before = window.CART.length;
  window.CART = window.CART.filter(i => validIds.has(i.productId));
  if (window.CART.length !== before) {
    localStorage.setItem('cart', JSON.stringify(window.CART));
  }
}

// ===== Product card markup (used by both the featured strip and the full catalogue) =====
function renderProductCard(p) {
  return `
    <div class="card">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div class="card-body">
        <h3>${p.name}</h3>
        <div class="desc">${p.description || ''}</div>
        <div class="tag">${formatMoney(p.price)}</div>
        ${p.stock > 0
          ? `<button class="add-btn" data-id="${p.id}">Add to cart</button>`
          : `<div class="out-of-stock">Out of stock</div>`}
      </div>
    </div>
  `;
}

// Attach add-to-cart clicks to every .add-btn inside a container (call after rendering cards)
function bindAddToCartButtons(container) {
  container.querySelectorAll('.add-btn').forEach(btn => {
    btn.onclick = () => addToCart(btn.dataset.id);
  });
}

// ===== Cart =====
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(window.CART));
  renderCart();
}

function addToCart(productId) {
  const existing = window.CART.find(i => i.productId === productId);
  if (existing) existing.qty += 1;
  else window.CART.push({ productId, qty: 1 });
  saveCart();
  openDrawer();
}

function changeQty(productId, delta) {
  const item = window.CART.find(i => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) window.CART = window.CART.filter(i => i.productId !== productId);
  saveCart();
}

function renderCart() {
  const drawerItems = document.getElementById('drawerItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (!drawerItems) return; // cart drawer not on this page

  cartCount.textContent = window.CART.reduce((s, i) => s + i.qty, 0);

  if (!window.CART.length) {
    drawerItems.innerHTML = `<p style="color:var(--ink-soft)">Your cart is empty.</p>`;
    cartTotal.textContent = formatMoney(0);
    checkoutBtn.disabled = true;
    return;
  }

  let total = 0;
  drawerItems.innerHTML = window.CART.map(item => {
    const p = window.PRODUCTS.find(pp => pp.id === item.productId);
    if (!p) return '';
    total += p.price * item.qty;
    return `
      <div class="drawer-item">
        <img src="${p.image}" alt="${p.name}">
        <div class="info">
          <div>${p.name}</div>
          <div style="color:var(--ink-soft); font-size:13px">${formatMoney(p.price)}</div>
          <div class="qty-controls">
            <button data-id="${p.id}" data-d="-1">−</button>
            <span>${item.qty}</span>
            <button data-id="${p.id}" data-d="1">+</button>
          </div>
        </div>
      </div>`;
  }).join('');
  cartTotal.textContent = formatMoney(total);
  checkoutBtn.disabled = false;

  drawerItems.querySelectorAll('.qty-controls button').forEach(btn => {
    btn.onclick = () => changeQty(btn.dataset.id, Number(btn.dataset.d));
  });
}

function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
}
function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
}

function initCartUI() {
  const cartToggle = document.getElementById('cartToggle');
  const closeBtn = document.getElementById('closeDrawer');
  const overlay = document.getElementById('drawerOverlay');
  if (cartToggle) cartToggle.onclick = openDrawer;
  if (closeBtn) closeBtn.onclick = closeDrawer;
  if (overlay) overlay.onclick = closeDrawer;

  const checkoutOverlay = document.getElementById('checkoutOverlay');
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      closeDrawer();
      checkoutOverlay.classList.add('open');
    };
  }
  if (checkoutOverlay) {
    checkoutOverlay.onclick = (e) => { if (e.target === checkoutOverlay) checkoutOverlay.classList.remove('open'); };
  }

  const payBtn = document.getElementById('payBtn');
  if (payBtn) payBtn.onclick = handlePayment;
}

// ===== Checkout / Paystack =====
async function handlePayment() {
  const name = document.getElementById('custName').value.trim();
  const email = document.getElementById('custEmail').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const address = document.getElementById('custAddress').value.trim();
  const errorEl = document.getElementById('checkoutError');
  errorEl.textContent = '';

  if (!name || !email || !phone) {
    errorEl.textContent = 'Please fill in your name, email and phone number.';
    return;
  }

  const payBtn = document.getElementById('payBtn');
  payBtn.disabled = true;
  payBtn.textContent = 'Preparing payment…';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: window.CART,
        customer: { name, email, phone, address }
      })
    });
    const data = await res.json();

    if (!res.ok) {
      errorEl.textContent = data.error || 'Something went wrong.';
      payBtn.disabled = false;
      payBtn.textContent = 'Pay now';
      return;
    }

    const handler = PaystackPop.setup({
      key: window.PAYSTACK_PUBLIC_KEY || 'pk_test_replace_me',
      email,
      amount: data.total * 100,
      ref: data.reference,
      onClose: () => {
        payBtn.disabled = false;
        payBtn.textContent = 'Pay now';
      },
      callback: () => {
        window.location.href = `/order-success.html?order=${data.orderId}`;
      }
    });
    handler.openIframe();
  } catch (err) {
    errorEl.textContent = 'Could not reach the server. Please try again.';
    payBtn.disabled = false;
    payBtn.textContent = 'Pay now';
  }
}
