
# XAANFTStaking 合约接口文档

## 概述
`XAANFTStaking` 是一个支持 ERC1155 NFT 质押并赚取 ERC20 代币奖励的智能合约。合约提供以下核心功能：
-  NFT 质押（支持不同质押周期和奖励配置）
- ERC20 奖励计算与提取
- 升级安全机制（UUPS 代理模式）
- 重入攻击防护

## 目录
1. [核心功能](#核心功能)
    - [质押](#质押)
    - [提取奖励](#提取奖励)
    - [待领取奖励查询](#待领取奖励查询)
2. [数据结构](#数据结构)
3. [事件](#事件)

---

## 合约初始化

### `initialize`
```solidity

核心功能:
质押:

function stake(uint256 tokenId, uint256 amount) external nonReentrant
‌功能‌:
质押 ERC1155 NFT

‌参数‌:
参数名	类型	说明
tokenId	uint256	要质押的 NFT 类型 ID
amount	uint256	质押数量

‌触发事件‌:
Staked(address user, uint256 tokenId, uint256 amount)



提取奖励:

function withdrawReward(uint256 tokenId, uint256 stakeIndex) external nonReentrant
‌功能‌:
提取指定质押记录的累积奖励

‌参数‌:
参数名	类型	说明
tokenId	uint256	质押的 NFT 类型 ID
stakeIndex	uint256	质押记录索引（用户维度）

‌触发事件‌:
WithdrawnReward(address user, uint256 tokenId, uint256 reward)





待领取奖励查询:

function pendingReward(address user, uint256 stakeIndex) public view returns (uint256)
‌功能‌:
计算指定质押记录的待领取奖励

‌参数‌:
参数名	类型	说明
user	address	用户地址
stakeIndex	uint256	质押记录索引
‌返回值‌:

类型	说明
uint256	待领取奖励（wei）
‌计算逻辑‌:

奖励 = (当前时间 - 质押时间) / 质押周期 * 单个周期奖励 * 质押数量

数据结构:

struct TokenConfig {
    uint256 duration;    // 质押周期（秒）
    uint256 rewardAmount;// 单个 NFT 每周期奖励（wei）
}
‌存储位置‌:
tokenConfigs[tokenId]

struct Stake {
    uint256 tokenId;     // NFT 类型 ID
    uint256 amount;      // 质押数量
    uint256 stakedAt;    // 质押时间戳
    uint256 claimed;     // 已领取奖励累计
}
‌存储结构‌:
stakes[userAddress][]Stake - 按用户地址存储质押记录数组

事件:
事件名称	参数	说明
Staked	(address user, uint256 tokenId, uint256 amount)	NFT 质押成功时触发
WithdrawnReward	(address user, uint256 tokenId, uint256 reward)	奖励提取成功时触发
Unstaked	(address user, uint256 tokenId, uint256 amount)	NFT 解除质押时触发

> 注意：实际部署时需确认以下参数：
> 1. ERC1155 和 ERC20 合约地址
> 2. 质押周期配置（秒）
> 3. 基础奖励参数（需考虑代币精度）