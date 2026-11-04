import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const DIGIT = '零壹贰叁肆伍陆柒捌玖'
const SECTION_UNITS = ['', '万', '亿', '万亿']
const POS_UNITS = ['', '拾', '佰', '仟']

/** 一个 4 位以内的节（0-9999）转大写，内部连续 0 压缩为一个「零」，末尾零去掉 */
function sectionToCapital(section: number): string {
  let s = ''
  let unitPos = 0
  let zeroPending = false
  let n = section
  while (n > 0) {
    const d = n % 10
    if (d === 0) {
      if (s !== '') zeroPending = true
    } else {
      s = DIGIT[d] + POS_UNITS[unitPos] + (zeroPending ? '零' : '') + s
      zeroPending = false
    }
    unitPos++
    n = Math.floor(n / 10)
  }
  return s
}

/**
 * 金额（元）转人民币大写。内部一律换算成「分」做整数运算，避免浮点误差。
 * 规则遵循票据规范：有「分」不写「整」；到「元」为止加「整」；10-19 写「壹拾X」。
 */
export function amountToCapital(yuan: number): string {
  if (!isFinite(yuan) || yuan < 0 || yuan > 999999999999.99) return ''
  const cents = Math.round(yuan * 100)
  if (cents === 0) return '零元整'

  const fen = cents % 10
  const jiao = Math.floor(cents / 10) % 10
  let integer = Math.floor(cents / 100)

  // 按万进制分节（低位在前），再从高位节向低位节拼接；
  // 本节 <1000（千位为 0）且前面已有内容时，节间补「零」
  const sections: number[] = []
  while (integer > 0) {
    sections.push(integer % 10000)
    integer = Math.floor(integer / 10000)
  }
  let intPart = ''
  for (let i = sections.length - 1; i >= 0; i--) {
    const section = sections[i]
    if (section === 0) continue
    if (intPart !== '' && section < 1000) intPart += '零'
    intPart += sectionToCapital(section) + SECTION_UNITS[i]
  }

  let result = intPart === '' ? '零元' : intPart.replace(/零+/g, '零') + '元'
  if (jiao === 0 && fen === 0) return result + '整'
  // 「元」后补「零」的两种情况（银发〔1997〕485号）：
  // 1) 角位是 0 而分位不是 0；2) 元位（整数个位）是 0 而角分非全 0
  const integerPart = Math.floor(cents / 100)
  if (jiao === 0 || (integerPart > 0 && integerPart % 10 === 0)) result += '零'
  if (jiao > 0) result += DIGIT[jiao] + '角'
  if (fen > 0) {
    result += DIGIT[fen] + '分'
  } else {
    result += '整' // 有角无分，角后加「整」
  }
  return result
}

const PRESETS = ['1409.50', '6007.14', '325.04', '107000.53', '0.05', '1000000']

export default function RmbCapital() {
  const [input, setInput] = useState('1234.56')
  const [copied, setCopied] = useState(false)

  const { result, normalized, error } = useMemo(() => {
    const raw = input.trim().replace(/[¥￥,\s]/g, '')
    if (raw === '') return { result: '', normalized: '', error: '' }
    if (!/^\d+(\.\d+)?$/.test(raw)) return { result: '', normalized: '', error: '请输入数字金额，例如 1234.56（支持千分位逗号）' }
    const value = parseFloat(raw)
    if (value > 999999999999.99) return { result: '', normalized: '', error: '金额过大，最大支持 999,999,999,999.99 元' }
    const decimals = raw.includes('.') ? raw.split('.')[1].length : 0
    if (decimals > 2) return { result: '', normalized: '', error: '金额最多保留两位小数（到「分」）' }
    return {
      result: amountToCapital(value),
      normalized: value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      error: '',
    }
  }, [input])

  const fullText = result ? `人民币${result}` : ''

  return (
    <ToolPage title="人民币大写转换" description="输入小写金额，一键转换为人民币中文大写（壹贰叁…元角分），适用于发票、合同、收据、报销单填写。">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">输入小写金额</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rmb-amount">金额（元）</Label>
              <Input
                id="rmb-amount"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="例如 1234.56"
                className="font-mono text-lg"
                inputMode="decimal"
              />
              <p className="text-xs text-zinc-500">支持千分位写法（如 1,234.56），最多两位小数，金额只在你浏览器里计算，不会上传。</p>
            </div>
            <div className="space-y-2">
              <Label>试试这些例子</Label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setInput(p)}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-xs text-zinc-600 hover:border-amber-400 hover:text-amber-700"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base">大写金额</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <p className="py-10 text-center text-sm text-red-500">{error}</p>
            ) : result ? (
              <>
                <div className="rounded-xl border border-amber-200 bg-white p-5">
                  <p className="break-all text-xl font-bold leading-relaxed tracking-wide text-zinc-900">{fullText}</p>
                  <p className="mt-3 border-t border-dashed border-zinc-200 pt-3 font-mono text-sm text-zinc-500">
                    小写：¥ {normalized}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(fullText).then(() => {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1500)
                    })
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-600"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? '已复制' : '复制大写金额'}
                </button>
                <p className="text-xs text-zinc-500">提示：填票据时「人民币」与大写金额之间不要留空白；有「分」时末尾不写「整」。</p>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-zinc-400">输入金额后这里会实时显示大写结果</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 规则说明 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">大写规则速查</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-600">
            <li>大写数字：零壹贰叁肆伍陆柒捌玖；单位：拾佰仟万亿、元角分。</li>
            <li>10～19 要写「壹拾X」，写成「拾X」前面留了空位，容易被涂改。</li>
            <li>中间连续多个 0 只写一个「零」，如 10005 元 → 壹万零伍元整。</li>
            <li>金额到「元」为止的末尾加「整」；有「分」时不写「整」。</li>
            <li>角位是 0、分位不是 0 时，「元」后要补「零」，如 325.04 → 叁佰贰拾伍元零肆分。</li>
          </ul>
        </CardContent>
      </Card>
    </ToolPage>
  )
}
