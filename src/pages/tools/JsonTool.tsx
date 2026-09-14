import { useState } from 'react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Status = 'idle' | 'valid' | 'invalid'

export default function JsonTool() {
  const [input, setInput] = useState('{"name":"芝麻工具箱","free":true,"tools":["个税","房贷","JSON"]}')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const parse = (text: string): { ok: true; data: unknown } | { ok: false; error: string } => {
    try {
      return { ok: true, data: JSON.parse(text) }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) }
    }
  }

  const format = () => {
    const r = parse(input)
    if (!r.ok) {
      setStatus('invalid')
      setMessage(r.error)
      return
    }
    setStatus('valid')
    setMessage(`✓ JSON 合法，共 ${JSON.stringify(r.data).length} 个字符`)
    setOutput(JSON.stringify(r.data, null, 2))
  }

  const minify = () => {
    const r = parse(input)
    if (!r.ok) {
      setStatus('invalid')
      setMessage(r.error)
      return
    }
    setStatus('valid')
    setMessage('✓ 已压缩')
    setOutput(JSON.stringify(r.data))
  }

  const validateOnly = () => {
    const r = parse(input)
    if (!r.ok) {
      setStatus('invalid')
      setMessage(r.error)
    } else {
      setStatus('valid')
      setMessage('✓ JSON 格式合法')
    }
  }

  const copyOutput = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <ToolPage title="JSON 格式化工具" description="在线格式化、压缩、校验 JSON 文本。所有操作在浏览器本地完成，数据不会上传。">
      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={format} className="bg-amber-500 hover:bg-amber-600">格式化（缩进 2 空格）</Button>
        <Button onClick={minify} variant="outline">压缩</Button>
        <Button onClick={validateOnly} variant="outline">仅校验</Button>
        <Button onClick={() => { setInput(''); setOutput(''); setStatus('idle'); setMessage('') }} variant="ghost">
          清空
        </Button>
        {output && (
          <Button onClick={copyOutput} variant="outline" className="ml-auto">
            {copied ? '✓ 已复制' : '复制结果'}
          </Button>
        )}
      </div>

      {status !== 'idle' && (
        <p
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            status === 'valid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-2 text-sm font-medium text-zinc-600">输入</p>
            <Textarea
              value={input}
              onChange={(e) => { setInput(e.target.value); setStatus('idle') }}
              placeholder='粘贴 JSON 文本，例如：{"a":1}'
              className="min-h-80 font-mono text-sm"
              spellCheck={false}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="mb-2 text-sm font-medium text-zinc-600">输出</p>
            <Textarea
              value={output}
              readOnly
              placeholder="结果会显示在这里"
              className="min-h-80 bg-zinc-50 font-mono text-sm"
              spellCheck={false}
            />
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  )
}
