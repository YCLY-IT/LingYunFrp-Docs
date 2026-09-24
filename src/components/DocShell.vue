<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { AnimatePresence, Motion } from 'motion-v'
import { site } from '@/config/site'
import type { PageView } from '@/docs/meta'
import PrevNext from './PrevNext.vue'
import SidebarNav from './SidebarNav.vue'
import TocAside from './TocAside.vue'

const props = defineProps<{ page: PageView }>()

const route = useRoute()
const showToTop = ref(false)

const editLink = computed(() => {
  const file = props.page.file
  if (!file) return ''
  return site.editLinkPattern.replace(':path', file.replace(/^\/docs\//, ''))
})

const updatedAt = computed(() => {
  if (!props.page.lastUpdated) return ''
  return new Date(props.page.lastUpdated).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
})

const showAside = computed(() => props.page.aside && props.page.headings.length > 0)

async function onContentClick(event: MouseEvent) {
  const target = event.target as Element | null
  const button = target?.closest<HTMLElement>('[data-code-copy]')
  if (!button) return

  const code = button.closest('.doc-code')?.querySelector('pre code')
  if (!code) return

  try {
    await navigator.clipboard.writeText(code.textContent ?? '')
    const label = button.querySelector('.doc-code__copy-text')
    button.classList.add('is-copied')
    if (label) label.textContent = '已复制'
    window.setTimeout(() => {
      button.classList.remove('is-copied')
      if (label) label.textContent = '复制'
    }, 1600)
  } catch {
    // 忽略
  }
}

function onScroll() {
  showToTop.value = window.scrollY > 600
}

function backToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1440px] flex-1 items-start gap-8 px-4 lg:px-8">
    <aside
      class="sticky top-16 hidden max-h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto py-8 pr-1 lg:block"
    >
      <SidebarNav />
    </aside>

    <main class="min-w-0 flex-1">
      <div class="mx-auto w-full max-w-[46rem] py-10">
        <div class="doc-content" @click="onContentClick">
          <router-view v-slot="{ Component }">
            <transition name="route-fade">
              <div :key="route.path" class="doc-page">
                <component :is="Component" />
              </div>
            </transition>
          </router-view>
        </div>

        <div
          v-if="updatedAt || editLink"
          class="mt-10 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-mute"
        >
          <span v-if="updatedAt">最后更新于 {{ updatedAt }}</span>
          <a
            v-if="editLink"
            :href="editLink"
            target="_blank"
            rel="noreferrer"
            class="transition-colors hover:text-brand-600 dark:hover:text-brand-300"
          >
            在 GitHub 上编辑此页
          </a>
        </div>

        <PrevNext />
      </div>
    </main>

    <aside
      v-if="showAside"
      class="sticky top-16 hidden max-h-[calc(100vh-4rem)] w-56 shrink-0 overflow-y-auto py-10 pl-1 xl:block"
    >
      <TocAside :headings="page.headings" :outline="page.outline" />
    </aside>

    <Teleport to="body">
      <AnimatePresence>
        <Motion
          v-if="showToTop"
          key="back-to-top"
          as="button"
          type="button"
          class="fixed bottom-6 right-6 z-30 grid h-10 w-10 place-items-center rounded-full border border-line bg-canvas text-ink-soft shadow-lg transition-colors hover:text-brand-600"
          aria-label="回到顶部"
          :initial="{ opacity: 0, scale: 0.5, y: 18, filter: 'blur(6px)' }"
          :animate="{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }"
          :exit="{ opacity: 0, scale: 0.5, y: 18, filter: 'blur(6px)' }"
          :while-hover="{ scale: 1.1, y: -3 }"
          :while-press="{ scale: 0.9 }"
          :transition="{ type: 'spring', stiffness: 540, damping: 30 }"
          @click="backToTop"
        >
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 19V5M6 11l6-6 6 6" />
          </svg>
        </Motion>
      </AnimatePresence>
    </Teleport>
  </div>
</template>
