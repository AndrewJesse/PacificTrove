# Pacific Trove

Pacific Trove is the Oregon business chat at [pacifictrove.com](https://pacifictrove.com). A frontier model answers the question. Trove checks Oregon numbers beside that answer.

The warehouse behind those numbers is the separate `data-orb` repo. This repo is the website, the accounts, and the subscriptions.

## Plans

A new account can ask three questions. After that, checkout offers three plans:

- **$40** and **$100** include a model allowance and pause when it is used. Unused allowance does not roll over.
- **Unlimited** is $100 a month minimum. Prompting does not pause. Usage above $100 is added to the next invoice. The profile menu shows “This month” only on an active Unlimited plan, and only after model spend passes $95. The amount shown starts at $100.

Oregon has no sales tax. Checkout adds tax only where a Stripe registration is active. Cards are processed by Stripe. The live webhook is `https://pacifictrove.com/api/stripe/webhook`.

## Owner texts

Signup, a paid subscription, and a site outage send a text. A daily text goes out at noon Pacific with new accounts, questions asked, active plans, and the AI Gateway credit balance. The text warns when that balance is under $30.

The site posts those events to `OWNER_ALERT_URL`. The noon and health checks run in AWS Lambda `pacifictrove-alerts` in `us-west-2`. The digest route is `GET /api/owner/digest` with the header `x-owner-secret`. Nothing in this repo buys AI Gateway credits.

## Deploy

GitHub is not connected to Vercel. A push does not deploy. Production is:

```bash
npx vercel deploy --prod --yes --scope team_4xfzvWONVG30v98xc6BsdxPq
```

Environment variables live in the Vercel project `quietcode/pacifictrove`. Names are listed in [`.env.example`](.env.example). Do not commit `.env.local`.

## Local

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Unit tests:

```bash
pnpm exec tsx --test lib/ai/*.test.ts lib/billing/*.test.ts lib/owner/*.test.ts
```
