<script setup lang="ts">
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import { Motion } from 'motion-v'

const props = withDefaults(defineProps<{ src: string; alt?: string; title?: string }>(), {
  alt: '',
  title: '',
})

const preview = ref(false)
const zoomed = ref(false)

const caption = computed(() => props.title || props.alt)

function openPreview() {
  zoomed.value = false
  preview.value = true
}
</script>

<template>
  <figure class="doc-image">
    <button
      type="button"
      class="doc-image__trigger"
      :aria-label="`查看大图：${alt || '文档配图'}`"
      @click="openPreview"
    >
      <img :src="src" :alt="alt" loading="lazy" decoding="async" />
    </button>

    <figcaption v-if="caption" class="doc-image__caption">{{ caption }}</figcaption>

    <!-- 遮罩点击、ESC 关闭由 NModal 提供 -->
    <n-modal v-model:show="preview" :auto-focus="false" :trap-focus="false">
      <Motion
        class="doc-lightbox"
        :initial="{ opacity: 0, scale: 0.94 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
      >
        <button
          type="button"
          class="doc-lightbox__close"
          aria-label="关闭"
          @click="preview = false"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <img
          :src="src"
          :alt="alt"
          class="doc-lightbox__img"
          :class="{ 'is-zoomed': zoomed }"
          @click="zoomed = !zoomed"
        />

        <p v-if="caption" class="doc-lightbox__caption">
          {{ caption }}
          <span class="doc-lightbox__hint">{{ zoomed ? '再次点击还原' : '点击图片放大 · ESC 关闭' }}</span>
        </p>
      </Motion>
    </n-modal>
  </figure>
</template>
