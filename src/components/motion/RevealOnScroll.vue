<script setup lang="ts">
import { computed } from 'vue'
import { motion, useReducedMotion } from 'motion-v'

const props = withDefaults(
  defineProps<{
    /** 渲染的标签，默认 div */
    as?: string
    /** 入场延迟（秒） */
    delay?: number
    /** 入场时的纵向位移 */
    y?: number
    /** 入场时的横向位移 */
    x?: number
    /** 入场时的初始缩放 */
    scale?: number
    /** 入场时的初始模糊半径 */
    blur?: number
    /** 进入视口多少比例后触发（0 ~ 1） */
    amount?: number
    /** 是否只播放一次 */
    once?: boolean
    /** 动画时长（秒） */
    duration?: number
    /** 悬浮时轻微抬升 */
    lift?: boolean
  }>(),
  {
    as: 'div',
    delay: 0,
    y: 24,
    x: 0,
    scale: 1,
    blur: 8,
    amount: 0.15,
    once: true,
    duration: 0.66,
    lift: false,
  },
)

const reduced = useReducedMotion()

// 用 motion 代理按标签名取对应的 motion 组件（内部有缓存，引用稳定）
const MotionTag = computed<any>(() => (motion as any)[props.as] ?? (motion as any).div)
const initial = computed(() =>
  reduced.value
    ? { opacity: 1 }
    : {
        opacity: 0,
        y: props.y,
        x: props.x,
        scale: props.scale,
        filter: `blur(${props.blur}px)`,
      },
)
const shown = { opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)' }
const hover = computed(() => (props.lift && !reduced.value ? { y: -5 } : undefined))
const inViewOptions = computed<any>(() => ({
  amount: props.amount,
  once: props.once,
  margin: '0px 0px -6% 0px',
}))
const transition = computed<any>(() => ({
  duration: props.duration,
  delay: props.delay,
  ease: [0.16, 1, 0.3, 1],
}))
</script>

<template>
  <component
    :is="MotionTag"
    :initial="initial"
    :animate="reduced ? shown : undefined"
    :while-in-view="reduced ? undefined : shown"
    :while-hover="hover"
    :in-view-options="inViewOptions"
    :transition="transition"
  >
    <slot />
  </component>
</template>
