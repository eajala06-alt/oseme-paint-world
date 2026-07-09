(async function init() {
  document.getElementById('year').textContent = new Date().getFullYear();
  const settings = await loadSettings();
  await loadProducts(); // so the cart drawer works correctly if items are already in the cart

  const infoEl = document.getElementById('contactInfo');
  const waLink = `https://wa.me/${(settings.whatsappNumber || '').replace(/\D/g, '')}?text=${encodeURIComponent('Hi! I have a question.')}`;
  infoEl.innerHTML = `
    <div class="contact-info-row">
      <span class="icon">📧</span>
      <div><div class="label">Email</div><a href="mailto:${settings.contactEmail}">${settings.contactEmail}</a></div>
    </div>
    <div class="contact-info-row">
      <span class="icon">📞</span>
      <div><div class="label">Phone</div><a href="tel:+${settings.contactPhone}">${settings.contactPhone}</a></div>
    </div>
    <div class="contact-info-row">
      <span class="icon">📍</span>
      <div><div class="label">Address</div>${settings.contactAddress}</div>
    </div>
    <div class="contact-info-row">
      <span class="icon">💬</span>
      <div><div class="label">WhatsApp</div><a href="${waLink}" target="_blank">Chat with us →</a></div>
    </div>
  `;

  document.getElementById('contactForm').onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById('cName').value.trim();
    const email = document.getElementById('cEmail').value.trim();
    const message = document.getElementById('cMessage').value.trim();
    const subject = encodeURIComponent(`Message from ${name} via website`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${settings.contactEmail}?subject=${subject}&body=${body}`;
  };

  initCartUI();
  renderCart();
})();
