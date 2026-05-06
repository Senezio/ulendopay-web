<template>
  <AdminLayout>
    <div class="page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Audit Log</h1>
          <p>All staff actions across the platform</p>
        </div>
        <button class="btn-icon" @click="load" :disabled="loading">
          <i class="fa-sharp-duotone fa-solid fa-rotate" :class="{ 'fa-spin': loading }"></i>
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <i class="fa-sharp-duotone fa-solid fa-magnifying-glass"></i>
          <input v-model="filters.search" placeholder="Search action, entity, IP..." @input="debouncedLoad" />
        </div>
        <select v-model="filters.entity_type" @change="load">
          <option value="">All Entities</option>
          <option value="User">User</option>
          <option value="KycRecord">KYC</option>
          <option value="TransferTier">Tier</option>
          <option value="ExchangeRate">Rates</option>
          <option value="Partner">Partner</option>
          <option value="Account">Account</option>
          <option value="Transaction">Transaction</option>
        </select>
        <input type="date" v-model="filters.from" @change="load" />
        <input type="date" v-model="filters.to" @change="load" />
        <button class="btn-clear" v-if="hasFilters" @click="clearFilters">
          <i class="fa-sharp-duotone fa-solid fa-xmark"></i> Clear
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading && !logs.length" class="state-loading">
        <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i> Loading audit log...
      </div>

      <!-- Table -->
      <div v-else class="table-wrap">
        <table class="audit-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Staff</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Changes</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" @click="selected = log" class="clickable">
              <td class="mono nowrap">{{ formatDate(log.created_at) }}</td>
              <td>
                <div class="staff-cell" v-if="log.staff">
                  <span class="staff-avatar">{{ initials(log.staff.name) }}</span>
                  <div>
                    <div class="staff-name">{{ log.staff.name }}</div>
                    <div class="staff-role">{{ formatRole(log.staff.role) }}</div>
                  </div>
                </div>
                <span v-else class="cell-na">System</span>
              </td>
              <td>
                <span class="action-badge" :class="actionColor(log.action)">
                  {{ formatAction(log.action) }}
                </span>
              </td>
              <td>
                <span class="entity-type">{{ log.entity_type }}</span>
                <span class="entity-id mono">#{{ log.entity_id }}</span>
              </td>
              <td>
                <span v-if="log.old_values || log.new_values" class="has-changes">
                  <i class="fa-sharp-duotone fa-solid fa-circle-dot"></i> View
                </span>
                <span v-else class="cell-na">—</span>
              </td>
              <td class="mono ip-col">{{ log.ip_address ?? '—' }}</td>
            </tr>
            <tr v-if="!loading && logs.length === 0">
              <td colspan="6" class="table-empty">No audit log entries found</td>
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
              <h3>{{ formatAction(selected.action) }}</h3>
              <p>{{ formatDate(selected.created_at) }} · {{ selected.ip_address }}</p>
            </div>
            <button class="modal-close" @click="selected = null">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">

            <!-- Staff -->
            <div class="detail-row" v-if="selected.staff">
              <span class="detail-label">Staff</span>
              <span class="detail-value">{{ selected.staff.name }} ({{ formatRole(selected.staff.role) }})</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Action</span>
              <span class="detail-value mono">{{ selected.action }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Entity</span>
              <span class="detail-value">{{ selected.entity_type }} #{{ selected.entity_id }}</span>
            </div>

            <!-- Old values -->
            <div v-if="selected.old_values" class="changes-block changes-block--old">
              <div class="changes-label">Before</div>
              <pre class="changes-pre">{{ JSON.stringify(selected.old_values, null, 2) }}</pre>
            </div>

            <!-- New values -->
            <div v-if="selected.new_values" class="changes-block changes-block--new">
              <div class="changes-label">After</div>
              <pre class="changes-pre">{{ JSON.stringify(selected.new_values, null, 2) }}</pre>
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

const ui      = useUiStore()
const logs    = ref([])
const loading = ref(false)
const selected = ref(null)
const currentPage = ref(1)
const lastPage    = ref(1)
const total       = ref(0)

const filters = ref({
  search: '',
  entity_type: '',
  from: '',
  to: '',
})

const hasFilters = computed(() =>
  filters.value.search || filters.value.entity_type ||
  filters.value.from || filters.value.to
)

let searchTimer = null
function debouncedLoad() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; load() }, 400)
}

