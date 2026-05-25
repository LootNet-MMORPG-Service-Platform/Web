import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MarketBuyView from '../views/MarketBuyView.vue'
import MarketSellView from '../views/MarketSellView.vue'
import DashboardView from '../views/DashboardView.vue'
import ChatView from '../views/ChatView.vue'
import UserMarketplaceView from '../views/UserMarketplaceView.vue'
import ErrorView from '../views/ErrorView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import VerifyEmailView from '../views/VerifyEmailView.vue'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout.vue'

const isAuthenticated = () => Boolean(localStorage.getItem('token'))

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: () => (isAuthenticated() ? '/market/buy' : '/login') },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/verify-email', name: 'verify-email', component: VerifyEmailView, meta: { public: true } },
    { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { public: true } },
    { path: '/error', name: 'error', component: ErrorView, meta: { public: true } },
    {
      path: '/',
      component: AuthenticatedLayout,
      meta: { requiresAuth: true },
      children: [
        { path: 'market', redirect: '/market/buy', meta: { requiresAuth: true } },
        { path: 'market/buy', name: 'market-buy', component: MarketBuyView, meta: { requiresAuth: true } },
        { path: 'market/sell', name: 'market-sell', component: MarketSellView, meta: { requiresAuth: true } },
        { path: 'dashboard', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } }
        ,{ path: 'chat', name: 'chat', component: ChatView, meta: { requiresAuth: true } }
        ,{ path: 'users/:userId', name: 'user-marketplace', component: UserMarketplaceView, meta: { requiresAuth: true } }
      ]
    },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ]
})

router.beforeEach((to) => {
  const authed = isAuthenticated()

  if (to.meta.requiresAuth && !authed)
    return '/login'

  if (to.path === '/login' && authed)
    return '/market/buy'

  return true
})

export default router
