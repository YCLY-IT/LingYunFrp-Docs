import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles/main.css'

import DocAlert from '@/components/DocAlert.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import ApiSpec from '@/components/api/ApiSpec.vue'
import ApiOperation from '@/components/api/ApiOperation.vue'

const app = createApp(App)

// markdown 里可以直接使用的组件
app.component('DocAlert', DocAlert)
app.component('Stats', StatsPanel)
app.component('ApiSpec', ApiSpec)
app.component('ApiOperation', ApiOperation)

app.use(router)

// 等首个路由解析完成再挂载，避免首帧先渲染首页布局再切走
router.isReady().then(() => app.mount('#app'))
