# Oseme Paint World

A working e-commerce site for Oseme Paint World: storefront, cart, Paystack checkout, an admin dashboard to manage products/orders, and a WhatsApp chat widget with human handoff.

## What's included

- **Storefront** (`/`) — product catalog, category filters, cart drawer, checkout.
- **Payments** — Paystack (test mode by default). Card/bank/USSD handled by Paystack's popup, no card data ever touches your server.
- **Admin dashboard** (`/admin.html`) — password-protected. Add/edit/delete products, view and update order status, change store name/WhatsApp number/password.
- **WhatsApp widget** — a small chat bubble that answers common questions (delivery, payment, returns) and has a "Talk to a human" button that opens a real WhatsApp chat with your business number.
- **Data storage** — a simple JSON file database (`data/db.json`). No external database to set up for the MVP. (See "Growing past the MVP" below for when to upgrade this.)

## 1. Run it locally

You need [Node.js](https://nodejs.org) 18+ installed.

```bash
cd oseme-paint-world
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `ADMIN_PASSWORD` — the password you'll use to log into `/admin.html` the first time.
- `JWT_SECRET` — any long random string (the `.env.example` file shows a command to generate one).
- `PAYSTACK_PUBLIC_KEY` / `PAYSTACK_SECRET_KEY` — get these free from your [Paystack dashboard](https://dashboard.paystack.com/#/settings/developer). Start with the **test** keys (they start with `pk_test_` / `sk_test_`) so you can place test orders without real money.

Then:

```bash
npm start
```

- Storefront: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin.html (log in with `ADMIN_PASSWORD`)

Test payments with Paystack's [test cards](https://paystack.com/docs/payments/test-payments/) — e.g. card number `4084 0840 8408 4081`, any future date, CVV `408`, PIN `0000`, OTP `123456`.

## 2. Make it yours (all in the admin panel — no code editing needed)

Log into `/admin.html` → **Settings**:
- **Logo**: upload a PNG/JPG/SVG/WEBP (under 2MB) directly — no code, no image hosting needed. Remove it anytime to fall back to your store name as text.
- **Brand colors**: two color pickers — "Primary" (used for the header cart button, active filters) and "Accent" (used for price tags and the checkout button). Changes apply instantly across the storefront.
- **Store name & WhatsApp number**: same tab.

Products tab → add/edit/delete products, each with a name, price, stock, category, and image URL (paste a link — e.g. upload photos to [imgur.com](https://imgur.com) and use that link).

WhatsApp bot's automatic answers (delivery/payment/returns FAQ) are the one thing that still lives in code (`public/js/whatsapp-widget.js`) — ask me anytime and I'll update the wording for you.

## 3. Go live with real payments

1. In your Paystack dashboard, switch to **Live** mode and copy your live keys (`pk_live_...` / `sk_live_...`).
2. Complete Paystack's business verification (they'll ask for ID/bank details) — required before live payments pay out to your bank account.
3. Replace the test keys in your `.env` (or your hosting provider's environment variables) with the live keys.

## 4. Deploy so it's live on the internet — no code, no command line

This path uses only GitHub's and Railway's websites. You need the `oseme-paint-world` folder from the zip file, unzipped, on your computer.

### Step A — Put the project on GitHub
1. Go to **[github.com](https://github.com)** and create a free account (skip if you have one).
2. Click the **+** icon (top right) → **New repository**. Name it `oseme-paint-world`, keep it **Private** (recommended, since it'll temporarily hold your code) or Public, then click **Create repository**.
3. On the new repo's page, click **"uploading an existing file"** (a blue link in the middle of the page).
4. Open your `oseme-paint-world` folder in your file explorer, select **everything inside it** (not the folder itself — its contents), and drag them into the GitHub page.
   - Do **not** upload the `node_modules` folder if you see one (Railway installs this itself). If you followed the earlier local-setup guide you may also have a `.env` file — **do not upload that either**; it's meant to stay private, and Railway has its own place for those values (Step C below).
5. Scroll down, click **Commit changes**. Your code is now on GitHub.

### Step B — Connect Railway
1. Go to **[railway.app](https://railway.app)** and sign up (you can sign up with your GitHub account — this also makes the next step easier).
2. Click **New Project** → **Deploy from GitHub repo** → choose your `oseme-paint-world` repo.
3. Railway will detect it's a Node.js app and start building automatically. Let it run — it may fail the first time because it's missing settings (next step fixes that).

### Step C — Add your settings (the values from `.env`)
1. In your Railway project, click on the service card → the **Variables** tab.
2. Click **"New Variable"** and add each of these one at a time (same names and values you'd have put in `.env`):
   - `ADMIN_PASSWORD` → your chosen admin password
   - `JWT_SECRET` → any long random string
   - `PAYSTACK_PUBLIC_KEY` → from your Paystack dashboard
   - `PAYSTACK_SECRET_KEY` → from your Paystack dashboard
3. Railway automatically redeploys after you add variables. Wait for the build to show a green "Success."

### Step D — Get your live link
1. In your service, go to **Settings → Networking → Public Networking** and click **Generate Domain**.
2. Railway gives you a free link like `osemepaintworld-production.up.railway.app` — open it in your browser. That's your live storefront, published on the internet, right now.
3. Your admin dashboard is at the same link + `/admin.html`.

### Step E — Keep your data safe (important)
By default, Railway's filesystem can reset when you redeploy, which would erase your products/orders/logo. Attach a free **Volume** so they persist:
1. In your Railway service, go to the **Volumes** tab → **New Volume**.
2. Set the **mount path** to `/app/data` and create it. This keeps `data/db.json` (your products and orders) safe across deploys.
3. For the logo upload to also survive redeploys, add a second volume mounted at `/app/public/uploads`.

### Whenever you make future changes (like editing code, not admin settings)
Since admin-panel changes (products, logo, colors) are saved to the live server directly, you never need to touch GitHub for those — they take effect immediately. You'd only go back to GitHub if you (or I) change the actual code later; in that case, upload the changed files the same way (Step A, "uploading an existing file") and Railway redeploys automatically.

### When you're ready to add your custom domain
1. Buy your domain from any registrar (Namecheap, GoDaddy, etc.).
2. In Railway → your service → Settings → Networking → **Custom Domain** → enter your domain.
3. Railway gives you a CNAME record to add — go to your domain registrar's DNS settings and paste it in. It can take a few hours to a day to activate.

## 5. Growing past the MVP (optional, later)

This MVP intentionally keeps things simple so you can launch fast. When you're ready to scale:
- **Database**: swap the JSON file for a real database (Postgres is a common choice) once you have real order volume — the `db.js` file is the only place that would need rewriting.
- **WhatsApp**: the current widget links out to a real WhatsApp chat (true live handoff), but it can't yet auto-route messages *back* into an admin inbox or send automated order confirmations over WhatsApp. That needs the official WhatsApp Business API (via Meta directly or a provider like Twilio/360dialog), which requires business verification — happy to help wire that in once you're ready.
- **Emails**: add a transactional email service (e.g. Resend, SendGrid) to send real order-confirmation emails — right now the confirmation is shown on-screen only.
- **Image uploads**: currently products use image URLs; a direct upload button can be added later.

## Project structure

```
oseme-paint-world/
├── server.js            # Express app entry point
├── db.js                # JSON-file database + seed products
├── routes/
│   ├── auth.js           # Admin login/session
│   ├── products.js       # Product CRUD (public + admin)
│   ├── orders.js         # Checkout, Paystack init/verify, order management
│   └── settings.js       # Store name, WhatsApp number, admin password
├── public/
│   ├── index.html         # Storefront
│   ├── admin.html         # Admin dashboard
│   ├── order-success.html # Post-payment confirmation page
│   ├── css/               # Styles
│   └── js/                # Frontend logic (storefront, admin, WhatsApp widget)
└── data/db.json          # Your products/orders (auto-created on first run)
```
