import Stripe from "stripe";

let client: Stripe | null = null;

export function stripeSecret() {
  const apiKey = process.env.STRIPE_API?.trim();
  if (apiKey) {
    return apiKey;
  }
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

export function getStripe() {
  const key = stripeSecret();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}

export function integrationLabel() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const suffix = Array.from(
    { length: 8 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
  return `pacifictrove_subscribe_${suffix}`;
}
