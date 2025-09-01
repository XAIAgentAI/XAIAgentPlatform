const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function convertExcelToJson(excelPath, outputPath) {
  try {
    // 读取Excel文件
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0]; // 取第一个sheet
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: ['address', 'amount'], range: 0 });
    
    // 过滤掉空行和标题行
    const filteredData = rawData.filter(row => 
      row.address && 
      row.amount && 
      typeof row.address === 'string' && 
      row.address.startsWith('0x')
    );
    
    // 转换为目标格式
    const result = [{
      page: 1,
      status: "ok",
      data: filteredData.map(row => ({
        wallet_address: row.address.trim(),
        amount: row.amount.toString(),
        is_contract: false
      }))
    }];
    
    // 写入JSON文件
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`✅ 转换完成：${path.basename(excelPath)} -> ${path.basename(outputPath)}`);
    console.log(`📊 共处理 ${filteredData.length} 条记录`);
    
  } catch (error) {
    console.error(`❌ 转换失败：${path.basename(excelPath)}`, error.message);
  }
}

// 主执行函数
function main() {
  const excelFiles = [
    {
      input: '转换excel/staking-snap.xlsx',
      output: 'data/staking-snap.json'
    },
    {
      input: '转换excel/holders_info.xlsx', 
      output: 'data/holders_info.json'
    }
  ];
  
  console.log('🚀 开始转换Excel文件...\n');
  
  excelFiles.forEach(({ input, output }) => {
    const inputPath = path.join(__dirname, input);
    const outputPath = path.join(__dirname, output);
    
    // 检查输入文件是否存在
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ 文件不存在: ${inputPath}`);
      return;
    }
    
    // 确保输出目录存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    convertExcelToJson(inputPath, outputPath);
  });
  
  console.log('\n✨ 所有转换任务完成！');
}

// 执行转换
if (require.main === module) {
  main();
}

module.exports = { convertExcelToJson };