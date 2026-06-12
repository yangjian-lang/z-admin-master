import { createApp } from 'vue'

import store from './store'
import router from './router'
import App from './App.vue'

import '@/styles/index.scss'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import '@/router/premisstion'
import CategoryList from '@/components/CategoryList.vue'
import Search from '@/components/Search.vue'

const app = createApp(App)
app.use(store)
app.use(router)
app.component('CategoryList', CategoryList)
app.component('Search', Search)
app.use(ElementPlus, { size: 'small', zIndex: 3000 })

app.mount('#app')