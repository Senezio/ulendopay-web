<template>
  <AdminLayout>
    <div class="admin-page">

      <!-- Header -->
      <div class="admin-page__header">
        <div>
          <h1>Compliance</h1>
          <p>AML sanctions and PEP screening alerts</p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row" v-if="stats">
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--red">
            <i class="fa-sharp-duotone fa-solid fa-bell"></i>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.alerts.new }}</div>
            <div class="stat-card__label">New Alerts</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--amber">
            <i class="fa-sharp-duotone fa-solid fa-magnifying-glass"></i>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.alerts.reviewing }}</div>
            <div class="stat-card__label">Under Review</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--red2">
            <i class="fa-sharp-duotone fa-solid fa-user-slash"></i>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.alerts.confirmed }}</div>
            <div class="stat-card__label">Confirmed Matches</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--green">
            <i class="fa-sharp-duotone fa-solid fa-shield-check"></i>
          </div>
          <div>
            <div class="stat-card__value">{{ stats.alerts.cleared }}</div>
            <div class="stat-card__label">Cleared</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--blue">
            <i class="fa-sharp-duotone fa-solid fa-database"></i>
          </div>
          <div>
            <div class="stat-card__value">{{ formatNumber(stats.sanctions_entries) }}</div>
            <div class="stat-card__label">Sanctions Entries</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card__icon stat-card__icon--purple">
            <i class="fa-sharp-duotone fa-solid fa-person-military-pointing"></i>
          </div>
          <div>
            <div class="stat-card__value">{{ formatNumber(stats.pep_entries) }}</div>
            <div class="stat-card__label">PEP Entries</div>
          </div>
        </div>
      </div>

      <!-- Alerts Table -->
      <div class="admin-table-card">
        <div class="table-toolbar">
          <select v-model="statusFilter" @change="load">
            <option value="">All Alerts</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="cleared">Cleared</option>
            <option value="confirmed">Confirmed</option>
          </select>
          <select v-model="typeFilter" @change="load">
            <option value="">All Types</option>
            <option value="sanctions_match">Sanctions</option>
            <option value="pep_match">PEP</option>
          </select>
          <select v-model="severityFilter" @change="load">
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div class="toolbar-spacer"></div>
          <div v-if="stats" class="sync-info">
            <i class="fa-sharp-duotone fa-solid fa-clock"></i>
            Last sync: {{ formatDate(stats.last_synced) }}
          </div>
          <button class="btn-icon" @click="loadAll" title="Refresh">
            <i class="fa-sharp-duotone fa-solid fa-rotate"></i>
          </button>
        </div>

        <div v-if="loading" class="table-loading">
          <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i> Loading...
        </div>

        <div v-else-if="alerts?.data?.length" class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Matched Name</th>
                <th>Score</th>
                <th>Severity</th>
                <th>Trigger</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="alert in alerts.data" :key="alert.id">
                <tr :class="{ 'row--expanded': expanded === alert.id }">
                  <td>
                    <div class="cell-user__name">{{ alert.user?.name }}</div>
                    <div class="cell-user__meta">{{ alert.user?.country_code }} · {{ alert.user?.kyc_status }}</div>
                  </td>
                  <td>
                    <span class="type-badge" :class="alert.alert_type === 'sanctions_match' ? 'type-badge--sanctions' : 'type-badge--pep'">
                      <i :class="alert.alert_type === 'sanctions_match' ? 'fa-sharp-duotone fa-solid fa-ban' : 'fa-sharp-duotone fa-solid fa-person-military-pointing'"></i>
                      {{ alert.alert_type === 'sanctions_match' ? 'Sanctions' : 'PEP' }}
                    </span>
                  </td>
                  <td>
                    <span class="matched-name">{{ alert.matched_name || '—' }}</span>
                  </td>
                  <td>
                    <div class="score-pill" :class="scoreClass(alert.match_score)">
                      {{ alert.match_score }}
                    </div>
                  </td>
                  <td>
                    <span class="badge" :class="severityBadge(alert.severity)">{{ alert.severity }}</span>
                  </td>
                  <td>
                    <span class="trigger-tag">{{ formatTrigger(alert.triggered_by) }}</span>
                  </td>
                  <td class="cell-date">{{ formatDate(alert.created_at) }}</td>
                  <td>
                    <span class="badge" :class="statusBadge(alert.status)">{{ alert.status }}</span>
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
                      <template v-if="alert.status === 'new'">
                        <button class="btn-action btn-action--amber" @click="markReviewing(alert)" title="Mark as reviewing">
                          <i class="fa-sharp-duotone fa-solid fa-magnifying-glass"></i>
                        </button>
                      </template>
                      <template v-if="alert.status === 'new' || alert.status === 'reviewing'">
                        <button class="btn-action btn-action--success" @click="openAction(alert, 'clear')" title="Clear — false positive">
                          <i class="fa-sharp-duotone fa-solid fa-check"></i>
                        </button>
                        <button class="btn-action btn-action--danger" @click="openAction(alert, 'confirm')" title="Confirm match — suspend user">
                          <i class="fa-sharp-duotone fa-solid fa-user-slash"></i>
                        </button>
                      </template>
                    </div>
                  </td>
                </tr>

                <!-- Expanded detail row -->
                <tr v-if="expanded === alert.id" class="context-row">
                  <td colspan="9">
                    <div class="context-panel" v-if="alertDetail[alert.id]">
                      <div class="context-grid">

                        <!-- User details -->
                        <div class="context-section">
                          <div class="context-section__title">
                            <i class="fa-sharp-duotone fa-solid fa-user"></i> User
                          </div>
                          <div class="context-fields">
                            <div class="context-field">
                              <span class="context-field__label">Name</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].alert?.user?.name }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Status</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].alert?.user?.status }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">KYC</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].alert?.user?.kyc_status }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Country</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].alert?.user?.country_code || '—' }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Tier</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].alert?.user?.tier || '—' }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Registered</span>
                              <span class="context-field__value">{{ formatDate(alertDetail[alert.id].alert?.user?.created_at) }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Screen details -->
                        <div class="context-section">
                          <div class="context-section__title">
                            <i class="fa-sharp-duotone fa-solid fa-magnifying-glass-chart"></i> Screen Details
                          </div>
                          <div class="context-fields">
                            <div class="context-field">
                              <span class="context-field__label">Input Name</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].alert?.screen?.input_name }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Screen Type</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].alert?.screen?.screen_type }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Match Score</span>
                              <span class="context-field__value">
                                <div class="score-pill" :class="scoreClass(alertDetail[alert.id].alert?.screen?.match_score)">
                                  {{ alertDetail[alert.id].alert?.screen?.match_score }}
                                </div>
                              </span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Algorithm</span>
                              <span class="context-field__value">{{ parseDetails(alertDetail[alert.id].alert?.screen?.match_details)?.algorithm || '—' }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Alias Match</span>
                              <span class="context-field__value">{{ parseDetails(alertDetail[alert.id].alert?.screen?.match_details)?.alias_match ? 'Yes' : 'No' }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Country Match</span>
                              <span class="context-field__value">{{ parseDetails(alertDetail[alert.id].alert?.screen?.match_details)?.country_match ? 'Yes' : 'No' }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Screened At</span>
                              <span class="context-field__value">{{ formatDate(alertDetail[alert.id].alert?.screen?.screened_at) }}</span>
                            </div>
                            <div class="context-field">
                              <span class="context-field__label">Triggered By</span>
                              <span class="context-field__value">{{ formatTrigger(alertDetail[alert.id].alert?.screen?.triggered_by) }}</span>
                            </div>
                          </div>
                        </div>

                        <!-- Matched entry details -->
                        <div class="context-section" v-if="alertDetail[alert.id].matched_entry">
                          <div class="context-section__title">
                            <i class="fa-sharp-duotone fa-solid fa-list-check"></i> Matched List Entry
                          </div>
                          <div class="context-fields">
                            <div class="context-field">
                              <span class="context-field__label">Name on List</span>
                              <span class="context-field__value matched-entry-name">{{ alertDetail[alert.id].matched_entry.name }}</span>
                            </div>
                            <div class="context-field" v-if="alertDetail[alert.id].matched_entry.source">
                              <span class="context-field__label">Source</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].matched_entry.source }}</span>
                            </div>
                            <div class="context-field" v-if="alertDetail[alert.id].matched_entry.list_reference">
                              <span class="context-field__label">List Reference</span>
                              <span class="context-field__value mono">{{ alertDetail[alert.id].matched_entry.list_reference }}</span>
                            </div>
                            <div class="context-field" v-if="alertDetail[alert.id].matched_entry.date_of_birth">
                              <span class="context-field__label">Date of Birth</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].matched_entry.date_of_birth }}</span>
                            </div>
                            <div class="context-field" v-if="alertDetail[alert.id].matched_entry.position">
                              <span class="context-field__label">Position</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].matched_entry.position }}</span>
                            </div>
                            <div class="context-field" v-if="alertDetail[alert.id].matched_entry.risk_level">
                              <span class="context-field__label">Risk Level</span>
                              <span class="context-field__value">{{ alertDetail[alert.id].matched_entry.risk_level }}</span>
                            </div>
                            <div class="context-field" v-if="alertDetail[alert.id].matched_entry.aliases?.length">
                              <span class="context-field__label">Aliases</span>
                              <div class="alias-list">
                                <span v-for="alias in alertDetail[alert.id].matched_entry.aliases.slice(0,5)" :key="alias" class="alias-tag">{{ alias }}</span>
                                <span v-if="alertDetail[alert.id].matched_entry.aliases.length > 5" class="alias-more">
                                  +{{ alertDetail[alert.id].matched_entry.aliases.length - 5 }} more
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>

                      <!-- Resolution notes if resolved -->
                      <div v-if="alert.resolution_notes" class="context-notes">
                        <strong>Resolution notes:</strong> {{ alert.resolution_notes }}
                      </div>
                    </div>

                    <div v-else class="context-loading">
                      <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i> Loading details...
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div v-else class="table-empty">
          <i class="fa-sharp-duotone fa-solid fa-shield-halved"></i>
          <p>No compliance alerts</p>
        </div>

        <!-- Pagination -->
        <div v-if="alerts?.last_page > 1" class="pagination">
          <button class="page-btn" :disabled="alerts.current_page === 1" @click="changePage(alerts.current_page - 1)">
            <i class="fa-sharp-duotone fa-solid fa-chevron-left"></i>
          </button>
          <span class="page-info">Page {{ alerts.current_page }} of {{ alerts.last_page }}</span>
          <button class="page-btn" :disabled="alerts.current_page === alerts.last_page" @click="changePage(alerts.current_page + 1)">
            <i class="fa-sharp-duotone fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Action Modal -->
    <div v-if="actionModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal__header">
          <h3>{{ actionModal.type === 'confirm' ? 'Confirm Match' : 'Clear Alert' }}</h3>
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
              <span class="modal-field__label">Matched Against</span>
              <span class="modal-field__value">{{ actionModal.alert.matched_name }}</span>
            </div>
            <div class="modal-field">
              <span class="modal-field__label">Match Score</span>
              <div class="score-pill" :class="scoreClass(actionModal.alert.match_score)">
                {{ actionModal.alert.match_score }}
              </div>
            </div>
            <div class="modal-field">
              <span class="modal-field__label">Type</span>
              <span class="modal-field__value">{{ actionModal.alert.alert_type === 'sanctions_match' ? 'Sanctions' : 'PEP' }}</span>
            </div>
          </div>

          <div v-if="actionModal.type === 'confirm'" class="modal-warning">
            <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>
            This will immediately suspend the user account and freeze all their wallets. This action is logged.
          </div>

          <div v-else class="modal-info">
            <i class="fa-sharp-duotone fa-solid fa-circle-info"></i>
            Clearing this alert marks it as a false positive. The user will remain active.
          </div>

          <div class="modal-notes">
            <label>Resolution Notes <span class="required">*</span></label>
            <textarea
              v-model="actionNotes"
              :placeholder="actionModal.type === 'confirm' ? 'Describe why this is a genuine match...' : 'Explain why this is a false positive...'"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal__footer">
          <button class="btn-ghost" @click="closeModal">Cancel</button>
          <button
            v-if="actionModal.type === 'confirm'"
            class="btn-danger"
            :disabled="!actionNotes.trim() || actionLoading"
            @click="confirmAction"
          >
            <i v-if="actionLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
            <i v-else class="fa-sharp-duotone fa-solid fa-user-slash"></i>
            Confirm & Suspend User
          </button>
          <button
            v-else
            class="btn-success"
            :disabled="!actionNotes.trim() || actionLoading"
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

