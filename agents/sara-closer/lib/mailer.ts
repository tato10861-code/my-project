// Sends transactional email through Resend's HTTP API.
// Configure RESEND_API_KEY and MAIL_FROM (a sender on a verified domain).

export type SendResult = { ok: true } | { ok: false; error: string };

export async function sendEmail(to: string, subject: string, text: string): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY and MAIL_FROM are missing)." };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text }),
    });
    if (!res.ok) return { ok: false, error: `Email provider returned HTTP ${res.status}.` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `Email request failed: ${err instanceof Error ? err.message : "unknown error"}.` };
  }
}