async function load() {
  loading.value = true
  try {
    const params = { page: currentPage.value, ...filters.value }
    const { data } = await adminApi.auditLog(params)
    logs.value    = data.logs
    total.value   = data.total
    lastPage.value = data.last_page
  } catch {
    ui.error('Failed to load audit log')
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  currentPage.value = page
  load()
}

function clearFilters() {
  filters.value = { search: '', entity_type: '', from: '', to: '' }
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

function formatAction(action) {
  return action?.replace('admin.', '').replace(/\./g, ' ') ?? action
}

function formatRole(r) {
  return {
    super_admin:     'Super Admin',
    kyc_reviewer:    'KYC Reviewer',
    finance_officer: 'Finance Officer',
    support_agent:   'Support Agent',
  }[r] || r
}

function initials(name) {
  return (name || 'S').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function actionColor(action) {
  if (action?.includes('approved') || action?.includes('restored') || action?.includes('created')) return 'action--green'
  if (action?.includes('rejected') || action?.includes('suspended') || action?.includes('failed')) return 'action--red'
  if (action?.includes('toggled') || action?.includes('updated') || action?.includes('fetched')) return 'action--blue'
  if (action?.includes('adjusted') || action?.includes('adjusted')) return 'action--amber'
  return 'action--gray'
}

onMounted(load)
</script>

<style scoped>
.page { padding: 28px 32px; max-width: 1200px; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px;
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

/* Filters */
.filters-bar {
  display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;
}
.search-box {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 8px; padding: 8px 12px; flex: 1; min-width: 200px;
}
.search-box i { color: #94a3b8; font-size: 12px; flex-shrink: 0; }
.search-box input { border: none; outline: none; font-size: 13px; color: #374151; width: 100%; background: transparent; }
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
.audit-table {
  width: 100%; border-collapse: collapse;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; overflow: hidden; min-width: 700px;
}
.audit-table thead tr { background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.audit-table th {
  text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em; padding: 10px 14px; white-space: nowrap;
}
.audit-table td {
  padding: 10px 14px; font-size: 12px; color: #334155;
  border-bottom: 1px solid #f1f5f9; vertical-align: middle;
}
.audit-table tbody tr:last-child td { border-bottom: none; }
.audit-table tbody tr.clickable { cursor: pointer; }
.audit-table tbody tr.clickable:hover td { background: #f8fafc; }
.table-empty { padding: 40px; text-align: center; color: #94a3b8; font-size: 13px; }
.mono { font-family: monospace; }
.nowrap { white-space: nowrap; }

.staff-cell { display: flex; align-items: center; gap: 8px; }
.staff-avatar {
  width: 28px; height: 28px; border-radius: 7px; background: var(--accent);
  color: #fff; font-size: 10px; font-weight: 700; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.staff-name { font-size: 12px; font-weight: 600; color: #0f172a; }
.staff-role { font-size: 10px; color: #94a3b8; }

.action-badge {
  display: inline-block; padding: 2px 8px; border-radius: 5px;
  font-size: 11px; font-weight: 600; text-transform: capitalize;
}
.action--green { background: #f0fdf4; color: #15803d; }
.action--red   { background: #fef2f2; color: #b91c1c; }
.action--blue  { background: #eff6ff; color: #2563eb; }
.action--amber { background: #fff7ed; color: #ea580c; }
.action--gray  { background: #f1f5f9; color: #475569; }

.entity-type { font-size: 12px; font-weight: 600; color: #0f172a; }
.entity-id   { font-size: 11px; color: #94a3b8; margin-left: 4px; }
.ip-col      { font-size: 11px; color: #94a3b8; }
.has-changes { font-size: 11px; color: var(--accent); display: flex; align-items: center; gap: 4px; }
.cell-na     { color: #cbd5e1; }

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
  width: 100%; max-width: 560px; max-height: 85vh; overflow-y: auto;
}
.modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 18px 20px 14px; border-bottom: 1px solid var(--border);
  position: sticky; top: 0; background: var(--bg-card); z-index: 1;
}
.modal-header h3 { font-size: 15px; font-weight: 700; color: #0f172a; text-transform: capitalize; }
.modal-header p  { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.modal-close {
  width: 28px; height: 28px; background: #f1f5f9; border: none;
  border-radius: 7px; cursor: pointer; color: #64748b; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.modal-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }

.detail-row { display: flex; gap: 12px; align-items: flex-start; }
.detail-label {
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em; min-width: 60px; padding-top: 1px;
}
.detail-value { font-size: 13px; color: #0f172a; }

.changes-block { border-radius: 8px; overflow: hidden; }
.changes-block--old { border: 1px solid #fecaca; }
.changes-block--new { border: 1px solid #bbf7d0; }
.changes-label {
  padding: 6px 12px; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.changes-block--old .changes-label { background: #fef2f2; color: #b91c1c; }
.changes-block--new .changes-label { background: #f0fdf4; color: #15803d; }
.changes-pre {
  margin: 0; padding: 12px; font-size: 12px; font-family: monospace;
  color: #334155; white-space: pre-wrap; word-break: break-all;
  background: var(--bg-card);
}

@media (min-width: 769px) {
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 14px; }
}
@media (max-width: 768px) {
  .page { padding: 20px 16px; }
}
</style>
