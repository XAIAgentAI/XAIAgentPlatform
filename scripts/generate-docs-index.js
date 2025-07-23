/**
 * 此脚本用于生成文档的HTML索引页面
 */
const fs = require('fs');
const path = require('path');

console.log('正在生成文档索引页面...');

// 文档目录路径
const docsDir = path.join(__dirname, '..', 'docs');
// 索引文件路径
const indexPath = path.join(docsDir, 'index.html');

// 检查文档目录是否存在
if (!fs.existsSync(docsDir)) {
  console.error('文档目录不存在，请先运行 "pnpm docs" 生成文档');
  process.exit(1);
}

// 获取所有Markdown文件
const files = fs.readdirSync(docsDir);
const mdFiles = files.filter(file => file.endsWith('.md')).sort();

if (mdFiles.length === 0) {
  console.error('未找到任何Markdown文档文件');
  process.exit(1);
}

// 创建HTML内容
let htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>XAIAgentPlatform API文档</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      border-bottom: 1px solid #eaecef;
      padding-bottom: 10px;
    }
    .container {
      display: flex;
      flex-wrap: wrap;
    }
    .section {
      flex: 1;
      min-width: 300px;
      margin-right: 20px;
      margin-bottom: 20px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin-bottom: 8px;
    }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .file-icon {
      margin-right: 5px;
      color: #666;
    }
    .timestamp {
      color: #666;
      font-size: 0.85em;
      margin-left: 10px;
    }
    .search-box {
      margin-bottom: 20px;
      width: 100%;
      padding: 8px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>XAIAgentPlatform API文档</h1>
  
  <input type="text" class="search-box" id="searchBox" placeholder="搜索文档...">
  
  <div class="container">
    <div class="section">
      <h2>主要文档</h2>
      <ul id="mainDocs">
`;

// 添加主要文档链接
const mainDocs = ['README.md', 'modules.md', 'typedoc-guide.md'];
mainDocs.forEach(file => {
  if (mdFiles.includes(file)) {
    const stats = fs.statSync(path.join(docsDir, file));
    const lastModified = new Date(stats.mtime).toLocaleString();
    const displayName = file === 'README.md' ? '首页' : 
                       file === 'modules.md' ? '模块列表' :
                       file.replace('.md', '');
    
    htmlContent += `        <li><span class="file-icon">📄</span><a href="${file}">${displayName}</a><span class="timestamp">${lastModified}</span></li>\n`;
  }
});

htmlContent += `
      </ul>
    </div>
    
    <div class="section">
      <h2>模块文档</h2>
      <ul id="moduleDocs">
`;

// 添加模块文档链接
const moduleDocs = mdFiles.filter(file => 
  file.startsWith('modules') && 
  file !== 'modules.md'
);

moduleDocs.forEach(file => {
  const stats = fs.statSync(path.join(docsDir, file));
  const lastModified = new Date(stats.mtime).toLocaleString();
  const displayName = file.replace('modules.', '').replace('.md', '');
  
  htmlContent += `        <li><span class="file-icon">📦</span><a href="${file}">${displayName}</a><span class="timestamp">${lastModified}</span></li>\n`;
});

htmlContent += `
      </ul>
    </div>
    
    <div class="section">
      <h2>其他文档</h2>
      <ul id="otherDocs">
`;

// 添加其他文档链接
const otherDocs = mdFiles.filter(file => 
  !mainDocs.includes(file) && 
  !moduleDocs.includes(file)
);

otherDocs.forEach(file => {
  const stats = fs.statSync(path.join(docsDir, file));
  const lastModified = new Date(stats.mtime).toLocaleString();
  const displayName = file.replace('.md', '');
  
  htmlContent += `        <li><span class="file-icon">📄</span><a href="${file}">${displayName}</a><span class="timestamp">${lastModified}</span></li>\n`;
});

htmlContent += `
      </ul>
    </div>
  </div>

  <script>
    // 简单的搜索功能
    document.getElementById('searchBox').addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const allItems = document.querySelectorAll('li');
      
      allItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  </script>
</body>
</html>
`;

// 写入索引文件
fs.writeFileSync(indexPath, htmlContent);

console.log(`文档索引页面已生成: ${indexPath}`); 