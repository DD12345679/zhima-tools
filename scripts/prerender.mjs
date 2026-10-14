// 构建后预渲染：用本机 Edge 无头浏览器把每个路由渲染成带内容的静态 HTML，
// 让搜索引擎蜘蛛直接读到页面内容；同时从注册表同步生成 sitemap.xml。
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const PORT = 4199
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'

// 路由与名称直接从工具注册表解析，新增工具自动纳入
const src = readFileSync(path.join(root, 'src/data/tools.ts'), 'utf-8')
const tools = [...src.matchAll(/name:\s*'([^']+)',\s*\n\s*path:\s*'([^']+)'/g)].map((m) => ({
  name: m[1],
  path: m[2],
}))
const routes = [{ name: '芝麻工具箱', path: '/' }, ...tools]
if (tools.length === 0) throw new Error('未能从 src/data/tools.ts 解析到任何工具路由')

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.xml': 'application/xml', '.txt': 'text/plain', '.webmanifest': 'application/manifest+json',
}

const server = createServer((req, res) => {
  const p = decodeURIComponent((req.url || '/').split('?')[0])
  let file = path.join(dist, p === '/' ? 'index.html' : p)
  if (!existsSync(file) || statSync(file).isDirectory()) file = path.join(dist, 'index.html')
  readFile(file)
    .then((data) => {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' })
      res.end(data)
    })
    .catch(() => {
      res.writeHead(404)
      res.end()
    })
})
await new Promise((r) => server.listen(PORT, r))

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--no-first-run', '--no-default-browser-check'],
})

try {
  const page = await browser.newPage()
  for (const route of routes) {
    await page.goto(`http://127.0.0.1:${PORT}${route.path}`, { waitUntil: 'networkidle0', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 400)) // 等 React 渲染与标题设置
    const html = await page.content()
    if (!html.includes(route.name)) {
      throw new Error(`预渲染校验失败：${route.path} 的 HTML 中未找到「${route.name}」`)
    }
    const file = route.path === '/' ? path.join(dist, 'index.html') : path.join(dist, route.path, 'index.html')
    mkdirSync(path.dirname(file), { recursive: true })
    writeFileSync(file, html)
    console.log(`✓ 预渲染 ${route.path}（${route.name}）`)
  }
} finally {
  await browser.close()
  server.close()
}

// sitemap.xml 与注册表同步生成
const today = new Date().toISOString().slice(0, 10)
const urls = routes
  .map((r) => `  <url><loc>https://www.ddandtt.com${r.path}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')
writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
)
console.log(`✓ sitemap.xml（${routes.length} 个页面）`)
