const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');

function money(n) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);
}

// ===== Login =====
document.getElementById('loginBtn').onclick = async () => {
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (res.ok) {
    showDashboard();
  } else {
    const data = await res.json();
    errorEl.textContent = data.error || 'Login failed';
  }
};
document.getElementById('loginPassword').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('loginBtn').click();
});

document.getElementById('logoutBtn').onclick = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  location.reload();
};

async function checkSession() {
  const res = await fetch('/api/products/admin/all');
  if (res.ok) showDashboard();
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'flex';
  loadProducts();
  loadOrders();
  loadSettings();
  loadProjects();
  loadServices();
  loadPagesTab();
}

// ===== Generic image upload (used by products, projects, services, about photo) =====
async function uploadImageGeneric(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/api/uploads', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

// ===== Tabs =====
document.querySelectorAll('.nav-link[data-tab]').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.nav-link[data-tab]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  };
});

// ===== Products =====
async function loadProducts() {
  const res = await fetch('/api/products/admin/all');
  const products = await res.json();
  const body = document.getElementById('productsBody');
  body.innerHTML = products.map(p => `
    <tr>
      <td><img src="${p.image}"></td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${money(p.price)}</td>
      <td>${p.stock}</td>
      <td>${p.active ? 'Visible' : 'Hidden'}</td>
      <td class="row-actions">
        <button data-id="${p.id}" class="edit">Edit</button>
        <button data-id="${p.id}" class="del">Delete</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('.edit').forEach(btn => btn.onclick = () => openProductModal(products.find(p => p.id === btn.dataset.id)));
  body.querySelectorAll('.del').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this product?')) return;
      await fetch('/api/products/' + btn.dataset.id, { method: 'DELETE' });
      loadProducts();
    };
  });
}

const productModal = document.getElementById('productModal');
function openProductModal(product) {
  document.getElementById('productError').textContent = '';
  document.getElementById('productModalTitle').textContent = product ? 'Edit product' : 'Add product';
  document.getElementById('p_id').value = product ? product.id : '';
  document.getElementById('p_name').value = product ? product.name : '';
  document.getElementById('p_desc').value = product ? product.description : '';
  document.getElementById('p_price').value = product ? product.price : '';
  document.getElementById('p_stock').value = product ? product.stock : '';
  document.getElementById('p_category').value = product ? product.category : '';
  document.getElementById('p_image').value = product ? product.image : '';
  document.getElementById('p_active').checked = product ? product.active : true;
  document.getElementById('p_imageFile').value = '';
  renderImagePreview('p_imagePreviewWrap', product ? product.image : '');
  productModal.classList.add('open');
}
document.getElementById('newProductBtn').onclick = () => openProductModal(null);
document.getElementById('cancelProductBtn').onclick = () => productModal.classList.remove('open');

function renderImagePreview(wrapId, url) {
  const wrap = document.getElementById(wrapId);
  wrap.innerHTML = url
    ? `<img src="${url}" style="width:100%;max-width:200px;border-radius:8px;display:block">`
    : `<span style="color:var(--ink-soft);font-size:13px">No photo uploaded yet.</span>`;
}

document.getElementById('p_uploadImageBtn').onclick = async () => {
  const fileInput = document.getElementById('p_imageFile');
  const errorEl = document.getElementById('productError');
  if (!fileInput.files.length) {
    errorEl.textContent = 'Choose a photo first.';
    return;
  }
  try {
    const url = await uploadImageGeneric(fileInput.files[0]);
    document.getElementById('p_image').value = url;
    renderImagePreview('p_imagePreviewWrap', url);
    errorEl.textContent = '';
  } catch (err) {
    errorEl.textContent = err.message;
  }
};

document.getElementById('saveProductBtn').onclick = async () => {
  const id = document.getElementById('p_id').value;
  const payload = {
    name: document.getElementById('p_name').value.trim(),
    description: document.getElementById('p_desc').value.trim(),
    price: Number(document.getElementById('p_price').value),
    stock: Number(document.getElementById('p_stock').value),
    category: document.getElementById('p_category').value.trim() || 'General',
    image: document.getElementById('p_image').value.trim(),
    active: document.getElementById('p_active').checked
  };
  const errorEl = document.getElementById('productError');
  if (!payload.name || !payload.price) {
    errorEl.textContent = 'Name and price are required.';
    return;
  }
  const res = await fetch(id ? '/api/products/' + id : '/api/products', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    productModal.classList.remove('open');
    loadProducts();
  } else {
    const data = await res.json();
    errorEl.textContent = data.error || 'Could not save product';
  }
};

// ===== Orders =====
async function loadOrders() {
  const res = await fetch('/api/orders');
  const orders = await res.json();
  const body = document.getElementById('ordersBody');
  if (!orders.length) {
    body.innerHTML = `<tr><td colspan="6">No orders yet.</td></tr>`;
    return;
  }
  body.innerHTML = orders.map(o => `
    <tr>
      <td>#${o.id.slice(0,8)}</td>
      <td>${o.customer.name}<br><span style="color:var(--ink-soft);font-size:12px">${o.customer.phone}</span></td>
      <td>${o.items.map(i => `${i.qty}× ${i.name}`).join('<br>')}</td>
      <td>${money(o.total)}</td>
      <td>
        <select data-id="${o.id}" class="status-select">
          ${['pending','paid','fulfilled','cancelled'].map(s => `<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}
        </select>
      </td>
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
    </tr>
  `).join('');

  body.querySelectorAll('.status-select').forEach(sel => {
    sel.onchange = async () => {
      await fetch(`/api/orders/${sel.dataset.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: sel.value })
      });
    };
  });
}

// ===== Projects =====
async function loadProjects() {
  const res = await fetch('/api/projects/admin/all');
  const projects = await res.json();
  const body = document.getElementById('projectsBody');
  if (!projects.length) {
    body.innerHTML = `<tr><td colspan="5">No projects yet.</td></tr>`;
    return;
  }
  body.innerHTML = projects.map(p => `
    <tr>
      <td><img src="${p.image}"></td>
      <td>${p.title}</td>
      <td>${p.location || '—'}</td>
      <td>${p.active ? 'Visible' : 'Hidden'}</td>
      <td class="row-actions">
        <button data-id="${p.id}" class="edit-project">Edit</button>
        <button data-id="${p.id}" class="del-project">Delete</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('.edit-project').forEach(btn => btn.onclick = () => openProjectModal(projects.find(p => p.id === btn.dataset.id)));
  body.querySelectorAll('.del-project').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this project?')) return;
      await fetch('/api/projects/' + btn.dataset.id, { method: 'DELETE' });
      loadProjects();
    };
  });
}

const projectModal = document.getElementById('projectModal');
function openProjectModal(project) {
  document.getElementById('projectError').textContent = '';
  document.getElementById('projectModalTitle').textContent = project ? 'Edit project' : 'Add project';
  document.getElementById('pr_id').value = project ? project.id : '';
  document.getElementById('pr_title').value = project ? project.title : '';
  document.getElementById('pr_location').value = project ? project.location : '';
  document.getElementById('pr_description').value = project ? project.description : '';
  document.getElementById('pr_image').value = project ? project.image : '';
  document.getElementById('pr_active').checked = project ? project.active : true;
  document.getElementById('pr_imageFile').value = '';
  renderImagePreview('pr_imagePreviewWrap', project ? project.image : '');
  projectModal.classList.add('open');
}
document.getElementById('newProjectBtn').onclick = () => openProjectModal(null);
document.getElementById('cancelProjectBtn').onclick = () => projectModal.classList.remove('open');

document.getElementById('pr_uploadImageBtn').onclick = async () => {
  const fileInput = document.getElementById('pr_imageFile');
  const errorEl = document.getElementById('projectError');
  if (!fileInput.files.length) { errorEl.textContent = 'Choose a photo first.'; return; }
  try {
    const url = await uploadImageGeneric(fileInput.files[0]);
    document.getElementById('pr_image').value = url;
    renderImagePreview('pr_imagePreviewWrap', url);
    errorEl.textContent = '';
  } catch (err) {
    errorEl.textContent = err.message;
  }
};

document.getElementById('saveProjectBtn').onclick = async () => {
  const id = document.getElementById('pr_id').value;
  const payload = {
    title: document.getElementById('pr_title').value.trim(),
    location: document.getElementById('pr_location').value.trim(),
    description: document.getElementById('pr_description').value.trim(),
    image: document.getElementById('pr_image').value.trim(),
    active: document.getElementById('pr_active').checked
  };
  const errorEl = document.getElementById('projectError');
  if (!payload.title) { errorEl.textContent = 'Title is required.'; return; }
  const res = await fetch(id ? '/api/projects/' + id : '/api/projects', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    projectModal.classList.remove('open');
    loadProjects();
  } else {
    const data = await res.json();
    errorEl.textContent = data.error || 'Could not save project';
  }
};

// ===== Services =====
async function loadServices() {
  const res = await fetch('/api/services/admin/all');
  const services = await res.json();
  const body = document.getElementById('servicesBody');
  if (!services.length) {
    body.innerHTML = `<tr><td colspan="4">No services yet.</td></tr>`;
    return;
  }
  body.innerHTML = services.map(s => `
    <tr>
      <td><img src="${s.image}"></td>
      <td>${s.title}</td>
      <td>${(s.description || '').slice(0, 60)}${s.description && s.description.length > 60 ? '…' : ''}</td>
      <td>${s.active ? 'Visible' : 'Hidden'}</td>
      <td class="row-actions">
        <button data-id="${s.id}" class="edit-service">Edit</button>
        <button data-id="${s.id}" class="del-service">Delete</button>
      </td>
    </tr>
  `).join('');

  body.querySelectorAll('.edit-service').forEach(btn => btn.onclick = () => openServiceModal(services.find(s => s.id === btn.dataset.id)));
  body.querySelectorAll('.del-service').forEach(btn => {
    btn.onclick = async () => {
      if (!confirm('Delete this service?')) return;
      await fetch('/api/services/' + btn.dataset.id, { method: 'DELETE' });
      loadServices();
    };
  });
}

const serviceModal = document.getElementById('serviceModal');
function openServiceModal(service) {
  document.getElementById('serviceError').textContent = '';
  document.getElementById('serviceModalTitle').textContent = service ? 'Edit service' : 'Add service';
  document.getElementById('sv_id').value = service ? service.id : '';
  document.getElementById('sv_title').value = service ? service.title : '';
  document.getElementById('sv_description').value = service ? service.description : '';
  document.getElementById('sv_image').value = service ? service.image : '';
  document.getElementById('sv_active').checked = service ? service.active : true;
  document.getElementById('sv_imageFile').value = '';
  renderImagePreview('sv_imagePreviewWrap', service ? service.image : '');
  serviceModal.classList.add('open');
}
document.getElementById('newServiceBtn').onclick = () => openServiceModal(null);
document.getElementById('cancelServiceBtn').onclick = () => serviceModal.classList.remove('open');

document.getElementById('sv_uploadImageBtn').onclick = async () => {
  const fileInput = document.getElementById('sv_imageFile');
  const errorEl = document.getElementById('serviceError');
  if (!fileInput.files.length) { errorEl.textContent = 'Choose a photo first.'; return; }
  try {
    const url = await uploadImageGeneric(fileInput.files[0]);
    document.getElementById('sv_image').value = url;
    renderImagePreview('sv_imagePreviewWrap', url);
    errorEl.textContent = '';
  } catch (err) {
    errorEl.textContent = err.message;
  }
};

document.getElementById('saveServiceBtn').onclick = async () => {
  const id = document.getElementById('sv_id').value;
  const payload = {
    title: document.getElementById('sv_title').value.trim(),
    description: document.getElementById('sv_description').value.trim(),
    image: document.getElementById('sv_image').value.trim(),
    active: document.getElementById('sv_active').checked
  };
  const errorEl = document.getElementById('serviceError');
  if (!payload.title) { errorEl.textContent = 'Title is required.'; return; }
  const res = await fetch(id ? '/api/services/' + id : '/api/services', {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    serviceModal.classList.remove('open');
    loadServices();
  } else {
    const data = await res.json();
    errorEl.textContent = data.error || 'Could not save service';
  }
};

// ===== Pages (About + Contact) =====
async function loadPagesTab() {
  const res = await fetch('/api/settings');
  const s = await res.json();
  document.getElementById('setAboutTitle').value = s.aboutTitle || '';
  document.getElementById('setAboutBody').value = s.aboutBody || '';
  document.getElementById('setContactEmail').value = s.contactEmail || '';
  document.getElementById('setContactPhone').value = s.contactPhone || '';
  document.getElementById('setContactAddress').value = s.contactAddress || '';
  renderImagePreview('aboutImagePreviewWrap', s.aboutImage || '');
}

document.getElementById('uploadAboutImageBtn').onclick = async () => {
  const fileInput = document.getElementById('aboutImageFile');
  if (!fileInput.files.length) return;
  try {
    const url = await uploadImageGeneric(fileInput.files[0]);
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aboutImage: url })
    });
    renderImagePreview('aboutImagePreviewWrap', url);
    fileInput.value = '';
  } catch (err) {
    alert(err.message);
  }
};

