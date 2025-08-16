// 检查数据状态的脚本
const fs = require('fs');
const path = require('path');

// 数据文件路径
const DATA_PATH = path.join(__dirname, '..', 'data', 'native_holders_pages.json');

console.log('数据状态检查脚本开始执行...');
console.log('数据文件路径:', DATA_PATH);

// 读取现有数据
function readExistingData() {
    try {
        if (fs.existsSync(DATA_PATH)) {
            const data = fs.readFileSync(DATA_PATH, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('读取数据文件失败:', error);
    }
    return [];
}

// 主函数
function main() {
    try {
        // 读取现有数据
        const existingData = readExistingData();
        if (existingData.length === 0) {
            console.log('没有找到数据文件或文件为空');
            return;
        }
        
        console.log(`\n=== 数据状态统计 ===`);
        console.log(`总共找到 ${existingData.length} 页数据`);
        
        // 按状态分组
        const successfulPages = existingData.filter(item => item.status === "ok");
        const failedPages = existingData.filter(item => item.status === "failed");
        
        console.log(`\n成功页面: ${successfulPages.length} 页`);
        if (successfulPages.length > 0) {
            console.log('页码:', successfulPages.map(p => p.page).join(', '));
        }
        
        console.log(`\n失败页面: ${failedPages.length} 页`);
        if (failedPages.length > 0) {
            console.log('页码:', failedPages.map(p => p.page).join(', '));
            console.log('\n失败详情:');
            failedPages.forEach(page => {
                console.log(`  第 ${page.page} 页: ${page.error || '未知错误'}`);
            });
        }
        
        // 统计总数据量
        const totalHolders = successfulPages.reduce((sum, page) => {
            return sum + (page.data ? page.data.length : 0);
        }, 0);
        
        console.log(`\n=== 数据量统计 ===`);
        console.log(`总持有者数量: ${totalHolders}`);
        
        // 检查数据完整性
        const pageNumbers = existingData.map(item => item.page).sort((a, b) => a - b);
        const expectedPages = [];
        for (let i = 1; i <= Math.max(...pageNumbers); i++) {
            expectedPages.push(i);
        }
        
        const missingPages = expectedPages.filter(page => !pageNumbers.includes(page));
        if (missingPages.length > 0) {
            console.log(`\n=== 缺失页面 ===`);
            console.log('缺失的页码:', missingPages.join(', '));
        }
        
        // 显示每页的数据量
        console.log(`\n=== 每页数据量 ===`);
        existingData.forEach(page => {
            const dataCount = page.data ? page.data.length : 0;
            const status = page.status === "ok" ? "✓" : "✗";
            console.log(`第 ${page.page} 页 [${status}]: ${dataCount} 条数据`);
        });
        
        // 计算完成度
        const completionRate = (successfulPages.length / existingData.length * 100).toFixed(2);
        console.log(`\n=== 完成度 ===`);
        console.log(`数据完成度: ${completionRate}%`);
        
        if (failedPages.length > 0) {
            console.log(`\n建议运行重试脚本: node retry_failed_pages.js`);
        }
        
    } catch (error) {
        console.error('检查过程中发生错误:', error);
    }
}

main(); 