import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.scss'
import './common/scss/vue-common.scss'
import { Router } from './router/router'
import { registerDirective } from './utils/vue-config/directive'
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
/* import specific icons */
import CKEditor from '@ckeditor/ckeditor5-vue'
import {
  faAddressCard,
  faDesktop,
  faFileInvoiceDollar,
  faHospitalUser,
  faIdCard,
  faKitMedical,
  faMinus,
  faMobileScreenButton,
  faPlus,
  faSort,
  faSortDown,
  faSortUp,
} from '@fortawesome/free-solid-svg-icons'
import { socketInit } from './core/socket/socket.base'

library.add(
  faSort,
  faSortDown,
  faSortUp,
  faHospitalUser,
  faAddressCard,
  faPlus,
  faMinus,
  faMobileScreenButton,
  faDesktop,
  faKitMedical,
  faFileInvoiceDollar,
  faIdCard
)

const start = async () => {
  const app = createApp(App)

  registerDirective(app)

  app.component('FontAwesomeIcon', FontAwesomeIcon)

  app.use(Antd)
  app.use(createPinia())
  app.use(Router)
  app.use(CKEditor)

  app.mount('#app')

  socketInit()
}

start()
