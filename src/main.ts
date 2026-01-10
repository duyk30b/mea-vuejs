import Antd from 'ant-design-vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/css/style.css'
// cần lưu ý đúng thứ tự import css
import './assets/css/antd.css'
import './assets/main.scss'
import './common/scss/vue-common.scss'
import { IndexedDBConnection } from './core/indexed-db'
import { socketInit } from './core/socket/socket.base'
import { Router } from './router/router'
import { registerDirective } from './utils/vue-config/directive'

const start = async () => {
  const app = createApp(App)

  IndexedDBConnection.init()
  registerDirective(app)

  app.use(Antd)
  app.use(createPinia())
  app.use(Router)

  app.mount('#app')
  socketInit()
}

start()
