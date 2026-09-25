import MarkdownIt from 'markdown-it'
import { load as loadYaml } from 'js-yaml'
import { codeToHtml } from 'shiki'
import {
  escapeBraces,
  escapeHtml,
  resolveDocLink,
  slugify,
  stripMarkdown,
  type DocHeading,
  type DocSection,
} from '../shared/docs.ts'

export interface RenderedMarkdown {
  html: string
  frontmatter: Record<string, any>
  headings: DocHeading[]
  sections: DocSection[]
  title: string
}

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---[^\S\r\n]*\r?\n?/

const CONTAINERS: Record<string, string> = {
  info: 'info',
  note: 'info',
  tip: 'success',
  success: 'success',
  warning: 'warning',
  caution: 'warning',
  danger: 'error',
  error: 'error',
}

const SHIKI_THEMES = { light: 'github-light', dark: 'github-dark' } as const

const PLAIN_LANGS = new Set(['', 'text', 'txt', 'plain', 'plaintext', 'none'])

export function parseFrontmatter(source: string): { data: Record<string, any>; body: string } {
  const matched = FRONTMATTER_RE.exec(source)
  if (!matched) return { data: {}, body: source }

  let data: Record<string, any> = {}
  try {
    data = (loadYaml(matched[1]) as Record<string, any>) ?? {}
  } catch (error) {
    console.warn('[docs] frontmatter 解析失败：', (error as Error).message)
  }
  return { data, body: source.slice(matched[0].length) }
}

function parseFenceInfo(info: string) {
  const trimmed = info.trim()
  const spaceIndex = trimmed.search(/\s/)
  const lang = (spaceIndex === -1 ? trimmed : trimmed.slice(0, spaceIndex)).toLowerCase()
  const meta = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1)
  const title = /title=(?:"([^"]*)"|'([^']*)')/.exec(meta)

  const lines = new Set<number>()
  const rangeMatch = /\{([\d,\s-]+)\}/.exec(meta)
  if (rangeMatch) {
    for (const part of rangeMatch[1].split(',')) {
      const [rawStart, rawEnd] = part.trim().split('-')
      const start = Number(rawStart)
      if (!Number.isFinite(start)) continue
      const end = rawEnd === undefined || rawEnd === '' ? start : Number(rawEnd)
      if (!Number.isFinite(end)) continue
      for (let line = start; line <= end; line += 1) lines.add(line)
    }
  }

  return { lang, meta, title: title?.[1] ?? title?.[2] ?? '', lines }
}

