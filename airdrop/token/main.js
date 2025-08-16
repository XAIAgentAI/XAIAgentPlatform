// 代币爬取主流程脚本
// 按顺序执行：爬取 -> 检查 -> 重试 -> 最终检查
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const { scrapeTokenHolders } = require('./token-holders-scraper');

const execAsync = promisify(exec);

console.log('🔍 token/main.js 开始加载...');

// 从config.js中读取配置
const { CONFIG } = require('./config');

console.log('🔍 CONFIG已定义，MAX_HOLDERS:', CONFIG.MAX_HOLDERS);

// 检查是否直接运行此脚本
if (require.main === module) {
    console.log('=== 代币爬取主流程开始 ===');
    console.log('目标代币地址:', CONFIG.TOKEN_ADDRESS);
    console.log('目标文件:', CONFIG.OUTPUT_PATH);
    console.log('目标条数:', CONFIG.MAX_HOLDERS.toLocaleString());
    console.log('排除合约地址:', CONFIG.EXCLUDE_CONTRACTS ? '是' : '否');
    console.log('保存合约地址:', CONFIG.SAVE_CONTRACTS ? '是' : '否');
    console.log('排除地址数量:', CONFIG.EXCLUDE_ADDRESSES.length);
}

// 执行命令的通用函数
async function runCommand(command, description) {
    console.log(`\n🔄 ${description}...`);
    console.log(`执行命令: ${command}`);
    
    try {
        const { stdout, stderr } = await execAsync(command, { cwd: __dirname });
        
        if (stdout) {
            console.log('输出:', stdout);
        }
        if (stderr) {
            console.log('警告:', stderr);
        }
        
        console.log(`✅ ${description} 完成`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} 失败:`, error.message);
        return false;
    }
}

// 执行爬取的函数
async function executeScraping() {
    console.log('\n=== 开始执行代币爬取 ===');
    console.log('目标代币地址:', CONFIG.TOKEN_ADDRESS);
    console.log('输出文件路径:', CONFIG.OUTPUT_PATH);
    console.log('每页数据条数:', CONFIG.ITEMS_COUNT);
    console.log('请求延迟:', CONFIG.REQUEST_DELAY + 'ms');
    console.log('最大爬取条数:', CONFIG.MAX_HOLDERS.toLocaleString());
    console.log('预计需要页数:', Math.ceil(CONFIG.MAX_HOLDERS / CONFIG.ITEMS_COUNT));
    console.log('排除合约地址:', CONFIG.EXCLUDE_CONTRACTS ? '是' : '否');
    console.log('保存合约地址:', CONFIG.SAVE_CONTRACTS ? '是' : '否');
    if (CONFIG.EXCLUDE_ADDRESSES?.length) {
        console.log('排除地址数量:', CONFIG.EXCLUDE_ADDRESSES.length);
    }

    try {
        const result = await scrapeTokenHolders(
            CONFIG.TOKEN_ADDRESS,
            CONFIG.OUTPUT_PATH,
            {
                itemsCount: CONFIG.ITEMS_COUNT,
                requestDelay: CONFIG.REQUEST_DELAY,
                verbose: CONFIG.VERBOSE,
                clearExisting: true,
                maxHolders: CONFIG.MAX_HOLDERS,
                excludeContracts: CONFIG.EXCLUDE_CONTRACTS,
                saveContracts: CONFIG.SAVE_CONTRACTS,
                excludeAddresses: CONFIG.EXCLUDE_ADDRESSES
            }
        );

        // 输出爬取结果
        console.log('\n=== 爬取完成 ===');
        console.log('成功状态:', result.success);
        console.log('总页数:', result.totalPages);
        console.log('总持有者数:', result.totalHolders.toLocaleString());
        console.log('目标条数:', CONFIG.MAX_HOLDERS.toLocaleString());
        
        if (result.totalHolders >= CONFIG.MAX_HOLDERS) {
            console.log('✅ 已达到目标条数限制，爬取完成！');
        } else {
            console.log('⚠️  未达到目标条数，可能数据已全部获取完毕');
        }
        
        if (result.errors.length > 0) {
            console.log('错误信息:');
            result.errors.forEach(error => console.log('- ' + error));
        }
        
        if (result.success) {
            console.log('✅ 数据爬取成功完成！');
        } else {
            console.log('⚠️  数据爬取完成，但存在一些错误');
        }

        return result.success;
        
    } catch (error) {
        console.error('❌ 爬取执行失败:', error.message);
        return false;
    }
}

// 主流程函数
async function main() {
    try {
        console.log('\n📋 开始执行代币爬取主流程...');
        
        // 步骤1: 执行爬取
        console.log('\n=== 步骤 1: 执行爬取 ===');
        const scrapeSuccess = await executeScraping();
        
        if (!scrapeSuccess) {
            console.log('⚠️  爬取失败，但继续执行后续步骤...');
        }
        
        // 等待一下让文件写入完成
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 步骤2: 检查数据状态
        console.log('\n=== 步骤 2: 检查数据状态 ===');
        const checkSuccess = await runCommand(
            'node ../utils/02-check-status.js',
            '数据状态检查'
        );
        
        if (!checkSuccess) {
            console.log('⚠️  状态检查失败，但继续执行后续步骤...');
        }
        
        // 步骤3: 重试失败页面（如果有的话）
        console.log('\n=== 步骤 3: 重试失败页面 ===');
        const retrySuccess = await runCommand(
            'node ../utils/03-retry-failed.js',
            '失败页面重试'
        );
        
        if (!retrySuccess) {
            console.log('⚠️  重试失败，但继续执行后续步骤...');
        }
        
        // 等待重试完成
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 步骤4: 最终状态检查
        console.log('\n=== 步骤 4: 最终状态检查 ===');
        const finalCheckSuccess = await runCommand(
            'node ../utils/02-check-status.js',
            '最终数据状态检查'
        );
        
        // 总结报告
        console.log('\n=== 🎯 主流程执行总结 ===');
        console.log(`爬取: ${scrapeSuccess ? '✅ 成功' : '❌ 失败'}`);
        console.log(`状态检查: ${checkSuccess ? '✅ 成功' : '❌ 失败'}`);
        console.log(`重试: ${retrySuccess ? '✅ 成功' : '❌ 失败'}`);
        console.log(`最终检查: ${finalCheckSuccess ? '✅ 成功' : '❌ 失败'}`);
        
        if (scrapeSuccess && finalCheckSuccess) {
            console.log('\n🎉 主流程执行完成！建议检查最终的数据文件。');
        } else {
            console.log('\n⚠️  主流程执行完成，但存在一些问题，请检查日志。');
        }
        
        // 显示最终文件信息
        const fs = require('fs');
        if (fs.existsSync(CONFIG.OUTPUT_PATH)) {
            const stats = fs.statSync(CONFIG.OUTPUT_PATH);
            const fileSize = (stats.size / 1024 / 1024).toFixed(2);
            console.log(`\n📁 输出文件: ${CONFIG.OUTPUT_PATH}`);
            console.log(`📊 文件大小: ${fileSize} MB`);
            console.log(`🕒 最后修改: ${stats.mtime.toLocaleString()}`);
        }
        
    } catch (error) {
        console.error('❌ 主流程执行过程中发生错误:', error.message);
        process.exit(1);
    }
}

// 导出CONFIG对象供其他脚本使用
module.exports = { CONFIG };

// 只在直接运行此脚本时执行主流程
if (require.main === module) {
    // 执行主流程
    main().catch(error => {
        console.error('❌ 主流程执行失败:', error);
        process.exit(1);
    });
} 