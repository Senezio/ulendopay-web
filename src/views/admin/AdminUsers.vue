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

        <div v-if="loading" class="state-center">
          <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
          <p>Loading users...</p>
        </div>

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
                <tr
                  v-for="user in users.data"
                  :key="user.id"
                  class="clickable-row"
                  :class="{ 'row--active': selectedUser?.id === user.id }"
                  @click="openDetail(user)"
                >
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
                  <td @click.stop>
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

          <!-- Mobile cards -->
          <div class="mobile-list">
            <div
              v-for="user in users.data"
              :key="user.id"
              class="mobile-row"
              @click="openDetail(user)"
            >
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
              <div class="mobile-row__actions" @click.stop>
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

      <!-- ── Detail Drawer ─────────────────────────────────────────────── -->
      <transition name="drawer-fade">
        <div v-if="drawerOpen" class="drawer-overlay" @click.self="closeDetail">
          <transition name="drawer-slide">
            <div v-if="drawerOpen" class="drawer">

              <div class="drawer-header">
                <div class="drawer-header__left">
                  <div class="drawer-avatar">{{ initials(selectedUser?.name) }}</div>
                  <div class="drawer-identity">
                    <div class="drawer-name">{{ selectedUser?.name }}</div>
                    <div class="drawer-sub">{{ selectedUser?.email || selectedUser?.phone || '—' }}</div>
                  </div>
                </div>
                <button class="drawer-close" @click="closeDetail">
                  <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
                </button>
              </div>

              <!-- Loading -->
              <div v-if="detailLoading" class="drawer-loading">
                <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
                <span>Loading profile...</span>
              </div>

              <div v-else-if="detail" class="drawer-body">

                <!-- Status badges -->
                <div class="drawer-badges">
                  <span class="badge" :class="kycBadge(detail.user.kyc_status)">
                    <i class="fa-sharp-duotone fa-solid fa-id-card"></i>
                    KYC: {{ detail.user.kyc_status }}
                  </span>
                  <span class="badge" :class="statusBadge(detail.user.status)">
                    <i class="fa-sharp-duotone fa-solid fa-circle"></i>
                    {{ detail.user.status }}
                  </span>
                  <span class="badge badge--gray">
                    <i class="fa-sharp-duotone fa-solid fa-layer-group"></i>
                    Tier: {{ detail.user.tier || 'unverified' }}
                  </span>
                </div>

                <!-- Key facts grid -->
                <div class="detail-grid">
                  <div class="detail-item">
                    <div class="detail-item__label">
                      <i class="fa-sharp-duotone fa-solid fa-clock-rotate-left"></i> Last Login
                    </div>
                    <div class="detail-item__value" :class="{ 'text-muted': !detail.user.last_login_at }">
                      {{ detail.user.last_login_at ? timeAgo(detail.user.last_login_at) : 'Never' }}
                    </div>
                    <div v-if="detail.user.last_login_at" class="detail-item__sub">
                      {{ formatDate(detail.user.last_login_at) }}
                    </div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item__label">
                      <i class="fa-sharp-duotone fa-solid fa-calendar-plus"></i> Member Since
                    </div>
                    <div class="detail-item__value">{{ formatDate(detail.user.created_at) }}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item__label">
                      <i class="fa-sharp-duotone fa-solid fa-location-dot"></i> Country
                    </div>
                    <div class="detail-item__value">{{ detail.user.country_code || '—' }}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-item__label">
                      <i class="fa-sharp-duotone fa-solid fa-phone"></i> Phone
                    </div>
                    <div class="detail-item__value">{{ detail.user.phone || '—' }}</div>
                  </div>
                </div>

                <!-- Wallets -->
                <div v-if="detail.wallets?.length" class="drawer-section">
                  <div class="drawer-section__title">
                    <i class="fa-sharp-duotone fa-solid fa-wallet"></i> Wallets
                  </div>
                  <div class="wallet-list">
                    <div v-for="w in detail.wallets" :key="w.id" class="wallet-item">
                      <div class="wallet-item__currency">{{ w.currency_code || w.account?.currency_code || '—' }}</div>
                      <div class="wallet-item__balance">
                        {{ formatAmount(w.account?.balance?.balance ?? w.balance ?? 0) }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Transactions -->
                <div class="drawer-section">
                  <div class="drawer-section__title">
                    <i class="fa-sharp-duotone fa-solid fa-arrow-right-arrow-left"></i>
                    Recent Transactions
                    <span class="section-count">{{ detail.transactions?.length ?? 0 }}</span>
                  </div>

                  <div v-if="!detail.transactions?.length" class="empty-section">
                    No transactions yet
                  </div>

                  <template v-else>

                    <!-- Summary stats -->
                    <div class="tx-stats">
                      <div class="tx-stat">
                        <div class="tx-stat__num">{{ txStats.total }}</div>
                        <div class="tx-stat__label">Shown</div>
                      </div>
                      <div class="tx-stat">
                        <div class="tx-stat__num tx-stat__num--green">{{ txStats.completed }}</div>
                        <div class="tx-stat__label">Completed</div>
                      </div>
                      <div class="tx-stat">
                        <div class="tx-stat__num tx-stat__num--red">{{ txStats.failed }}</div>
                        <div class="tx-stat__label">Failed</div>
                      </div>
                      <div class="tx-stat">
                        <div class="tx-stat__num">{{ txStats.totalVolume }}</div>
                        <div class="tx-stat__label">Vol. sent</div>
                      </div>
                    </div>

                    <!-- Corridor breakdown -->
                    <div v-if="corridors.length" class="corridors">
                      <div class="corridors__label">Corridors used</div>
                      <div v-for="c in corridors" :key="c.key" class="corridor-row">
                        <div class="corridor-row__path">
                          <span class="currency-tag">{{ c.from }}</span>
                          <i class="fa-sharp-duotone fa-solid fa-arrow-right"></i>
                          <span class="currency-tag">{{ c.to }}</span>
                        </div>
                        <div class="corridor-row__bar-wrap">
                          <div
                            class="corridor-row__bar"
                            :style="{ width: (c.count / txStats.total * 100) + '%' }"
                          ></div>
                        </div>
                        <div class="corridor-row__count">{{ c.count }}×</div>
                      </div>
                    </div>

                    <!-- Transaction list -->
                    <div class="tx-list">
                      <div v-for="tx in detail.transactions" :key="tx.id" class="tx-item">
                        <div class="tx-item__left">
                          <div class="tx-item__ref">{{ tx.reference_number }}</div>
                          <div class="tx-item__meta">
                            {{ tx.send_currency }} → {{ tx.receive_currency }}
                            · {{ formatDate(tx.created_at) }}
                          </div>
                        </div>
                        <div class="tx-item__right">
                          <div class="tx-item__amount">
                            {{ formatAmount(tx.send_amount) }} {{ tx.send_currency }}
                          </div>
                          <span class="badge badge--sm" :class="txStatusBadge(tx.status)">
                            {{ tx.status }}
                          </span>
                        </div>
                      </div>
                    </div>

                  </template>
                </div>

                <!-- KYC records -->
                <div v-if="detail.kyc_records?.length" class="drawer-section">
                  <div class="drawer-section__title">
                    <i class="fa-sharp-duotone fa-solid fa-id-card"></i> KYC History
                  </div>
                  <div class="kyc-list">
                    <div v-for="k in detail.kyc_records" :key="k.id" class="kyc-item">
                      <span class="badge badge--sm" :class="kycBadge(k.status)">{{ k.status }}</span>
                      <span class="kyc-item__type">{{ k.document_type || 'Document' }}</span>
                      <span class="kyc-item__date">{{ formatDate(k.created_at) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Drawer action -->
                <div class="drawer-actions">
                  <button
                    v-if="detail.user.status === 'active'"
                    class="action-btn action-btn--danger action-btn--full"
                    @click="openSuspendFromDrawer"
                  >
                    <i class="fa-sharp-duotone fa-solid fa-ban"></i> Suspend User
                  </button>
                  <button
                    v-else
                    class="action-btn action-btn--success action-btn--full"
                    @click="restoreFromDrawer"
                  >
                    <i class="fa-sharp-duotone fa-solid fa-circle-check"></i> Restore User
                  </button>
                </div>

              </div>
            </div>
          </transition>
        </div>
      </transition>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

// Drawer state
const drawerOpen    = ref(false)
const selectedUser  = ref(null)
const detail        = ref(null)
const detailLoading = ref(false)

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name) {
  return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function kycBadge(s) {
  return { none: 'badge--gray', pending: 'badge--amber', verified: 'badge--green', rejected: 'badge--red' }[s] || 'badge--gray'
}

function statusBadge(s) {
  return { active: 'badge--green', suspended: 'badge--red', closed: 'badge--gray' }[s] || 'badge--gray'
}

function txStatusBadge(s) {
  return {
    completed: 'badge--green', failed: 'badge--red',
    processing: 'badge--amber', retrying: 'badge--amber',
    escrowed: 'badge--amber', refunded: 'badge--gray',
  }[s] || 'badge--gray'
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

function formatAmount(n) {
  if (n === null || n === undefined) return '—'
  return Number(n).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  if (weeks < 5)  return `${weeks}w ago`
  return `${months}mo ago`
}

// ── Computed: tx stats and corridors derived from detail.transactions ─────────

const txStats = computed(() => {
  const txs = detail.value?.transactions ?? []
  const completed = txs.filter(t => t.status === 'completed')
  return {
    total:       txs.length,
    completed:   completed.length,
    failed:      txs.filter(t => t.status === 'failed').length,
    totalVolume: completed
      .reduce((sum, t) => sum + Number(t.send_amount || 0), 0)
      .toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }
})

const corridors = computed(() => {
  const txs = detail.value?.transactions ?? []
  const map = {}
  for (const tx of txs) {
    if (!tx.send_currency || !tx.receive_currency) continue
    const key = `${tx.send_currency}-${tx.receive_currency}`
    if (!map[key]) map[key] = { key, from: tx.send_currency, to: tx.receive_currency, count: 0 }
    map[key].count++
  }
  return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5)
})

// ── Data loading ──────────────────────────────────────────────────────────────

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.users({
      search:     search.value,
      status:     statusFilter.value,
      kyc_status: kycFilter.value,
      page:       page.value,
    })
    users.value = data
  } finally {
    loading.value = false
  }
}

function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 400)
}

