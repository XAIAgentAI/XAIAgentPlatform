/**
 * 简单测试脚本 - 开发环境空投接口 (CommonJS版本)
 * 使用方法: node simple-test-cjs.js
 */

// 测试数据
const TEST_DATA = {
	walletAddress: '0xf3851DE68b2Ac824B1D4c85878df76e7cE2bD808',
	amount: '25',
	tokenAddress: '0x8a88a1D2bD0a13BA245a4147b7e11Ef1A9d15C8a',
	description: '简单测试空投'
};

const BASE_URL = 'http://localhost:3000/api/airdrop/dev-send';

// 延迟函数
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试提交接口
async function testSubmit() {
	console.log('🚀 测试提交空投接口...');
	console.log('📝 数据:', JSON.stringify(TEST_DATA, null, 2));
	
	try {
		const response = await fetch(BASE_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(TEST_DATA)
		});
		
		const data = await response.json();
		console.log('📊 状态码:', response.status);
		console.log('📋 响应:', JSON.stringify(data, null, 2));
		
		if (data.success) {
			console.log('✅ 提交成功!');
			return data.data.recordId;
		} else {
			console.log('❌ 提交失败:', data.message);
			return null;
		}
	} catch (error) {
		console.error('❌ 请求错误:', error.message);
		return null;
	}
}

// 测试对账接口
async function testReconcile() {
	console.log('\n🔄 测试对账接口...');
	
	try {
		const response = await fetch(`${BASE_URL}/reconcile`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ limit: 30 })
		});
		
		const data = await response.json();
		console.log('📊 状态码:', response.status);
		console.log('📋 响应:', JSON.stringify(data, null, 2));
		
		if (data.success) {
			console.log('✅ 对账成功!');
			console.log(`📊 处理结果: 总数=${data.data.total}, 成功=${data.data.updatedSuccess}, 失败=${data.data.updatedFailed}, 待处理=${data.data.stillPending}`);
		} else {
			console.log('❌ 对账失败:', data.message);
		}
	} catch (error) {
		console.error('❌ 请求错误:', error.message);
	}
}

// 测试查询接口
async function testQuery() {
	console.log('\n📋 测试查询接口...');
	
	try {
		const response = await fetch(`${BASE_URL}?limit=3`);
		const data = await response.json();
		
		console.log('📊 状态码:', response.status);
		
		if (data.success) {
			console.log('✅ 查询成功!');
			console.log(`📊 总记录数: ${data.data.pagination.totalCount}`);
			console.log(`📋 当前页记录数: ${data.data.records.length}`);
			
			// 显示记录摘要
			data.data.records.forEach((record, i) => {
				console.log(`${i + 1}. ${record.walletAddress.slice(0, 10)}... -> ${record.amount} tokens (${record.status})`);
			});
		} else {
			console.log('❌ 查询失败:', data.message);
		}
	} catch (error) {
		console.error('❌ 请求错误:', error.message);
	}
}

// 主测试流程
async function runTest() {
	console.log('🧪 开始测试开发环境空投接口...\n');
	
	// 1. 提交空投
	const recordId = await testSubmit();
	
	// 2. 等待处理
	if (recordId) {
		console.log('\n⏳ 等待3秒让交易处理...');
		await delay(3000);
	}
	
	// 3. 查询当前状态
	await testQuery();
	
	// 4. 执行对账
	await testReconcile();
	
	// 5. 再次查询
	console.log('\n⏳ 等待2秒后再次查询...');
	await delay(2000);
	await testQuery();
	
	console.log('\n🎉 测试完成!');
}

// 运行测试
runTest().catch(console.error); 