// 文档里按仓库路径写 ../../public/image/a.png，而 public 就是站点根，构建后没有 /public 前缀
function normalizeAssetUrl(src: string): string {
  return src.replace(/^(?:\.\.\/)+public\//, '/').replace(/^\/public\//, '/')
}

function plainFence(content: string) {
  return `<pre class="shiki shiki-plain"><code>${escapeHtml(content)}</code></pre>`
}

// markdown-it 的解析是同步的，先把代码块异步高亮完再交给 renderer
async function highlightFences(tokens: any[]): Promise<void> {
  await Promise.all(
    tokens
      .filter((token) => token.type === 'fence')
      .map(async (token) => {
        const { lang, title, lines } = parseFenceInfo(token.info)
        token.docFence = { lang, title }

        // mermaid 交给前端组件渲染，这里不做高亮
        if (lang === 'mermaid') return

        if (PLAIN_LANGS.has(lang)) {
          token.docFence.html = plainFence(token.content)
          return
        }

        try {
          const html = await codeToHtml(token.content, {
            lang,
            themes: SHIKI_THEMES,
            defaultColor: false,
            transformers: lines.size
              ? [
                  {
                    line(node: any, line: number) {
                      if (lines.has(line)) this.addClassToHast(node, 'code-line-highlighted')
                    },
                  },
                ]
              : [],
          })
          token.docFence.html = escapeBraces(html)
        } catch {
          token.docFence.html = plainFence(token.content)
        }
      }),
  )
}

// @types/markdown-it 把实例类型挂在同名 namespace 上
type MarkdownItInstance = InstanceType<typeof MarkdownIt>

function containerPlugin(md: MarkdownItInstance) {
  md.block.ruler.before(
    'fence',
    'doc_container',
    (state: any, startLine: number, endLine: number, silent: boolean) => {
      const start = state.bMarks[startLine] + state.tShift[startLine]
      const line = state.src.slice(start, state.eMarks[startLine])
      const matched = /^(:{3,})\s*([a-zA-Z][\w-]*)\s*(.*)$/.exec(line)
      if (!matched) return false

      const fence = matched[1]
      const name = matched[2].toLowerCase()
      if (!CONTAINERS[name]) return false
      if (silent) return true

      let contentEnd = endLine
      for (let line_ = startLine + 1; line_ < endLine; line_ += 1) {
        const raw = state.src
          .slice(state.bMarks[line_] + state.tShift[line_], state.eMarks[line_])
          .trim()
        if (raw.length >= fence.length && /^:+$/.test(raw)) {
          contentEnd = line_
          break
        }
      }

      const open = state.push('doc_container_open', 'div', 1)
      open.meta = { name, title: matched[3].trim() }
      state.md.block.tokenize(state, startLine + 1, contentEnd)
      state.push('doc_container_close', 'div', -1)
      state.line = contentEnd + 1
      return true
    },
  )

  md.renderer.rules.doc_container_open = (tokens: any[], index: number) => {
    const { name, title } = tokens[index].meta
    const type = CONTAINERS[name] ?? 'info'
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
    return `<DocAlert type="${type}"${titleAttr}>\n`
  }
  md.renderer.rules.doc_container_close = () => '</DocAlert>\n'
}

function headingsPlugin(md: MarkdownItInstance) {
  md.core.ruler.push('doc_headings', (state: any) => {
    const headings: DocHeading[] = []
    const sections: DocSection[] = []
    const used = new Set<string>()

    let current: DocSection = { heading: '', slug: '', level: 0, text: '' }
    let pendingInline = false

    const flush = () => {
      const text = stripMarkdown(current.text)
      if (current.heading || text) {
        sections.push({ ...current, text })
      }
      current = { heading: '', slug: '', level: current.level, text: '' }
    }

    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index]

      if (token.type === 'heading_open') {
        const inline = state.tokens[index + 1]
        if (current.heading || current.text.trim()) flush()

        const base = slugify(inline?.content ?? '')
        let slug = base
        let suffix = 1
        while (used.has(slug)) slug = `${base}-${suffix++}`
        used.add(slug)

        token.attrSet('id', slug)
        const level = Number(token.tag.slice(1))
        headings.push({ level, title: inline?.content ?? '', slug, link: `#${slug}` })
        current = { heading: (inline?.content ?? '').trim(), slug, level, text: '' }
        pendingInline = true
        continue
      }

      if (token.type === 'heading_close') {
        pendingInline = false
        continue
      }

      if (pendingInline) continue

      if (token.type === 'inline') current.text += ` ${token.content}`
      // 图表源码进检索索引只会干扰命中，跳过
      else if (token.type === 'fence' && parseFenceInfo(token.info).lang !== 'mermaid') {
        current.text += ` ${token.content}`
      }
    }

    flush()
    state.env.headings = headings
    state.env.sections = sections
    return true
  })
}

