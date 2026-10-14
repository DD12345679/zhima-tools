// SSR 入口：把指定路由渲染成 HTML 字符串（仅构建期在 Node 中运行）
import { renderToString } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import App from '../src/App'

export function render(url: string): string {
  return renderToString(
    <MemoryRouter initialEntries={[url]}>
      <App />
    </MemoryRouter>
  )
}
