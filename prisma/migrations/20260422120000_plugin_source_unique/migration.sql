-- DropIndex
DROP INDEX "Plugin_serverId_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "Plugin_serverId_source_slug_key" ON "Plugin"("serverId", "source", "slug");
