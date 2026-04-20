<template>
  <AdminLayout>
    <div class="admin-page">

      <div class="page-header">
        <div>
          <h1>Users</h1>
          <p>{{ users?.total ?? 0 }} customer accounts</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <i class="fa-sharp-duotone fa-solid fa-magnifying-glass"></i>
          <input v-model="search" placeholder="Search name or email..." @input="debouncedLoad" />
        </div>
        <div class="filter-row">
          <select v-model="statusFilter" @change="load">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
          <select v-model="kycFilter" @change="load">
            <option value="">All KYC</option>
            <option value="none">Unverified</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <!-- Table card -->
      <div class="table-card">

        <!-- Loading -->
        <div v-if="loading" class="state-center">
          <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
          <p>Loading users...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="!users?.data?.length" class="state-center">
          <i class="fa-sharp-duotone fa-solid fa-users"></i>
          <p>No users found</p>
        </div>

        <template v-else>
          <!-- Desktop table -->
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Country</th>
                  <th>KYC</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users.data" :key="user.id">
                  <td>
                    <div class="cell-user">
                      <div class="cell-avatar">{{ initials(user.name) }}</div>
                      <div>
                        <div class="cell-user__name">{{ user.name }}</div>
                        <div class="cell-user__sub">{{ user.email || user.phone || '—' }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="cell-secondary">{{ user.country_code || '—' }}</td>
                  <td>
                    <span class="badge" :class="kycBadge(user.kyc_status)">{{ user.kyc_status }}</span>
                  </td>
                  <td>
                    <span class="badge" :class="statusBadge(user.status)">{{ user.status }}</span>
                  </td>
                  <td class="cell-secondary">{{ formatDate(user.created_at) }}</td>
                  <td>
                    <button
                      v-if="user.status === 'active'"
                      class="action-btn action-btn--danger"
                      @click="openSuspend(user)"
                    >
                      <i class="fa-sharp-duotone fa-solid fa-ban"></i> Suspend
                    </button>
                    <button
                      v-else
                      class="action-btn action-btn--success"
                      @click="restore(user.id)"
                    >
                      <i class="fa-sharp-duotone fa-solid fa-circle-check"></i> Restore
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile cards — shown only on small screens -->
          <div class="mobile-list">
            <div v-for="user in users.data" :key="user.id" class="mobile-row">
              <div class="mobile-row__top">
                <div class="cell-avatar">{{ initials(user.name) }}</div>
                <div class="mobile-row__info">
                  <div class="cell-user__name">{{ user.name }}</div>
                  <div class="cell-user__sub">{{ user.email || user.phone || '—' }}</div>
                </div>
                <span class="badge" :class="statusBadge(user.status)">{{ user.status }}</span>
              </div>
              <div class="mobile-row__meta">
                <span><i class="fa-sharp-duotone fa-solid fa-location-dot"></i> {{ user.country_code || '—' }}</span>
                <span class="badge badge--sm" :class="kycBadge(user.kyc_status)">{{ user.kyc_status }}</span>
                <span><i class="fa-sharp-duotone fa-solid fa-calendar"></i> {{ formatDate(user.created_at) }}</span>
              </div>
              <div class="mobile-row__actions">
                <button
                  v-if="user.status === 'active'"
                  class="action-btn action-btn--danger"
                  @click="openSuspend(user)"
                >
                  <i class="fa-sharp-duotone fa-solid fa-ban"></i> Suspend
                </button>
                <button
                  v-else
                  class="action-btn action-btn--success"
                  @click="restore(user.id)"
                >
                  <i class="fa-sharp-duotone fa-solid fa-circle-check"></i> Restore
                </button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="users.last_page > 1" class="pagination">
            <button :disabled="page === 1" @click="page--; load()">
              <i class="fa-sharp-duotone fa-solid fa-chevron-left"></i>
            </button>
            <span>Page {{ page }} of {{ users.last_page }}</span>
            <button :disabled="page === users.last_page" @click="page++; load()">
              <i class="fa-sharp-duotone fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </template>
      </div>

      <!-- Suspend modal -->
      <div v-if="suspendTarget" class="modal-overlay" @click.self="suspendTarget = null">
        <div class="modal">
          <div class="modal-header">
            <h3>Suspend {{ suspendTarget.name }}?</h3>
            <button @click="suspendTarget = null"><i class="fa-sharp-duotone fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <p>This will revoke all active sessions immediately.</p>
            <label>Reason</label>
            <textarea v-model="suspendReason" rows="3" placeholder="Reason for suspension..."></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="suspendTarget = null">Cancel</button>
            <button class="btn-danger" :disabled="!suspendReason || actionLoading" @click="suspend">
              <i v-if="actionLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <i v-else class="fa-sharp-duotone fa-solid fa-ban"></i>
              Suspend
            </button>
          </div>
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

const ui            = useUiStore()
const users         = ref(null)
const loading       = ref(false)
const actionLoading = ref(false)
const search        = ref('')
const statusFilter  = ref('')
const kycFilter     = ref('')
const page          = ref(1)
const suspendTarget = ref(null)
const suspendReason = ref('')
let debounceTimer   = null

function initials(name)  { return (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() }
function kycBadge(s)     { return {none:'badge--gray',pending:'badge--amber',verified:'badge--green',rejected:'badge--red'}[s]||'badge--gray' }
function statusBadge(s)  { return {active:'badge--green',suspended:'badge--red',closed:'badge--gray'}[s]||'badge--gray' }
function formatDate(d)   { return d ? new Date(d).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'}) : '—' }

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.users({
      search: search.value,
      status: statusFilter.value,
      kyc_status: kycFilter.value,
      page: page.value,
    })
    users.value = data
  } finally { loading.value = false }
}

function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }
function openSuspend(user) { suspendTarget.value = user; suspendReason.value = '' }

