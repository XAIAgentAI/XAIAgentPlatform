const fs = require('fs');
const path = require('path');

// 如果 Node.js 版本低于 18，需要导入 fetch
if (typeof fetch === 'undefined') {
    console.log('当前 Node.js 版本不支持 fetch，请升级到 Node.js 18+ 或安装 node-fetch');
    process.exit(1);
}

/**
 * 原生币持有者爬取器（Rich List）
 * 适配端点: /api/v2/addresses
 */
class NativeHoldersScraper {
    /**
     * 构造函数
     * @param {Object} options 配置选项
     * @param {string} options.outputPath 输出文件路径
     * @param {string} options.scannerUrl 扫描器基础URL，默认为DBCScan
     * @param {number} options.itemsCount 每页数据条数，默认50
     * @param {number} options.requestDelay 请求间隔延迟(ms)，默认1000
     * @param {boolean} options.clearExisting 是否清空现有文件，默认true
     * @param {boolean} options.verbose 是否输出详细日志，默认true
     * @param {number} options.maxHolders 最大爬取持有者数量，默认无限制
     * @param {boolean} options.excludeContracts 是否排除合约地址（基于is_contract字段），默认true
     * @param {string[]} options.excludeAddresses 需要排除的钱包地址数组（向后兼容，实际不再使用）
     * @param {boolean} options.saveContracts 是否将合约地址保存到单独的字段中，默认true
     */
    constructor(options = {}) {
        this.outputPath = options.outputPath;
        this.scannerUrl = options.scannerUrl || 'https://www.dbcscan.io';
        this.itemsCount = options.itemsCount || 50;
        this.requestDelay = options.requestDelay || 1000;
        this.clearExisting = options.clearExisting !== false;
        this.verbose = options.verbose !== false;
        this.maxHolders = options.maxHolders || null;
        this.excludeContracts = options.excludeContracts !== false; // 默认排除合约地址
        this.saveContracts = options.saveContracts !== false; // 默认保存合约地址到单独字段
        this.excludeAddresses = Array.isArray(options.excludeAddresses) ? options.excludeAddresses : [];
        this.excludeAddressesSet = new Set(this.excludeAddresses.map(addr => String(addr).toLowerCase()));

        // 构建API URL
        this.baseUrl = `${this.scannerUrl}/api/v2/addresses`;

        this.validateOptions();
    }

    /**
     * 验证配置选项
     */
    validateOptions() {
        if (!this.outputPath) {
            throw new Error('输出文件路径不能为空');
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
            const existingData = this.readExistingData();

            // 检查是否已存在该页数据，如果存在则替换，否则追加
            const existingIndex = existingData.findIndex(item => item.page === pageData.page);
            if (existingIndex !== -1) {
                existingData[existingIndex] = pageData;
                this.log(`更新第 ${pageData.page} 页数据`);
            } else {
                existingData.push(pageData);
                this.log(`添加第 ${pageData.page} 页数据`);
            }

            fs.writeFileSync(this.outputPath, JSON.stringify(existingData, null, 2), 'utf-8');
            this.log(`已保存第 ${pageData.page} 页数据到 ${this.outputPath}`);
        } catch (error) {
            console.error('保存文件时出错:', error);
        }
    }

