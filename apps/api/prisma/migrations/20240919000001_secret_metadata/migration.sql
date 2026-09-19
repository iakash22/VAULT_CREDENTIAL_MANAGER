-- CreateEnum
CREATE TYPE "SecretType" AS ENUM ('password', 'ssh', 'token', 'env');

-- AlterTable
ALTER TABLE "secrets" ADD COLUMN "secret_type" "SecretType" NOT NULL DEFAULT 'password';
ALTER TABLE "secrets" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Untitled';
ALTER TABLE "secrets" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Remove defaults after backfill (optional for clean schema)
ALTER TABLE "secrets" ALTER COLUMN "secret_type" DROP DEFAULT;
ALTER TABLE "secrets" ALTER COLUMN "title" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "secrets_user_id_secret_type_idx" ON "secrets"("user_id", "secret_type");
CREATE INDEX "secrets_title_idx" ON "secrets"("title");
CREATE INDEX "secrets_tags_gin_idx" ON "secrets" USING GIN ("tags");