const ui             = useUiStore()
const alerts         = ref(null)
const stats          = ref(null)
const loading        = ref(false)
const expanded       = ref(null)
const alertDetail    = ref({})
const actionModal    = ref(null)
const actionNotes    = ref('')
const actionLoading  = ref(false)
const statusFilter   = ref('new')
const typeFilter     = ref('')
const severityFilter = ref('')
const page           = ref(1)

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreClass(score) {
  if (score >= 85) return 'score--critical'
  if (score >= 70) return 'score--high'
  if (score >= 60) return 'score--medium'
  return 'score--low'
}

function severityBadge(s) {
  return { critical: 'badge--red', high: 'badge--red', medium: 'badge--amber', low: 'badge--gray' }[s] || 'badge--gray'
}

function statusBadge(s) {
  return { new: 'badge--red', reviewing: 'badge--amber', cleared: 'badge--green', confirmed: 'badge--gray' }[s] || 'badge--gray'
}

function formatTrigger(t) {
  return { registration: 'Registration', kyc_approval: 'KYC Approval', daily_job: 'Daily Screen', name_change: 'Name Change' }[t] || t
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : '—'
}

function formatNumber(n) {
  return n ? n.toLocaleString() : '0'
}

function parseDetails(d) {
  if (!d) return {}
  if (typeof d === 'string') { try { return JSON.parse(d) } catch { return {} } }
  return d
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function load() {
  loading.value = true
  alertDetail.value = {}
  expanded.value = null
  try {
    const { data } = await adminApi.complianceAlerts({
      status:   statusFilter.value   || undefined,
      alert_type: typeFilter.value   || undefined,
      severity: severityFilter.value || undefined,
      page:     page.value,
    })
    alerts.value = data
  } catch {
    ui.error('Failed to load compliance alerts')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    const { data } = await adminApi.complianceStats()
    stats.value = data
  } catch {
    // silently fail - stats are supplementary
  }
}

async function loadAll() {
  await Promise.all([load(), loadStats()])
}

// ── Expand / detail ───────────────────────────────────────────────────────────

async function toggleExpand(id) {
  if (expanded.value === id) {
    expanded.value = null
    return
  }
  expanded.value = id
  if (!alertDetail.value[id]) {
    try {
      const { data } = await adminApi.complianceAlertShow(id)
      alertDetail.value = { ...alertDetail.value, [id]: data }
    } catch {
      ui.error('Failed to load alert details')
    }
  }
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function markReviewing(alert) {
  try {
    await adminApi.complianceAlertReview(alert.id)
    ui.success('Alert marked as under review')
    await load()
  } catch {
    ui.error('Failed to update alert')
  }
}

function openAction(alert, type) {
  actionModal.value = { alert, type }
  actionNotes.value = ''
}

function closeModal() {
  actionModal.value = null
  actionNotes.value = ''
}

async function confirmAction() {
  if (!actionNotes.value.trim()) return
  actionLoading.value = true
  try {
    if (actionModal.value.type === 'confirm') {
      await adminApi.complianceAlertConfirm(actionModal.value.alert.id, actionNotes.value)
      ui.success('Match confirmed — user suspended and wallets frozen')
    } else {
      await adminApi.complianceAlertClear(actionModal.value.alert.id, actionNotes.value)
      ui.success('Alert cleared')
    }
    closeModal()
    await loadAll()
  } catch {
    ui.error('Action failed')
  } finally {
    actionLoading.value = false
  }
}

function changePage(p) {
  page.value = p
  load()
}

onMounted(loadAll)
</script>

<style scoped>
.admin-page { padding: 16px; max-width: 1400px; }
@media (min-width: 768px) { .admin-page { padding: 32px; } }
.admin-page__header { margin-bottom: 24px; }
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }

/* Stats row */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; padding: 18px 20px;
  display: flex; align-items: center; gap: 14px;
}
.stat-card__icon {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.stat-card__icon--red    { background: #fef2f2; color: #dc2626; }
.stat-card__icon--red2   { background: #fff1f2; color: #e11d48; }
.stat-card__icon--amber  { background: #fffbeb; color: #d97706; }
.stat-card__icon--green  { background: #f0fdf4; color: #16a34a; }
.stat-card__icon--blue   { background: #eff6ff; color: #2563eb; }
.stat-card__icon--purple { background: #faf5ff; color: #7c3aed; }
.stat-card__value { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
.stat-card__label { font-size: 11px; color: #94a3b8; margin-top: 4px; font-weight: 500; }

/* Table card */
.admin-table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }

.table-toolbar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
}
.table-toolbar select {
  padding: 8px 12px; border: 1px solid var(--border);
  border-radius: 10px; font-size: 13px; background: var(--bg-card);
  outline: none; cursor: pointer;
}
.toolbar-spacer { flex: 1; }
.sync-info { font-size: 12px; color: #94a3b8; display: flex; align-items: center; gap: 6px; }
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
.admin-table { width: 100%; border-collapse: collapse; min-width: 900px; }
.admin-table th {
  padding: 12px 16px; text-align: left; font-size: 11px;
  font-weight: 700; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.05em; background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}
.admin-table td {
  padding: 13px 16px; border-bottom: 1px solid #f8fafc;
  font-size: 13px; color: #374151; vertical-align: middle;
}
.admin-table tr:last-child td { border-bottom: none; }
.row--expanded td { background: #fefce8; }

.cell-user__name { font-weight: 600; color: #111827; font-size: 13px; }
.cell-user__meta { font-size: 11px; color: #9ca3af; margin-top: 2px; text-transform: uppercase; }

/* Type badge */
.type-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700;
}
.type-badge--sanctions { background: #fef2f2; color: #dc2626; }
.type-badge--pep       { background: #faf5ff; color: #7c3aed; }

.matched-name { font-size: 13px; font-weight: 500; color: #111827; }

/* Score pill */
.score-pill {
  display: inline-block; padding: 3px 10px;
  border-radius: 8px; font-weight: 800; font-size: 13px;
}
.score--critical { background: #fef2f2; color: #dc2626; }
.score--high     { background: #fff7ed; color: #ea580c; }
.score--medium   { background: #fffbeb; color: #d97706; }
.score--low      { background: #f0fdf4; color: #16a34a; }

/* Badges */
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }

.trigger-tag {
  font-size: 11px; color: #64748b;
  background: #f8fafc; padding: 3px 8px;
  border-radius: 6px; white-space: nowrap;
}

.cell-date { font-size: 12px; color: #94a3b8; white-space: nowrap; }

.cell-actions { display: flex; gap: 5px; }
.btn-action {
  width: 28px; height: 28px; border: none; border-radius: 7px;
  cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.btn-action--view    { background: #eff6ff; color: #2563eb; }
.btn-action--success { background: #f0fdf4; color: #16a34a; }
.btn-action--danger  { background: #fef2f2; color: #dc2626; }
.btn-action--amber   { background: #fffbeb; color: #d97706; }

/* Context / expanded row */
.context-row td { padding: 0; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.context-panel { padding: 20px 24px; }
.context-loading {
  padding: 24px; text-align: center; color: #94a3b8;
  display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 13px;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.context-section {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px;
}
.context-section__title {
  font-size: 11px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.05em;
  margin-bottom: 12px; display: flex; align-items: center; gap: 7px;
}
.context-fields { display: flex; flex-direction: column; gap: 10px; }
.context-field { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
.context-field__label { font-size: 11px; color: #9ca3af; font-weight: 500; white-space: nowrap; }
.context-field__value { font-size: 13px; color: #111827; font-weight: 500; text-align: right; }

.matched-entry-name { font-weight: 700; color: #dc2626; }
.mono { font-family: monospace; font-size: 11px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }

.alias-list { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
.alias-tag {
  font-size: 11px; background: #f1f5f9; color: #475569;
  padding: 2px 7px; border-radius: 5px;
}
.alias-more { font-size: 11px; color: #94a3b8; padding: 2px 4px; }

.context-notes {
  margin-top: 16px; padding: 12px 16px;
  background: #f8fafc; border-radius: 10px;
  font-size: 13px; color: #374151;
  border-left: 3px solid #e2e8f0;
}

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 12px; padding: 16px;
  border-top: 1px solid #f1f5f9;
}
.page-btn {
  width: 32px; height: 32px; border: 1px solid var(--border);
  border-radius: 8px; background: var(--bg-card); color: #475569;
  cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { border-color: var(--accent); color: var(--accent); }
.page-info { font-size: 13px; color: #64748b; }

/* Table empty */
.table-empty {
  padding: 48px; text-align: center; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.table-empty i { font-size: 32px; color: #d1fae5; }
.table-empty p { font-size: 14px; }

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
.modal-info {
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 10px; padding: 12px 16px;
  font-size: 13px; color: #2563eb;
  display: flex; align-items: flex-start; gap: 10px;
}
.modal-warning i, .modal-info i { margin-top: 1px; flex-shrink: 0; }

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
</style>
