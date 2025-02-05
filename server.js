const path = require('path')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// 确定应用目录
const dir = dev ? process.cwd() : path.join(process.cwd(), '.next/standalone')

// 配置 Next.js
const app = next({
  dev,
  hostname,
  port,
  dir
})

const handle = app.getRequestHandler()

// MIME 类型映射
const getMimeType = (ext) => {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.map': 'application/json'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

// 改进的静态文件服务函数
const serveStatic = async (req, res, parsedUrl) => {
  try {
    const staticPaths = [
      path.join(process.cwd(), 'public'),
      path.join(process.cwd(), '.next/static'),
      path.join(process.cwd(), '.next/standalone/.next/static'),
      path.join(process.cwd(), '.next/standalone/public')
    ]

    let relativePath = parsedUrl.pathname
    if (relativePath.startsWith('/_next/static/')) {
      relativePath = relativePath.replace('/_next/static/', '')
    } else if (relativePath.startsWith('/')) {
      relativePath = relativePath.slice(1)
    }

    // URL 解码路径
    relativePath = decodeURIComponent(relativePath)

    for (const basePath of staticPaths) {
      const staticPath = path.join(basePath, relativePath)
      
      // 安全检查：确保文件路径在允许的目录内
      const normalizedPath = path.normalize(staticPath)
      if (!normalizedPath.startsWith(basePath)) {
        console.warn(`安全警告: 检测到路径遍历尝试 ${relativePath}`)
        continue
      }

      if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
        const stat = fs.statSync(staticPath)
        const ext = path.extname(staticPath)
        
        res.writeHead(200, {
          'Content-Type': getMimeType(ext),
          'Content-Length': stat.size,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        })
        
        fs.createReadStream(staticPath).pipe(res)
        return true
      }
    }

    console.log(`未找到静态文件: ${parsedUrl.pathname}`)
    return false
  } catch (error) {
    console.error('服务静态文件时出错:', error)
    return false
  }
}

// 错误处理中间件
const errorHandler = (err, req, res) => {
  console.error('服务器错误:', err)
  const statusCode = err.statusCode || 500
  const message = dev ? err.message : '服务器内部错误'
  
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify({ error: message }))
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // 在生产环境中显式处理静态文件
      if (!dev && (
        parsedUrl.pathname?.startsWith('/_next/static/') ||
        parsedUrl.pathname?.startsWith('/static/') ||
        parsedUrl.pathname?.startsWith('/images/') ||
        parsedUrl.pathname?.startsWith('/assets/')
      )) {
        if (await serveStatic(req, res, parsedUrl)) {
          return
        }
      }
      
      await handle(req, res, parsedUrl)
    } catch (err) {
      errorHandler(err, req, res)
    }
  })
  .on('error', (err) => {
    console.error('服务器错误:', err)
  })
  .listen(port, (err) => {
    if (err) throw err
    console.log(`
🚀 服务器已启动!
🌍 环境: ${process.env.NODE_ENV}
🔗 地址: http://${hostname}:${port}
📁 应用目录: ${dir}
    `)
  })
})
