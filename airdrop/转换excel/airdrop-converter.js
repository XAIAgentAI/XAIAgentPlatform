const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

class AirdropConverter {
	constructor() {
		this.nativeData = null;
		this.xaaData = null;
		this.nativeHolders = [];
		this.xaaHolders = [];

		// 智能路径处理
		this.scriptDir = __dirname;
		this.dataDir = path.join(this.scriptDir, '..', 'data');
		this.outputDir = this.dataDir;
	}

	// 读取JSON文件
	loadJsonFile(filePath) {
		try {
			const data = fs.readFileSync(filePath, 'utf8');
			return JSON.parse(data);
		} catch (error) {
			console.error(`❌ 读取文件失败 ${filePath}:`, error.message);
			return null;
		}
	}

	// 处理Native Token数据
	processNativeData() {
		if (!this.nativeData) return false;

		this.nativeHolders = [];
		let totalRegular = 0;
		let totalContracts = 0;

		this.nativeData.forEach(page => {
			if (page.status === 'ok' && page.data) {
				// 处理普通持有者
				page.data.forEach(holder => {
					const entry = {
						Page: page.page,
						'Wallet Address': holder.wallet_address,
						Amount: holder.amount,
						'Amount (DBC)': this.formatDbc(holder.amount),
						'Is Contract': holder.is_contract,
						Status: holder.is_contract ? 'Contract' : 'Regular Holder'
					};
					this.nativeHolders.push(entry);
					if (holder.is_contract) {
						totalContracts++;
					} else {
						totalRegular++;
					}
				});

				// 处理合约数据
				if (page.contract_data) {
					page.contract_data.forEach(contract => {
						const entry = {
							Page: page.page,
							'Wallet Address': contract.wallet_address,
							Amount: contract.amount,
							'Amount (DBC)': this.formatDbc(contract.amount),
							'Is Contract': contract.is_contract,
							Status: 'Contract'
						};
						this.nativeHolders.push(entry);
						totalContracts++;
					});
				}
			}
		});

		console.log(`✅ Native Token数据处理完成，共 ${this.nativeHolders.length} 条记录`);
		console.log(`   - 普通持有者: ${totalRegular} 个`);
		console.log(`   - 合约地址: ${totalContracts} 个`);
		return true;
	}

	// 处理XAA Token数据
	processXaaData() {
		if (!this.xaaData) return false;

		this.xaaHolders = [];
		let totalRegular = 0;
		let totalContracts = 0;

		this.xaaData.forEach(page => {
			if (page.status === 'ok' && page.data) {
				// 处理普通持有者
				page.data.forEach(holder => {
					const entry = {
						Page: page.page,
						'Wallet Address': holder.wallet_address,
						Amount: holder.amount,
						'Amount (XAA)': this.formatXaa(holder.amount),
						'Is Contract': holder.is_contract,
						Status: holder.is_contract ? 'Contract' : 'Regular Holder'
					};
					this.xaaHolders.push(entry);
					if (holder.is_contract) {
						totalContracts++;
					} else {
						totalRegular++;
					}
				});

				// 处理合约数据
				if (page.contract_data) {
					page.contract_data.forEach(contract => {
						const entry = {
							Page: page.page,
							'Wallet Address': contract.wallet_address,
							Amount: contract.amount,
							'Amount (XAA)': this.formatXaa(contract.amount),
							'Is Contract': contract.is_contract,
							Status: 'Contract'
						};
						this.xaaHolders.push(entry);
						totalContracts++;
					});
				}
			}
		});

		console.log(`✅ XAA Token数据处理完成，共 ${this.xaaHolders.length} 条记录`);
		console.log(`   - 普通持有者: ${totalRegular} 个`);
		console.log(`   - 合约地址: ${totalContracts} 个`);
		return true;
	}

	// DBC金额格式化
	formatDbc(amount) {
		const num = BigInt(amount);
		const weiPerEth = BigInt(10 ** 18);
		const eth = Number(num / weiPerEth);
		const wei = Number(num % weiPerEth);
		return wei === 0
			? `${eth.toLocaleString()} DBC`
			: `${eth.toLocaleString()}.${wei.toString().padStart(18, '0').replace(/0+$/, '')} DBC`;
	}