document.getElementById('removeAboutImageBtn').onclick = async () => {
  await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aboutImage: '' })
  });
  renderImagePreview('aboutImagePreviewWrap', '');
};

document.getElementById('saveAboutBtn').onclick = async () => {
  await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      aboutTitle: document.getElementById('setAboutTitle').value.trim(),
      aboutBody: document.getElementById('setAboutBody').value.trim()
    })
  });
  const msgEl = document.getElementById('aboutMsg');
  msgEl.textContent = 'Saved!';
  setTimeout(() => msgEl.textContent = '', 2000);
};

document.getElementById('saveContactBtn').onclick = async () => {
  await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contactEmail: document.getElementById('setContactEmail').value.trim(),
      contactPhone: document.getElementById('setContactPhone').value.trim(),
      contactAddress: document.getElementById('setContactAddress').value.trim()
    })
  });
  const msgEl = document.getElementById('contactMsg');
  msgEl.textContent = 'Saved!';
  setTimeout(() => msgEl.textContent = '', 2000);
};

// ===== Settings =====
async function loadSettings() {
  const res = await fetch('/api/settings');
  const s = await res.json();
  document.getElementById('setStoreName').value = s.storeName;
  document.getElementById('setWhatsapp').value = s.whatsappNumber;
  document.getElementById('setPrimaryColor').value = s.primaryColor || '#3F5D4E';
  document.getElementById('setAccentColor').value = s.accentColor || '#B8863B';
  document.getElementById('setHeaderColor').value = s.headerColor || '#FBFAF6';
  renderLogoPreview(s.logoUrl);
  renderHeroPreview(s.heroUrl);
}

