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
	tokenAddress: '0x0BB579513DeAB87a247FB0CA8Eff32AeAcA2Bd40', // 测试代币地址
	
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
		
		// 并发控制
		concurrentLimit: 4,
		
		// 批次大小
		batchSize: 49,
		
		// 批次间延迟（毫秒）
		batchDelay: 1000,
		
		// 单次请求间延迟（毫秒）
		requestDelay: 100,
		
		// 失败重试
		maxRetries: 3,
		retryDelay: 500,
		
		// 是否等待确认
		waitForConfirmation: false,
		
		// 测试模式（true=只打印不实际发送）
		testMode: false // 先开启测试模式
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
	
	// 显示空投详情（前10个）
	console.log('\n📋 空投详情 (前10个地址)');
	airdropList.slice(0, 10).forEach((item, i) => {
		console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${item.walletAddress}`);
		console.log(`       🎨 持有NFT: ${item.nftCount}个 | 💰 空投数量: ${item.amount} tokens`);
	});
	
	if (airdropList.length > 10) {
		console.log(`   ... 还有 ${airdropList.length - 10} 个地址 (完整列表见执行过程)`);
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
	
	return holders.map((holder, index) => {
		const nftCount = holder.nftCount;
		const airdropAmount = calculateNFTAirdropAmount(nftCount);
		
		console.log(`   ${(index + 1).toString().padStart(3, ' ')}. ${holder.wallet_address} | NFT: ${nftCount}个 | 空投: ${airdropAmount} tokens`);
		
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

// 发送单个空投（带重试机制）
async function sendSingleAirdrop(airdropData, index, total, retryCount = 0) {
	const { walletAddress, amount, tokenAddress, description, nftCount } = airdropData;
	
	const retryInfo = retryCount > 0 ? ` (重试 ${retryCount}/${CONFIG.execution.maxRetries})` : '';
	console.log(`🚀 [${index + 1}/${total}] ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)} | NFT: ${nftCount} | 发送: ${amount} tokens${retryInfo}`);
	
	if (CONFIG.execution.testMode) {
		await delay(Math.random() * 100);
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
			console.log(`✅ [${index + 1}/${total}] 成功! Hash: ${data.data.transactionHash?.slice(0,8)}...`);
			return {
				success: true,
				data: data.data,
				walletAddress,
				amount,
				nftCount,
				retryCount
			};
		} else {
			if (retryCount < CONFIG.execution.maxRetries) {
				console.log(`⚠️ [${index + 1}/${total}] 失败，准备重试: ${data.message}`);
				await delay(CONFIG.execution.retryDelay);
				return await sendSingleAirdrop(airdropData, index, total, retryCount + 1);
			}
			
			console.log(`❌ [${index + 1}/${total}] 最终失败: ${data.message}`);
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
		if (retryCount < CONFIG.execution.maxRetries) {
			console.log(`⚠️ [${index + 1}/${total}] 网络错误，准备重试: ${error.message}`);
			await delay(CONFIG.execution.retryDelay);
			return await sendSingleAirdrop(airdropData, index, total, retryCount + 1);
		}
		
		console.error(`❌ [${index + 1}/${total}] 网络错误: ${error.message}`);
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
	
	if (CONFIG.execution.testMode) {
		console.log(`🧪 测试模式 - 不会实际发送代币`);
	} else {
		console.log(`🚨 生产模式 - 将发送真实代币!`);
	}
	
	const concurrencyLimiter = new ConcurrencyLimiter(CONFIG.execution.concurrentLimit);
	
	const tasks = airdropList.map((airdropData, index) => {
		return concurrencyLimiter.execute(async () => {
			if (CONFIG.execution.requestDelay > 0) {
				await delay(Math.random() * CONFIG.execution.requestDelay);
			}
			
			try {
				const result = await sendSingleAirdrop(airdropData, index, airdropList.length);
				
				if (result.success) {
					results.success++;
				} else {
					results.failed++;
				}
				results.details.push(result);
				
				const progress = (results.details.length / airdropList.length * 100).toFixed(1);
				console.log(`📊 进度: ${results.details.length}/${airdropList.length} (${progress}%) | 成功: ${results.success} | 失败: ${results.failed}`);
				
				return result;
			} catch (error) {
				console.error(`❌ [${index + 1}/${airdropList.length}] 处理异常: ${error.message}`);
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
	
	console.log(`🚀 开始并发执行 ${tasks.length} 个任务...`);
	await Promise.all(tasks);
	
	results.endTime = Date.now();
	results.totalTime = results.endTime - results.startTime;
	
	// 失败检查
	if (results.failed > 0) {
		console.log(`\n❌ 处理完成后有 ${results.failed} 个失败的交易！`);
		const failures = results.details.filter(r => !r.success);
		failures.forEach((failure, i) => {
			console.log(`${i + 1}. ${failure.walletAddress} (${failure.nftCount} NFTs) - ${failure.error}`);
		});
		console.log(`\n💡 建议: 检查网络状况或重新运行程序`);
		process.exit(1);
	}
	
	// 对账
	if (!CONFIG.execution.testMode && results.success > 0) {
		console.log(`\n🔄 等待 1 分钟后开始自动对账...`);
		await delay(60000);
		
		console.log(`📊 开始自动对账 ${results.success} 个成功的交易...`);
		try {
			const reconcileResponse = await fetch(CONFIG.reconcileUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ limit: results.success + 10 })
			});
			
			const reconcileData = await reconcileResponse.json();
			if (reconcileData.success) {
				console.log(`✅ 对账完成: 成功${reconcileData.data.updatedSuccess}个, 失败${reconcileData.data.updatedFailed}个`);
				results.reconcile = reconcileData.data;
				
				if (reconcileData.data.updatedFailed > 0) {
					console.log(`\n❌ 对账发现 ${reconcileData.data.updatedFailed} 个交易在区块链上失败！`);
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