	// XAA金额格式化
	formatXaa(amount) {
		const num = BigInt(amount);
		const weiPerEth = BigInt(10 ** 18);
		const eth = Number(num / weiPerEth);
		const wei = Number(num % weiPerEth);
		return wei === 0
			? `${eth.toLocaleString()} XAA`
			: `${eth.toLocaleString()}.${wei.toString().padStart(18, '0').replace(/0+$/, '')} XAA`;
	}

	// 生成空投发放表
	generateAirdropSheet(holders, tokenType) {
		const airdropHolders = [];
		const specialAddresses = [
			'0x0000000000000000000000000000000000000000',
			'0x000000000000000000000000000000000000dEaD',
			'0x0000000000000000000000000000000000000001'
		];

		holders.forEach(holder => {
			// 只包含非合约且非特殊地址的持有者
			if (!holder['Is Contract'] && !specialAddresses.includes(holder['Wallet Address'])) {
				const entry = {
					'Token': tokenType,
					'Page': holder.Page,
					'Wallet Address': holder['Wallet Address'],
					'Amount': tokenType === 'Native' ? holder['Amount (DBC)'] : holder['Amount (XAA)'],
					'Status': holder.Status
				};
				airdropHolders.push(entry);
			}
		});

		return airdropHolders;
	}

	// 生成排除地址表
	generateExcludedSheet(holders, tokenType) {
		const excludedAddresses = [];
		const specialAddresses = [
			'0x0000000000000000000000000000000000000000',
			'0x000000000000000000000000000000000000dEaD',
			'0x0000000000000000000000000000000000000001'
		];

		holders.forEach(holder => {
			if (holder['Is Contract']) {
				excludedAddresses.push({
					'Token': tokenType,
					'Page': holder.Page,
					'Wallet Address': holder['Wallet Address'],
					'Amount': tokenType === 'Native' ? holder['Amount (DBC)'] : holder['Amount (XAA)'],
					'Type': 'Contract',
					'Reason': '合约地址，不适合空投'
				});
			} else if (specialAddresses.includes(holder['Wallet Address'])) {
				excludedAddresses.push({
					'Token': tokenType,
					'Page': holder.Page,
					'Wallet Address': holder['Wallet Address'],
					'Amount': tokenType === 'Native' ? holder['Amount (DBC)'] : holder['Amount (XAA)'],
					'Type': 'Special',
					'Reason': '特殊地址，不适合空投'
				});
			}
		});

		return excludedAddresses;
	}

	// 导出到Excel
	exportToExcel(outputPath, airdropHolders, excludedAddresses, tokenName) {
		try {
			const workbook = XLSX.utils.book_new();
			
			// 空投发放表
			const airdropWorksheet = XLSX.utils.json_to_sheet(airdropHolders);
			const airdropColumnWidths = [
				{ wch: 15 }, // Token
				{ wch: 8 },  // Page
				{ wch: 45 }, // Wallet Address
				{ wch: 25 }, // Amount
				{ wch: 12 }  // Status
			];
			airdropWorksheet['!cols'] = airdropColumnWidths;

			// 排除地址表
			const excludedWorksheet = XLSX.utils.json_to_sheet(excludedAddresses);
			const excludedColumnWidths = [
				{ wch: 15 }, // Token
				{ wch: 8 },  // Page
				{ wch: 45 }, // Wallet Address
				{ wch: 25 }, // Amount
				{ wch: 15 }, // Type
				{ wch: 30 }  // Reason
			];
			excludedWorksheet['!cols'] = excludedColumnWidths;

			XLSX.utils.book_append_sheet(workbook, airdropWorksheet, '空投发放表');
			XLSX.utils.book_append_sheet(workbook, excludedWorksheet, '排除地址表');
			
			XLSX.writeFile(workbook, outputPath);
			
			console.log(`✅ 已生成 ${tokenName} Excel: ${outputPath}`);
			console.log(`   - 空投发放表: ${airdropHolders.length} 条`);
			console.log(`   - 排除地址表: ${excludedAddresses.length} 条`);
			
			return true;
		} catch (error) {
			console.error(`❌ 导出 ${tokenName} Excel失败:`, error.message);
			return false;
		}
	}

