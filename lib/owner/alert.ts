export async function ownerAlert(body: {
  email?: string;
  kind: "signup" | "subscribe";
  plan?: string;
}) {
  const url = process.env.OWNER_ALERT_URL?.trim();
  const secret = process.env.OWNER_ALERT_SECRET?.trim();
  if (!url || !secret) {
    return;
  }
  await fetch(url, {
    body: JSON.stringify({ ...body, secret }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
    signal: AbortSignal.timeout(4000),
  }).catch(() => undefined);
}
