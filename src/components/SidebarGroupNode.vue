<script setup lang="ts">
import { computed, inject } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import type { SidebarGroup } from '@/config/site'
import { sidebarNavKey } from './SidebarNav.vue'

const props = defineProps<{
  group: SidebarGroup
  nodeKey: string
  depth: number
  index: number
}>()

const emit = defineEmits<{ navigate: [] }>()

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const navApi = inject(sidebarNavKey)!

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

const open = computed(() => navApi.isOpen(props.group, props.nodeKey))
const hasChildren = computed(() => Boolean(props.group.children?.length))

const headerClass = computed(() =>
  props.depth === 0
    ? 'text-[13px] font-semibold tracking-wide text-ink'
    : 'text-[13px] font-medium text-ink-soft',
)
</script>

<template>
  <section>
    <Motion
      as="button"
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 transition-colors hover:bg-hover"
      :class="headerClass"
      :aria-expanded="open"
      :initial="{ opacity: 0, x: -10 }"
      :animate="{ opacity: 1, x: 0 }"
      :transition="{ duration: 0.42, delay: Math.min(index, 10) * 0.05, ease: easeOut }"
      @click="navApi.toggle(group, nodeKey)"
    >
      <span>{{ group.text }}</span>
      <Motion
        as="span"
        class="grid shrink-0 place-items-center text-ink-mute"
        :animate="{ rotate: open ? 90 : 0 }"
        :transition="{ type: 'spring', stiffness: 420, damping: 26 }"
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Motion>
    </Motion>

    <AnimatePresence :initial="false">
      <Motion
        v-if="open"
        :key="`body-${nodeKey}`"
        class="ml-2 mt-1 overflow-hidden border-l border-line pl-2"
        :initial="{ height: 0, opacity: 0 }"
        :animate="{ height: 'auto', opacity: 1 }"
        :exit="{ height: 0, opacity: 0 }"
        :transition="{ duration: 0.34, ease: easeOut }"
      >
        <ul v-if="group.items?.length" class="space-y-0.5">
          <Motion
            v-for="(item, itemIndex) in group.items"
            :key="item.link"
            as="li"
            :initial="{ opacity: 0, x: -12 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.38, delay: 0.03 + Math.min(itemIndex, 14) * 0.028, ease: easeOut }"
          >
            <router-link
              :to="item.link"
              :data-sidebar-active="navApi.isActive(item.link) ? 'true' : undefined"
              class="relative block rounded-md px-2.5 py-1.5 text-[13.5px] leading-snug transition-colors"
              :class="
                navApi.isActive(item.link)
                  ? 'font-medium text-brand-600 dark:text-brand-300'
                  : 'text-ink-soft hover:bg-hover hover:text-ink'
              "
              @click="emit('navigate')"
            >
              <Motion
                v-if="navApi.isActive(item.link)"
                class="pointer-events-none absolute inset-0 rounded-md bg-brand-500/10"
                :initial="{ opacity: 0, scale: 0.92 }"
                :animate="{ opacity: 1, scale: 1 }"
                :transition="{ type: 'spring', stiffness: 460, damping: 30 }"
              />
              <span class="relative">{{ item.text }}</span>
            </router-link>
          </Motion>
        </ul>

        <div v-if="hasChildren" class="mt-2 space-y-3 pb-1">
          <SidebarGroupNode
            v-for="(child, childIndex) in group.children"
            :key="child.text"
            :group="child"
            :node-key="`${nodeKey}::${child.text}`"
            :depth="depth + 1"
            :index="childIndex"
            @navigate="emit('navigate')"
          />
        </div>
      </Motion>
    </AnimatePresence>
  </section>
</template>
