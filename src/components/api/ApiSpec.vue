<script setup lang="ts">
import { computed, ref } from 'vue'
import { NTag } from 'naive-ui'
import { slugify } from '#shared/docs'
import { api, operationUrl, tagUrl } from '@/docs/meta'
import ApiOperation from './ApiOperation.vue'
import MethodBadge from './MethodBadge.vue'

const props = withDefaults(
  defineProps<{
    tags?: string[]
    hideInfo?: boolean
    hideServers?: boolean
  }>(),
  { tags: () => [], hideInfo: false, hideServers: false },
)

const expanded = ref<Record<string, boolean>>({})

const groups = computed(() => {
  const names = props.tags.length ? props.tags : api.tags.map((tag) => tag.name)
  return names
    .map((name) => {
      const meta = api.tags.find((tag) => tag.name === name)
      return {
        name,
        slug: `tag-${slugify(name)}`,
        description: meta?.description ?? '',
        operations: api.operations.filter((operation) => operation.tag === name),
      }
    })
    .filter((group) => group.operations.length > 0)
})

function toggle(operationId: string) {
  expanded.value = { ...expanded.value, [operationId]: !expanded.value[operationId] }
}
</script>

<template>
  <div class="space-y-2">
    <section v-if="!hideInfo" class="rounded-xl border border-line bg-surface px-5 py-4">
      <h2 class="!m-0 !border-0 !p-0 !text-lg">{{ api.title || '接口规范' }}</h2>
      <p class="mt-1 text-sm text-ink-soft">{{ api.description }}</p>
      <p class="mt-1 text-xs text-ink-mute">
        共 {{ api.operations.length }} 个接口 · {{ api.tags.length }} 个分组
        <span v-if="api.version"> · 版本 {{ api.version }}</span>
      </p>
    </section>

    <section v-if="!hideServers && api.servers.length" class="rounded-xl border border-line px-5 py-4">
      <p class="text-xs font-semibold text-ink-soft">服务地址</p>
      <ul class="mt-1.5 space-y-1">
        <li v-for="server in api.servers" :key="server.url" class="flex flex-wrap items-center gap-2 text-sm">
          <code class="doc-inline-code">{{ server.url }}</code>
          <span class="text-xs text-ink-mute">{{ server.description }}</span>
        </li>
      </ul>
    </section>

    <section v-for="group in groups" :key="group.name" class="pt-4">
      <div class="flex flex-wrap items-baseline gap-2">
        <h2 :id="group.slug" class="!mt-0">{{ group.name }}</h2>
        <NTag size="small" :bordered="false">{{ group.operations.length }}</NTag>
        <router-link :to="tagUrl(group.name)" class="text-xs text-brand-600 dark:text-brand-300">
          分组页 →
        </router-link>
      </div>
      <p v-if="group.description" class="-mt-1 mb-3 text-sm text-ink-soft">{{ group.description }}</p>

      <div class="space-y-2">
        <div
          v-for="operation in group.operations"
          :key="operation.operationId"
          class="overflow-hidden rounded-xl border border-line transition-colors hover:border-brand-300"
        >
          <button
            type="button"
            class="flex w-full flex-wrap items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-hover"
            :aria-expanded="Boolean(expanded[operation.operationId])"
            @click="toggle(operation.operationId)"
          >
            <MethodBadge :method="operation.method" />
            <code class="break-all font-mono text-[13px] font-medium text-ink">{{ operation.path }}</code>
            <span class="text-sm text-ink-soft">{{ operation.summary }}</span>
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="ml-auto shrink-0 text-ink-mute transition-transform duration-200"
              :class="expanded[operation.operationId] ? 'rotate-180' : ''"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div v-if="expanded[operation.operationId]" class="border-t border-line px-4 pb-4">
            <ApiOperation
              :operation-id="operation.operationId"
              :show-header="false"
              :show-samples="false"
            />
            <router-link
              :to="operationUrl(operation.operationId)"
              class="mt-2 inline-block text-sm text-brand-600 dark:text-brand-300"
            >
              单独打开这个接口 →
            </router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
