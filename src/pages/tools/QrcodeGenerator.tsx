import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download } from 'lucide-react'
import ToolPage from '@/components/ToolPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const MAX_LEN = 1000

export default function QrcodeGenerator() {
  const [text, setText] = useState('https://www.ddandtt.com')
  const [size, setSize] = useState('512')
  const [ecLevel, setEcLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [dark, setDark] = useState('#000000')
  const [light, setLight] = useState('#ffffff')
  const [dataUrl, setDataUrl] = useState('')
  const [genError, setGenError] = useState('')

  const trimmed = text.trim()
  const inputError =
    trimmed === '' ? '请输入要生成二维码的内容'
    : text.length > MAX_LEN ? `内容过长，最多支持 ${MAX_LEN} 个字符`
    : ''

  useEffect(() => {
    if (inputError) {
      setDataUrl('')
      return
    }
    let cancelled = false
    QRCode.toDataURL(text, {
      width: parseInt(size),
      margin: 2,
      errorCorrectionLevel: ecLevel,
      color: { dark, light },
    })
      .then((url) => {
        if (!cancelled) {
          setDataUrl(url)
          setGenError('')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDataUrl('')
          setGenError('生成失败，请尝试缩短内容或调整参数')
        }
      })
    return () => {
      cancelled = true
    }
  }, [text, size, ecLevel, dark, light, inputError])

  return (
    <ToolPage title="二维码生成器" description="输入文本或网址，本地即时生成二维码图片，支持自定义尺寸、容错级别和颜色，可下载 PNG。">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">内容与参数</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="qr-text">内容（文本 / 网址 / 联系方式等）</Label>
              <Textarea
                id="qr-text"
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="例如：https://www.example.com 或一段文字"
              />
              <div className="flex justify-between text-xs">
                <span className={inputError ? 'text-red-500' : 'text-zinc-500'}>{inputError || '本地生成，内容不会上传'}</span>
                <span className={text.length > MAX_LEN ? 'text-red-500' : 'text-zinc-400'}>{text.length}/{MAX_LEN}</span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>图片尺寸</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="256">256 × 256（屏幕展示）</SelectItem>
                    <SelectItem value="512">512 × 512（通用）</SelectItem>
                    <SelectItem value="1024">1024 × 1024（打印）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>容错级别</Label>
                <Select value={ecLevel} onValueChange={(v) => setEcLevel(v as typeof ecLevel)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L · 7%（图案最简）</SelectItem>
                    <SelectItem value="M">M · 15%（推荐）</SelectItem>
                    <SelectItem value="Q">Q · 25%</SelectItem>
                    <SelectItem value="H">H · 30%（可加 logo）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-dark">前景色</Label>
                <Input id="qr-dark" type="color" value={dark} onChange={(e) => setDark(e.target.value)} className="h-10 cursor-pointer p-1" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qr-light">背景色</Label>
                <Input id="qr-light" type="color" value={light} onChange={(e) => setLight(e.target.value)} className="h-10 cursor-pointer p-1" />
              </div>
            </div>
            <p className="text-xs text-zinc-500">提示：深色前景 + 浅色背景识别率最高；内容越长图案越密，建议网址尽量短</p>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base">预览与下载</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-5">
            {genError ? (
              <p className="py-16 text-sm text-zinc-500">{genError}</p>
            ) : dataUrl ? (
              <>
                <div className="rounded-xl border border-amber-200 bg-white p-4 shadow-sm">
                  <img src={dataUrl} alt="二维码预览" className="h-56 w-56 sm:h-64 sm:w-64" />
                </div>
                <Button asChild className="bg-amber-500 hover:bg-amber-600">
                  <a href={dataUrl} download="qrcode.png">
                    <Download className="mr-1.5 h-4 w-4" />
                    下载 PNG（{size} × {size}）
                  </a>
                </Button>
                <p className="text-xs text-zinc-500">下载前建议先用手机扫一扫确认识别正常</p>
              </>
            ) : (
              <p className="py-16 text-sm text-zinc-500">输入内容后自动生成</p>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  )
}
