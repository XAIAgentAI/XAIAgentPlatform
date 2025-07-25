/*
  Warnings:

  - You are about to drop the column `token` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the `History` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_agentId_fkey";

-- AlterTable
ALTER TABLE "Agent" DROP COLUMN "token",
ADD COLUMN     "iaoContractAddress" TEXT,
ADD COLUMN     "iaoContractAddressTestnet" TEXT,
ADD COLUMN     "iaoEndTime" BIGINT,
ADD COLUMN     "iaoStartTime" BIGINT,
ADD COLUMN     "iaoTokenAmount" DECIMAL(65,30),
ADD COLUMN     "initialLiquidityAmount" DECIMAL(65,30),
ADD COLUMN     "initialXaaAmount" DECIMAL(65,30),
ADD COLUMN     "marketCapTokenNumber" DECIMAL(65,30),
ADD COLUMN     "miningRate" DECIMAL(65,30),
ADD COLUMN     "poolAddress" TEXT,
ADD COLUMN     "poolCreated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "projectDescription" TEXT,
ADD COLUMN     "tokenAddress" TEXT,
ADD COLUMN     "tokenAddressTestnet" TEXT,
ADD COLUMN     "tokensDistributed" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "History";

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "chat" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "result" TEXT,
    "agentId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Count" (
    "project" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "Count_pkey" PRIMARY KEY ("project")
);

-- CreateTable
CREATE TABLE "chat" (
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "chat" JSONB NOT NULL,

    CONSTRAINT "chat_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "TokenList" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "logoURI" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "keywords" TEXT,
    "version" JSONB NOT NULL,

    CONSTRAINT "TokenList_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_name_key" ON "Chat"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TokenList_address_key" ON "TokenList"("address");

-- CreateIndex
CREATE UNIQUE INDEX "TokenList_agentId_key" ON "TokenList"("agentId");

-- CreateIndex
CREATE INDEX "TokenList_isActive_idx" ON "TokenList"("isActive");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenList" ADD CONSTRAINT "TokenList_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
