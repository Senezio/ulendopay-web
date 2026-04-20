<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div>
          <h1>Fraud Alerts</h1>
          <p>Suspicious activity requiring review</p>
        </div>
      </div>

      <div class="admin-table-card">
        <div class="table-toolbar">
          <select v-model="statusFilter" @change="load">
            <option value="">All</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="cleared">Cleared</option>
            <option value="confirmed">Confirmed Fraud</option>
          </select>
          <button class="btn-icon" @click="load"><i class="fa-sharp-duotone fa-solid fa-rotate"></i></button>
        </div>

        <div v-if="loading" class="table-loading">
          <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i> Loading...
        </div>

        <div v-else-if="alerts?.data?.length" class="table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Rules Triggered</th>
              <th>Risk Score</th>
              <th>Transaction</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="alert in alerts.data" :key="alert.id">
              <tr :class="{ 'row--expanded': expanded === alert.id }">
                <td>
                  <div class="cell-user__name">{{ alert.user?.name }}</div>
                  <div class="cell-user__meta">{{ alert.user?.email }}</div>
                </td>
                <td>
                  <div class="rules-list">
                    <span
                      v-for="rule in parseRules(alert.rule_triggered)"
                      :key="rule"
                      class="rule-tag"
                    >{{ rule }}</span>
                  </div>
                </td>
                <td>
                  <div class="risk-score" :class="riskClass(alert.risk_score)">
                    {{ alert.risk_score }}
                  </div>
                </td>
                <td>
                  <span v-if="alert.transaction" class="mono-ref">
                    {{ alert.transaction?.reference_number }}
                  </span>
                  <span v-else class="cell-date">—</span>
                </td>
                <td class="cell-date">{{ formatDate(alert.created_at) }}</td>
                <td>
                  <span class="badge" :class="alertBadge(alert.status)">{{ alert.status }}</span>
                </td>
                <td>
                  <div class="cell-actions">
                    <button
                      class="btn-action btn-action--view"
                      @click="toggleExpand(alert.id)"
                      :title="expanded === alert.id ? 'Hide details' : 'View details'"
                    >
                      <i :class="expanded === alert.id ? 'fa-sharp-duotone fa-solid fa-chevron-up' : 'fa-sharp-duotone fa-solid fa-chevron-down'"></i>
                    </button>
                    <template v-if="alert.status === 'new' || alert.status === 'reviewing'">
                      <button class="btn-action btn-action--success" @click="openAction(alert, 'clear')" title="Clear — not fraud">
                        <i class="fa-sharp-duotone fa-solid fa-check"></i>
                      </button>
                      <button class="btn-action btn-action--danger" @click="openAction(alert, 'confirm')" title="Confirm fraud">
                        <i class="fa-sharp-duotone fa-solid fa-skull"></i>
                      </button>
                    </template>
                  </div>
                </td>
              </tr>

              <!-- Expanded context row -->
              <tr v-if="expanded === alert.id" class="context-row">
                <td colspan="7">
                  <div class="context-panel">
                    <div class="context-panel__title">
                      <i class="fa-sharp-duotone fa-solid fa-magnifying-glass-chart"></i>
                      Fraud Signal Details
                    </div>
                    <div class="context-rules">
                      <div
                        v-for="(rule, i) in parseContext(alert.context)"
                        :key="i"
                        class="context-rule"
                      >
                        <div class="context-rule__header">
                          <span class="rule-tag">{{ rule.rule }}</span>
                          <span class="context-rule__score">+{{ rule.score }} pts</span>
                        </div>
                        <div class="context-rule__detail">{{ rule.detail }}</div>
                      </div>
                    </div>
                    <div v-if="alert.resolution_notes" class="context-notes">
                      <strong>Resolution notes:</strong> {{ alert.resolution_notes }}
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        </div>

        <div v-else class="table-empty">
          <i class="fa-sharp-duotone fa-solid fa-shield-halved"></i>
          <p>No fraud alerts</p>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <div v-if="actionModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal__header">
          <h3>{{ actionModal.type === 'confirm' ? 'Confirm Fraud' : 'Clear Alert' }}</h3>
          <button class="modal__close" @click="closeModal">
            <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal__body">
          <div class="modal-alert-summary">
            <div class="modal-field">
              <span class="modal-field__label">User</span>
              <span class="modal-field__value">{{ actionModal.alert.user?.name }}</span>
            </div>
            <div class="modal-field">
              <span class="modal-field__label">Risk Score</span>
              <span class="risk-score" :class="riskClass(actionModal.alert.risk_score)">
                {{ actionModal.alert.risk_score }}
              </span>
            </div>
            <div class="modal-field">
              <span class="modal-field__label">Rules</span>
              <span class="modal-field__value">{{ actionModal.alert.rule_triggered }}</span>
            </div>
          </div>

          <div v-if="actionModal.type === 'confirm'" class="modal-warning">
            <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>
            This will immediately suspend the user and block all their transactions.
          </div>

          <div class="modal-notes">
            <label>Resolution Notes <span class="required">*</span></label>
            <textarea
              v-model="actionNotes"
              :placeholder="actionModal.type === 'confirm' ? 'Describe the fraud pattern observed...' : 'Explain why this was cleared...'"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn-ghost" @click="closeModal">Cancel</button>
          <button
            v-if="actionModal.type === 'confirm'"
            class="btn-danger"
            :disabled="!actionNotes || actionLoading"
            @click="confirmAction"
          >
            <i v-if="actionLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
            <i v-else class="fa-sharp-duotone fa-solid fa-skull"></i>
            Confirm Fraud & Suspend
          </button>
          <button
            v-else
            class="btn-success"
            :disabled="!actionNotes || actionLoading"
            @click="confirmAction"
          >
            <i v-if="actionLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
            <i v-else class="fa-sharp-duotone fa-solid fa-check"></i>
            Clear Alert
          </button>
        </div>
      </div>
    </div>

  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui           = useUiStore()