function renderLogoPreview(logoUrl) {
  const wrap = document.getElementById('logoPreviewWrap');
  wrap.innerHTML = logoUrl
    ? `<img src="${logoUrl}" style="height:48px;display:block">`
    : `<span style="color:var(--ink-soft);font-size:13px">No logo uploaded yet — your store name text will show instead.</span>`;
}

const HERO_VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;
function renderHeroPreview(heroUrl) {
  const wrap = document.getElementById('heroPreviewWrap');
  if (!heroUrl) {
    wrap.innerHTML = `<span style="color:var(--ink-soft);font-size:13px">No banner uploaded yet — the homepage shows a plain color background instead.</span>`;
    return;
  }
  wrap.innerHTML = HERO_VIDEO_EXT.test(heroUrl)
    ? `<video src="${heroUrl}" style="width:100%;max-width:320px;border-radius:8px" controls muted></video>`
    : `<img src="${heroUrl}" style="width:100%;max-width:320px;border-radius:8px;display:block">`;
}

document.getElementById('uploadLogoBtn').onclick = async () => {
  const fileInput = document.getElementById('logoFile');
  const msgEl = document.getElementById('logoMsg');
  if (!fileInput.files.length) {
    msgEl.style.color = 'var(--danger)';
    msgEl.textContent = 'Choose an image file first.';
    return;
  }
  const formData = new FormData();
  formData.append('logo', fileInput.files[0]);
  const res = await fetch('/api/settings/logo', { method: 'POST', body: formData });
  const data = await res.json();
  if (res.ok) {
    msgEl.style.color = 'var(--success)';
    msgEl.textContent = 'Logo updated!';
    renderLogoPreview(data.logoUrl);
    fileInput.value = '';
  } else {
    msgEl.style.color = 'var(--danger)';
    msgEl.textContent = data.error || 'Could not upload logo.';
  }
};

