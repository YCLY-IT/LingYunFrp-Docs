<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import type { DocHeading } from '#shared/docs'

const props = withDefaults(
  defineProps<{
    headings: DocHeading[]
    outline?: [number, number]
  }>(),
  { outline: () => [2, 3] as [number, number] },
)

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

const activeSlug = ref('')
const listRef = ref<HTMLElement | null>(null)
const bar = ref({ y: 0, height: 0, ready: false })
let ticking = false

const items = computed(() => {
  const [min, max] = props.outline
  return props.headings.filter((heading) => heading.level >= min && heading.level <= max)
})

const minLevel = computed(() => items.value[0]?.level ?? 2)

function measureBar() {
  const list = listRef.value
  const active = list?.querySelector<HTMLElement>('[data-toc-active="true"]')
  if (!list || !active) {
    bar.value = { y: bar.value.y, height: bar.value.height, ready: false }
    return
  }
  const base = list.getBoundingClientRect()
  const rect = active.getBoundingClientRect()
  bar.value = { y: rect.top - base.top, height: rect.height, ready: true }
}

function update() {
  ticking = false
  const list = items.value
  if (!list.length) {
    activeSlug.value = ''
    return
  }

  const offset = 140
  let current = ''
  for (const heading of list) {
    const el = document.getElementById(heading.slug)
    if (!el) continue
    if (el.getBoundingClientRect().top <= offset) current = heading.slug
    else break
  }

  const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  if (atBottom) current = list[list.length - 1].slug

  activeSlug.value = current
}

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(update)
}

function onResize() {
  update()
  measureBar()
}

onMounted(() => {
  update()
  nextTick(measureBar)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
})

watch(items, () => requestAnimationFrame(update), { deep: false })

watch(activeSlug, async () => {
  await nextTick()
  measureBar()
})

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <nav v-if="items.length" class="text-[13px]" aria-label="本页目录">
    <p class="mb-3 px-2 text-[12px] font-semibold tracking-wide text-ink-mute">本页目录</p>
    <ul ref="listRef" class="relative space-y-0.5 border-l border-line">
      <Motion
        class="pointer-events-none absolute -left-px top-0 w-px rounded-full bg-brand-500"
        :initial="{ opacity: 0, y: 0, height: 0 }"
        :animate="{ opacity: bar.ready ? 1 : 0, y: bar.y, height: bar.height }"
        :transition="{ type: 'spring', stiffness: 480, damping: 38 }"
      />
      <Motion
        v-for="(heading, index) in items"
        :key="heading.slug"
        as="li"
        :initial="{ opacity: 0, x: 10 }"
        :animate="{ opacity: 1, x: 0 }"
        :transition="{ duration: 0.4, delay: Math.min(index, 12) * 0.035, ease: easeOut }"
      >
        <a
          :href="`#${heading.slug}`"
          :data-toc-active="activeSlug === heading.slug ? 'true' : undefined"
          class="block border-l -ml-px border-transparent py-1 pr-2 leading-snug transition-colors"
          :class="
            activeSlug === heading.slug
              ? 'font-medium text-brand-600 dark:text-brand-300'
              : 'text-ink-soft hover:text-ink'
          "
          :style="{ paddingLeft: `${10 + (heading.level - minLevel) * 12}px` }"
        >
          {{ heading.title }}
        </a>
      </Motion>
    </ul>
    <Motion
      as="button"
      type="button"
      class="mt-4 flex items-center gap-1 px-2 text-[12px] text-ink-mute transition-colors hover:text-ink"
      :while-hover="{ x: 2 }"
      :while-press="{ scale: 0.96 }"
      :transition="{ type: 'spring', stiffness: 520, damping: 30 }"
      @click="scrollToTop"
    >
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
      回到顶部
    </Motion>
  </nav>
</template>
