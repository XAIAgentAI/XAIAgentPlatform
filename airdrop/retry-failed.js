/**
 * 重试失败的空投脚本
 * 专门用于重试之前失败的交易
 */

const fs = require('fs');
const readline = require('readline');

// 配置参数
const RETRY_CONFIG = {
	// 空投接口配置
	apiUrl: 'http://localhost:3000/api/airdrop/dev-send',
	reconcileUrl: 'http://localhost:3000/api/airdrop/dev-send/reconcile',
	tokenAddress: '0x0BB579513DeAB87a247FB0CA8Eff32AeAcA2Bd40', // 新代币地址
	
	// 执行控制
	execution: {
		// 并发控制（减少并发避免nonce冲突）
		concurrentLimit: 1,   // 串行处理避免Gas费用冲突
		
		// 单次请求间延迟（毫秒）
		requestDelay: 2000,   // 增加延迟到2秒，减少Gas费用竞争
		
		// 失败重试
		maxRetries: 5,        // 增加重试次数
		retryDelay: 3000,     // 增加重试延迟到3秒
		
		// 测试模式
		testMode: false
	}
};

// 从数据库获取失败记录的API
const FAILED_RECORDS_API = 'http://localhost:3000/api/airdrop/dev-send/failed';

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

// 从数据库获取失败记录
async function getFailedRecords() {
	try {
		console.log('📊 正在从数据库获取失败记录...');
		const response = await fetch(FAILED_RECORDS_API);
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		const data = await response.json();
		
		if (!data.success) {
			throw new Error(data.message || '获取失败记录失败');
		}
		
		const failedRecords = data.data || [];
		console.log(`✅ 成功获取 ${failedRecords.length} 个失败记录`);
		
		return failedRecords;
		
	} catch (error) {
		console.error('❌ 获取失败记录失败:', error.message);
		console.log('💡 将使用预设的失败地址列表作为备用');
		
		// 备用的失败地址列表
		const backupAddresses = [
			"0xDE8084658cf84880D49509faf97847f5DF0044dA",
			"0x6eBb8B20D34a0e23Fb30807577a3F3c5cFeBB649",
			"0xdD12D01ea1497B348Ad9d91FB63B798cf0a96dA4",
			"0xBf59Dd3f7E4f51bD0A9C56dEa2069a3288574371",
			"0xeC9dC1305ED532B66cad54c096F66DeF6608816C",
			"0x6b2E2D9DACB425c3d1fb287302c18f2CFE76857c",
			"0x426F9808DbdC4C251CcB261BDb64E289CDEc0509",
			"0xd169602e2a9bB5300043FD4eD87ADCb4F3f589bb",
			"0x71173E7F8dB338F314fF938C865C1A4F3b931D45",
			"0x0195747819F48A582880bE39835cDD205D35aC78",
			"0x3FF5DF5CcEB908e03AbC295C1e55EBD89c4eac2f",
			"0x70A11FCa6Ad8F3874738EfA125b81f007CB0Af6D",
			"0xC682337EB0c6287C75A86a718288D436608b2215",
			"0x11d4A13c97c74Fa297aDC8B5c0645de9b9deD838",
			"0xE5A33d43C97Ad268404a448b48E5724b2ea52a55",
			"0x72a0C1EB465a3BC22c9aF1bbd130877c341CCe50",
			"0x712b64a2009D11E4c64269D429b545728a799224",
			"0x6fC0cF344183baa992CBeD7213bc4Fc0d0952495",
			"0x6Dd90D46f62bE582dca4FA006BEfA637b3BB4216",
			"0x6D240909806541df66476EBd91325191BBdD5c44",
			"0x6cEB0cb89F74dEd4e2E800c32Bc9C871EC1909C3",
			"0x6Ca7a3a5e96f7B774FBd8D17bE4cC821f3955E71",
			"0x6BfD117dC3f8a5e69355ae8aA6e0234444874aDb",
			"0x5947c85b554b31326D29f592BB6D8F0eE86f5EA1",
			"0x3336B5FBFFd8759e8207f5B6206420A5bD614FA9",
			"0x35635FB48cDD25d2fd44f9d3119A806209002ec8",
			"0x32163F15f26f98648FF12298752D07789D281c73",
			"0x30AA96a5818ED3E6eC31165f509f7828f85CBEb8",
			"0x2b7294b34E9224ea73bA7a19Fd5aB12e1F87d7A5",
			"0x2a3F65907Fb8B951C7b4e6deDE15A52F1a691611",
			"0x2b9F7B5bFaE42C6F578A4D769B9A96D635788dB6",
			"0x2926a1646c52590f687358cb98C7D2A8168De28c"
		];
		
		return backupAddresses.map(address => ({
			walletAddress: address,
			amount: "50000",
			tokenAddress: RETRY_CONFIG.tokenAddress
		}));
	}
}

