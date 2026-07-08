const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

function renderHero(settings) {
  const media = document.getElementById('heroMedia');
  if (!settings.heroUrl) return; // leave the default gradient background

  if (VIDEO_EXT.test(settings.heroUrl)) {
    media.innerHTML = `<video autoplay muted loop playsinline src="${settings.heroUrl}"></video>`;
  } else {
    media.innerHTML = `<img src="${settings.heroUrl}" alt="${settings.storeName}">`;
  }
}

function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  const items = window.PRODUCTS.filter(p => p.active).slice(0, 4);
  if (!items.length) {
    grid.innerHTML = `<p>Products coming soon.</p>`;
    return;
  }
  grid.innerHTML = items.map(renderProductCard).join('');
  bindAddToCartButtons(grid);
}

(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  const settings = await loadSettings();
  renderHero(settings);
  await loadProducts();
  renderFeatured();
  initCartUI();
  renderCart();
})();
