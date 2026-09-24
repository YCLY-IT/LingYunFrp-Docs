/// <reference types="vite/client" />

declare module 'virtual:docs-meta' {
  import type { DocsMeta } from '#shared/docs'

  const meta: DocsMeta
  export default meta
}

declare module 'virtual:docs-search' {
  import type { SearchRecord } from '#shared/docs'

  const records: SearchRecord[]
  export default records
}

declare module '*.md' {
  import type { Component } from 'vue'
  import type { DocHeading, DocSection } from '#shared/docs'

  const component: Component & {
    frontmatter: Record<string, any>
    headings: DocHeading[]
    sections: DocSection[]
    title: string
    url: string
  }
  export default component
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<{}, {}, any>
  export default component
}
