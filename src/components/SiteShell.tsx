import { Link, NavLink, Outlet } from 'react-router'
import { Wheat, Github } from 'lucide-react'

export default function SiteShell() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col">
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white">
              <Wheat className="h-5 w-5" />
            </span>
            芝麻工具箱
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 transition-colors ${
                  isActive ? 'bg-amber-100 text-amber-800 font-medium' : 'text-zinc-600 hover:text-zinc-900'
                }`
              }
            >
              首页
            </NavLink>
            <NavLink
              to="/#tools"
              className="rounded-md px-3 py-1.5 text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              全部工具
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-zinc-500 sm:flex-row">
          <p>© 2026 芝麻工具箱 · 免费、免登录、打开即用</p>
          <p className="flex items-center gap-1.5">
            <Github className="h-4 w-4" />
            所有计算均在本地浏览器完成，不上传任何数据
          </p>
        </div>
      </footer>
    </div>
  )
}
