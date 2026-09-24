import fs from 'node:fs'
import path from 'node:path'
import { compileTemplate } from '@vue/compiler-sfc'
import type { Plugin } from 'vite'
import {
  API_SPEC_FILE,
  DOCS_DIR,
  fileToUrl,
  type ApiMeta,
  type ApiOperationMeta,
  type ApiTagMeta,
  type DocHeading,
  type DocPageMeta,
  type DocsMeta,
  type SearchRecord,
} from '../shared/docs.ts'
import { parseFrontmatter, renderMarkdown } from './markdown.ts'

const META_ID = 'virtual:docs-meta'
const RESOLVED_META_ID = `\0${META_ID}`
const SEARCH_ID = 'virtual:docs-search'
const RESOLVED_SEARCH_ID = `\0${SEARCH_ID}`

const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

interface CacheEntry {
  mtimeMs: number
  highlighted: boolean
  html: string
  frontmatter: Record<string, any>
  headings: DocHeading[]
  sections: { heading: string; slug: string; level: number; text: string }[]
  title: string
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full)
  }
  return out.sort()
}

function readApiMeta(root: string): ApiMeta {
  const empty: ApiMeta = { title: '', description: '', version: '', servers: [], tags: [], operations: [] }
  const file = path.resolve(root, API_SPEC_FILE)

  try {
    const spec = JSON.parse(fs.readFileSync(file, 'utf-8'))
    const tags: ApiTagMeta[] = (spec.tags ?? []).map((tag: any) => ({
      name: String(tag.name),
      description: String(tag.description ?? ''),
      count: 0,
    }))

    const operations: ApiOperationMeta[] = []
    for (const [routePath, item] of Object.entries<any>(spec.paths ?? {})) {
      for (const method of HTTP_METHODS) {
        const operation = item?.[method]
        if (!operation) continue
        const tag = String(operation.tags?.[0] ?? '默认分组')
        if (!tags.some((entry) => entry.name === tag)) tags.push({ name: tag, description: '', count: 0 })
        operations.push({
          operationId: String(operation.operationId ?? `${method}-${routePath}`),
          method,
          path: routePath,
          summary: String(operation.summary ?? operation.operationId ?? routePath),
          description: String(operation.description ?? ''),
          tag,
          deprecated: Boolean(operation.deprecated),
          hasSecurity: Array.isArray(operation.security) ? operation.security.length > 0 : false,
        })
      }
    }

    for (const tag of tags) {
      tag.count = operations.filter((operation) => operation.tag === tag.name).length
    }

    return {
      title: String(spec.info?.title ?? ''),
      description: String(spec.info?.description ?? ''),
      version: String(spec.info?.version ?? ''),
      servers: (spec.servers ?? []).map((server: any) => ({
        url: String(server.url ?? ''),
        description: String(server.description ?? ''),
      })),
      tags,
      operations,
    }
  } catch (error) {
    console.warn(`[docs] 未能读取 OpenAPI 规范（${API_SPEC_FILE}）：`, (error as Error).message)
    return empty
  }
}

export interface DocsPluginOptions {
  docsDir?: string
}

