<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ApiOperation from '@/components/api/ApiOperation.vue'
import { tagUrl } from '@/docs/meta'

const route = useRoute()
const operationId = computed(() => String(route.params.operationId ?? ''))
const tag = computed(() => decodeURIComponent(String(route.query.tag ?? '')))
</script>

<template>
  <nav class="mb-4 flex items-center gap-1.5 text-[13px] text-ink-mute">
    <router-link to="/develop/endpoints" class="text-brand-600 dark:text-brand-300">接口列表</router-link>
    <template v-if="tag">
      <span>/</span>
      <router-link :to="tagUrl(tag)" class="text-brand-600 dark:text-brand-300">{{ tag }}</router-link>
    </template>
  </nav>

  <ApiOperation :operation-id="operationId" />
</template>
