/**
 * 查看失败交易脚本
 * 只显示失败的地址和个数，不进行重试
 */

// 从数据库获取失败记录的API
const FAILED_RECORDS_API = 'http://localhost:3000/api/airdrop/dev-send/failed';

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
		return failedRecords;
		
	} catch (error) {
		console.error('❌ 获取失败记录失败:', error.message);
		console.log('💡 将使用控制台输出的失败地址列表');
		
		// 从控制台输出提取的失败地址列表
		const consoleFailedAddresses = [
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
		
		return consoleFailedAddresses.map(address => ({
			walletAddress: address,
			amount: "50000",
			status: "failed",
			error: "replacement transaction underpriced (from console)"
		}));
	}
}

// 显示失败记录信息
function displayFailedRecords(failedRecords) {
	console.log('\n' + '='.repeat(80));
	console.log('                        ❌ 失败交易统计');
	console.log('='.repeat(80));
	
	console.log('\n📊 统计信息');
	console.log(`   失败交易总数: ${failedRecords.length} 个`);
	console.log(`   涉及代币: 0x0BB579513DeAB87a247FB0CA8Eff32AeAcA2Bd40`);
	console.log(`   每个地址数量: 50000 tokens`);
	console.log(`   总损失数量: ${(failedRecords.length * 50000).toLocaleString()} tokens`);
	
	console.log('\n📋 失败地址列表');
	console.log('序号  钱包地址                                       数量      状态');
	console.log('─'.repeat(80));
	
	failedRecords.forEach((record, i) => {
		const address = record.walletAddress || record;
		const amount = record.amount || "50000";
		const status = record.status || "failed";
		const displayAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
		
		console.log(`${(i + 1).toString().padStart(3, ' ')}.  ${address}  ${amount.padStart(8, ' ')}   ${status}`);
	});
	
	console.log('─'.repeat(80));
	console.log(`总计: ${failedRecords.length} 个失败地址`);
	
	// 分析错误类型
	const errorTypes = {};
	failedRecords.forEach(record => {
		const error = record.error || record.errorMessage || "replacement transaction underpriced";
		const errorType = error.includes('underpriced') ? 'Gas费用过低' : 
						  error.includes('nonce') ? 'Nonce冲突' :
						  error.includes('insufficient') ? '余额不足' : '其他错误';
		errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
	});
	
	if (Object.keys(errorTypes).length > 0) {
		console.log('\n📈 错误类型分析');
		Object.entries(errorTypes).forEach(([type, count]) => {
			console.log(`   ${type}: ${count} 个 (${(count/failedRecords.length*100).toFixed(1)}%)`);
		});
	}
	
	console.log('\n💡 主要失败原因');
	console.log('   - replacement transaction underpriced: Gas费用设置过低');
	console.log('   - 并发交易导致的nonce冲突');
	console.log('   - 网络拥堵时的交易竞争');
	
	console.log('\n🔧 建议解决方案');
	console.log('   1. 使用重试脚本: node airdrop/retry-failed.js');
	console.log('   2. 降低并发数量，增加交易延迟');
	console.log('   3. 提高Gas价格设置');
	console.log('   4. 分批次处理，避免网络拥堵');
}

// 主函数
async function main() {
	console.log('📊 失败交易查看程序启动...\n');
	
	try {
		// 获取失败记录
		const failedRecords = await getFailedRecords();
		
		if (failedRecords.length === 0) {
			console.log('🎉 没有发现失败的交易记录！');
			return;
		}
		
		// 显示失败记录信息
		displayFailedRecords(failedRecords);
		
		// 保存到文件（可选）
		const fs = require('fs');
		const reportData = {
			timestamp: new Date().toISOString(),
			total: failedRecords.length,
			tokenAddress: "0x0BB579513DeAB87a247FB0CA8Eff32AeAcA2Bd40",
			amountPerAddress: "50000",
			totalLoss: failedRecords.length * 50000,
			failedAddresses: failedRecords
		};
		
		const reportFile = `failed-addresses-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
		fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
		console.log(`\n📄 失败地址列表已保存: ${reportFile}`);
		
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
	getFailedRecords,
	displayFailedRecords
};