<template>
  <div class="admin-layout">

    <!-- Mobile header -->
    <header class="admin-mobile-header">
      <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen">
        <i class="fa-sharp-duotone fa-solid fa-bars"></i>
      </button>
      <div class="mobile-brand">
        <img src="/logo.png" alt="UlendoPay" style="height: 28px; width: auto; border-radius: 6px;">
        <span>Admin Dashboard</span>
      </div>
      <div class="mobile-user">
        <i class="fa-sharp-duotone fa-solid fa-user-tie"></i>
      </div>
    </header>

    <!-- Sidebar overlay for mobile -->
    <div v-if="sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>

    <aside class="admin-sidebar" :class="{ open: sidebarOpen }">
      <div class="admin-sidebar__brand">
        <img src="/logo.png" alt="UlendoPay" style="height: 36px; width: auto; border-radius: 8px; background: var(--bg-card); padding: 3px;">
        <div>
          <div class="brand-name">UlendoPay</div>
          <div class="brand-sub">Admin Dashboard</div>
        </div>
        <button class="sidebar-close" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
        </button>
      </div>

      <nav class="admin-sidebar__nav">
        <div class="nav-section-label">Overview</div>
        <RouterLink to="/admin" class="admin-nav-item" :class="{ active: route.path === '/admin' }" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-gauge-high"></i>Dashboard
        </RouterLink>

        <div class="nav-section-label">Operations</div>
        <RouterLink to="/admin/kyc" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/kyc') }" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-layer-group"></i>Tiers
          </RouterLink>
          <RouterLink to="/admin/kyc" class="sidebar__link" active-class="sidebar__link--active">
            <i class="fa-sharp-duotone fa-solid fa-id-card"></i>KYC Review
          <span v-if="kycCount > 0" class="nav-badge">{{ kycCount }}</span>
        </RouterLink>
        <RouterLink to="/admin/users" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/users') }" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-users"></i>Users
        </RouterLink>
        <RouterLink to="/admin/transactions" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/transactions') }" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-arrow-right-arrow-left"></i>Transactions
        </RouterLink>

        <div class="nav-section-label">System</div>
        <RouterLink to="/admin/analytics" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/analytics') }" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-chart-bar"></i>Analytics
        </RouterLink>
        <RouterLink to="/admin/rates" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/rates') }" @click="sidebarOpen = false">
          <i class="fa-duotone fa-solid fa-chart-line"></i>Exchange Rates
        </RouterLink>
        <RouterLink to="/admin/fraud" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/fraud') }" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>Fraud Alerts
          <span v-if="fraudCount > 0" class="nav-badge nav-badge--danger">{{ fraudCount }}</span>
        </RouterLink>
        <RouterLink v-if="auth.user?.role === 'super_admin'" to="/admin/staff" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/staff') }" @click="sidebarOpen = false">
          <i class="fa-duotone fa-solid fa-user-shield"></i>Staff
        </RouterLink>
        <RouterLink v-if="auth.user?.role === 'super_admin'" to="/admin/partners" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/partners') }" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-handshake"></i>Partners
        
        </RouterLink>
        <RouterLink to="/admin/settings" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/settings') }" @click="sidebarOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-gear"></i>Settings
        </RouterLink>
        <RouterLink v-if="auth.user?.role === 'super_admin'" to="/admin/accounts" class="admin-nav-item" :class="{ active: route.path.startsWith('/admin/accounts') }" @click="sidebarOpen = false">
          <i class="fa-duotone fa-solid fa-building-columns"></i>Accounts
        </RouterLink>
      </nav>

      <div class="admin-sidebar__footer">
        <div class="staff-info">
          <div class="staff-avatar">{{ initials }}</div>
          <div>
            <div class="staff-name">{{ auth.user?.name }}</div>
            <div class="staff-role">{{ formatRole(auth.user?.role) }}</div>
          </div>
        </div>
        <div class="footer-actions">
          <RouterLink to="/dashboard" class="footer-btn" title="Customer view" @click="sidebarOpen = false">
            <i class="fa-sharp-duotone fa-solid fa-arrow-up-right-from-square"></i>
          </RouterLink>
          <button class="footer-btn" @click="handleLogout">
            <i class="fa-sharp-duotone fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>
    </aside>

    <main class="admin-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'

const route       = useRoute()
const router      = useRouter()
const auth        = useAuthStore()
const admin       = useAdminStore()
const sidebarOpen = ref(false)

const kycCount   = computed(() => admin.stats?.users?.kyc_pending ?? 0)
const fraudCount = computed(() => admin.stats?.fraud_alerts?.new ?? 0)
const initials   = computed(() => (auth.user?.name || 'A').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase())

