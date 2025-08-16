const fs = require('fs');
const path = require('path');

// 如果 Node.js 版本低于 18，需要导入 fetch
if (typeof fetch === 'undefined') {
    console.log('当前 Node.js 版本不支持 fetch，请升级到 Node.js 18+ 或安装 node-fetch');
    process.exit(1);
}

/**
 * 代币持有者爬取器类
 */
class TokenHoldersScraper {
    /**
     * 构造函数
     * @param {Object} options 配置选项
     * @param {string} options.tokenAddress 代币合约地址
     * @param {string} options.outputPath 输出文件路径
     * @param {string} options.scannerUrl 扫描器基础URL，默认为DBCScan
     * @param {number} options.itemsCount 每页数据条数，默认50
     * @param {number} options.requestDelay 请求间隔延迟(ms)，默认1000
     * @param {boolean} options.clearExisting 是否清空现有文件，默认true
     * @param {boolean} options.verbose 是否输出详细日志，默认true
     * @param {number} options.maxHolders 最大爬取持有者数量，默认无限制
     * @param {boolean} options.excludeContracts 是否排除合约地址（基于is_contract字段），默认true
     * @param {boolean} options.saveContracts 是否将合约地址保存到单独的字段中，默认true
     * @param {string[]} options.excludeAddresses 需要排除的钱包地址数组（不区分大小写）
     */
    constructor(options = {}) {
        this.tokenAddress = options.tokenAddress;
        this.outputPath = options.outputPath;
        this.scannerUrl = options.scannerUrl || 'https://www.dbcscan.io';
        this.itemsCount = options.itemsCount || 50;
        this.requestDelay = options.requestDelay || 1000;
        this.clearExisting = options.clearExisting !== false;
        this.verbose = options.verbose !== false;
        this.maxHolders = options.maxHolders || null; // 新增最大持有者数量限制
        this.excludeContracts = options.excludeContracts !== false; // 默认排除合约地址
        this.saveContracts = options.saveContracts !== false; // 默认保存合约地址到单独字段
        this.excludeAddresses = Array.isArray(options.excludeAddresses) ? options.excludeAddresses : [];
        this.excludeAddressesSet = new Set(this.excludeAddresses.map(addr => String(addr).toLowerCase()));
        
        // 构建API URL
        this.baseUrl = `${this.scannerUrl}/api/v2/tokens/${this.tokenAddress}/holders`;
        
        this.validateOptions();
    }

    /**
     * 验证配置选项
     */
    validateOptions() {
        if (!this.tokenAddress) {
            throw new Error('代币地址不能为空');
        }
        if (!this.outputPath) {
            throw new Error('输出文件路径不能为空');
        }
        if (!this.tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
            throw new Error('代币地址格式不正确，应为42位十六进制字符串');
        }
    }

    /**
     * 输出日志
     * @param {string} message 日志消息
     */
    log(message) {
        if (this.verbose) {
            console.log(message);
        }
    }

    /**
     * 清空输出文件
     */
    clearOutputFile() {
        if (!this.clearExisting) return;
        
        try {
            const dir = path.dirname(this.outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.outputPath, '[]', 'utf-8');
            this.log('已清空输出文件');
        } catch (e) {
            console.error('清空输出文件失败:', e);
        }
    }

