import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import { createPinia } from 'pinia'
import 'reflect-metadata'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.scss'
import { Router } from './router/router'
import { registerDirective } from './utils/vue-config/directive'
/* import the fontawesome core */
import { library } from '@fortawesome/fontawesome-svg-core'
/* import font awesome icon component */
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
/* import specific icons */
import {
  faAddressCard,
  faHospitalUser,
  faMinus,
  faPlus,
  faSort,
  faSortDown,
  faSortUp,
  faMobileScreenButton,
  faDesktop,
  faKitMedical,
  faFileInvoiceDollar,
} from '@fortawesome/free-solid-svg-icons'

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
)

const start = async () => {
  const app = createApp(App)

  registerDirective(app)

  app.component('FontAwesomeIcon', FontAwesomeIcon)

  app.use(Antd)
  app.use(createPinia())
  app.use(Router)

  app.mount('#app')
}

start()
