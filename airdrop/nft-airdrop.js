/**
 * NFT持有者空投脚本 - 基于NFT持有数量*50000计算空投数量
 * 使用方法: node nft-airdrop.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 配置参数
const CONFIG = {
	// 数据文件路径（可以选择不同的数据源）
	dataFiles: {
		staking: './data/staking-snap.json',
		holders: './data/holders_info.json'
	},
	
	// 当前使用的数据文件
	currentDataFile: './data/holders_info.json', // 改为 holders_info.json 可切换数据源
	
	// 空投接口配置
	apiUrl: 'http://localhost:3000/api/airdrop/dev-send',
	reconcileUrl: 'http://localhost:3000/api/airdrop/dev-send/reconcile',
	tokenAddress: '0x861100195D26bf1e115a40337bba22f000fa6871', // 空投代币地址
	
	// NFT空投配置
	nftAirdropSettings: {
		// 每个NFT对应的代币数量
		tokensPerNFT: 50000, // 每个NFT发5万个代币
		
		// 最低空投数量（不使用限制）
		minimumAirdrop: null, // 不限制最低数量
		
		// 最高空投数量限制（不使用限制）
		maximumAirdrop: null, // 不限制最高数量
		
		// 是否启用最低空投保障
		enableMinimum: false, // 不启用最低限制
		
		// 是否启用最高空投限制
		enableMaximum: false // 不启用最高限制
	},
	
	// 执行控制
	execution: {
		// 是否跳过合约地址
		skipContracts: true,
		
		// 并发控制（保持原有高速度）
		concurrentLimit: 4,   // 4个并发，保持高速度
		
		// 批次大小（每批处理多少个）
		batchSize: 49,        // 所有交易一个批次
		
		// 批次间延迟（毫秒）
		batchDelay: 1000,     // 减少到1秒
		
		// 单次请求间延迟（毫秒） - 保持原有速度
		requestDelay: 100,    // 保持100ms高速度
		
		// 失败重试 - 常规重试参数
		maxRetries: 3,        // 常规重试次数
		retryDelay: 500,      // 常规重试延迟
		
		// 是否等待确认
		waitForConfirmation: false,  // 不等待交易确认
		
		// 测试模式（true=只打印不实际发送）
		testMode: false
	},
	
	// 专门的最终重试配置（当有失败交易时使用）
	finalRetryExecution: {
		// 最终重试并发控制（完全串行避免nonce冲突）
		concurrentLimit: 1,   // 完全串行发送，避免nonce冲突
		
		// 最终重试延迟（毫秒） - 更保守的设置
		requestDelay: 3000,   // 增加到3秒，避免Gas价格竞争
		
		// 最终重试参数 - 更激进的重试
		maxRetries: 7,        // 增加重试次数到7次
		retryDelay: 8000,     // 增加重试延迟到8秒
		
		// 最终重试时是否等待确认
		waitForConfirmation: false  // 仍然不等待确认
	}
};

// 延迟函数
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// 并发限制器
class ConcurrencyLimiter {
	constructor(limit) {
		this.limit = limit;
		this.running = 0;
		this.queue = [];
	}

	async execute(fn) {
		return new Promise((resolve, reject) => {
			this.queue.push({ fn, resolve, reject });
			this.tryNext();
		});
	}

	tryNext() {
		if (this.running >= this.limit || this.queue.length === 0) {
			return;
		}

		this.running++;
		const { fn, resolve, reject } = this.queue.shift();

		fn()
			.then(resolve)
			.catch(reject)
			.finally(() => {
				this.running--;
				this.tryNext();
			});
	}
}

// 计算NFT空投数量
function calculateNFTAirdropAmount(nftCount) {
	const { tokensPerNFT, minimumAirdrop, maximumAirdrop, enableMinimum, enableMaximum } = CONFIG.nftAirdropSettings;
	
	// 基础计算：NFT数量 * 每个NFT对应的代币数量
	let airdropAmount = parseInt(nftCount) * tokensPerNFT;
	
	// 应用最低空投保障
	if (enableMinimum && airdropAmount < minimumAirdrop) {
		airdropAmount = minimumAirdrop;
	}
	
	// 应用最高空投限制
	if (enableMaximum && airdropAmount > maximumAirdrop) {
		airdropAmount = maximumAirdrop;
	}
	
	return airdropAmount.toString();
}

// 显示详细的确认信息
function displayConfirmationInfo(airdropList, totalAmount) {
	console.log('\n' + '='.repeat(80));
	console.log('                      🎨 NFT持有者空投执行确认');
	console.log('='.repeat(80));
	
	// 基本信息
	console.log('\n📊 基本信息');
	console.log(`   代币地址: ${CONFIG.tokenAddress}`);
	console.log(`   数据来源: ${CONFIG.currentDataFile}`);
	console.log(`   总发送数量: ${totalAmount.toLocaleString()} tokens`);
	console.log(`   发送地址数量: ${airdropList.length.toLocaleString()} 个`);
	
	// NFT空投规则
	console.log('\n🎨 NFT空投规则');
	console.log(`   每个NFT对应: ${CONFIG.nftAirdropSettings.tokensPerNFT.toLocaleString()} tokens`);
	console.log(`   最低空投数量: 无限制`);
	if (CONFIG.nftAirdropSettings.enableMaximum && CONFIG.nftAirdropSettings.maximumAirdrop) {
		console.log(`   最高空投限制: ${CONFIG.nftAirdropSettings.maximumAirdrop.toLocaleString()} tokens`);
	} else {
		console.log(`   最高空投限制: 无限制`);
	}
	
	// 统计分析
	console.log('\n📈 数量分析');
	const nftCounts = airdropList.map(item => parseInt(item.nftCount));
	const minNFTs = Math.min(...nftCounts);
	const maxNFTs = Math.max(...nftCounts);
	const avgNFTs = (nftCounts.reduce((a, b) => a + b, 0) / nftCounts.length).toFixed(2);
	
	console.log(`   NFT持有数量范围: ${minNFTs} - ${maxNFTs} 个`);
	console.log(`   平均NFT持有数量: ${avgNFTs} 个`);
	
	// 执行计划
	console.log('\n📄 执行计划');
	const totalBatches = Math.ceil(airdropList.length / CONFIG.execution.batchSize);
	const newEstimatedTime = Math.ceil(airdropList.length * CONFIG.execution.requestDelay / CONFIG.execution.concurrentLimit / 1000 / 60);
	
	console.log(`   批次大小: ${CONFIG.execution.batchSize} 个/批次`);
	console.log(`   并发限制: ${CONFIG.execution.concurrentLimit} 个同时执行`);
	console.log(`   总批次数: ${totalBatches} 批次`);
	console.log(`   预估执行时间: 约 ${newEstimatedTime} 分钟`);
	
	// 执行设置
	console.log('\n⚙️ 执行设置');
	console.log(`   跳过合约地址: ${CONFIG.execution.skipContracts ? '是' : '否'}`);
	console.log(`   测试模式: ${CONFIG.execution.testMode ? '是 (不会实际发送)' : '否 (将实际发送)'}`);
	
	// 显示部分空投地址详情（前10个和后10个）
	console.log('\n📋 详细空投列表');
	console.log(`   总共 ${airdropList.length} 个地址，显示前10个和后10个:`);
	
	// 显示前10个
	const showFirst = Math.min(10, airdropList.length);
	for (let i = 0; i < showFirst; i++) {
		const item = airdropList[i];
		console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${item.walletAddress}`);
		console.log(`       🎨 持有NFT: ${item.nftCount}个 | 💰 空投数量: ${item.amount} tokens`);
	}
	
	// 如果超过20个，显示省略号和后10个
	if (airdropList.length > 20) {
		console.log(`   ... (省略 ${airdropList.length - 20} 个地址) ...`);
		
		// 显示后10个
		for (let i = airdropList.length - 10; i < airdropList.length; i++) {
			const item = airdropList[i];
			console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${item.walletAddress}`);
			console.log(`       🎨 持有NFT: ${item.nftCount}个 | 💰 空投数量: ${item.amount} tokens`);
		}
	} else if (airdropList.length > 10) {
		// 如果在10-20个之间，显示剩余的
		for (let i = 10; i < airdropList.length; i++) {
			const item = airdropList[i];
			console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${item.walletAddress}`);
			console.log(`       🎨 持有NFT: ${item.nftCount}个 | 💰 空投数量: ${item.amount} tokens`);
		}
	}
	
	// 风险提示
	console.log('\n⚠️  重要提示');
	if (!CONFIG.execution.testMode) {
		console.log('   - 🔴 此操作将发送真实的代币，不可撤销！');
		console.log('   - 🔴 请确保NFT计算规则和代币地址正确');
		console.log('   - 🔴 建议先设置 testMode: true 进行测试');
	} else {
		console.log('   - 🟡 当前为测试模式，不会实际发送代币');
	}
	
	console.log('\n' + '='.repeat(80));
	if (CONFIG.execution.testMode) {
		console.log('🧪 测试模式 - 按 Enter 键开始测试，Ctrl+C 取消');
	} else {
		console.log('⚠️  生产模式 - 按 Enter 键确认执行，Ctrl+C 取消');
	}
	console.log('='.repeat(80));
}

// 等待用户确认
function waitForUserConfirmation() {
	return new Promise((resolve, reject) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		process.on('SIGINT', () => {
			console.log('\n\n❌ 用户取消操作');
			rl.close();
			process.exit(0);
		});

		rl.question('', () => {
			rl.close();
			console.log('✅ 用户已确认，开始执行...\n');
			resolve(true);
		});
	});
}

// 加载NFT持有者数据
function loadNFTHoldersData() {
	try {
		const dataPath = path.resolve(__dirname, CONFIG.currentDataFile);
		console.log(`📁 加载NFT数据文件: ${dataPath}`);
		
		const rawData = fs.readFileSync(dataPath, 'utf8');
		const pagesData = JSON.parse(rawData);
		
		// 统计总数据
		let totalHolders = 0;
		pagesData.forEach(page => {
			if (page.status === 'ok' && page.data) {
				totalHolders += page.data.length;
			}
		});
		
		console.log(`📊 总共加载了 ${pagesData.length} 页数据，包含 ${totalHolders} 个NFT持有者`);
		return pagesData;
		
	} catch (error) {
		console.error('❌ 加载NFT数据文件失败:', error.message);
		console.error('💡 请确保以下文件存在：');
		console.error(`   - ${CONFIG.dataFiles.staking}`);
		console.error(`   - ${CONFIG.dataFiles.holders}`);
		process.exit(1);
	}
}

// 提取所有NFT持有者
function extractAllNFTHolders(pagesData) {
	const allHolders = [];
	
	console.log('📍 提取所有NFT持有者数据...');
	
	pagesData.forEach(page => {
		if (page.status !== 'ok' || !page.data) {
			console.log(`⚠️ 第${page.page}页数据不可用，跳过`);
			return;
		}
		
		page.data.forEach((holder, index) => {
			// 基本验证
			if (!holder.wallet_address || !holder.wallet_address.match(/^0x[a-fA-F0-9]{40}$/)) {
				console.log(`⚠️ 跳过无效地址: ${holder.wallet_address || 'undefined'}`);
				return;
			}
			
			// 跳过合约地址（如果配置了）
			if (CONFIG.execution.skipContracts && holder.is_contract) {
				console.log(`⚠️ 跳过合约地址: ${holder.wallet_address}`);
				return;
			}
			
			// NFT数量验证（amount字段表示持有的NFT数量）
			const nftCount = parseInt(holder.amount) || 0;
			if (nftCount <= 0) {
				console.log(`⚠️ 跳过NFT数量为0的地址: ${holder.wallet_address}`);
				return;
			}
			
			allHolders.push({
				...holder,
				nftCount,
				pageNumber: page.page,
				indexInPage: index
			});
		});
	});
	
	console.log(`✅ 总共提取了 ${allHolders.length} 个有效的NFT持有者`);
	return allHolders;
}

// 准备NFT空投数据
function prepareNFTAirdropData(holders) {
	console.log('🎨 准备NFT空投数据...');
	
	// 只显示前10个和后10个的详情
	const showFirst = Math.min(10, holders.length);
	for (let i = 0; i < showFirst; i++) {
		const holder = holders[i];
		const nftCount = holder.nftCount;
		const airdropAmount = calculateNFTAirdropAmount(nftCount);
		console.log(`   ${(i + 1).toString().padStart(3, ' ')}. ${holder.wallet_address} | NFT: ${nftCount}个 | 空投: ${airdropAmount} tokens`);
	}
	
	// 如果超过20个，显示省略号和后10个
	if (holders.length > 20) {
		console.log(`   ... (省略 ${holders.length - 20} 个地址) ...`);
		
		// 显示后10个
		for (let i = holders.length - 10; i < holders.length; i++) {
			const holder = holders[i];
			const nftCount = holder.nftCount;
			const airdropAmount = calculateNFTAirdropAmount(nftCount);
			console.log(`   ${(i + 1).toString().padStart(3, ' ')}. ${holder.wallet_address} | NFT: ${nftCount}个 | 空投: ${airdropAmount} tokens`);
		}
	} else if (holders.length > 10) {
		// 如果在10-20个之间，显示剩余的
		for (let i = 10; i < holders.length; i++) {
			const holder = holders[i];
			const nftCount = holder.nftCount;
			const airdropAmount = calculateNFTAirdropAmount(nftCount);
			console.log(`   ${(i + 1).toString().padStart(3, ' ')}. ${holder.wallet_address} | NFT: ${nftCount}个 | 空投: ${airdropAmount} tokens`);
		}
	}
	
	return holders.map((holder, index) => {
		const nftCount = holder.nftCount;
		const airdropAmount = calculateNFTAirdropAmount(nftCount);
		
		return {
			walletAddress: holder.wallet_address,
			amount: airdropAmount,
			tokenAddress: CONFIG.tokenAddress,
			description: `NFT Holders Airdrop: ${airdropAmount} tokens (${nftCount} NFTs × ${CONFIG.nftAirdropSettings.tokensPerNFT})`,
			nftCount,
			originalAmount: holder.amount,
			pageNumber: holder.pageNumber,
			indexInPage: holder.indexInPage,
			globalIndex: index + 1
		};
	});
}

// 发送单个空投（带重试机制，支持自定义配置）
async function sendSingleAirdropWithConfig(airdropData, index, total, config = CONFIG.execution, retryCount = 0) {
	const { walletAddress, amount, tokenAddress, description, nftCount } = airdropData;
	
	const retryInfo = retryCount > 0 ? ` (重试 ${retryCount}/${config.maxRetries})` : '';
	const prefix = config === CONFIG.finalRetryExecution ? '🔄 [最终重试' : '🚀 [交易';
	console.log(`${prefix}${index + 1}/${total}] ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)} | NFT: ${nftCount} | 发送: ${amount} tokens${retryInfo}`);
	
	if (CONFIG.execution.testMode) {
		await delay(Math.random() * 100); // 模拟网络延迟
		console.log('🧪 测试模式 - 跳过实际发送');
		return { success: true, test: true, walletAddress, amount };
	}
	
	try {
		const response = await fetch(CONFIG.apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				walletAddress,
				amount,
				tokenAddress,
				description
			})
		});
		
		const data = await response.json();
		
		if (data.success) {
			const successPrefix = config === CONFIG.finalRetryExecution ? '✅ [最终重试' : '✅ [交易';
			console.log(`${successPrefix}${index + 1}/${total}] 成功! Hash: ${data.data.transactionHash?.slice(0,8)}...`);
			return {
				success: true,
				data: data.data,
				walletAddress,
				amount,
				nftCount,
				retryCount
			};
		} else {
			// 如果失败且还有重试次数，则重试
			if (retryCount < config.maxRetries) {
				const retryPrefix = config === CONFIG.finalRetryExecution ? '⚠️ [最终重试' : '⚠️ [交易';
				console.log(`${retryPrefix}${index + 1}/${total}] 失败，准备重试: ${data.message}`);
				await delay(config.retryDelay);
				return await sendSingleAirdropWithConfig(airdropData, index, total, config, retryCount + 1);
			}
			
			const failPrefix = config === CONFIG.finalRetryExecution ? '❌ [最终重试' : '❌ [交易';
			console.log(`${failPrefix}${index + 1}/${total}] 最终失败: ${data.message}`);
			return {
				success: false,
				error: data.message,
				walletAddress,
				amount,
				nftCount,
				retryCount
			};
		}
		
	} catch (error) {
		// 如果是网络错误且还有重试次数，则重试
		if (retryCount < config.maxRetries) {
			const errorPrefix = config === CONFIG.finalRetryExecution ? '⚠️ [最终重试' : '⚠️ [交易';
			console.log(`${errorPrefix}${index + 1}/${total}] 网络错误，准备重试: ${error.message}`);
			await delay(config.retryDelay);
			return await sendSingleAirdropWithConfig(airdropData, index, total, config, retryCount + 1);
		}
		
		const errorFinalPrefix = config === CONFIG.finalRetryExecution ? '❌ [最终重试' : '❌ [交易';
		console.error(`${errorFinalPrefix}${index + 1}/${total}] 网络错误: ${error.message}`);
		return {
			success: false,
			error: error.message,
			walletAddress,
			amount,
			nftCount,
			retryCount
		};
	}
}

// 发送单个空投（带重试机制）- 使用默认配置
async function sendSingleAirdrop(airdropData, index, total, retryCount = 0) {
	return await sendSingleAirdropWithConfig(airdropData, index, total, CONFIG.execution, retryCount);
}

// 最终重试处理空投（使用专门的重试配置）
async function processFinalRetryAirdrops(airdropList) {
	const results = {
		total: airdropList.length,
		success: 0,
		failed: 0,
		details: [],
		startTime: Date.now()
	};
	
	console.log(`\n🔄 开始最终重试处理...`);
	console.log(`📊 重试数量: ${results.total}`);
	console.log(`🚀 并发数量: ${CONFIG.finalRetryExecution.concurrentLimit} (串行处理)`);
	console.log(`⏱️ 请求延迟: ${CONFIG.finalRetryExecution.requestDelay}ms`);
	console.log(`🔄 最大重试: ${CONFIG.finalRetryExecution.maxRetries}次`);
	
	if (CONFIG.execution.testMode) {
		console.log(`🧪 测试模式 - 不会实际发送代币`);
	} else {
		console.log(`🚨 生产模式 - 将发送真实代币!`);
	}
	
	// 创建并发限制器（使用最终重试配置）
	const concurrencyLimiter = new ConcurrencyLimiter(CONFIG.finalRetryExecution.concurrentLimit);
	
	// 创建最终重试任务
	const tasks = airdropList.map((airdropData, index) => {
		return concurrencyLimiter.execute(async () => {
			// 使用最终重试配置的延迟
			if (CONFIG.finalRetryExecution.requestDelay > 0) {
				await delay(CONFIG.finalRetryExecution.requestDelay);
			}
			
			try {
				// 使用最终重试配置发送单个空投
				const result = await sendSingleAirdropWithConfig(airdropData, index, airdropList.length, CONFIG.finalRetryExecution);
				
				// 线程安全地更新结果
				if (result.success) {
					results.success++;
				} else {
					results.failed++;
				}
				results.details.push(result);
				
				// 显示实时进度
				const progress = (results.details.length / airdropList.length * 100).toFixed(1);
				console.log(`🔄 最终重试进度: ${results.details.length}/${airdropList.length} (${progress}%) | 成功: ${results.success} | 失败: ${results.failed}`);
				
				return result;
			} catch (error) {
				console.error(`❌ [最终重试${index + 1}/${airdropList.length}] 处理异常: ${error.message}`);
				results.failed++;
				const errorResult = {
					success: false,
					error: error.message,
					walletAddress: airdropData.walletAddress,
					amount: airdropData.amount
				};
				results.details.push(errorResult);
				return errorResult;
			}
		});
	});
	
	// 等待所有最终重试任务完成
	console.log(`🚀 开始串行最终重试 ${tasks.length} 个失败交易...`);
	await Promise.all(tasks);
	
	results.endTime = Date.now();
	results.totalTime = results.endTime - results.startTime;
	
	return results;
}

// 并发处理NFT空投
async function processNFTAirdrops(airdropList) {
	const results = {
		total: airdropList.length,
		success: 0,
		failed: 0,
		details: [],
		startTime: Date.now()
	};
	
	console.log(`\n🎯 开始NFT空投处理...`);
	console.log(`📊 总数: ${results.total}`);
	console.log(`🚀 并发数量: ${CONFIG.execution.concurrentLimit}`);
	console.log(`⏱️ 请求延迟: ${CONFIG.execution.requestDelay}ms`);
	console.log(`🔄 最大重试: ${CONFIG.execution.maxRetries}次`);
	
	if (CONFIG.execution.testMode) {
		console.log(`🧪 测试模式 - 不会实际发送代币`);
	} else {
		console.log(`🚨 生产模式 - 将发送真实代币!`);
	}
	
	// 创建并发限制器
	const concurrencyLimiter = new ConcurrencyLimiter(CONFIG.execution.concurrentLimit);
	
	// 创建所有任务
	const tasks = airdropList.map((airdropData, index) => {
		return concurrencyLimiter.execute(async () => {
			// 添加随机延迟以避免nonce冲突
			if (CONFIG.execution.requestDelay > 0) {
				await delay(Math.random() * CONFIG.execution.requestDelay);
			}
			
			try {
				const result = await sendSingleAirdrop(airdropData, index, airdropList.length);
				
				// 线程安全地更新结果
				if (result.success) {
					results.success++;
				} else {
					results.failed++;
				}
				results.details.push(result);
				
				// 显示实时进度
				const progress = (results.details.length / airdropList.length * 100).toFixed(1);
				console.log(`📊 进度: ${results.details.length}/${airdropList.length} (${progress}%) | 成功: ${results.success} | 失败: ${results.failed}`);
				
				return result;
			} catch (error) {
				console.error(`❌ [交易${index + 1}/${airdropList.length}] 处理异常: ${error.message}`);
				results.failed++;
				const errorResult = {
					success: false,
					error: error.message,
					walletAddress: airdropData.walletAddress,
					amount: airdropData.amount,
					nftCount: airdropData.nftCount
				};
				results.details.push(errorResult);
				return errorResult;
			}
		});
	});
	
	// 等待所有任务完成
	console.log(`🚀 开始并发执行 ${tasks.length} 个任务...`);
	await Promise.all(tasks);
	
	results.endTime = Date.now();
	results.totalTime = results.endTime - results.startTime;
	
	// 检查是否有失败的交易，如果有则使用专门的最终重试配置重试
	if (results.failed > 0) {
		console.log(`\n❌ 第一轮处理完成后有 ${results.failed} 个失败的交易！`);
		console.log(`🔄 将使用专门的最终重试配置进行重试...\n`);
		
		const failures = results.details.filter(r => !r.success);
		
		console.log(`🛠️ 最终重试配置:`);
		console.log(`   并发数量: ${CONFIG.finalRetryExecution.concurrentLimit} (串行处理)`);
		console.log(`   请求延迟: ${CONFIG.finalRetryExecution.requestDelay}ms (更保守)`);
		console.log(`   最大重试: ${CONFIG.finalRetryExecution.maxRetries}次 (更激进)`);
		console.log(`   重试延迟: ${CONFIG.finalRetryExecution.retryDelay}ms (更长等待)`);
		
		// 准备失败地址的重试数据
		const retryList = failures.map(failure => ({
			walletAddress: failure.walletAddress,
			amount: failure.amount || calculateNFTAirdropAmount(failure.nftCount || 1),
			tokenAddress: CONFIG.tokenAddress,
			description: `NFT Holders Airdrop RETRY: ${failure.amount || calculateNFTAirdropAmount(failure.nftCount || 1)} tokens`,
			nftCount: failure.nftCount || 1,
			originalAmount: failure.amount || "0",
			pageNumber: 0,
			indexInPage: 0,
			globalIndex: 0
		}));
		
		// 使用最终重试配置进行重试
		const finalRetryResults = await processFinalRetryAirdrops(retryList);
		
		// 合并结果
		results.details = results.details.filter(r => r.success).concat(finalRetryResults.details);
		results.success = results.details.filter(r => r.success).length;
		results.failed = results.details.filter(r => !r.success).length;
		
		// 如果最终重试后还有失败，才终止程序
		if (finalRetryResults.failed > 0) {
			console.log(`\n❌ 最终重试后仍有 ${finalRetryResults.failed} 个失败的交易！`);
			console.log(`🛑 程序将终止，需要手动处理以下失败交易:`);
			
			const stillFailures = finalRetryResults.details.filter(r => !r.success);
			stillFailures.forEach((failure, i) => {
				console.log(`${i + 1}. ${failure.walletAddress} (${failure.nftCount} NFTs) - ${failure.error}`);
			});
			
			console.log(`\n💡 建议: 检查网络状况、Gas费用或nonce状态后重新运行程序`);
			process.exit(1);
		} else {
			console.log(`\n🎉 最终重试成功！所有失败交易都已完成！`);
		}
	}
	
	// 自动对账：等待1分钟让交易充分确认，然后更新状态
	if (!CONFIG.execution.testMode && results.success > 0) {
		console.log(`\n🔄 等待 1 分钟后开始自动对账...`);
		console.log(`⏰ 对账将在 ${new Date(Date.now() + 60000).toLocaleTimeString()} 开始`);
		await delay(60000); // 1分钟 = 60,000毫秒
		
		console.log(`📊 开始自动对账 ${results.success} 个成功的交易...`);
		try {
			const reconcileResponse = await fetch(CONFIG.reconcileUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ limit: results.success + 10 })
			});
			
			const reconcileData = await reconcileResponse.json();
			if (reconcileData.success) {
				console.log(`✅ 对账完成: 成功${reconcileData.data.updatedSuccess}个, 失败${reconcileData.data.updatedFailed}个, 待确认${reconcileData.data.stillPending}个`);
				results.reconcile = reconcileData.data;
				
				// 检查对账后是否有失败的交易
				if (reconcileData.data.updatedFailed > 0) {
					console.log(`\n❌ 对账发现 ${reconcileData.data.updatedFailed} 个交易在区块链上失败！`);
					console.log(`🛑 程序将终止，需要手动处理失败的交易`);
					process.exit(1);
				}
			} else {
				console.log(`⚠️ 对账失败: ${reconcileData.message}`);
			}
		} catch (error) {
			console.log(`⚠️ 对账请求失败: ${error.message}`);
		}
	}
	
	return results;
}

// 生成报告
function generateNFTReport(results, airdropList) {
	console.log(`\n📋 ========== NFT空投完成报告 ==========`);
	console.log(`📊 总计处理: ${results.details.length} 个地址`);
	console.log(`✅ 成功: ${results.success} 个`);
	console.log(`❌ 失败: ${results.failed} 个`);
	console.log(`📈 成功率: ${(results.success / results.details.length * 100).toFixed(2)}%`);
	
	// 性能统计
	if (results.totalTime) {
		const totalSeconds = results.totalTime / 1000;
		const avgPerSecond = (results.details.length / totalSeconds).toFixed(2);
		console.log(`⏱️ 总耗时: ${totalSeconds.toFixed(2)} 秒`);
		console.log(`🚀 平均速度: ${avgPerSecond} 个/秒`);
	}
	
	// 计算总空投数量和NFT统计
	const totalAirdropped = results.details
		.filter(r => r.success)
		.reduce((sum, r) => sum + parseFloat(r.amount), 0);
	
	const totalNFTs = airdropList.reduce((sum, item) => sum + item.nftCount, 0);
	const avgTokensPerNFT = (totalAirdropped / totalNFTs).toFixed(2);
	
	console.log(`💰 总空投数量: ${totalAirdropped.toLocaleString()} tokens`);
	console.log(`🎨 总NFT数量: ${totalNFTs.toLocaleString()} 个`);
	console.log(`📊 平均每个NFT获得: ${avgTokensPerNFT} tokens`);
	
	// 保存详细报告
	const reportData = {
		timestamp: new Date().toISOString(),
		config: CONFIG,
		summary: {
			total: results.details.length,
			success: results.success,
			failed: results.failed,
			successRate: results.success / results.details.length,
			totalAirdropped,
			totalNFTs,
			avgTokensPerNFT: parseFloat(avgTokensPerNFT)
		},
		details: results.details
	};
	
	const reportFile = `nft-airdrop-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
	fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
	console.log(`\n📄 详细报告已保存: ${reportFile}`);
}

// 主函数
async function main() {
	console.log('🎨 NFT空投程序启动...\n');
	
	// 显示配置
	console.log('⚙️ NFT空投配置:');
	console.log(`   数据文件: ${CONFIG.currentDataFile}`);
	console.log(`   代币地址: ${CONFIG.tokenAddress}`);
	console.log(`   每个NFT对应: ${CONFIG.nftAirdropSettings.tokensPerNFT.toLocaleString()} tokens`);
	console.log(`   最低空投数量: 无限制`);
	console.log(`   最高空投限制: 无限制`);
	console.log(`   测试模式: ${CONFIG.execution.testMode}`);
	
	try {
		// 1. 加载NFT数据
		const pagesData = loadNFTHoldersData();
		
		// 2. 提取所有NFT持有者
		const nftHolders = extractAllNFTHolders(pagesData);
		
		if (nftHolders.length === 0) {
			console.log('⚠️ 没有找到有效的NFT持有者，程序退出');
			return;
		}
		
		// 3. 准备空投数据
		const airdropList = prepareNFTAirdropData(nftHolders);
		
		// 4. 计算总空投数量
		const totalAmount = airdropList.reduce((sum, item) => sum + parseFloat(item.amount), 0);
		
		// 5. 显示详细确认信息
		displayConfirmationInfo(airdropList, totalAmount);
		
		// 6. 等待用户确认
		await waitForUserConfirmation();
		
		// 7. 执行NFT空投
		const results = await processNFTAirdrops(airdropList);
		
		// 8. 生成报告
		generateNFTReport(results, airdropList);
		
	} catch (error) {
		console.error('❌ 程序执行失败:', error);
		process.exit(1);
	}
}

// 运行主函数
if (require.main === module) {
	main().catch(console.error);
}

module.exports = {
	CONFIG,
	calculateNFTAirdropAmount,
	loadNFTHoldersData,
	extractAllNFTHolders,
	prepareNFTAirdropData
};