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
