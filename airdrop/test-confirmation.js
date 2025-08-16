/**
 * 测试确认机制演示脚本
 * 使用方法: node test-confirmation.js
 */

const { 
	CONFIG,
	loadHoldersData,
	filterEligibleHolders,
	prepareAirdropData
} = require('./batch-airdrop.js');

async function testConfirmation() {
	console.log('🧪 测试确认机制演示...\n');
	
	// 临时修改配置为测试模式
	const originalTestMode = CONFIG.execution.testMode;
	const originalMaxProcess = CONFIG.execution.maxProcessCount;
	
	CONFIG.execution.testMode = true;  // 启用测试模式
	CONFIG.execution.maxProcessCount = 5;  // 限制处理5个地址用于演示
	
	try {
		// 1. 加载数据
		console.log('📁 加载测试数据...');
		const allHolders = loadHoldersData();
		
		// 2. 过滤符合条件的holder
		const eligibleHolders = filterEligibleHolders(allHolders);
		
		if (eligibleHolders.length === 0) {
			console.log('⚠️ 没有符合条件的地址');
			return;
		}
		
		// 3. 准备空投数据（只取前5个用于演示）
		const airdropList = prepareAirdropData(eligibleHolders.slice(0, 5));
		
		// 4. 计算总空投数量
		const totalAmount = airdropList.reduce((sum, item) => sum + parseFloat(item.amount), 0);
		
		// 导入确认函数
		const { displayConfirmationInfo, waitForUserConfirmation } = require('./batch-airdrop.js');
		
		// 5. 显示确认信息
		displayConfirmationInfo(airdropList, totalAmount);
		
		// 6. 等待用户确认
		await waitForUserConfirmation();
		
		console.log('✅ 确认机制测试完成！');
		console.log('💡 在实际使用时，确认后将开始执行空投流程');
		
	} catch (error) {
		console.error('❌ 测试失败:', error.message);
	} finally {
		// 恢复原始配置
		CONFIG.execution.testMode = originalTestMode;
		CONFIG.execution.maxProcessCount = originalMaxProcess;
	}
}

// 运行测试
if (require.main === module) {
	testConfirmation().catch(console.error);
}

module.exports = { testConfirmation };