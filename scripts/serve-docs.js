/**
 * 此脚本用于启动一个HTTP服务器来展示文档
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// 文档目录路径
const docsDir = path.join(__dirname, '..', 'docs-html');

// 检查文档目录是否存在
if (!fs.existsSync(docsDir)) {
  console.error('HTML文档目录不存在，请先运行 "pnpm docs:html" 生成HTML文档');
  process.exit(1);
}

// 端口号
const PORT = 3456;

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 解析请求的URL
  let url = req.url;
  
  // 默认访问index.html
  if (url === '/') {
    url = '/index.html';
  }
  
  // 构建文件路径
  const filePath = path.join(docsDir, url);
  
  // 检查文件是否存在
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // 文件不存在
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1><p>文件未找到</p>');
      return;
    }
    
    // 获取文件扩展名
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    // 设置Content-Type
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }
    
    // 读取文件
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end(`服务器错误: ${err.code}`);
        return;
      }
      
      // 成功响应
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    });
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`文档服务器已启动: http://localhost:${PORT}`);
  
  // 自动打开浏览器
  const openCommand = process.platform === 'win32'
    ? `start http://localhost:${PORT}`
    : process.platform === 'darwin'
      ? `open http://localhost:${PORT}`
      : `xdg-open http://localhost:${PORT}`;
  
  console.log('正在打开浏览器...');
  exec(openCommand, (error) => {
    if (error) {
      console.error('打开浏览器时出错:', error);
    }
  });
});

console.log('按Ctrl+C停止服务器'); 