-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "change24h" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "holdersCount" INTEGER,
ADD COLUMN     "marketCap" TEXT NOT NULL DEFAULT '0',
ADD COLUMN     "socialLinks" TEXT,
ADD COLUMN     "token" TEXT,
ADD COLUMN     "tvl" TEXT,
ADD COLUMN     "type" TEXT,
ADD COLUMN     "volume24h" TEXT NOT NULL DEFAULT '0';

-- CreateTable
CREATE TABLE "AgentPrice" (
    "id" SERIAL NOT NULL,
    "agentId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentPrice_agentId_timestamp_idx" ON "AgentPrice"("agentId", "timestamp");

-- AddForeignKey
ALTER TABLE "AgentPrice" ADD CONSTRAINT "AgentPrice_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
