<template>
  <AdminLayout>
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Webhook Log</h1>
          <p>Incoming callbacks from PawaPay and MTN MoMo</p>
        </div>
        <button class="btn-icon" @click="load" :disabled="loading">
          <i class="fa-sharp-duotone fa-solid fa-rotate" :class="{ 'fa-spin': loading }"></i>
        </button>
      </div>

      <!-- Summary Stats -->
      <div class="stats-row" v-if="summary">
        <div class="stat-pill">
          <span class="stat-pill__value">{{ summary.total }}</span>
          <span class="stat-pill__label">Total</span>
        </div>
        <div class="stat-pill stat-pill--green">
          <span class="stat-pill__value">{{ summary.accepted }}</span>
          <span class="stat-pill__label">Accepted</span>
        </div>
        <div class="stat-pill stat-pill--red">
          <span class="stat-pill__value">{{ summary.failed }}</span>
          <span class="stat-pill__label">Failed</span>
        </div>
        <div class="stat-pill stat-pill--amber">
          <span class="stat-pill__value">{{ summary.rejected }}</span>
          <span class="stat-pill__label">Rejected</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <select v-model="filters.source" @change="load">
          <option value="">All Sources</option>
          <option value="pawapay">PawaPay</option>
          <option value="mtn">MTN MoMo</option>
        </select>
        <select v-model="filters.direction" @change="load">
          <option value="">All Types</option>
          <option value="topup">Top-up</option>
          <option value="withdrawal">Withdrawal</option>
        </select>
        <select v-model="filters.outcome" @change="load">
          <option value="">All Outcomes</option>
          <option value="accepted">Accepted</option>
          <option value="failed">Failed</option>
          <option value="rejected">Rejected</option>
        </select>
        <input type="date" v-model="filters.from" @change="load" />
        <input type="date" v-model="filters.to" @change="load" />
        <button class="btn-clear" v-if="hasFilters" @click="clearFilters">
          <i class="fa-sharp-duotone fa-solid fa-xmark"></i> Clear
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading && !logs.length" class="state-loading">
        <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i> Loading webhook log...
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table class="webhook-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Source</th>
              <th>Type</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Outcome</th>
              <th>Signature</th>
              <th>IP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" @click="selected = log" class="clickable">
              <td class="mono nowrap">{{ formatDate(log.received_at) }}</td>
              <td>
                <span class="source-badge" :class="`source-badge--${log.source}`">
                  {{ log.source === 'pawapay' ? 'PawaPay' : 'MTN' }}
                </span>
              </td>
              <td>
                <span class="direction-badge" :class="`direction-badge--${log.direction}`">
                  {{ log.direction }}
                </span>
              </td>
              <td class="mono ref-col">{{ log.provider_reference ?? '—' }}</td>
              <td>
                <span class="status-pill" :class="statusColor(log.status)">
                  {{ log.status ?? '—' }}
                </span>
              </td>
              <td>
                <span class="outcome-badge" :class="`outcome-badge--${log.outcome}`">
                  {{ log.outcome }}
                </span>
              </td>
              <td>
                <span v-if="log.signature_valid" class="sig-ok">
                  <i class="fa-sharp-duotone fa-solid fa-shield-check"></i>
                </span>
                <span v-else class="sig-fail">
                  <i class="fa-sharp-duotone fa-solid fa-shield-xmark"></i>
                </span>
              </td>
              <td class="mono ip-col">{{ log.ip_address ?? '—' }}</td>
              <td>
                <button class="view-btn" @click.stop="selected = log">
                  <i class="fa-sharp-duotone fa-solid fa-eye"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!loading && logs.length === 0">
              <td colspan="9" class="table-empty">No webhook logs found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" v-if="lastPage > 1">
        <button :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
          <i class="fa-sharp-duotone fa-solid fa-chevron-left"></i>
        </button>
        <span>Page {{ currentPage }} of {{ lastPage }}</span>
        <button :disabled="currentPage === lastPage" @click="changePage(currentPage + 1)">
          <i class="fa-sharp-duotone fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <!-- Detail Modal -->
      <div v-if="selected" class="modal-overlay" @click.self="selected = null">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>Webhook Detail</h3>
              <p>{{ formatDate(selected.received_at) }} · {{ selected.source }} · {{ selected.direction }}</p>
            </div>
            <button class="modal-close" @click="selected = null">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-row">
                <span class="detail-label">Source</span>
                <span class="detail-value">{{ selected.source === 'pawapay' ? 'PawaPay' : 'MTN MoMo' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Direction</span>
                <span class="detail-value">{{ selected.direction }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reference</span>
                <span class="detail-value mono">{{ selected.provider_reference ?? '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status</span>
                <span class="detail-value">{{ selected.status ?? '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Outcome</span>
                <span class="outcome-badge" :class="`outcome-badge--${selected.outcome}`">{{ selected.outcome }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Signature</span>
                <span :class="selected.signature_valid ? 'sig-ok' : 'sig-fail'">
                  {{ selected.signature_valid ? 'Valid' : 'Invalid' }}
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">IP</span>
                <span class="detail-value mono">{{ selected.ip_address ?? '—' }}</span>
              </div>
            </div>

            <div v-if="selected.error" class="error-block">
              <div class="error-block__label">Error</div>
              <pre class="error-block__pre">{{ selected.error }}</pre>
            </div>

            <div v-if="selected.payload" class="payload-block">
              <div class="payload-block__label">Payload</div>
              <pre class="payload-block__pre">{{ JSON.stringify(selected.payload, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui       = useUiStore()
const logs     = ref([])
const summary  = ref(null)
const loading  = ref(false)
const selected = ref(null)
const currentPage = ref(1)
const lastPage    = ref(1)

const filters = ref({
  source: '', direction: '', outcome: '', from: '', to: '',
})

const hasFilters = computed(() =>
  Object.values(filters.value).some(v => v !== '')
)

async function load() {
  loading.value = true
  try {
    const params = { page: currentPage.value, ...filters.value }
    const response = await adminApi.webhookLogs(params)
    const result = response.data || response
    logs.value     = result.logs || []
    summary.value  = result.summary || null
    lastPage.value = result.last_page || 1
  } catch {
    ui.error('Failed to load webhook log')
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  currentPage.value = page
  load()
}

function clearFilters() {
  filters.value = { source: '', direction: '', outcome: '', from: '', to: '' }
  currentPage.value = 1
  load()
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

function statusColor(status) {
  if (!status) return 'status-gray'
  if (['COMPLETED','SUCCESSFUL'].includes(status)) return 'status-green'
  if (['FAILED','REJECTED','TIMED_OUT','CANCELLED'].includes(status)) return 'status-red'
  return 'status-amber'
}

onMounted(load)
</script>

<style scoped>
.page { padding: 28px 32px; max-width: 1200px; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px;
}
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.page-header p  { font-size: 12px; color: #94a3b8; margin-top: 3px; }

.btn-icon {
  width: 34px; height: 34px; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 8px;
  cursor: pointer; color: #64748b; font-size: 13px;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.btn-icon:hover { border-color: var(--accent); color: var(--accent); }
.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }

/* Stats */
.stats-row {
  display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;
}
.stat-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background: var(--bg-card);
  border: 1px solid var(--border); border-radius: 8px;
}
.stat-pill--green { border-color: #bbf7d0; background: #f0fdf4; }
.stat-pill--red   { border-color: #fecaca; background: #fef2f2; }
.stat-pill--amber { border-color: #fed7aa; background: #fff7ed; }
.stat-pill__value { font-size: 18px; font-weight: 800; color: #0f172a; }
.stat-pill--green .stat-pill__value { color: #15803d; }
.stat-pill--red   .stat-pill__value { color: #b91c1c; }
.stat-pill--amber .stat-pill__value { color: #c2410c; }
.stat-pill__label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }

/* Filters */
.filters-bar {
  display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;
}
.filters-bar select, .filters-bar input[type="date"] {
  padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px;
  font-size: 13px; background: var(--bg-card); outline: none;
  font-family: inherit; color: #374151;
}
.btn-clear {
  display: flex; align-items: center; gap: 6px; padding: 8px 12px;
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
  color: #dc2626; font-size: 12px; font-weight: 600; cursor: pointer;
}

/* Table */
.table-wrap { overflow-x: auto; }
.webhook-table {
  width: 100%; border-collapse: collapse;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden; min-width: 800px;
}
.webhook-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.webhook-table th {
  text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 12px; white-space: nowrap;
}
.webhook-table td {
  padding: 9px 12px; font-size: 12px; color: #334155;
  border-bottom: 1px solid #f1f5f9; vertical-align: middle;
}
.webhook-table tbody tr:last-child td { border-bottom: none; }
.webhook-table tbody tr.clickable { cursor: pointer; }
.webhook-table tbody tr.clickable:hover td { background: #f8fafc; }
.table-empty { padding: 40px; text-align: center; color: #94a3b8; font-size: 13px; }
.mono   { font-family: monospace; }
.nowrap { white-space: nowrap; }
.ref-col { font-size: 11px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ip-col  { font-size: 11px; color: #94a3b8; }

.source-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; }
.source-badge--pawapay { background: #eff6ff; color: #2563eb; }
.source-badge--mtn     { background: #fefce8; color: #ca8a04; }

.direction-badge { padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.direction-badge--topup      { background: #f0fdf4; color: #15803d; }
.direction-badge--withdrawal { background: #fdf4ff; color: #9333ea; }

.outcome-badge { display: inline-block; padding: 2px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.outcome-badge--accepted { background: #f0fdf4; color: #15803d; }
.outcome-badge--failed   { background: #fef2f2; color: #b91c1c; }
.outcome-badge--rejected { background: #fff7ed; color: #c2410c; }
.outcome-badge--duplicate { background: #f1f5f9; color: #475569; }
.outcome-badge--not_found { background: #fef2f2; color: #b91c1c; }

.status-pill { display: inline-block; padding: 2px 7px; border-radius: 5px; font-size: 10px; font-weight: 600; }
.status-green { background: #f0fdf4; color: #15803d; }
.status-red   { background: #fef2f2; color: #b91c1c; }
.status-amber { background: #fff7ed; color: #c2410c; }
.status-gray  { background: #f1f5f9; color: #475569; }

.sig-ok   { color: #15803d; font-size: 14px; }
.sig-fail { color: #dc2626; font-size: 14px; }

.view-btn {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border);
  background: #f8fafc; color: #64748b; cursor: pointer; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
}

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; margin-top: 16px;
}
.pagination button {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-card); color: #475569; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.pagination span { font-size: 13px; color: #64748b; }

/* Loading */
.state-loading {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 48px; color: #94a3b8; font-size: 14px;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.55);
  display: flex; align-items: flex-end; justify-content: center; z-index: 200;
}
.modal {
  background: var(--bg-card); border-radius: 20px 20px 0 0;
  width: 100%; max-width: 580px; max-height: 88vh; overflow-y: auto;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 18px 20px 14px; border-bottom: 1px solid var(--border);
  position: sticky; top: 0; background: var(--bg-card); z-index: 1;
}
.modal-header h3 { font-size: 15px; font-weight: 700; color: #0f172a; }
.modal-header p  { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.modal-close {
  width: 28px; height: 28px; background: #f1f5f9; border: none;
  border-radius: 7px; cursor: pointer; color: #64748b; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.modal-body { padding: 16px 20px; }

.detail-grid { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.detail-row { display: flex; gap: 12px; align-items: center; }
.detail-label {
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em; min-width: 70px;
}
.detail-value { font-size: 13px; color: #0f172a; }

.error-block { border-radius: 8px; overflow: hidden; border: 1px solid #fecaca; margin-bottom: 12px; }
.error-block__label { padding: 6px 12px; background: #fef2f2; color: #b91c1c; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.error-block__pre { margin: 0; padding: 12px; font-size: 12px; font-family: monospace; color: #b91c1c; white-space: pre-wrap; word-break: break-all; background: #fff5f5; }

.payload-block { border-radius: 8px; overflow: hidden; border: 1px solid var(--border); }
.payload-block__label { padding: 6px 12px; background: #f8fafc; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; border-bottom: 1px solid var(--border); }
.payload-block__pre { margin: 0; padding: 12px; font-size: 11px; font-family: monospace; color: #334155; white-space: pre-wrap; word-break: break-all; max-height: 300px; overflow-y: auto; }

@media (min-width: 769px) {
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 14px; }
}
@media (max-width: 768px) {
  .page { padding: 20px 16px; }
}
</style>
