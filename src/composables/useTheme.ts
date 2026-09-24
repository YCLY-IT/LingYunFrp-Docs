import { computed, readonly, ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'lyfrp-theme'

function initialMode(): ThemeMode {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

const mode = ref<ThemeMode>(initialMode())
let followSystem = typeof localStorage !== 'undefined' && !localStorage.getItem(STORAGE_KEY)

function apply(next: ThemeMode, persist: boolean) {
  mode.value = next
  document.documentElement.classList.toggle('dark', next === 'dark')
  document.documentElement.style.colorScheme = next

  if (persist) {
    localStorage.setItem(STORAGE_KEY, next)
    followSystem = false
  }
}

if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (followSystem) apply(event.matches ? 'dark' : 'light', false)
  })
}

export function useTheme() {
  const isDark = computed(() => mode.value === 'dark')

  const toggle = () => apply(mode.value === 'dark' ? 'light' : 'dark', true)
  const set = (next: ThemeMode) => apply(next, true)

  return { mode: readonly(mode), isDark, toggle, set }
}