	// 生成统计报告
	generateReport() {
		console.log('\n📊 空投转换统计报告:');
		console.log('============================================================');
		
		const nativeRegular = this.nativeHolders.filter(h => !h['Is Contract']).length;
		const nativeContracts = this.nativeHolders.filter(h => h['Is Contract']).length;
		const xaaRegular = this.xaaHolders.filter(h => !h['Is Contract']).length;
		const xaaContracts = this.xaaHolders.filter(h => h['Is Contract']).length;

		console.log(`📋 Native Token: 普通 ${nativeRegular} 个, 合约 ${nativeContracts} 个, 总计 ${this.nativeHolders.length}`);
		console.log(`📋 XAA Token:    普通 ${xaaRegular} 个, 合约 ${xaaContracts} 个, 总计 ${this.xaaHolders.length}`);
	}

	// 主转换方法
	convert() {
		console.log('🚀 开始空投转换...');
		console.log(`📁 脚本目录: ${this.scriptDir}`);
		console.log(`📁 数据目录: ${this.dataDir}`);
		console.log(`📁 输出目录: ${this.outputDir}`);

		// 构建路径
		const nativePath = path.join(this.dataDir, 'native_holders_pages.json');
		const xaaPath = path.join(this.dataDir, 'xaa_token_holders_pages.json');
		const nativeOut = path.join(this.outputDir, 'airdrop_native_dbc.xlsx');
		const xaaOut = path.join(this.outputDir, 'airdrop_xaa_new.xlsx');

		console.log('📖 读取文件:');
		console.log(`   - Native: ${nativePath}`);
		console.log(`   - XAA:    ${xaaPath}`);

		// 读取数据
		this.nativeData = this.loadJsonFile(nativePath);
		this.xaaData = this.loadJsonFile(xaaPath);

		if (!this.nativeData || !this.xaaData) {
			console.error('❌ 数据加载失败');
			return false;
		}

		// 处理数据
		if (!this.processNativeData() || !this.processXaaData()) {
			return false;
		}

		// 生成空投发放表和排除地址表
		const nativeAirdropHolders = this.generateAirdropSheet(this.nativeHolders, 'Native');
		const nativeExcludedAddresses = this.generateExcludedSheet(this.nativeHolders, 'Native');
		
		const xaaAirdropHolders = this.generateAirdropSheet(this.xaaHolders, 'XAA');
		const xaaExcludedAddresses = this.generateExcludedSheet(this.xaaHolders, 'XAA');

		// 调试输出：被排除的Native地址明细
		const nativeSpecials = nativeExcludedAddresses.filter(e => e.Type === 'Special');
		if (nativeSpecials.length > 0) {
			console.log('\n🔎 Native 被排除的特殊地址:');
			nativeSpecials.forEach((e, idx) => {
				console.log(`   ${idx + 1}. ${e['Wallet Address']} - ${e.Amount} (${e.Reason})`);
			});
		}
		const nativeContracts = nativeExcludedAddresses.filter(e => e.Type === 'Contract');
		if (nativeContracts.length > 0) {
			console.log('\n🔎 Native 被排除的合约地址数量:', nativeContracts.length);
		}

		// 导出Excel
		const nativeSuccess = this.exportToExcel(nativeOut, nativeAirdropHolders, nativeExcludedAddresses, 'Native');
		const xaaSuccess = this.exportToExcel(xaaOut, xaaAirdropHolders, xaaExcludedAddresses, 'XAA');

		// 生成报告
		this.generateReport();

		if (nativeSuccess && xaaSuccess) {
			console.log('\n🎉 转换完成：已分别生成 Native 与 XAA 的独立Excel！');
		}

		return nativeSuccess && xaaSuccess;
	}
}

// 运行转换器
const converter = new AirdropConverter();
converter.convert(); 