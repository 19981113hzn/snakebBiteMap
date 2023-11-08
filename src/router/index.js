import VueRouter from 'vue-router'

import Index from '../modules/index.vue'
// import MapView from '../modules/map/index.vue'
// import StatisticsView from '../modules/statistics/index.vue'
import NotFoundView from '../components/NotFound.vue'

const routes = [
    { path: '/', component: Index },
    // { path: '/statistics', component: StatisticsView },
    // { path: '/login', component: LoginView },
    // { path: '/register', component: RegisterView },
    // { path: '/profile', component: ProfileView },
    // { path: '/admin', component: AdminView },
    { path: '*', component: NotFoundView }
]

const router = new VueRouter({
    routes
})

export default router