const alerts       = ref(null)
const statusFilter = ref('new')
const loading      = ref(false)
const expanded     = ref(null)
const actionModal  = ref(null)
const actionNotes  = ref('')
const actionLoading = ref(false)

function riskClass(score) {
  return score >= 80 ? 'risk--high' : score >= 50 ? 'risk--medium' : 'risk--low'
}

function alertBadge(s) {
  return { new: 'badge--red', reviewing: 'badge--amber', cleared: 'badge--green', confirmed: 'badge--red' }[s] || 'badge--gray'
}

function parseRules(ruleString) {
  if (!ruleString) return []
  return ruleString.split(', ').map(r => r.trim())
}

function parseContext(context) {
  if (!context) return []
  if (typeof context === 'string') {
    try { return JSON.parse(context) } catch { return [] }
  }
  return context
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'
}

function toggleExpand(id) {
  expanded.value = expanded.value === id ? null : id
}

function openAction(alert, type) {
  actionModal.value = { alert, type }
  actionNotes.value = ''
}

function closeModal() {
  actionModal.value = null
  actionNotes.value = ''
}

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.fraudAlerts({ status: statusFilter.value })
    alerts.value = data
  } finally {
    loading.value = false
  }
}

async function confirmAction() {
  if (!actionNotes.value) return
  actionLoading.value = true
  try {
    if (actionModal.value.type === 'confirm') {
      await adminApi.fraudConfirm(actionModal.value.alert.id, actionNotes.value)
      ui.success('Fraud confirmed — user suspended')
    } else {
      await adminApi.fraudClear(actionModal.value.alert.id, actionNotes.value)
      ui.success('Alert cleared')
    }
    closeModal()
    await load()
  } catch {
    ui.error('Action failed')
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 16px; max-width: 1200px; }
@media (min-width: 768px) { .admin-page { padding: 32px; } }
.admin-page__header { margin-bottom: 24px; }
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }

.admin-table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }

