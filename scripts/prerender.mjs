// 构建后预渲染（纯 Node，无浏览器依赖，Vercel / Cloudflare CI 可运行）：
// 用 react-dom/server 把每个路由渲染成带内容的静态 HTML，并同步生成 sitemap.xml。
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { build as viteBuild } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

// 1. SSR 打包（复用 vite.config 的 @ 别名与 react 插件，跨平台无 shell 依赖）
await viteBuild({
  root,
  logLevel: 'error',
  build: { ssr: 'scripts/ssr-entry.tsx', outDir: 'dist-ssr' },
})
const { render } = await import(pathToFileURL(path.join(ssrDir, 'ssr-entry.js')).href)

// 2. 从注册表解析路由（名称/路径/描述），新增工具自动纳入
const src = readFileSync(path.join(root, 'src/data/tools.ts'), 'utf-8')
const tools = [...src.matchAll(/\{\s*id:\s*'[^']+',\s*name:\s*'([^']+)',\s*path:\s*'([^']+)',\s*description:\s*'([^']+)'/g)]
  .map((m) => ({ name: m[1], path: m[2], description: m[3] }))
if (tools.length === 0) throw new Error('未能从 src/data/tools.ts 解析到任何工具路由')
const routes = [{ name: '', path: '/', description: '' }, ...tools]

// 3. 逐路由渲染并写入静态 HTML
const shell = readFileSync(path.join(dist, 'index.html'), 'utf-8')
if (!shell.includes('<div id="root"></div>')) throw new Error('dist/index.html 不是预期的空壳，放弃预渲染')

for (const route of routes) {
  const appHtml = render(route.path)
  let html = shell.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
  if (route.path !== '/') {
    if (!appHtml.includes(route.name)) {
      throw new Error(`预渲染校验失败：${route.path} 的 HTML 中未找到「${route.name}」`)
    }
    html = html
      .replace(/<title>[^<]*<\/title>/, `<title>${route.name} - 芝麻工具箱</title>`)
      .replace(
        /(<meta name="description" content=")[^"]*(")/,
        `$1${route.description} - 芝麻工具箱，免费在线工具，无需登录，数据本地处理。$2`
      )
  }
  const file = route.path === '/' ? path.join(dist, 'index.html') : path.join(dist, route.path, 'index.html')
  mkdirSync(path.dirname(file), { recursive: true })
  writeFileSync(file, html)
  console.log(`✓ 预渲染 ${route.path}${route.name ? `（${route.name}）` : ''}`)
}

// 4. sitemap.xml 与注册表同步生成
const today = new Date().toISOString().slice(0, 10)
const urls = routes
  .map((r) => `  <url><loc>https://www.ddandtt.com${r.path}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')
writeFileSync(
  path.join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
)
console.log(`✓ sitemap.xml（${routes.length} 个页面）`)

// 5. 清理 SSR 中间产物
if (existsSync(ssrDir)) rmSync(ssrDir, { recursive: true, force: true })
