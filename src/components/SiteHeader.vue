<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Motion } from 'motion-v'
import { NDrawer, NDrawerContent } from 'naive-ui'
import { nav, site } from '@/config/site'
import { useUi } from '@/composables/useUi'
import type { PageView } from '@/docs/meta'
import SidebarNav from './SidebarNav.vue'
import ThemeToggle from './ThemeToggle.vue'

defineProps<{ page: PageView }>()

const route = useRoute()
const { openSearch, openSidebar, sidebarOpen } = useUi()

const isActive = (match: RegExp) => match.test(route.path)

const navRef = ref<HTMLElement | null>(null)
const indicator = ref({ left: 0, width: 0, ready: false })
const scrolled = ref(false)

function measureNav() {
  const container = navRef.value
  const active = container?.querySelector<HTMLElement>('[data-nav-active="true"]')
  if (!container || !active) {
    indicator.value = { left: 0, width: 0, ready: false }
    return
  }
  const base = container.getBoundingClientRect()
  const rect = active.getBoundingClientRect()
  indicator.value = { left: rect.left - base.left, width: rect.width, ready: true }
}

function onScroll() {
  scrolled.value = window.scrollY > 8
}

watch(
  () => route.path,
  async () => {
    await nextTick()
    measureNav()
  },
)

onMounted(() => {
  measureNav()
  onScroll()
  requestAnimationFrame(measureNav)
  document.fonts?.ready.then(measureNav).catch(() => {})
  window.addEventListener('resize', measureNav, { passive: true })
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', measureNav)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <header
    class="site-header sticky top-0 z-40 overflow-hidden border-b border-line bg-[var(--doc-nav)] backdrop-blur-md"
    :class="scrolled ? 'is-scrolled' : ''"
  >
    <Motion
      class="site-header__inner mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 lg:px-8"
      :initial="{ opacity: 0, y: -48 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ type: 'spring', stiffness: 320, damping: 32 }"
    >
      <Motion
        as="button"
        type="button"
        class="grid h-9 w-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-hover hover:text-ink lg:hidden"
        aria-label="打开目录"
        :while-hover="{ scale: 1.06 }"
        :while-press="{ scale: 0.92 }"
        :transition="{ type: 'spring', stiffness: 520, damping: 28 }"
        @click="openSidebar"
      >
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </Motion>

      <router-link to="/" class="site-header__logo flex items-center gap-2.5">
        <img
          :src="site.logo"
          :alt="site.name"
          class="site-header__logo-mark h-7 w-7"
        />
        <span class="text-[15px] font-semibold tracking-tight text-ink">{{ site.title }}</span>
      </router-link>

      <nav ref="navRef" class="relative ml-4 hidden items-center gap-1 md:flex">
        <Motion
          class="pointer-events-none absolute inset-y-0 left-0 rounded-lg bg-brand-500/10"
          :initial="{ opacity: 0, x: 0, width: 0 }"
          :animate="{ opacity: indicator.ready ? 1 : 0, x: indicator.left, width: indicator.width }"
          :transition="{ type: 'spring', stiffness: 420, damping: 34 }"
        />
        <router-link
          v-for="item in nav"
          :key="item.link"
          :to="item.link"
          :data-nav-active="isActive(item.match) ? 'true' : undefined"
          class="relative z-10 rounded-lg px-3 py-1.5 text-sm transition-colors"
          :class="
            isActive(item.match)
              ? 'font-medium text-brand-600 dark:text-brand-300'
              : 'text-ink-soft hover:bg-hover hover:text-ink'
          "
        >
          {{ item.text }}
        </router-link>
      </nav>

      <div class="ml-auto flex items-center gap-1">
        <Motion
          as="button"
          type="button"
          class="flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm text-ink-mute transition-colors hover:bg-hover hover:text-ink"
          aria-label="搜索文档"
          :while-hover="{ scale: 1.04 }"
          :while-press="{ scale: 0.95 }"
          :transition="{ type: 'spring', stiffness: 520, damping: 28 }"
          @click="openSearch"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4 4" />
          </svg>
          <span class="hidden sm:inline">搜索文档</span>
          <kbd
            class="hidden rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-mute sm:inline"
          >
            ⌘K
          </kbd>
        </Motion>

        <ThemeToggle />

        <Motion
          as="a"
          :href="site.repo"
          target="_blank"
          rel="noreferrer"
          class="grid h-9 w-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-hover hover:text-ink"
          aria-label="GitHub 仓库"
          :while-hover="{ scale: 1.12, rotate: 8 }"
          :while-press="{ scale: 0.92 }"
          :transition="{ type: 'spring', stiffness: 520, damping: 26 }"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 2.5-.34c.85 0 1.71.12 2.5.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.06 10.06 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"
            />
          </svg>
        </Motion>
      </div>
    </Motion>
  </header>

  <n-drawer v-model:show="sidebarOpen" :width="304" placement="left">
    <n-drawer-content :native-scrollbar="false" closable body-content-style="padding: 16px 12px;">
      <SidebarNav @navigate="sidebarOpen = false" />
    </n-drawer-content>
  </n-drawer>
</template>
