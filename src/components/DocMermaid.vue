<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { renderMermaid } from '@/composables/useMermaid'
import { useTheme } from '@/composables/useTheme'

const props = defineProps<{ code: string }>()

const { isDark } = useTheme()

const html = ref('')
const error = ref('')
const loading = ref(false)

let token = 0

async function draw() {
  const source = props.code.trim()
  const current = (token += 1)

  if (!source) {
    html.value = ''
    error.value = ''
    loading.value = false
    return
  }

  loading.value = true
  error.value = ''

  try {
    const svg = await renderMermaid(source, isDark.value)
    if (current !== token) return
    html.value = svg
  } catch (cause) {
    if (current !== token) return
    html.value = ''
    error.value = cause instanceof Error ? cause.message : String(cause)
  } finally {
    if (current === token) loading.value = false
  }
}

// 主题切换后 mermaid 的配色写在 svg 里，必须重绘
watch([() => props.code, isDark], draw, { immediate: true })

onBeforeUnmount(() => {
  token += 1
})
</script>

<template>
  <div class="doc-mermaid">
    <div v-if="error" class="doc-mermaid__error">
      <p>Mermaid 图表渲染失败：{{ error }}</p>
      <pre><code>{{ code.trim() }}</code></pre>
    </div>
    <p v-else-if="loading && !html" class="doc-mermaid__loading">图表渲染中…</p>
    <div v-show="!!html" class="doc-mermaid__canvas" v-html="html" />
  </div>
</template>
