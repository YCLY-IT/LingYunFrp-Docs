import type { MermaidConfig } from 'mermaid'

type Mermaid = (typeof import('mermaid'))['default']
type MermaidTheme = 'default' | 'dark'

let loader: Promise<Mermaid> | undefined
let activeTheme: MermaidTheme | '' = ''
let seq = 0

// mermaid 体积较大，只有页面里真的出现 ```mermaid 时才加载
function loadMermaid(): Promise<Mermaid> {
  loader ??= import('mermaid').then((mod) => mod.default)
  return loader
}

function configure(mermaid: Mermaid, theme: MermaidTheme) {
  const config: MermaidConfig = {
    startOnLoad: false,
    securityLevel: 'loose', // 图里允许用 <br/> 换行
    suppressErrorRendering: true, // 解析失败交给我们自己提示，避免往 body 里塞错误图
    theme,
    fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
    flowchart: { htmlLabels: true, useMaxWidth: true },
    sequence: { useMaxWidth: true },
    gantt: { useMaxWidth: true },
    class: { useMaxWidth: true },
    state: { useMaxWidth: true },
    er: { useMaxWidth: true },
    mindmap: { useMaxWidth: true },
  }

  mermaid.initialize(config)
  activeTheme = theme
}

export async function renderMermaid(source: string, dark: boolean): Promise<string> {
  const mermaid = await loadMermaid()
  const theme: MermaidTheme = dark ? 'dark' : 'default'

  if (activeTheme !== theme) configure(mermaid, theme)

  seq += 1
  const { svg } = await mermaid.render(`doc-mermaid-${seq}`, source)
  return svg
}
