import { useMemo, useState } from 'react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface UnitDef {
  name: string
  // 与基准单位的换算系数（温度类用特殊函数处理）
  toBase: (v: number) => number
  fromBase: (v: number) => number
}

const linear = (factor: number) => ({
  toBase: (v: number) => v * factor,
  fromBase: (v: number) => v / factor,
})

const categories: Record<string, { base: string; units: Record<string, UnitDef> }> = {
  长度: {
    base: '米',
    units: {
      毫米: { name: '毫米 (mm)', ...linear(0.001) },
      厘米: { name: '厘米 (cm)', ...linear(0.01) },
      米: { name: '米 (m)', ...linear(1) },
      千米: { name: '千米 (km)', ...linear(1000) },
      英寸: { name: '英寸 (in)', ...linear(0.0254) },
      英尺: { name: '英尺 (ft)', ...linear(0.3048) },
      英里: { name: '英里 (mi)', ...linear(1609.344) },
      里: { name: '里（市里）', ...linear(500) },
    },
  },
  重量: {
    base: '千克',
    units: {
      毫克: { name: '毫克 (mg)', ...linear(0.000001) },
      克: { name: '克 (g)', ...linear(0.001) },
      千克: { name: '千克 (kg)', ...linear(1) },
      吨: { name: '吨 (t)', ...linear(1000) },
      磅: { name: '磅 (lb)', ...linear(0.45359237) },
      盎司: { name: '盎司 (oz)', ...linear(0.028349523125) },
      斤: { name: '斤（市斤）', ...linear(0.5) },
      两: { name: '两（市两）', ...linear(0.05) },
    },
  },
  温度: {
    base: '摄氏度',
    units: {
      摄氏度: {
        name: '摄氏度 (°C)',
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      华氏度: {
        name: '华氏度 (°F)',
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      开尔文: {
        name: '开尔文 (K)',
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    },
  },
  数据容量: {
    base: '字节',
    units: {
      字节: { name: '字节 (B)', ...linear(1) },
      KB: { name: 'KB', ...linear(1024) },
      MB: { name: 'MB', ...linear(1024 ** 2) },
      GB: { name: 'GB', ...linear(1024 ** 3) },
      TB: { name: 'TB', ...linear(1024 ** 4) },
    },
  },
}

const fmtNum = (n: number) => {
  if (!isFinite(n)) return '-'
  if (n === 0) return '0'
  const abs = Math.abs(n)
  if (abs >= 1e12 || abs < 1e-6) return n.toExponential(6)
  return parseFloat(n.toPrecision(10)).toString()
}

export default function UnitConverter() {
  const [category, setCategory] = useState('长度')
  const [fromUnit, setFromUnit] = useState('米')
  const [toUnit, setToUnit] = useState('英尺')
  const [value, setValue] = useState('1')

  const result = useMemo(() => {
    const v = parseFloat(value)
    if (Number.isNaN(v)) return null
    const cat = categories[category]
    return cat.units[toUnit].fromBase(cat.units[fromUnit].toBase(v))
  }, [category, fromUnit, toUnit, value])

  const switchCategory = (c: string) => {
    setCategory(c)
    const keys = Object.keys(categories[c].units)
    setFromUnit(keys[0])
    setToUnit(keys[1] ?? keys[0])
  }

  const swap = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
  }

  return (
    <ToolPage title="单位换算器" description="长度、重量、温度、数据容量常用单位即时换算，支持中国市制单位。">
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.keys(categories).map((c) => (
          <button
            key={c}
            onClick={() => switchCategory(c)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              category === c
                ? 'bg-amber-500 font-medium text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:border-amber-400'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="grid items-end gap-4 pt-6 sm:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-2">
            <Label>数值</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="text-lg"
              />
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories[category].units).map(([key, u]) => (
                    <SelectItem key={key} value={key}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            onClick={swap}
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-amber-400 hover:text-amber-600"
            title="互换单位"
          >
            ⇄
          </button>

          <div className="space-y-2">
            <Label>换算结果</Label>
            <div className="flex gap-2">
              <Input readOnly value={result === null ? '' : fmtNum(result)} className="bg-amber-50 text-lg font-semibold" />
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categories[category].units).map(([key, u]) => (
                    <SelectItem key={key} value={key}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 全部单位一览 */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <p className="mb-3 text-sm font-medium">当前数值对应的所有单位</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(categories[category].units).map(([key, u]) => {
              const v = parseFloat(value)
              const converted = Number.isNaN(v) ? null : u.fromBase(categories[category].units[fromUnit].toBase(v))
              return (
                <div key={key} className="rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <p className="text-xs text-zinc-500">{u.name}</p>
                  <p className="truncate font-mono text-sm font-medium">
                    {converted === null ? '-' : fmtNum(converted)}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </ToolPage>
  )
}
