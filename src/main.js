import Vue from 'vue'
import VueRouter from 'vue-router'
import ECharts from 'vue-echarts'

import App from './App.vue'
import router from './router'
import store from './store'

import VueToastify from 'vue-toastification'
import 'vue-toastification/dist/index.css'

Vue.use(VueRouter)
Vue.use(VueToastify)

Vue.component('v-chart', ECharts)

Vue.config.productionTip = false

new Vue({
    router,
    store,
    render: h => h(App),
}).$mount('#app')