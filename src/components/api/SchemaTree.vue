<script setup lang="ts">
import { computed } from 'vue'
import { flattenProperties } from '@/api/openapi'

const props = withDefaults(
  defineProps<{
    spec: any
    schema: any
    title?: string
    maxDepth?: number
  }>(),
  { title: '', maxDepth: 2 },
)

const rows = computed(() =>
  flattenProperties(props.spec, props.schema, { maxDepth: props.maxDepth }),
)
</script>

<template>
  <div class="my-4 overflow-hidden rounded-xl border border-line">
    <div v-if="title" class="border-b border-line bg-surface px-4 py-2 text-xs font-semibold text-ink-soft">
      {{ title }}
    </div>

    <p v-if="!rows.length" class="px-4 py-3 text-sm text-ink-mute">没有可展示的字段</p>

    <ul v-else class="divide-y divide-line">
      <li
        v-for="(row, index) in rows"
        :key="`${row.name}-${row.depth}-${index}`"
        class="py-2 pr-4"
        :style="{ paddingLeft: `${16 + row.depth * 18}px` }"
      >
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <code class="font-mono text-[13px] font-medium text-ink">{{ row.name }}</code>
          <span class="font-mono text-[11px] text-brand-600 dark:text-brand-300">{{ row.typeLabel }}</span>
          <span
            v-if="row.required"
            class="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400"
          >
            必填
          </span>
        </div>
        <p v-if="row.description" class="mt-1 text-xs leading-relaxed text-ink-soft">{{ row.description }}</p>
        <p v-if="row.enumValues?.length" class="mt-0.5 text-[11px] text-ink-mute">
          可选值：{{ row.enumValues.map((value) => JSON.stringify(value)).join(' / ') }}
        </p>
        <p v-if="row.defaultValue !== undefined" class="mt-0.5 text-[11px] text-ink-mute">
          默认值：{{ JSON.stringify(row.defaultValue) }}
        </p>
      </li>
    </ul>
  </div>
</template>
