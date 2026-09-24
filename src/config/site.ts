import { api } from '@/docs/meta'

export interface SidebarLink {
  text: string
  link: string
}

export interface SidebarGroup {
  text: string
  collapsed?: boolean
  items: SidebarLink[]
}

export interface SidebarConfig {
  prefix: string
  groups: SidebarGroup[]
}

export interface NavItem {
  text: string
  link: string
  match: RegExp
}

export const site = {
  title: 'LingYunFrp Docs',
  name: 'LingYunFrp',
  tagline: '内网穿透',
  description: 'LingYunFrp 使用文档：创建隧道、配置 frpc、把本地服务发布到公网。',
  logo: '/logo.svg',
  repo: 'https://github.com/YCLY-IT/LingYunFrp-Docs',
  editLinkPattern: 'https://github.com/YCLY-IT/LingYunFrp-Docs/edit/main/:path',
  footer: {
    message: '基于 Vue 3 · Naive UI · Tailwind CSS v4 文档框架构建，内容遵循 MIT 协议发布。',
    copyright: 'Copyright © 2026-present LingYunFrp · 凌云 FRP',
  },
  statsEndpoint: '/public/stats',
}

const apiGroups: SidebarGroup[] = api.tags
  .filter((tag) => tag.count > 0)
  .map((tag) => ({
    text: tag.name,
    collapsed: true,
    items: api.operations
      .filter((operation) => operation.tag === tag.name)
      .map((operation) => ({
        text: operation.summary,
        link: `/develop/operations/${operation.operationId}`,
      })),
  }))

export const sidebars: SidebarConfig[] = [
  {
    prefix: '/docs/',
    groups: [
      {
        text: '入门',
        items: [
          { text: '了解指南', link: '/docs/' },
          { text: '快速开始', link: '/docs/quick-start' },
        ],
      },
      {
        text: '配置参考',
        items: [
          { text: 'frpc 配置', link: '/docs/configuration#frpc-配置' },
          { text: '隧道类型', link: '/docs/configuration#隧道类型' },
          { text: '带宽单位换算', link: '/docs/configuration#带宽单位换算' },
        ],
      },
    ],
  },
  {
    prefix: '/develop/',
    groups: [
      {
        text: '开始使用',
        items: [
          { text: 'API 概览', link: '/develop/api' },
          { text: '接口列表（单页）', link: '/develop/endpoints' },
        ],
      },
      {
        text: '通用约定',
        collapsed: true,
        items: [
          { text: '鉴权', link: '/develop/api#鉴权' },
          { text: '错误处理', link: '/develop/api#错误处理' },
          { text: '限频', link: '/develop/api#限频' },
        ],
      },
      ...apiGroups,
    ],
  },
  {
    prefix: '/terms/',
    groups: [
      {
        text: '条款与服务',
        items: [
          { text: '隐私政策', link: '/terms/privacy' },
          { text: '服务条款', link: '/terms/terms' },
        ],
      },
    ],
  },
]

export function sectionEntry(prefix: string): string {
  const section = sidebars.find((item) => item.prefix === prefix)
  const link = section?.groups[0]?.items[0]?.link
  return link ? link.split('#')[0] : prefix
}

export const nav: NavItem[] = [
  { text: '参考文档', link: sectionEntry('/docs/'), match: /^\/docs\// },
  { text: 'API 文档', link: sectionEntry('/develop/'), match: /^\/develop\// },
  { text: '条款与服务', link: sectionEntry('/terms/'), match: /^\/terms\// },
]

// 取匹配到的最长前缀
export function resolveSidebar(path: string): SidebarConfig | undefined {
  let matched: SidebarConfig | undefined
  for (const sidebar of sidebars) {
    if (path.startsWith(sidebar.prefix) && (!matched || sidebar.prefix.length > matched.prefix.length)) {
      matched = sidebar
    }
  }
  return matched
}

export function orderedPages(path: string): string[] {
  const sidebar = resolveSidebar(path)
  if (!sidebar) return []
  const urls: string[] = []
  for (const group of sidebar.groups) {
    for (const item of group.items) {
      const url = item.link.split('#')[0]
      if (!url || urls.includes(url)) continue
      urls.push(url)
    }
  }
  return urls
}
