CREATE TABLE IF NOT EXISTS "BillingAccount" (
  "userId" uuid PRIMARY KEY NOT NULL REFERENCES "User"("id"),
  "stripeCustomerId" varchar(255) NOT NULL,
  "stripeSubscriptionId" varchar(255),
  "plan" varchar(16),
  "status" varchar(32) DEFAULT 'none' NOT NULL,
  "currentPeriodStart" timestamp,
  "currentPeriodEnd" timestamp,
  "updatedAt" timestamp DEFAULT now() NOT NULL
);
