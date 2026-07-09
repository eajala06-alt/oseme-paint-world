function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function renderGallery() {
  const res = await fetch('/api/projects');
  const projects = await res.json();
  const grid = document.getElementById('projectsGrid');

  if (!projects.length) {
    grid.innerHTML = `<p>No projects added yet.</p>`;
    return;
  }

  grid.innerHTML = projects.map(p => `
    <a class="project-card" href="/projects.html?id=${p.id}">
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <div class="project-card-title">${p.title}</div>
    </a>
  `).join('');
}

async function renderDetail(id) {
  const pageContent = document.getElementById('pageContent');
  try {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) throw new Error('not found');
    const p = await res.json();

    pageContent.innerHTML = `
      <div class="project-detail">
        <a href="/projects.html" class="back-link">← All projects</a>
        <img src="${p.image}" alt="${p.title}">
        ${p.location ? `<div class="location-badge">📍 ${escapeHtml(p.location)}</div>` : ''}
        <h1>${escapeHtml(p.title)}</h1>
        <p class="desc-text">${escapeHtml(p.description)}</p>
      </div>
    `;
  } catch (e) {
    pageContent.innerHTML = `
      <div class="project-detail">
        <a href="/projects.html" class="back-link">← All projects</a>
        <h1>Project not found</h1>
        <p class="desc-text">This project may have been removed.</p>
      </div>
    `;
  }
}

(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  await loadSettings();
  await loadProducts(); // so the cart drawer works correctly if items are already in the cart

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (id) {
    await renderDetail(id);
  } else {
    await renderGallery();
  }

  initCartUI();
  renderCart();
})();
