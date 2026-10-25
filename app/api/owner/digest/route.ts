import { ownerPulse } from "@/lib/db/queries";
import { startOfPacificDay } from "@/lib/owner/pacific-day";

export async function GET(request: Request) {
  const secret = process.env.OWNER_ALERT_SECRET?.trim();
  if (!secret || request.headers.get("x-owner-secret") !== secret) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const pulse = await ownerPulse(startOfPacificDay());
  let gatewayBalance: number | null = null;
  let gatewayStatus = "no-token";
  // Next inlines process.env.VERCEL_OIDC_TOKEN at build time, before the runtime token exists.
  // biome-ignore lint/complexity/useLiteralKeys: keep the runtime lookup
  const env = process["env"] as Record<string, string | undefined>;
  const context = (
    globalThis as unknown as Record<
      symbol,
      { get?: () => { headers?: Record<string, string> } } | undefined
    >
  )[Symbol.for("@vercel/request-context")]?.get?.();
  const token = (
    context?.headers?.["x-vercel-oidc-token"] ||
    request.headers.get("x-vercel-oidc-token") ||
    env.VERCEL_OIDC_TOKEN ||
    ""
  ).trim();
  if (token) {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/credits", {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => null);
    gatewayStatus = response ? String(response.status) : "network";
    if (response?.ok) {
      const body = (await response.json()) as { balance?: string };
      const balance = Number(body.balance);
      gatewayBalance = Number.isFinite(balance) ? balance : null;
      if (gatewayBalance === null) {
        gatewayStatus = "unreadable";
      }
    }
  }
  return Response.json({ ...pulse, gatewayBalance, gatewayStatus });
}
