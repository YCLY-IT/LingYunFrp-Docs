<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Motion } from 'motion-v'
import { site } from '@/config/site'
import type { PageView } from '@/docs/meta'
import RevealOnScroll from './motion/RevealOnScroll.vue'

const props = defineProps<{ page: PageView }>()
const route = useRoute()

interface HeroAction {
  theme?: string
  text: string
  link: string
}

interface Feature {
  title: string
  details: string
  icon?: string
}

const hero = computed(() => (props.page.frontmatter?.hero ?? {}) as Record<string, any>)
const features = computed<Feature[]>(() => (props.page.frontmatter?.features ?? []) as Feature[])
const actions = computed<HeroAction[]>(() => (hero.value.actions ?? []) as HeroAction[])
const logo = computed(() => hero.value.image?.src ?? site.logo)

const easeOut: [number, number, number, number] = [0.16, 1, 0.3, 1]

function riseIn(delay: number) {
  return {
    initial: { opacity: 0, y: 26, filter: 'blur(10px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    transition: { duration: 0.72, delay, ease: easeOut },
  }
}

/** 卡片光晕跟随指针 */
function trackPointer(event: PointerEvent) {
  const card = (event.target as Element | null)?.closest<HTMLElement>('.feature-card')
  if (!card) return
  const rect = card.getBoundingClientRect()
  card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
  card.style.setProperty('--my', `${event.clientY - rect.top}px`)
}
</script>

<template>
  <div class="flex-1">
    <section class="relative overflow-hidden border-b border-line">
      <!-- 背景光晕 -->
      <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          class="hero-aurora absolute -top-40 left-[calc(50%-21rem)] h-[26rem] w-[42rem] rounded-full bg-brand-500/25 blur-[110px]"
        />
        <div
          class="hero-aurora hero-aurora--slow absolute -top-24 left-[12%] h-72 w-72 rounded-full bg-sky-400/20 blur-[100px]"
        />
        <div
          class="hero-aurora absolute top-10 right-[8%] h-64 w-64 rounded-full bg-fuchsia-400/20 blur-[100px]"
        />
        <div class="hero-grid absolute inset-0" />
      </div>

      <div class="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
        <Motion
          :initial="{ opacity: 0, scale: 0.7, rotate: -18, filter: 'blur(12px)' }"
          :animate="{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }"
          :transition="{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }"
        >
          <Motion
            :animate="{ y: [0, -9, 0] }"
            :transition="{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }"
          >
            <img
              :src="logo"
              :alt="hero.name ?? site.name"
              width="96"
              height="96"
              class="hero-logo h-24 w-24"
            />
          </Motion>
        </Motion>

        <Motion
          as="h1"
          class="mt-6 text-4xl font-bold tracking-tight text-ink sm:text-5xl"
          v-bind="riseIn(0.14)"
        >
          {{ hero.name ?? site.name }}
          <span v-if="hero.text" class="brand-sheen">{{ hero.text }}</span>
        </Motion>

        <Motion
          v-if="hero.tagline"
          as="p"
          class="mt-4 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg"
          v-bind="riseIn(0.24)"
        >
          {{ hero.tagline }}
        </Motion>

        <div v-if="actions.length" class="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Motion
            v-for="(action, index) in actions"
            :key="action.link"
            :initial="{ opacity: 0, y: 18, scale: 0.94 }"
            :animate="{ opacity: 1, y: 0, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 420, damping: 26, delay: 0.34 + index * 0.08 }"
            :while-hover="{ scale: 1.045, y: -2 }"
            :while-press="{ scale: 0.96 }"
          >
            <router-link
              :to="action.link"
              class="shine inline-block rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
              :class="
                action.theme === 'brand'
                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                  : 'border border-line bg-surface text-ink hover:border-brand-300 hover:text-brand-600 dark:hover:text-brand-300'
              "
            >
              {{ action.text }}
            </router-link>
          </Motion>
        </div>
      </div>
    </section>

    <section
      v-if="features.length"
      class="mx-auto w-full max-w-5xl px-6 py-14"
      @pointermove="trackPointer"
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RevealOnScroll
          v-for="(feature, index) in features"
          :key="feature.title"
          lift
          :delay="(index % 3) * 0.09"
          :y="30"
          :duration="0.7"
          class="feature-card rounded-xl border border-line bg-surface p-5 transition-colors hover:border-brand-300"
        >
          <div
            v-if="feature.icon"
            class="feature-card__icon grid h-9 w-9 place-items-center rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-300"
            v-html="feature.icon"
          />
          <h3 class="mt-3 text-[15px] font-semibold text-ink">{{ feature.title }}</h3>
          <p class="mt-1 text-sm leading-relaxed text-ink-soft">{{ feature.details }}</p>
        </RevealOnScroll>
      </div>
    </section>

    <section class="mx-auto w-full max-w-3xl px-6 pb-16">
      <div class="doc-content">
        <router-view v-slot="{ Component }">
          <transition name="route-fade">
            <div :key="route.path" class="doc-page">
              <component :is="Component" />
            </div>
          </transition>
        </router-view>
      </div>
    </section>
  </div>
</template>
