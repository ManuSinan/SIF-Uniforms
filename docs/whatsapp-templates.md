> **Currently used by the code** (`src/lib/whatsapp/service.ts`): `otp_login` for login codes and `order_status_update` for every order event (placed, confirmed, packed, out for delivery, delivered, cancelled, updated). The status text goes in `{{4}}`; when a change leaves a balance to pay, it's appended there ("Updated. Balance to pay: ₹50"). The richer per-event templates below can replace it later.

# WhatsApp Business Cloud API Templates

All templates use single-line variable interpolation formatted according to Meta WhatsApp Cloud API specifications.

---

### 1. `otp_login`
- **Category:** `AUTHENTICATION`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Your SchoolFit verification code is {{1}}. This OTP is valid for 5 minutes. Do not share it with anyone.
  ```
- **Variables:**
  - `{{1}}`: 6-digit OTP code (e.g. `123456`)
- **Buttons:**
  - `URL` button: `Copy Code`

---

### 2. `order_confirmed`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Hello, your uniform order {{1}} for {{2}} (Class {{3}}) at {{4}} has been placed successfully! Items: {{5}}. Total Paid: {{6}}. Delivery Address: {{7}}. Delivery Charge: {{8}}. Track your live order status below:
  ```
- **Variables:**
  - `{{1}}`: Order Number (e.g. `SXHS-2610-1042`)
  - `{{2}}`: Student Name (e.g. `Aarav Sharma`)
  - `{{3}}`: Class & Section (e.g. `4-A`)
  - `{{4}}`: School Name (e.g. `St. Xavier's High School`)
  - `{{5}}`: Single-line Item List (e.g. `Sky Blue Shirt-30 x2, Navy Shorts-26 x2, Tie x1`)
  - `{{6}}`: Grand Total (e.g. `₹2,240`)
  - `{{7}}`: Short Address (e.g. `#102, Palm Heights, Bengaluru 560025`)
  - `{{8}}`: Delivery Fee (e.g. `₹100` or `Free`)
- **Buttons:**
  - `URL` button: `Track Order` (`https://{{domain}}/t/{{token}}`)

---

### 3. `order_updated`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Your uniform order {{1}} for {{2}} at {{3}} has been updated. Updated items: {{4}}. Revised total: {{5}}. Reason: {{6}}. Track your updated order details:
  ```
- **Variables:**
  - `{{1}}`: Order Number
  - `{{2}}`: Student Name
  - `{{3}}`: School Name
  - `{{4}}`: Revised Item Summary
  - `{{5}}`: Revised Total Amount
  - `{{6}}`: Edit Reason
- **Buttons:**
  - `URL` button: `Track Order` (`https://{{domain}}/t/{{token}}`)

---

### 4. `order_status_update`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Status Update: Your order {{1}} for {{2}} at {{3}} is now {{4}}. We are preparing your package for dispatch. Track status:
  ```
- **Variables:**
  - `{{1}}`: Order Number
  - `{{2}}`: Student Name
  - `{{3}}`: School Name
  - `{{4}}`: New Status (`Confirmed` / `Packed`)
- **Buttons:**
  - `URL` button: `Track Order` (`https://{{domain}}/t/{{token}}`)

---

### 5. `order_out_for_delivery`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Great news! Your uniform order {{1}} for {{2}} has been dispatched. Courier: {{3}} (Ph: {{4}}), Tracking Ref: {{5}}. Track live delivery status:
  ```
- **Variables:**
  - `{{1}}`: Order Number
  - `{{2}}`: Student Name
  - `{{3}}`: Courier Partner Name (e.g. `BlueDart`)
  - `{{4}}`: Courier Contact Phone (e.g. `+91 9876543210`)
  - `{{5}}`: Courier AWB / Tracking Number
- **Buttons:**
  - `URL` button: `Track Order` (`https://{{domain}}/t/{{token}}`)

---

### 6. `order_delivered`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Your uniform order {{1}} for {{2}} at {{3}} has been delivered to your address. Thank you for ordering with SchoolFit! View delivery receipt:
  ```
- **Variables:**
  - `{{1}}`: Order Number
  - `{{2}}`: Student Name
  - `{{3}}`: School Name
- **Buttons:**
  - `URL` button: `View Receipt` (`https://{{domain}}/t/{{token}}`)

---

### 7. `order_cancelled`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Your uniform order {{1}} for {{2}} at {{3}} has been cancelled. Refund status: {{4}} (Amount: {{5}}). Reason: {{6}}.
  ```
- **Variables:**
  - `{{1}}`: Order Number
  - `{{2}}`: Student Name
  - `{{3}}`: School Name
  - `{{4}}`: Refund Status (e.g. `Processed to original payment method` / `Under review`)
  - `{{5}}`: Refund Amount (e.g. `₹2,240`)
  - `{{6}}`: Cancellation Reason

---

### 8. `refund_processed`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Refund Confirmation: A refund of {{1}} for order {{2}} has been successfully initiated via Razorpay (Ref: {{3}}). It will reflect in your account within 5-7 business days.
  ```
- **Variables:**
  - `{{1}}`: Refund Amount
  - `{{2}}`: Order Number
  - `{{3}}`: Razorpay Refund ID

---

### 9. `change_request_update`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Update on your change request for order {{1}}: Your request has been {{2}} by {{3}}. Note: {{4}}. View updated order:
  ```
- **Variables:**
  - `{{1}}`: Order Number
  - `{{2}}`: Status (`Approved` / `Rejected`)
  - `{{3}}`: School Name / Admin
  - `{{4}}`: Admin Response Note
- **Buttons:**
  - `URL` button: `Track Order` (`https://{{domain}}/t/{{token}}`)

---

### 10. `school_admin_welcome`
- **Category:** `UTILITY`
- **Language:** `en_US`
- **Body Text:**
  ```text
  Welcome to SchoolFit! You have been assigned as the School Admin for {{1}}. Access your dashboard to manage uniforms, packing, and orders: {{2}}
  ```
- **Variables:**
  - `{{1}}`: School Name
  - `{{2}}`: Login URL (e.g. `https://schoolfit.app/login`)
