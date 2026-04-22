type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

// ### keep provider-specific email delivery behind one helper
export async function sendEmail(payload: EmailPayload) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ALERT_FROM_EMAIL");

  if (!resendApiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or ALERT_FROM_EMAIL for email delivery.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}