// 显示重试确认信息
function displayRetryInfo(failedRecords) {
	console.log('\n' + '='.repeat(80));
	console.log('                        🔄 失败交易重试程序');
	console.log('='.repeat(80));
	
	console.log('\n📊 重试信息');
	console.log(`   代币地址: ${RETRY_CONFIG.tokenAddress}`);
	console.log(`   失败记录数量: ${failedRecords.length} 个`);
	console.log(`   每个地址发送: 50000 tokens`);
	
	console.log('\n⚙️ 优化设置');
	console.log(`   并发数量: ${RETRY_CONFIG.execution.concurrentLimit} (串行处理)`);
	console.log(`   请求延迟: ${RETRY_CONFIG.execution.requestDelay}ms (增加到2秒)`);
	console.log(`   重试延迟: ${RETRY_CONFIG.execution.retryDelay}ms (增加到3秒)`);
	console.log(`   最大重试: ${RETRY_CONFIG.execution.maxRetries} 次`);
	console.log(`   测试模式: ${RETRY_CONFIG.execution.testMode ? '是' : '否'}`);
	
	console.log('\n📋 失败记录列表');
	failedRecords.slice(0, 10).forEach((record, i) => {
		const address = record.walletAddress || record;
		const amount = record.amount || "50000";
		console.log(`   ${(i + 1).toString().padStart(2, ' ')}. ${address} (${amount} tokens)`);
	});
	
	if (failedRecords.length > 10) {
		console.log(`   ... 还有 ${failedRecords.length - 10} 个记录`);
	}
	
	console.log('\n⚠️ 优化措施');
	console.log('   - 🔄 串行处理避免nonce冲突');
	console.log('   - ⏱️ 增加延迟减少Gas费用竞争');
	console.log('   - 🔁 增加重试次数和延迟');
	console.log('   - 💰 系统会自动使用合适的Gas价格');
	console.log('   - 📊 从数据库动态获取失败记录');
	
	console.log('\n' + '='.repeat(80));
	if (RETRY_CONFIG.execution.testMode) {
		console.log('🧪 测试模式 - 按 Enter 键开始测试，Ctrl+C 取消');
	} else {
		console.log('⚠️ 生产模式 - 按 Enter 键确认重试，Ctrl+C 取消');
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
			console.log('✅ 用户已确认，开始重试...\n');
			resolve(true);
		});
	});
}

