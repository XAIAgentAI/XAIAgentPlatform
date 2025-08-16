const fs = require('fs');
const XLSX = require('xlsx');

// 空投转换器 - 处理两个JSON文件，生成两个工作表
class AirdropConverter {
    constructor() {
        this.nativeData = null;
        this.xaaData = null;
        this.nativeHolders = [];
        this.xaaHolders = [];
    }

    // 读取JSON文件
    loadJsonFile(filePath) {
        try {
            const jsonData = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(jsonData);
        } catch (error) {
            console.error(`❌ 读取JSON文件失败: ${filePath}`, error.message);
            return null;
        }
    }

    // 处理Native Token数据
    processNativeData() {
        if (!this.nativeData) {
            console.error('❌ 没有Native Token数据可处理');
            return false;
        }

        this.nativeHolders = [];
        
        this.nativeData.forEach(page => {
            // 处理普通holder数据
            if (page.data && Array.isArray(page.data)) {
                page.data.forEach(holder => {
                    this.nativeHolders.push({
                        'Page': page.page,
                        'Wallet Address': holder.wallet_address,
                        'Amount': holder.amount,
                        'Amount (ETH)': this.formatAmount(holder.amount),
                        'Is Contract': holder.is_contract,
                        'Type': holder.is_contract ? 'Contract' : 'Regular Holder',
                        'Status': page.status || 'unknown'
                    });
                });
            }
            
            // 处理合约数据
            if (page.contract_data && Array.isArray(page.contract_data)) {
                page.contract_data.forEach(contract => {
                    this.nativeHolders.push({
                        'Page': page.page,
                        'Wallet Address': contract.wallet_address,
                        'Amount': contract.amount,
                        'Amount (ETH)': this.formatAmount(contract.amount),
                        'Is Contract': contract.is_contract,
                        'Type': 'Contract',
                        'Status': page.status || 'unknown'
                    });
                });
            }
        });

        console.log(`✅ Native Token数据处理完成，共 ${this.nativeHolders.length} 条记录`);
        return true;
    }

    // 处理XAA Token数据
    processXaaData() {
        if (!this.xaaData) {
            console.error('❌ 没有XAA Token数据可处理');
            return false;
        }

        this.xaaHolders = [];
        
        this.xaaData.forEach(page => {
            // 处理普通holder数据
            if (page.data && Array.isArray(page.data)) {
                page.data.forEach(holder => {
                    this.xaaHolders.push({
                        'Page': page.page,
                        'Wallet Address': holder.wallet_address,
                        'Amount': holder.amount,
                        'Amount (XAA)': this.formatXaaAmount(holder.amount),
                        'Is Contract': holder.is_contract,
                        'Type': holder.is_contract ? 'Contract' : 'Regular Holder',
                        'Status': page.status || 'unknown'
                    });
                });
            }
            
            // 处理合约数据
            if (page.contract_data && Array.isArray(page.contract_data)) {
                page.contract_data.forEach(contract => {
                    this.xaaHolders.push({
                        'Page': page.page,
                        'Wallet Address': contract.wallet_address,
                        'Amount': contract.amount,
                        'Amount (XAA)': this.formatXaaAmount(contract.amount),
                        'Is Contract': contract.is_contract,
                        'Type': 'Contract',
                        'Status': page.status || 'unknown'
                    });
                });
            }
        });

        console.log(`✅ XAA Token数据处理完成，共 ${this.xaaHolders.length} 条记录`);
        return true;
    }

    // 格式化Native Token金额（wei转ETH）
    formatAmount(amount) {
        const num = BigInt(amount);
        const weiPerEth = BigInt(10 ** 18);
        const eth = Number(num / weiPerEth);
        const wei = Number(num % weiPerEth);
        
        if (wei === 0) {
            return `${eth.toLocaleString()} ETH`;
        } else {
            return `${eth.toLocaleString()}.${wei.toString().padStart(18, '0').replace(/0+$/, '')} ETH`;
        }
    }

