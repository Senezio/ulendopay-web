<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar__logo">
        <div class="logo-icon">U</div>
        <div>
          <div class="logo-name">Ulendo</div>
          <div class="logo-sub mono">PAY</div>
        </div>
      </div>

      <nav class="sidebar__nav">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: route.path === item.to }"
        >
          <i :class="item.icon"></i>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="sidebar__user">
        <div class="user-card">
          <div class="user-name">{{ auth.user?.name }}</div>
          <div class="user-status">
            {{ auth.isKycVerified ? '✓ Verified' : '○ Unverified' }}
          </div>
          <button class="btn-logout" @click="handleLogout">Sign out</button>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const nav = [
  { to: '/dashboard', icon: 'fa-solid fa-house',          label: 'Home' },
  { to: '/send',      icon: 'fa-solid fa-paper-plane',    label: 'Send' },
  { to: '/history',   icon: 'fa-solid fa-clock-rotate-left', label: 'History' },
  { to: '/kyc',       icon: 'fa-solid fa-id-card',        label: 'KYC' },
  { to: '/profile',   icon: 'fa-solid fa-user',           label: 'Profile' },
]

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { display: flex; min-height: 100vh; }

.sidebar {
  width: 220px; flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column;
  padding: 28px 0; position: fixed;
  height: 100vh; z-index: 10;
}

.sidebar__logo {
  display: flex; align-items: center; gap: 10px;
  padding: 0 20px 28px;
}
.logo-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--accent); display: flex;
  align-items: center; justify-content: center;
  color: #000; font-weight: 700; font-size: 18px;
}
.logo-name { font-weight: 700; font-size: 15px; letter-spacing: -0.02em; }
.logo-sub  { font-size: 11px; color: var(--text-secondary); }

.sidebar__nav { flex: 1; padding: 0 10px; }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 10px; margin-bottom: 3px;
  text-decoration: none; font-size: 13px; font-weight: 400;
  color: var(--text-secondary); transition: all 0.15s;
  border-left: 2px solid transparent;
}
.nav-item i { width: 16px; text-align: center; font-size: 13px; }
.nav-item:hover { color: var(--text-primary); background: var(--bg-elevated); }
.nav-item.active {
  color: var(--accent); background: var(--accent-dim);
  border-left-color: var(--accent); font-weight: 600;
}

.sidebar__user { padding: 0 10px; }
.user-card {
  padding: 14px; border-radius: 10px;
  background: var(--bg-elevated); border: 1px solid var(--border);
}
.user-name   { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
.user-status { font-size: 11px; color: var(--text-secondary); margin-bottom: 10px; }
.btn-logout {
  width: 100%; padding: 7px; border-radius: 7px;
  background: transparent; border: 1px solid var(--border);
  color: var(--text-secondary); font-size: 12px; cursor: pointer;
  font-family: 'Sora', sans-serif; transition: all 0.15s;
}
.btn-logout:hover { border-color: var(--danger); color: var(--danger); }

.main-content { margin-left: 220px; flex: 1; padding: 40px; }
</style>
