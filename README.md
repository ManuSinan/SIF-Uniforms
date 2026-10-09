# SchoolFit: Multi-School Uniform Ordering PWA

A multi-tenant platform where schools have individual branded uniform stores. Parents order uniforms for their children with home delivery, authenticated via **WhatsApp OTP** and paid through **Razorpay**.

---

## 🌟 Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS + CSS Variables for runtime per-school branding
- **Database:** SQLite (local dev) / MySQL (production) + Prisma ORM
- **Authentication:** WhatsApp OTP + signed JWT session in httpOnly secure cookie
- **Payments:** Razorpay (Test mode with webhook verification)
- **WhatsApp:** Meta WhatsApp Business Cloud API with local `dev` mode
- **PWA:** Web App Manifest, Service Worker, and Offline fallback page

---

## 🚀 Step-by-Step Local Setup

### 1. Prerequisites
- **Node.js:** v18+ or v20+

### 2. Clone & Install Dependencies
```bash
git clone <repo-url>
cd uniform-pwa
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains your database connection:
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
SESSION_SECRET="your-super-secret-jwt-key-32-chars-min"
SUPER_ADMIN_MOBILE="9876543210"
WHATSAPP_MODE="dev"
WHATSAPP_TEST_OTP="123456"
RAZORPAY_KEY_ID="rzp_test_mockkey12345"
RAZORPAY_KEY_SECRET="rzp_test_secret12345"
RAZORPAY_WEBHOOK_SECRET="rzp_webhook_secret_test"
AUTO_REFUND="false"
STORAGE_DRIVER="local"
UPLOAD_DIR="./uploads"
CRON_SECRET="uniform-cron-secret-local-key"
```

### 4. Run Database Migrations and Seed
```bash
# Push schema
npx prisma db push

# Seed database with Super Admin, 2 demo schools, and master catalog
npx prisma db seed
# or: npm run seed
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing Per-School Dynamic Theming

Visit the seeded demo schools:
- **St. Xavier's High School (SXHS):** [http://localhost:3000/s/sxhs](http://localhost:3000/s/sxhs) (Deep Navy & Amber theme)
- **Greenwood International School (GWIS):** [http://localhost:3000/s/gwis](http://localhost:3000/s/gwis) (Forest Green & Coral theme)

---

## 🔗 Testing Razorpay Webhooks Locally

To test real webhook callbacks locally from Razorpay:
1. Start ngrok or Cloudflare Tunnel:
   ```bash
   ngrok http 3000
   ```
2. Copy the HTTPS forwarding URL (e.g. `https://xyz.ngrok-free.app`).
3. In your Razorpay Dashboard > Settings > Webhooks, add webhook URL:
   `https://xyz.ngrok-free.app/api/webhooks/razorpay`
4. Copy the secret you created into `RAZORPAY_WEBHOOK_SECRET` in `.env`.

---

## 📱 Testing PWA Install on Mobile

1. Run tunnel: `ngrok http 3000`
2. Open the tunnel HTTPS URL on an Android device in Chrome.
3. Tap the "Install SchoolFit" banner or browser menu > "Add to Home Screen".
4. On iOS Safari, tap "Share" > "Add to Home Screen".

---

## 📁 Project Structure

```
/prisma            schema.prisma, migrations, seed.ts
/src
  /app
    /(public)      login, register, /s/[schoolCode], /t/[token], offline
    /(parent)      home, child, cart, checkout, orders, profile
    /(school)      school-admin panel
    /(super)       super-admin panel
    /api           auth, orders, payments, webhooks, uploads, cron
  /lib
    /auth          session (JWT), OTP, guards
    /whatsapp      provider interface, dev + meta providers, templates
    /payments      razorpay client, webhook handler, refunds
    /orders        lifecycle, edit engine, stock, pricing
    /storage       local driver + interface
    /validation    Zod schemas
    /config        constants (lock rules, expiry), env loader
    /db            prisma client singleton
    /theme         dynamic CSS variable branding utilities
  /components      ui, theme, layout, tables/cards
  /tests           unit, integration, cross-school access
/docs              whatsapp-templates.md, go-live-checklist.md
/public            manifest, icons, service worker
```
