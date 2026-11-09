-- Back-channel logout: OIDC session ids Logto reported as ended (see
-- lib/logto/backchannel-logout.ts). A cookie still carrying one of these sids
-- reads as signed out.

-- CreateTable
CREATE TABLE "revoked_logto_sessions" (
    "sid" TEXT NOT NULL,
    "revoked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revoked_logto_sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "revoked_logto_sessions_expires_at_idx" ON "revoked_logto_sessions"("expires_at");

