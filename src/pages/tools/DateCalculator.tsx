import { useMemo, useState } from 'react'
import { addDays, differenceInCalendarDays, format, intervalToDuration, isWeekend } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const MAX_SPAN_DAYS = 36525 // 最大支持 100 年跨度
const MAX_OFFSET_DAYS = 36525

const todayStr = () => format(new Date(), 'yyyy-MM-dd')

function parseDate(s: string): Date | null {
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  return isNaN(d.getTime()) ? null : d
}

const fmtDate = (d: Date) => format(d, 'yyyy年M月d日', { locale: zhCN })
const fmtWeek = (d: Date) => format(d, 'EEEE', { locale: zhCN })

function countWorkdays(start: Date, end: Date) {
  let workdays = 0
  let weekends = 0
  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (isWeekend(d)) weekends += 1
    else workdays += 1
  }
  return { workdays, weekends }
}

const quickOffsets = [7, 30, 100, 365]

export default function DateCalculator() {
  return (
    <ToolPage title="日期天数计算器" description="计算两个日期相差多少天、包含几个工作日，或推算 N 天前 / N 天后是几号星期几。">
      <Tabs defaultValue="diff">
        <TabsList className="mb-6 grid w-full grid-cols-2 sm:w-72">
          <TabsTrigger value="diff">日期间隔</TabsTrigger>
          <TabsTrigger value="offset">日期推算</TabsTrigger>
        </TabsList>
        <TabsContent value="diff">
          <DiffPanel />
        </TabsContent>
        <TabsContent value="offset">
          <OffsetPanel />
        </TabsContent>
      </Tabs>
    </ToolPage>
  )
}

/* ---------------- 日期间隔 ---------------- */

