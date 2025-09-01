-- AlterTable
ALTER TABLE "Agent" ADD COLUMN "iaoSuccessChecked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "iaoSuccessful" BOOLEAN,
ADD COLUMN "iaoSuccessCheckTime" TIMESTAMP(3); 