<script setup lang="ts">
import { site } from '@/config/site'
</script>

<template>
  <footer class="mt-auto border-t border-line bg-surface">
    <div
      class="mx-auto flex w-full max-w-[1440px] flex-col gap-2 px-4 py-6 text-sm text-ink-mute sm:flex-row sm:items-center sm:justify-between lg:px-8"
    >
      <p>{{ site.footer.message }}</p>
      <p>{{ site.footer.copyright }}</p>
    </div>
  </footer>
</template>
