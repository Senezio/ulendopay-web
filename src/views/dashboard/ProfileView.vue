<template>
  <AppLayout>
    <div class="profile">

      <!-- Header -->
      <div class="profile__header fade-up">
        <h1>Profile</h1>
        <p>Your account details</p>
      </div>

      <!-- Hero card -->
      <div class="hero-card fade-up-1">
        <div class="hero-card__glow" />
        <div class="hero-card__inner">
          <div class="avatar">
            <span>{{ initial }}</span>
            <div class="avatar__ring" />
          </div>
          <div class="hero-card__info">
            <div class="hero-card__name">{{ auth.user?.name }}</div>
            <div class="hero-card__phone">{{ auth.user?.phone || '—' }}</div>
            <div class="hero-card__badge" :class="badgeClass">
              <span class="badge-dot" />
              {{ badgeLabel }}
            </div>
          </div>
        </div>

        <!-- Stats row -->
        <div class="hero-card__stats">
          <div class="stat">
            <div class="stat__label">Country</div>
            <div class="stat__value">{{ auth.user?.country_code || '—' }}</div>
          </div>
          <div class="stat-divider" />
          <div class="stat">
            <div class="stat__label">KYC</div>
            <div class="stat__value" :class="kycClass">{{ kycLabel }}</div>
          </div>
          <div class="stat-divider" />
          <div class="stat">
            <div class="stat__label">Account</div>
            <div class="stat__value" :class="accountClass">{{ accountLabel }}</div>
          </div>
        </div>
      </div>

      <!-- Details section -->
      <div class="section fade-up-2">
        <div class="section__title">Account Details</div>
        <div class="detail-list">
          <div v-for="field in fields" :key="field.label" class="detail-item">
            <div class="detail-item__icon">
              <i :class="field.icon" />
            </div>
            <div class="detail-item__body">
              <div class="detail-item__label">{{ field.label }}</div>
              <div class="detail-item__value">{{ field.value }}</div>
            </div>
            <div v-if="field.badge" class="detail-item__badge" :class="field.badgeClass">
              {{ field.badge }}
            </div>
          </div>
        </div>
      </div>

      <!-- Security section -->
      <div class="section fade-up-3">
        <div class="section__title">Security</div>
        <div class="detail-list">
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fas fa-lock" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">PIN</div>
              <div class="detail-item__value">{{ auth.user?.has_pin ? 'Set' : 'Not set' }}</div>
            </div>
            <div class="detail-item__badge" :class="auth.user?.has_pin ? 'badge--success' : 'badge--warn'">
              {{ auth.user?.has_pin ? 'Active' : 'Missing' }}
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fas fa-key" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Password</div>
              <div class="detail-item__value">{{ auth.user?.has_password ? 'Set' : 'Not set' }}</div>
            </div>
            <div class="detail-item__badge" :class="auth.user?.has_password ? 'badge--success' : 'badge--warn'">
              {{ auth.user?.has_password ? 'Active' : 'Missing' }}
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fas fa-mobile-alt" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Phone Verification</div>
              <div class="detail-item__value">{{ auth.user?.phone_verified ? 'Verified' : 'Not verified' }}</div>
            </div>
            <div class="detail-item__badge" :class="auth.user?.phone_verified ? 'badge--success' : 'badge--warn'">
              {{ auth.user?.phone_verified ? 'Done' : 'Pending' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Logout -->
      <div class="fade-up-3">
        <button class="logout-btn" @click="handleLogout">
          <i class="fas fa-sign-out-alt" />
          Sign Out
        </button>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const router = useRouter()

const initial = computed(() => auth.user?.name?.[0]?.toUpperCase() || '?')

// Hero badge
const badgeLabel = computed(() => auth.isKycVerified ? 'Verified Account' : 'Unverified Account')
const badgeClass = computed(() => auth.isKycVerified ? 'badge--verified' : 'badge--unverified')

// KYC
const kycLabel = computed(() => {
  const s = auth.user?.kyc_status
  if (s === 'verified')  return 'Verified'
  if (s === 'pending')   return 'Pending'
  if (s === 'rejected')  return 'Rejected'
  return 'None'
})
const kycClass = computed(() => {
  const s = auth.user?.kyc_status
  if (s === 'verified') return 'value--success'
  if (s === 'pending')  return 'value--warn'
  if (s === 'rejected') return 'value--danger'
  return ''
})

// Account status
const accountLabel = computed(() => {
  const s = auth.user?.status
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'
})
const accountClass = computed(() => {
  const s = auth.user?.status
  if (s === 'active')    return 'value--success'
  if (s === 'suspended') return 'value--danger'
  return ''
})

const fields = computed(() => [
  {
    label: 'Full Name',
    value: auth.user?.name || '—',
    icon:  'fas fa-user',
  },
  {
    label: 'Email Address',
    value: auth.user?.email || '—',
    icon:  'fas fa-envelope',
  },
  {
    label: 'Country',
    value: auth.user?.country_code || '—',
    icon:  'fas fa-globe-africa',
  },
])

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile {
  max-width: 480px;
  padding-bottom: 48px;
}

/* ── Header ──────────────────────────────────────────────────────────── */
.profile__header { margin-bottom: 24px; }
.profile__header h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.profile__header p {
  color: var(--text-secondary);
  font-size: 14px;
  margin-top: 4px;
}

/* ── Hero card ───────────────────────────────────────────────────────── */
.hero-card {
  position: relative;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  margin-bottom: 20px;
}

.hero-card__glow {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(232, 93, 4, 0.12) 0%, transparent 70%);
  pointer-events: none;
}

.hero-card__inner {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 20px 16px;
}

/* Avatar */
.avatar {
  position: relative;
  width: 64px;
  height: 64px;
  flex-shrink: 0;
}
.avatar span {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 18px;
  background: var(--accent);
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  position: relative;
  z-index: 1;
}
.avatar__ring {
  position: absolute;
  inset: -3px;
  border-radius: 21px;
  border: 2px solid rgba(232, 93, 4, 0.25);
  animation: pulse-ring 3s ease-in-out infinite;
}
@keyframes pulse-ring {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50%       { opacity: 1;   transform: scale(1.03); }
}

.hero-card__name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 2px;
}
.hero-card__phone {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}
.hero-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 99px;
  letter-spacing: 0.01em;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.badge--verified   { background: var(--success-bg); color: var(--success); }
