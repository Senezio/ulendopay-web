<template>
  <AdminLayout>
    <div class="ap">

      <div class="ap__head">
        <div class="ap__head-text">
          <h1>Users</h1>
          <p>{{ users?.total ?? '—' }} customer accounts</p>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="search" placeholder="Search name or email…" @input="debouncedLoad" />
          </div>
          <div class="filters">
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

        <!-- Desktop table -->
        <div class="table-wrap">
          <table v-if="users?.data?.length" class="dt">
            <thead>
              <tr>
                <th>User</th>
                <th>Country</th>
                <th>KYC</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users.data" :key="u.id" @click="viewUser(u.id)" class="dt__row">
                <td>
                  <div class="uname">{{ u.name }}</div>
                  <div class="umeta">{{ u.email || u.phone }}</div>
                </td>
                <td><span class="country">{{ u.country_code }}</span></td>
                <td><span class="pill" :class="kycClass(u.kyc_status)">{{ u.kyc_status }}</span></td>
                <td><span class="pill" :class="statusClass(u.status)">{{ u.status }}</span></td>
                <td class="date">{{ fmtDate(u.created_at) }}</td>
                <td>
                  <div class="row-actions" @click.stop>
                    <button class="ia ia--eye" title="View" @click="viewUser(u.id)"><i class="fa-solid fa-eye"></i></button>
                    <button v-if="u.status==='active'" class="ia ia--ban" title="Suspend" @click="openSuspend(u)"><i class="fa-solid fa-ban"></i></button>
                    <button v-else class="ia ia--ok" title="Restore" @click="restore(u.id)"><i class="fa-solid fa-circle-check"></i></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile cards -->
          <div v-if="users?.data?.length" class="mcards">
            <div v-for="u in users.data" :key="u.id" class="mcard" @click="viewUser(u.id)">
              <div class="mcard__top">
                <div class="mcard__user">
                  <div class="uname">{{ u.name }}</div>
                  <div class="umeta">{{ u.email || u.phone }}</div>
                </div>
                <span class="pill" :class="statusClass(u.status)">{{ u.status }}</span>
              </div>
              <div class="mcard__row">
                <span class="mcard__label">Country</span>
                <span class="country">{{ u.country_code }}</span>
              </div>
              <div class="mcard__row">
                <span class="mcard__label">KYC</span>
                <span class="pill" :class="kycClass(u.kyc_status)">{{ u.kyc_status }}</span>
              </div>
              <div class="mcard__row">
                <span class="mcard__label">Joined</span>
                <span class="date">{{ fmtDate(u.created_at) }}</span>
              </div>
              <div class="mcard__actions" @click.stop>
                <button class="ia ia--ban" v-if="u.status==='active'" @click="openSuspend(u)">
                  <i class="fa-solid fa-ban"></i> Suspend
                </button>
                <button class="ia ia--ok ia--wide" v-else @click="restore(u.id)">
                  <i class="fa-solid fa-circle-check"></i> Restore
                </button>
              </div>
            </div>
          </div>

          <div v-else-if="!loading" class="empty">
            <i class="fa-solid fa-users"></i>
            <span>No users match your filters</span>
          </div>
        </div>

        <div v-if="users?.last_page > 1" class="pager">
          <button :disabled="page===1" @click="page--;load()"><i class="fa-solid fa-chevron-left"></i></button>
          <span>{{ page }} / {{ users.last_page }}</span>
          <button :disabled="page===users.last_page" @click="page++;load()"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>

      <!-- Suspend modal -->
      <div v-if="suspendTarget" class="overlay" @click.self="suspendTarget=null">
        <div class="modal">
          <div class="modal__hd">
            <div>
              <div class="modal__title">Suspend Account</div>
              <div class="modal__sub">{{ suspendTarget.name }}</div>
            </div>
            <button class="modal__x" @click="suspendTarget=null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal__bd">
            <p class="modal__warn"><i class="fa-solid fa-triangle-exclamation"></i> This will revoke all active sessions immediately.</p>
            <label class="flabel">Reason for suspension</label>
            <textarea v-model="suspendReason" rows="3" placeholder="Describe why this account is being suspended…" class="ftarea"></textarea>
          </div>
          <div class="modal__ft">
            <button class="btn-ghost" @click="suspendTarget=null">Cancel</button>
            <button class="btn-red" :disabled="!suspendReason||actionLoading" @click="suspend">
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
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
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

const kycClass = s => ({ none:'pill--gray', pending:'pill--amber', verified:'pill--green', rejected:'pill--red' }[s]||'pill--gray')
const statusClass = s => ({ active:'pill--green', suspended:'pill--red', closed:'pill--gray' }[s]||'pill--gray')
const fmtDate = d => d ? new Date(d).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'}) : '—'

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.users({ search: search.value, status: statusFilter.value, kyc_status: kycFilter.value, page: page.value })
    users.value = data
  } finally { loading.value = false }
}

function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }
function viewUser(id) { router.push(`/admin/users/${id}`) }
function openSuspend(u) { suspendTarget.value = u; suspendReason.value = '' }

async function suspend() {
  actionLoading.value = true
  try {
    await adminApi.userSuspend(suspendTarget.value.id, suspendReason.value)
    ui.success('User suspended')
    suspendTarget.value = null
    await load()
  } catch(e) { ui.error(e.response?.data?.message||'Failed') }
  finally { actionLoading.value = false }
}

async function restore(id) {
  try { await adminApi.userRestore(id); ui.success('User restored'); await load() }
  catch { ui.error('Failed') }
}

onMounted(load)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

.ap { padding: 28px 24px 48px; max-width: 1100px; font-family: 'Sora', sans-serif; }

