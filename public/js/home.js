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

async function renderProjectsPreview() {
  const scroller = document.getElementById('projectsScroller');
  const res = await fetch('/api/projects');
  const projects = await res.json();

  if (!projects.length) {
    scroller.innerHTML = `<p>Projects coming soon.</p>`;
    return;
  }

  scroller.innerHTML = projects.map(p => `
    <a class="project-card" href="/projects.html?id=${p.id}">
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <div class="project-card-title">${p.title}</div>
    </a>
  `).join('');
}

function initScrollArrow() {
  const scroller = document.getElementById('projectsScroller');
  const btn = document.getElementById('scrollArrowBtn');
  btn.onclick = () => scroller.scrollBy({ left: 320, behavior: 'smooth' });
}

(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  const settings = await loadSettings();
  renderHero(settings);
  await loadProducts(); // needed so the cart drawer can show correct item info if the cart already has items
  await renderProjectsPreview();
  initScrollArrow();
  initCartUI();
  renderCart();
})();
