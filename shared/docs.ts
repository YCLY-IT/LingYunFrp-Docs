export const DOCS_DIR = 'docs'
export const API_SPEC_FILE = 'src/api/openapi.json'

export interface DocHeading {
  level: number
  title: string
  slug: string
  link: string
}

export interface DocSection {
  heading: string
  slug: string
  level: number
  text: string
}

export interface DocPageMeta {
  file: string
  url: string
  title: string
  description: string
  frontmatter: Record<string, any>
  layout: 'doc' | 'home'
  aside: boolean
  outline: [number, number]
  lastUpdated: string
  headings: DocHeading[]
}

export interface ApiTagMeta {
  name: string
  description: string
  count: number
}

export interface ApiOperationMeta {
  operationId: string
  method: string
  path: string
  summary: string
  description: string
  tag: string
  deprecated: boolean
  hasSecurity: boolean
}

export interface ApiMeta {
  title: string
  description: string
  version: string
  servers: { url: string; description: string }[]
  tags: ApiTagMeta[]
  operations: ApiOperationMeta[]
}

export interface DocsMeta {
  pages: DocPageMeta[]
  api: ApiMeta
}

export interface SearchRecord {
  id: string
  url: string
  title: string
  heading: string
  level: number
  text: string
}

const rControl = /[\u0000-\u001f]/g
const rCombining = /[\u0300-\u036f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g

// 与 VitePress 的锚点规则保持一致，旧文档链接里的中文锚点才不会失效
export function slugify(input: string): string {
  return (
    String(input)
      .normalize('NFKD')
      .replace(rCombining, '')
      .replace(rControl, '')
      .replace(rSpecial, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'heading'
  )
}

// /docs/index.md → /，/docs/docs/index.md → /docs/，/docs/develop/api.md → /develop/api
export function fileToUrl(file: string): string {
  const normalized = file.replace(/\\/g, '/').replace(/^\//, '')
  const withoutRoot = normalized.startsWith(`${DOCS_DIR}/`)
    ? normalized.slice(DOCS_DIR.length + 1)
    : normalized
  const withoutExt = withoutRoot.replace(/\.md$/, '')

  if (withoutExt === 'index') return '/'
  if (withoutExt.endsWith('/index')) return `/${withoutExt.slice(0, -'index'.length)}`
  return `/${withoutExt}`
}

// 索引页的规范地址带尾斜杠（/docs/quick-start/），侧边栏里登记的是短形式（/docs/quick-start），
// 直接打开链接时路由保留用户输入的写法，比较前统一去掉哈希、query 和尾斜杠
export function normalizePath(input: string): string {
  const path = String(input).split('#')[0].split('?')[0]
  const trimmed = path.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

// md 里的相对链接（./auto-start、../parameters/troubleshooting#锚点）要按页面规范地址解析，
// 否则浏览器会拿当前 URL 去解析：/docs/advanced 与 /docs/advanced/ 会得到不同结果
export function resolveDocLink(href: string, pageUrl: string): string {
  if (!href || !pageUrl) return href
  // 绝对地址、协议、锚点、协议相对地址都不动
  if (/^(?:[a-z][a-z\d+.-]*:|#|\/\/|\/)/i.test(href)) return href

  // 只解析路径部分，锚点 / query 原样拼回去，避免中文锚点被百分号编码
  const splitAt = href.search(/[#?]/)
  const path = splitAt === -1 ? href : href.slice(0, splitAt)
  const suffix = splitAt === -1 ? '' : href.slice(splitAt)

  const dir = pageUrl.endsWith('/') ? pageUrl : `${pageUrl.slice(0, pageUrl.lastIndexOf('/'))}/`

  try {
    return `${new URL(path, `http://docs.local${dir}`).pathname}${suffix}`
  } catch {
    return href
  }
}

export function stripMarkdown(input: string): string {
  return String(input)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
}

// 花括号会被 Vue 当成插值
export function escapeBraces(input: string): string {
  return String(input).replace(/\{/g, '&#123;').replace(/\}/g, '&#125;')
}
