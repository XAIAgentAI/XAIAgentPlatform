// 重试失败页面的脚本
const fs = require('fs');
const path = require('path');

// 如果 Node.js 版本低于 18，需要导入 fetch
if (typeof fetch === 'undefined') {
    console.log('当前 Node.js 版本不支持 fetch，请升级到 Node.js 18+ 或安装 node-fetch');
    process.exit(1);
}

// 目标代币合约地址
const TOKEN_ADDRESS = '0x16d83F6B17914a4e88436251589194CA5AC0f452';
// DBCScan 持有者 API
const BASE_URL = `https://www.dbcscan.io/api/v2/tokens/${TOKEN_ADDRESS}/holders`;
// 数据文件路径
const DATA_PATH = path.join(__dirname, '..', 'data', 'native_holders_pages.json');

console.log('重试脚本开始执行...');
console.log('目标代币地址:', TOKEN_ADDRESS);
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

// 保存数据到文件的函数
function savePageToFile(pageData) {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // 读取现有数据
        const existingData = readExistingData();
        
        // 检查是否已存在该页数据，如果存在则替换，否则追加
        const existingIndex = existingData.findIndex(item => item.page === pageData.page);
        if (existingIndex !== -1) {
            existingData[existingIndex] = pageData;
            console.log(`更新第 ${pageData.page} 页数据`);
        } else {
            existingData.push(pageData);
            console.log(`添加第 ${pageData.page} 页数据`);
        }
        
        fs.writeFileSync(DATA_PATH, JSON.stringify(existingData, null, 2), 'utf-8');
        console.log(`已保存第 ${pageData.page} 页数据到 ${DATA_PATH}`);
    } catch (error) {
        console.error('保存文件时出错:', error);
    }
}

// 获取第一页数据
async function fetchFirstPage() {
    console.log('正在获取第一页数据...');
    try {
        const res = await fetch(BASE_URL);
        console.log('API 响应状态:', res.status);
        if (!res.ok) throw new Error('网络请求失败: ' + res.status);
        const data = await res.json();
        console.log(`第一页获取到 ${data.items?.length || 0} 条数据`);
        return data;
    } catch (error) {
        console.error('获取第一页数据时出错:', error);
        throw error;
    }
}

// 获取后续分页数据
async function fetchPage(param) {
    // 强制将 value 转为字符串，避免科学计数法
    const valueStr = typeof param.value === 'string' ? param.value : param.value.toLocaleString('fullwide', {useGrouping:false});
    const url = `${BASE_URL}?address_hash=${param.address_hash}&items_count=${param.items_count}&value=${encodeURIComponent(valueStr)}`;
    console.log(`正在获取分页数据: ${url}`);
    try {
        const res = await fetch(url);
        console.log('分页 API 响应状态:', res.status);
        if (!res.ok) throw new Error('网络请求失败: ' + res.status);
        const data = await res.json();
        console.log(`分页获取到 ${data.items?.length || 0} 条数据`);
        return data;
    } catch (error) {
        console.error('获取分页数据时出错:', error);
        throw error;
    }
}

// 重试特定页面
async function retryPage(pageNumber, nextPageParams = null) {
    console.log(`正在重试第 ${pageNumber} 页...`);
    
    try {
        let pageData;
        
        if (pageNumber === 1) {
            // 重试第一页
            const firstPage = await fetchFirstPage();
            if (!firstPage.items || firstPage.items.length === 0) {
                pageData = {
                    page: pageNumber,
                    status: "failed",
                    data: [],
                    error: "未获取到任何持有者数据",
                    retry_count: 1
                };
            } else {
                pageData = {
                    page: pageNumber,
                    status: "ok",
                    data: firstPage.items.map(item => ({
                        wallet_address: item.address.hash,
                        amount: item.value
                    })),
                    next_page_params: firstPage.next_page_params,
                    retry_count: 1
                };
            }
        } else {
            // 重试其他页面
            if (!nextPageParams) {
                throw new Error('缺少分页参数');
            }
            
            const nextPage = await fetchPage(nextPageParams);
            if (!nextPage.items || nextPage.items.length === 0) {
                pageData = {
                    page: pageNumber,
                    status: "ok",
                    data: [],
                    message: "没有更多数据",
                    retry_count: 1
                };
            } else {
                pageData = {
                    page: pageNumber,
                    status: "ok",
                    data: nextPage.items.map(item => ({
                        wallet_address: item.address.hash,
                        amount: item.value
                    })),
                    next_page_params: nextPage.next_page_params,
                    retry_count: 1
                };
            }
        }
        
        savePageToFile(pageData);
        console.log(`第 ${pageNumber} 页重试成功`);
        return pageData;
        
    } catch (error) {
        console.error(`第 ${pageNumber} 页重试失败:`, error);
        const failedPageData = {
            page: pageNumber,
            status: "failed",
            data: [],
            error: error.message,
            retry_count: 1
        };
        savePageToFile(failedPageData);
        return failedPageData;
    }
}

// 主函数
async function main() {
    try {
        // 读取现有数据
        const existingData = readExistingData();
        if (existingData.length === 0) {
            console.log('没有找到数据文件或文件为空');
            return;
        }
        
        console.log(`总共找到 ${existingData.length} 页数据`);
        
        // 找出失败的页面
        const failedPages = existingData.filter(item => item.status === "failed");
        console.log(`找到 ${failedPages.length} 个失败的页面:`, failedPages.map(p => p.page));
        
        if (failedPages.length === 0) {
            console.log('没有失败的页面需要重试');
            return;
        }
        
        // 重试失败的页面
        for (const failedPage of failedPages) {
            console.log(`\n开始重试第 ${failedPage.page} 页...`);
            
            // 获取上一页的参数（用于重试非第一页）
            let nextPageParams = null;
            if (failedPage.page > 1) {
                const prevPage = existingData.find(item => item.page === failedPage.page - 1);
                if (prevPage && prevPage.next_page_params) {
                    nextPageParams = prevPage.next_page_params;
                } else {
                    console.log(`无法获取第 ${failedPage.page} 页的分页参数，跳过`);
                    continue;
                }
            }
            
            await retryPage(failedPage.page, nextPageParams);
            
            // 添加延迟避免请求过快
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('\n重试完成！');
        
        // 重新统计失败页面
        const updatedData = readExistingData();
        const stillFailedPages = updatedData.filter(item => item.status === "failed");
        console.log(`重试后仍有 ${stillFailedPages.length} 个页面失败:`, stillFailedPages.map(p => p.page));
        
    } catch (error) {
        console.error('重试过程中发生错误:', error);
    }
}

main().catch(err => {
    console.error('发生错误:', err);
}); 