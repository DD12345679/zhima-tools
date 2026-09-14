import { useMemo, useState } from 'react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// 按月换算后的综合所得税率表（月度应纳税所得额 = 税前 - 五险一金 - 5000）
const brackets = [
  { limit: 3000, rate: 0.03, deduction: 0 },
  { limit: 12000, rate: 0.1, deduction: 210 },
  { limit: 25000, rate: 0.2, deduction: 1410 },
  { limit: 35000, rate: 0.25, deduction: 2660 },
  { limit: 55000, rate: 0.3, deduction: 4410 },
  { limit: 80000, rate: 0.35, deduction: 7160 },
  { limit: Infinity, rate: 0.45, deduction: 15160 },
]

function calcTax(gross: number, insurance: number) {
  const taxable = Math.max(0, gross - insurance - 5000)
  const b = brackets.find((x) => taxable <= x.limit)!
  const tax = Math.max(0, taxable * b.rate - b.deduction)
  return { taxable, rate: b.rate, tax, net: gross - insurance - tax }
}

const fmt = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function TaxCalculator() {
  const [gross, setGross] = useState('15000')
  const [insurance, setInsurance] = useState('3000')

  const result = useMemo(() => {
    const g = parseFloat(gross) || 0
    const i = Math.min(parseFloat(insurance) || 0, g)
    return calcTax(g, i)
  }, [gross, insurance])

  return (
    <ToolPage title="个人所得税计算器" description="按月估算税前月薪扣除五险一金后的个税与到手收入（结果为估算值，实际以单位预扣为准）。">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">输入</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="gross">税前月薪（元）</Label>
              <Input
                id="gross"
                type="number"
                min="0"
                value={gross}
                onChange={(e) => setGross(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insurance">五险一金个人缴纳（元/月）</Label>
              <Input
                id="insurance"
                type="number"
                min="0"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
              />
              <p className="text-xs text-zinc-500">通常为工资的 10.5% – 12%，各地比例不同</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base">计算结果</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-600">应纳税所得额</dt>
                <dd className="font-medium">{fmt(result.taxable)} 元</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">适用税率</dt>
                <dd>
                  <Badge variant="secondary" className="bg-white">{(result.rate * 100).toFixed(0)}%</Badge>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-600">每月个税</dt>
                <dd className="font-medium text-red-600">- {fmt(result.tax)} 元</dd>
              </div>
              <div className="my-2 border-t border-dashed border-amber-200" />
              <div className="flex justify-between text-base">
                <dt className="font-semibold">每月到手</dt>
                <dd className="font-bold text-emerald-600">{fmt(result.net)} 元</dd>
              </div>
              <div className="flex justify-between text-sm text-zinc-500">
                <dt>年收入（税后）</dt>
                <dd>{fmt(result.net * 12)} 元</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  )
}
