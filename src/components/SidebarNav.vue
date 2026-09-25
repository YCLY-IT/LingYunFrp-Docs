<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AnimatePresence, Motion } from 'motion-v'
import { normalizePath } from '#shared/docs'
import { resolveSidebar, type SidebarGroup } from '@/config/site'

const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const STORAGE_KEY = 'lyfrp-sidebar'

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

function readState(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const collapsed = ref<Record<string, boolean>>(readState())

const sidebar = computed(() => resolveSidebar(route.path))
const prefix = computed(() => sidebar.value?.prefix ?? '')
const groups = computed(() => sidebar.value?.groups ?? [])

function groupKey(group: SidebarGroup) {
  return `${prefix.value}::${group.text}`
}

function hasActive(group: SidebarGroup) {
  const current = normalizePath(route.path)
  return group.items.some((item) => normalizePath(item.link) === current)
}

// 同一页面既登记了页面级条目、又登记了锚点条目时（如 /develop/api 与 /develop/api#鉴权），
// 命中锚点时只高亮锚点条目，避免两处同时点亮
const anchoredPaths = computed(() => {
  const paths = new Set<string>()
  for (const group of groups.value) {
    for (const item of group.items) {
      if (item.link.includes('#')) paths.add(normalizePath(item.link))
    }
  }
  return paths
})

function isOpen(group: SidebarGroup) {
  const saved = collapsed.value[groupKey(group)]
  if (saved !== undefined) return !saved
  return !(group.collapsed && !hasActive(group))
}

function toggle(group: SidebarGroup) {
  const next = { ...collapsed.value, [groupKey(group)]: isOpen(group) }
  collapsed.value = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 忽略
  }
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function isActive(link: string) {
  const [path, hash] = link.split('#')
  if (normalizePath(path) !== normalizePath(route.path)) return false

  if (!hash) {
    // 直接打开带锚点的链接时，页面级条目依然算当前页
    return !route.hash || !anchoredPaths.value.has(normalizePath(path))
  }

  return route.hash === `#${hash}` || safeDecode(route.hash.slice(1)) === hash
}

watch(
  () => route.path,
  async () => {
    await nextTick()
    const active = document.querySelector<HTMLElement>('[data-sidebar-active="true"]')
    active?.scrollIntoView({ block: 'nearest' })
  },
)
</script>

<template>
  <nav class="space-y-5" aria-label="文档目录">
    <p v-if="!groups.length" class="px-2 text-sm text-ink-mute">该页面没有目录</p>

    <section v-for="(group, groupIndex) in groups" :key="groupKey(group)">
      <Motion
        as="button"
        type="button"
        class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-[13px] font-semibold tracking-wide text-ink transition-colors hover:bg-hover"
        :aria-expanded="isOpen(group)"
        :initial="{ opacity: 0, x: -10 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ duration: 0.42, delay: Math.min(groupIndex, 10) * 0.05, ease: easeOut }"
        @click="toggle(group)"
      >
        <span>{{ group.text }}</span>
        <Motion
          as="span"
          class="grid shrink-0 place-items-center text-ink-mute"
          :animate="{ rotate: isOpen(group) ? 90 : 0 }"
          :transition="{ type: 'spring', stiffness: 420, damping: 26 }"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 6l6 6-6 6" />
          </svg>
        </Motion>
      </Motion>

      <AnimatePresence :initial="false">
        <Motion
          v-if="isOpen(group)"
          :key="`list-${groupKey(group)}`"
          as="ul"
          class="ml-2 mt-1 space-y-0.5 overflow-hidden border-l border-line pl-2"
          :initial="{ height: 0, opacity: 0 }"
          :animate="{ height: 'auto', opacity: 1 }"
          :exit="{ height: 0, opacity: 0 }"
          :transition="{ duration: 0.34, ease: easeOut }"
        >
          <Motion
            v-for="(item, index) in group.items"
            :key="item.link"
            as="li"
            :initial="{ opacity: 0, x: -12 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.38, delay: 0.03 + Math.min(index, 14) * 0.028, ease: easeOut }"
          >
            <router-link
              :to="item.link"
              :data-sidebar-active="isActive(item.link) ? 'true' : undefined"
              class="relative block rounded-md px-2.5 py-1.5 text-[13.5px] leading-snug transition-colors"
              :class="
                isActive(item.link)
                  ? 'font-medium text-brand-600 dark:text-brand-300'
                  : 'text-ink-soft hover:bg-hover hover:text-ink'
              "
              @click="emit('navigate')"
            >
              <Motion
                v-if="isActive(item.link)"
                class="pointer-events-none absolute inset-0 rounded-md bg-brand-500/10"
                :initial="{ opacity: 0, scale: 0.92 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{ type: 'spring', stiffness: 460, damping: 30 }"
              />
              <span class="relative">{{ item.text }}</span>
            </router-link>
          </Motion>
        </Motion>
      </AnimatePresence>
    </section>
  </nav>
</template>
