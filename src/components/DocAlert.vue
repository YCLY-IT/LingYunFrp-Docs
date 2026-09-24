<script setup lang="ts">
import { NAlert } from 'naive-ui'

withDefaults(
  defineProps<{
    type?: 'info' | 'success' | 'warning' | 'error'
    title?: string
  }>(),
  { type: 'info', title: '' },
)
</script>

<template>
  <n-alert class="doc-alert" :type="type" :title="title || undefined" :bordered="false">
    <slot />
  </n-alert>
</template>
