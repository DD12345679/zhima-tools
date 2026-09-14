import { useCallback, useEffect, useState } from 'react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>?/~'

function generate(length: number, pools: string[]): string {
  const pool = pools.join('')
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  // 保证每类字符至少出现一次
  const chars: string[] = pools.map((p) => p[arr[0] % p.length])
  for (let i = chars.length; i < length; i++) {
    chars.push(pool[arr[i] % pool.length])
  }
  // 洗牌
  for (let i = chars.length - 1; i > 0; i--) {
    const j = arr[i % arr.length] % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useDigits, setUseDigits] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const pools = [
    useLower && LOWER,
    useUpper && UPPER,
    useDigits && DIGITS,
    useSymbols && SYMBOLS,
  ].filter(Boolean) as string[]

  const regen = useCallback(() => {
    if (pools.length === 0) {
      setPassword('')
      return
    }
    setPassword(generate(length, pools))
  }, [length, pools])

  useEffect(() => {
    regen()
  }, [regen])

  const entropy = pools.length > 0 ? Math.round(length * Math.log2(pools.reduce((s, p) => s + p.length, 0))) : 0
  const strength = entropy >= 100 ? { label: '极强', color: 'bg-emerald-500', width: '100%' }
    : entropy >= 70 ? { label: '强', color: 'bg-emerald-400', width: '75%' }
    : entropy >= 45 ? { label: '中等', color: 'bg-amber-400', width: '50%' }
    : { label: '弱', color: 'bg-red-400', width: '25%' }

  const copy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <ToolPage title="密码生成器" description="使用浏览器内置加密随机数本地生成密码，不会联网传输。">
      <Card className="mx-auto max-w-2xl">
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="pw">生成的密码</Label>
              <Button onClick={copy} variant="outline" size="sm" disabled={!password}>
                {copied ? '✓ 已复制' : '复制'}
              </Button>
            </div>
            <Input id="pw" readOnly value={password} className="bg-zinc-50 font-mono text-base" />
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100">
                <div className={`h-full rounded-full ${strength.color} transition-all`} style={{ width: strength.width }} />
              </div>
              <span className="text-xs text-zinc-500">
                {pools.length === 0 ? '请至少选择一类字符' : `${strength.label} · 约 ${entropy} bit`}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>密码长度：{length} 位</Label>
            </div>
            <Slider value={[length]} onValueChange={([v]) => setLength(v)} min={4} max={64} step={1} />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: '小写字母 (a-z)', value: useLower, set: setUseLower, sample: 'abc' },
              { label: '大写字母 (A-Z)', value: useUpper, set: setUseUpper, sample: 'ABC' },
              { label: '数字 (0-9)', value: useDigits, set: setUseDigits, sample: '123' },
              { label: '符号 (!@#…)', value: useSymbols, set: setUseSymbols, sample: '!@#' },
            ].map((opt) => (
              <label
                key={opt.label}
                className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-3 text-sm transition-colors ${
                  opt.value ? 'border-amber-400 bg-amber-50' : 'border-zinc-200 bg-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Checkbox checked={opt.value} onCheckedChange={(v) => opt.set(v === true)} />
                  <span className="font-medium">{opt.label}</span>
                </span>
                <span className="pl-6 font-mono text-xs text-zinc-400">{opt.sample}</span>
              </label>
            ))}
          </div>

          <Button onClick={regen} className="w-full bg-amber-500 hover:bg-amber-600" disabled={pools.length === 0}>
            重新生成
          </Button>
        </CardContent>
      </Card>
    </ToolPage>
  )
}
