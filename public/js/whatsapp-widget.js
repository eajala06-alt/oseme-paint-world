(function () {
  const FAQ = [
    { keys: ['delivery', 'shipping', 'deliver'], answer: 'We typically deliver within 2–5 business days depending on your location.' },
    { keys: ['payment', 'pay', 'card'], answer: 'We accept card, bank transfer and USSD, all securely processed via Paystack.' },
    { keys: ['return', 'refund', 'exchange'], answer: 'Items can be returned within 7 days if unused and in original packaging.' },
    { keys: ['track', 'order status', 'where is my order'], answer: 'You\u2019ll receive updates by email. For a live update, tap "Talk to a human" below.' },
    { keys: ['hours', 'open', 'time'], answer: 'Our team replies on WhatsApp Mon\u2013Sat, 9am\u20136pm.' }
  ];

  const fab = document.getElementById('waFab');
  const panel = document.getElementById('waPanel');
  const closeBtn = document.getElementById('waClose');
  const body = document.getElementById('waBody');
  const humanLink = document.getElementById('waHumanLink');

  let waNumber = '2348000000000';

  fetch('/api/settings').then(r => r.json()).then(s => {
    waNumber = (s.whatsappNumber || waNumber).replace(/\D/g, '');
    humanLink.href = `https://wa.me/${waNumber}?text=${encodeURIComponent('Hi! I need help with an order.')}`;
  });

  function addMessage(text) {
    const div = document.createElement('div');
    div.className = 'wa-msg';
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  function renderQuickReplies() {
    const wrap = document.createElement('div');
    wrap.className = 'wa-quick';
    ['Delivery time?', 'Payment options?', 'Returns policy?', 'Talk to a human'].forEach(label => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.onclick = () => handleQuery(label);
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
  }

  function handleQuery(text) {
    if (/human/i.test(text)) {
      addMessage('Opening WhatsApp so you can chat with our team directly…');
      window.open(humanLink.href, '_blank');
      return;
    }
    const lower = text.toLowerCase();
    const match = FAQ.find(f => f.keys.some(k => lower.includes(k)));
    addMessage(match ? match.answer : "I couldn't find an answer to that automatically \u2014 tap \u201cTalk to a human\u201d below and our team will help.");
  }

  fab.onclick = () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !body.dataset.greeted) {
      body.dataset.greeted = '1';
      addMessage('Hi \ud83d\udc4b Ask me about delivery, payment or returns \u2014 or talk to a real person anytime.');
      renderQuickReplies();
    }
  };
  closeBtn.onclick = () => panel.classList.remove('open');
})();
