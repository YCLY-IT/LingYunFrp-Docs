import { ref } from 'vue'

const sidebarOpen = ref(false)
const searchOpen = ref(false)

export function useUi() {
  return {
    sidebarOpen,
    searchOpen,
    openSidebar: () => (sidebarOpen.value = true),
    closeSidebar: () => (sidebarOpen.value = false),
    openSearch: () => (searchOpen.value = true),
    closeSearch: () => (searchOpen.value = false),
    toggleSearch: () => (searchOpen.value = !searchOpen.value),
  }
}
