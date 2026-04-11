<template>
  <div class="admin-layout" :class="{ 'sidebar-open': isSidebarOpen }">

    <!-- Mobile header -->
    <header class="mobile-header">
      <button class="hamburger" @click="isSidebarOpen = !isSidebarOpen">
        <i :class="isSidebarOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
      </button>
      <div class="mobile-brand">
        <div class="brand-icon"><i class="fa-solid fa-shield-halved"></i></div>
        <span>Admin Console</span>
      </div>
      <div class="mobile-user">
        <div class="staff-info__avatar">
          <i class="fa-solid fa-user-tie"></i>
        </div>
      </div>
    </header>

    <!-- Overlay -->
    <div class="sidebar-overlay" @click="isSidebarOpen = false"></div>

    <aside class="admin-sidebar">
      <div class="admin-sidebar__brand">
        <div class="brand-icon"><i class="fa-solid fa-shield-halved"></i></div>
        <div>
          <div class="brand-name">Ulendo Pay</div>
          <div class="brand-sub">Admin Console</div>
        </div>
      </div>

      <nav class="admin-sidebar__nav">

        <div class="nav-section-label">Overview</div>
        <RouterLink
          to="/admin"
          class="admin-nav-item"
          :class="{ active: route.path === '/admin' }"
          @click="isSidebarOpen = false"
        >
          <i class="fa-solid fa-gauge-high"></i>
          Dashboard
        </RouterLink>

        <template v-if="canAccess('operations')">
          <div class="nav-section-label">Operations</div>
          <RouterLink
            to="/admin/kyc"
            class="admin-nav-item"
            :class="{ active: route.path.startsWith('/admin/kyc') }"
            @click="isSidebarOpen = false"
          >
            <i class="fa-solid fa-id-card"></i>
            KYC Review
            <span v-if="kycCount > 0" class="nav-badge">{{ kycCount }}</span>
          </RouterLink>
          <RouterLink
            to="/admin/users"
            class="admin-nav-item"
            :class="{ active: route.path.startsWith('/admin/users') }"
            @click="isSidebarOpen = false"
          >
            <i class="fa-solid fa-users"></i>
            Users
          </RouterLink>
          <RouterLink
            to="/admin/transactions"
            class="admin-nav-item"
            :class="{ active: route.path.startsWith('/admin/transactions') }"
            @click="isSidebarOpen = false"
          >
            <i class="fa-solid fa-arrow-right-arrow-left"></i>
            Transactions
          </RouterLink>
        </template>

        <template v-if="canAccess('system')">
          <div class="nav-section-label">System</div>
          <RouterLink
            to="/admin/rates"
            class="admin-nav-item"
            :class="{ active: route.path.startsWith('/admin/rates') }"
            @click="isSidebarOpen = false"
          >
            <i class="fa-solid fa-chart-line"></i>
            Exchange Rates
          </RouterLink>
          <RouterLink
            to="/admin/fraud"
            class="admin-nav-item"
            :class="{ active: route.path.startsWith('/admin/fraud') }"
            @click="isSidebarOpen = false"
          >
            <i class="fa-solid fa-triangle-exclamation"></i>
            Fraud Alerts
            <span v-if="fraudCount > 0" class="nav-badge nav-badge--danger">{{ fraudCount }}</span>
          </RouterLink>
        </template>

        <template v-if="canAccess('super_admin')">
          <div class="nav-section-label">Administration</div>
          <RouterLink
            to="/admin/staff"
            class="admin-nav-item"
            :class="{ active: route.path.startsWith('/admin/staff') }"
            @click="isSidebarOpen = false"
          >
            <i class="fa-solid fa-user-shield"></i>
            Staff
          </RouterLink>
        </template>

      </nav>

      <div class="admin-sidebar__footer">
        <div class="staff-info">
          <div class="staff-info__avatar">
            <i class="fa-solid fa-user-tie"></i>
          </div>
          <div class="staff-info__details">
            <div class="staff-info__name">{{ auth.user?.name }}</div>
            <div class="staff-info__role">{{ formatRole(auth.user?.role) }}</div>
          </div>
        </div>
        <div class="sidebar-actions">
          <RouterLink to="/dashboard" class="sidebar-action-btn" title="Customer view" @click="isSidebarOpen = false">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </RouterLink>
          <button class="sidebar-action-btn sidebar-action-btn--danger" title="Sign out" @click="handleLogout">
            <i class="fa-solid fa-right-from-bracket"></i>
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

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const admin  = useAdminStore()

const isSidebarOpen = ref(false)

const kycCount   = computed(() => admin.stats?.users?.kyc_pending ?? 0)
const fraudCount = computed(() => admin.stats?.fraud_alerts?.new ?? 0)

// Role-based section visibility
// super_admin sees everything
// operations sees operations + overview
// compliance sees kyc + fraud + overview
// support sees users + transactions + overview
const roleAccess = {
  super_admin:  ['operations', 'system', 'super_admin'],
  operations:   ['operations'],
  compliance:   ['operations', 'system'],
  support:      ['operations'],
}

function canAccess(section) {
  const role = auth.user?.role
  if (!role) return false
  return roleAccess[role]?.includes(section) ?? false
}

