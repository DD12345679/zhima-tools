import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface MonthRow {
  month: number
  payment: number
  principal: number
  interest: number
  remaining: number
}

function buildSchedule(principal: number, annualRate: number, years: number, type: 'equal-payment' | 'equal-principal') {
  const months = years * 12
  const r = annualRate / 100 / 12
  const rows: MonthRow[] = []
  let remaining = principal
  const monthlyPrincipal = principal / months

  for (let m = 1; m <= months; m++) {
    let payment: number, interest: number, principalPart: number
    if (type === 'equal-payment') {
      payment = r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
      interest = remaining * r
      principalPart = payment - interest
    } else {
      principalPart = monthlyPrincipal
      interest = remaining * r
      payment = principalPart + interest
    }
    remaining = Math.max(0, remaining - principalPart)
    rows.push({
      month: m,
      payment,
      principal: principalPart,
      interest,
      remaining,
    })
  }
  return rows
}

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MortgageCalculator() {
  const [amount, setAmount] = useState('100')
  const [rate, setRate] = useState('3.1')
  const [years, setYears] = useState('30')
  const [type, setType] = useState<'equal-payment' | 'equal-principal'>('equal-payment')

  const rows = useMemo(() => {
    const p = (parseFloat(amount) || 0) * 10000
    const r = parseFloat(rate) || 0
    const y = Math.min(Math.max(parseInt(years) || 0, 1), 30)
    return buildSchedule(p, r, y, type)
  }, [amount, rate, years, type])

  const totalPayment = rows.reduce((s, x) => s + x.payment, 0)
  const totalInterest = rows.reduce((s, x) => s + x.interest, 0)
  const firstMonth = rows[0]
  const lastMonth = rows[rows.length - 1]

  return (
    <ToolPage title="房贷计算器" description="对比等额本息与等额本金两种还款方式，查看月供、总利息和还款曲线。">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">贷款信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="amount">贷款金额（万元）</Label>
              <Input id="amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">年利率（%）</Label>
              <Input id="rate" type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
              <p className="text-xs text-zinc-500">2025 年后首套房公积金利率约 2.6%，商贷约 3.1%，以实际为准</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="years">贷款年限（年，最长 30）</Label>
              <Input id="years" type="number" min="1" max="30" value={years} onChange={(e) => setYears(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>还款方式</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as typeof type)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equal-payment" id="ep" />
                  <Label htmlFor="ep" className="font-normal">等额本息（月供固定）</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equal-principal" id="epp" />
                  <Label htmlFor="epp" className="font-normal">等额本金（逐月递减）</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="border-amber-200 bg-amber-50/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">计算结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs text-zinc-500">首月月供</p>
                <p className="text-lg font-bold text-amber-700">{firstMonth ? fmt(firstMonth.payment) : '-'} 元</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">末月月供</p>
                <p className="text-lg font-bold">{lastMonth ? fmt(lastMonth.payment) : '-'} 元</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">总利息</p>
                <p className="text-lg font-bold text-red-600">{fmt(totalInterest)} 元</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">还款总额</p>
                <p className="text-lg font-bold">{fmt(totalPayment)} 元</p>
              </div>
            </div>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows.filter((_, i) => i % 6 === 0)} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="month" tickFormatter={(m) => `${m}月`} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                  <YAxis tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`} tick={{ fontSize: 11 }} stroke="#a1a1aa" />
                  <Tooltip
                    formatter={(value: number) => [`${fmt(value)} 元`, '剩余本金']}
                    labelFormatter={(m) => `第 ${m} 个月`}
                  />
                  <Area type="monotone" dataKey="remaining" stroke="#f59e0b" fill="#fde68a" strokeWidth={2} name="剩余本金" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule table */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">还款计划表</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleTable rows={rows} />
        </CardContent>
      </Card>
    </ToolPage>
  )
}

function ScheduleTable({ rows }: { rows: MonthRow[] }) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? rows : rows.slice(0, 12)
  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>期数</TableHead>
              <TableHead className="text-right">月供（元）</TableHead>
              <TableHead className="text-right">本金（元）</TableHead>
              <TableHead className="text-right">利息（元）</TableHead>
              <TableHead className="text-right">剩余本金（元）</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((r) => (
              <TableRow key={r.month}>
                <TableCell>第 {r.month} 期</TableCell>
                <TableCell className="text-right">{fmt(r.payment)}</TableCell>
                <TableCell className="text-right">{fmt(r.principal)}</TableCell>
                <TableCell className="text-right text-zinc-500">{fmt(r.interest)}</TableCell>
                <TableCell className="text-right">{fmt(r.remaining)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!showAll && rows.length > 12 && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 text-sm text-amber-700 hover:underline"
        >
          展开全部 {rows.length} 期 →
        </button>
      )}
    </div>
  )
}
