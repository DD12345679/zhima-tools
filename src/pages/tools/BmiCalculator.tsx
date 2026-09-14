import { useMemo, useState } from 'react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

// 中国成人 BMI 标准（WS/T 428-2013）：偏瘦 <18.5，正常 18.5–23.9，超重 24–27.9，肥胖 ≥28
const categories = [
  { max: 18.5, label: '偏瘦', text: 'text-sky-600', badge: 'bg-sky-100 text-sky-700', bar: 'bg-sky-400' },
  { max: 24, label: '正常', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  { max: 28, label: '超重', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-400' },
  { max: Infinity, label: '肥胖', text: 'text-red-600', badge: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
]

// 刻度条展示范围
const SCALE_MIN = 14
const SCALE_MAX = 32

const fmt = (n: number) => n.toLocaleString('zh-CN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function BmiCalculator() {
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('65')

  const errors = useMemo(() => {
    const h = parseFloat(height)
    const w = parseFloat(weight)
    const e: { height?: string; weight?: string } = {}
    if (height.trim() === '' || isNaN(h)) e.height = '请输入身高'
    else if (h < 80 || h > 250) e.height = '身高范围 80 – 250 厘米'
    if (weight.trim() === '' || isNaN(w)) e.weight = '请输入体重'
    else if (w < 10 || w > 300) e.weight = '体重范围 10 – 300 公斤'
    return e
  }, [height, weight])

  const result = useMemo(() => {
    if (errors.height || errors.weight) return null
    const h = parseFloat(height) / 100
    const w = parseFloat(weight)
    const bmi = w / (h * h)
    const cat = categories.find((c) => bmi < c.max)!
    const minWeight = 18.5 * h * h
    const maxWeight = 23.9 * h * h
    const toNormal =
      w > maxWeight
        ? { type: 'lose' as const, kg: w - maxWeight }
        : w < minWeight
          ? { type: 'gain' as const, kg: minWeight - w }
          : { type: 'ok' as const, kg: 0 }
    const markerPct = Math.min(100, Math.max(0, ((bmi - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100))
    return { bmi, cat, minWeight, maxWeight, toNormal, markerPct }
  }, [height, weight, errors])

  return (
    <ToolPage title="BMI 计算器" description="输入身高体重，按中国成人标准（WS/T 428-2013）评估 BMI 指数，并给出标准体重范围。">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">输入</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="height">身高（厘米）</Label>
              <Input
                id="height"
                type="number"
                min="80"
                max="250"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
              {errors.height && <p className="text-xs text-red-500">{errors.height}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">体重（公斤）</Label>
              <Input
                id="weight"
                type="number"
                min="10"
                max="300"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              {errors.weight && <p className="text-xs text-red-500">{errors.weight}</p>}
              <p className="text-xs text-zinc-500">适用于 18 岁及以上成年人，不适用于孕妇、运动员等特殊人群</p>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base">评估结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!result ? (
              <p className="py-8 text-center text-sm text-zinc-500">请修正左侧输入后查看结果</p>
            ) : (
              <>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">你的 BMI 指数</p>
                    <p className={`text-4xl font-bold ${result.cat.text}`}>{fmt(result.bmi)}</p>
                  </div>
                  <Badge className={`${result.cat.badge} hover:bg-transparent text-sm`}>{result.cat.label}</Badge>
                </div>

                {/* Scale bar */}
                <div>
                  <div className="relative">
                    <div className="flex h-3 w-full overflow-hidden rounded-full">
                      <div className="bg-sky-300" style={{ width: `${((18.5 - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100}%` }} />
                      <div className="bg-emerald-400" style={{ width: `${((24 - 18.5) / (SCALE_MAX - SCALE_MIN)) * 100}%` }} />
                      <div className="bg-amber-400" style={{ width: `${((28 - 24) / (SCALE_MAX - SCALE_MIN)) * 100}%` }} />
                      <div className="bg-red-400" style={{ width: `${((SCALE_MAX - 28) / (SCALE_MAX - SCALE_MIN)) * 100}%` }} />
                    </div>
                    <div
                      className="absolute -top-1 h-5 w-1 rounded-full bg-zinc-900 transition-all"
                      style={{ left: `calc(${result.markerPct}% - 2px)` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[11px] text-zinc-500">
                    <span>偏瘦 &lt;18.5</span>
                    <span>正常 18.5–23.9</span>
                    <span>超重 24–27.9</span>
                    <span>肥胖 ≥28</span>
                  </div>
                </div>

                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-zinc-600">标准体重范围</dt>
                    <dd className="font-medium">
                      {fmt(result.minWeight)} – {fmt(result.maxWeight)} 公斤
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-zinc-600">与正常范围比较</dt>
                    <dd className="font-medium">
                      {result.toNormal.type === 'ok' && <span className="text-emerald-600">已在标准范围内</span>}
                      {result.toNormal.type === 'lose' && (
                        <span className="text-red-600">需减重约 {fmt(result.toNormal.kg)} 公斤</span>
                      )}
                      {result.toNormal.type === 'gain' && (
                        <span className="text-sky-600">需增重约 {fmt(result.toNormal.kg)} 公斤</span>
                      )}
                    </dd>
                  </div>
                  <div className="my-2 border-t border-dashed border-amber-200" />
                  <div className="flex justify-between text-xs text-zinc-500">
                    <dt>参考标准</dt>
                    <dd>中国卫生行业标准 WS/T 428-2013</dd>
                  </div>
                </dl>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  )
}
