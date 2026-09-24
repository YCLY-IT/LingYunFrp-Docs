<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const visible = ref(false)
const progress = ref(0)

let ticker: number | undefined
let hider: number | undefined

function start() {
  window.clearTimeout(hider)
  window.clearInterval(ticker)
  visible.value = true
  progress.value = 8
  ticker = window.setInterval(() => {
    const remain = 100 - progress.value
    // 越接近 100 走得越慢，形成「正在加载」的呼吸感
    progress.value = Math.min(94, progress.value + Math.max(0.5, remain * 0.11))
  }, 110)
}

function finish() {
  window.clearInterval(ticker)
  progress.value = 100
  hider = window.setTimeout(() => {
    visible.value = false
    window.setTimeout(() => (progress.value = 0), 320)
  }, 220)
}

let removeBefore: (() => void) | undefined
let removeAfter: (() => void) | undefined

onMounted(() => {
  removeBefore = router.beforeEach(() => {
    start()
    return true
  }) as unknown as (() => void) | undefined
  removeAfter = router.afterEach(() => finish()) as unknown as (() => void) | undefined
})

onBeforeUnmount(() => {
  removeBefore?.()
  removeAfter?.()
  window.clearInterval(ticker)
  window.clearTimeout(hider)
})
</script>

<template>
  <Transition name="route-progress">
    <div v-if="visible" class="route-progress" aria-hidden="true">
      <div class="route-progress__bar" :style="{ transform: `scaleX(${progress / 100})` }" />
    </div>
  </Transition>
</template>
