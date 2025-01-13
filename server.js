const path = require('path')
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// In production, we need to use the standalone directory
const dir = dev ? process.cwd() : path.join(process.cwd(), '.next/standalone')

// Configure Next.js
const app = next({
  dev,
  hostname,
  port,
  dir
})

const handle = app.getRequestHandler()

// Helper to serve static files
const getMimeType = (ext) => {
  const mimeTypes = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

const serveStatic = async (req, res, parsedUrl) => {
  try {
    // Check static paths in order of priority
    const paths = [
      path.join(process.cwd(), '.next/static'),
      path.join(process.cwd(), '.next/standalone/.next/static'),
      path.join(process.cwd(), 'public')
    ]
    
    let relativePath = parsedUrl.pathname
    if (relativePath.startsWith('/_next/static/')) {
      relativePath = relativePath.replace('/_next/static/', '')
    } else if (relativePath.startsWith('/')) {
      relativePath = relativePath.slice(1)
    }
    
    for (const basePath of paths) {
      const staticPath = path.join(basePath, relativePath)
      
      if (fs.existsSync(staticPath)) {
        const stat = fs.statSync(staticPath)
        const ext = path.extname(staticPath)
        
        res.writeHead(200, {
          'Content-Type': getMimeType(ext),
          'Content-Length': stat.size,
          'Cache-Control': 'public, max-age=31536000, immutable'
        })
        
        fs.createReadStream(staticPath).pipe(res)
        return true
      }
    }
    
    console.log(`Static file not found: ${parsedUrl.pathname}`)
    return false
  } catch (error) {
    console.error('Error serving static file:', error)
    return false
  }
}

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      
      // Handle static files explicitly in production
      if (!dev && parsedUrl.pathname?.startsWith('/_next/static/')) {
        if (await serveStatic(req, res, parsedUrl)) {
          return
        }
      }
      
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