export function docs(options: DocsPluginOptions = {}): Plugin {
  const root = process.cwd()
  const docsDir = path.resolve(root, options.docsDir ?? DOCS_DIR)

  const renderCache = new Map<string, CacheEntry>()
  let metaCache: { pages: DocPageMeta[]; records: SearchRecord[]; api: ApiMeta } | null = null

  async function renderFile(file: string, highlight: boolean): Promise<CacheEntry> {
    const stat = fs.statSync(file)
    const cached = renderCache.get(file)
    const reusable = cached && cached.mtimeMs === stat.mtimeMs && (cached.highlighted || !highlight)
    if (reusable) return cached

    const source = fs.readFileSync(file, 'utf-8')
    const result = await renderMarkdown(source, { highlight })
    const entry: CacheEntry = {
      mtimeMs: stat.mtimeMs,
      highlighted: highlight,
      html: result.html,
      frontmatter: result.frontmatter,
      headings: result.headings,
      sections: result.sections,
      title: result.title,
    }
    renderCache.set(file, entry)
    return entry
  }

  async function buildIndex() {
    if (metaCache) return metaCache

    const pages: DocPageMeta[] = []
    const records: SearchRecord[] = []

    for (const file of walk(docsDir)) {
      const relative = `/${path.relative(root, file).split(path.sep).join('/')}`
      const url = fileToUrl(relative)
      const stat = fs.statSync(file)
      const { data: frontmatter } = parseFrontmatter(fs.readFileSync(file, 'utf-8'))
      const rendered = await renderFile(file, false)

      const outline: [number, number] = Array.isArray(frontmatter.outline)
        ? [Number(frontmatter.outline[0]) || 2, Number(frontmatter.outline[1]) || 3]
        : [2, 3]

      const title =
        rendered.title || String(frontmatter.hero?.name ?? '') || path.basename(file, '.md')
      const description = String(frontmatter.description ?? '')

      pages.push({
        file: relative,
        url,
        title,
        description,
        frontmatter,
        layout: frontmatter.layout === 'home' ? 'home' : 'doc',
        aside: frontmatter.aside !== false,
        outline,
        lastUpdated: new Date(stat.mtimeMs).toISOString(),
        headings: rendered.headings,
      })

      if (description) {
        records.push({ id: `${url}#`, url, title, heading: '', level: 0, text: description })
      }

      for (const [index, section] of rendered.sections.entries()) {
        const text = section.text.trim()
        if (!text) continue
        records.push({
          id: `${url}#${section.slug || index}`,
          url: section.slug ? `${url}#${section.slug}` : url,
          title,
          heading: section.heading,
          level: section.level,
          text,
        })
      }
    }

    pages.sort((a, b) => a.url.localeCompare(b.url))
    metaCache = { pages, records, api: readApiMeta(root) }
    return metaCache
  }

  return {
    name: 'lingyun-docs',
    enforce: 'pre',

    resolveId(id) {
      if (id === META_ID) return RESOLVED_META_ID
      if (id === SEARCH_ID) return RESOLVED_SEARCH_ID
      return null
    },

    async load(id) {
      if (id === RESOLVED_META_ID) {
        const { pages, api } = await buildIndex()
        const meta: DocsMeta = { pages, api }
        return `export default ${JSON.stringify(meta)}`
      }
      if (id === RESOLVED_SEARCH_ID) {
        const { records } = await buildIndex()
        return `export default ${JSON.stringify(records)}`
      }
      return null
    },

    async transform(source, id) {
      const file = id.split('?')[0]
      if (!file.endsWith('.md') || file.startsWith('\0')) return null
      if (!path.resolve(file).startsWith(docsDir)) return null

      const rendered = await renderFile(file, true)
      const url = fileToUrl(`/${path.relative(root, file).split(path.sep).join('/')}`)

      const { code, errors } = compileTemplate({
        source: rendered.html,
        filename: file,
        id: `doc-${url}`,
        transformAssetUrls: false,
        compilerOptions: {
          // 小写标签当原生元素，大写开头才走组件解析
          isCustomElement: (tag: string) => !/^[A-Z]/.test(tag),
        },
      })

      if (errors.length) {
        console.warn(`[docs] ${url} 模板编译告警：`, errors.map(String).join('; '))
      }

      const payload = JSON.stringify({
        frontmatter: rendered.frontmatter,
        headings: rendered.headings,
        sections: rendered.sections,
        title: rendered.title,
        url,
      })

      return [
        code,
        '',
        `const doc = ${payload}`,
        'export const frontmatter = doc.frontmatter',
        'export const headings = doc.headings',
        'export const sections = doc.sections',
        'export const title = doc.title',
        'export const url = doc.url',
        `export default { name: ${JSON.stringify(`doc:${url}`)}, render, frontmatter, headings, sections, title, url }`,
      ].join('\n')
    },

    hotUpdate({ file, server }) {
      const touchedDocs = file.endsWith('.md') && path.resolve(file).startsWith(docsDir)
      const touchedSpec = path.resolve(file) === path.resolve(root, API_SPEC_FILE)
      if (!touchedDocs && !touchedSpec) return

      renderCache.delete(path.resolve(file))
      metaCache = null

      const modules = [RESOLVED_META_ID, RESOLVED_SEARCH_ID]
        .map((id) => this.environment.moduleGraph.getModuleById(id))
        .filter(Boolean)

      for (const mod of modules) {
        this.environment.moduleGraph.invalidateModule(mod!)
      }

      server.ws.send({ type: 'full-reload' })
      return []
    },
  }
}
