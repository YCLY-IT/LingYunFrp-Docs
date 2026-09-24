import meta from 'virtual:docs-meta'
import type { DocHeading, DocPageMeta } from '#shared/docs'

export const api = meta.api
export const pages: DocPageMeta[] = meta.pages

export type PageKind = 'doc' | 'api-tag' | 'api-operation' | 'not-found'

export interface PageView {
  url: string
  title: string
  description: string
  frontmatter: Record<string, any>
  layout: 'doc' | 'home'
  aside: boolean
  outline: [number, number]
  headings: DocHeading[]
  lastUpdated: string
  file?: string
  kind: PageKind
}

const DEFAULT_OUTLINE: [number, number] = [2, 3]

const byUrl = new Map(pages.map((page) => [page.url, page]))

function normalize(url: string) {
  const clean = url.split('#')[0].split('?')[0]
  if (clean === '/') return '/'
  return clean.endsWith('/') ? clean : `${clean}/`
}

const byNormalizedUrl = new Map<string, DocPageMeta>()
for (const page of pages) byNormalizedUrl.set(normalize(page.url), page)

export function getPage(url: string): DocPageMeta | undefined {
  const clean = url.split('#')[0].split('?')[0]
  return byUrl.get(clean) ?? byNormalizedUrl.get(normalize(clean))
}

export function operationUrl(operationId: string) {
  return `/develop/operations/${operationId}`
}

export function tagUrl(tag: string) {
  return `/develop/tags/${encodeURIComponent(tag)}`
}

export function findOperation(operationId: string) {
  return api.operations.find((operation) => operation.operationId === operationId)
}

export function titleOf(url: string, fallback = '未命名页面'): string {
  const page = getPage(url)
  if (page) return page.title

  const operation = /^\/develop\/operations\/(.+)$/.exec(url)
  if (operation) return findOperation(operation[1])?.summary ?? fallback

  const tag = /^\/develop\/tags\/(.+)$/.exec(url)
  if (tag) return `${decodeURIComponent(tag[1])} · 接口分组`

  return fallback
}

function fromDocPage(page: DocPageMeta): PageView {
  return {
    url: page.url,
    title: page.title,
    description: page.description,
    frontmatter: page.frontmatter ?? {},
    layout: page.layout,
    aside: page.aside,
    outline: page.outline ?? DEFAULT_OUTLINE,
    headings: page.headings ?? [],
    lastUpdated: page.lastUpdated,
    file: page.file,
    kind: 'doc',
  }
}

export interface RouteLike {
  path: string
  name?: unknown
  params: Record<string, any>
}

export function resolveRoutePage(route: RouteLike): PageView {
  if (route.name === 'api-tag') {
    const tag = decodeURIComponent(String(route.params.tag ?? ''))
    return {
      url: route.path,
      title: `${tag} · 接口分组`,
      description: api.tags.find((entry) => entry.name === tag)?.description ?? '',
      frontmatter: {},
      layout: 'doc',
      aside: false,
      outline: DEFAULT_OUTLINE,
      headings: [],
      lastUpdated: '',
      kind: 'api-tag',
    }
  }

  if (route.name === 'api-operation') {
    const operation = findOperation(String(route.params.operationId ?? ''))
    return {
      url: route.path,
      title: operation?.summary ?? '接口详情',
      description: operation?.description ?? '',
      frontmatter: {},
      layout: 'doc',
      aside: false,
      outline: DEFAULT_OUTLINE,
      headings: [],
      lastUpdated: '',
      kind: 'api-operation',
    }
  }

  const page = getPage(route.path)
  if (page) return fromDocPage(page)

  return {
    url: route.path,
    title: '页面不存在',
    description: '',
    frontmatter: {},
    layout: 'doc',
    aside: false,
    outline: DEFAULT_OUTLINE,
    headings: [],
    lastUpdated: '',
    kind: route.name === 'not-found' ? 'not-found' : 'doc',
  }
}
