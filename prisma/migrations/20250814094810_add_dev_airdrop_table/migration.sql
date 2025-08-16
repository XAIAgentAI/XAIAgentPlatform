-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "nftTokenId" TEXT;

-- CreateTable
CREATE TABLE "DevAirdropRecord" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "description" TEXT,
    "transactionHash" TEXT,
    "blockNumber" BIGINT,
    "gasUsed" TEXT,
    "status" TEXT NOT NULL,
    "environment" TEXT NOT NULL DEFAULT 'development',
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevAirdropRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DevAirdropRecord_walletAddress_idx" ON "DevAirdropRecord"("walletAddress");

-- CreateIndex
CREATE INDEX "DevAirdropRecord_tokenType_idx" ON "DevAirdropRecord"("tokenType");

-- CreateIndex
CREATE INDEX "DevAirdropRecord_status_idx" ON "DevAirdropRecord"("status");

-- CreateIndex
CREATE INDEX "DevAirdropRecord_createdAt_idx" ON "DevAirdropRecord"("createdAt");

-- CreateIndex
CREATE INDEX "DevAirdropRecord_environment_idx" ON "DevAirdropRecord"("environment");