    // 格式化XAA Token金额（wei转XAA）
    formatXaaAmount(amount) {
        const num = BigInt(amount);
        const weiPerXaa = BigInt(10 ** 18);
        const xaa = Number(num / weiPerXaa);
        const wei = Number(num % weiPerXaa);
        
        if (wei === 0) {
            return `${xaa.toLocaleString()} XAA`;
        } else {
            return `${xaa.toLocaleString()}.${wei.toString().padStart(18, '0').replace(/0+$/, '')} XAA`;
        }
    }

    // 生成空投发放表（排除合约地址）
    generateAirdropSheet() {
        const airdropHolders = [];
        
        // 合并两个数据源，排除合约地址
        this.nativeHolders.forEach(holder => {
            if (!holder['Is Contract']) {
                airdropHolders.push({
                    'Source': 'Native Token',
                    'Page': holder.Page,
                    'Wallet Address': holder['Wallet Address'],
                    'Native Amount': holder['Amount (ETH)'],
                    'XAA Amount': this.findXaaAmount(holder['Wallet Address']),
                    'Status': holder.Status
                });
            }
        });

        this.xaaHolders.forEach(holder => {
            if (!holder['Is Contract']) {
                // 检查是否已经添加过
                const existing = airdropHolders.find(h => h['Wallet Address'] === holder['Wallet Address']);
                if (!existing) {
                    airdropHolders.push({
                        'Source': 'XAA Token',
                        'Page': holder.Page,
                        'Wallet Address': holder['Wallet Address'],
                        'Native Amount': this.findNativeAmount(holder['Wallet Address']),
                        'XAA Amount': holder['Amount (XAA)'],
                        'Status': holder.Status
                    });
                }
            }
        });

        return airdropHolders;
    }

    // 生成排除地址表（合约地址和特殊地址）
    generateExcludedSheet() {
        const excludedAddresses = [];
        
        // 添加所有合约地址
        this.nativeHolders.forEach(holder => {
            if (holder['Is Contract']) {
                excludedAddresses.push({
                    'Source': 'Native Token',
                    'Page': holder.Page,
                    'Wallet Address': holder['Wallet Address'],
                    'Amount': holder['Amount (ETH)'],
                    'Type': 'Contract',
                    'Reason': '合约地址，不适合空投'
                });
            }
        });

        this.xaaHolders.forEach(holder => {
            if (holder['Is Contract']) {
                excludedAddresses.push({
                    'Source': 'XAA Token',
                    'Page': holder.Page,
                    'Wallet Address': holder['Wallet Address'],
                    'Amount': holder['Amount (XAA)'],
                    'Type': 'Contract',
                    'Reason': '合约地址，不适合空投'
                });
            }
        });

        // 添加特殊地址（如死地址、零地址等）
        const specialAddresses = [
            '0x0000000000000000000000000000000000000000',
            '0x000000000000000000000000000000000000dEaD',
            '0x0000000000000000000000000000000000000001'
        ];

        specialAddresses.forEach(address => {
            const nativeHolder = this.nativeHolders.find(h => h['Wallet Address'].toLowerCase() === address.toLowerCase());
            const xaaHolder = this.xaaHolders.find(h => h['Wallet Address'].toLowerCase() === address.toLowerCase());
            
            if (nativeHolder || xaaHolder) {
                excludedAddresses.push({
                    'Source': 'Special Address',
                    'Page': '-',
                    'Wallet Address': address,
                    'Amount': nativeHolder ? nativeHolder['Amount (ETH)'] : (xaaHolder ? xaaHolder['Amount (XAA)'] : '0'),
                    'Type': 'Special',
                    'Reason': '特殊地址，不适合空投'
                });
            }
        });

        return excludedAddresses;
    }

    // 查找XAA金额
    findXaaAmount(walletAddress) {
        const holder = this.xaaHolders.find(h => h['Wallet Address'].toLowerCase() === walletAddress.toLowerCase());
        return holder ? holder['Amount (XAA)'] : '0 XAA';
    }

    // 查找Native金额
    findNativeAmount(walletAddress) {
        const holder = this.nativeHolders.find(h => h['Wallet Address'].toLowerCase() === walletAddress.toLowerCase());
        return holder ? holder['Amount (ETH)'] : '0 ETH';
    }

