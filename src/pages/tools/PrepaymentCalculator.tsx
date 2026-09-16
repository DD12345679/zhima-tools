import { useMemo, useState } from 'react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'

type LoanType = 'equal-payment' | 'equal-principal'

interface MonthRow {
  payment: number
  principal: number
  interest: number
  remaining: number
}

function buildSchedule(principal: number, annualRate: number, months: number, type: LoanType): MonthRow[] {
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
    rows.push({ payment, principal: principalPart, interest, remaining })
  }
  return rows
}

// 月供固定（等额本息），模拟缩短期限直到还清
function simulateFixedPayment(principal: number, monthlyRate: number, payment: number) {
  let remaining = principal
  let months = 0
  let totalInterest = 0
  while (remaining > 0.005 && months < 1200) {
    const interest = remaining * monthlyRate
    const principalPart = payment - interest
    totalInterest += interest
    months += 1
    if (principalPart >= remaining) {
      remaining = 0
    } else {
      remaining -= principalPart
    }
  }
  return { months, totalInterest }
}

// 月还本金固定（等额本金），模拟缩短期限直到还清
function simulateFixedPrincipal(principal: number, monthlyRate: number, monthlyPrincipal: number) {
  let remaining = principal
  let months = 0
  let totalInterest = 0
  while (remaining > 0.005 && months < 1200) {
    const interest = remaining * monthlyRate
    const principalPart = Math.min(monthlyPrincipal, remaining)
    totalInterest += interest
    months += 1
    remaining -= principalPart
  }
  return { months, totalInterest }
}

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function PrepaymentCalculator() {
  const [amount, setAmount] = useState('100')
  const [rate, setRate] = useState('3.1')
  const [years, setYears] = useState('30')
  const [type, setType] = useState<LoanType>('equal-payment')
  const [paidMonths, setPaidMonths] = useState('24')
  const [prepay, setPrepay] = useState('20')

  const { result, error } = useMemo(() => {
    const P = (parseFloat(amount) || 0) * 10000
    const annual = parseFloat(rate)
    const y = parseInt(years)
    const m = parseInt(paidMonths)
    const X = (parseFloat(prepay) || 0) * 10000

    if (!(P > 0)) return { result: null, error: '请输入贷款金额' }
    if (isNaN(annual) || annual < 0 || annual > 15) return { result: null, error: '年利率范围 0 – 15%' }
    if (isNaN(y) || y < 1 || y > 30) return { result: null, error: '贷款年限范围 1 – 30 年' }
    const n = y * 12
    if (isNaN(m) || m < 0 || m >= n) return { result: null, error: `已还期数范围 0 – ${n - 1} 个月` }

    const schedule = buildSchedule(P, annual, n, type)
    const remaining = m === 0 ? P : schedule[m - 1].remaining
    if (!(X > 0)) return { result: null, error: '请输入提前还款金额' }
    if (X > remaining + 0.01) {
      return { result: null, error: `提前还款金额不能超过剩余本金（当前约 ${(remaining / 10000).toFixed(2)} 万元）` }
    }

    const r = annual / 100 / 12
    const monthsLeft = n - m
    const oldInterestLeft = schedule.slice(m).reduce((s, x) => s + x.interest, 0)
    const P2 = remaining - X

    // 方案一：期限不变，减少月供
    const planA = buildSchedule(P2, annual, monthsLeft, type)
    const interestA = planA.reduce((s, x) => s + x.interest, 0)
    const paymentA = planA[0] ? planA[0].payment : 0

    // 方案二：月供（或月还本金）不变，缩短年限
    let monthsB = 0
    let interestB = 0
    let keepPayment = 0
    if (P2 <= 0.005) {
      monthsB = 0
      interestB = 0
    } else if (type === 'equal-payment') {
      keepPayment = schedule[0].payment
      const sim = simulateFixedPayment(P2, r, keepPayment)
      monthsB = sim.months
      interestB = sim.totalInterest
    } else {
      keepPayment = P / n // 月还本金
      const sim = simulateFixedPrincipal(P2, r, keepPayment)
      monthsB = sim.months
      interestB = sim.totalInterest
    }

    return {
      result: {
        remaining,
        oldInterestLeft,
        monthsLeft,
        monthlyPayment: type === 'equal-payment' ? schedule[0].payment : NaN,
        planA: { payment: paymentA, interest: interestA, saved: oldInterestLeft - interestA },
        planB: {
          months: monthsB,
          shortened: monthsLeft - monthsB,
          interest: interestB,
          saved: oldInterestLeft - interestB,
          keepPayment,
        },
        fullPayoff: P2 <= 0.005,
      },
      error: null,
    }
  }, [amount, rate, years, type, paidMonths, prepay])

  return (
    <ToolPage title="提前还贷计算器" description="输入原贷款信息和提前还款金额，对比「减少月供」与「缩短年限」两种方案分别能省多少利息（不含违约金，以银行合同为准）。">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">贷款信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="pp-amount">贷款金额（万元）</Label>
              <Input id="pp-amount" type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-rate">年利率（%）</Label>
              <Input id="pp-rate" type="number" min="0" max="15" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-years">贷款年限（年，最长 30）</Label>
              <Input id="pp-years" type="number" min="1" max="30" value={years} onChange={(e) => setYears(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>还款方式</Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as LoanType)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equal-payment" id="pp-ep" />
                  <Label htmlFor="pp-ep" className="font-normal">等额本息</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equal-principal" id="pp-epp" />
                  <Label htmlFor="pp-epp" className="font-normal">等额本金</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-paid">已还期数（月）</Label>
              <Input id="pp-paid" type="number" min="0" step="1" value={paidMonths} onChange={(e) => setPaidMonths(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pp-prepay">提前还款金额（万元）</Label>
              <Input id="pp-prepay" type="number" min="0" value={prepay} onChange={(e) => setPrepay(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base">当前状态</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="py-6 text-center text-sm text-zinc-500">{error}</p>
              ) : (
                result && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-zinc-500">剩余本金</p>
                      <p className="text-lg font-bold text-amber-700">{fmt(result.remaining)} 元</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">原计划剩余利息</p>
                      <p className="text-lg font-bold text-red-600">{fmt(result.oldInterestLeft)} 元</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">剩余期数</p>
                      <p className="text-lg font-bold">{result.monthsLeft} 个月</p>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {!error && result && result.fullPayoff && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="py-6 text-center">
                <p className="font-semibold text-emerald-700">提前还款金额已覆盖全部剩余本金，直接结清 🎉</p>
                <p className="mt-1 text-sm text-zinc-500">可节省剩余全部利息约 {fmt(result.oldInterestLeft)} 元</p>
              </CardContent>
            </Card>
          )}

          {!error && result && !result.fullPayoff && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* 方案一 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    方案一：减少月供
                    <Badge variant="secondary">期限不变</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">{type === 'equal-payment' ? '新月供' : '新首月月供'}</dt>
                      <dd className="font-medium">{fmt(result.planA.payment)} 元</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">还款期限</dt>
                      <dd className="font-medium">仍为 {result.monthsLeft} 个月</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">新剩余利息</dt>
                      <dd className="font-medium">{fmt(result.planA.interest)} 元</dd>
                    </div>
                    <div className="my-2 border-t border-dashed border-zinc-200" />
                    <div className="flex justify-between text-base">
                      <dt className="font-semibold">节省利息</dt>
                      <dd className="font-bold text-emerald-600">{fmt(Math.max(0, result.planA.saved))} 元</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* 方案二 */}
              <Card className="border-amber-300">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    方案二：缩短年限
                    <Badge className="bg-amber-500 hover:bg-amber-500">{type === 'equal-payment' ? '月供不变' : '月还本金不变'}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">{type === 'equal-payment' ? '月供保持' : '月还本金保持'}</dt>
                      <dd className="font-medium">{fmt(result.planB.keepPayment)} 元</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">新还款期限</dt>
                      <dd className="font-medium">
                        {result.planB.months} 个月
                        <span className="ml-1.5 text-amber-700">（缩短 {result.planB.shortened} 个月）</span>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-600">新剩余利息</dt>
                      <dd className="font-medium">{fmt(result.planB.interest)} 元</dd>
                    </div>
                    <div className="my-2 border-t border-dashed border-zinc-200" />
                    <div className="flex justify-between text-base">
                      <dt className="font-semibold">节省利息</dt>
                      <dd className="font-bold text-emerald-600">{fmt(Math.max(0, result.planB.saved))} 元</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            </div>
          )}

          {!error && result && !result.fullPayoff && (
            <p className="text-xs text-zinc-500">
              提示：缩短年限通常比减少月供省更多利息；部分银行对提前还款收取违约金或有最低还款额要求，实际以贷款合同为准。
            </p>
          )}
        </div>
      </div>
    </ToolPage>
  )
}
