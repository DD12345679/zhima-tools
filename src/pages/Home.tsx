import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Search, Zap, ShieldCheck, MousePointerClick, Flame } from 'lucide-react'
import { tools, categories } from '@/data/tools'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('全部')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tools.filter((t) => {
      const matchCategory = category === '全部' || t.category === category
      const matchQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
      return matchCategory && matchQuery
    })
  }, [query, category])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-amber-50 to-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <Badge variant="secondary" className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Flame className="h-3.5 w-3.5 mr-1" />
            全部免费 · 无需注册
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            芝麻工具箱
            <span className="block mt-3 text-xl font-medium text-zinc-500 sm:text-2xl">
              小巧实用的在线工具集合，打开即用
            </span>
          </h1>
          <div className="mx-auto mt-8 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索工具，比如：个税、房贷、JSON…"
                className="h-12 rounded-full pl-10 bg-white shadow-sm"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  category === c
                    ? 'bg-amber-500 text-white font-medium'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:border-amber-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tool grid */}
      <section id="tools" className="mx-auto max-w-6xl px-4 pb-16">
        {filtered.length === 0 ? (
          <p className="py-20 text-center text-zinc-500">没有找到匹配的工具，换个关键词试试？</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tool) => (
              <Link key={tool.id} to={tool.path}>
                <Card className="h-full transition-all hover:-translate-y-1 hover:border-amber-400 hover:shadow-md">
                  <CardHeader>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                        <tool.icon className="h-5 w-5" />
                      </span>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="text-xs">
                          {tool.category}
                        </Badge>
                        {tool.popular && (
                          <Badge className="bg-orange-500 text-xs hover:bg-orange-500">热门</Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:grid-cols-3">
          {[
            { icon: MousePointerClick, title: '打开即用', desc: '无需下载安装，浏览器打开就能用，手机电脑都适配。' },
            { icon: ShieldCheck, title: '隐私安全', desc: '所有计算都在你的浏览器本地完成，数据不会上传到服务器。' },
            { icon: Zap, title: '持续上新', desc: '每周持续上线新工具，覆盖财务、开发、日常生活场景。' },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="mb-1 font-semibold">{f.title}</h3>
              <p className="text-sm text-zinc-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
