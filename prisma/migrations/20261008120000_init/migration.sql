-- Runs as entropy_app with search_path = entropy (schema=entropy in the URL):
-- every object below is created in the "entropy" schema, which that role owns.

-- CreateTable
CREATE TABLE "draws" (
    "draw_id" UUID NOT NULL,
    "logto_user_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "bytes" INTEGER NOT NULL,
    "cost_tokens" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "failure_reason" TEXT,
    "egress_request_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "delivered_at" TIMESTAMP(3),
    "settled_at" TIMESTAMP(3),

    CONSTRAINT "draws_pkey" PRIMARY KEY ("draw_id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "request_id" TEXT NOT NULL,
    "draw_id" UUID NOT NULL,
    "logto_user_id" TEXT NOT NULL,
    "signed_json" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "policy" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "contributing_sources" TEXT[],
    "output_bytes" INTEGER NOT NULL,
    "signature_alg" TEXT NOT NULL,
    "timestamp_unix_ns" BIGINT NOT NULL,
    "signing_key_fingerprint" TEXT,
    "verified_at_save" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("request_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "draws_egress_request_id_key" ON "draws"("egress_request_id");

-- CreateIndex
CREATE INDEX "draws_logto_user_id_created_at_idx" ON "draws"("logto_user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "receipts_draw_id_key" ON "receipts"("draw_id");

-- CreateIndex
CREATE INDEX "receipts_logto_user_id_created_at_idx" ON "receipts"("logto_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "receipts_logto_user_id_mode_created_at_idx" ON "receipts"("logto_user_id", "mode", "created_at" DESC);

-- CreateIndex
CREATE INDEX "receipts_logto_user_id_pool_id_created_at_idx" ON "receipts"("logto_user_id", "pool_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_draw_id_fkey" FOREIGN KEY ("draw_id") REFERENCES "draws"("draw_id") ON DELETE RESTRICT ON UPDATE CASCADE;

