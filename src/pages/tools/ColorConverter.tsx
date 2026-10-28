import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Rgb { r: number; g: number; b: number }
interface Hsl { h: number; s: number; l: number }

function hexToRgb(hex: string): Rgb | null {
  const m = hex.trim().replace(/^#/, '')
  if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(m)) return null
  const full = m.length === 3 ? m.split('').map((c) => c + c).join('') : m
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

const rgbToHex = ({ r, g, b }: Rgb) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l: l * 100 }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0))
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  return { h: h * 60, s: s * 100, l: l * 100 }
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = (((h % 360) + 360) % 360) / 360, sn = s / 100, ln = l / 100
  if (sn === 0) {
    const v = Math.round(ln * 255)
    return { r: v, g: v, b: v }
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn
  const p = 2 * ln - q
  const hue = (t: number) => {
    let tn = t
    if (tn < 0) tn += 1
    if (tn > 1) tn -= 1
    if (tn < 1 / 6) return p + (q - p) * 6 * tn
    if (tn < 1 / 2) return q
    if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6
    return p
  }
  return {
    r: Math.round(hue(hn + 1 / 3) * 255),
    g: Math.round(hue(hn) * 255),
    b: Math.round(hue(hn - 1 / 3) * 255),
  }
}

const clamp255 = (v: number) => Math.min(255, Math.max(0, Math.round(v)))

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 py-2">
      <span className="text-xs text-zinc-500">{label}</span>
      <code className="flex-1 truncate text-right font-mono text-sm">{value}</code>
      <button
        onClick={() => {
          navigator.clipboard.writeText(value).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          })
        }}
        className="text-amber-700 hover:text-amber-900"
        aria-label={`复制 ${label}`}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#f59e0b')
  const [rgbIn, setRgbIn] = useState({ r: '245', g: '158', b: '11' })
  const [hslIn, setHslIn] = useState({ h: '38', s: '92', l: '50' })
  const [source, setSource] = useState<'hex' | 'rgb' | 'hsl'>('hex')

  const { rgb, error } = useMemo((): { rgb: Rgb | null; error: string } => {
    if (source === 'hex') {
      const parsed = hexToRgb(hex)
      return parsed ? { rgb: parsed, error: '' } : { rgb: null, error: 'HEX 格式不正确，示例：#f59e0b 或 #f90' }
    }
    if (source === 'rgb') {
      const r = parseFloat(rgbIn.r), g = parseFloat(rgbIn.g), b = parseFloat(rgbIn.b)
      if ([r, g, b].some((v) => isNaN(v) || v < 0 || v > 255)) return { rgb: null, error: 'RGB 各通道范围 0 – 255' }
      return { rgb: { r: clamp255(r), g: clamp255(g), b: clamp255(b) }, error: '' }
    }
    const h = parseFloat(hslIn.h), s = parseFloat(hslIn.s), l = parseFloat(hslIn.l)
    if (isNaN(h) || h < 0 || h > 360) return { rgb: null, error: 'H（色相）范围 0 – 360' }
    if (isNaN(s) || s < 0 || s > 100 || isNaN(l) || l < 0 || l > 100) return { rgb: null, error: 'S / L 范围 0 – 100' }
    return { rgb: hslToRgb({ h, s, l }), error: '' }
  }, [hex, rgbIn, hslIn, source])

  const result = useMemo(() => {
    if (!rgb) return null
    const hsl = rgbToHsl(rgb)
    return {
      hex: rgbToHex(rgb),
      rgbCss: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hslCss: `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`,
      hsl,
    }
  }, [rgb])

  const syncFrom = (next: Rgb) => {
    const hsl = rgbToHsl(next)
    setHex(rgbToHex(next))
    setRgbIn({ r: String(next.r), g: String(next.g), b: String(next.b) })
    setHslIn({ h: String(Math.round(hsl.h)), s: String(Math.round(hsl.s)), l: String(Math.round(hsl.l)) })
  }

  return (
    <ToolPage title="色值转换器" description="HEX、RGB、HSL 三种颜色格式互相转换，实时预览，一键复制，前端设计配色常用。">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">输入颜色（任选一种格式）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cc-hex">HEX</Label>
              <Input
                id="cc-hex"
                value={hex}
                onChange={(e) => { setHex(e.target.value); setSource('hex') }}
                placeholder="#f59e0b"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>RGB（0 – 255）</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['r', 'g', 'b'] as const).map((ch) => (
                  <Input
                    key={ch}
                    type="number" min="0" max="255"
                    value={rgbIn[ch]}
                    onChange={(e) => { setRgbIn({ ...rgbIn, [ch]: e.target.value }); setSource('rgb') }}
                    aria-label={ch.toUpperCase()}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>HSL（H: 0–360，S/L: 0–100）</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['h', 's', 'l'] as const).map((ch) => (
                  <Input
                    key={ch}
                    type="number" min="0"
                    value={hslIn[ch]}
                    onChange={(e) => { setHslIn({ ...hslIn, [ch]: e.target.value }); setSource('hsl') }}
                    aria-label={ch.toUpperCase()}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-picker">或直接用取色板</Label>
              <Input
                id="cc-picker"
                type="color"
                value={result ? result.hex : '#f59e0b'}
                onChange={(e) => {
                  const parsed = hexToRgb(e.target.value)
                  if (parsed) { syncFrom(parsed); setSource('hex') }
                }}
                className="h-10 cursor-pointer p-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base">转换结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <p className="py-10 text-center text-sm text-red-500">{error}</p>
            ) : (
              result && (
                <>
                  <div
                    className="h-28 w-full rounded-xl border border-zinc-200 shadow-inner"
                    style={{ backgroundColor: result.hex }}
                  />
                  <div className="space-y-2">
                    <CopyRow label="HEX" value={result.hex} />
                    <CopyRow label="RGB（CSS）" value={result.rgbCss} />
                    <CopyRow label="HSL（CSS）" value={result.hslCss} />
                  </div>
                  <p className="text-xs text-zinc-500">提示：改任意一格输入，其他格式会实时联动更新</p>
                </>
              )
            )}
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  )
}
