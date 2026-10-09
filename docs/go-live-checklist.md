# SchoolFit Go-Live Checklist

This checklist covers all technical, infrastructure, and provider requirements for deploying SchoolFit to production.

---

### 1. Domain & Hosting
- [x] DNS configured: `sif.bluesparc.in` -> `157.245.110.230` (DigitalOcean Droplet).
- [ ] Provision production cloud server (Ubuntu 22.04/24.04 on DigitalOcean).
- [ ] Set up SSL certificates (`certbot --nginx -d sif.bluesparc.in -d www.sif.bluesparc.in`).
- [ ] Update `NEXT_PUBLIC_BASE_URL="https://sif.bluesparc.in"` in production `.env`.

---

### 2. Database & Backups
- [ ] Provision MySQL 8.0+ production instance (AWS RDS, PlanetScale, DigitalOcean Managed DB, etc.).
- [ ] Run production migrations: `npx prisma migrate deploy`.
- [ ] Run initial seed for Super Admin and onboarding schools.
- [ ] Configure automated daily MySQL backups with point-in-time recovery.

---

### 3. WhatsApp Business Cloud API
- [ ] Create a Meta for Developers account and register WhatsApp Business Cloud App.
- [ ] Connect official WhatsApp Business Phone Number.
- [ ] Submit all 10 templates from `docs/whatsapp-templates.md` to Meta for verification and approval.
- [ ] Set `WHATSAPP_MODE=live` in production `.env`.
- [ ] Set `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_BUSINESS_ACCOUNT_ID`.

---

### 4. Razorpay Payments & Webhooks
- [ ] Complete Razorpay KYC and activate Live Mode account.
- [ ] Generate Live Key ID and Secret Key; configure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.
- [ ] In Razorpay Dashboard > Webhooks, add endpoint `https://schoolfit.app/api/webhooks/razorpay`.
- [ ] Subscribe to events: `order.paid`, `payment.captured`, `payment.failed`, `refund.processed`.
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` in `.env`.

---

### 5. Media & Storage
- [ ] Change `STORAGE_DRIVER` from `local` to `s3` or `cloudinary` if using serverless hosting.
- [ ] Configure secure file size and extension checks for school logos and delivery proof images.

---

### 6. Scheduled Cron Jobs
- [ ] Set up a production cron job (via Cloudflare Workers Cron, AWS EventBridge, or cron daemon) to trigger:
  `POST https://schoolfit.app/api/cron/expire-orders`
  Header: `Authorization: Bearer <CRON_SECRET>` (every 5 minutes). Unpaid checkouts older than `ORDER_EXPIRY_MINUTES` (30) are cancelled and their items go back into the child's bag. Parents' own order pages also do this on load, so the cron is a backstop.

---

### 7. Security & Operations (must be set before launch)
- [ ] `SESSION_SECRET` set to a long random value. The app refuses to sign sessions in production without it.
- [ ] `WHATSAPP_MODE=meta` with `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_ACCESS_TOKEN`. `dev` mode (fixed test OTP) is refused in production.
- [ ] Templates `otp_login` (AUTHENTICATION, copy-code button) and `order_status_update` (4 body params + URL button `https://<domain>/t/{{1}}`) approved in Meta. See `whatsapp-templates.md`.
- [ ] Real Razorpay checkout + signature verification + webhook implemented. Until then `/api/payments/*` returns 503 in production (the instant mock payment only runs in development).
- [ ] Refunds: until Razorpay refunds are wired in, the platform team pays refunds manually and records the UTR in Super Admin → Orders → "Refunds to send".
- [ ] Apply `prisma/migrations_manual_2026-10-08.sql` to the production database (or `prisma db push`).
- [ ] Each school has filled its catalogue gaps (Super Admin → Catalogue → "Catalogue gaps").

---

### 8. Pilot Launch
- [ ] Conduct end-to-end pilot run with 1 partner school.
- [ ] Test mobile PWA install prompt on Android and iOS.
- [ ] Verify WhatsApp OTP delivery and Razorpay live settlement.
