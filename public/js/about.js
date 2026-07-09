(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  const settings = await loadSettings();
  await loadProducts(); // so the cart drawer works correctly if items are already in the cart

  const section = document.getElementById('aboutSection');
  section.innerHTML = `
    ${settings.aboutImage ? `<img src="${settings.aboutImage}" alt="${settings.aboutTitle}">` : ''}
    <h1>${settings.aboutTitle || 'About us'}</h1>
    <div class="about-body">${settings.aboutBody || ''}</div>
  `;

  initCartUI();
  renderCart();
})();