    /**
     * 读取现有数据
     * @returns {Array} 现有数据数组
     */
    readExistingData() {
        try {
            if (fs.existsSync(this.outputPath)) {
                const data = fs.readFileSync(this.outputPath, 'utf-8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('读取现有数据失败:', error);
        }
        return [];
    }

    /**
     * 标准化条目映射（不同端点字段名可能不同）
     */
    mapItem(item) {
        // /api/v2/tokens/{tokenAddress}/holders 返回的字段通常为 address.hash、value
        const wallet = item?.address?.hash || item?.hash || item?.address || item?.addr || '';
        const amount = item?.value ?? item?.balance ?? item?.amount ?? '0';
        const isContract = item?.address?.is_contract || item?.is_contract || item?.isContract || false;
        
        return {
            wallet_address: String(wallet),
            amount: String(amount),
            is_contract: Boolean(isContract)
        };
    }

    /**
     * 判断是否应该排除该地址
     * @param {Object} item 原始数据项
     * @returns {boolean} 是否应该排除
     */
    shouldExcludeAddress(item) {
        const mappedItem = this.mapItem(item);
        const addr = String(mappedItem.wallet_address).toLowerCase();
        
        // 检查硬编码排除地址
        if (this.excludeAddressesSet.has(addr)) {
            return true;
        }
        
        // 检查是否为合约地址（如果启用合约排除）
        if (this.excludeContracts && mappedItem.is_contract) {
            return true;
        }
        
        return false;
    }

    /**
     * 保存页面数据到文件
     * @param {Object} pageData 页面数据
     */
    savePageToFile(pageData) {
        try {
            const dir = path.dirname(this.outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            // 读取现有数据
            let existingData = [];
            if (fs.existsSync(this.outputPath)) {
                try {
                    const data = fs.readFileSync(this.outputPath, 'utf-8');
                    existingData = JSON.parse(data);
                    if (!Array.isArray(existingData)) {
                        this.log('现有数据格式错误，重置为空数组');
                        existingData = [];
                    }
                } catch (error) {
                    console.error('读取现有数据失败，将创建新文件:', error);
                    existingData = [];
                }
            }
            
            // 检查是否已存在该页数据，如果存在则替换，否则追加
            const existingIndex = existingData.findIndex(item => item.page === pageData.page);
            if (existingIndex !== -1) {
                existingData[existingIndex] = pageData;
                this.log(`更新第 ${pageData.page} 页数据`);
            } else {
                existingData.push(pageData);
                this.log(`添加第 ${pageData.page} 页数据`);
            }
            
            // 按页码排序
            existingData.sort((a, b) => a.page - b.page);
            
            fs.writeFileSync(this.outputPath, JSON.stringify(existingData, null, 2), 'utf-8');
            this.log(`已保存第 ${pageData.page} 页数据到 ${this.outputPath}`);
        } catch (error) {
            console.error('保存文件时出错:', error);
        }
    }

    /**
     * 获取第一页数据
     * @returns {Promise<Object>} 第一页数据
     */
    async fetchFirstPage() {
        this.log('正在获取第一页数据...');
        try {
            const res = await fetch(this.baseUrl);
            this.log('API 响应状态: ' + res.status);
            if (!res.ok) throw new Error('网络请求失败: ' + res.status);
            const data = await res.json();
            this.log(`第一页获取到 ${data.items?.length || 0} 条数据`);
            return data;
        } catch (error) {
            console.error('获取第一页数据时出错:', error);
            throw error;
        }
    }

    /**
     * 获取分页数据
     * @param {Object} param 分页参数
     * @returns {Promise<Object>} 分页数据
     */
    async fetchPage(param) {
        // 强制将 value 转为字符串，避免科学计数法
        const valueStr = typeof param.value === 'string' ? param.value : param.value.toLocaleString('fullwide', {useGrouping:false});
        const url = `${this.baseUrl}?address_hash=${param.address_hash}&items_count=${param.items_count || this.itemsCount}&value=${encodeURIComponent(valueStr)}`;
        this.log(`正在获取分页数据: ${url}`);
        try {
            const res = await fetch(url);
            this.log('分页 API 响应状态: ' + res.status);
            if (!res.ok) throw new Error('网络请求失败: ' + res.status);
            const data = await res.json();
            this.log(`分页获取到 ${data.items?.length || 0} 条数据`);
            return data;
        } catch (error) {
            console.error('获取分页数据时出错:', error);
            throw error;
        }
    }

    /**
     * 开始爬取数据
     * @returns {Promise<Object>} 爬取结果
     */
    async scrape() {
        this.log('开始执行代币持有者爬取...');
        this.log('目标代币地址: ' + this.tokenAddress);
        this.log('API URL: ' + this.baseUrl);
        this.log('输出文件路径: ' + this.outputPath);
        this.log('每页数据条数: ' + this.itemsCount);
        this.log('请求延迟: ' + this.requestDelay + 'ms');

        // 清空输出文件
        this.clearOutputFile();

        let pageCount = 0;
        const maxPages = 1000; // 最大页数限制，防止无限循环
        const startTime = Date.now();
        const maxDuration = 30 * 60 * 1000; // 30分钟超时
        
        const result = {
            success: false,
            totalPages: 0,
            totalHolders: 0,
            errors: []
        };

        try {
            // 获取第一页
            const firstPage = await this.fetchFirstPage();
            pageCount++;
            
            if (!firstPage.items || firstPage.items.length === 0) {
                this.log('未获取到任何持有者数据');
                const pageData = {
                    page: pageCount,
                    status: "failed",
                    data: [],
                    error: "未获取到任何持有者数据"
                };
                this.savePageToFile(pageData);
                result.errors.push("未获取到任何持有者数据");
                return result;
            }

            // 分离合约地址和普通地址
            const allItems = firstPage.items || [];
            const contractItems = [];
            const normalItems = [];

            allItems.forEach(it => {
                const mappedItem = this.mapItem(it);
                if (mappedItem.is_contract) {
                    contractItems.push(mappedItem);
                } else if (!this.shouldExcludeAddress(it)) {
                    normalItems.push(mappedItem);
                }
            });

            // 保存第一页
            const firstPageData = {
                page: pageCount,
                status: "ok",
                data: normalItems,
                next_page_params: firstPage.next_page_params
            };

            // 如果启用了合约保存，添加合约地址字段
            if (this.saveContracts && contractItems.length > 0) {
                firstPageData.contract_data = contractItems;
            }
            this.savePageToFile(firstPageData);
            result.totalHolders += normalItems.length;
            
            // 检查第一页后是否已达到最大限制
            if (this.maxHolders && result.totalHolders >= this.maxHolders) {
                this.log(`第一页后已达到最大持有者数量限制 (${this.maxHolders})，停止获取`);
                result.totalPages = pageCount;
                result.success = result.errors.length === 0;
                this.log(`总共处理 ${pageCount} 页数据，${result.totalHolders} 个持有者`);
                this.log('数据获取完成！');
                return result;
            }

            // 判断是否有下一页
            let nextParams = firstPage.next_page_params;
            this.log('下一页参数: ' + JSON.stringify(nextParams));
            
            while (nextParams && nextParams.address_hash) {
                // 检查超时
                if (Date.now() - startTime > maxDuration) {
                    this.log(`⚠️  已运行超过 ${maxDuration / 1000 / 60} 分钟，停止获取`);
                    result.errors.push('执行超时');
                    break;
                }
                
                // 检查最大页数限制
                if (pageCount >= maxPages) {
                    this.log(`⚠️  已达到最大页数限制 (${maxPages})，停止获取`);
                    result.errors.push(`达到最大页数限制: ${maxPages}`);
                    break;
                }
                
                // 检查是否达到最大持有者数量限制
                if (this.maxHolders && result.totalHolders >= this.maxHolders) {
                    this.log(`已达到最大持有者数量限制 (${this.maxHolders})，停止获取`);
                    break;
                }
                
                pageCount++;
                this.log(`正在获取第 ${pageCount} 页数据...`);
                
                try {
                    const nextPage = await this.fetchPage(nextParams);
                    
                    if (!nextPage.items || nextPage.items.length === 0) {
                        this.log('没有更多数据，停止获取');
                        const emptyPageData = {
                            page: pageCount,
                            status: "ok",
                            data: [],
                            message: "没有更多数据"
                        };
                        this.savePageToFile(emptyPageData);
                        break;
                    }
                    
                    // 分离合约地址和普通地址
                    const allItems = nextPage.items || [];
                    const contractItems = [];
                    const normalItems = [];

                    allItems.forEach(it => {
                        const mappedItem = this.mapItem(it);
                        if (mappedItem.is_contract) {
                            contractItems.push(mappedItem);
                        } else if (!this.shouldExcludeAddress(it)) {
                            normalItems.push(mappedItem);
                        }
                    });

                    let remainingSlots = 0;
                    if (this.maxHolders && result.totalHolders + normalItems.length > this.maxHolders) {
                        remainingSlots = this.maxHolders - result.totalHolders;
                        normalItems.splice(remainingSlots);
                        this.log(`限制保存前 ${remainingSlots} 条数据，达到最大限制`);
                    }

                    const pageData = {
                        page: pageCount,
                        status: "ok",
                        data: normalItems,
                        next_page_params: nextPage.next_page_params,
                        ...(this.maxHolders && remainingSlots > 0 && { 
                            message: `限制保存前${remainingSlots}条数据，达到最大限制${this.maxHolders}` 
                        })
                    };

                    // 如果启用了合约保存，添加合约地址字段
                    if (this.saveContracts && contractItems.length > 0) {
                        pageData.contract_data = contractItems;
                    }
                    this.savePageToFile(pageData);
                    result.totalHolders += normalItems.length;
                    
                    // 如果达到限制，停止获取
                    if (this.maxHolders && result.totalHolders >= this.maxHolders) {
                        this.log(`已达到最大持有者数量限制 (${this.maxHolders})，停止获取`);
                        break;
                    }
                    
                    nextParams = nextPage.next_page_params;
                    this.log('下一页参数: ' + JSON.stringify(nextParams));
                    
                } catch (error) {
                    console.error(`获取第 ${pageCount} 页数据失败:`, error);
                    const failedPageData = {
                        page: pageCount,
                        status: "failed",
                        data: [],
                        error: error.message,
                        retry_count: 0
                    };
                    this.savePageToFile(failedPageData);
                    result.errors.push(`第${pageCount}页: ${error.message}`);
                    
                    // 失败时中断分页（避免死循环）
                    this.log('页面获取失败，停止获取后续页面');
                    break;
                }
                
                // 添加延迟避免请求过快
                if (this.requestDelay > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.requestDelay));
                }
            }

            result.totalPages = pageCount;
            result.success = result.errors.length === 0;
            this.log(`总共处理 ${pageCount} 页数据，${result.totalHolders} 个持有者`);
            this.log('数据获取完成！');
            
        } catch (error) {
            console.error('获取数据过程中发生错误:', error);
            const failedPageData = {
                page: pageCount || 1,
                status: "failed",
                data: [],
                error: error.message,
                retry_count: 0
            };
            this.savePageToFile(failedPageData);
            result.errors.push(error.message);
        }

        return result;
    }
}

/**
 * 便捷函数：快速爬取代币持有者
 * @param {string} tokenAddress 代币地址
 * @param {string} outputPath 输出文件路径
 * @param {Object} options 其他选项
 * @returns {Promise<Object>} 爬取结果
 */
async function scrapeTokenHolders(tokenAddress, outputPath, options = {}) {
    const scraper = new TokenHoldersScraper({
        tokenAddress,
        outputPath,
        ...options
    });
    return await scraper.scrape();
}

module.exports = {
    TokenHoldersScraper,
    scrapeTokenHolders
}; 