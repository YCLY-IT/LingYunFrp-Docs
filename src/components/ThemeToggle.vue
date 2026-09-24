<script setup lang="ts">
import { AnimatePresence, Motion, useReducedMotion } from 'motion-v'
import { useTheme } from '@/composables/useTheme'

const { isDark, toggle } = useTheme()
const reduced = useReducedMotion()

const iconMotion = {
  initial: { opacity: 0, rotate: -110, scale: 0.5 },
  animate: { opacity: 1, rotate: 0, scale: 1 },
  exit: { opacity: 0, rotate: 110, scale: 0.5 },
  transition: { type: 'spring', stiffness: 420, damping: 26 },
}

/** 主题切换时用 View Transitions 做圆形扩散过渡，不支持则直接切换 */
function onToggle(event: MouseEvent) {
  if (reduced.value || typeof document.startViewTransition !== 'function') {
    toggle()
    return
  }

  const x = event.clientX
  const y = event.clientY
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  const transition = document.startViewTransition(() => toggle())
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 640,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        } as unknown as KeyframeAnimationOptions,
      )
    })
    .catch(() => {})
}
</script>

<template>
  <Motion
    as="button"
    type="button"
    class="grid h-9 w-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-hover hover:text-ink"
    :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
    :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
    :while-hover="{ scale: 1.08, rotate: 6 }"
    :while-press="{ scale: 0.88, rotate: -6 }"
    :transition="{ type: 'spring', stiffness: 520, damping: 24 }"
    @click="onToggle"
  >
    <AnimatePresence mode="wait" :initial="false">
      <Motion
        v-if="isDark"
        key="sun"
        as="span"
        class="grid place-items-center"
        v-bind="iconMotion"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
        </svg>
      </Motion>

      <Motion
        v-else
        key="moon"
        as="span"
        class="grid place-items-center"
        v-bind="iconMotion"
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
        </svg>
      </Motion>
    </AnimatePresence>
  </Motion>
</template>
