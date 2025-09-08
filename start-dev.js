const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 确保logs目录存在
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// 生成时间戳
const now = new Date();
const timestamp = now.getFullYear() + 
  String(now.getMonth() + 1).padStart(2, '0') + 
  String(now.getDate()).padStart(2, '0') + '-' +
  String(now.getHours()).padStart(2, '0') + 
  String(now.getMinutes()).padStart(2, '0') + 
  String(now.getSeconds()).padStart(2, '0');

const logFile = path.join(logsDir, `dev-${timestamp}.log`);

console.log(`Starting dev server, logging to: ${logFile}`);

// 启动next dev并将输出重定向到log文件
// 在Windows上使用npx来确保能找到next命令
const isWindows = process.platform === 'win32';
const command = isWindows ? 'npx' : 'next';
const args = isWindows ? ['next', 'dev'] : ['dev'];

const child = spawn(command, args, {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: isWindows,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    __NEXT_DISABLE_FAST_REFRESH: 'false'
  }
});

// 创建写入流
const logStream = fs.createWriteStream(logFile);

// 将stdout和stderr都写入log文件，同时保持在控制台显示
child.stdout.on('data', (data) => {
  process.stdout.write(data);
  logStream.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  logStream.write(data);
});

child.on('close', (code) => {
  logStream.end();
  process.exit(code);
});

// 处理进程退出
process.on('SIGINT', () => {
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
});