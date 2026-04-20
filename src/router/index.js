import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    // ── Public ──────────────────────────────────────────────────────────────
    { path: '/', name: 'landing', component: () => import('@/views/LandingView.vue'), meta: { public: true } },

    // ── Auth ─────────────────────────────────────────────────────────────────
    { path: '/register',      name: 'register',      component: () => import('@/views/auth/RegisterView.vue'),    meta: { public: true, guestOnly: true } },
    { path: '/verify-phone',  name: 'verify-phone',  component: () => import('@/views/auth/VerifyPhoneView.vue'), meta: { public: true } },
    { path: '/login',         name: 'login',         component: () => import('@/views/auth/LoginView.vue'),       meta: { public: true, guestOnly: true } },
    { path: '/verify-login',  name: 'verify-login',  component: () => import('@/views/auth/VerifyLoginView.vue'), meta: { public: true } },

    // ── Legal ─────────────────────────────────────────────────────────────────
    { path: '/privacy', name: 'privacy', component: () => import('@/views/legal/PrivacyView.vue'), meta: { public: true } },
    { path: '/terms',   name: 'terms',   component: () => import('@/views/legal/TermsView.vue'),   meta: { public: true } },
    { path: '/contact', name: 'contact', component: () => import('@/views/legal/ContactView.vue'), meta: { public: true } },

    // ── Customer ─────────────────────────────────────────────────────────────
    { path: '/dashboard', name: 'dashboard', component: () => import('@/views/dashboard/DashboardView.vue'),            meta: { requiresAuth: true } },
    { path: '/send',      name: 'send-money', component: () => import('@/views/dashboard/SendMoneyView.vue'),           meta: { requiresAuth: true, requiresKyc: true } },
    { path: '/topup',     name: 'topup',     component: () => import('@/views/dashboard/TopUpView.vue'),                meta: { requiresAuth: true } },
    { path: '/withdraw',  name: 'withdraw',  component: () => import('@/views/dashboard/WithdrawView.vue'),             meta: { requiresAuth: true } },
    { path: '/history',   name: 'history',   component: () => import('@/views/dashboard/TransactionHistoryView.vue'),  meta: { requiresAuth: true } },
    { path: '/profile',   name: 'profile',   component: () => import('@/views/dashboard/ProfileView.vue'),             meta: { requiresAuth: true } },
    { path: '/kyc',       name: 'kyc',       component: () => import('@/views/kyc/KycView.vue'),                       meta: { requiresAuth: true } },
    { path: '/security',  name: 'security',  component: () => import('@/views/dashboard/SecurityView.vue'),            meta: { requiresAuth: true } },

    // ── Admin ─────────────────────────────────────────────────────────────────
    { path: '/admin',              name: 'admin-dashboard',    component: () => import('@/views/admin/AdminDashboard.vue'),   meta: { requiresAuth: true, requiresStaff: true } },
    { path: '/admin/kyc',          name: 'admin-kyc',          component: () => import('@/views/admin/AdminKyc.vue'),         meta: { requiresAuth: true, requiresStaff: true } },
    { path: '/admin/users',        name: 'admin-users',        component: () => import('@/views/admin/AdminUsers.vue'),       meta: { requiresAuth: true, requiresStaff: true } },
    { path: '/admin/transactions', name: 'admin-transactions', component: () => import('@/views/admin/AdminTransactions.vue'),meta: { requiresAuth: true, requiresStaff: true } },
    { path: '/admin/rates',        name: 'admin-rates',        component: () => import('@/views/admin/AdminRates.vue'),       meta: { requiresAuth: true, requiresStaff: true } },
    { path: '/admin/fraud',        name: 'admin-fraud',        component: () => import('@/views/admin/AdminFraud.vue'),       meta: { requiresAuth: true, requiresStaff: true } },
    { path: '/admin/analytics', name: 'admin-analytics', component: () => import('@/views/admin/AdminAnalytics.vue'), meta: { requiresAuth: true, requiresStaff: true } },
    { path: '/admin/staff',        name: 'admin-staff',        component: () => import('@/views/admin/AdminStaff.vue'),       meta: { requiresAuth: true, requiresStaff: true, requiresRole: 'super_admin' } },
    { path: '/admin/partners',     name: 'admin-partners',     component: () => import('@/views/admin/AdminPartners.vue'),    meta: { requiresAuth: true, requiresStaff: true, requiresRole: 'super_admin' } },
    {
  path: '/admin/settings',
  name: 'admin-settings',
  component: () => import('@/views/admin/AdminSettings.vue'),
  meta: { requiresAuth: true, requiresStaff: true }
},
{ path: '/admin/accounts',     name: 'admin-accounts',     component: () => import('@/views/admin/AdminAccounts.vue'),    meta: { requiresAuth: true, requiresStaff: true, requiresRole: 'super_admin' } },

    // ── 404 ──────────────────────────────────────────────────────────────────
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: auth.user?.is_staff ? 'admin-dashboard' : 'dashboard' }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.requiresStaff && !auth.user?.is_staff) {
    return { name: 'dashboard' }
  }

  if (to.meta.requiresRole && auth.user?.role !== to.meta.requiresRole) {
    return { name: 'admin-dashboard' }
  }

  if (to.meta.requiresKyc && !auth.isKycVerified) {
    return { name: 'kyc' }
  }
})

export default router
