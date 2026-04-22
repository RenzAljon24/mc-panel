-- AlterTable
ALTER TABLE "Server" ADD COLUMN "restartRequired" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Plugin" ADD COLUMN "filename" TEXT;
