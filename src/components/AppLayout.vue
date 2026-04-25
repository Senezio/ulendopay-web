<template>
  <div class="layout">

    <header class="top-nav">
      <div class="top-nav__left">
        <button class="nav-icon-btn hamburger-btn" @click="isMenuOpen = true">
          <i class="fa-sharp-duotone fa-solid fa-bars"></i>
        </button>
        <span class="top-nav__title">{{ pageTitle }}</span>
      </div>
      <div class="avatar-menu-wrap">
        <button class="nav-icon-btn nav-icon-btn--avatar top-nav__avatar" @click="isAvatarMenuOpen = !isAvatarMenuOpen">
          <span class="avatar-initials">{{ initials }}</span>
        </button>
        <Transition name="dropdown">
          <div v-if="isAvatarMenuOpen" class="avatar-dropdown" v-click-outside="() => isAvatarMenuOpen = false">
            <div class="avatar-dropdown__user">
              <div class="avatar-dropdown__name">{{ auth.user?.name }}</div>
              <div class="avatar-dropdown__email">{{ auth.user?.email }}</div>
            </div>
            <div class="avatar-dropdown__divider" />
            <div class="avatar-dropdown__item">
              <i class="fa-sharp-duotone fa-solid fa-circle-half-stroke" />
              <span>Theme</span>
              <div class="theme-toggle">
                <button
                  v-for="t in themeOptions" :key="t.value"
                  class="theme-btn"
                  :class="{ active: ui.theme === t.value }"
                  @click.stop="ui.setTheme(t.value)"
                  :title="t.label"
                >
                  <i :class="t.icon" />
                </button>
              </div>
            </div>
            <div class="avatar-dropdown__divider" />
            <button class="avatar-dropdown__item avatar-dropdown__item--danger" @click="handleLogout">
              <i class="fa-sharp-duotone fa-solid fa-arrow-right-from-bracket" />
              <span>Sign Out</span>
            </button>
          </div>
        </Transition>
      </div>
    </header>

    <div v-if="isMenuOpen" class="sidebar-overlay" @click="isMenuOpen = false"></div>

    <aside class="sidebar" :class="{ 'sidebar--open': isMenuOpen }">
      <div class="sidebar__header">
        <img src="/logo.png" alt="UlendoPay" class="sidebar__logo" />
        <button class="sidebar__close" @click="isMenuOpen = false">
          <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="sidebar__user">
        <div class="sidebar__avatar">{{ initials }}</div>
        <div>
          <div class="sidebar__name">{{ auth.user?.name }}</div>
          <div class="sidebar__status" :class="auth.isKycVerified ? 'status--verified' : 'status--unverified'">
            <i :class="auth.isKycVerified ? 'fa-sharp-duotone fa-solid fa-circle-check' : 'fa-sharp-duotone fa-solid fa-circle'"></i>
            {{ auth.isKycVerified ? 'Verified' : 'Unverified' }}
          </div>
        </div>
      </div>

      <nav class="sidebar__nav">
        <RouterLink
          v-for="item in sidebarNav"
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

      <button class="sidebar__logout" @click="handleLogout">
        <i class="fa-sharp-duotone fa-solid fa-arrow-right-from-bracket"></i>
        Sign out
      </button>
    </aside>

    <div class="page-wrapper">
      <main class="main-content">
        <slot />
      </main>
    </div>

    <nav class="bottom-tabs">
      <RouterLink
        v-for="item in primaryNav"
        :key="item.to"
        :to="item.to"
        class="tab-item"
        :class="{ active: route.path === item.to }"
      >
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const ui     = useUiStore()
const isMenuOpen       = ref(false)
const isAvatarMenuOpen = ref(false)

const themeOptions = [
  { value: 'system', label: 'System', icon: 'fa-sharp-duotone fa-solid fa-circle-half-stroke' },
  { value: 'light',  label: 'Light',  icon: 'fa-sharp-duotone fa-solid fa-sun' },
  { value: 'dark',   label: 'Dark',   icon: 'fa-sharp-duotone fa-solid fa-moon' },
]

const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside)
  }
}

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

const pageTitle = computed(() => route.meta?.title || '')

const primaryNav = [
  { to: '/dashboard', icon: 'fa-sharp-duotone fa-solid fa-house',             label: 'Home' },
  { to: '/send',      icon: 'fa-sharp-duotone fa-solid fa-paper-plane',       label: 'Send' },
  { to: '/history',   icon: 'fa-sharp-duotone fa-solid fa-clock-rotate-left', label: 'History' },
  { to: '/rewards',   icon: 'fa-sharp-duotone fa-solid fa-gift',              label: 'Rewards' },
  { to: '/profile',   icon: 'fa-sharp-duotone fa-solid fa-user',              label: 'Profile' },
]

