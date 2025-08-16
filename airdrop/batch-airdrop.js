/**
 * 批量空投脚本 - 基于native holders数据
 * 使用方法: node batch-airdrop.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 配置参数
const CONFIG = {
	// 数据文件路径
	dataFile: './data/native_holders_pages.json',
	
	// 空投接口配置
	apiUrl: 'http://localhost:3000/api/airdrop/dev-send',
	tokenAddress: '0x0BB579513DeAB87a247FB0CA8Eff32AeAcA2Bd40', // 代币地址
	
	// 空投范围配置
	airdropRange: {
		// 起始位置
		startPage: 1,        // 从第1页开始
		startIndex: 0,       // 页面内从第1个地址开始 (0-based)
		
		// 结束位置  
		endPage: 2,          // 到第2页结束
		endIndex: -1,        // -1表示到页面末尾
		
		// 空投数量
		amountPerAddress: "10000"  // 每个地址发送10000个token
	},
	
	// 执行控制
	execution: {
		// 是否跳过合约地址
		skipContracts: true,
		
		// 批次大小（每批处理多少个）
		batchSize: 5,
		
		// 批次间延迟（毫秒）
		batchDelay: 5000,
		
		// 单次请求间延迟（毫秒）
		requestDelay: 1000,
		
		// 测试模式（true=只打印不实际发送）
		testMode: false
	}
};

// 延迟函数
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// 显示详细的确认信息
function displayConfirmationInfo(airdropList, totalAmount) {
	console.log('\n' + '='.repeat(80));
	console.log('                          🚀 空投执行确认');
	console.log('='.repeat(80));
	
	// 基本信息
	console.log('\n📊 基本信息');
	console.log(`   代币地址: ${CONFIG.tokenAddress}`);
	console.log(`   每个地址发送数量: ${CONFIG.airdropRange.amountPerAddress} tokens`);
	console.log(`   总发送数量: ${totalAmount.toLocaleString()} tokens`);
	console.log(`   发送地址数量: ${airdropList.length.toLocaleString()} 个`);
	
	// 范围信息
	console.log('\n📍 发送范围');
	console.log(`   起始位置: 第${CONFIG.airdropRange.startPage}页第${CONFIG.airdropRange.startIndex + 1}个地址`);
	console.log(`   结束位置: 第${CONFIG.airdropRange.endPage}页第${CONFIG.airdropRange.endIndex + 1}个地址`);
	
	// 执行计划
	console.log('\n📄 执行计划');
	const totalBatches = Math.ceil(airdropList.length / CONFIG.execution.batchSize);
	const estimatedTime = Math.ceil((airdropList.length * CONFIG.execution.requestDelay + 
		totalBatches * CONFIG.execution.batchDelay) / 1000 / 60);
	
	console.log(`   批次大小: ${CONFIG.execution.batchSize} 个/批次`);
	console.log(`   总批次数: ${totalBatches} 批次`);
	console.log(`   请求延迟: ${CONFIG.execution.requestDelay}ms`);
	console.log(`   批次延迟: ${CONFIG.execution.batchDelay}ms`);
	console.log(`   预估执行时间: 约 ${estimatedTime} 分钟`);
	
	// 执行设置
	console.log('\n⚙️ 执行设置');
	console.log(`   跳过合约地址: ${CONFIG.execution.skipContracts ? '是 (只向真人用户发送)' : '否 (也向智能合约发送)'}`);
	console.log(`   测试模式: ${CONFIG.execution.testMode ? '是 (不会实际发送)' : '否 (将实际发送)'}`);
	
	// 执行环境
	console.log('\n⚙️ 执行环境');
	console.log(`   API地址: ${CONFIG.apiUrl}`);
	console.log(`   当前目录: ${process.cwd()}`);
	console.log(`   数据文件: ${CONFIG.dataFile}`);
	
	// 显示所有空投地址详情
	console.log('\n📋 详细空投列表');
	airdropList.forEach((item, i) => {
		const holdingAmount = (parseFloat(item.originalHolding) / 1e18).toFixed(2);
		console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${item.walletAddress}`);
		console.log(`       📍 位置: 第${item.pageNumber}页第${item.indexInPage + 1}个 | 💰 发送: ${item.amount} tokens | 📊 持有: ${holdingAmount}`);
	});
	
	// 风险提示
	console.log('\n⚠️  重要提示');
	if (!CONFIG.execution.testMode) {
		console.log('   - 🔴 此操作将发送真实的代币，不可撤销！');
		console.log('   - 🔴 请确保代币地址和数量设置正确');
		console.log('   - 🔴 建议先设置 testMode: true 进行测试');
	} else {
		console.log('   - 🟡 当前为测试模式，不会实际发送代币');
	}
	console.log('   - 📱 执行期间请勿关闭程序');
	console.log('   - 💡 可以使用 Ctrl+C 随时取消操作');
	
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

		// 监听 Ctrl+C
		process.on('SIGINT', () => {
			console.log('\n\n❌ 用户取消操作');
			rl.close();
			process.exit(0);
		});

		// 等待用户按 Enter
		rl.question('', () => {
			rl.close();
			console.log('✅ 用户已确认，开始执行...\n');
			resolve(true);
		});
	});
}

// 加载数据文件
function loadHoldersData() {
	try {
		const dataPath = path.resolve(__dirname, CONFIG.dataFile);
		console.log(`📁 加载数据文件: ${dataPath}`);
		
		const rawData = fs.readFileSync(dataPath, 'utf8');
		const pagesData = JSON.parse(rawData);
		
		// 统计总数据
		let totalHolders = 0;
		pagesData.forEach(page => {
			if (page.status === 'ok' && page.data) {
				totalHolders += page.data.length;
			}
		});
		
		console.log(`📊 总共加载了 ${pagesData.length} 页数据，包含 ${totalHolders} 个持有者`);
		return pagesData;
		
	} catch (error) {
		console.error('❌ 加载数据文件失败:', error.message);
		process.exit(1);
	}
}

// 根据页面范围提取指定的地址
function extractAddressesByRange(pagesData) {
	const { startPage, startIndex, endPage, endIndex } = CONFIG.airdropRange;
	const selectedAddresses = [];
	
	console.log(`📍 提取范围: 第${startPage}页第${startIndex + 1}个 到 第${endPage}页第${endIndex + 1}个`);
	
	for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
		const pageData = pagesData.find(p => p.page === pageNum);
		
		if (!pageData || pageData.status !== 'ok' || !pageData.data) {
			console.log(`⚠️ 第${pageNum}页数据不可用，跳过`);
			continue;
		}
		
		let startIdx = 0;
		let endIdx = pageData.data.length - 1;
		
		// 如果是起始页，使用指定的起始索引
		if (pageNum === startPage) {
			startIdx = startIndex;
		}
		
		// 如果是结束页，使用指定的结束索引
		if (pageNum === endPage) {
			endIdx = endIndex === -1 ? pageData.data.length - 1 : endIndex;
		}
		
		console.log(`📄 第${pageNum}页: 提取第${startIdx + 1}-${endIdx + 1}个地址`);
		
		for (let i = startIdx; i <= endIdx && i < pageData.data.length; i++) {
			const holder = pageData.data[i];
			
			// 基本验证
			if (!holder.wallet_address || !holder.wallet_address.match(/^0x[a-fA-F0-9]{40}$/)) {
				console.log(`⚠️ 跳过无效地址: ${holder.wallet_address || 'undefined'}`);
				continue;
			}
			
			// 跳过合约地址（如果配置了）
			if (CONFIG.execution.skipContracts && holder.is_contract) {
				console.log(`⚠️ 跳过合约地址: ${holder.wallet_address}`);
				continue;
			}
			
			selectedAddresses.push({
				...holder,
				pageNumber: pageNum,
				indexInPage: i,
				globalIndex: selectedAddresses.length
			});
		}
	}
	
	console.log(`✅ 总共提取了 ${selectedAddresses.length} 个地址`);
	return selectedAddresses;
}

// 准备空投数据
function prepareAirdropData(holders) {
	return holders.map((holder, index) => {
		const airdropAmount = CONFIG.airdropRange.amountPerAddress;
		
		return {
			walletAddress: holder.wallet_address,
			amount: airdropAmount,
			tokenAddress: CONFIG.tokenAddress,
			description: `Targeted airdrop: ${airdropAmount} tokens (Page ${holder.pageNumber}, Index ${holder.indexInPage + 1})`,
			originalHolding: holder.amount,
			pageNumber: holder.pageNumber,
			indexInPage: holder.indexInPage,
			globalIndex: index + 1
		};
	});
}

// 发送单个空投
async function sendSingleAirdrop(airdropData, index, total) {
	const { walletAddress, amount, tokenAddress, description, pageNumber, indexInPage } = airdropData;
	
	console.log(`\n🚀 [${index + 1}/${total}] 发送空投到 ${walletAddress}`);
	console.log(`📍 位置: 第${pageNumber}页第${indexInPage + 1}个地址`);
	console.log(`💰 数量: ${amount} tokens`);
	
	if (CONFIG.execution.testMode) {
		console.log('🧪 测试模式 - 跳过实际发送');
		return { success: true, test: true };
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
			console.log(`✅ 成功! 交易哈希: ${data.data.transactionHash}`);
			return {
				success: true,
				data: data.data,
				walletAddress,
				amount
			};
		} else {
			console.log(`❌ 失败: ${data.message}`);
			return {
				success: false,
				error: data.message,
				walletAddress,
				amount
			};
		}
		
	} catch (error) {
		console.error(`❌ 请求错误: ${error.message}`);
		return {
			success: false,
			error: error.message,
			walletAddress,
			amount
		};
	}
}

// 批量处理空投
async function processBatchAirdrops(airdropList) {
	const results = {
		total: airdropList.length,
		success: 0,
		failed: 0,
		details: []
	};
	
	console.log(`\n🎯 开始批量空投处理...`);
	console.log(`📊 总数: ${results.total}`);
	console.log(`⚙️ 批次大小: ${CONFIG.execution.batchSize}`);
	console.log(`⏱️ 批次延迟: ${CONFIG.execution.batchDelay}ms`);
	console.log(`⏱️ 请求延迟: ${CONFIG.execution.requestDelay}ms`);
	
	if (CONFIG.execution.testMode) {
		console.log(`🧪 测试模式 - 不会实际发送代币`);
	} else {
		console.log(`🚨 生产模式 - 将发送真实代币!`);
	}
	
	// 限制处理数量
	let processCount = results.total;
	if (CONFIG.execution.maxProcessCount > 0) {
		processCount = Math.min(processCount, CONFIG.execution.maxProcessCount);
		console.log(`🔢 限制处理数量: ${processCount}`);
	}
	
	for (let i = 0; i < processCount; i += CONFIG.execution.batchSize) {
		const batchEnd = Math.min(i + CONFIG.execution.batchSize, processCount);
		const currentBatch = airdropList.slice(i, batchEnd);
		
		console.log(`\n📦 处理批次 ${Math.floor(i / CONFIG.execution.batchSize) + 1}: 第${i + 1}-${batchEnd}个`);
		
		// 处理当前批次
		for (let j = 0; j < currentBatch.length; j++) {
			const airdropData = currentBatch[j];
			const globalIndex = i + j;
			
			const result = await sendSingleAirdrop(airdropData, globalIndex, processCount);
			results.details.push(result);
			
			if (result.success) {
				results.success++;
			} else {
				results.failed++;
			}
			
			// 请求间延迟
			if (j < currentBatch.length - 1) {
				await delay(CONFIG.execution.requestDelay);
			}
		}
		
		// 批次间延迟
		if (batchEnd < processCount) {
			console.log(`⏳ 等待 ${CONFIG.execution.batchDelay}ms 后处理下一批次...`);
			await delay(CONFIG.execution.batchDelay);
		}
	}
	
	return results;
}

// 生成报告
function generateReport(results, airdropList) {
	console.log(`\n📋 ========== 批量空投完成报告 ==========`);
	console.log(`📊 总计处理: ${results.details.length} 个地址`);
	console.log(`✅ 成功: ${results.success} 个`);
	console.log(`❌ 失败: ${results.failed} 个`);
	console.log(`📈 成功率: ${(results.success / results.details.length * 100).toFixed(2)}%`);
	
	// 计算总空投数量
	const totalAirdropped = results.details
		.filter(r => r.success)
		.reduce((sum, r) => sum + parseFloat(r.amount), 0);
	
	console.log(`💰 总空投数量: ${totalAirdropped.toFixed(2)} tokens`);
	
	// 显示失败的地址
	const failures = results.details.filter(r => !r.success);
	if (failures.length > 0) {
		console.log(`\n❌ 失败地址详情:`);
		failures.forEach((failure, i) => {
			console.log(`${i + 1}. ${failure.walletAddress} - ${failure.error}`);
		});
	}
	
	// 保存详细报告
	const reportData = {
		timestamp: new Date().toISOString(),
		config: CONFIG,
		summary: {
			total: results.details.length,
			success: results.success,
			failed: results.failed,
			successRate: results.success / results.details.length,
			totalAirdropped
		},
		details: results.details
	};
	
	const reportFile = `airdrop-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
	fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
	console.log(`\n📄 详细报告已保存: ${reportFile}`);
}

// 主函数
async function main() {
	console.log('🎯 批量空投程序启动...\n');
	
	// 显示配置
	console.log('⚙️ 当前配置:');
	console.log(`   代币地址: ${CONFIG.tokenAddress}`);
	console.log(`   发送范围: 第${CONFIG.airdropRange.startPage}页第${CONFIG.airdropRange.startIndex + 1}个 到 第${CONFIG.airdropRange.endPage}页第${CONFIG.airdropRange.endIndex + 1}个`);
	console.log(`   每个地址发送: ${CONFIG.airdropRange.amountPerAddress} tokens`);
	console.log(`   跳过合约: ${CONFIG.execution.skipContracts}`);
	console.log(`   测试模式: ${CONFIG.execution.testMode}`);
	console.log(`   批次大小: ${CONFIG.execution.batchSize}`);
	
	try {
		// 1. 加载数据
		const pagesData = loadHoldersData();
		
		// 2. 根据范围提取地址
		const selectedAddresses = extractAddressesByRange(pagesData);
		
		if (selectedAddresses.length === 0) {
			console.log('⚠️ 指定范围内没有可用的地址，程序退出');
			return;
		}
		
		// 3. 准备空投数据
		const airdropList = prepareAirdropData(selectedAddresses);
		
		// 4. 计算总空投数量
		const totalAmount = airdropList.reduce((sum, item) => sum + parseFloat(item.amount), 0);
		
		// 5. 显示详细确认信息
		displayConfirmationInfo(airdropList, totalAmount);
		
		// 6. 等待用户确认
		await waitForUserConfirmation();
		
		// 7. 执行批量空投
		const results = await processBatchAirdrops(airdropList);
		
		// 8. 生成报告
		generateReport(results, airdropList);
		
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
	loadHoldersData,
	extractAddressesByRange,
	prepareAirdropData,
	processBatchAirdrops,
	displayConfirmationInfo,
	waitForUserConfirmation
};