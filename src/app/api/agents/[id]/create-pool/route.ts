/**
 * 创建池子API端点
 * POST /api/agents/[id]/create-pool
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, createWalletClient, http, parseEther, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { currentChain } from '@/config/networks';
import { z } from 'zod';

// DBCSwap V3 合约地址配置
const DBCSWAP_V3_FACTORY = '0x34A7E09D8810d2d8620700f82b471879223F1628' as const;
const DBCSWAP_POSITION_MANAGER = '0xfCE792dd602fA70143e43e7556e8a92D762bA9FC' as const;
const XAA_TOKEN_ADDRESS = process.env.NEXT_PUBLIC_XAA_TEST_VERSION === "true"
  ? "0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a"
  : "0x16d83F6B17914a4e88436251589194CA5AC0f452";

// Uniswap V3 Factory ABI (创建池子)
const V3_FACTORY_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"},
      {"internalType": "uint24", "name": "fee", "type": "uint24"}
    ],
    "name": "createPool",
    "outputs": [{"internalType": "address", "name": "pool", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "tokenA", "type": "address"},
      {"internalType": "address", "name": "tokenB", "type": "address"},
      {"internalType": "uint24", "name": "fee", "type": "uint24"}
    ],
    "name": "getPool",
    "outputs": [{"internalType": "address", "name": "pool", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Uniswap V3 Position Manager ABI (添加流动性)
const POSITION_MANAGER_ABI = [
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "token0", "type": "address"},
          {"internalType": "address", "name": "token1", "type": "address"},
          {"internalType": "uint24", "name": "fee", "type": "uint24"},
          {"internalType": "int24", "name": "tickLower", "type": "int24"},
          {"internalType": "int24", "name": "tickUpper", "type": "int24"},
          {"internalType": "uint256", "name": "amount0Desired", "type": "uint256"},
          {"internalType": "uint256", "name": "amount1Desired", "type": "uint256"},
          {"internalType": "uint256", "name": "amount0Min", "type": "uint256"},
          {"internalType": "uint256", "name": "amount1Min", "type": "uint256"},
          {"internalType": "address", "name": "recipient", "type": "address"},
          {"internalType": "uint256", "name": "deadline", "type": "uint256"}
        ],
        "internalType": "struct INonfungiblePositionManager.MintParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "mint",
    "outputs": [
      {"internalType": "uint256", "name": "tokenId", "type": "uint256"},
      {"internalType": "uint128", "name": "liquidity", "type": "uint128"},
      {"internalType": "uint256", "name": "amount0", "type": "uint256"},
      {"internalType": "uint256", "name": "amount1", "type": "uint256"}
    ],
    "stateMutability": "payable",
    "type": "function"
  }
] as const;

// ERC20 ABI (用于授权)
const ERC20_ABI = [
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// 请求参数验证 - 需要传入代币地址等信息
const CreatePoolRequestSchema = z.object({
  tokenAddress: z.string().min(1, 'Token address is required'), // 代币地址
  tokenAmount: z.string().optional().default('0.001'), // 默认0.001个代币
  xaaAmount: z.string().optional().default('0.001'),   // 默认0.001个XAA
  slippage: z.number().min(0).max(100).optional().default(0.5), // 滑点容忍度 %
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 收到创建池子请求...');
    console.log('📝 请求参数:', { agentId: params.id });

    // 解析请求体
    const body = await request.json();
    console.log('📝 Agent ID:', params.id);
    console.log('📦 请求体内容:', body);

    // 验证请求参数
    const validationResult = CreatePoolRequestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('❌ 参数验证失败:', validationResult.error.errors);
      return NextResponse.json(
        {
          code: 400,
          message: '参数验证失败',
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { tokenAddress, tokenAmount, xaaAmount, slippage } = validationResult.data;
    console.log('✅ 验证通过的参数:', { tokenAddress, tokenAmount, xaaAmount, slippage });

    // 安全检查：限制最大数量，防止影响现有池子
    const maxTestAmount = 1; // 最大1个代币
    if (parseFloat(tokenAmount) > maxTestAmount || parseFloat(xaaAmount) > maxTestAmount) {
      console.error('❌ 数量超过限制:', { tokenAmount, xaaAmount, maxTestAmount });
      return NextResponse.json(
        {
          code: 400,
          message: `测试模式下，代币数量不能超过 ${maxTestAmount}，当前: Token=${tokenAmount}, XAA=${xaaAmount}`
        },
        { status: 400 }
      );
    }

    // 验证代币地址格式
    if (!tokenAddress.startsWith('0x') || tokenAddress.length !== 42) {
      console.error('❌ 代币地址格式错误:', tokenAddress);
      return NextResponse.json(
        { code: 400, message: '代币地址格式错误，应为42位的0x开头地址' },
        { status: 400 }
      );
    }

    console.log('🪙 使用代币地址:', tokenAddress);
    console.log('🪙 XAA代币地址:', XAA_TOKEN_ADDRESS);

    // 获取服务端钱包
    const serverPrivateKey = process.env.SERVER_WALLET_PRIVATE_KEY;
    console.log('🔍 原始私钥长度:', serverPrivateKey?.length);
    console.log('🔍 原始私钥前10位:', serverPrivateKey?.substring(0, 10));

    if (!serverPrivateKey) {
      console.error('❌ 服务端钱包私钥未配置');
      return NextResponse.json(
        { code: 500, message: '服务端钱包私钥未配置' },
        { status: 500 }
      );
    }

    // 验证私钥格式
    let formattedPrivateKey: `0x${string}`;
    if (serverPrivateKey.startsWith('0x')) {
      formattedPrivateKey = serverPrivateKey as `0x${string}`;
      console.log('🔑 私钥已有0x前缀');
    } else {
      formattedPrivateKey = `0x${serverPrivateKey}` as `0x${string}`;
      console.log('🔑 为私钥添加0x前缀');
    }

    console.log('🔍 格式化后私钥长度:', formattedPrivateKey.length);
    console.log('🔍 格式化后私钥前10位:', formattedPrivateKey.substring(0, 10));

    // 验证私钥长度
    if (formattedPrivateKey.length !== 66) {
      console.error('❌ 私钥长度错误:', formattedPrivateKey.length, '期望66位');
      return NextResponse.json(
        { code: 500, message: `服务端钱包私钥格式错误，长度${formattedPrivateKey.length}，期望66位` },
        { status: 500 }
      );
    }

    // 验证私钥是否为有效的十六进制
    const hexPattern = /^0x[0-9a-fA-F]{64}$/;
    if (!hexPattern.test(formattedPrivateKey)) {
      console.error('❌ 私钥不是有效的十六进制格式');
      return NextResponse.json(
        { code: 500, message: '服务端钱包私钥不是有效的十六进制格式' },
        { status: 500 }
      );
    }

    console.log('🔑 私钥格式验证通过');

    let account;
    try {
      account = privateKeyToAccount(formattedPrivateKey);
      console.log('✅ 钱包账户创建成功:', account.address);
    } catch (error) {
      console.error('❌ 创建钱包账户失败:', error);
      return NextResponse.json(
        { code: 500, message: '服务端钱包配置错误: ' + (error as Error).message },
        { status: 500 }
      );
    }
    
    const publicClient = createPublicClient({
      chain: currentChain,
      transport: http(),
    });

    const walletClient = createWalletClient({
      account,
      chain: currentChain,
      transport: http(),
    });

    console.log(`🏊 开始创建池子 - Token: ${tokenAddress}, 代币数量: ${tokenAmount}, XAA数量: ${xaaAmount}`);
    console.log(`💡 使用测试数量 - 代币: ${tokenAmount} Token, XAA: ${xaaAmount} XAA`);

    // 转换为Wei单位
    const tokenAmountWei = parseEther(tokenAmount);
    const xaaAmountWei = parseEther(xaaAmount);
    
    // 计算最小数量（考虑滑点）
    const slippageMultiplier = (100 - slippage) / 100;
    const tokenAmountMin = BigInt(Math.floor(Number(tokenAmountWei) * slippageMultiplier));
    const xaaAmountMin = BigInt(Math.floor(Number(xaaAmountWei) * slippageMultiplier));

    // 设置交易截止时间（20分钟后）
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    // 先检查钱包余额
    console.log('💰 检查钱包余额...');

    const ERC20_BALANCE_ABI = [
      {
        "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ] as const;

    try {
      const tokenBalance = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [account.address],
      });

      const xaaBalance = await publicClient.readContract({
        address: XAA_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [account.address],
      });

      console.log(`💰 代币余额: ${formatEther(tokenBalance as bigint)} Token`);
      console.log(`💰 XAA余额: ${formatEther(xaaBalance as bigint)} XAA`);
      console.log(`📊 需要代币: ${formatEther(tokenAmountWei)} Token`);
      console.log(`📊 需要XAA: ${formatEther(xaaAmountWei)} XAA`);

      // 检查余额是否足够
      const tokenSufficient = (tokenBalance as bigint) >= tokenAmountWei;
      const xaaSufficient = (xaaBalance as bigint) >= xaaAmountWei;

      console.log(`✅ 代币余额校验: ${tokenSufficient ? '通过' : '不通过'}`);
      console.log(`✅ XAA余额校验: ${xaaSufficient ? '通过' : '不通过'}`);

      if (!tokenSufficient) {
        console.error('❌ 代币余额不足');
        return NextResponse.json(
          {
            code: 400,
            message: `代币余额不足，需要: ${formatEther(tokenAmountWei)}, 当前: ${formatEther(tokenBalance as bigint)}`
          },
          { status: 400 }
        );
      }

      if (!xaaSufficient) {
        console.error('❌ XAA余额不足');
        return NextResponse.json(
          {
            code: 400,
            message: `XAA余额不足，需要: ${formatEther(xaaAmountWei)}, 当前: ${formatEther(xaaBalance as bigint)}`
          },
          { status: 400 }
        );
      }

      console.log('🎉 所有余额校验通过！');

    } catch (error) {
      console.error('❌ 检查余额失败:', error);
      return NextResponse.json(
        { code: 500, message: '检查余额失败，可能代币地址无效' },
        { status: 500 }
      );
    }

    // 步骤1: 检查池子是否存在，如果不存在则创建
    console.log('🏊 检查池子是否存在...');
    const fee = 500; // 0.05% 手续费

    let poolAddress;
    try {
      poolAddress = await publicClient.readContract({
        address: DBCSWAP_V3_FACTORY,
        abi: V3_FACTORY_ABI,
        functionName: 'getPool',
        args: [tokenAddress as `0x${string}`, XAA_TOKEN_ADDRESS as `0x${string}`, fee],
      });

      console.log('� 查询到的池子地址:', poolAddress);
    } catch (error) {
      console.error('❌ 查询池子失败:', error);
      return NextResponse.json(
        { code: 500, message: '查询池子状态失败' },
        { status: 500 }
      );
    }

    // 声明currentTick变量在外层作用域
    let currentTick = 0; // 默认tick值

    // 如果池子不存在（地址为0x0），则创建池子
    if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
      console.log('🏗️ 池子不存在，开始创建池子...');

      try {
        const createPoolHash = await walletClient.writeContract({
          address: DBCSWAP_V3_FACTORY,
          abi: V3_FACTORY_ABI,
          functionName: 'createPool',
          args: [tokenAddress as `0x${string}`, XAA_TOKEN_ADDRESS as `0x${string}`, fee],
        });

        console.log(`✅ 创建池子交易已提交: ${createPoolHash}`);

        // 等待创建池子交易确认
        const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createPoolHash });
        console.log(`✅ 池子创建成功，区块: ${createReceipt.blockNumber}`);

        // 重新查询池子地址
        poolAddress = await publicClient.readContract({
          address: DBCSWAP_V3_FACTORY,
          abi: V3_FACTORY_ABI,
          functionName: 'getPool',
          args: [tokenAddress as `0x${string}`, XAA_TOKEN_ADDRESS as `0x${string}`, fee],
        });

        console.log('🎉 新创建的池子地址:', poolAddress);

      } catch (error) {
        console.error('❌ 创建池子失败:', error);
        return NextResponse.json(
          { code: 500, message: '创建池子失败: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ 池子已存在:', poolAddress);

      // 检查池子是否已初始化
      console.log('🔍 检查池子初始化状态...');

      const POOL_ABI = [
        {
          "inputs": [],
          "name": "slot0",
          "outputs": [
            {"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"},
            {"internalType": "int24", "name": "tick", "type": "int24"},
            {"internalType": "uint16", "name": "observationIndex", "type": "uint16"},
            {"internalType": "uint16", "name": "observationCardinality", "type": "uint16"},
            {"internalType": "uint16", "name": "observationCardinalityNext", "type": "uint16"},
            {"internalType": "uint8", "name": "feeProtocol", "type": "uint8"},
            {"internalType": "bool", "name": "unlocked", "type": "bool"}
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "uint160", "name": "sqrtPriceX96", "type": "uint160"}],
          "name": "initialize",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ] as const;

      try {
        const slot0 = await publicClient.readContract({
          address: poolAddress as `0x${string}`,
          abi: POOL_ABI,
          functionName: 'slot0',
        }) as readonly [bigint, number, number, number, number, number, boolean];

        const [sqrtPriceX96, tick] = slot0;
        currentTick = tick; // 保存当前tick

        console.log('🔍 池子当前状态:');
        console.log(`  - sqrtPriceX96: ${sqrtPriceX96.toString()}`);
        console.log(`  - 当前tick: ${tick}`);

        // 如果价格为0，说明池子未初始化
        if (sqrtPriceX96 === BigInt(0)) {
          console.log('🏗️ 池子未初始化，开始初始化...');

          // 计算IAO初始价格
          const iaoPrice = parseFloat(xaaAmount) / parseFloat(tokenAmount);
          console.log(`💰 计算的IAO价格: ${iaoPrice}`);

          if (iaoPrice <= 0) {
            throw new Error('IAO价格计算错误，无法初始化池子');
          }

          // 使用IAO价格初始化池子
          // sqrtPriceX96 = sqrt(price) * 2^96
          const sqrtPrice = Math.sqrt(iaoPrice);
          const initialSqrtPrice = BigInt(Math.floor(sqrtPrice * Math.pow(2, 96)));

          console.log(`🏗️ 使用IAO价格初始化池子:`);
          console.log(`  - IAO价格: ${iaoPrice}`);
          console.log(`  - sqrt价格: ${sqrtPrice}`);
          console.log(`  - sqrtPriceX96: ${initialSqrtPrice.toString()}`);

          const initializeHash = await walletClient.writeContract({
            address: poolAddress as `0x${string}`,
            abi: POOL_ABI,
            functionName: 'initialize',
            args: [initialSqrtPrice],
          });

          console.log(`✅ 池子初始化交易已提交: ${initializeHash}`);
          await publicClient.waitForTransactionReceipt({ hash: initializeHash });
          console.log('✅ 池子初始化完成');

          // 计算初始化后的tick
          currentTick = Math.floor(Math.log(iaoPrice) / Math.log(1.0001));
          console.log(`📊 初始化后的tick: ${currentTick}`);
        } else {
          console.log('✅ 池子已初始化');
        }

      } catch (error) {
        console.error('❌ 检查池子状态失败:', error);
        // 继续执行，使用默认tick值0
        currentTick = 0;
      }
    }

    // 步骤2: 授权代币给Position Manager
    console.log('📝 开始授权代币给Position Manager...');

    const tokenApproveHash = await walletClient.writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [DBCSWAP_POSITION_MANAGER, tokenAmountWei],
    });

    console.log(`✅ 代币授权交易已提交: ${tokenApproveHash}`);
    console.log('⏳ 等待代币授权交易确认...');

    // 等待第一个授权确认
    const tokenApproveReceipt = await publicClient.waitForTransactionReceipt({ hash: tokenApproveHash });
    console.log('✅ 代币授权确认完成');
    console.log(`📊 代币授权区块号: ${tokenApproveReceipt.blockNumber}`);
    console.log(`📊 代币授权Gas使用: ${tokenApproveReceipt.gasUsed}`);

    // 检查XAA余额和当前授权额度
    console.log('🔍 检查XAA授权前状态...');

    const ERC20_ALLOWANCE_ABI = [
      {
        "inputs": [
          {"internalType": "address", "name": "owner", "type": "address"},
          {"internalType": "address", "name": "spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      }
    ] as const;

    try {
      const currentAllowance = await publicClient.readContract({
        address: XAA_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ALLOWANCE_ABI,
        functionName: 'allowance',
        args: [account.address, DBCSWAP_POSITION_MANAGER],
      });

      console.log(`💰 当前XAA授权额度: ${formatEther(currentAllowance as bigint)}`);

      // 如果已有授权额度，先重置为0
      if ((currentAllowance as bigint) > BigInt(0)) {
        console.log('🔄 重置XAA授权额度为0...');
        const resetHash = await walletClient.writeContract({
          address: XAA_TOKEN_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [DBCSWAP_POSITION_MANAGER, BigInt(0)],
        });
        await publicClient.waitForTransactionReceipt({ hash: resetHash });
        console.log('✅ XAA授权重置完成');
      }
    } catch (error) {
      console.error('❌ 检查XAA授权状态失败:', error);
    }

    console.log('📝 开始授权XAA代币...');
    console.log(`🔍 XAA代币地址: ${XAA_TOKEN_ADDRESS}`);
    console.log(`🔍 Position Manager地址: ${DBCSWAP_POSITION_MANAGER}`);
    console.log(`🔍 授权数量: ${formatEther(xaaAmountWei)} XAA`);
    console.log(`🔍 钱包地址: ${account.address}`);

    let xaaApproveHash;
    try {
      xaaApproveHash = await walletClient.writeContract({
        address: XAA_TOKEN_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [DBCSWAP_POSITION_MANAGER, xaaAmountWei],
      });

      console.log(`✅ XAA授权交易已提交: ${xaaApproveHash}`);
      console.log('⏳ 等待XAA授权交易确认...');
    } catch (error: any) {
      console.error('❌ XAA授权失败详细信息:');
      console.error('错误类型:', error.constructor.name);
      console.error('错误消息:', error.message);
      console.error('错误原因:', error.cause?.message || 'N/A');
      console.error('错误详情:', error.details || 'N/A');
      console.error('错误原因码:', error.cause?.reason || 'N/A');

      // 分析可能的原因
      let possibleCause = '未知原因';
      if (error.message.includes('Module(ModuleError { index: 51, error: [5, 0, 0, 0]')) {
        possibleCause = 'DBC链模块错误 - 可能是代币合约不支持标准ERC20授权，或者有特殊限制';
      } else if (error.message.includes('insufficient')) {
        possibleCause = '余额不足或gas不足';
      } else if (error.message.includes('revert')) {
        possibleCause = '合约执行被拒绝 - 可能是权限问题或合约逻辑限制';
      }

      console.error('🔍 可能原因:', possibleCause);

      // 返回详细的错误信息
      return NextResponse.json({
        code: 500,
        message: 'XAA代币授权失败',
        error: error.message,
        possibleCause: possibleCause,
        data: {
          poolAddress: poolAddress,
          poolCreated: true,
          tokenApproved: true,
          xaaApproved: false,
          xaaTokenAddress: XAA_TOKEN_ADDRESS,
          positionManagerAddress: DBCSWAP_POSITION_MANAGER,
          walletAddress: account.address,
          approveAmount: formatEther(xaaAmountWei),
        },
      }, { status: 500 });
    }

    // 等待XAA授权交易确认
    if (xaaApproveHash) {
      const xaaApproveReceipt = await publicClient.waitForTransactionReceipt({ hash: xaaApproveHash });
      console.log('✅ XAA授权确认完成');
      console.log(`📊 XAA授权区块号: ${xaaApproveReceipt.blockNumber}`);
      console.log(`📊 XAA授权Gas使用: ${xaaApproveReceipt.gasUsed}`);
    }

    // 步骤3: 添加流动性（使用V3的mint方法）
    console.log('💰 开始添加流动性...');

    // 确定token0和token1的顺序（地址小的为token0）
    const isToken0 = tokenAddress.toLowerCase() < XAA_TOKEN_ADDRESS.toLowerCase();
    const token0 = isToken0 ? tokenAddress : XAA_TOKEN_ADDRESS;
    const token1 = isToken0 ? XAA_TOKEN_ADDRESS : tokenAddress;
    const amount0Desired = isToken0 ? tokenAmountWei : xaaAmountWei;
    const amount1Desired = isToken0 ? xaaAmountWei : tokenAmountWei;
    const amount0Min = isToken0 ? tokenAmountMin : xaaAmountMin;
    const amount1Min = isToken0 ? xaaAmountMin : tokenAmountMin;

    console.log('🔄 代币顺序:', { token0, token1, isToken0 });

    // 使用0.05%手续费，基于当前tick动态计算范围
    // 对于0.05%手续费，tick间距是10
    const tickSpacing = 10; // 0.05%手续费的tick间距

    // 基于当前tick计算合理的范围（上下各1000个tick，约10倍价格范围）
    const tickRange = 1000;
    const tickLower = Math.floor((currentTick - tickRange) / tickSpacing) * tickSpacing;
    const tickUpper = Math.floor((currentTick + tickRange) / tickSpacing) * tickSpacing;

    console.log(`📊 池子配置:`);
    console.log(`  - 手续费: 0.05% (${fee})`);
    console.log(`  - Tick间距: ${tickSpacing}`);
    console.log(`  - 当前tick: ${currentTick}`);
    console.log(`  - tickLower: ${tickLower}`);
    console.log(`  - tickUpper: ${tickUpper}`);
    console.log(`  - tick范围: ${tickRange * 2} ticks`);
    console.log(`  - 价格范围: ${Math.pow(1.0001, tickLower).toFixed(6)} - ${Math.pow(1.0001, tickUpper).toFixed(6)}`);

    const mintParams = {
      token0: token0 as `0x${string}`,
      token1: token1 as `0x${string}`,
      fee: fee,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: amount0Desired,
      amount1Desired: amount1Desired,
      amount0Min: amount0Min,
      amount1Min: amount1Min,
      recipient: account.address,
      deadline: deadline,
    };

    console.log('📋 Mint参数详情:');
    console.log(`  - token0: ${mintParams.token0}`);
    console.log(`  - token1: ${mintParams.token1}`);
    console.log(`  - fee: ${mintParams.fee}`);
    console.log(`  - tickLower: ${mintParams.tickLower}`);
    console.log(`  - tickUpper: ${mintParams.tickUpper}`);
    console.log(`  - amount0Desired: ${formatEther(mintParams.amount0Desired)}`);
    console.log(`  - amount1Desired: ${formatEther(mintParams.amount1Desired)}`);
    console.log(`  - amount0Min: ${formatEther(mintParams.amount0Min)}`);
    console.log(`  - amount1Min: ${formatEther(mintParams.amount1Min)}`);
    console.log(`  - recipient: ${mintParams.recipient}`);
    console.log(`  - deadline: ${mintParams.deadline}`);

    console.log('🚀 开始调用mint函数...');
    const addLiquidityHash = await walletClient.writeContract({
      address: DBCSWAP_POSITION_MANAGER,
      abi: POSITION_MANAGER_ABI,
      functionName: 'mint',
      args: [mintParams],
    });

    console.log(`✅ 添加流动性交易已提交: ${addLiquidityHash}`);
    console.log('⏳ 等待流动性添加交易确认...');

    // 等待交易确认
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: addLiquidityHash
    });

    console.log(`🎉 流动性添加成功! 交易Hash: ${addLiquidityHash}`);
    console.log(`📊 流动性添加区块号: ${receipt.blockNumber}`);
    console.log(`📊 流动性添加Gas使用: ${receipt.gasUsed}`);
    console.log(`📊 交易状态: ${receipt.status === 'success' ? '成功' : '失败'}`);

    // 简化：不更新数据库，只返回结果
    console.log('✅ 跳过数据库更新，直接返回结果');

    return NextResponse.json({
      code: 200,
      message: '池子创建和流动性添加成功',
      data: {
        poolAddress: poolAddress,
        liquidityTxHash: addLiquidityHash,
        tokenAmount: formatEther(tokenAmountWei),
        xaaAmount: formatEther(xaaAmountWei),
        blockNumber: receipt.blockNumber.toString(),
        fee: fee,
      },
    });

  } catch (error: any) {
    console.error('❌ 创建池子失败:', error);
    
    return NextResponse.json(
      {
        code: 500,
        message: '创建池子失败',
        error: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