// ── Drawer ────────────────────────────────────────────────────────────────────

async function openDetail(user) {
  selectedUser.value  = user
  drawerOpen.value    = true
  detail.value        = null
  detailLoading.value = true
  try {
    const { data } = await adminApi.userShow(user.id)
    detail.value = data
  } catch {
    ui.error('Failed to load user details')
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  drawerOpen.value   = false
  selectedUser.value = null
  detail.value       = null
}

// ── Actions ───────────────────────────────────────────────────────────────────

function openSuspend(user) {
  suspendTarget.value = user
  suspendReason.value = ''
}

function openSuspendFromDrawer() {
  suspendTarget.value = selectedUser.value
  suspendReason.value = ''
}

async function restoreFromDrawer() {
  await restore(selectedUser.value.id)
  closeDetail()
}

async function suspend() {
  actionLoading.value = true
  try {
    await adminApi.userSuspend(suspendTarget.value.id, suspendReason.value)
    ui.success('User suspended')
    suspendTarget.value = null
    closeDetail()
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Failed')
  } finally {
    actionLoading.value = false
  }
}

async function restore(id) {
  try {
    await adminApi.userRestore(id)
    ui.success('User restored')
    await load()
  } catch {
    ui.error('Failed')
  }
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
.table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }

/* States */
.state-center { padding: 56px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.state-center i { font-size: 28px; }
.state-center p { font-size: 14px; }

/* Desktop table */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc;
  border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
.data-table td { padding: 13px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #374151; vertical-align: middle; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #fafafa; }
.clickable-row { cursor: pointer; }
.row--active td { background: #fff7f0 !important; }

/* Cells */
.cell-user { display: flex; align-items: center; gap: 10px; }
.cell-avatar {
  width: 34px; height: 34px; background: var(--accent); border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-inverse); font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.cell-user__name { font-weight: 600; color: #111827; font-size: 13px; }
.cell-user__sub  { font-size: 12px; color: #9ca3af; margin-top: 1px; }
.cell-secondary  { color: #64748b; font-size: 13px; }

/* Badges */
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.badge--sm    { padding: 2px 6px; font-size: 10px; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: var(--accent-dim); color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }

/* Action buttons */
.action-btn {
  padding: 6px 12px; border: none; border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.15s; white-space: nowrap;
}
.action-btn--danger  { background: #fef2f2; color: #dc2626; }
.action-btn--danger:hover  { background: #fee2e2; }
.action-btn--success { background: #f0fdf4; color: #16a34a; }
.action-btn--success:hover { background: #dcfce7; }
.action-btn--full { width: 100%; justify-content: center; padding: 11px; font-size: 13px; }

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 14px; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9;
}
.pagination button {
  width: 32px; height: 32px; border: 1px solid var(--border); background: var(--bg-card);
  border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #475569; transition: all 0.15s;
}
.pagination button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

/* Mobile list */
.mobile-list { display: none; }
.mobile-row { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; cursor: pointer; }
.mobile-row:last-child { border-bottom: none; }
.mobile-row__top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.mobile-row__info { flex: 1; min-width: 0; }
.mobile-row__meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 12px; color: #64748b; margin-bottom: 10px; }
.mobile-row__meta i { font-size: 11px; color: #94a3b8; margin-right: 3px; }
.mobile-row__actions { display: flex; }
.mobile-row__actions .action-btn { flex: 1; justify-content: center; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 200; }
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

/* ── Drawer ────────────────────────────────────────────────────────────────── */
.drawer-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.45);
  z-index: 100; display: flex; justify-content: flex-end;
}
.drawer {
  width: 100%; max-width: 400px; height: 100%;
  background: var(--bg-card); display: flex; flex-direction: column;
  overflow: hidden; box-shadow: -6px 0 24px rgba(0,0,0,0.1);
}

.drawer-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.drawer-header__left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.drawer-avatar {
  width: 42px; height: 42px; background: var(--accent); border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  color: var(--text-inverse); font-size: 14px; font-weight: 700; flex-shrink: 0;
}
.drawer-identity { min-width: 0; }
.drawer-name { font-size: 15px; font-weight: 700; color: #0f172a; }
.drawer-sub  { font-size: 12px; color: #94a3b8; margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; }
.drawer-close {
  background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 9px;
  cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center;
  justify-content: center; flex-shrink: 0; transition: background 0.15s;
}
.drawer-close:hover { background: #e2e8f0; }

.drawer-loading {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; color: #94a3b8; font-size: 14px;
}
.drawer-loading i { font-size: 22px; }

.drawer-body {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 18px;
}

.drawer-badges { display: flex; flex-wrap: wrap; gap: 6px; }
.drawer-badges .badge i { font-size: 10px; }

/* Detail grid */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.detail-item { background: #f8fafc; border-radius: 10px; padding: 10px 12px; }
.detail-item__label {
  font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;
}
.detail-item__label i { font-size: 10px; }
.detail-item__value { font-size: 13px; font-weight: 600; color: #0f172a; }
.detail-item__sub   { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.text-muted { color: #94a3b8 !important; font-style: italic; font-weight: 400 !important; }

/* Sections */
.drawer-section { display: flex; flex-direction: column; gap: 10px; }
.drawer-section__title {
  font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;
}
.section-count { background: #f1f5f9; color: #64748b; border-radius: 10px; padding: 1px 7px; font-size: 11px; font-weight: 600; }
.empty-section { font-size: 13px; color: #94a3b8; }

/* Wallets */
.wallet-list { display: flex; gap: 8px; flex-wrap: wrap; }
.wallet-item { background: #f8fafc; border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; min-width: 88px; }
.wallet-item__currency { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
.wallet-item__balance  { font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 3px; }

/* TX stats */
.tx-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.tx-stat { background: #f8fafc; border-radius: 10px; padding: 10px 6px; text-align: center; }
.tx-stat__num { font-size: 16px; font-weight: 800; color: #0f172a; }
.tx-stat__num--green { color: #16a34a; }
.tx-stat__num--red   { color: #dc2626; }
.tx-stat__label { font-size: 10px; color: #94a3b8; margin-top: 3px; }

/* Corridors */
.corridors { display: flex; flex-direction: column; gap: 8px; }
.corridors__label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.corridor-row { display: flex; align-items: center; gap: 8px; }
.corridor-row__path { display: flex; align-items: center; gap: 5px; width: 116px; flex-shrink: 0; }
.currency-tag { background: #f1f5f9; border-radius: 5px; padding: 2px 6px; font-size: 11px; font-weight: 700; color: #374151; }
.corridor-row__path i { font-size: 9px; color: #94a3b8; }
.corridor-row__bar-wrap { flex: 1; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; }
.corridor-row__bar { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.4s ease; min-width: 6px; }
.corridor-row__count { font-size: 11px; font-weight: 600; color: #64748b; width: 24px; text-align: right; flex-shrink: 0; }

/* TX list */
.tx-list { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.tx-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
.tx-item:last-child { border-bottom: none; }
.tx-item__left { min-width: 0; }
.tx-item__ref  { font-size: 12px; font-weight: 600; color: #0f172a; }
.tx-item__meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
.tx-item__right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; margin-left: 8px; }
.tx-item__amount { font-size: 12px; font-weight: 600; color: #374151; }

/* KYC list */
.kyc-list { display: flex; flex-direction: column; gap: 7px; }
.kyc-item { display: flex; align-items: center; gap: 8px; font-size: 12px; }
.kyc-item__type { color: #374151; flex: 1; }
.kyc-item__date { color: #94a3b8; }

/* Drawer actions */
.drawer-actions { margin-top: auto; padding-top: 4px; }

/* Transitions */
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: background 0.25s; }
.drawer-fade-enter-from,   .drawer-fade-leave-to    { background: transparent; }
.drawer-slide-enter-active { transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-slide-leave-active { transition: transform 0.22s ease-in; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

/* Responsive */
@media (max-width: 640px) {
  .table-wrap  { display: none; }
  .mobile-list { display: block; }
  .drawer      { max-width: 100%; }
  .tx-stats    { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 641px) {
  .filters { flex-direction: row; align-items: center; }
  .search-box { flex: 1; }
  .filter-row { flex-shrink: 0; }
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 16px; }
}
</style>
