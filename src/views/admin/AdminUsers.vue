<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div>
          <h1>Users</h1>
          <p>Manage customer accounts</p>
        </div>
      </div>

      <div class="admin-table-card">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="search" placeholder="Search by name or email..." @input="debouncedLoad" />
          </div>
          <div class="filter-group">
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

        <table v-if="users?.data?.length" class="admin-table">
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
                  <div class="cell-user__name">{{ user.name }}</div>
                  <div class="cell-user__meta">{{ user.email }}</div>
                </div>
              </td>
              <td>{{ user.country_code }}</td>
              <td><span class="badge" :class="kycBadge(user.kyc_status)">{{ user.kyc_status }}</span></td>
              <td><span class="badge" :class="statusBadge(user.status)">{{ user.status }}</span></td>
              <td class="cell-date">{{ formatDate(user.created_at) }}</td>
              <td>
                <div class="cell-actions">
                  <button class="btn-action btn-action--view" @click="viewUser(user.id)">
                    <i class="fa-solid fa-eye"></i>
                  </button>
                  <button v-if="user.status === 'active'" class="btn-action btn-action--danger" @click="openSuspend(user)">
                    <i class="fa-solid fa-ban"></i>
                  </button>
                  <button v-else class="btn-action btn-action--success" @click="restore(user.id)">
                    <i class="fa-solid fa-circle-check"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else-if="!loading" class="table-empty">
          <i class="fa-solid fa-users"></i>
          <p>No users found</p>
        </div>

        <!-- Pagination -->
        <div v-if="users?.last_page > 1" class="table-pagination">
          <button :disabled="page === 1" @click="page--; load()">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <span>Page {{ page }} of {{ users.last_page }}</span>
          <button :disabled="page === users.last_page" @click="page++; load()">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Suspend Modal -->
      <div v-if="suspendTarget" class="modal-overlay" @click.self="suspendTarget = null">
        <div class="modal">
          <div class="modal__header">
            <h3>Suspend {{ suspendTarget.name }}</h3>
            <button class="modal__close" @click="suspendTarget = null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal__body">
            <p style="font-size:14px;color:#64748b;margin-bottom:16px;">
              This will immediately revoke all active sessions and prevent the user from logging in.
            </p>
            <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:8px;">Reason</label>
            <textarea v-model="suspendReason" rows="3" placeholder="Reason for suspension..." style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:10px;font-size:14px;font-family:inherit;outline:none;resize:vertical;"></textarea>
          </div>
          <div class="modal__footer">
            <button class="btn-ghost" @click="suspendTarget = null">Cancel</button>
            <button class="btn-danger" :disabled="!suspendReason || actionLoading" @click="suspend">
              <i v-if="actionLoading" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-ban"></i>
              Suspend User
            </button>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const router        = useRouter()
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

function kycBadge(s)    { return { none:'badge--gray', pending:'badge--amber', verified:'badge--green', rejected:'badge--red' }[s] || 'badge--gray' }
function statusBadge(s) { return { active:'badge--green', suspended:'badge--red', closed:'badge--gray' }[s] || 'badge--gray' }
function formatDate(d)  { return d ? new Date(d).toLocaleDateString('en', { day:'numeric', month:'short', year:'numeric' }) : '' }

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.users({ search: search.value, status: statusFilter.value, kyc_status: kycFilter.value, page: page.value })
    users.value = data
  } finally { loading.value = false }
}

function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 400)
}

function viewUser(id) { router.push(`/admin/users/${id}`) }
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
  try {
    await adminApi.userRestore(id)
    ui.success('User restored')
    await load()
  } catch(e) { ui.error('Failed to restore user') }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 32px; max-width: 1200px; }
.admin-page__header { margin-bottom: 24px; }
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }
.admin-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; gap: 12px; flex-wrap: wrap; }
.search-box { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; flex: 1; min-width: 200px; }
.search-box i { color: #94a3b8; font-size: 13px; }
.search-box input { border: none; background: transparent; outline: none; font-size: 14px; color: #374151; width: 100%; }
.filter-group { display: flex; gap: 8px; }
.filter-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #374151; background: #fff; outline: none; cursor: pointer; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.admin-table td { padding: 14px 20px; border-bottom: 1px solid #f8fafc; font-size: 14px; color: #374151; }
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tr:hover td { background: #fafafa; }
.cell-user__name { font-weight: 600; color: #111827; }
.cell-user__meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.cell-date { font-size: 13px; color: #64748b; }
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--gray  { background: #f1f5f9; color: #475569; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #d97706; }
.cell-actions { display: flex; gap: 6px; }
.btn-action { width: 30px; height: 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.btn-action--view    { background: #eff6ff; color: #2563eb; }
.btn-action--danger  { background: #fef2f2; color: #dc2626; }
.btn-action--success { background: #f0fdf4; color: #16a34a; }
.table-empty { padding: 48px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.table-empty i { font-size: 32px; }
.table-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b; }
.table-pagination button { width: 32px; height: 32px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.table-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: #fff; border-radius: 16px; width: 100%; max-width: 480px; }
.modal__header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
.modal__header h3 { font-size: 16px; font-weight: 700; }
.modal__close { width: 30px; height: 30px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.modal__body { padding: 24px; }
.modal__footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
.btn-ghost { padding: 10px 20px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-danger { padding: 10px 20px; background: #dc2626; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
