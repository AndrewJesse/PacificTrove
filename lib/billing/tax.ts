import type Stripe from "stripe";

/** True only when Stripe Tax has a head office and at least one collecting registration. */
export async function collectsTax(stripe: Stripe) {
  try {
    const settings = await stripe.tax.settings.retrieve();
    if (settings.status !== "active") {
      return false;
    }
    const registrations = await stripe.tax.registrations.list({ limit: 100 });
    return registrations.data.some((item) => item.status === "active");
  } catch {
    return false;
  }
}

export async function checkoutTaxParams(stripe: Stripe) {
  if (!(await collectsTax(stripe))) {
    return {};
  }
  return {
    automatic_tax: { enabled: true as const },
    customer_update: {
      address: "auto" as const,
      name: "auto" as const,
    },
    tax_id_collection: { enabled: true },
  };
}
