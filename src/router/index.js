import VueRouter from 'vue-router'

import Index from '../modules/index.vue'
import NotFoundView from '../components/NotFound.vue'

const routes = [
    { path: '/', component: Index },
    { path: '*', component: NotFoundView }
]

const router = new VueRouter({
    routes
})

export default router