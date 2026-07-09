async function renderServices() {
  const res = await fetch('/api/services');
  const services = await res.json();
  const grid = document.getElementById('servicesGrid');

  if (!services.length) {
    grid.innerHTML = `<p>No services added yet.</p>`;
    return;
  }

  grid.innerHTML = services.map(s => `
    <div class="service-card">
      <img src="${s.image}" alt="${s.title}" loading="lazy">
      <div class="service-card-body">
        <h3>${s.title}</h3>
        <p>${s.description}</p>
      </div>
    </div>
  `).join('');
}

(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  await loadSettings();
  await loadProducts(); // so the cart drawer works correctly if items are already in the cart
  await renderServices();
  initCartUI();
  renderCart();
})();
