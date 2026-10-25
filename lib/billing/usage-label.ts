export const USAGE_SHOW_AFTER_MICRO = 95_000_000;
export const USAGE_DISPLAY_FLOOR_MICRO = 100_000_000;

export function unlimitedUsageLabel({
  plan,
  spendMicro,
  status,
}: {
  plan: string | null;
  spendMicro: number | null;
  status: string | null;
}) {
  if (
    plan !== "unlimited" ||
    (status !== "active" && status !== "trialing") ||
    spendMicro === null ||
    spendMicro <= USAGE_SHOW_AFTER_MICRO
  ) {
    return "";
  }
  const shown = Math.max(spendMicro, USAGE_DISPLAY_FLOOR_MICRO);
  return `This month ${new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(shown / 1_000_000)}`;
}
