export type JsonSchema = Record<string, any>

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const

export const PARAM_LOCATIONS: { key: string; label: string }[] = [
  { key: 'path', label: '路径参数' },
  { key: 'query', label: '查询参数' },
  { key: 'header', label: '请求头' },
  { key: 'cookie', label: 'Cookie' },
]

let specPromise: Promise<any> | null = null

export function loadSpec(): Promise<any> {
  if (!specPromise) {
    specPromise = import('./openapi.json').then((module: any) => module.default ?? module)
  }
  return specPromise
}

export function resolveRef(spec: any, ref: string): any {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return undefined
  let current = spec
  for (const segment of ref.slice(2).split('/')) {
    const key = segment.replace(/~1/g, '/').replace(/~0/g, '~')
    if (current == null || typeof current !== 'object') return undefined
    current = current[key]
  }
  return current
}

// 把 allOf / $ref 拍平成便于展示的 schema，返回浅拷贝
export function normalizeSchema(spec: any, schema: any, depth = 0): any {
  if (!schema || typeof schema !== 'object' || depth > 10) return schema

  let result: any = { ...schema }

  if (typeof result.$ref === 'string') {
    const target = resolveRef(spec, result.$ref)
    const { $ref: _ref, ...rest } = result
    result = { ...(target ? normalizeSchema(spec, target, depth + 1) : {}), ...rest }
  }

  if (Array.isArray(result.allOf)) {
    const merged: any = { type: 'object', properties: {}, required: [] as string[] }
    for (const part of result.allOf) {
      const normalized = normalizeSchema(spec, part, depth + 1)
      if (normalized?.properties) Object.assign(merged.properties, normalized.properties)
      if (Array.isArray(normalized?.required)) merged.required.push(...normalized.required)
      if (normalized?.type && normalized.type !== 'object') merged.type = normalized.type
      if (normalized?.items && !merged.items) merged.items = normalized.items
      if (normalized?.description && !merged.description) merged.description = normalized.description
    }
    const { allOf: _allOf, ...rest } = result
    result = { ...merged, ...rest, required: merged.required }
  }

  return result
}

export function refName(ref?: string) {
  if (typeof ref !== 'string') return ''
  return ref.split('/').pop() ?? ''
}

export function typeLabel(spec: any, schema: any): string {
  if (!schema || typeof schema !== 'object') return 'any'

  if (schema.$ref) return refName(schema.$ref) || 'object'

  if (schema.type === 'array' || schema.items) {
    const inner = schema.items?.$ref ? refName(schema.items.$ref) : typeLabel(spec, normalizeSchema(spec, schema.items ?? {}))
    return `${inner}[]`
  }

  if (Array.isArray(schema.enum) && schema.enum.length && schema.enum.length <= 5) {
    return schema.enum.map((value: any) => JSON.stringify(value)).join(' | ')
  }

  if (Array.isArray(schema.type)) return schema.type.join(' | ')
  if (schema.type) return String(schema.type)
  if (schema.allOf || schema.properties) return 'object'
  if (Array.isArray(schema.oneOf)) return schema.oneOf.map((item: any) => refName(item.$ref) || item.type || 'any').join(' | ')
  if (Array.isArray(schema.anyOf)) return schema.anyOf.map((item: any) => refName(item.$ref) || item.type || 'any').join(' | ')
  return 'any'
}

export interface PropView {
  name: string
  typeLabel: string
  description: string
  required: boolean
  depth: number
  enumValues?: any[]
  defaultValue?: any
}

export function flattenProperties(
  spec: any,
  rawSchema: any,
  options: { depth?: number; maxDepth?: number } = {},
): PropView[] {
  const { depth = 0, maxDepth = 2 } = options
  const schema = normalizeSchema(spec, rawSchema)
  if (!schema || depth > maxDepth) return []

  if (schema.type === 'array' || schema.items) {
    const items = normalizeSchema(spec, schema.items ?? {})
    return flattenProperties(spec, items, { depth: depth + 1, maxDepth })
  }

  const properties: Record<string, any> = schema.properties ?? {}
  const required: string[] = schema.required ?? []
  const views: PropView[] = []

  for (const [name, raw] of Object.entries<any>(properties)) {
    const property = normalizeSchema(spec, raw)
    views.push({
      name,
      typeLabel: typeLabel(spec, raw),
      description: String(property?.description ?? ''),
      required: required.includes(name),
      depth,
      enumValues: Array.isArray(property?.enum) ? property.enum : undefined,
      defaultValue: property?.default,
    })

    if (depth < maxDepth) {
      const nestedSource =
        property?.type === 'array' || property?.items
          ? normalizeSchema(spec, property.items ?? {})
          : property
      views.push(...flattenProperties(spec, nestedSource, { depth: depth + 1, maxDepth }))
    }
  }

  return views
}