function formatRole(r) {
  return { super_admin: 'Super Admin', kyc_reviewer: 'KYC Reviewer', finance_officer: 'Finance Officer', support_agent: 'Support Agent' }[r] || r
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f1f5f9; }

/* Mobile header — hidden on desktop */
.admin-mobile-header {
  display: none;
  position: fixed; top: 0; left: 0; right: 0; z-index: 20;
  background: #0f172a; height: 56px;
  padding: 0 16px; align-items: center; justify-content: space-between;
}
.menu-toggle {
  width: 36px; height: 36px; background: #1e293b; border: none;
  border-radius: 8px; color: #94a3b8; cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
}
.mobile-brand {
  display: flex; align-items: center; gap: 10px;
  color: var(--text-inverse); font-weight: 700; font-size: 15px;
}
.mobile-brand img { border-radius: 6px; background: var(--bg-card); padding: 2px; }
.mobile-user {
  width: 36px; height: 36px; background: #1e293b;
  border-radius: 8px; display: flex; align-items: center;
  justify-content: center; color: #64748b; font-size: 15px;
}

/* Sidebar overlay */
.sidebar-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.5); z-index: 30;
}

/* Sidebar */
.admin-sidebar {
  width: 240px; flex-shrink: 0; background: #0f172a;
  display: flex; flex-direction: column;
  position: fixed; height: 100vh; z-index: 40;
  overflow-y: auto; transition: transform 0.3s ease;
}
.admin-sidebar__brand {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 16px; border-bottom: 1px solid #1e293b;
}
.brand-icon {
  width: 34px; height: 34px; background: var(--accent);
  border-radius: 9px; display: flex; align-items: center;
  justify-content: center; color: var(--text-inverse); font-size: 15px; flex-shrink: 0;
}
.brand-name { color: var(--text-inverse); font-weight: 700; font-size: 14px; }
.brand-sub  { color: #475569; font-size: 10px; font-weight: 500; }
.sidebar-close { display: none; margin-left: auto; background: none; border: none; color: #64748b; cursor: pointer; font-size: 16px; }

.admin-sidebar__nav { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 1px; }
.nav-section-label {
  font-size: 10px; font-weight: 700; color: #334155;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 10px 8px 4px;
}
.admin-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 7px; color: #64748b;
  text-decoration: none; font-size: 13px; font-weight: 500;
  transition: all 0.15s;
}
.admin-nav-item i { width: 15px; text-align: center; font-size: 13px; flex-shrink: 0; }
.admin-nav-item:hover { background: #1e293b; color: #cbd5e1; }
.admin-nav-item.active { background: #1e293b; color: var(--text-inverse); }
.admin-nav-item.active i { color: var(--accent); }
.nav-badge {
  margin-left: auto; background: var(--accent); color: var(--text-inverse);
  font-size: 10px; font-weight: 700; padding: 1px 6px;
  border-radius: 10px; min-width: 16px; text-align: center;
}
.nav-badge--danger { background: #dc2626; }

.admin-sidebar__footer { padding: 12px; border-top: 1px solid #1e293b; }
.staff-info { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.staff-avatar {
  width: 32px; height: 32px; background: var(--accent);
  border-radius: 8px; display: flex; align-items: center;
  justify-content: center; color: var(--text-inverse); font-size: 11px;
  font-weight: 700; flex-shrink: 0;
}
.staff-name { color: #e2e8f0; font-size: 12px; font-weight: 600; }
.staff-role { color: #475569; font-size: 10px; }
.footer-actions { display: flex; gap: 6px; }
.footer-btn {
  flex: 1; padding: 7px; background: #1e293b; border: none;
  border-radius: 7px; color: #475569; cursor: pointer; font-size: 12px;
  text-align: center; text-decoration: none; display: flex;
  align-items: center; justify-content: center; transition: all 0.15s;
}
.footer-btn:hover { background: #334155; color: #e2e8f0; }

.admin-main { margin-left: 240px; flex: 1; min-height: 100vh; width: calc(100% - 240px); overflow-x: hidden; }

/* ── Mobile ── */
@media (max-width: 768px) {
  .admin-mobile-header { display: flex; }
  .admin-main { margin-left: 0; padding-top: 56px; width: 100%; }
  .admin-sidebar { transform: translateX(-100%); }
  .admin-sidebar.open { transform: translateX(0); }
  .sidebar-overlay { display: block; }
  .sidebar-close { display: block; }
}
</style>
