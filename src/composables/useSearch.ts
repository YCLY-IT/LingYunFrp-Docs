import MiniSearch from 'minisearch'
import records from 'virtual:docs-search'
import type { SearchRecord } from '#shared/docs'

export interface SearchHit {
  url: string
  title: string
  heading: string
  snippet: string
  score: number
  keywords: string[]
}

const CJK_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/
const SEGMENT_RE = /[a-z0-9_.#/@+-]+|[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/g

// 默认分词器按空格切词，中文检索不到，这里按「单字 + 双字」切
function tokenize(text: string): string[] {
  const tokens: string[] = []
  const segments = String(text).toLowerCase().match(SEGMENT_RE) ?? []

  for (const segment of segments) {
    if (!CJK_RE.test(segment)) {
      tokens.push(segment)
      continue
    }
    for (let index = 0; index < segment.length; index += 1) {
      tokens.push(segment[index])
      if (index + 1 < segment.length) tokens.push(segment.slice(index, index + 2))
    }
  }

  return tokens
}

let engine: MiniSearch<SearchRecord> | null = null

function getEngine() {
  if (engine) return engine

  engine = new MiniSearch<SearchRecord>({
    fields: ['title', 'heading', 'text'],
    storeFields: ['url', 'title', 'heading', 'text'],
    tokenize,
    searchOptions: {
      boost: { title: 4, heading: 2.5, text: 1 },
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'AND',
    },
  })

  engine.addAll(records.map((record, index) => ({ ...record, id: record.id || String(index) })))
  return engine
}

function makeSnippet(text: string, keywords: string[]) {
  const source = text.replace(/\s+/g, ' ').trim()
  if (!source) return ''

  const lower = source.toLowerCase()
  let hit = -1
  for (const keyword of keywords) {
    if (keyword.length < 2) continue
    const index = lower.indexOf(keyword)
    if (index !== -1 && (hit === -1 || index < hit)) hit = index
  }
  if (hit === -1) return source.slice(0, 110) + (source.length > 110 ? '…' : '')

  const start = Math.max(0, hit - 40)
  const end = Math.min(source.length, hit + 90)
  return `${start > 0 ? '…' : ''}${source.slice(start, end)}${end < source.length ? '…' : ''}`
}

export function searchDocs(query: string, limit = 12): SearchHit[] {
  const keyword = query.trim()
  if (!keyword) return []

  const keywords = Array.from(new Set(tokenize(keyword).filter((token) => token.length > 1)))

  return getEngine()
    .search(keyword)
    .slice(0, limit)
    .map((result) => ({
      url: String(result.url ?? ''),
      title: String(result.title ?? ''),
      heading: String(result.heading ?? ''),
      snippet: makeSnippet(String(result.text ?? ''), keywords.length ? keywords : [keyword]),
      score: result.score,
      keywords: keywords.length ? keywords : [keyword],
    }))
}
