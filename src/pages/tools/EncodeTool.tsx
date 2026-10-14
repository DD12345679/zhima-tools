import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/* ---------------- MD5（纯前端实现，标准 RFC 1321） ---------------- */

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]
const MD5_K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0)

function md5(input: string): string {
  const msg = new TextEncoder().encode(input)
  const bitLen = msg.length * 8
  const paddedLen = (((msg.length + 8) >> 6) + 1) << 6
  const buf = new Uint8Array(paddedLen)
  buf.set(msg)
  buf[msg.length] = 0x80
  const dv = new DataView(buf.buffer)
  dv.setUint32(paddedLen - 8, bitLen >>> 0, true)
  dv.setUint32(paddedLen - 4, Math.floor(bitLen / 2 ** 32), true)

  let a0 = 0x67452301 | 0
  let b0 = 0xefcdab89 | 0
  let c0 = 0x98badcfe | 0
  let d0 = 0x10325476 | 0

  for (let off = 0; off < paddedLen; off += 64) {
    const M = new Uint32Array(16)
    for (let i = 0; i < 16; i++) M[i] = dv.getUint32(off + i * 4, true)
    let A = a0, B = b0, C = c0, D = d0
    for (let i = 0; i < 64; i++) {
      let F: number, g: number
      if (i < 16) { F = (B & C) | (~B & D); g = i }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
      else { F = C ^ (B | ~D); g = (7 * i) % 16 }
      const tmp = D
      D = C
      C = B
      const x = (A + F + MD5_K[i] + M[g]) | 0
      B = (B + ((x << MD5_S[i]) | (x >>> (32 - MD5_S[i])))) | 0
      A = tmp
    }
    a0 = (a0 + A) | 0
    b0 = (b0 + B) | 0
    c0 = (c0 + C) | 0
    d0 = (d0 + D) | 0
  }

  const out = new Uint8Array(16)
  const odv = new DataView(out.buffer)
  odv.setUint32(0, a0 >>> 0, true)
  odv.setUint32(4, b0 >>> 0, true)
  odv.setUint32(8, c0 >>> 0, true)
  odv.setUint32(12, d0 >>> 0, true)
  return Array.from(out, (b) => b.toString(16).padStart(2, '0')).join('')
}

/* ---------------- Base64 / URL（UTF-8 安全） ---------------- */

function b64encode(s: string): string {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(bin)
}

function b64decode(s: string): string {
  const bin = atob(s.replace(/\s/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/* ---------------- 复制按钮 ---------------- */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  if (!text) return null
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      className="inline-flex items-center gap-1 text-xs text-amber-700 hover:underline"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? '已复制' : '复制结果'}
    </button>
  )
}

/* ---------------- 编解码面板 ---------------- */

type Direction = 'encode' | 'decode'

function CodecPanel({
  kind,
  placeholder,
}: {
  kind: 'base64' | 'url'
  placeholder: string
}) {
  const [input, setInput] = useState('')
  const [dir, setDir] = useState<Direction>('encode')

  const { output, error } = useMemo(() => {
    if (!input) return { output: '', error: '' }
    try {
      if (kind === 'base64') {
        return { output: dir === 'encode' ? b64encode(input) : b64decode(input), error: '' }
      }
      return { output: dir === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input), error: '' }
    } catch {
      return {
        output: '',
        error: dir === 'decode'
          ? `解码失败：输入不是合法的 ${kind === 'base64' ? 'Base64' : 'URL 编码'} 字符串`
          : '编码失败',
      }
    }
  }, [input, dir, kind])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">输入</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={dir} onValueChange={(v) => setDir(v as Direction)} className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="encode" id={`${kind}-en`} />
              <Label htmlFor={`${kind}-en`} className="font-normal">编码</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="decode" id={`${kind}-de`} />
              <Label htmlFor={`${kind}-de`} className="font-normal">解码</Label>
            </div>
          </RadioGroup>
          <Textarea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="font-mono text-sm"
          />
          <p className="text-xs text-zinc-500">支持中文（UTF-8），全部在浏览器本地完成</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            输出
            <CopyButton text={output} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="py-8 text-sm text-red-500">{error}</p>
          ) : output ? (
            <Textarea readOnly rows={8} value={output} className="bg-white font-mono text-sm" />
          ) : (
            <p className="py-8 text-sm text-zinc-500">输入内容后自动出结果</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

/* ---------------- MD5 面板 ---------------- */

function Md5Panel() {
  const [input, setInput] = useState('')
  const [upper, setUpper] = useState(false)

  const hash = useMemo(() => {
    if (!input) return ''
    const h = md5(input)
    return upper ? h.toUpperCase() : h
  }, [input, upper])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">输入</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            rows={8}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要计算 MD5 的文本"
            className="font-mono text-sm"
          />
          <RadioGroup value={upper ? 'upper' : 'lower'} onValueChange={(v) => setUpper(v === 'upper')} className="flex gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="lower" id="md5-lower" />
              <Label htmlFor="md5-lower" className="font-normal">32 位小写</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="upper" id="md5-upper" />
              <Label htmlFor="md5-upper" className="font-normal">32 位大写</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            MD5 哈希值
            <CopyButton text={hash} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hash ? (
            <p className="break-all rounded-md border border-amber-200 bg-white p-4 font-mono text-sm">{hash}</p>
          ) : (
            <p className="py-8 text-sm text-zinc-500">输入内容后自动计算</p>
          )}
          <p className="mt-3 text-xs text-zinc-500">
            MD5 为不可逆哈希，仅适用于校验与签名场景，不应用于存储密码
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function EncodeTool() {
  return (
    <ToolPage title="Base64 / URL / MD5 工具" description="Base64 编码解码、URL 编码解码、MD5 哈希计算，支持中文，全部在浏览器本地完成。">
      <Tabs defaultValue="base64">
        <TabsList className="mb-6 grid w-full grid-cols-3 sm:w-96">
          <TabsTrigger value="base64">Base64</TabsTrigger>
          <TabsTrigger value="url">URL 编码</TabsTrigger>
          <TabsTrigger value="md5">MD5</TabsTrigger>
        </TabsList>
        <TabsContent value="base64">
          <CodecPanel kind="base64" placeholder="输入要编码的文本，或粘贴 Base64 字符串解码" />
        </TabsContent>
        <TabsContent value="url">
          <CodecPanel kind="url" placeholder="输入要编码的文本 / 参数，或粘贴 URL 编码字符串解码" />
        </TabsContent>
        <TabsContent value="md5">
          <Md5Panel />
        </TabsContent>
      </Tabs>
    </ToolPage>
  )
}
