<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { animate, useInView, useReducedMotion } from 'motion-v'
import { site } from '@/config/site'
import RevealOnScroll from './motion/RevealOnScroll.vue'

interface Stats {
  totalUsers: number
  totalNodes: number
  activeProxies: number
}

const stats = ref<Stats | null>(null)
const failed = ref(false)

const rootRef = ref<HTMLElement | null>(null)
const inView = useInView(rootRef, { once: true, amount: 0.35 })
const reduced = useReducedMotion()

const labels: Record<keyof Stats, string> = {
  totalUsers: '注册用户',
  totalNodes: '接入节点',
  activeProxies: '活跃隧道',
}

const displayed = ref<Record<keyof Stats, string>>({
  totalUsers: '—',
  totalNodes: '—',
  activeProxies: '—',
})

let controls: Array<{ stop: () => void }> = []

function format(value: number) {
  return Math.round(value).toLocaleString('zh-CN')
}

function stopCounters() {
  controls.forEach((control) => control.stop())
  controls = []
}

function runCountUp() {
  const source = stats.value
  if (!source) return
  stopCounters()

  ;(Object.keys(labels) as Array<keyof Stats>).forEach((key, index) => {
    const target = Number(source[key] ?? 0)
    if (reduced.value) {
      displayed.value[key] = format(target)
      return
    }
    const control = animate(0, target, {
      duration: 1.25,
      delay: index * 0.12,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value: number) => {
        displayed.value[key] = format(value)
      },
      onComplete: () => {
        displayed.value[key] = format(target)
      },
    })
    controls.push(control)
  })
}

watch(
  [stats, inView],
  () => {
    if (stats.value && inView.value) runCountUp()
  },
  { immediate: true },
)

onBeforeUnmount(stopCounters)

async function load() {
  try {
    const response = await fetch(site.statsEndpoint)
    const result = await response.json()
    if (result?.code === 0 && result.data) stats.value = result.data as Stats
    else failed.value = true
  } catch {
    failed.value = true
  }
}

onMounted(load)
</script>

<template>
  <div ref="rootRef" class="my-10 grid gap-4 sm:grid-cols-3">
    <RevealOnScroll
      v-for="(label, key, index) in labels"
      :key="key"
      lift
      :delay="index * 0.08"
      :y="26"
      class="rounded-xl border border-line bg-surface px-6 py-7 text-center transition-colors hover:border-brand-300"
    >
      <p class="text-3xl font-bold tracking-tight tabular-nums text-brand-600 dark:text-brand-300">
        {{ failed ? '—' : displayed[key] }}
      </p>
      <p class="mt-1.5 text-sm text-ink-soft">{{ label }}</p>
    </RevealOnScroll>
  </div>
</template>
