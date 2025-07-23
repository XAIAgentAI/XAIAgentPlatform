/**
 * 此脚本用于在生成文档后自动打开文档
 */
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// 文档目录路径
const docsDir = path.join(__dirname, '..', 'docs');
// HTML索引页面路径
const indexHtmlPath = path.join(docsDir, 'index.html');
// 主文档路径（Markdown格式）
const mainDocPath = path.join(docsDir, 'README.md');
// 模块文档路径（作为备选）
const modulesDocPath = path.join(docsDir, 'modules.md');

// 检查文档目录是否存在
if (!fs.existsSync(docsDir)) {
  console.error('文档目录不存在，请先运行 "pnpm docs" 生成文档');
  process.exit(1);
}

// 确定要打开的文档文件
let docToOpen = '';
// 优先打开HTML索引页面
if (fs.existsSync(indexHtmlPath)) {
  docToOpen = indexHtmlPath;
} else if (fs.existsSync(mainDocPath)) {
  docToOpen = mainDocPath;
} else if (fs.existsSync(modulesDocPath)) {
  docToOpen = modulesDocPath;
} else {
  // 尝试找到任何markdown文件
  const files = fs.readdirSync(docsDir);
  const mdFiles = files.filter(file => file.endsWith('.md'));
  
  if (mdFiles.length > 0) {
    docToOpen = path.join(docsDir, mdFiles[0]);
  } else {
    console.error('未找到任何文档文件，请先运行 "pnpm docs" 生成文档');
    process.exit(1);
  }
}

// 根据操作系统打开文档
const openCommand = process.platform === 'win32'
  ? `start "" "${docToOpen}"`
  : process.platform === 'darwin'
    ? `open "${docToOpen}"`
    : `xdg-open "${docToOpen}"`;

console.log(`正在打开文档: ${docToOpen}`);
exec(openCommand, (error) => {
  if (error) {
    console.error('打开文档时出错:', error);
    process.exit(1);
  }
}); 