.table-toolbar {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
}
.table-toolbar select {
  padding: 8px 12px; border: 1px solid var(--border);
  border-radius: 10px; font-size: 13px; background: var(--bg-card);
  outline: none; cursor: pointer;
}
.btn-icon {
  width: 32px; height: 32px; background: #f8fafc;
  border: 1px solid var(--border); border-radius: 8px;
  color: #64748b; cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.btn-icon:hover { border-color: var(--accent); color: var(--accent); }

.table-loading {
  padding: 48px; text-align: center; color: #94a3b8;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}

.table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.admin-table { width: 100%; border-collapse: collapse; min-width: 700px; }
.admin-table th {
  padding: 12px 20px; text-align: left; font-size: 11px;
  font-weight: 700; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.05em; background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}
.admin-table td {
  padding: 14px 20px; border-bottom: 1px solid #f8fafc;
  font-size: 14px; color: #374151; vertical-align: top;
}
.admin-table tr:last-child td { border-bottom: none; }
.row--expanded td { background: #fefce8; }

.cell-user__name { font-weight: 600; color: #111827; font-size: 13px; }
.cell-user__meta { font-size: 12px; color: #9ca3af; }

.rules-list { display: flex; flex-wrap: wrap; gap: 4px; }
.rule-tag {
  background: #f1f5f9; color: #475569;
  padding: 3px 8px; border-radius: 6px;
  font-size: 11px; font-weight: 600; font-family: monospace;
}

.risk-score {
  display: inline-block; padding: 4px 10px;
  border-radius: 8px; font-weight: 800; font-size: 14px;
}
.risk--high   { background: #fef2f2; color: #dc2626; }
.risk--medium { background: var(--accent-dim); color: #d97706; }
.risk--low    { background: #f0fdf4; color: #16a34a; }

.mono-ref {
  font-family: monospace; font-size: 12px;
  background: #f8fafc; padding: 3px 8px; border-radius: 6px;
}
.cell-date { font-size: 13px; color: #94a3b8; }

.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: var(--accent-dim); color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }

.cell-actions { display: flex; gap: 6px; }
.btn-action {
  width: 30px; height: 30px; border: none; border-radius: 8px;
  cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.btn-action--view    { background: #eff6ff; color: #2563eb; }
.btn-action--success { background: #f0fdf4; color: #16a34a; }
.btn-action--danger  { background: #fef2f2; color: #dc2626; }

/* Context panel */
.context-row td { padding: 0; background: #fafafa; border-bottom: 1px solid #f1f5f9; }
.context-panel { padding: 20px 24px; }
.context-panel__title {
  font-size: 12px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.context-rules { display: flex; flex-direction: column; gap: 12px; }
.context-rule {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; padding: 14px 16px;
}
.context-rule__header {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 6px;
}
.context-rule__score {
  font-size: 12px; font-weight: 700; color: #dc2626;
  background: #fef2f2; padding: 2px 8px; border-radius: 6px;
}
.context-rule__detail { font-size: 13px; color: #475569; }
.context-notes {
  margin-top: 16px; padding: 12px 16px;
  background: #f8fafc; border-radius: 10px;
  font-size: 13px; color: #374151;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.modal {
  background: var(--bg-card); border-radius: 16px; width: 100%;
  max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
}
.modal__header h3 { font-size: 16px; font-weight: 700; }
.modal__close {
  width: 30px; height: 30px; background: #f1f5f9; border: none;
  border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.modal__body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.modal__footer {
  padding: 16px 24px; border-top: 1px solid #f1f5f9;
  display: flex; justify-content: flex-end; gap: 10px;
}

.modal-alert-summary {
  background: #f8fafc; border-radius: 12px;
  padding: 16px; display: flex; flex-direction: column; gap: 10px;
}
.modal-field__label {
  display: block; font-size: 11px; font-weight: 600;
  color: #94a3b8; text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 2px;
}
.modal-field__value { font-size: 14px; font-weight: 500; color: #111827; }

.modal-warning {
  background: #fef2f2; border: 1px solid #fecaca;
  border-radius: 10px; padding: 12px 16px;
  font-size: 13px; color: #dc2626;
  display: flex; align-items: flex-start; gap: 10px;
}
.modal-warning i { margin-top: 2px; flex-shrink: 0; }

.modal-notes label {
  display: block; font-size: 12px; font-weight: 600;
  color: #374151; margin-bottom: 8px;
}
.required { color: #dc2626; }
.modal-notes textarea {
  width: 100%; padding: 12px; border: 1px solid var(--border);
  border-radius: 10px; font-size: 14px; font-family: inherit;
  resize: vertical; outline: none; box-sizing: border-box;
  transition: border-color 0.15s;
}
.modal-notes textarea:focus { border-color: var(--accent); }

.btn-success {
  padding: 10px 20px; background: #16a34a; color: var(--text-inverse);
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
}
.btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger {
  padding: 10px 20px; background: #dc2626; color: var(--text-inverse);
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost {
  padding: 10px 20px; background: #f8fafc; color: #475569;
  border: 1px solid var(--border); border-radius: 10px; font-size: 14px;
  font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
}

.table-empty {
  padding: 48px; text-align: center; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.table-empty i { font-size: 32px; color: #d1fae5; }
</style>
