import { api } from '@/docs/meta'

export interface SidebarLink {
  text: string
  link: string
}

export interface SidebarGroup {
  text: string
  collapsed?: boolean
  items?: SidebarLink[]
  children?: SidebarGroup[]
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
        text: '概览',
        items: [{ text: '文档中心', link: '/docs/' }],
      },
      {
        text: '快速开始',
        items: [
          { text: '概览', link: '/docs/quick-start' },
          { text: '网页启动隧道', link: '/docs/quick-start/web-launch' },
          { text: '客户端启动隧道', link: '/docs/quick-start/client-launch' },
          { text: 'frpc 服务启动', link: '/docs/quick-start/service-launch' },
        ],
      },
      {
        text: '参数详解',
        items: [
          { text: '概览', link: '/docs/parameters' },
          { text: '配置文件说明', link: '/docs/parameters/config-file' },
          { text: '服务端参数', link: '/docs/parameters/server-params' },
          { text: '节点线路选型', link: '/docs/parameters/node-select' },
          { text: '故障排查', link: '/docs/parameters/troubleshooting' },
        ],
      },
      {
        text: '使用场景',
        items: [{ text: '场景概览', link: '/docs/scenarios' }],
        children: [
          {
            text: '游戏开服',
            collapsed: true,
            items: [
              { text: '游戏开服 · 概览', link: '/docs/scenarios/game-server' },
              { text: 'Minecraft 开服', link: '/docs/scenarios/game-server/mc' },
              { text: 'Steam 游戏开服', link: '/docs/scenarios/game-server/steam-games' },
              { text: 'Linux 可视化面板', link: '/docs/scenarios/game-server/panels' },
            ],
          },
          {
            text: '部署网站',
            collapsed: true,
            items: [
              { text: '部署网站 · 概览', link: '/docs/scenarios/website-deploy' },
              { text: '一键建站', link: '/docs/scenarios/website-deploy/one-click' },
              { text: '手动建站', link: '/docs/scenarios/website-deploy/manual' },
              { text: '域名解析', link: '/docs/scenarios/website-deploy/dns-resolve' },
              { text: 'SSL 证书', link: '/docs/scenarios/website-deploy/ssl-cert' },
              { text: '负载均衡', link: '/docs/scenarios/website-deploy/load-balance' },
            ],
          },
          {
            text: '内网端口映射',
            collapsed: true,
            items: [
              { text: '内网端口映射 · 概览', link: '/docs/scenarios/lan-access' },
              { text: '家庭 NAS', link: '/docs/scenarios/lan-access/nas' },
              { text: '家庭数据库', link: '/docs/scenarios/lan-access/database' },
              { text: '常用服务与远程管理', link: '/docs/scenarios/lan-access/services' },
            ],
          },
        ],
      },
      {
        text: '进阶使用',
        items: [
          { text: '概览', link: '/docs/advanced' },
          { text: '开机自启', link: '/docs/advanced/auto-start' },
          { text: '性能调优', link: '/docs/advanced/performance' },
          { text: '日志查看', link: '/docs/advanced/log-view' },
          { text: 'Docker 部署', link: '/docs/advanced/docker-deploy' },
        ],
      },
      {
        text: '常见问题',
        items: [
          { text: '常见问题 · 概览', link: '/docs/faq' },
          { text: '常见问题解答', link: '/docs/faq/common-questions' },
          { text: '询问 AI 解决问题', link: '/docs/faq/ask-ai' },
          { text: '寻求他人解决问题', link: '/docs/faq/ask-others' },
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
  const link = firstLink(section?.groups ?? [])
  return link ? link.split('#')[0] : prefix
}

function firstLink(groups: SidebarGroup[]): string | undefined {
  for (const group of groups) {
    if (group.items?.length) return group.items[0].link
    const nested = firstLink(group.children ?? [])
    if (nested) return nested
  }
  return undefined
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
  const walk = (group: SidebarGroup) => {
    for (const item of group.items ?? []) {
      const url = item.link.split('#')[0]
      if (!url || urls.includes(url)) continue
      urls.push(url)
    }
    for (const child of group.children ?? []) walk(child)
  }
  for (const group of sidebar.groups) walk(group)
  return urls
}
