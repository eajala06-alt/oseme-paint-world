let activeCategory = 'All';

function renderFilters() {
  const filtersEl = document.getElementById('filters');
  const cats = ['All', ...new Set(window.PRODUCTS.map(p => p.category))];
  filtersEl.innerHTML = cats.map(c =>
    `<button class="filter-chip ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  filtersEl.querySelectorAll('.filter-chip').forEach(btn => {
    btn.onclick = () => { activeCategory = btn.dataset.cat; renderFilters(); renderGrid(); };
  });
}

function renderGrid() {
  const grid = document.getElementById('grid');
  const items = activeCategory === 'All' ? window.PRODUCTS : window.PRODUCTS.filter(p => p.category === activeCategory);
  if (!items.length) {
    grid.innerHTML = `<p>No products in this category yet.</p>`;
    return;
  }
  grid.innerHTML = items.map(renderProductCard).join('');
  bindAddToCartButtons(grid);
}

(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  await loadSettings();
  await loadProducts();
  renderFilters();
  renderGrid();
  initCartUI();
  renderCart();
})();