.ap__head { margin-bottom: 24px; }
.ap__head h1 { font-size: 26px; font-weight: 800; color: #0d1117; letter-spacing: -0.03em; }
.ap__head p  { font-size: 13px; color: #6b7280; margin-top: 3px; font-weight: 500; }

.card { background: #fff; border-radius: 16px; border: 1px solid #e8edf2; box-shadow: 0 1px 4px rgba(0,0,0,0.05); overflow: hidden; }

.toolbar { display: flex; gap: 10px; padding: 16px; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; align-items: center; }
.search { display: flex; align-items: center; gap: 8px; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 9px 14px; flex: 1; min-width: 180px; transition: border-color 0.15s; }
.search:focus-within { border-color: #ea580c; }
.search i { color: #94a3b8; font-size: 13px; flex-shrink: 0; }
.search input { border: none; background: transparent; outline: none; font-size: 14px; color: #1e293b; width: 100%; font-family: inherit; }
.filters { display: flex; gap: 8px; flex-wrap: wrap; }
.filters select { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #374151; background: #fff; outline: none; cursor: pointer; font-family: inherit; transition: border-color 0.15s; }
.filters select:focus { border-color: #ea580c; }

/* Desktop table */
.table-wrap { overflow-x: auto; }
.dt { width: 100%; border-collapse: collapse; }
.dt thead tr { background: #f8fafc; }
.dt th { padding: 11px 18px; text-align: left; font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.dt td { padding: 14px 18px; border-bottom: 1px solid #f8fafc; font-size: 14px; vertical-align: middle; }
.dt__row { cursor: pointer; transition: background 0.1s; }
.dt__row:hover td { background: #fdf8f5; }
.dt__row:hover td:first-child { box-shadow: inset 3px 0 0 #ea580c; }
.dt tr:last-child td { border-bottom: none; }

.uname { font-weight: 700; color: #0d1117; font-size: 14px; }
.umeta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.country { font-family: 'DM Mono', monospace; font-size: 12px; background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 5px; font-weight: 500; }
.date { font-family: 'DM Mono', monospace; font-size: 12px; color: #6b7280; }

.pill { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; text-transform: capitalize; }
.pill--green { background: #dcfce7; color: #15803d; }
.pill--red   { background: #fee2e2; color: #b91c1c; }
.pill--amber { background: #fef3c7; color: #b45309; }
.pill--gray  { background: #f1f5f9; color: #475569; }
.pill--blue  { background: #dbeafe; color: #1d4ed8; }

.row-actions { display: flex; gap: 6px; }
.ia { border: none; border-radius: 8px; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; transition: all 0.15s; gap: 5px; font-family: inherit; font-weight: 600; }
.ia:not(.ia--wide) { width: 30px; height: 30px; }
.ia--wide { padding: 6px 12px; }
.ia--eye { background: #eff6ff; color: #2563eb; }
.ia--eye:hover { background: #dbeafe; }
.ia--ban { background: #fef2f2; color: #dc2626; }
.ia--ban:hover { background: #fee2e2; }
.ia--ok  { background: #f0fdf4; color: #16a34a; }
.ia--ok:hover  { background: #dcfce7; }

.empty { padding: 56px 24px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty i { font-size: 30px; opacity: 0.5; }
.empty span { font-size: 14px; font-weight: 500; }

.pager { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b; font-family: 'DM Mono', monospace; }
.pager button { width: 32px; height: 32px; border: 1.5px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #374151; transition: all 0.15s; }
.pager button:hover:not(:disabled) { border-color: #ea580c; color: #ea580c; }
.pager button:disabled { opacity: 0.3; cursor: not-allowed; }

/* Mobile cards — shown below 700px */
.mcards { display: none; }
@media (max-width: 700px) {
  .dt { display: none; }
  .mcards { display: flex; flex-direction: column; }
  .mcard { padding: 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.1s; }
  .mcard:hover { background: #fdf8f5; }
  .mcard:last-child { border-bottom: none; }
  .mcard__top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
  .mcard__row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #f8fafc; }
  .mcard__row:last-of-type { border-bottom: none; }
  .mcard__label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .mcard__actions { margin-top: 12px; display: flex; gap: 8px; }
}

/* Modal */
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 200; padding: 0; }
@media (min-width: 600px) { .overlay { align-items: center; padding: 20px; } }
.modal { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-width: 480px; }
@media (min-width: 600px) { .modal { border-radius: 16px; } }
.modal__hd { display: flex; justify-content: space-between; align-items: flex-start; padding: 20px 24px 16px; border-bottom: 1px solid #f1f5f9; }
.modal__title { font-size: 16px; font-weight: 800; color: #0d1117; }
.modal__sub  { font-size: 13px; color: #6b7280; margin-top: 2px; }
.modal__x { width: 30px; height: 30px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal__bd { padding: 20px 24px; }
.modal__warn { display: flex; align-items: center; gap: 8px; background: #fffbeb; color: #92400e; border-radius: 10px; padding: 10px 14px; font-size: 13px; font-weight: 500; margin-bottom: 16px; border: 1px solid #fde68a; }
.flabel { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 8px; letter-spacing: 0.03em; }
.ftarea { width: 100%; padding: 12px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-family: inherit; outline: none; resize: vertical; color: #1e293b; transition: border-color 0.15s; }
.ftarea:focus { border-color: #ea580c; }
.modal__ft { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
.btn-ghost { padding: 10px 20px; background: #f8fafc; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-red { padding: 10px 20px; background: #dc2626; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; transition: background 0.15s; }
.btn-red:hover:not(:disabled) { background: #b91c1c; }
.btn-red:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
