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

      <!-- Account Numbers -->
      <div class="section fade-up-3">
        <div class="section__title">Account Numbers</div>
        <div class="detail-list">
          <div v-if="accountsLoading" class="detail-item">
            <div class="detail-item__icon"><i class="fas fa-spinner fa-spin" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Loading...</div>
            </div>
          </div>
          <div v-else-if="!accounts.length" class="detail-item">
            <div class="detail-item__icon"><i class="fas fa-wallet" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">No accounts found</div>
            </div>
          </div>
          <div v-for="acc in accounts" :key="acc.account_number" class="detail-item">
            <div class="detail-item__icon"><i class="fas fa-building-columns" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">{{ acc.currency }} Wallet</div>
              <div class="detail-item__value account-number">{{ formatAccountNumber(acc.account_number) }}</div>
            </div>
            <button class="copy-btn" @click="copyAccount(acc.account_number)" :title="'Copy account number'">
              <i :class="copied === acc.account_number ? 'fas fa-check' : 'fas fa-copy'" />
            </button>
          </div>
        </div>
      </div>

      <!-- 2FA Section -->
      <div class="section fade-up-3">
        <div class="section__title">Two-Factor Authentication</div>
        <div class="detail-list">
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fas fa-shield-halved" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Authenticator App</div>
              <div class="detail-item__value">{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</div>
            </div>
            <button
              class="detail-item__badge"
              :class="twoFactorEnabled ? 'badge--danger' : 'badge--success'"
              @click="twoFactorEnabled ? openDisable2FA() : openSetup2FA()"
            >
              {{ twoFactorEnabled ? 'Disable' : 'Enable' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 2FA Setup Modal -->
      <div v-if="show2FASetup" class="modal-overlay" @click.self="show2FASetup = false">
        <div class="modal">
          <div class="modal__header">
            <h3>Set Up Two-Factor Authentication</h3>
            <button @click="show2FASetup = false"><i class="fas fa-xmark" /></button>
          </div>
          <div class="modal__body">
            <div v-if="setupStep === 1">
              <p class="modal__desc">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
              <div class="qr-wrap">
                <img :src="qrCodeImage" alt="QR Code" class="qr-img" v-if="qrCodeImage" />
                <div v-else class="qr-loading"><i class="fas fa-spinner fa-spin" /></div>
              </div>
              <div class="secret-box">
                <div class="secret-label">Or enter manually:</div>
                <div class="secret-code">{{ twoFactorSecret }}</div>
              </div>
              <button class="btn-primary" @click="setupStep = 2">Next →</button>
            </div>
            <div v-else-if="setupStep === 2">
              <p class="modal__desc">Enter the 6-digit code from your authenticator app to confirm setup.</p>
              <input
                v-model="twoFactorCode"
                class="otp-input"
                placeholder="000000"
                maxlength="6"
                inputmode="numeric"
              />
              <div v-if="twoFactorError" class="modal__error">{{ twoFactorError }}</div>
              <button class="btn-primary" :disabled="twoFactorCode.length !== 6 || twoFactorLoading" @click="enableTwoFactor">
                <i v-if="twoFactorLoading" class="fas fa-spinner fa-spin" />
                Confirm & Enable
              </button>
            </div>
            <div v-else-if="setupStep === 3">
              <div class="success-check"><i class="fas fa-circle-check" /></div>
              <p class="modal__desc success">Two-factor authentication is now enabled on your account.</p>
              <div class="recovery-section">
                <div class="recovery-label">Save your recovery codes:</div>
                <div class="recovery-codes">
                  <div v-for="code in recoveryCodes" :key="code" class="recovery-code">{{ code }}</div>
                </div>
              </div>
              <button class="btn-primary" @click="show2FASetup = false; setupStep = 1">Done</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 2FA Disable Modal -->
      <div v-if="show2FADisable" class="modal-overlay" @click.self="show2FADisable = false">
        <div class="modal">
          <div class="modal__header">
            <h3>Disable Two-Factor Authentication</h3>
            <button @click="show2FADisable = false"><i class="fas fa-xmark" /></button>
          </div>
          <div class="modal__body">
            <p class="modal__desc">Enter the 6-digit code from your authenticator app to disable 2FA.</p>
            <input
              v-model="twoFactorCode"
              class="otp-input"
              placeholder="000000"
              maxlength="6"
              inputmode="numeric"
            />
            <div v-if="twoFactorError" class="modal__error">{{ twoFactorError }}</div>
            <button class="btn-danger" :disabled="twoFactorCode.length !== 6 || twoFactorLoading" @click="disableTwoFactor">
              <i v-if="twoFactorLoading" class="fas fa-spinner fa-spin" />
              Disable 2FA
            </button>
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/auth'

const auth   = useAuthStore()
const router = useRouter()

// Account numbers
const accounts       = ref([])
const accountsLoading = ref(false)
const copied         = ref(null)

// 2FA
const twoFactorEnabled = ref(false)
const show2FASetup     = ref(false)
const show2FADisable   = ref(false)
const setupStep        = ref(1)
const twoFactorSecret  = ref('')
const qrCodeImage      = ref('')
const twoFactorCode    = ref('')
const twoFactorError   = ref('')
const twoFactorLoading = ref(false)
const recoveryCodes    = ref([])

function formatAccountNumber(num) {
  return num ? num.toString().replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') : '—'
}

async function copyAccount(num) {
  await navigator.clipboard.writeText(num)
  copied.value = num
  setTimeout(() => copied.value = null, 2000)
}

async function openSetup2FA() {
  show2FASetup.value = true
  setupStep.value    = 1
  twoFactorCode.value = ''
  twoFactorError.value = ''
  try {
    const { data } = await authApi.twoFactorSetup()
    twoFactorSecret.value = data.secret
    recoveryCodes.value   = data.recovery_codes
    qrCodeImage.value     = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.qr_code_url)}`
  } catch {
    twoFactorError.value = 'Failed to load setup. Please try again.'
  }
}

function openDisable2FA() {
  show2FADisable.value = true
  twoFactorCode.value  = ''
  twoFactorError.value = ''
}

async function enableTwoFactor() {
  twoFactorLoading.value = true
  twoFactorError.value   = ''
  try {
    await authApi.twoFactorEnable(twoFactorCode.value)
    twoFactorEnabled.value = true
    setupStep.value        = 3
    twoFactorCode.value    = ''
  } catch (e) {
    twoFactorError.value = e.response?.data?.message || 'Invalid code. Please try again.'
  } finally {
    twoFactorLoading.value = false
  }
}

async function disableTwoFactor() {
  twoFactorLoading.value = true
  twoFactorError.value   = ''
  try {
    await authApi.twoFactorDisable(twoFactorCode.value)
    twoFactorEnabled.value = false
    show2FADisable.value   = false
    twoFactorCode.value    = ''
  } catch (e) {
    twoFactorError.value = e.response?.data?.message || 'Invalid code. Please try again.'
  } finally {
    twoFactorLoading.value = false
  }
}

onMounted(async () => {
  accountsLoading.value = true
  try {
    const [accRes, tfaRes] = await Promise.all([
      authApi.accountNumbers(),
      authApi.twoFactorStatus(),
    ])
    accounts.value       = accRes.data.accounts
    twoFactorEnabled.value = tfaRes.data.is_enabled
  } catch (e) {
    console.error(e)
  } finally {
    accountsLoading.value = false
  }
})

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

/* Account number */
.account-number { font-family: monospace; font-size: 15px; font-weight: 700; letter-spacing: 0.05em; }
.copy-btn {
  width: 32px; height: 32px; border: 1px solid var(--border);
  border-radius: 8px; background: var(--bg-elevated);
  color: var(--text-secondary); cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end; justify-content: center; z-index: 100;
}
.modal {
  background: var(--bg-card); border-radius: 20px 20px 0 0;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  padding-bottom: env(safe-area-inset-bottom);
}
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 20px 0; margin-bottom: 16px;
}
.modal__header h3 { font-size: 16px; font-weight: 700; }
.modal__header button {
  background: var(--bg-elevated); border: none; width: 30px; height: 30px;
  border-radius: 8px; cursor: pointer; color: var(--text-secondary);
  font-size: 14px; display: flex; align-items: center; justify-content: center;
}
.modal__body { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 16px; }
.modal__desc { font-size: 14px; color: var(--text-secondary); line-height: 1.5; }
.modal__desc.success { color: var(--success); text-align: center; font-weight: 600; }
.modal__error { font-size: 13px; color: var(--danger); }

/* QR code */
.qr-wrap { display: flex; justify-content: center; padding: 16px 0; }
.qr-img  { width: 200px; height: 200px; border-radius: 12px; border: 1px solid var(--border); }
.qr-loading { width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 24px; }

/* Secret */
.secret-box { background: var(--bg-elevated); border-radius: 10px; padding: 12px; }
.secret-label { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
.secret-code { font-family: monospace; font-size: 13px; font-weight: 700; word-break: break-all; color: var(--text-primary); }

/* OTP input */
.otp-input {
  width: 100%; padding: 14px; border: 1px solid var(--border);
  border-radius: 12px; font-size: 24px; font-weight: 700;
  text-align: center; letter-spacing: 0.3em; outline: none;
  font-family: monospace; background: var(--bg-card); color: var(--text-primary);
  box-sizing: border-box;
}
.otp-input:focus { border-color: var(--accent); }

/* Success check */
.success-check { text-align: center; font-size: 48px; color: var(--success); }

/* Recovery codes */
.recovery-section { background: var(--bg-elevated); border-radius: 10px; padding: 14px; }
.recovery-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
.recovery-codes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.recovery-code { font-family: monospace; font-size: 12px; font-weight: 700; background: var(--bg-card); padding: 6px 8px; border-radius: 6px; text-align: center; border: 1px solid var(--border); }

/* Buttons */
.btn-primary {
  width: 100%; padding: 14px; background: var(--accent); color: #fff;
  border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger {
  width: 100%; padding: 14px; background: var(--danger); color: #fff;
  border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

@media (min-width: 641px) {
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 16px; }
}
</style>
