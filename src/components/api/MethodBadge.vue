<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ method: string; muted?: boolean }>(), { muted: false })

const STYLES: Record<string, string> = {
  get: 'text-emerald-600 bg-emerald-500/12 dark:text-emerald-400',
  post: 'text-blue-600 bg-blue-500/12 dark:text-blue-400',
  put: 'text-amber-600 bg-amber-500/12 dark:text-amber-400',
  patch: 'text-violet-600 bg-violet-500/12 dark:text-violet-400',
  delete: 'text-red-600 bg-red-500/12 dark:text-red-400',
  head: 'text-slate-600 bg-slate-500/12 dark:text-slate-300',
  options: 'text-cyan-600 bg-cyan-500/12 dark:text-cyan-400',
  trace: 'text-cyan-600 bg-cyan-500/12 dark:text-cyan-400',
}

const classes = computed(
  () => STYLES[props.method.toLowerCase()] ?? 'text-slate-600 bg-slate-500/12 dark:text-slate-300',
)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide"
    :class="[classes, muted ? 'opacity-70' : '']"
  >
    {{ method }}
  </span>
</template>
