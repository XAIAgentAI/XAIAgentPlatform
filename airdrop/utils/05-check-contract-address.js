// 检查钱包地址是否为合约地址的工具脚本
const fs = require('fs');
const path = require('path');

/**
 * 合约地址检查器
 */
class ContractAddressChecker {
    /**
     * 构造函数
     * @param {Object} options 配置选项
     * @param {string} options.rpcUrl RPC节点URL
     * @param {string} options.scannerUrl 区块浏览器URL
     * @param {boolean} options.verbose 是否输出详细日志
     */
    constructor(options = {}) {
        this.rpcUrl = options.rpcUrl || 'https://rpc.dbcscan.io';
        this.scannerUrl = options.scannerUrl || 'https://www.dbcscan.io';
        this.verbose = options.verbose !== false;
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
     * 方法1: 通过RPC调用检查合约地址
     * @param {string} address 要检查的地址
     * @returns {Promise<boolean>} 是否为合约地址
     */
    async checkViaRPC(address) {
        try {
            this.log(`通过RPC检查地址: ${address}`);
            
            // 构建JSON-RPC请求
            const requestBody = {
                jsonrpc: '2.0',
                method: 'eth_getCode',
                params: [address, 'latest'],
                id: 1
            };

            const response = await fetch(this.rpcUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`RPC请求失败: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.error) {
                throw new Error(`RPC错误: ${result.error.message}`);
            }

            // 如果返回的代码不是 "0x" 或 "0x0"，说明是合约地址
            const code = result.result;
            const isContract = code && code !== '0x' && code !== '0x0';
            
            this.log(`RPC检查结果: ${isContract ? '合约地址' : '普通地址'}`);
            return isContract;

        } catch (error) {
            console.error(`RPC检查失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 方法2: 通过区块浏览器API检查合约地址
     * @param {string} address 要检查的地址
     * @returns {Promise<boolean>} 是否为合约地址
     */
    async checkViaScanner(address) {
        try {
            this.log(`通过区块浏览器检查地址: ${address}`);
            
            const url = `${this.scannerUrl}/api/v2/addresses/${address}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            
            // 检查返回的数据中是否包含合约相关信息
            const isContract = data.is_contract || 
                             data.contract_code || 
                             data.contract_name ||
                             (data.items && data.items.some(item => item.is_contract));
            
            this.log(`区块浏览器检查结果: ${isContract ? '合约地址' : '普通地址'}`);
            return isContract;

        } catch (error) {
            console.error(`区块浏览器检查失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 方法3: 通过合约创建者检查（更准确但需要额外API调用）
     * @param {string} address 要检查的地址
     * @returns {Promise<boolean>} 是否为合约地址
     */
    async checkViaContractCreator(address) {
        try {
            this.log(`通过合约创建者检查地址: ${address}`);
            
            const url = `${this.scannerUrl}/api/v2/addresses/${address}/contract`;
            const response = await fetch(url);
            
            if (!response.ok) {
                // 如果404，说明不是合约地址
                if (response.status === 404) {
                    this.log('合约创建者检查结果: 普通地址（404）');
                    return false;
                }
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            const isContract = data && (data.contract_address || data.creator_address);
            
            this.log(`合约创建者检查结果: ${isContract ? '合约地址' : '普通地址'}`);
            return isContract;

        } catch (error) {
            console.error(`合约创建者检查失败: ${error.message}`);
            return null;
        }
    }

    /**
     * 综合检查地址是否为合约地址
     * @param {string} address 要检查的地址
     * @returns {Promise<Object>} 检查结果
     */
    async checkAddress(address) {
        // 验证地址格式
        if (!this.isValidAddress(address)) {
            return {
                address,
                isValid: false,
                isContract: false,
                error: '无效的地址格式'
            };
        }

        this.log(`\n开始检查地址: ${address}`);

        // 并行执行多种检查方法
        const [rpcResult, scannerResult, creatorResult] = await Promise.allSettled([
            this.checkViaRPC(address),
            this.checkViaScanner(address),
            this.checkViaContractCreator(address)
        ]);

        const results = {
            address,
            isValid: true,
            rpc: rpcResult.status === 'fulfilled' ? rpcResult.value : null,
            scanner: scannerResult.status === 'fulfilled' ? scannerResult.value : null,
            creator: creatorResult.status === 'fulfilled' ? creatorResult.value : null
        };

        // 综合判断结果
        const validResults = [results.rpc, results.scanner, results.creator]
            .filter(result => result !== null);

        if (validResults.length === 0) {
            results.isContract = false;
            results.error = '所有检查方法都失败了';
        } else {
            // 如果大多数方法认为是合约，则认为是合约
            const contractCount = validResults.filter(result => result === true).length;
            results.isContract = contractCount > validResults.length / 2;
            results.confidence = `${contractCount}/${validResults.length}`;
        }

        this.log(`综合判断结果: ${results.isContract ? '合约地址' : '普通地址'} (置信度: ${results.confidence})`);
        
        return results;
    }

    /**
     * 验证地址格式
     * @param {string} address 地址
     * @returns {boolean} 是否为有效地址
     */
    isValidAddress(address) {
        if (!address || typeof address !== 'string') {
            return false;
        }
        
        // 检查长度和格式
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }

    /**
     * 批量检查地址
     * @param {string[]} addresses 地址数组
     * @returns {Promise<Array>} 检查结果数组
     */
    async checkAddresses(addresses) {
        this.log(`开始批量检查 ${addresses.length} 个地址...`);
        
        const results = [];
        const batchSize = 5; // 每批处理5个地址，避免API限制
        
        for (let i = 0; i < addresses.length; i += batchSize) {
            const batch = addresses.slice(i, i + batchSize);
            this.log(`处理第 ${Math.floor(i / batchSize) + 1} 批，共 ${batch.length} 个地址`);
            
            const batchResults = await Promise.all(
                batch.map(addr => this.checkAddress(addr))
            );
            
            results.push(...batchResults);
            
            // 批次间延迟
            if (i + batchSize < addresses.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        return results;
    }

    /**
     * 从数据文件中读取地址并检查
     * @param {string} filePath 数据文件路径
     * @returns {Promise<Array>} 检查结果
     */
    async checkFromFile(filePath) {
        try {
            this.log(`从文件读取地址: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                throw new Error('文件不存在');
            }

            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            const addresses = new Set();

            // 从页面数据中提取地址
            if (Array.isArray(data)) {
                data.forEach(page => {
                    if (page.status === 'ok' && Array.isArray(page.data)) {
                        page.data.forEach(item => {
                            if (item.wallet_address) {
                                addresses.add(item.wallet_address.toLowerCase());
                            }
                        });
                    }
                });
            }

            const addressArray = Array.from(addresses);
            this.log(`从文件中提取到 ${addressArray.length} 个唯一地址`);

            return await this.checkAddresses(addressArray);

        } catch (error) {
            console.error(`从文件读取地址失败: ${error.message}`);
            return [];
        }
    }

    /**
     * 保存检查结果到文件
     * @param {Array} results 检查结果
     * @param {string} outputPath 输出文件路径
     */
    saveResults(results, outputPath) {
        try {
            const dir = path.dirname(outputPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const summary = {
                total: results.length,
                contracts: results.filter(r => r.isContract).length,
                regular: results.filter(r => !r.isContract && r.isValid).length,
                invalid: results.filter(r => !r.isValid).length,
                timestamp: new Date().toISOString(),
                results: results
            };

            fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf-8');
            this.log(`检查结果已保存到: ${outputPath}`);
            
            // 输出统计信息
            console.log('\n=== 检查结果统计 ===');
            console.log(`总地址数: ${summary.total}`);
            console.log(`合约地址: ${summary.contracts}`);
            console.log(`普通地址: ${summary.regular}`);
            console.log(`无效地址: ${summary.invalid}`);
            console.log(`合约比例: ${((summary.contracts / summary.total) * 100).toFixed(2)}%`);

        } catch (error) {
            console.error(`保存结果失败: ${error.message}`);
        }
    }
}

/**
 * 便捷函数：检查单个地址
 * @param {string} address 地址
 * @param {Object} options 配置选项
 */
async function checkAddress(address, options = {}) {
    const checker = new ContractAddressChecker(options);
    return await checker.checkAddress(address);
}

/**
 * 便捷函数：批量检查地址
 * @param {string[]} addresses 地址数组
 * @param {Object} options 配置选项
 */
async function checkAddresses(addresses, options = {}) {
    const checker = new ContractAddressChecker(options);
    return await checker.checkAddresses(addresses);
}

/**
 * 便捷函数：从文件检查地址
 * @param {string} filePath 文件路径
 * @param {Object} options 配置选项
 */
async function checkFromFile(filePath, options = {}) {
    const checker = new ContractAddressChecker(options);
    return await checker.checkFromFile(filePath);
}

// 命令行执行
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('使用方法:');
        console.log('  检查单个地址: node 05-check-contract-address.js <地址>');
        console.log('  检查文件: node 05-check-contract-address.js --file <文件路径>');
        console.log('  批量检查: node 05-check-contract-address.js --addresses <地址1> <地址2> ...');
        console.log('');
        console.log('示例:');
        console.log('  node 05-check-contract-address.js 0x1234567890123456789012345678901234567890');
        console.log('  node 05-check-contract-address.js --file ../data/holders_pages.json');
        console.log('  node 05-check-contract-address.js --addresses 0x123... 0x456...');
        process.exit(1);
    }

    const options = {
        rpcUrl: 'https://rpc.dbcscan.io',
        scannerUrl: 'https://www.dbcscan.io',
        verbose: true
    };

    async function main() {
        try {
            if (args[0] === '--file') {
                if (args.length < 2) {
                    console.error('请指定文件路径');
                    process.exit(1);
                }
                
                const filePath = args[1];
                const outputPath = filePath.replace('.json', '_contract_check.json');
                
                console.log('=== 从文件检查合约地址 ===');
                const results = await checkFromFile(filePath, options);
                
                if (results.length > 0) {
                    const checker = new ContractAddressChecker(options);
                    checker.saveResults(results, outputPath);
                } else {
                    console.log('没有找到有效的地址');
                }

            } else if (args[0] === '--addresses') {
                if (args.length < 2) {
                    console.error('请指定要检查的地址');
                    process.exit(1);
                }
                
                const addresses = args.slice(1);
                console.log('=== 批量检查合约地址 ===');
                const results = await checkAddresses(addresses, options);
                
                const checker = new ContractAddressChecker(options);
                checker.saveResults(results, 'contract_check_results.json');

            } else {
                // 检查单个地址
                const address = args[0];
                console.log('=== 检查单个地址 ===');
                const result = await checkAddress(address, options);
                
                console.log('\n检查结果:');
                console.log(JSON.stringify(result, null, 2));
            }

        } catch (error) {
            console.error('执行失败:', error);
            process.exit(1);
        }
    }

    main();
}

module.exports = {
    ContractAddressChecker,
    checkAddress,
    checkAddresses,
    checkFromFile
}; 