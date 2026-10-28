import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Check, Copy } from 'lucide-react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// 支持的时间戳范围：1970-01-01 ～ 2100-12-31
const MIN_TS = 0
const MAX_TS = 4102444800

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="ml-2 inline-flex items-center gap-1 align-middle text-xs text-amber-700 hover:underline"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? '已复制' : '复制'}
    </button>
  )
}

const fmtLocal = (d: Date) => format(d, 'yyyy-MM-dd HH:mm:ss EEEE', { locale: zhCN })

export default function TimestampConverter() {
  // SSR 安全：客户端挂载后才取当前时间
  const [now, setNow] = useState<Date | null>(null)
  const [tsInput, setTsInput] = useState('')
  const [dateInput, setDateInput] = useState('')

  useEffect(() => {
    const d = new Date()
    setNow(d)
    setTsInput(String(Math.floor(d.getTime() / 1000)))
    const pad = (n: number) => String(n).padStart(2, '0')
    setDateInput(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    )
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 时间戳 → 日期
  const tsResult = useMemo(() => {
    const s = tsInput.trim()
    if (!s) return { error: '' as string, date: null as Date | null, unit: '' as string }
    if (!/^-?\d+$/.test(s)) return { error: '请输入整数时间戳', date: null, unit: '' }
    const digits = s.replace('-', '').length
    let ms: number, unit: string
    if (digits <= 10) { ms = parseInt(s) * 1000; unit = '秒' }
    else if (digits <= 13) { ms = parseInt(s); unit = '毫秒' }
    else return { error: '位数过长：秒级 10 位以内，毫秒级 13 位以内', date: null, unit: '' }
    const sec = ms / 1000
    if (sec < MIN_TS || sec > MAX_TS) return { error: '超出支持范围（1970 – 2100 年）', date: null, unit: '' }
    const d = new Date(ms)
    return isNaN(d.getTime()) ? { error: '无效时间戳', date: null, unit: '' } : { error: '', date: d, unit }
  }, [tsInput])

  // 日期 → 时间戳
  const dateResult = useMemo(() => {
    if (!dateInput) return { error: '' as string, sec: null as number | null }
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return { error: '日期格式不正确', sec: null }
    return { error: '', sec: Math.floor(d.getTime() / 1000) }
  }, [dateInput])

  return (
    <ToolPage title="Unix 时间戳转换" description="Unix 时间戳与日期时间互转，自动识别秒级 / 毫秒级，开发调试常用。">
      {/* 当前时间 */}
      <Card className="mb-6 border-amber-200 bg-amber-50/50">
        <CardContent className="grid gap-4 py-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-zinc-500">当前时间</p>
            <p className="font-mono text-lg font-bold">{now ? format(now, 'yyyy-MM-dd HH:mm:ss') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">当前时间戳（秒）</p>
            <p className="font-mono text-lg font-bold text-amber-700">
              {now ? Math.floor(now.getTime() / 1000) : '—'}
              {now && <CopyValue value={String(Math.floor(now.getTime() / 1000))} />}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">当前时间戳（毫秒）</p>
            <p className="font-mono text-lg font-bold">
              {now ? now.getTime() : '—'}
              {now && <CopyValue value={String(now.getTime())} />}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 时间戳 → 日期 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">时间戳 → 日期时间</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ts-input">Unix 时间戳（自动识别秒 / 毫秒）</Label>
              <Input
                id="ts-input"
                value={tsInput}
                onChange={(e) => setTsInput(e.target.value)}
                placeholder="例如：1726531200 或 1726531200000"
                className="font-mono"
              />
            </div>
            {tsResult.error ? (
              <p className="text-sm text-red-500">{tsResult.error}</p>
            ) : tsResult.date ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-600">识别为</dt>
                  <dd className="font-medium">{tsResult.unit}级时间戳</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">本地时间</dt>
                  <dd className="font-medium text-amber-700">{fmtLocal(tsResult.date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">UTC 时间</dt>
                  <dd className="font-mono text-zinc-500">{tsResult.date.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ' UTC')}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">输入时间戳后自动转换</p>
            )}
          </CardContent>
        </Card>

        {/* 日期 → 时间戳 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">日期时间 → 时间戳</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date-input">选择日期时间（本地时区）</Label>
              <Input
                id="date-input"
                type="datetime-local"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
              />
            </div>
            {dateResult.error ? (
              <p className="text-sm text-red-500">{dateResult.error}</p>
            ) : dateResult.sec !== null ? (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-600">秒级时间戳</dt>
                  <dd className="font-mono font-medium text-amber-700">
                    {dateResult.sec}
                    <CopyValue value={String(dateResult.sec)} />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">毫秒级时间戳</dt>
                  <dd className="font-mono font-medium">
                    {dateResult.sec * 1000}
                    <CopyValue value={String(dateResult.sec * 1000)} />
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">选择日期时间后自动转换</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  )
}
