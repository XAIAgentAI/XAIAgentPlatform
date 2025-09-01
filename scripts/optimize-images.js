#!/usr/bin/env node

/**
 * 图片优化脚本
 * 压缩 public/logo 目录中的大图片文件
 */

const fs = require('fs');
const path = require('path');

// 检查图片文件大小
function analyzeImages(dir) {
  const images = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile() && /\.(png|jpg|jpeg|gif|webp)$/i.test(file)) {
        images.push({
          name: file,
          path: filePath,
          size: stat.size,
          sizeMB: Math.round(stat.size / 1024 / 1024 * 100) / 100
        });
      }
    }
  } catch (error) {
    console.error(`无法读取目录 ${dir}:`, error.message);
  }
  
  return images.sort((a, b) => b.size - a.size);
}

// 生成优化建议
function generateOptimizationSuggestions(images) {
  console.log('🖼️  图片优化分析报告');
  console.log('=' * 50);
  
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const totalSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
  
  console.log(`\n📊 图片统计:`);
  console.log(`  总文件数: ${images.length}`);
  console.log(`  总大小: ${totalSizeMB} MB`);
  
  console.log(`\n📁 文件详情:`);
  images.forEach((img, index) => {
    const status = img.sizeMB > 2 ? '🔴' : img.sizeMB > 1 ? '🟡' : '🟢';
    console.log(`  ${status} ${img.name}: ${img.sizeMB} MB`);
  });
  
  const largeImages = images.filter(img => img.sizeMB > 1);
  
  if (largeImages.length > 0) {
    console.log(`\n⚠️  发现 ${largeImages.length} 个大图片文件 (>1MB):`);
    
    console.log(`\n💡 优化建议:`);
    console.log(`  1. 使用在线工具压缩图片:`);
    console.log(`     • TinyPNG: https://tinypng.com/`);
    console.log(`     • Squoosh: https://squoosh.app/`);
    
    console.log(`\n  2. 转换为更高效的格式:`);
    largeImages.forEach(img => {
      if (img.name.toLowerCase().endsWith('.png')) {
        console.log(`     • ${img.name} → ${img.name.replace('.png', '.webp')} (可减少60-80%)`);
      }
    });
    
    console.log(`\n  3. 调整图片尺寸:`);
    console.log(`     • 检查是否需要如此高的分辨率`);
    console.log(`     • 考虑提供多种尺寸版本`);
    
    console.log(`\n  4. 使用 CDN:`);
    console.log(`     • 将大图片上传到 CDN 服务`);
    console.log(`     • 减少服务器内存占用`);
    
    // 生成具体的优化命令
    console.log(`\n🔧 可执行的优化命令:`);
    console.log(`  # 如果安装了 imagemin-cli:`);
    console.log(`  npx imagemin public/logo/*.png --out-dir=public/logo/optimized --plugin=imagemin-pngquant`);
    
    console.log(`\n  # 或者使用 sharp (需要先安装: npm install sharp):`);
    largeImages.slice(0, 3).forEach(img => {
      const outputName = img.name.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      console.log(`  npx sharp -i "${img.path}" -o "public/logo/optimized/${outputName}" --webp`);
    });
    
    // 估算优化后的大小
    const estimatedSavings = largeImages.reduce((sum, img) => {
      if (img.name.toLowerCase().endsWith('.png')) {
        return sum + img.size * 0.7; // PNG 转 WebP 通常能节省 70%
      }
      return sum + img.size * 0.5; // 其他格式通常能节省 50%
    }, 0);
    
    const estimatedSavingsMB = Math.round(estimatedSavings / 1024 / 1024 * 100) / 100;
    console.log(`\n📉 预估优化效果:`);
    console.log(`  当前大小: ${totalSizeMB} MB`);
    console.log(`  优化后大小: ${Math.round((totalSize - estimatedSavings) / 1024 / 1024 * 100) / 100} MB`);
    console.log(`  预计节省: ${estimatedSavingsMB} MB (${Math.round(estimatedSavings / totalSize * 100)}%)`);
    
  } else {
    console.log(`\n✅ 所有图片文件大小都在合理范围内 (<1MB)`);
  }
  
  console.log('\n' + '=' * 50);
}

// 创建备份目录
function createBackupDirectory() {
  const backupDir = 'public/logo/backup';
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`✅ 创建备份目录: ${backupDir}`);
  }
  return backupDir;
}

// 备份大图片
function backupLargeImages(images, threshold = 1024 * 1024) {
  const backupDir = createBackupDirectory();
  const largeImages = images.filter(img => img.size > threshold);
  
  if (largeImages.length === 0) {
    console.log('✅ 没有需要备份的大图片');
    return;
  }
  
  console.log(`\n💾 备份 ${largeImages.length} 个大图片...`);
  
  largeImages.forEach(img => {
    try {
      const backupPath = path.join(backupDir, img.name);
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(img.path, backupPath);
        console.log(`  ✅ 备份: ${img.name}`);
      } else {
        console.log(`  ⏭️  跳过 (已存在): ${img.name}`);
      }
    } catch (error) {
      console.error(`  ❌ 备份失败 ${img.name}:`, error.message);
    }
  });
}

// 主函数
function main() {
  const logoDir = 'public/logo';
  
  if (!fs.existsSync(logoDir)) {
    console.error(`❌ 目录不存在: ${logoDir}`);
    process.exit(1);
  }
  
  const images = analyzeImages(logoDir);
  
  if (images.length === 0) {
    console.log('❌ 未找到图片文件');
    process.exit(1);
  }
  
  generateOptimizationSuggestions(images);
  
  // 询问是否要备份大图片
  const largeImages = images.filter(img => img.sizeMB > 1);
  if (largeImages.length > 0) {
    console.log(`\n❓ 是否要备份 ${largeImages.length} 个大图片到 public/logo/backup 目录?`);
    console.log('   运行: node scripts/optimize-images.js --backup');
  }
}

// 处理命令行参数
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--backup')) {
    const logoDir = 'public/logo';
    const images = analyzeImages(logoDir);
    backupLargeImages(images);
  } else {
    main();
  }
}

module.exports = {
  analyzeImages,
  generateOptimizationSuggestions,
  backupLargeImages
};
