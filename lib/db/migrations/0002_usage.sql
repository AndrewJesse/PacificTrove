CREATE TABLE IF NOT EXISTS "UsageCharge" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" uuid NOT NULL REFERENCES "User"("id"),
  "modelId" varchar(128) NOT NULL,
  "costMicro" integer NOT NULL,
  "createdAt" timestamp DEFAULT now() NOT NULL
);