function miscPlugin(md: MarkdownItInstance) {
  // 花括号会被 Vue 当成插值
  md.core.ruler.push('doc_escape_braces', (state: any) => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !Array.isArray(token.children)) continue
      for (const child of token.children) {
        if (child.type === 'text') child.content = escapeBraces(child.content)
      }
    }
    return true
  })

  md.renderer.rules.image = (tokens: any[], index: number, _options: any, env: any) => {
    const token = tokens[index]
    const src = normalizeAssetUrl(resolveDocLink(token.attrGet('src') ?? '', String(env?.pageUrl ?? '')))
    const alt = token.content ?? ''
    const title = token.attrGet('title') ?? ''
    const attr = (name: string, value: string) => ` ${name}="${escapeBraces(escapeHtml(value))}"`

    // 被链接包住的图片点一下是要跳转，不接管点击
    if (tokens[index - 1]?.type === 'link_open') {
      return `<img${attr('src', src)}${alt ? attr('alt', alt) : ''}${title ? attr('title', title) : ''} loading="lazy" />`
    }

    return `<DocImage${attr('src', src)}${attr('alt', alt)}${title ? attr('title', title) : ''} />`
  }

  md.renderer.rules.code_inline = (tokens: any[], index: number) =>
    `<code class="doc-inline-code">${escapeHtml(tokens[index].content)}</code>`

  md.renderer.rules.fence = (tokens: any[], index: number) => {
    const token = tokens[index]
    const fence = token.docFence ?? { lang: '', title: '', html: plainFence(token.content) }

    // 图表源码走属性传递，转义后交给 DocMermaid（实体在模板编译期会被还原）
    if (fence.lang === 'mermaid') {
      return `<DocMermaid code="${escapeBraces(escapeHtml(token.content.trim()))}" />`
    }

    const html = fence.html ?? plainFence(token.content)
    const label = fence.title || fence.lang || 'text'

    return [
      `<div class="doc-code"${fence.lang ? ` data-lang="${escapeHtml(fence.lang)}"` : ''}>`,
      '<div class="doc-code__bar">',
      `<span class="doc-code__lang">${escapeHtml(label)}</span>`,
      '<button class="doc-code__copy" type="button" data-code-copy aria-label="复制代码">',
      '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1"/></svg>',
      '<span class="doc-code__copy-text">复制</span>',
      '</button>',
      '</div>',
      html,
      '</div>',
    ].join('')
  }

  md.renderer.rules.link_open = (tokens: any[], index: number, options: any, env: any, self: any) => {
    const raw = tokens[index].attrGet('href') ?? ''
    // 相对链接按页面规范地址解析：浏览器会按当前 URL 解析，带不带尾斜杠结果不同
    const href = resolveDocLink(raw, String(env?.pageUrl ?? ''))
    if (href !== raw) tokens[index].attrSet('href', href)

    if (/^https?:\/\//i.test(href)) {
      tokens[index].attrSet('target', '_blank')
      tokens[index].attrSet('rel', 'noreferrer noopener')
    }
    return self.renderToken(tokens, index, options)
  }

  md.renderer.rules.table_open = () => '<div class="doc-table-wrap"><table>'
  md.renderer.rules.table_close = () => '</table></div>'

  // 锚点放在标题文字后面
  md.renderer.rules.heading_close = (tokens: any[], index: number) => {
    const open = tokens[index - 2]
    const level = tokens[index].tag
    const id = open?.attrGet?.('id')
    const anchor = id
      ? `<a class="doc-anchor" href="#${id}" aria-label="复制锚点链接"><span>#</span></a>`
      : ''
    return `${anchor}</${level}>`
  }
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
  typographer: false,
})
  .use(containerPlugin)
  .use(headingsPlugin)
  .use(miscPlugin)

export async function renderMarkdown(
  source: string,
  options: { highlight?: boolean; pageUrl?: string } = {},
): Promise<RenderedMarkdown> {
  const { highlight = true, pageUrl = '' } = options
  const { data: frontmatter, body } = parseFrontmatter(source)
  const env: Record<string, any> = { pageUrl }
  const tokens = md.parse(body, env)

  if (highlight) await highlightFences(tokens)

  const html = md.renderer.render(tokens, md.options, env)
  const headings: DocHeading[] = env.headings ?? []
  const sections: DocSection[] = env.sections ?? []

  const firstHeading = headings.find((heading) => heading.level === 1)
  const title = String(frontmatter.title ?? firstHeading?.title ?? '').trim()

  return { html, frontmatter, headings, sections, title }
}
