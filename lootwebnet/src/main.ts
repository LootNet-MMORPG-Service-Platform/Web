import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setNavigator } from './router/navigation'

setNavigator((path) => {
  router.push(path)
})

createApp(App).use(router).mount('#app')
