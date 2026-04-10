<template>
  <div class="layout">
    <header class="mobile-header md:hidden">
      <button @click="isMenuOpen = true" class="menu-trigger">
        <i class="fa-solid fa-bars"></i>
      </button>
      <div class="mobile-logo">Ulendo PAY</div>
    </header>

    <div v-if="isMenuOpen" class="sidebar-overlay md:hidden" @click="isMenuOpen = false"></div>

    <aside class="sidebar" :class="{ 'sidebar--open': isMenuOpen }">
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
          @click="isMenuOpen = false"
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
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const isMenuOpen = ref(false)

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
.layout { display: flex; min-height: 100vh; flex-direction: column; }
@media (min-width: 768px) { .layout { flex-direction: row; } }

/* Mobile Header */
.mobile-header {
  display: flex; align-items: center; padding: 15px 20px;
  background: var(--bg-secondary); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 20;
}
.menu-trigger {
  background: none; border: none; color: var(--text-primary);
  font-size: 20px; margin-right: 15px; cursor: pointer;
}
.mobile-logo { font-weight: 700; font-size: 16px; }

/* Sidebar Overlay */
.sidebar-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 25;
}

.sidebar {
  width: 240px; flex-shrink: 0; background: var(--bg-secondary);
  border-right: 1px solid var(--border); display: flex; flex-direction: column;
  padding: 28px 0; position: fixed; height: 100vh; z-index: 30;
  transition: transform 0.3s ease; transform: translateX(-100%);
}
@media (min-width: 768px) {
  .sidebar { transform: translateX(0); position: sticky; top: 0; }
}
.sidebar--open { transform: translateX(0); }

.sidebar__logo { display: flex; align-items: center; gap: 10px; padding: 0 20px 28px; }
.logo-icon {
  width: 36px; height: 36px; border-radius: 10px; background: var(--accent);
  display: flex; align-items: center; justify-content: center; color: #000; font-weight: 700;
}
.logo-name { font-weight: 700; font-size: 15px; }
.logo-sub  { font-size: 11px; color: var(--text-secondary); }

.sidebar__nav { flex: 1; padding: 0 10px; }
.nav-item {
  display: flex; align-items: center; gap: 10px; padding: 12px;
  border-radius: 10px; margin-bottom: 5px; text-decoration: none;
  font-size: 14px; color: var(--text-secondary); transition: all 0.15s;
}
.nav-item i { width: 18px; text-align: center; }
.nav-item:hover { color: var(--text-primary); background: var(--bg-elevated); }
.nav-item.active {
  color: var(--accent); background: var(--accent-dim); font-weight: 600;
}

.sidebar__user { padding: 0 10px; }
.user-card {
  padding: 14px; border-radius: 10px; background: var(--bg-elevated);
  border: 1px solid var(--border);
}
.user-name   { font-size: 13px; font-weight: 600; }
.user-status { font-size: 11px; color: var(--text-secondary); margin-bottom: 10px; }
.btn-logout {
  width: 100%; padding: 8px; border-radius: 7px; background: transparent;
  border: 1px solid var(--border); color: var(--text-secondary); font-size: 12px;
}

.main-content { flex: 1; padding: 20px; width: 100%; }
@media (min-width: 768px) { .main-content { padding: 40px; } }

/* Utility to hide/show */
.md\:hidden { display: block; }
@media (min-width: 768px) { .md\:hidden { display: none; } }
</style>
