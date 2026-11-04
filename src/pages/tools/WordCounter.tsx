import { useMemo, useState } from 'react'
import { Check, Copy, Eraser } from 'lucide-react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Stats {
  total: number // 总字符数（含空格换行）
  noSpace: number // 不含空格和换行的字符数
  chinese: number // 汉字
  chinesePunct: number // 中文标点
  letters: number // 英文字母
  words: number // 英文单词（连续字母序列）
  digits: number // 数字
  englishPunct: number // 英文标点
  spaces: number // 空格（不含换行）
  lines: number // 行数
  paragraphs: number // 段落数（非空行）
  readingMin: number // 估算阅读时间（分钟）
}

function analyze(text: string): Stats {
  const total = text.length
  const chinese = (text.match(/[一-鿿㐀-䶿]/g) || []).length
  const chinesePunct = (text.match(/[　-〿＀-￯]/g) || []).length
  const letters = (text.match(/[a-zA-Z]/g) || []).length
  const words = (text.match(/[a-zA-Z]+(?:['’-][a-zA-Z]+)*/g) || []).length
  const digits = (text.match(/[0-9]/g) || []).length
  const englishPunct = (text.match(/[!-/:-@[-`{-~]/g) || []).length
  const spaces = (text.match(/ /g) || []).length
  const noSpace = (text.match(/[^\s]/g) || []).length
  const lines = text === '' ? 0 : text.split('\n').length
  const paragraphs = text.split('\n').filter((l) => l.trim() !== '').length
  // 阅读时间估算：中文约 400 字/分钟，英文约 200 词/分钟
  const readingMin = chinese / 400 + words / 200
  return { total, noSpace, chinese, chinesePunct, letters, words, digits, englishPunct, spaces, lines, paragraphs, readingMin }
}

function StatItem({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${highlight ? 'border-amber-300 bg-amber-50' : 'border-zinc-200 bg-white'}`}>
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold tabular-nums ${highlight ? 'text-amber-700' : 'text-zinc-900'}`}>{value}</p>
    </div>
  )
}

export default function WordCounter() {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  const stats = useMemo(() => analyze(text), [text])
  const wordCount = stats.chinese + stats.words

  const formatReading = (min: number) => {
    if (min <= 0) return '0 分钟'
    if (min < 1) return '不到 1 分钟'
    return `约 ${Math.round(min)} 分钟`
  }

  const summary = () =>
    `字数：${wordCount}（汉字 ${stats.chinese} + 英文单词 ${stats.words}）\n` +
    `总字符数：${stats.total}，不含空格：${stats.noSpace}\n` +
    `行数：${stats.lines}，段落数：${stats.paragraphs}\n` +
    `数字：${stats.digits}，中文标点：${stats.chinesePunct}，英文标点：${stats.englishPunct}，空格：${stats.spaces}\n` +
    `估算阅读时间：${formatReading(stats.readingMin)}`

  return (
    <ToolPage title="字数统计工具" description="在线实时统计字数、字符数、汉字数、英文单词数、行数和阅读时间，适合论文、文案、简历、公众号写作。">
      <div className="grid gap-6 lg:grid-cols-5">
        {/* 输入区 */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">输入或粘贴文本</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(summary()).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 1500)
                  })
                }}
                disabled={!text}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:border-amber-400 hover:text-amber-700 disabled:opacity-40"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? '已复制' : '复制统计'}
              </button>
              <button
                onClick={() => setText('')}
                disabled={!text}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 hover:border-red-300 hover:text-red-600 disabled:opacity-40"
              >
                <Eraser className="h-3.5 w-3.5" />
                清空
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="把文章、文案或论文粘贴到这里，统计结果会实时更新。文本只在你自己的浏览器里处理，不会上传。"
              className="h-72 w-full resize-y rounded-md border border-zinc-200 bg-white p-3 text-sm leading-relaxed outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 lg:h-96"
            />
            <p className="mt-2 text-xs text-zinc-500">字数 = 汉字数 + 英文单词数（与 Word 口径一致）；所有统计在本地实时完成。</p>
          </CardContent>
        </Card>

        {/* 统计区 */}
        <Card className="border-amber-200 bg-amber-50/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">统计结果</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-center">
              <p className="text-xs text-zinc-500">字数（汉字 + 英文单词）</p>
              <p className="mt-1 text-4xl font-bold tabular-nums text-amber-700">{wordCount}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              <StatItem label="总字符数" value={stats.total} />
              <StatItem label="字符数（不含空格）" value={stats.noSpace} />
              <StatItem label="汉字" value={stats.chinese} highlight />
              <StatItem label="英文单词" value={stats.words} highlight />
              <StatItem label="英文字母" value={stats.letters} />
              <StatItem label="数字" value={stats.digits} />
              <StatItem label="中文标点" value={stats.chinesePunct} />
              <StatItem label="英文标点" value={stats.englishPunct} />
              <StatItem label="空格" value={stats.spaces} />
              <StatItem label="行数" value={stats.lines} />
              <StatItem label="段落数（非空行）" value={stats.paragraphs} />
              <StatItem label="阅读时间" value={formatReading(stats.readingMin)} />
            </div>
            <p className="text-xs leading-relaxed text-zinc-500">
              常见字数限制参考：微博 2000 字、小红书正文 1000 字、短信 70 字/条、论文摘要一般 300–500 字。
            </p>
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  )
}