.badge--unverified { background: var(--bg-elevated); color: var(--text-secondary); }

/* Stats row */
.hero-card__stats {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--border);
  padding: 14px 20px;
}
.stat {
  flex: 1;
  text-align: center;
}
.stat__label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.stat__value {
  font-size: 13px;
  font-weight: 600;
}
.stat-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
}

.value--success { color: var(--success); }
.value--warn    { color: #d97706; }
.value--danger  { color: var(--danger); }

/* ── Sections ────────────────────────────────────────────────────────── */
.section {
  margin-bottom: 20px;
}
.section__title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 10px;
  padding-left: 2px;
}

/* Detail list */
.detail-list {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.detail-item:last-child { border-bottom: none; }
.detail-item:active { background: var(--bg-alt); }

.detail-item__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 13px;
  flex-shrink: 0;
}
.detail-item__body {
  flex: 1;
  min-width: 0;
}
.detail-item__label {
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 2px;
}
.detail-item__value {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Inline badges */
.detail-item__badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 99px;
  flex-shrink: 0;
}
.badge--success { background: var(--success-bg); color: var(--success); }
.badge--warn    { background: #fffbeb; color: #d97706; }
.badge--danger  { background: var(--danger-bg); color: var(--danger); }

/* ── Logout ──────────────────────────────────────────────────────────── */
.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--bg-card);
  color: var(--danger);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  font-family: inherit;
}
.logout-btn:active {
  background: var(--danger-bg);
  border-color: var(--danger);
}
</style>
