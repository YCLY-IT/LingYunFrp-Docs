<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ApiSpec from '@/components/api/ApiSpec.vue'
import { api } from '@/docs/meta'

const route = useRoute()

const tag = computed(() => {
  const raw = String(route.params.tag ?? '')
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
})

const description = computed(() => api.tags.find((entry) => entry.name === tag.value)?.description ?? '')
</script>

<template>
  <h1>{{ tag }} · 接口分组</h1>
  <p v-if="description">{{ description }}</p>
  <ApiSpec :tags="[tag]" hide-info hide-servers />
</template>
