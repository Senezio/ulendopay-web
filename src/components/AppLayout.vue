<template>
  <div class="layout">

    <!-- Top Navbar -->
    <header class="top-nav">
      <!-- Hamburger: mobile only -->
      <button class="nav-icon-btn hamburger-btn" @click="isMenuOpen = true">
        <i class="fa-sharp-duotone fa-solid fa-bars"></i>
      </button>
      <RouterLink to="/profile" class="nav-icon-btn nav-icon-btn--avatar">
        <span class="avatar-initials">{{ initials }}</span>
      </RouterLink>
    </header>

    <!-- Sidebar Overlay: mobile only -->
    <div v-if="isMenuOpen" class="sidebar-overlay" @click="isMenuOpen = false"></div>

    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'sidebar--open': isMenuOpen }">
      <div class="sidebar__header">
        <img src="/logo.png" alt="UlendoPay" class="sidebar__logo" />
        <!-- Close button: mobile only -->
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

    <!-- Page wrapper: sidebar + content side by side on desktop -->
    <div class="page-wrapper">
      <!-- Main Content -->
      <main class="main-content">
        <slot />
      </main>
    </div>

    <!-- Bottom Tab Bar: mobile only -->
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

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()
const isMenuOpen = ref(false)

const initials = computed(() => {
  const name = auth.user?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
})

// Mobile bottom tabs — quick-access actions only
const primaryNav = [
  { to: '/dashboard', icon: 'fa-sharp-duotone fa-solid fa-house',             label: 'Home' },
  { to: '/send',      icon: 'fa-sharp-duotone fa-solid fa-paper-plane',       label: 'Send' },
  { to: '/history',   icon: 'fa-sharp-duotone fa-solid fa-clock-rotate-left', label: 'History' },
  { to: '/rewards',   icon: 'fa-sharp-duotone fa-solid fa-gift',              label: 'Rewards' },
  { to: '/profile',   icon: 'fa-sharp-duotone fa-solid fa-user',              label: 'Profile' },
]

// Sidebar nav — full merged list, used by both mobile drawer and desktop sidebar
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

/* ── Top Navbar ─────────────────────────────── */
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

/* ── Sidebar Overlay: mobile only ───────────── */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 25;
  backdrop-filter: blur(2px);
}

/* ── Sidebar ────────────────────────────────── */
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

/* ── Page Wrapper ───────────────────────────── */
.page-wrapper {
  flex: 1;
  display: flex;
}

/* ── Main Content ───────────────────────────── */
.main-content {
  flex: 1;
  padding: 20px 16px;
  padding-bottom: 80px; /* space for bottom tabs on mobile */
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
}

/* ── Bottom Tab Bar ─────────────────────────── */
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

/* ══════════════════════════════════════════════
   DESKTOP — 1024px and up
   ══════════════════════════════════════════════ */
@media (min-width: 1024px) {

  /* Layout becomes a column: top-nav on top, then row below */
  .layout {
    flex-direction: column;
  }

  /* Fix 3: Top nav — hide logo, push avatar to the right */
  .top-nav {
    max-width: none;
    width: 100%;
    justify-content: flex-end;
  }

  .top-nav__logo {
    display: none;
  }

  /* Hamburger not needed — sidebar is always visible */
  .hamburger-btn {
    display: none;
  }

  /* Fix 1: Sidebar is part of layout flow — not fixed/sticky */
  /* position: relative takes it out of the overlay stack       */
  /* and lets the flex row in .page-wrapper own its space       */
  .sidebar {
    position: relative;
    top: 0;
    height: auto;
    min-height: calc(100vh - 56px); /* fill viewport height */
    transform: translateX(0);
    flex-shrink: 0;
    z-index: 10;
  }

  /* Fix 2: Lock sidebar width so flex row doesn't feel loose */
  .sidebar {
    width: 280px;
  }

  /* Overlay never needed on desktop */
  .sidebar-overlay {
    display: none !important;
  }

  /* Close button hidden — sidebar is always open on desktop */
  .sidebar__close {
    display: none;
  }

  /* Page wrapper becomes a row: sidebar + content side by side */
  .page-wrapper {
    flex-direction: row;
    align-items: flex-start;
  }

  /* Fix 2: Main content claims all remaining space */
  .main-content {
    flex: 1;
    max-width: none;
    margin: 0;
    padding: 28px 32px;
    padding-bottom: 28px;
  }

  /* Bottom tabs are a mobile pattern — hidden on desktop */
  .bottom-tabs {
    display: none;
  }
}
</style>
