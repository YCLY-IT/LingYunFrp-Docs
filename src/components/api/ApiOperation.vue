<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NSpin, NTag } from 'naive-ui'
import {
  HTTP_METHODS,
  PARAM_LOCATIONS,
  buildCurl,
  buildFetch,
  collectParameters,
  loadSpec,
  normalizeSchema,
  pickJsonContent,
  sampleFromSchema,
  typeLabel,
} from '@/api/openapi'
import CodeBlock from '@/components/CodeBlock.vue'
import MethodBadge from './MethodBadge.vue'
import SchemaTree from './SchemaTree.vue'

const props = withDefaults(
  defineProps<{
    operationId: string
    showHeader?: boolean
    showSamples?: boolean
  }>(),
  { showHeader: true, showSamples: true },
)

const spec = ref<any>(null)
const loading = ref(true)
const sampleTab = ref<'curl' | 'fetch'>('curl')
const sampleTabs: ('curl' | 'fetch')[] = ['curl', 'fetch']

async function load() {
  loading.value = true
  try {
    spec.value = await loadSpec()
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.operationId, load)

const resolved = computed(() => {
  if (!spec.value) return null
  for (const [path, item] of Object.entries<any>(spec.value.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const operation = item?.[method]
      if (operation?.operationId === props.operationId) {
        return { path, method, operation, pathItem: item }
      }
    }
  }
  return null
})

const secured = computed(() => {
  const security = resolved.value?.operation?.security ?? spec.value?.security
  return Array.isArray(security) ? security.length > 0 : false
})

const parameters = computed(() =>
  resolved.value ? collectParameters(spec.value, resolved.value.operation, resolved.value.pathItem) : [],
)

const parameterGroups = computed(() =>
  PARAM_LOCATIONS.map(({ key, label }) => ({
    key,
    label,
    list: parameters.value.filter((parameter) => (parameter.in ?? 'query') === key),
  })).filter((group) => group.list.length),
)

const requestBody = computed(() => {
  const body = resolved.value?.operation?.requestBody
  if (!body) return null
  const normalized = normalizeSchema(spec.value, body)
  const { type, media } = pickJsonContent(normalized?.content)
  if (!type) return null
  return {
    type,
    description: String(normalized?.description ?? ''),
    required: Boolean(normalized?.required),
    schema: media?.schema ?? null,
    example: media?.example ?? (media?.schema ? sampleFromSchema(spec.value, media.schema) : null),
  }
})

const responses = computed(() => {
  const source: Record<string, any> = resolved.value?.operation?.responses ?? {}
  const entries = Object.entries<any>(source).sort(([a], [b]) => {
    const na = /^\d+$/.test(a) ? Number(a) : Number.MAX_SAFE_INTEGER
    const nb = /^\d+$/.test(b) ? Number(b) : Number.MAX_SAFE_INTEGER
    return na - nb || a.localeCompare(b)
  })

  return entries.map(([code, raw]) => {
    const response = normalizeSchema(spec.value, raw)
    const { type, media } = pickJsonContent(response?.content)
    return {
      code,
      description: String(response?.description ?? ''),
      type,
      schema: media?.schema ?? null,
      example: media?.example ?? (media?.schema ? sampleFromSchema(spec.value, media.schema) : null),
    }
  })
})

const bodyExample = computed(() => requestBody.value?.example ?? undefined)

const curl = computed(() =>
  resolved.value
    ? buildCurl({
        server: spec.value?.servers?.[0]?.url ?? '',
        method: resolved.value.method,
        path: resolved.value.path,
        parameters: parameters.value,
        body: bodyExample.value,
        secured: secured.value,
      })
    : '',
)

const fetchSample = computed(() =>
  resolved.value
    ? buildFetch({
        server: spec.value?.servers?.[0]?.url ?? '',
        method: resolved.value.method,
        path: resolved.value.path,
        parameters: parameters.value,
        body: bodyExample.value,
        secured: secured.value,
      })
    : '',
)

function statusType(code: string) {
  if (/^2/.test(code)) return 'success'
  if (/^3/.test(code)) return 'info'
  if (/^4/.test(code)) return 'warning'
  if (/^5/.test(code)) return 'error'
  return 'default'
}
</script>

<template>
  <div v-if="loading" class="flex justify-center py-10">
    <n-spin size="small" />
  </div>

  <div
    v-else-if="!resolved"
    class="my-4 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft"
  >
    没有在规范里找到接口 <code class="doc-inline-code">{{ operationId }}</code>
  </div>

  <div v-else class="space-y-2">
    <header v-if="showHeader" class="space-y-3">
      <div class="flex flex-wrap items-center gap-2">
        <MethodBadge :method="resolved.method" />
        <code class="break-all font-mono text-[15px] font-medium text-ink">{{ resolved.path }}</code>
        <n-tag v-if="resolved.operation.deprecated" size="tiny" type="error" :bordered="false">
          已废弃
        </n-tag>
      </div>

      <h1 class="!mt-3 text-2xl font-bold tracking-tight text-ink">{{ resolved.operation.summary }}</h1>

      <p
        v-if="resolved.operation.description"
        class="whitespace-pre-line text-sm leading-relaxed text-ink-soft"
      >
        {{ resolved.operation.description }}
      </p>

      <p class="text-sm text-ink-mute">
        鉴权：{{ secured ? '需要 Bearer Token' : '公开接口，无需鉴权' }}
      </p>
    </header>

    <section v-if="parameterGroups.length">
      <h2>请求参数</h2>
      <div v-for="group in parameterGroups" :key="group.key" class="mt-4">
        <h3 class="!mt-4">{{ group.label }}</h3>
        <div class="doc-table-wrap">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>必填</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="parameter in group.list" :key="parameter.name">
                <td><code class="doc-inline-code">{{ parameter.name }}</code></td>
                <td class="whitespace-nowrap font-mono text-xs">{{ typeLabel(spec, parameter.schema) }}</td>
                <td>
                  <span v-if="parameter.required" class="text-red-600 dark:text-red-400">必填</span>
                  <span v-else class="text-ink-mute">否</span>
                </td>
                <td>
                  <span>{{ parameter.description }}</span>
                  <span v-if="parameter.schema?.default !== undefined" class="block text-xs text-ink-mute">
                    默认值：{{ JSON.stringify(parameter.schema.default) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section v-if="requestBody">
      <h2>请求体</h2>
      <p class="text-sm text-ink-soft">
        <code class="doc-inline-code">{{ requestBody.type }}</code>
        <span v-if="requestBody.required" class="ml-2 text-red-600 dark:text-red-400">必填</span>
      </p>
      <p v-if="requestBody.description" class="text-sm text-ink-soft">{{ requestBody.description }}</p>

      <SchemaTree v-if="requestBody.schema" :spec="spec" :schema="requestBody.schema" title="字段" />

      <div v-if="requestBody.example !== null && requestBody.example !== undefined">
        <p class="mt-4 text-sm font-semibold text-ink">示例</p>
        <CodeBlock :code="JSON.stringify(requestBody.example, null, 2)" lang="json" />
      </div>
    </section>

    <section v-if="responses.length">
      <h2>响应</h2>
      <div v-for="response in responses" :key="response.code" class="mt-5 first:mt-3">
        <div class="flex flex-wrap items-center gap-2">
          <n-tag size="small" :type="statusType(response.code)" :bordered="false">
            {{ response.code }}
          </n-tag>
          <span class="text-sm text-ink-soft">{{ response.description }}</span>
          <code v-if="response.type" class="text-xs text-ink-mute">{{ response.type }}</code>
        </div>

        <SchemaTree v-if="response.schema" :spec="spec" :schema="response.schema" title="响应字段" />

        <CodeBlock
          v-if="response.example !== null && response.example !== undefined"
          :code="JSON.stringify(response.example, null, 2)"
          lang="json"
        />
      </div>
    </section>

    <section v-if="showSamples">
      <h2>请求示例</h2>
      <div class="mt-3 inline-flex rounded-lg border border-line p-0.5">
        <button
          v-for="tab in sampleTabs"
          :key="tab"
          type="button"
          class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
          :class="sampleTab === tab ? 'bg-brand-500/12 text-brand-600 dark:text-brand-300' : 'text-ink-mute hover:text-ink'"
          @click="sampleTab = tab"
        >
          {{ tab === 'curl' ? 'cURL' : 'JavaScript' }}
        </button>
      </div>
      <CodeBlock
        :code="sampleTab === 'curl' ? curl : fetchSample"
        :lang="sampleTab === 'curl' ? 'bash' : 'javascript'"
      />
    </section>
  </div>
</template>