// 发送单个空投（带重试机制）
async function sendSingleAirdrop(walletAddress, index, total, retryCount = 0) {
	const amount = "50000";
	const description = `XAA Holders LifeGuard Airdrop Retry: ${amount} tokens`;
	
	const retryInfo = retryCount > 0 ? ` (重试 ${retryCount}/${RETRY_CONFIG.execution.maxRetries})` : '';
	console.log(`🔄 [重试${index + 1}/${total}] 发送到 ${walletAddress.slice(0,6)}...${walletAddress.slice(-4)}${retryInfo}`);
	
	if (RETRY_CONFIG.execution.testMode) {
		await delay(Math.random() * 100);
		console.log('🧪 测试模式 - 跳过实际发送');
		return { success: true, test: true, walletAddress, amount };
	}
	
	try {
		const response = await fetch(RETRY_CONFIG.apiUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				walletAddress,
				amount,
				tokenAddress: RETRY_CONFIG.tokenAddress,
				description
			})
		});
		
		const data = await response.json();
		
		if (data.success) {
			console.log(`✅ [重试${index + 1}/${total}] 成功! Hash: ${data.data.transactionHash?.slice(0,8)}...`);
			return {
				success: true,
				data: data.data,
				walletAddress,
				amount,
				retryCount
			};
		} else {
			// 如果失败且还有重试次数，则重试
			if (retryCount < RETRY_CONFIG.execution.maxRetries) {
				console.log(`⚠️ [重试${index + 1}/${total}] 失败，准备重试: ${data.message}`);
				await delay(RETRY_CONFIG.execution.retryDelay);
				return await sendSingleAirdrop(walletAddress, index, total, retryCount + 1);
			}
			
			console.log(`❌ [重试${index + 1}/${total}] 最终失败: ${data.message}`);
			return {
				success: false,
				error: data.message,
				walletAddress,
				amount,
				retryCount
			};
		}
		
	} catch (error) {
		// 如果是网络错误且还有重试次数，则重试
		if (retryCount < RETRY_CONFIG.execution.maxRetries) {
			console.log(`⚠️ [重试${index + 1}/${total}] 网络错误，准备重试: ${error.message}`);
			await delay(RETRY_CONFIG.execution.retryDelay);
			return await sendSingleAirdrop(walletAddress, index, total, retryCount + 1);
		}
		
		console.error(`❌ [重试${index + 1}/${total}] 网络错误: ${error.message}`);
		return {
			success: false,
			error: error.message,
			walletAddress,
			amount,
			retryCount
		};
	}
}

// 处理重试
async function processRetry(failedRecords) {
	const results = {
		total: failedRecords.length,
		success: 0,
		failed: 0,
		details: [],
		startTime: Date.now()
	};
	
	console.log(`\n🔄 开始重试失败的交易...`);
	console.log(`📊 总数: ${results.total}`);
	console.log(`⏱️ 请求延迟: ${RETRY_CONFIG.execution.requestDelay}ms`);
	console.log(`🔄 最大重试: ${RETRY_CONFIG.execution.maxRetries}次`);
	
	if (RETRY_CONFIG.execution.testMode) {
		console.log(`🧪 测试模式 - 不会实际发送代币`);
	} else {
		console.log(`🚨 生产模式 - 将发送真实代币!`);
	}
	
	// 创建并发限制器
	const concurrencyLimiter = new ConcurrencyLimiter(RETRY_CONFIG.execution.concurrentLimit);
	
	// 创建所有任务
	const tasks = failedRecords.map((record, index) => {
		return concurrencyLimiter.execute(async () => {
			// 添加延迟减少Gas费用竞争
			if (RETRY_CONFIG.execution.requestDelay > 0) {
				await delay(RETRY_CONFIG.execution.requestDelay);
			}
			
			try {
				const walletAddress = record.walletAddress || record;
				const result = await sendSingleAirdrop(walletAddress, index, failedRecords.length);
				
				// 更新结果
				if (result.success) {
					results.success++;
				} else {
					results.failed++;
				}
				results.details.push(result);
				
				// 显示实时进度
				const progress = (results.details.length / failedRecords.length * 100).toFixed(1);
				console.log(`📊 进度: ${results.details.length}/${failedRecords.length} (${progress}%) | 成功: ${results.success} | 失败: ${results.failed}`);
				
				return result;
			} catch (error) {
				const walletAddress = record.walletAddress || record;
				console.error(`❌ [重试${index + 1}/${failedRecords.length}] 处理异常: ${error.message}`);
				results.failed++;
				const errorResult = {
					success: false,
					error: error.message,
					walletAddress: walletAddress,
					amount: "50000"
				};
				results.details.push(errorResult);
				return errorResult;
			}
		});
	});
	
	// 等待所有任务完成
	console.log(`🚀 开始串行重试 ${tasks.length} 个失败交易...`);
	await Promise.all(tasks);
	
	results.endTime = Date.now();
	results.totalTime = results.endTime - results.startTime;
	
	return results;
}