    /**
     * 获取第一页数据（尽可能带上 items_count）
     * @returns {Promise<Object>} 第一页数据
     */
    async fetchFirstPage() {
        const url = `${this.baseUrl}?items_count=${this.itemsCount}`;
        this.log(`正在获取第一页数据: ${url}`);
        try {
            const res = await fetch(url);
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
     * 根据 next_page_params 获取后续分页数据（通用透传）
     * @param {Object} nextParams 分页参数
     */
    async fetchPage(nextParams) {
        const params = new URLSearchParams();
        // 透传 next_page_params 所有字段
        if (nextParams && typeof nextParams === 'object') {
            for (const [k, v] of Object.entries(nextParams)) {
                if (v !== undefined && v !== null) {
                    params.append(k, String(v));
                }
            }
        }
        // 确保 items_count 存在
        if (!params.has('items_count')) {
            params.append('items_count', String(this.itemsCount));
        }

        const url = `${this.baseUrl}?${params.toString()}`;
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
     * 标准化条目映射（不同端点字段名可能不同）
     */
    mapItem(item) {
        // /api/v2/addresses 返回的字段通常为顶层 hash、coin_balance
        const wallet = item?.hash || item?.address?.hash || item?.address || item?.addr || '';
        const amount = item?.coin_balance ?? item?.balance ?? item?.value ?? item?.amount ?? '0';
        const isContract = item?.is_contract || item?.isContract || false;
        
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
     * 开始爬取数据
     * @returns {Promise<Object>} 爬取结果
     */
    async scrape() {
        this.log('开始执行原生币持有者爬取...');
        this.log('API URL: ' + this.baseUrl);
        this.log('输出文件路径: ' + this.outputPath);
        this.log('每页数据条数: ' + this.itemsCount);
        this.log('请求延迟: ' + this.requestDelay + 'ms');

        // 清空输出文件
        this.clearOutputFile();

        let pageCount = 0;
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
                this.log('未获取到任何地址数据');
                const pageData = {
                    page: pageCount,
                    status: 'failed',
                    data: [],
                    error: '未获取到任何地址数据'
                };
                this.savePageToFile(pageData);
                result.errors.push('未获取到任何地址数据');
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
                status: 'ok',
                data: normalItems,
                next_page_params: firstPage.next_page_params
            };

            // 如果启用了合约保存，添加合约地址字段
            if (this.saveContracts && contractItems.length > 0) {
                firstPageData.contract_data = contractItems;
            }
            this.savePageToFile(firstPageData);
            result.totalHolders += normalItems.length;

            // 达到上限直接返回
            if (this.maxHolders && result.totalHolders >= this.maxHolders) {
                this.log(`第一页后已达到最大限制 (${this.maxHolders})，停止获取`);
                result.totalPages = pageCount;
                result.success = result.errors.length === 0;
                return result;
            }

            // 迭代分页
            let nextParams = firstPage.next_page_params;
            this.log('下一页参数: ' + JSON.stringify(nextParams));

            while (nextParams && Object.keys(nextParams).length > 0) {
                if (this.maxHolders && result.totalHolders >= this.maxHolders) {
                    this.log(`已达到最大限制 (${this.maxHolders})，停止获取`);
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
                            status: 'ok',
                            data: [],
                            message: '没有更多数据'
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
                        status: 'ok',
                        data: normalItems,
                        next_page_params: nextPage.next_page_params,
                        ...(this.maxHolders && remainingSlots > 0 && { message: `限制保存前${remainingSlots}条数据，达到最大限制${this.maxHolders}` })
                    };

                    // 如果启用了合约保存，添加合约地址字段
                    if (this.saveContracts && contractItems.length > 0) {
                        pageData.contract_data = contractItems;
                    }
                    this.savePageToFile(pageData);
                    result.totalHolders += normalItems.length;

                    if (this.maxHolders && result.totalHolders >= this.maxHolders) {
                        this.log(`已达到最大限制 (${this.maxHolders})，停止获取`);
                        break;
                    }

                    nextParams = nextPage.next_page_params;
                    this.log('下一页参数: ' + JSON.stringify(nextParams));

                } catch (error) {
                    console.error(`获取第 ${pageCount} 页数据失败:`, error);
                    const failedPageData = {
                        page: pageCount,
                        status: 'failed',
                        data: [],
                        error: error.message,
                        retry_count: 0
                    };
                    this.savePageToFile(failedPageData);
                    result.errors.push(`第${pageCount}页: ${error.message}`);

                    // 失败时中断分页（避免死循环）
                    break;
                }

                if (this.requestDelay > 0) {
                    await new Promise(resolve => setTimeout(resolve, this.requestDelay));
                }
            }

            result.totalPages = pageCount;
            result.success = result.errors.length === 0;
            this.log(`总共处理 ${pageCount} 页数据，${result.totalHolders} 个地址`);
            this.log('数据获取完成！');
        } catch (error) {
            console.error('获取数据过程中发生错误:', error);
            const failedPageData = {
                page: pageCount || 1,
                status: 'failed',
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
 * 便捷函数：快速爬取原生币地址列表（Rich List）
 * @param {string} outputPath 输出文件路径
 * @param {Object} options 其他选项
 */
async function scrapeNativeHolders(outputPath, options = {}) {
    const scraper = new NativeHoldersScraper({
        outputPath,
        ...options
    });
    return await scraper.scrape();
}

module.exports = {
    NativeHoldersScraper,
    scrapeNativeHolders
};