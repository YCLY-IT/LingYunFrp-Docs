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
        items: [
          { text: '场景概览', link: '/docs/scenarios' },
          { text: '游戏开服 · 概览', link: '/docs/scenarios/game-server' },
          { text: '面板工具使用', link: '/docs/scenarios/game-server/panel-tool' },
          { text: 'frpc 部署示例', link: '/docs/scenarios/game-server/frpc-demo' },
          { text: '游戏配置样例', link: '/docs/scenarios/game-server/game-example' },
          { text: '远程连接与 NAS', link: '/docs/scenarios/game-server/other-usage' },
          { text: '安全防护', link: '/docs/scenarios/game-server/security' },
          { text: '部署网站 · 概览', link: '/docs/scenarios/website-deploy' },
          { text: '建站工具对接', link: '/docs/scenarios/website-deploy/site-tool' },
          { text: '域名解析', link: '/docs/scenarios/website-deploy/dns-resolve' },
          { text: 'SSL 证书', link: '/docs/scenarios/website-deploy/ssl-cert' },
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
        items: [{ text: '全部问题', link: '/docs/faq' }],
      },
      {
        text: '附录',
        items: [
          { text: '附录概览', link: '/docs/appendix' },
          { text: '术语对照表', link: '/docs/appendix/glossary' },
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
