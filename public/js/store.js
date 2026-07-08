let PRODUCTS = [];
let CART = JSON.parse(localStorage.getItem('cart') || '[]'); // [{productId, qty}]
let SETTINGS = { storeName: 'Oseme Paint World', currency: 'NGN' };
let activeCategory = 'All';

const grid = document.getElementById('grid');
const filtersEl = document.getElementById('filters');

function formatMoney(n) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: SETTINGS.currency || 'NGN' }).format(n);
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(CART));
  renderCart();
}

async function loadSettings() {
  const res = await fetch('/api/settings');
  SETTINGS = await res.json();
  document.title = SETTINGS.storeName;
  document.getElementById('storeNameFooter').textContent = SETTINGS.storeName;

  const logoWrap = document.getElementById('logoWrap');
  if (SETTINGS.logoUrl) {
    logoWrap.innerHTML = `<img src="${SETTINGS.logoUrl}" alt="${SETTINGS.storeName}">`;
  } else {
    logoWrap.innerHTML = `<span class="logo" id="storeName">${SETTINGS.storeName}</span>`;
  }

  if (SETTINGS.primaryColor) document.documentElement.style.setProperty('--forest', SETTINGS.primaryColor);
  if (SETTINGS.accentColor) document.documentElement.style.setProperty('--brass', SETTINGS.accentColor);
}

async function loadProducts() {
  const res = await fetch('/api/products');
  PRODUCTS = await res.json();
  renderFilters();
  renderGrid();
}

function renderFilters() {
  const cats = ['All', ...new Set(PRODUCTS.map(p => p.category))];
  filtersEl.innerHTML = cats.map(c =>
    `<button class="filter-chip ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  filtersEl.querySelectorAll('.filter-chip').forEach(btn => {
    btn.onclick = () => { activeCategory = btn.dataset.cat; renderFilters(); renderGrid(); };
  });
}

function renderGrid() {
  const items = activeCategory === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);
  if (!items.length) {
    grid.innerHTML = `<p>No products in this category yet.</p>`;
    return;
  }
  grid.innerHTML = items.map(p => `
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
  `).join('');
  grid.querySelectorAll('.add-btn').forEach(btn => {
    btn.onclick = () => addToCart(btn.dataset.id);
  });
}

function addToCart(productId) {
  const existing = CART.find(i => i.productId === productId);
  if (existing) existing.qty += 1;
  else CART.push({ productId, qty: 1 });
  saveCart();
  openDrawer();
}

function changeQty(productId, delta) {
  const item = CART.find(i => i.productId === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) CART = CART.filter(i => i.productId !== productId);
  saveCart();
}

function renderCart() {
  const drawerItems = document.getElementById('drawerItems');
  const cartCount = document.getElementById('cartCount');
  const cartTotal = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');

  cartCount.textContent = CART.reduce((s, i) => s + i.qty, 0);

  if (!CART.length) {
    drawerItems.innerHTML = `<p style="color:var(--ink-soft)">Your cart is empty.</p>`;
    cartTotal.textContent = formatMoney(0);
    checkoutBtn.disabled = true;
    return;
  }

  let total = 0;
  drawerItems.innerHTML = CART.map(item => {
    const p = PRODUCTS.find(pp => pp.id === item.productId);
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
document.getElementById('cartToggle').onclick = openDrawer;
document.getElementById('closeDrawer').onclick = closeDrawer;
document.getElementById('drawerOverlay').onclick = closeDrawer;

// ===== Checkout =====
const checkoutOverlay = document.getElementById('checkoutOverlay');
document.getElementById('checkoutBtn').onclick = () => {
  closeDrawer();
  checkoutOverlay.classList.add('open');
};
checkoutOverlay.onclick = (e) => { if (e.target === checkoutOverlay) checkoutOverlay.classList.remove('open'); };

document.getElementById('payBtn').onclick = async () => {
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
        items: CART,
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
      callback: (response) => {
        window.location.href = `/order-success.html?order=${data.orderId}`;
      }
    });
    handler.openIframe();
  } catch (err) {
    errorEl.textContent = 'Could not reach the server. Please try again.';
    payBtn.disabled = false;
    payBtn.textContent = 'Pay now';
  }
};

// ===== Init =====
(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  await loadSettings();
  await loadProducts();
  renderCart();
})();
