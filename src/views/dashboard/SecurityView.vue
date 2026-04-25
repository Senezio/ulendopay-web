<template>
  <AppLayout>
    <div class="security-page">

      <div class="page-header fade-up">
        <h1>Security</h1>
        <p>Manage your active sessions and account activity</p>
      </div>

      <!-- Security Status -->
      <div class="section fade-up-1">
        <div class="section__title">Security Status</div>
        <div class="detail-list">
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-lock" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">PIN</div>
              <div class="detail-item__value">{{ auth.user?.has_pin ? 'Set' : 'Not set' }}</div>
            </div>
            <div class="status-badge" :class="auth.user?.has_pin ? 'badge--success' : 'badge--warn'">
              {{ auth.user?.has_pin ? 'Active' : 'Missing' }}
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-key" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Password</div>
              <div class="detail-item__value">{{ auth.user?.has_password ? 'Set' : 'Not set' }}</div>
            </div>
            <div class="status-badge" :class="auth.user?.has_password ? 'badge--success' : 'badge--warn'">
              {{ auth.user?.has_password ? 'Active' : 'Missing' }}
            </div>
          </div>
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-mobile-alt" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Phone Verification</div>
              <div class="detail-item__value">{{ auth.user?.phone_verified ? 'Verified' : 'Not verified' }}</div>
            </div>
            <div class="status-badge" :class="auth.user?.phone_verified ? 'badge--success' : 'badge--warn'">
              {{ auth.user?.phone_verified ? 'Done' : 'Pending' }}
            </div>
          </div>
        </div>
      </div>

      <!-- 2FA -->
      <div class="section fade-up-1">
        <div class="section__title">Two-Factor Authentication</div>
        <div class="detail-list">
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-shield-halved" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Authenticator App</div>
              <div class="detail-item__value">{{ twoFactorEnabled ? 'Enabled' : 'Disabled' }}</div>
            </div>
            <button
              class="status-badge"
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
            <button @click="show2FASetup = false"><i class="fa-sharp-duotone fa-solid fa-xmark" /></button>
          </div>
          <div class="modal__body">
            <div v-if="setupStep === 1">
              <p class="modal__desc">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
              <div class="qr-wrap">
                <img :src="qrCodeImage" alt="QR Code" class="qr-img" v-if="qrCodeImage" />
                <div v-else class="qr-loading"><i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" /></div>
              </div>
              <div class="secret-box">
                <div class="secret-label">Or enter manually:</div>
                <div class="secret-code">{{ twoFactorSecret }}</div>
              </div>
              <button class="btn-primary" @click="setupStep = 2">Next →</button>
            </div>
            <div v-else-if="setupStep === 2">
              <p class="modal__desc">Enter the 6-digit code from your authenticator app to confirm setup.</p>
              <input v-model="twoFactorCode" class="otp-input" placeholder="000000" maxlength="6" inputmode="numeric" />
              <div v-if="twoFactorError" class="modal__error">{{ twoFactorError }}</div>
              <button class="btn-primary" :disabled="twoFactorCode.length !== 6 || twoFactorLoading" @click="enableTwoFactor">
                <i v-if="twoFactorLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
                Confirm & Enable
              </button>
            </div>
            <div v-else-if="setupStep === 3">
              <div class="success-check"><i class="fa-sharp-duotone fa-solid fa-circle-check" /></div>
              <p class="modal__desc success">Two-factor authentication is now enabled.</p>
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
            <button @click="show2FADisable = false"><i class="fa-sharp-duotone fa-solid fa-xmark" /></button>
          </div>
          <div class="modal__body">
            <p class="modal__desc">Enter the 6-digit code from your authenticator app to disable 2FA.</p>
            <input v-model="twoFactorCode" class="otp-input" placeholder="000000" maxlength="6" inputmode="numeric" />
            <div v-if="twoFactorError" class="modal__error">{{ twoFactorError }}</div>
            <button class="btn-danger" :disabled="twoFactorCode.length !== 6 || twoFactorLoading" @click="disableTwoFactor">
              <i v-if="twoFactorLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
              Disable 2FA
            </button>
          </div>
        </div>
      </div>

      <!-- Active Sessions -->
      <div class="section fade-up-2">
        <div class="section__header">
          <div class="section__title">Active Sessions</div>
          <button class="btn-revoke-all" @click="revokeAll" :disabled="actionLoading">
            Revoke all others
          </button>
        </div>
        <div class="detail-list">
          <div v-if="sessionsLoading" class="state-loading">
            <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" /> Loading...
          </div>
          <div v-else-if="!sessions.length" class="state-empty">
            No active sessions
          </div>
          <div v-else v-for="session in sessions" :key="session.id" class="session-item">
            <div class="session-item__icon" :class="session.is_current ? 'icon--green' : 'icon--gray'">
              <i class="fa-sharp-duotone fa-solid fa-mobile-screen" />
            </div>
            <div class="session-item__body">
              <div class="session-item__name">
                {{ session.name }}
                <span v-if="session.is_current" class="current-badge">Current</span>
              </div>
              <div class="session-item__meta">
                Last active {{ formatDate(session.last_used_at) }}
              </div>
            </div>
            <button
              v-if="!session.is_current"
              class="btn-revoke"
              @click="revokeSession(session.id)"
              :disabled="actionLoading"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>

      <!-- Audit Log -->
      <div class="section fade-up-2">
        <div class="section__title">Account Activity</div>
        <div class="detail-list">
          <div v-if="logsLoading" class="state-loading">
            <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" /> Loading...
          </div>
          <div v-else-if="!logs.length" class="state-empty">
            No activity recorded yet
          </div>
          <div v-else v-for="(log, i) in logs" :key="i" class="log-item">
            <div class="log-item__icon" :class="logIconClass(log.action)">
              <i :class="logIcon(log.action)" />
            </div>
            <div class="log-item__body">
              <div class="log-item__action">{{ formatAction(log.action) }}</div>
              <div class="log-item__meta">
                <span v-if="log.ip_address">{{ log.ip_address }} ·</span>
                {{ formatDate(log.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const ui   = useUiStore()
const auth = useAuthStore()

// 2FA state
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

async function openSetup2FA() {
  show2FASetup.value   = true
  setupStep.value      = 1
  twoFactorCode.value  = ''
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
const sessions       = ref([])
const logs           = ref([])
const sessionsLoading = ref(false)
const logsLoading    = ref(false)
const actionLoading  = ref(false)

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function formatAction(action) {
  const map = {
    'login.success'        : 'Signed in',
    'login.failed'         : 'Failed sign in attempt',
    'kyc.submitted'        : 'KYC document submitted',
    'kyc.approved'         : 'KYC approved',
    'kyc.rejected'         : 'KYC rejected',
    'withdrawal.initiated' : 'Withdrawal initiated',
    'topup.initiated'      : 'Top up initiated',
    'pin.changed'          : 'PIN changed',
    'password.changed'     : 'Password changed',
    '2fa.enabled'          : 'Two-factor authentication enabled',
    '2fa.disabled'         : 'Two-factor authentication disabled',
  }
  return map[action] || action
}

function logIcon(action) {
  if (action.includes('login'))      return 'fa-sharp-duotone fa-solid fa-right-to-bracket'
  if (action.includes('kyc'))        return 'fa-sharp-duotone fa-solid fa-id-card'
  if (action.includes('withdrawal')) return 'fa-sharp-duotone fa-solid fa-arrow-up-from-line'
  if (action.includes('topup'))      return 'fa-sharp-duotone fa-solid fa-arrow-down-to-line'
  if (action.includes('pin'))        return 'fa-sharp-duotone fa-solid fa-lock'
  if (action.includes('password'))   return 'fa-sharp-duotone fa-solid fa-key'
  if (action.includes('2fa'))        return 'fa-sharp-duotone fa-solid fa-shield-halved'
  return 'fa-sharp-duotone fa-solid fa-circle-info'
}

function logIconClass(action) {
  if (action.includes('failed') || action.includes('rejected')) return 'icon--red'
  if (action.includes('login') || action.includes('approved'))  return 'icon--green'
  return 'icon--blue'
}

async function loadSessions() {
  sessionsLoading.value = true
  try {
    const { data } = await authApi.sessions()
    sessions.value = data.sessions
  } catch {
    ui.error('Failed to load sessions')
  } finally {
    sessionsLoading.value = false
  }
}

async function loadLogs() {
  logsLoading.value = true
  try {
    const { data } = await authApi.auditLog()
    logs.value = data.logs
  } catch {
    ui.error('Failed to load activity')
  } finally {
    logsLoading.value = false
  }
}

async function revokeSession(id) {
  actionLoading.value = true
  try {
    await authApi.revokeSession(id)
    ui.success('Session revoked')
    await loadSessions()
  } catch {
    ui.error('Failed to revoke session')
  } finally {
    actionLoading.value = false
  }
}

async function revokeAll() {
  actionLoading.value = true
  try {
    await authApi.revokeAllSessions()
    ui.success('All other sessions revoked')
    await loadSessions()
  } catch {
    ui.error('Failed to revoke sessions')
  } finally {
    actionLoading.value = false
  }
}

onMounted(async () => {
  loadSessions()
  loadLogs()
  try {
    const { data } = await authApi.twoFactorStatus()
    twoFactorEnabled.value = data.is_enabled
  } catch {}
})
</script>

<style scoped>
.security-page { max-width: 480px; padding-bottom: 48px; }

.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.page-header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.section { margin-bottom: 28px; }
.section__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.section__title {
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.08em;
}

.btn-revoke-all {
  font-size: 12px; color: var(--danger); background: none;
  border: none; cursor: pointer; font-weight: 600; padding: 0;
}
.btn-revoke-all:disabled { opacity: 0.5; cursor: not-allowed; }

.detail-list {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden;
}

.state-loading, .state-empty {
  padding: 24px; text-align: center;
  color: var(--text-muted); font-size: 13px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}

/* Sessions */
.session-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-bottom: 1px solid var(--border);
}
.session-item:last-child { border-bottom: none; }

.session-item__icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 15px;
}
.session-item__body { flex: 1; min-width: 0; }
.session-item__name {
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  display: flex; align-items: center; gap: 6px;
}
.session-item__meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.current-badge {
  font-size: 10px; font-weight: 700; padding: 2px 6px;
  background: var(--success-bg); color: var(--success);
  border-radius: 99px;
}

.btn-revoke {
  font-size: 12px; font-weight: 600; color: var(--danger);
  background: var(--danger-bg); border: none; border-radius: 8px;
  padding: 5px 12px; cursor: pointer; flex-shrink: 0;
}
.btn-revoke:disabled { opacity: 0.5; cursor: not-allowed; }

/* Audit log */
.log-item {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; border-bottom: 1px solid var(--border);
}
.log-item:last-child { border-bottom: none; }

.log-item__icon {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.log-item__body { flex: 1; min-width: 0; }
.log-item__action { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.log-item__meta { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.icon--green { background: var(--success-bg); color: var(--success); }
.icon--red   { background: var(--danger-bg); color: var(--danger); }
.icon--blue  { background: #eff6ff; color: #2563eb; }
.icon--gray  { background: var(--bg-elevated); color: var(--text-muted); }

/* Status badges */
.detail-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-bottom: 1px solid var(--border); }
.detail-item:last-child { border-bottom: none; }
.detail-item__icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 15px;
  background: var(--bg-elevated); color: var(--text-muted);
}
.detail-item__body { flex: 1; min-width: 0; }
.detail-item__label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.detail-item__value { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.status-badge {
  font-size: 11px; font-weight: 600;
  padding: 3px 9px; border-radius: 99px; flex-shrink: 0;
  border: none; cursor: pointer; font-family: inherit;
}
.badge--success { background: var(--success-bg); color: var(--success); }
.badge--warn    { background: var(--accent-dim); color: #d97706; }
.badge--danger  { background: var(--danger-bg); color: var(--danger); }

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
.qr-wrap { display: flex; justify-content: center; padding: 16px 0; }
.qr-img  { width: 200px; height: 200px; border-radius: 12px; border: 1px solid var(--border); }
.qr-loading { width: 200px; height: 200px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 24px; }
.secret-box { background: var(--bg-elevated); border-radius: 10px; padding: 12px; }
.secret-label { font-size: 11px; color: var(--text-muted); margin-bottom: 6px; }
.secret-code { font-family: monospace; font-size: 13px; font-weight: 700; word-break: break-all; color: var(--text-primary); }
.otp-input {
  width: 100%; padding: 14px; border: 1px solid var(--border);
  border-radius: 12px; font-size: 24px; font-weight: 700;
  text-align: center; letter-spacing: 0.3em; outline: none;
  font-family: monospace; background: var(--bg-card); color: var(--text-primary);
  box-sizing: border-box;
}
.otp-input:focus { border-color: var(--accent); }
.success-check { text-align: center; font-size: 48px; color: var(--success); }
.recovery-section { background: var(--bg-elevated); border-radius: 10px; padding: 14px; }
.recovery-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }
.recovery-codes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.recovery-code { font-family: monospace; font-size: 12px; font-weight: 700; background: var(--bg-card); padding: 6px 8px; border-radius: 6px; text-align: center; border: 1px solid var(--border); }
.btn-primary {
  width: 100%; padding: 14px; background: var(--accent); color: var(--text-inverse);
  border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger {
  width: 100%; padding: 14px; background: var(--danger); color: var(--text-inverse);
  border: none; border-radius: 12px; font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
@media (min-width: 641px) {
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 16px; }
}
</style>
