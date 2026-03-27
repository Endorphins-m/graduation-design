import Vue from 'vue'
import App from './App'
import uView from 'uview-ui'  // 确保这行存在

Vue.config.productionTip = false

Vue.use(uView)  // 确保这行存在，且在 new Vue 之前

App.mpType = 'app'

const app = new Vue({
    ...App
})
app.$mount()