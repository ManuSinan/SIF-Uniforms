import prisma from "@/lib/db/prisma";

export interface SendOtpParams {
  mobile: string;
  otp: string;
}

export interface SendOrderUpdateParams {
  mobile: string;
  orderNo: string;
  status: string;
  schoolName: string;
  trackingUrl: string;
  /** Extra line for the "updated" template, e.g. a balance to pay */
  note?: string;
  orderId?: number;
  studentName?: string;
}

type Mode = "dev" | "meta";

/**
 * "dev": messages are printed to the server console and logged, nothing leaves the machine.
 * "meta": WhatsApp Business Cloud API. Dev mode is refused in production so OTPs can't be guessed.
 */
export function whatsappMode(): Mode {
  const mode = (process.env.WHATSAPP_MODE || "dev").toLowerCase();
  if (mode === "meta") return "meta";
  return "dev";
}

const STATUS_LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  updated: "Updated",
};

async function log(entry: { mobile: string; template: string; status: string; orderId?: number; messageId?: string; error?: string }) {
  try {
    await prisma.whatsappLog.create({
      data: {
        mobile: entry.mobile,
        template: entry.template,
        status: entry.status,
        order_id: entry.orderId ?? null,
        provider_message_id: entry.messageId ?? null,
        error: entry.error?.slice(0, 190) ?? null,
      },
    });
  } catch (err) {
    console.error("Failed to write whatsapp log", err);
  }
}

/** Sends an approved template via the Cloud API. Template names/params follow docs/whatsapp-templates.md. */
async function sendTemplate(
  mobile: string,
  template: string,
  bodyParams: string[],
  button?: { type: "url" | "copy_code"; value: string }
): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) return { ok: false, error: "WhatsApp Cloud API credentials missing" };

  const components: any[] = [
    { type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) },
  ];
  if (button) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: [{ type: "text", text: button.value }],
    });
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: `91${mobile}`,
        type: "template",
        template: { name: template, language: { code: "en_US" }, components },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
    return { ok: true, messageId: data?.messages?.[0]?.id };
  } catch (err: any) {
    return { ok: false, error: err.message || "Network error" };
  }
}

export async function sendWhatsAppOtp({ mobile, otp }: SendOtpParams): Promise<boolean> {
  const mode = whatsappMode();

  if (mode === "dev") {
    console.log(`\n📱 [WHATSAPP OTP · DEV] To: ${mobile} · Code: ${otp} (valid 5 minutes)\n`);
    await log({ mobile, template: "otp_verification", status: "sent", messageId: `dev_${Date.now()}` });
    return true;
  }

  // Authentication templates take the code as body param and as the copy-code button value.
  const result = await sendTemplate(mobile, "otp_login", [otp], { type: "copy_code", value: otp });
  await log({ mobile, template: "otp_verification", status: result.ok ? "sent" : "failed", messageId: result.messageId, error: result.error });
  return result.ok;
}

export async function sendWhatsAppOrderUpdate({
  mobile,
  orderNo,
  status,
  schoolName,
  trackingUrl,
  note,
  orderId,
  studentName,
}: SendOrderUpdateParams): Promise<boolean> {
  const mode = whatsappMode();
  const label = STATUS_LABELS[status] || status;

  if (mode === "dev") {
    console.log(`\n📦 [WHATSAPP ORDER · DEV] To: ${mobile} · #${orderNo} (${schoolName}) is ${label}${note ? ` · ${note}` : ""} · ${trackingUrl}\n`);
    await log({ mobile, template: `order_status_${status}`, status: "sent", orderId, messageId: `dev_${Date.now()}` });
    return true;
  }

  // The tracking button URL is registered as https://<domain>/t/{{1}}, so only the token is sent.
  const token = trackingUrl.split("/t/")[1] || "";
  const result = await sendTemplate(
    mobile,
    "order_status_update",
    // order_status_update: {{1}} order no, {{2}} student, {{3}} school, {{4}} status
    [orderNo, studentName || "your child", schoolName, note ? `${label}. ${note}` : label],
    { type: "url", value: token }
  );
  await log({ mobile, template: `order_status_${status}`, status: result.ok ? "sent" : "failed", orderId, messageId: result.messageId, error: result.error });
  return result.ok;
}