document.getElementById('removeLogoBtn').onclick = async () => {
  await fetch('/api/settings/logo', { method: 'DELETE' });
  renderLogoPreview('');
  document.getElementById('logoMsg').textContent = 'Logo removed.';
};

document.getElementById('uploadHeroBtn').onclick = async () => {
  const fileInput = document.getElementById('heroFile');
  const msgEl = document.getElementById('heroMsg');
  if (!fileInput.files.length) {
    msgEl.style.color = 'var(--danger)';
    msgEl.textContent = 'Choose a photo or video first.';
    return;
  }
  msgEl.style.color = 'var(--ink-soft)';
  msgEl.textContent = 'Uploading… this can take a moment for videos.';
  const formData = new FormData();
  formData.append('hero', fileInput.files[0]);
  const res = await fetch('/api/settings/hero', { method: 'POST', body: formData });
  const data = await res.json();
  if (res.ok) {
    msgEl.style.color = 'var(--success)';
    msgEl.textContent = 'Hero banner updated!';
    renderHeroPreview(data.heroUrl);
    fileInput.value = '';
  } else {
    msgEl.style.color = 'var(--danger)';
    msgEl.textContent = data.error || 'Could not upload banner.';
  }
};

document.getElementById('removeHeroBtn').onclick = async () => {
  await fetch('/api/settings/hero', { method: 'DELETE' });
  renderHeroPreview('');
  document.getElementById('heroMsg').textContent = 'Banner removed.';
};

document.getElementById('saveSettingsBtn').onclick = async () => {
  await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      storeName: document.getElementById('setStoreName').value.trim(),
      whatsappNumber: document.getElementById('setWhatsapp').value.trim(),
      primaryColor: document.getElementById('setPrimaryColor').value,
      accentColor: document.getElementById('setAccentColor').value,
      headerColor: document.getElementById('setHeaderColor').value
    })
  });
  document.getElementById('settingsMsg').textContent = 'Saved!';
  setTimeout(() => document.getElementById('settingsMsg').textContent = '', 2000);
};
document.getElementById('changePassBtn').onclick = async () => {
  const newPassword = document.getElementById('newPassword').value;
  const res = await fetch('/api/settings/password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ newPassword })
  });
  const msgEl = document.getElementById('passMsg');
  if (res.ok) {
    msgEl.style.color = 'var(--success)';
    msgEl.textContent = 'Password updated.';
    document.getElementById('newPassword').value = '';
  } else {
    const data = await res.json();
    msgEl.style.color = 'var(--danger)';
    msgEl.textContent = data.error;
  }
};

checkSession();