export function collectParameters(spec: any, operation: any, pathItem: any): any[] {
  const list = [...(pathItem?.parameters ?? []), ...(operation?.parameters ?? [])]
  const unique = new Map<string, any>()
  for (const raw of list) {
    const parameter = normalizeSchema(spec, raw)
    if (!parameter?.name) continue
    unique.set(`${parameter.in ?? 'query'}:${parameter.name}`, parameter)
  }
  return [...unique.values()]
}

export function sampleFromSchema(spec: any, rawSchema: any, depth = 0): any {
  if (!rawSchema || typeof rawSchema !== 'object' || depth > 5) return null

  const schema = normalizeSchema(spec, rawSchema)

  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (Array.isArray(schema.enum) && schema.enum.length) return schema.enum[0]

  if (Array.isArray(schema.oneOf) && schema.oneOf.length) return sampleFromSchema(spec, schema.oneOf[0], depth + 1)
  if (Array.isArray(schema.anyOf) && schema.anyOf.length) return sampleFromSchema(spec, schema.anyOf[0], depth + 1)

  switch (schema.type) {
    case 'object': {
      const output: Record<string, any> = {}
      for (const [key, value] of Object.entries<any>(schema.properties ?? {})) {
        output[key] = sampleFromSchema(spec, value, depth + 1)
      }
      return output
    }
    case 'array':
      return [sampleFromSchema(spec, schema.items ?? {}, depth + 1)]
    case 'integer':
    case 'number':
      return 0
    case 'boolean':
      return true
    case 'string':
      return schema.format === 'date-time' ? '2026-01-01T00:00:00Z' : 'string'
    default:
      return schema.properties ? sampleFromSchema(spec, { ...schema, type: 'object' }, depth + 1) : null
  }
}

export function pickJsonContent(content: Record<string, any> | undefined) {
  if (!content) return { type: '', media: null as any }
  const type = Object.keys(content).find((key) => key.includes('json')) ?? Object.keys(content)[0]
  if (!type) return { type: '', media: null as any }
  return { type, media: content[type] ?? null }
}

export function buildCurl(options: {
  server: string
  method: string
  path: string
  parameters: any[]
  body?: any
  secured?: boolean
}) {
  const { server, method, path, parameters, body, secured } = options
  const upper = method.toUpperCase()
  let url = `${(server || '').replace(/\/$/, '')}${path}`
  const query: string[] = []

  for (const parameter of parameters) {
    if (parameter.in === 'path') url = url.replace(`{${parameter.name}}`, `<${parameter.name}>`)
    else if (parameter.in === 'query') query.push(`${parameter.name}=<${parameter.name}>`)
  }
  if (query.length) url += `?${query.join('&')}`

  const lines = [`curl -X ${upper} '${url}'`]
  lines.push(`  -H 'Accept: application/json'`)
  if (body !== undefined && upper !== 'GET' && upper !== 'HEAD') {
    lines.push(`  -H 'Content-Type: application/json'`)
    lines.push(`  -d '${JSON.stringify(body, null, 2)}'`)
  }
  if (secured) lines.push(`  -H 'Authorization: Bearer <token>'`)

  return lines.join(' \\\n')
}

export function buildFetch(options: {
  server: string
  method: string
  path: string
  parameters: any[]
  body?: any
  secured?: boolean
}) {
  const { server, method, path, parameters, body, secured } = options
  const upper = method.toUpperCase()
  let url = `${(server || '').replace(/\/$/, '')}${path}`
  const query: string[] = []

  for (const parameter of parameters) {
    if (parameter.in === 'path') url = url.replace(`{${parameter.name}}`, `<${parameter.name}>`)
    else if (parameter.in === 'query') query.push(`${parameter.name}=<${parameter.name}>`)
  }
  if (query.length) url += `?${query.join('&')}`

  const headers: Record<string, string> = { Accept: 'application/json' }
  const init: Record<string, any> = { method: upper, headers }

  if (body !== undefined && upper !== 'GET' && upper !== 'HEAD') {
    headers['Content-Type'] = 'application/json'
    init.body = body
  }
  if (secured) headers.Authorization = 'Bearer <token>'

  const bodyLine = init.body ? `\n  body: JSON.stringify(${JSON.stringify(init.body, null, 2).replace(/\n/g, '\n  ')}),` : ''

  return [
    `const response = await fetch('${url}', {`,
    `  method: '${upper}',`,
    `  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, '\n  ')},${bodyLine}`,
    '})',
    '',
    'const data = await response.json()',
    'console.log(data)',
  ].join('\n')
}
