-- Developer API draws: where each draw came from ("web" or "api") and, for
-- API draws, the prefix of the Light Rider API key used (the key itself lives
-- in cloud's ApiKey table, one per customer).

-- AlterTable
ALTER TABLE "draws" ADD COLUMN     "api_key_prefix" TEXT,
ADD COLUMN     "channel" TEXT NOT NULL DEFAULT 'web';
