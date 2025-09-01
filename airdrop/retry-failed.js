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
	tokenAddress: '0x861100195D26bf1e115a40337bba22f000fa6871', // 空投代币地址
	
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
		
		// 备用的失败地址列表（来自最近的失败记录）
		const backupAddresses = [
			"0x2e982Bbb986370d97190164134b5fa9B23eaF0Cd",
			"0xC11D9eB68EF34c096BeD010129B0d762A92f1b03",
			"0x31cbCd7182557337f32B629B00caA0F4899C218d",
			"0x2a72570737bC720dE79a003A0229a137B9D1A981",
			"0x3c5ee1463aC87979E44d4c52ac43B29250ca4F04",
			"0x374B563A12DBC2ff77985119daC6f70d6e18FE23",
			"0x269687A117667509378506d189159a5Fec71A81c",
			"0xE06D803c64209221e4E6C9E0C2eCfc5a545b955E",
			"0x7a70860D13d9BCddc13139459CBd98e9bc0432b2",
			"0x860aC1Ab5C3dd546BE8B7022443A5d7cCa0Cc3B4",
			"0xee1FD8D1cb7Fb2De2b8f93F5cb21CB5Ac72fb110",
			"0x0cb21E93d8B024F44806C955286E262D4349f26a",
			"0xd9bfa77631b3B1b000E3aFD3C2fc4970AF155EBE",
			"0xC3D1D9819fe97058a8C11E5eb050551E4Cae71E7",
			"0x0a265628dba447B2385EB10305f4c329Fc051F46",
			"0xFc2769498e022DD732475d262518E2fC33b5A41C",
			"0x36e9bEf30c9272B7680B2fa7AA9537810Cd64870",
			"0x5A29DE4bBCf5499780572Bd348e69c3455522Cb0",
			"0xc7bEA0A8EEaB3bb24113683833155A966F1E02d7"
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