<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NModal } from 'naive-ui'
import { Motion } from 'motion-v'
import { searchDocs, type SearchHit } from '@/composables/useSearch'
import { useUi } from '@/composables/useUi'

const { searchOpen, toggleSearch } = useUi()
const router = useRouter()

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

const keyword = ref('')
const hits = ref<SearchHit[]>([])
const activeIndex = ref(0)
const inputRef = ref<InstanceType<typeof NInput> | null>(null)
let debounce: number | undefined

watch(keyword, (value) => {
  window.clearTimeout(debounce)
  debounce = window.setTimeout(() => {
    hits.value = searchDocs(value)
    activeIndex.value = 0
  }, 90)
})

watch(searchOpen, async (open) => {
  if (!open) return
  keyword.value = ''
  hits.value = []
  activeIndex.value = 0
  await nextTick()
  inputRef.value?.focus()
})

function go(hit: SearchHit) {
  searchOpen.value = false
  router.push(hit.url).catch(() => {})
}

function move(step: number) {
  if (!hits.value.length) return
  const total = hits.value.length
  activeIndex.value = (activeIndex.value + step + total) % total
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const hit = hits.value[activeIndex.value]
    if (hit) go(hit)
  }
}

function onGlobalKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    toggleSearch()
  }
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char] ?? char)
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlight(text: string, keywords: string[]) {
  const safe = escapeHtml(text)
  const tokens = keywords.filter((token) => token.length > 1).sort((a, b) => b.length - a.length)
  if (!tokens.length) return safe

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi')
  return safe.replace(pattern, '<mark class="rounded bg-brand-500/25 px-0.5 text-inherit">$1</mark>')
}

onMounted(() => window.addEventListener('keydown', onGlobalKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onGlobalKeydown))
</script>

<template>
  <n-modal v-model:show="searchOpen" :auto-focus="false">
    <Motion
      class="mx-auto w-[min(680px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-canvas shadow-2xl"
      role="dialog"
      aria-label="搜索文档"
      :initial="{ opacity: 0, y: -18, scale: 0.955, filter: 'blur(12px)' }"
      :animate="{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }"
      :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
      @keydown="onKeydown"
    >
      <div class="flex items-center gap-2 border-b border-line px-4">
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          class="shrink-0 text-ink-mute"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </svg>
        <n-input
          ref="inputRef"
          v-model:value="keyword"
          :bordered="false"
          size="large"
          placeholder="搜索文档…"
          aria-label="搜索文档"
        />
        <kbd class="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-[11px] text-ink-mute">ESC</kbd>
      </div>

      <div class="max-h-[58vh] overflow-y-auto p-2">
        <p v-if="!keyword.trim()" class="px-3 py-8 text-center text-sm text-ink-mute">
          输入关键词开始搜索，支持中英文
        </p>
        <p v-else-if="!hits.length" class="px-3 py-8 text-center text-sm text-ink-mute">
          没有找到与「{{ keyword }}」相关的内容
        </p>

        <ul v-else class="space-y-0.5">
          <Motion
            v-for="(hit, index) in hits"
            :key="`${hit.url}-${index}`"
            as="li"
            :initial="{ opacity: 0, y: 10 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.34, delay: Math.min(index, 9) * 0.035, ease: easeOut }"
          >
            <Motion
              as="button"
              type="button"
              class="relative w-full overflow-hidden rounded-lg px-3 py-2 text-left transition-colors"
              :class="index === activeIndex ? '' : 'hover:bg-hover'"
              :while-press="{ scale: 0.985 }"
              :transition="{ type: 'spring', stiffness: 520, damping: 30 }"
              @click="go(hit)"
              @mousemove="activeIndex = index"
            >
              <Motion
                v-if="index === activeIndex"
                class="pointer-events-none absolute inset-0 rounded-lg bg-brand-500/10"
                :initial="{ opacity: 0, scale: 0.97 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{ type: 'spring', stiffness: 560, damping: 34 }"
              />
              <span class="relative flex flex-wrap items-center gap-x-2 text-[13px]">
                <span class="font-medium text-ink">{{ hit.title }}</span>
                <span v-if="hit.heading" class="text-ink-mute">› {{ hit.heading }}</span>
              </span>
              <span
                v-if="hit.snippet"
                class="relative mt-0.5 line-clamp-2 block text-xs leading-relaxed text-ink-soft"
                v-html="highlight(hit.snippet, hit.keywords)"
              />
            </Motion>
          </Motion>
        </ul>
      </div>

      <div class="flex items-center gap-3 border-t border-line px-4 py-2 text-[11px] text-ink-mute">
        <span>↑↓ 选择</span>
        <span>↵ 打开</span>
        <span>ESC 关闭</span>
        <span class="ml-auto">{{ hits.length }} 条结果</span>
      </div>
    </Motion>
  </n-modal>
</template>
