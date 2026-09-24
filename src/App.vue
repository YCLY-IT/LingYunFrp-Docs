<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  darkTheme,
  dateZhCN,
  zhCN,
} from 'naive-ui'
import { MotionConfig } from 'motion-v'
import { resolveRoutePage } from '@/docs/meta'
import { useTheme } from '@/composables/useTheme'
import { themeOverrides } from '@/theme'
import { site } from '@/config/site'
import DocShell from '@/components/DocShell.vue'
import HomeView from '@/components/HomeView.vue'
import RouteProgress from '@/components/RouteProgress.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import SiteHeader from '@/components/SiteHeader.vue'

const route = useRoute()
const { isDark } = useTheme()

const page = computed(() => resolveRoutePage(route))
const isHome = computed(() => page.value.layout === 'home')

watch(
  () => page.value,
  (current) => {
    const title = current.title?.trim()
    const useSiteTitle = current.layout === 'home' || !title || title === site.name
    document.title = useSiteTitle ? site.title : `${title} · ${site.title}`
  },
  { immediate: true },
)
</script>

<template>
  <n-config-provider
    class="min-h-screen"
    :theme="isDark ? darkTheme : null"
    :theme-overrides="themeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <n-message-provider>
      <n-dialog-provider>
        <MotionConfig reduced-motion="user">
          <RouteProgress />

          <div class="flex min-h-screen flex-col">
            <SiteHeader :page="page" />

            <div class="flex flex-1 flex-col">
              <Transition name="page-swap" mode="out-in">
                <HomeView v-if="isHome" :page="page" />
                <DocShell v-else :page="page" />
              </Transition>
            </div>

            <SiteFooter />
          </div>

          <SearchDialog />
        </MotionConfig>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
