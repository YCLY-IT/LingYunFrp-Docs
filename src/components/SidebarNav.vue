<script lang="ts">
import type { InjectionKey } from 'vue'
import type { SidebarGroup } from '@/config/site'

export interface SidebarNavApi {
  isOpen: (group: SidebarGroup, key: string) => boolean
  toggle: (group: SidebarGroup, key: string) => void
  isActive: (link: string) => boolean
}

export const sidebarNavKey: InjectionKey<SidebarNavApi> = Symbol('sidebar-nav')
</script>

<script setup lang="ts">
import { computed, nextTick, provide, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { normalizePath } from '#shared/docs'
import { resolveSidebar, type SidebarGroup, type SidebarLink } from '@/config/site'
import SidebarGroupNode from './SidebarGroupNode.vue'

const emit = defineEmits<{ navigate: [] }>()

const route = useRoute()
const STORAGE_KEY = 'lyfrp-sidebar'

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

function collectLinks(group: SidebarGroup, acc: SidebarLink[]) {
  if (group.items) acc.push(...group.items)
  for (const child of group.children ?? []) collectLinks(child, acc)
}

const allLinks = computed(() => {
  const links: SidebarLink[] = []
  for (const group of groups.value) collectLinks(group, links)
  return links
})

// 同一页面既登记了页面级条目、又登记了锚点条目时（如 /develop/api 与 /develop/api#鉴权），
// 命中锚点时只高亮锚点条目，避免两处同时点亮
const anchoredPaths = computed(() => {
  const paths = new Set<string>()
  for (const item of allLinks.value) {
    if (item.link.includes('#')) paths.add(normalizePath(item.link))
  }
  return paths
})

function subtreeHasActive(group: SidebarGroup): boolean {
  if (group.items?.some((item) => normalizePath(item.link) === normalizePath(route.path))) return true
  return group.children?.some(subtreeHasActive) ?? false
}

function hasActive(group: SidebarGroup) {
  return subtreeHasActive(group)
}

function isOpen(group: SidebarGroup, key: string) {
  const saved = collapsed.value[key]
  if (saved !== undefined) return !saved
  return !(group.collapsed && !hasActive(group))
}

function toggle(group: SidebarGroup, key: string) {
  const next = { ...collapsed.value, [key]: isOpen(group, key) }
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

provide(sidebarNavKey, { isOpen, toggle, isActive })

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

    <SidebarGroupNode
      v-for="(group, index) in groups"
      :key="group.text"
      :group="group"
      :node-key="`${prefix}::${group.text}`"
      :depth="0"
      :index="index"
      @navigate="emit('navigate')"
    />
  </nav>
</template>