function formatRole(role) {
  return {
    super_admin:  'Super Admin',
    operations:   'Operations',
    compliance:   'Compliance',
    support:      'Support',
  }[role] || role
}

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.admin-layout {
  display: flex; min-height: 100vh; background: #f1f5f9;
  flex-direction: column;
}
@media (min-width: 768px) {
  .admin-layout { flex-direction: row; }
}

/* ── Mobile header ── */
.mobile-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; background: #0f172a;
  position: sticky; top: 0; z-index: 40;
}
@media (min-width: 768px) { .mobile-header { display: none; } }

.hamburger {
  background: none; border: none; color: #94a3b8;
  font-size: 20px; cursor: pointer; padding: 4px 8px;
  border-radius: 6px; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
}
.hamburger:hover { background: #1e293b; color: #e2e8f0; }

.mobile-brand {
  display: flex; align-items: center; gap: 8px;
  color: #fff; font-weight: 700; font-size: 15px;
}
.mobile-brand .brand-icon {
  width: 28px; height: 28px; background: var(--accent);
  border-radius: 7px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 13px;
}

.mobile-user .staff-info__avatar {
  width: 32px; height: 32px; background: #1e293b;
  border-radius: 8px; display: flex; align-items: center;
  justify-content: center; color: #64748b; font-size: 13px;
}

/* ── Overlay ── */
.sidebar-overlay {
  display: none; position: fixed; inset: 0;
  background: rgba(0,0,0,0.6); z-index: 30;
}
.admin-layout.sidebar-open .sidebar-overlay { display: block; }
@media (min-width: 768px) {
  .admin-layout.sidebar-open .sidebar-overlay { display: none; }
}

/* ── Sidebar ── */
.admin-sidebar {
  width: 240px; flex-shrink: 0; background: #0f172a;
  display: flex; flex-direction: column;
  position: fixed; height: 100vh; z-index: 35;
  overflow-y: auto; transition: transform 0.25s ease;
  transform: translateX(-100%);
  top: 0; left: 0;
}
@media (min-width: 768px) {
  .admin-sidebar {
    transform: translateX(0);
    position: sticky; top: 0; height: 100vh;
  }
}
.admin-layout.sidebar-open .admin-sidebar { transform: translateX(0); }

.admin-sidebar__brand {
  display: flex; align-items: center; gap: 12px;
  padding: 24px 20px; border-bottom: 1px solid #1e293b;
}
.brand-icon {
  width: 36px; height: 36px; background: var(--accent);
  border-radius: 10px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 16px; flex-shrink: 0;
}
.brand-name { color: #fff; font-weight: 700; font-size: 15px; }
.brand-sub  { color: #64748b; font-size: 11px; font-weight: 500; margin-top: 1px; }

.admin-sidebar__nav {
  flex: 1; padding: 16px 12px;
  display: flex; flex-direction: column; gap: 2px;
}

.nav-section-label {
  font-size: 10px; font-weight: 700; color: #475569;
  text-transform: uppercase; letter-spacing: 0.08em;
  padding: 14px 8px 6px; margin-top: 2px;
}
.nav-section-label:first-child { padding-top: 4px; }

.admin-nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 12px; border-radius: 8px; color: #94a3b8;
  text-decoration: none; font-size: 14px; font-weight: 500;
  transition: all 0.15s; position: relative;
  border: 1px solid transparent;
}
.admin-nav-item i { width: 16px; text-align: center; font-size: 14px; flex-shrink: 0; }
.admin-nav-item:hover { background: #1e293b; color: #e2e8f0; }

/* Stronger active highlight */
.admin-nav-item.active {
  background: #1e3a5f;
  color: #fff;
  border-color: rgba(234, 88, 12, 0.3);
  box-shadow: inset 3px 0 0 var(--accent);
  padding-left: 14px;
}
.admin-nav-item.active i { color: var(--accent); }

.nav-badge {
  margin-left: auto; background: var(--accent); color: #fff;
  font-size: 10px; font-weight: 700; padding: 2px 6px;
  border-radius: 10px; min-width: 18px; text-align: center;
}
.nav-badge--danger { background: var(--danger); }

/* ── Footer ── */
.admin-sidebar__footer {
  padding: 16px; border-top: 1px solid #1e293b;
}
.staff-info {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.staff-info__avatar {
  width: 34px; height: 34px; background: #1e293b;
  border-radius: 8px; display: flex; align-items: center;
  justify-content: center; color: #64748b; font-size: 14px; flex-shrink: 0;
}
.staff-info__name { color: #e2e8f0; font-size: 13px; font-weight: 600; }
.staff-info__role { color: #64748b; font-size: 11px; margin-top: 1px; }

.sidebar-actions { display: flex; gap: 6px; }
.sidebar-action-btn {
  flex: 1; padding: 8px; background: #1e293b; border: none;
  border-radius: 8px; color: #64748b; cursor: pointer;
  font-size: 13px; text-align: center; text-decoration: none;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.sidebar-action-btn:hover { background: #334155; color: #e2e8f0; }
.sidebar-action-btn--danger:hover { background: #450a0a; color: #f87171; }

/* ── Main content ── */
.admin-main { flex: 1; min-height: 100vh; overflow-y: auto; }
@media (min-width: 768px) { .admin-main { margin-left: 240px; } }
</style>
