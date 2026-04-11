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
          <i class="fa-solid fa-magnifying-glass"></i>
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

      <!-- Loading -->
      <div v-if="loading" class="state-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading users...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!users?.data?.length" class="state-empty">
        <i class="fa-solid fa-users"></i>
        <p>No users found</p>
      </div>

      <!-- User cards (mobile) / table (desktop) -->
      <template v-else>
        <!-- Mobile cards -->
        <div class="user-cards">
          <div v-for="user in users.data" :key="user.id" class="user-card">
            <div class="user-card__top">
              <div class="user-card__avatar">{{ initials(user.name) }}</div>
              <div class="user-card__info">
                <div class="user-card__name">{{ user.name }}</div>
                <div class="user-card__email">{{ user.email }}</div>
              </div>
              <span class="badge" :class="statusBadge(user.status)">{{ user.status }}</span>
            </div>
            <div class="user-card__meta">
              <div class="meta-item">
                <i class="fa-solid fa-location-dot"></i>
                {{ user.country_code || '—' }}
              </div>
              <div class="meta-item">
                <i class="fa-solid fa-id-card"></i>
                <span class="badge badge--sm" :class="kycBadge(user.kyc_status)">{{ user.kyc_status }}</span>
              </div>
              <div class="meta-item">
                <i class="fa-solid fa-calendar"></i>
                {{ formatDate(user.created_at) }}
              </div>
            </div>
            <div class="user-card__actions">
              <button v-if="user.status === 'active'" class="action-btn action-btn--danger" @click="openSuspend(user)">
                <i class="fa-solid fa-ban"></i> Suspend
              </button>
              <button v-else class="action-btn action-btn--success" @click="restore(user.id)">
                <i class="fa-solid fa-circle-check"></i> Restore
              </button>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="users.last_page > 1" class="pagination">
          <button :disabled="page === 1" @click="page--; load()">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span>{{ page }} / {{ users.last_page }}</span>
          <button :disabled="page === users.last_page" @click="page++; load()">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </template>

      <!-- Suspend modal -->
      <div v-if="suspendTarget" class="modal-overlay" @click.self="suspendTarget = null">
        <div class="modal">
          <div class="modal-header">
            <h3>Suspend {{ suspendTarget.name }}?</h3>
            <button @click="suspendTarget = null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <p>This will revoke all active sessions immediately.</p>
            <label>Reason</label>
            <textarea v-model="suspendReason" rows="3" placeholder="Reason for suspension..."></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="suspendTarget = null">Cancel</button>
            <button class="btn-danger" :disabled="!suspendReason || actionLoading" @click="suspend">
              <i v-if="actionLoading" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-ban"></i>
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

const ui = useUiStore()
const users = ref(null)
const loading = ref(false)
const actionLoading = ref(false)
const search = ref('')
const statusFilter = ref('')
const kycFilter = ref('')
const page = ref(1)
const suspendTarget = ref(null)
const suspendReason = ref('')
let debounceTimer = null

function initials(name) { return (name||'?').split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() }
function kycBadge(s)    { return {none:'badge--gray',pending:'badge--amber',verified:'badge--green',rejected:'badge--red'}[s]||'badge--gray' }
function statusBadge(s) { return {active:'badge--green',suspended:'badge--red',closed:'badge--gray'}[s]||'badge--gray' }
function formatDate(d)  { return d ? new Date(d).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'}) : '' }

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.users({ search: search.value, status: statusFilter.value, kyc_status: kycFilter.value, page: page.value })
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
.admin-page { padding: 24px 20px; max-width: 900px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.search-box {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 10px 14px;
}
.search-box i { color: #94a3b8; font-size: 13px; }
.search-box input { border: none; outline: none; font-size: 14px; color: #374151; width: 100%; background: transparent; }
.filter-row { display: flex; gap: 10px; }
.filter-row select {
  flex: 1; padding: 10px 12px; border: 1px solid #e2e8f0;
  border-radius: 12px; font-size: 13px; background: #fff; outline: none;
}

.state-empty {
  text-align: center; padding: 48px; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.state-empty i { font-size: 32px; }
.state-empty p { font-size: 14px; }

/* User cards */
.user-cards { display: flex; flex-direction: column; gap: 10px; }
.user-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
  padding: 16px; transition: box-shadow 0.15s;
}
.user-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.user-card__top { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.user-card__avatar {
  width: 38px; height: 38px; background: var(--accent);
  border-radius: 10px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 13px;
  font-weight: 700; flex-shrink: 0;
}
.user-card__info { flex: 1; min-width: 0; }
.user-card__name  { font-weight: 700; color: #111827; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-card__email { font-size: 12px; color: #9ca3af; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.user-card__meta {
  display: flex; gap: 16px; flex-wrap: wrap;
  padding: 10px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;
  margin-bottom: 12px;
}
.meta-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
.meta-item i { color: #94a3b8; font-size: 11px; }

.user-card__actions { display: flex; gap: 8px; }
.action-btn {
  flex: 1; padding: 8px; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  gap: 6px; transition: all 0.15s;
}
.action-btn--danger  { background: #fef2f2; color: #dc2626; }
.action-btn--danger:hover { background: #fee2e2; }
.action-btn--success { background: #f0fdf4; color: #16a34a; }
.action-btn--success:hover { background: #dcfce7; }

/* Badges */
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.badge--sm { padding: 2px 6px; font-size: 10px; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 16px; font-size: 13px; color: #64748b;
}
.pagination button {
  width: 34px; height: 34px; border: 1px solid #e2e8f0;
  background: #fff; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #475569;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 100; padding: 0; }
.modal { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-width: 480px; padding-bottom: env(safe-area-inset-bottom); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 20px 0; margin-bottom: 16px; }
.modal-header h3 { font-size: 16px; font-weight: 700; }
.modal-header button { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.modal-body { padding: 0 20px 16px; }
.modal-body p { font-size: 13px; color: #64748b; margin-bottom: 14px; }
.modal-body label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.modal-body textarea { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; resize: none; }
.modal-footer { display: flex; gap: 10px; padding: 0 20px 20px; }
.btn-ghost { flex: 1; padding: 12px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-danger { flex: 1; padding: 12px; background: #dc2626; color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

@media (min-width: 769px) {
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 16px; }
}
</style>
