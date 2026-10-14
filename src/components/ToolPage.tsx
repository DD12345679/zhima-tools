import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'

interface ToolPageProps {
  title: string
  description: string
  children: ReactNode
}

export default function ToolPage({ title, description, children }: ToolPageProps) {
  // SEO：每个工具页设置独立的标题与描述，蜘蛛与用户标签页都能识别
  useEffect(() => {
    document.title = `${title} - 芝麻工具箱`
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', `${description} - 芝麻工具箱，免费在线工具，无需登录，数据本地处理。`)
  }, [title, description])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link
        to="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900"
      >
        <ArrowLeft className="h-4 w-4" />
        返回全部工具
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-zinc-500">{description}</p>
      </div>
      {children}
    </div>
  )
}