const sidebarNav = [
  { to: '/dashboard', icon: 'fa-sharp-duotone fa-solid fa-house',             label: 'Home' },
  { to: '/topup',     icon: 'fa-duotone fa-solid fa-wallet',                  label: 'Top Up' },
  { to: '/send',      icon: 'fa-sharp-duotone fa-solid fa-paper-plane',       label: 'Send' },
  { to: '/withdraw',  icon: 'fa-duotone fa-solid fa-money-bill-transfer',     label: 'Withdraw' },
  { to: '/rewards',   icon: 'fa-sharp-duotone fa-solid fa-gift',              label: 'Rewards' },
  { to: '/history',   icon: 'fa-sharp-duotone fa-solid fa-clock-rotate-left', label: 'History' },
  { to: '/kyc',       icon: 'fa-sharp-duotone fa-solid fa-id-card',           label: 'KYC Verification' },
  { to: '/security',  icon: 'fa-sharp-duotone fa-solid fa-shield-halved',     label: 'Security' },
]

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--bg);
}

.top-nav {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

.top-nav__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-nav__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.top-nav__avatar {
  display: none;
}

.nav-icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--bg-elevated);
  border: none;
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: background 0.15s;
}
.nav-icon-btn:hover { background: var(--border); }

.nav-icon-btn--avatar { background: var(--accent); }
.avatar-initials {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.03em;
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 25;
  backdrop-filter: blur(2px);
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 280px;
  height: 100vh;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  z-index: 30;
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow-y: auto;
}
.sidebar--open { transform: translateX(0); }

.sidebar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.sidebar__logo { height: 48px; width: auto; }
.sidebar__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--bg-elevated);
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--border);
}
.sidebar__avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--accent);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sidebar__name { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.sidebar__status {
  font-size: 12px;
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}
.status--verified   { color: var(--success); }
.status--unverified { color: var(--text-muted); }

.sidebar__nav {
  flex: 1;
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.15s;
}
.nav-item i { width: 18px; text-align: center; font-size: 15px; }
.nav-item:hover { color: var(--text-primary); background: var(--bg-elevated); }
.nav-item.active { color: var(--accent); background: var(--accent-dim); font-weight: 600; }

.sidebar__logout {
  margin: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--danger);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.15s;
}
.sidebar__logout:hover { background: var(--danger-bg); }

.page-wrapper {
  flex: 1;
  display: flex;
  width: 100%;
}

.main-content {
  flex: 1;
  width: 100%;
  padding: 20px 16px;
  padding-bottom: 80px;
  max-width: 480px;
  margin: 0 auto;
}

.bottom-tabs {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: var(--bg-card);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 20;
  padding-bottom: env(safe-area-inset-bottom);
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  text-decoration: none;
  color: var(--text-muted);
  font-size: 10px;
  font-weight: 600;
  padding: 8px 0;
  transition: color 0.15s;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tab-item i { font-size: 18px; transition: transform 0.15s; }
.tab-item:hover { color: var(--text-secondary); }
.tab-item.active { color: var(--accent); }
.tab-item.active i { transform: translateY(-1px); }

/* Avatar dropdown */
.avatar-menu-wrap { position: relative; }

.avatar-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 220px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 100;
  overflow: hidden;
}

.avatar-dropdown__user {
  padding: 14px 16px;
}
.avatar-dropdown__name  { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.avatar-dropdown__email { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.avatar-dropdown__divider { height: 1px; background: var(--border); }

.avatar-dropdown__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: background 0.15s;
}
.avatar-dropdown__item:hover { background: var(--bg-elevated); }
.avatar-dropdown__item i { width: 16px; text-align: center; color: var(--text-muted); }
.avatar-dropdown__item span { flex: 1; }
.avatar-dropdown__item--danger { color: var(--danger); }
.avatar-dropdown__item--danger i { color: var(--danger); }
.avatar-dropdown__item--danger:hover { background: var(--danger-bg); }

/* Theme toggle inside dropdown */
.theme-toggle {
  display: flex; gap: 3px;
  background: var(--bg-elevated);
  border-radius: 8px; padding: 2px;
  border: 1px solid var(--border);
}
.theme-btn {
  width: 26px; height: 26px;
  border-radius: 6px; border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, color 0.15s;
}
.theme-btn.active {
  background: var(--bg-card);
  color: var(--accent);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }

@media (min-width: 1024px) {
  .layout {
    flex-direction: row;
    height: 100vh;
    overflow: hidden;
  }

  .top-nav {
    display: none;
  }

  .page-wrapper {
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    position: relative;
    transform: translateX(0);
    width: 280px;
    height: 100vh;
    flex-shrink: 0;
  }

  .sidebar-overlay, .sidebar__close, .bottom-tabs {
    display: none !important;
  }

  .main-content {
    flex: 1;
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 32px;
    overflow-y: auto;
    padding-bottom: 32px;
  }
}
</style>
