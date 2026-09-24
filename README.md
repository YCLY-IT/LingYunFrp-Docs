# LingYunFrp Docs

LingYunFrp（凌云内网穿透）官方文档站点，使用 **Vue 3 + Naive UI + Tailwind CSS v4** 文档框架，现成文档生成器。

> 免费、易用、安全、稳定、快速、极低占用。

## 特性

| 能力 | 说明 |
| --- | --- |
| Markdown 驱动 | `docs/**/*.md` 由 Vite 插件编译成 Vue 组件，支持 Markdown 里直接写自定义组件 |
| Frontmatter | YAML 头信息解析，支持 `title` / `layout: home` / `aside` / `outline` 等 |
| 侧边栏 | 分组折叠、当前项高亮、移动端抽屉，折叠状态本地持久化 |
| 本页目录 | 由标题自动生成，滚动实时高亮 |
| 全文检索 | 构建期生成索引（MiniSearch），支持中英文混合、键盘导航 |
| 亮 / 暗主题 | Naive UI `ConfigProvider` + Tailwind v4 `dark` 变体，跟随系统并可持久化 |
| 代码块 | Shiki 双主题高亮、语言标签、一键复制、`{1,3-5}` 行高亮 |
| 提示块 | `::: warning 标题` 语法映射到 Naive UI `Alert` |
| OpenAPI | 自研渲染：按分组罗列接口、参数/请求体/响应字段树、cURL 与 fetch 示例 |
| 上下篇 | 按侧边栏顺序自动推导 |

## 快速开始

需要 Node.js 与 [pnpm](https://pnpm.io/)。

```bash
# 安装依赖
pnpm install

# 本地开发（默认 http://localhost:5173）
pnpm dev

# 生产构建，产物在 dist/
pnpm build

# 预览构建产物
pnpm preview
```

## 目录结构

```
.
├── docs/                    # 文档源文件（Markdown）
│   ├── index.md             # 首页（frontmatter 驱动 Hero + 特性）
│   ├── docs/                # 使用指南
│   ├── develop/             # API 文档
│   └── terms/               # 服务条款与隐私政策
├── plugins/
│   ├── markdown.ts          # Markdown → HTML（容器、标题锚点、Shiki 高亮）
│   └── vite-plugin-docs.ts  # md → Vue 组件、站点元信息、检索索引
├── shared/docs.ts           # 构建期与运行期共用的纯函数 / 类型
├── public/                  # 静态资源（logo 等）
└── src/
    ├── api/                 # OpenAPI 解析工具与规范文件
    ├── components/          # 布局与文档组件
    ├── composables/         # 主题、搜索、UI 状态
    ├── config/site.ts       # 站点配置：导航、侧边栏、页脚
    ├── docs/meta.ts         # 由插件生成的页面元信息
    ├── pages/               # OpenAPI 动态页面、404
    ├── router.ts            # 由 docs 目录自动生成路由
    └── styles/main.css      # Tailwind v4 入口与文档排版
```

## 写文档

### 新建页面

在 `docs/` 下新建 `.md` 文件即可，路由按文件路径推导：

| 文件 | 路由 |
| --- | --- |
| `docs/index.md` | `/` |
| `docs/docs/index.md` | `/docs/` |
| `docs/docs/configuration.md` | `/docs/configuration` |
| `docs/terms/terms.md` | `/terms/terms` |

新页面要出现在侧边栏，需在 `src/config/site.ts` 的 `sidebars` 中登记。

### Frontmatter

```yaml
---
title: 接口列表        # 覆盖页面标题
aside: false          # 隐藏右侧「本页目录」
outline: [2, 3]       # 目录收录的标题层级
layout: home          # 首页布局
---
```

### 提示块

```markdown
::: warning 标题可以省略
正文支持 Markdown。
:::
```

支持 `info` / `tip` / `warning` / `danger`（分别对应 Naive UI 的 info / success / warning / error）。

### 代码块

````markdown
```toml title="frpc.toml" {2,5-7}
serverAddr = "hz.example.com"
```
````

- `title="..."` 自定义左上角标签
- `{2,5-7}` 高亮指定行

### 可在 Markdown 中直接使用的组件

| 组件 | 用法 | 说明 |
| --- | --- | --- |
| `<Stats />` | 首页统计 | 请求 `site.statsEndpoint` |
| `<ApiSpec />` | `<ApiSpec :tags="['隧道']" hide-info />` | 接口总览 |
| `<ApiOperation />` | `<ApiOperation operation-id="getDashboardStats" />` | 单接口详情 |

## 接口文档

接口由 `src/api/openapi.json` 驱动：

- 侧边栏分组与条目自动生成（`src/config/site.ts` 读取 `virtual:docs-meta`）
- `/develop/endpoints` 展示全部接口
- `/develop/tags/:tag` 展示单个分组
- `/develop/operations/:operationId` 展示单个接口

往规范文件里加接口后，侧边栏与列表页会一起更新，不需要改文档。

## 部署

`pnpm build` 生成的 `dist/` 是纯静态文件，可直接托管到 GitHub Pages、Vercel、Netlify 等。站点使用 History 路由，需要把未匹配的请求回退到 `index.html`。

## 许可证

本项目基于 [MIT License](LICENSE) 开源。