async function suspend() {
  actionLoading.value = true
  try {
    await adminApi.userSuspend(suspendTarget.value.id, suspendReason.value)
    ui.success('User suspended')
    suspendTarget.value = null
    await load()
  } catch(e) { ui.error(e.response?.data?.message || 'Failed') }
  finally { actionLoading.value = false }
}

async function restore(id) {
  try { await adminApi.userRestore(id); ui.success('User restored'); await load() }
  catch { ui.error('Failed') }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 24px 20px; max-width: 1100px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

/* Filters */
.filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.search-box {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
  padding: 10px 14px;
}
.search-box i { color: #94a3b8; font-size: 13px; }
.search-box input { border: none; outline: none; font-size: 14px; color: #374151; width: 100%; background: transparent; }
.filter-row { display: flex; gap: 10px; }
.filter-row select {
  flex: 1; padding: 10px 12px; border: 1px solid var(--border);
  border-radius: 12px; font-size: 13px; background: var(--bg-card); outline: none;
}

/* Table card */
.table-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

/* States */
.state-center {
  padding: 56px; text-align: center; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.state-center i { font-size: 28px; }
.state-center p { font-size: 14px; }

/* Desktop table */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  padding: 11px 16px; text-align: left; font-size: 11px;
  font-weight: 700; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.05em; background: #f8fafc;
  border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
.data-table td {
  padding: 13px 16px; border-bottom: 1px solid #f1f5f9;
  font-size: 13px; color: #374151; vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #fafafa; }

/* Cells */
.cell-user { display: flex; align-items: center; gap: 10px; }
.cell-avatar {
  width: 34px; height: 34px; background: var(--accent);
  border-radius: 9px; display: flex; align-items: center;
  justify-content: center; color: var(--text-inverse); font-size: 12px;
  font-weight: 700; flex-shrink: 0;
}
.cell-user__name { font-weight: 600; color: #111827; font-size: 13px; }
.cell-user__sub  { font-size: 12px; color: #9ca3af; margin-top: 1px; }
.cell-secondary  { color: #64748b; font-size: 13px; }

/* Badges */
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.badge--sm    { padding: 2px 6px; font-size: 10px; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: var(--accent-dim); color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }

/* Action buttons */
.action-btn {
  padding: 6px 12px; border: none; border-radius: 8px;
  font-size: 12px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 5px;
  transition: all 0.15s; white-space: nowrap;
}
.action-btn--danger  { background: #fef2f2; color: #dc2626; }
.action-btn--danger:hover  { background: #fee2e2; }
.action-btn--success { background: #f0fdf4; color: #16a34a; }
.action-btn--success:hover { background: #dcfce7; }

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 14px; font-size: 13px; color: #64748b;
  border-top: 1px solid #f1f5f9;
}
.pagination button {
  width: 32px; height: 32px; border: 1px solid var(--border);
  background: var(--bg-card); border-radius: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #475569; transition: all 0.15s;
}
.pagination button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

/* Mobile list — hidden on desktop */
.mobile-list { display: none; }

.mobile-row {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
}
.mobile-row:last-child { border-bottom: none; }
.mobile-row__top {
  display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
}
.mobile-row__info { flex: 1; min-width: 0; }
.mobile-row__meta {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  font-size: 12px; color: #64748b; margin-bottom: 10px;
}
.mobile-row__meta i { font-size: 11px; color: #94a3b8; margin-right: 3px; }
.mobile-row__actions { display: flex; }
.mobile-row__actions .action-btn { flex: 1; justify-content: center; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
.modal { background: var(--bg-card); border-radius: 20px 20px 0 0; width: 100%; max-width: 480px; padding-bottom: env(safe-area-inset-bottom); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 20px 0; margin-bottom: 16px; }
.modal-header h3 { font-size: 16px; font-weight: 700; }
.modal-header button { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.modal-body { padding: 0 20px 16px; }
.modal-body p { font-size: 13px; color: #64748b; margin-bottom: 14px; }
.modal-body label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.modal-body textarea { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; resize: none; box-sizing: border-box; }
.modal-footer { display: flex; gap: 10px; padding: 0 20px 20px; }
.btn-ghost  { flex: 1; padding: 12px; background: #f8fafc; color: #475569; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-danger { flex: 1; padding: 12px; background: #dc2626; color: var(--text-inverse); border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Responsive */
@media (max-width: 640px) {
  .table-wrap  { display: none; }
  .mobile-list { display: block; }
}

@media (min-width: 641px) {
  .filters { flex-direction: row; align-items: center; }
  .search-box { flex: 1; }
  .filter-row { flex-shrink: 0; }
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 16px; }
}
</style>
