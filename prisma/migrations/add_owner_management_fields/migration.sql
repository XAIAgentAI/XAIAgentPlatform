-- 添加Owner管理相关状态字段到Agent表
-- Migration: add_owner_management_fields

-- 添加新字段
ALTER TABLE "Agent" ADD COLUMN "ownerTransferred" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agent" ADD COLUMN "liquidityAdded" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agent" ADD COLUMN "tokensBurned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Agent" ADD COLUMN "miningOwnerTransferred" BOOLEAN NOT NULL DEFAULT false;

-- 添加注释说明字段用途
COMMENT ON COLUMN "Agent"."ownerTransferred" IS '代币合约owner是否已转移给项目方';
COMMENT ON COLUMN "Agent"."liquidityAdded" IS '是否已添加流动性到DBCSwap';
COMMENT ON COLUMN "Agent"."tokensBurned" IS '是否已销毁5%的XAA代币';
COMMENT ON COLUMN "Agent"."miningOwnerTransferred" IS '挖矿合约owner是否已转移给项目方';
