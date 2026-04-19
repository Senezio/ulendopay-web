<template>
  <AppLayout>
    <div class="security-page">

      <div class="page-header fade-up">
        <h1>Security</h1>
        <p>Manage your active sessions and account activity</p>
      </div>

      <!-- Active Sessions -->
      <div class="section fade-up-1">
        <div class="section__header">
          <div class="section__title">Active Sessions</div>
          <button class="btn-revoke-all" @click="revokeAll" :disabled="actionLoading">
            Revoke all others
          </button>
        </div>
        <div class="detail-list">
          <div v-if="sessionsLoading" class="state-loading">
            <i class="fas fa-spinner fa-spin" /> Loading...
          </div>
          <div v-else-if="!sessions.length" class="state-empty">
            No active sessions
          </div>
          <div v-else v-for="session in sessions" :key="session.id" class="session-item">
            <div class="session-item__icon" :class="session.is_current ? 'icon--green' : 'icon--gray'">
              <i class="fas fa-mobile-screen" />
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
            <i class="fas fa-spinner fa-spin" /> Loading...
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
import { useUiStore } from '@/stores/ui'

const ui             = useUiStore()
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
  if (action.includes('login'))      return 'fas fa-right-to-bracket'
  if (action.includes('kyc'))        return 'fas fa-id-card'
  if (action.includes('withdrawal')) return 'fas fa-arrow-up-from-line'
  if (action.includes('topup'))      return 'fas fa-arrow-down-to-line'
  if (action.includes('pin'))        return 'fas fa-lock'
  if (action.includes('password'))   return 'fas fa-key'
  if (action.includes('2fa'))        return 'fas fa-shield-halved'
  return 'fas fa-circle-info'
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

onMounted(() => {
  loadSessions()
  loadLogs()
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
</style>
