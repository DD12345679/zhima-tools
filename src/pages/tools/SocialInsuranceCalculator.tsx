import { useMemo, useState } from 'react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// 个人缴纳比例（全国基本统一）；单位缴纳比例为常见参考值，各地略有差异
const items = [
  { name: '养老保险', personal: 0.08, employer: 0.16 },
  { name: '医疗保险', personal: 0.02, employer: 0.09 },
  { name: '失业保险', personal: 0.005, employer: 0.005 },
  { name: '工伤保险', personal: 0, employer: 0.004 },
  { name: '生育保险', personal: 0, employer: 0.008 },
]

// 与站内个税计算器一致的月度简化税率表
const brackets = [
  { limit: 3000, rate: 0.03, deduction: 0 },
  { limit: 12000, rate: 0.1, deduction: 210 },
  { limit: 25000, rate: 0.2, deduction: 1410 },
  { limit: 35000, rate: 0.25, deduction: 2660 },
  { limit: 55000, rate: 0.3, deduction: 4410 },
  { limit: 80000, rate: 0.35, deduction: 7160 },
  { limit: Infinity, rate: 0.45, deduction: 15160 },
]

function calcTax(taxable: number) {
  const b = brackets.find((x) => taxable <= x.limit)!
  return Math.max(0, taxable * b.rate - b.deduction)
}

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function SocialInsuranceCalculator() {
  const [salary, setSalary] = useState('10000')
  const [base, setBase] = useState('10000')
  const [fundRate, setFundRate] = useState('12')
  const [extraDeduction, setExtraDeduction] = useState('0')

  const { result, error } = useMemo(() => {
    const s = parseFloat(salary)
    const b = parseFloat(base)
    const fr = parseFloat(fundRate) / 100
    const ed = parseFloat(extraDeduction) || 0
    if (isNaN(s) || s <= 0 || s > 1000000) return { result: null, error: '请输入税前月薪（0 – 100 万元）' }
    if (isNaN(b) || b <= 0 || b > 1000000) return { result: null, error: '请输入缴费基数（通常为月薪，受当地社平工资 60% – 300% 限制）' }
    if (ed < 0 || ed > 100000) return { result: null, error: '专项附加扣除范围 0 – 10 万元/月' }

    const rows = items.map((it) => ({
      name: it.name,
      personalRate: it.personal,
      personal: b * it.personal,
      employer: b * it.employer,
    }))
    rows.push({ name: '住房公积金', personalRate: fr, personal: b * fr, employer: b * fr })

    const personalTotal = rows.reduce((sum, r) => sum + r.personal, 0)
    const employerTotal = rows.reduce((sum, r) => sum + r.employer, 0)
    const taxable = Math.max(0, s - personalTotal - 5000 - ed)
    const tax = calcTax(taxable)
    const net = s - personalTotal - tax
    return {
      result: { rows, personalTotal, employerTotal, taxable, tax, net, companyCost: s + employerTotal, capped: personalTotal >= s },
      error: null,
    }
  }, [salary, base, fundRate, extraDeduction])

  return (
    <ToolPage title="五险一金计算器" description="输入税前月薪和缴费基数，估算个人与单位每月五险一金缴纳明细、个税和到手工资（简化估算，具体以当地社保口径为准）。">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">输入</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="si-salary">税前月薪（元）</Label>
              <Input id="si-salary" type="number" min="0" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="si-base">社保 / 公积金缴费基数（元）</Label>
              <Input id="si-base" type="number" min="0" value={base} onChange={(e) => setBase(e.target.value)} />
              <p className="text-xs text-zinc-500">通常等于月薪；各地按社平工资 60% – 300% 设上下限，请按实际填写</p>
            </div>
            <div className="space-y-2">
              <Label>公积金缴存比例</Label>
              <Select value={fundRate} onValueChange={setFundRate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['5', '7', '10', '12'].map((r) => (
                    <SelectItem key={r} value={r}>{r}%（个人与单位同比例）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="si-ed">专项附加扣除（元/月）</Label>
              <Input id="si-ed" type="number" min="0" value={extraDeduction} onChange={(e) => setExtraDeduction(e.target.value)} />
              <p className="text-xs text-zinc-500">子女教育、房贷利息、赡养老人等，没有则填 0</p>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base">计算结果</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="py-6 text-center text-sm text-zinc-500">{error}</p>
              ) : (
                result && (
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">个人五险一金</p>
                      <p className="text-lg font-bold text-red-600">- {fmt(result.personalTotal)} 元</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">每月个税</p>
                      <p className="text-lg font-bold text-red-600">- {fmt(result.tax)} 元</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">每月到手</p>
                      <p className="text-lg font-bold text-emerald-600">{fmt(result.net)} 元</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">单位为你缴纳</p>
                      <p className="text-lg font-bold">{fmt(result.employerTotal)} 元</p>
                    </div>
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {!error && result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">缴纳明细</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>项目</TableHead>
                        <TableHead className="text-right">个人比例</TableHead>
                        <TableHead className="text-right">个人缴纳（元）</TableHead>
                        <TableHead className="text-right">单位缴纳（元）</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.rows.map((r) => (
                        <TableRow key={r.name}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell className="text-right">{(r.personalRate * 100).toFixed(1)}%</TableCell>
                          <TableCell className="text-right">{r.personal > 0 ? fmt(r.personal) : '—'}</TableCell>
                          <TableCell className="text-right text-zinc-500">{fmt(r.employer)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-amber-50/60 font-medium">
                        <TableCell>合计</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right">{fmt(result.personalTotal)}</TableCell>
                        <TableCell className="text-right">{fmt(result.employerTotal)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-600">应纳税所得额（月薪 − 个人五险一金 − 5000 − 专项附加扣除）</dt>
                    <dd className="font-medium">{fmt(result.taxable)} 元</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-600">企业用工总成本（税前月薪 + 单位缴纳）</dt>
                    <dd className="font-medium">{fmt(result.companyCost)} 元</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-zinc-500">
                  说明：个人比例全国统一（养老 8%、医疗 2%、失业 0.5%）；单位比例为常见参考值，各城市略有差异；个税按月度简化估算，实际以累计预扣为准。
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ToolPage>
  )
}