// 生成重试报告
function generateRetryReport(results, originalFailedCount) {
	console.log(`\n📋 ========== 重试完成报告 ==========`);
	console.log(`📊 总计重试: ${results.details.length} 个地址`);
	console.log(`✅ 成功: ${results.success} 个`);
	console.log(`❌ 仍然失败: ${results.failed} 个`);
	console.log(`📈 重试成功率: ${(results.success / results.details.length * 100).toFixed(2)}%`);
	
	// 性能统计
	if (results.totalTime) {
		const totalSeconds = results.totalTime / 1000;
		console.log(`⏱️ 总耗时: ${totalSeconds.toFixed(2)} 秒`);
	}
	
	// 计算成功重试的数量
	const totalRetried = results.details
		.filter(r => r.success)
		.reduce((sum, r) => sum + parseFloat(r.amount), 0);
	
	console.log(`💰 成功重试数量: ${totalRetried.toFixed(2)} tokens`);
	
	// 显示仍然失败的地址
	const stillFailed = results.details.filter(r => !r.success);
	if (stillFailed.length > 0) {
		console.log(`\n❌ 仍然失败的地址:`);
		stillFailed.forEach((failure, i) => {
			console.log(`${i + 1}. ${failure.walletAddress} - ${failure.error}`);
		});
		console.log(`\n💡 建议: 这些地址可能需要手动检查或联系技术支持`);
	} else {
		console.log(`\n🎉 所有失败交易都已成功重试！`);
	}
	
	// 保存重试报告
	const reportData = {
		timestamp: new Date().toISOString(),
		config: RETRY_CONFIG,
		originalFailures: originalFailedCount,
		summary: {
			total: results.details.length,
			success: results.success,
			failed: results.failed,
			successRate: results.success / results.details.length,
			totalRetried
		},
		details: results.details
	};
	
	const reportFile = `airdrop-retry-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
	fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
	console.log(`\n📄 重试报告已保存: ${reportFile}`);
}

// 主函数
async function main() {
	console.log('🔄 失败交易重试程序启动...\n');
	
	try {
		// 1. 从数据库获取失败记录
		const failedRecords = await getFailedRecords();
		
		if (failedRecords.length === 0) {
			console.log('🎉 没有发现失败的交易记录！');
			return;
		}
		
		// 2. 显示重试信息
		displayRetryInfo(failedRecords);
		
		// 3. 等待用户确认
		await waitForUserConfirmation();
		
		// 4. 执行重试
		const results = await processRetry(failedRecords);
		
		// 5. 生成报告
		generateRetryReport(results, failedRecords.length);
		
		// 6. 如果还有失败，提示用户
		if (results.failed > 0) {
			console.log(`\n⚠️ 警告: 还有 ${results.failed} 个地址重试失败`);
			console.log(`💡 建议: 检查网络状况、代币余额或联系技术支持`);
			process.exit(1);
		} else {
			console.log(`\n🎉 所有失败交易都已成功重试！`);
			
			// 自动对账
			if (!RETRY_CONFIG.execution.testMode && results.success > 0) {
				console.log(`\n🔄 等待 1 分钟后开始自动对账...`);
				await delay(60000);
				
				console.log(`📊 开始自动对账 ${results.success} 个重试成功的交易...`);
				try {
					const reconcileResponse = await fetch(RETRY_CONFIG.reconcileUrl, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ limit: results.success + 10 })
					});
					
					const reconcileData = await reconcileResponse.json();
					if (reconcileData.success) {
						console.log(`✅ 对账完成: 成功${reconcileData.data.updatedSuccess}个, 失败${reconcileData.data.updatedFailed}个`);
					} else {
						console.log(`⚠️ 对账失败: ${reconcileData.message}`);
					}
				} catch (error) {
					console.log(`⚠️ 对账请求失败: ${error.message}`);
				}
			}
		}
		
	} catch (error) {
		console.error('❌ 重试程序执行失败:', error);
		process.exit(1);
	}
}

// 运行主函数
if (require.main === module) {
	main().catch(console.error);
}

module.exports = {
	RETRY_CONFIG,
	FAILED_RECORDS_API,
	getFailedRecords,
	processRetry,
	displayRetryInfo,
	waitForUserConfirmation
};