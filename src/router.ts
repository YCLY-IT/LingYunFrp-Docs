import type { Component } from 'vue'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { fileToUrl } from '#shared/docs'
import { sectionEntry, sidebars } from '@/config/site'

const modules = import.meta.glob('/docs/**/*.md')

type LazyDocPage = () => Promise<{ default: Component }>

const docRoutes: RouteRecordRaw[] = Object.keys(modules).map((file) => {
  const url = fileToUrl(file)
  return {
    path: url,
    name: `doc:${url}`,
    component: modules[file] as unknown as LazyDocPage,
    meta: { kind: 'doc' },
  }
})

const sectionRedirects: RouteRecordRaw[] = sidebars
  .filter((section) => !docRoutes.some((route) => route.path === section.prefix))
  .map((section) => ({ path: section.prefix, redirect: sectionEntry(section.prefix) }))

const routes: RouteRecordRaw[] = [
  ...docRoutes,
  ...sectionRedirects,
  {
    path: '/develop/tags/:tag',
    name: 'api-tag',
    component: () => import('@/pages/ApiTagPage.vue'),
    meta: { kind: 'api-tag' },
  },
  {
    path: '/develop/operations/:operationId',
    name: 'api-operation',
    component: () => import('@/pages/ApiOperationPage.vue'),
    meta: { kind: 'api-operation' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFound.vue'),
    meta: { kind: 'not-found' },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition

    if (to.hash) {
      const id = decodeURIComponent(to.hash.slice(1))
      const el = document.getElementById(id)
      if (el) return { el, top: 96, behavior: 'smooth' }
    }

    if (to.path === from.path) return false
    return { top: 0 }
  },
})
