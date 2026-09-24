<script setup lang="ts">
import { NButton } from 'naive-ui'
</script>

<template>
  <div class="flex flex-col items-start gap-4 py-10">
    <p class="text-sm font-semibold tracking-wide text-brand-600 dark:text-brand-300">404</p>
    <h1 class="!mt-0 text-3xl font-bold tracking-tight">页面不存在</h1>
    <p class="text-ink-soft">你访问的页面可能已被移动或删除，可以回到首页重新查找。</p>
    <n-button type="primary" @click="$router.push('/')">回到首页</n-button>
  </div>
</template>