    // 导出为Excel
    exportToExcel(outputPath) {
        try {
            // 创建工作簿
            const workbook = XLSX.utils.book_new();
            
            // 生成空投发放表
            const airdropHolders = this.generateAirdropSheet();
            const airdropWorksheet = XLSX.utils.json_to_sheet(airdropHolders);
            const airdropColumnWidths = [
                { wch: 15 },  // Source
                { wch: 8 },   // Page
                { wch: 45 },  // Wallet Address
                { wch: 25 },  // Native Amount
                { wch: 25 },  // XAA Amount
                { wch: 12 }   // Status
            ];
            airdropWorksheet['!cols'] = airdropColumnWidths;
            
            // 生成排除地址表
            const excludedAddresses = this.generateExcludedSheet();
            const excludedWorksheet = XLSX.utils.json_to_sheet(excludedAddresses);
            const excludedColumnWidths = [
                { wch: 15 },  // Source
                { wch: 8 },   // Page
                { wch: 45 },  // Wallet Address
                { wch: 25 },  // Amount
                { wch: 15 },  // Type
                { wch: 30 }   // Reason
            ];
            excludedWorksheet['!cols'] = excludedColumnWidths;
            
            // 将工作表添加到工作簿
            XLSX.utils.book_append_sheet(workbook, airdropWorksheet, '空投发放表');
            XLSX.utils.book_append_sheet(workbook, excludedWorksheet, '排除地址表');
            
            // 保存Excel文件
            XLSX.writeFile(workbook, outputPath);
            
            console.log(`✅ Excel文件已保存: ${outputPath}`);
            console.log(`   - 工作表1: 空投发放表 (${airdropHolders.length} 条记录)`);
            console.log(`   - 工作表2: 排除地址表 (${excludedAddresses.length} 条记录)`);
            return true;
        } catch (error) {
            console.error('❌ 导出Excel失败:', error.message);
            return false;
        }
    }

    // 生成统计报告
    generateReport() {
        const nativeRegular = this.nativeHolders.filter(h => !h['Is Contract']).length;
        const nativeContract = this.nativeHolders.filter(h => h['Is Contract']).length;
        const xaaRegular = this.xaaHolders.filter(h => !h['Is Contract']).length;
        const xaaContract = this.xaaHolders.filter(h => h['Is Contract']).length;

        console.log('\n📊 空投转换统计报告:');
        console.log('='.repeat(60));
        console.log(`📋 Native Token:`);
        console.log(`   - 普通持有者: ${nativeRegular} 个`);
        console.log(`   - 合约地址: ${nativeContract} 个`);
        console.log(`   - 总计: ${this.nativeHolders.length} 个地址`);
        
        console.log(`📋 XAA Token:`);
        console.log(`   - 普通持有者: ${xaaRegular} 个`);
        console.log(`   - 合约地址: ${xaaContract} 个`);
        console.log(`   - 总计: ${this.xaaHolders.length} 个地址`);
        
        const airdropHolders = this.generateAirdropSheet();
        const excludedAddresses = this.generateExcludedSheet();
        
        console.log(`📋 空投发放表: ${airdropHolders.length} 个地址`);
        console.log(`📋 排除地址表: ${excludedAddresses.length} 个地址`);
    }

    // 主转换方法
    convert() {
        console.log('🚀 开始空投转换...');
        
        // 加载数据
        this.nativeData = this.loadJsonFile('../data/native_holders_pages.json');
        this.xaaData = this.loadJsonFile('../data/xaa_token_holders_pages.json');
        
        if (!this.nativeData || !this.xaaData) {
            console.error('❌ 数据加载失败');
            return false;
        }
        
        // 处理数据
        if (!this.processNativeData() || !this.processXaaData()) {
            return false;
        }
        
        // 生成报告
        this.generateReport();
        
        // 导出Excel
        const success = this.exportToExcel('../data/airdrop_holders.xlsx');
        
        if (success) {
            console.log('\n🎉 空投转换完成！');
            console.log('📁 生成的文件包含两个工作表：');
            console.log('   - 空投发放表：适合发放空投的地址');
            console.log('   - 排除地址表：合约地址和特殊地址');
        }
        
        return success;
    }
}

// 运行转换
const converter = new AirdropConverter();
converter.convert(); 