import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ── Public ──────────────────────────────────────────────────────────────
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingView.vue'),
      meta: { public: true, guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { public: true, guestOnly: true },
    },
    {
      path: '/verify-phone',
      name: 'verify-phone',
      component: () => import('@/views/auth/VerifyPhoneView.vue'),
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true, guestOnly: true },
    },
    {
      path: '/verify-login',
      name: 'verify-login',
      component: () => import('@/views/auth/VerifyLoginView.vue'),
      meta: { public: true },
    },

    // ── Protected ────────────────────────────────────────────────────────────
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/send',
      name: 'send-money',
      component: () => import('@/views/dashboard/SendMoneyView.vue'),
      meta: { requiresAuth: true, requiresKyc: true },
    },
    {
      path: '/topup',
      name: 'topup',
      component: () => import('@/views/dashboard/TopUpView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/dashboard/TransactionHistoryView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/dashboard/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/kyc',
      name: 'kyc',
      component: () => import('@/views/kyc/KycView.vue'),
      meta: { requiresAuth: true },
    },

    // ── 404 ──────────────────────────────────────────────────────────────────
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresKyc && !auth.isKycVerified) {
    return { name: 'kyc' }
  }
})

export default router
