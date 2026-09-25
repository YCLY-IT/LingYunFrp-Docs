<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { normalizePath } from '#shared/docs'
import { orderedPages } from '@/config/site'
import { titleOf } from '@/docs/meta'
import RevealOnScroll from './motion/RevealOnScroll.vue'

const route = useRoute()

const neighbours = computed(() => {
  const list = orderedPages(route.path)
  // 直接打开链接时路由可能是带尾斜杠的索引页写法，比较前归一化
  const current = normalizePath(route.path)
  const index = list.findIndex((url) => normalizePath(url) === current)
  if (index === -1) return { prev: '', next: '' }
  return { prev: list[index - 1] ?? '', next: list[index + 1] ?? '' }
})
</script>

<template>
  <RevealOnScroll
    v-if="neighbours.prev || neighbours.next"
    as="nav"
    :y="26"
    :delay="0.08"
    class="mt-12 grid gap-3 border-t border-line pt-6 sm:grid-cols-2"
    aria-label="上一篇 / 下一篇"
  >
    <router-link
      v-if="neighbours.prev"
      :to="neighbours.prev"
      class="group flex flex-col gap-0.5 rounded-xl border border-line px-4 py-3 transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-hover hover:shadow-lg"
    >
      <span class="text-xs text-ink-mute">上一篇</span>
      <span class="text-sm font-medium text-brand-600 dark:text-brand-300">
        <span class="inline-block transition-transform duration-300 group-hover:-translate-x-1">←</span>
        {{ titleOf(neighbours.prev) }}
      </span>
    </router-link>
    <span v-else class="hidden sm:block" />

    <router-link
      v-if="neighbours.next"
      :to="neighbours.next"
      class="group flex flex-col gap-0.5 rounded-xl border border-line px-4 py-3 transition duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-hover hover:shadow-lg sm:items-end sm:text-right"
    >
      <span class="text-xs text-ink-mute">下一篇</span>
      <span class="text-sm font-medium text-brand-600 dark:text-brand-300">
        {{ titleOf(neighbours.next) }}
        <span class="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
      </span>
    </router-link>
  </RevealOnScroll>
</template>
