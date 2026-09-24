<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(defineProps<{ code: string; lang?: string }>(), { lang: 'text' })

const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 1600)
  } catch {
    // 忽略
  }
}
</script>

<template>
  <div class="doc-code">
    <div class="doc-code__bar">
      <span class="doc-code__lang">{{ lang }}</span>
      <button type="button" class="doc-code__copy" :class="{ 'is-copied': copied }" @click="copy">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <pre class="shiki"><code>{{ code }}</code></pre>
  </div>
</template>