function DiffPanel() {
  const [startStr, setStartStr] = useState(todayStr())
  const [endStr, setEndStr] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))

  const { result, error } = useMemo(() => {
    const a = parseDate(startStr)
    const b = parseDate(endStr)
    if (!a || !b) return { result: null, error: '请选择完整的起止日期' }
    const start = a <= b ? a : b
    const end = a <= b ? b : a
    const days = differenceInCalendarDays(end, start)
    if (days > MAX_SPAN_DAYS) return { result: null, error: '日期跨度最大支持 100 年' }
    const inclusive = days + 1
    const weeks = Math.floor(days / 7)
    const weekRem = days % 7
    const { workdays, weekends } = countWorkdays(start, end)
    const duration = intervalToDuration({ start, end })
    return {
      result: {
        start,
        end,
        swapped: a > b,
        days,
        inclusive,
        weeks,
        weekRem,
        workdays,
        weekends,
        years: duration.years ?? 0,
        months: duration.months ?? 0,
        remDays: duration.days ?? 0,
      },
      error: null,
    }
  }, [startStr, endStr])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">选择日期</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="start-date">开始日期</Label>
            <Input id="start-date" type="date" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">结束日期</Label>
            <Input id="end-date" type="date" value={endStr} onChange={(e) => setEndStr(e.target.value)} />
          </div>
          <p className="text-xs text-zinc-500">工作日仅排除周六、周日，不含法定节假日调休</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">间隔结果</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-center text-sm text-zinc-500">{error}</p>
          ) : (
            result && (
              <dl className="space-y-3 text-sm">
                {result.swapped && (
                  <p className="text-xs text-zinc-500">开始日期晚于结束日期，已自动交换计算</p>
                )}
                <div className="flex justify-between">
                  <dt className="text-zinc-600">开始日期</dt>
                  <dd className="font-medium">
                    {fmtDate(result.start)} <span className="text-zinc-400">{fmtWeek(result.start)}</span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">结束日期</dt>
                  <dd className="font-medium">
                    {fmtDate(result.end)} <span className="text-zinc-400">{fmtWeek(result.end)}</span>
                  </dd>
                </div>
                <div className="my-2 border-t border-dashed border-amber-200" />
                <div className="flex justify-between text-base">
                  <dt className="font-semibold">相差天数</dt>
                  <dd className="font-bold text-amber-700">{result.days.toLocaleString()} 天</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">含首尾共</dt>
                  <dd className="font-medium">{result.inclusive.toLocaleString()} 天</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">折合</dt>
                  <dd>
                    <Badge variant="secondary" className="bg-white">
                      {result.years > 0 && `${result.years} 年 `}
                      {result.months > 0 && `${result.months} 个月 `}
                      {result.remDays} 天
                    </Badge>
                    <Badge variant="secondary" className="ml-1.5 bg-white">
                      {result.weeks} 周 {result.weekRem > 0 ? `零 ${result.weekRem} 天` : '整'}
                    </Badge>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">工作日（含首尾）</dt>
                  <dd className="font-medium text-emerald-600">{result.workdays.toLocaleString()} 天</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">周末（含首尾）</dt>
                  <dd className="font-medium text-zinc-500">{result.weekends.toLocaleString()} 天</dd>
                </div>
              </dl>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- 日期推算 ---------------- */

function OffsetPanel() {
  const [baseStr, setBaseStr] = useState(todayStr())
  const [offset, setOffset] = useState('100')
  const [direction, setDirection] = useState<'after' | 'before'>('after')

  const { result, error } = useMemo(() => {
    const base = parseDate(baseStr)
    if (!base) return { result: null, error: '请选择起始日期' }
    const n = parseInt(offset)
    if (offset.trim() === '' || isNaN(n) || n < 0) return { result: null, error: '请输入不小于 0 的整数天数' }
    if (n > MAX_OFFSET_DAYS) return { result: null, error: '推算天数最大支持 100 年（36525 天）' }
    const target = addDays(base, direction === 'after' ? n : -n)
    const fromToday = differenceInCalendarDays(target, new Date())
    return { result: { base, target, n, fromToday }, error: null }
  }, [baseStr, offset, direction])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">推算条件</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="base-date">起始日期</Label>
            <Input id="base-date" type="date" value={baseStr} onChange={(e) => setBaseStr(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offset-days">间隔天数</Label>
            <Input id="offset-days" type="number" min="0" step="1" value={offset} onChange={(e) => setOffset(e.target.value)} />
            <div className="flex flex-wrap gap-2 pt-1">
              {quickOffsets.map((n) => (
                <button
                  key={n}
                  onClick={() => setOffset(String(n))}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-amber-400 hover:text-amber-700"
                >
                  {n} 天
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>方向</Label>
            <RadioGroup value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="after" id="after" />
                <Label htmlFor="after" className="font-normal">之后（往后推）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="before" id="before" />
                <Label htmlFor="before" className="font-normal">之前（往前推）</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="text-base">推算结果</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-center text-sm text-zinc-500">{error}</p>
          ) : (
            result && (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-600">起始日期</dt>
                  <dd className="font-medium">
                    {fmtDate(result.base)} <span className="text-zinc-400">{fmtWeek(result.base)}</span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">推算</dt>
                  <dd>
                    <Badge variant="secondary" className="bg-white">
                      {direction === 'after' ? '之后' : '之前'} {result.n.toLocaleString()} 天
                    </Badge>
                  </dd>
                </div>
                <div className="my-2 border-t border-dashed border-amber-200" />
                <div className="flex justify-between text-base">
                  <dt className="font-semibold">目标日期</dt>
                  <dd className="font-bold text-amber-700">
                    {fmtDate(result.target)}
                    <span className="ml-1.5 text-sm font-medium text-zinc-500">{fmtWeek(result.target)}</span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-600">距离今天</dt>
                  <dd className="font-medium">
                    {result.fromToday === 0 && <span className="text-emerald-600">就是今天</span>}
                    {result.fromToday > 0 && <span className="text-amber-700">还有 {result.fromToday.toLocaleString()} 天</span>}
                    {result.fromToday < 0 && (
                      <span className="text-zinc-500">已过去 {Math.abs(result.fromToday).toLocaleString()} 天</span>
                    )}
                  </dd>
                </div>
              </dl>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
