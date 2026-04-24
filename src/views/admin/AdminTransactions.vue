<template>
  <AdminLayout>
    <div class="admin-page">

      <div class="page-header">
        <div>
          <h1>Transactions</h1>
          <p>{{ transactions?.total ?? 0 }} platform transfers</p>
        </div>
        <div class="export-group">
          <button class="btn-export" :disabled="exporting" @click="doExport('csv')">
            <i v-if="exporting==='csv'" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
            <i v-else class="fa-sharp-duotone fa-solid fa-file-csv" />
            CSV
          </button>
          <button class="btn-export" :disabled="exporting" @click="doExport('xlsx')">
            <i v-if="exporting==='xlsx'" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
            <i v-else class="fa-sharp-duotone fa-solid fa-file-excel" />
            Excel
          </button>
          <button class="btn-export" :disabled="exporting" @click="doExport('pdf')">
            <i v-if="exporting==='pdf'" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
            <i v-else class="fa-sharp-duotone fa-solid fa-file-pdf" />
            PDF
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <div class="search-box">
          <i class="fa-sharp-duotone fa-solid fa-magnifying-glass"></i>
          <input v-model="search" placeholder="Search by reference or name..." @input="debouncedLoad" />
        </div>
        <select v-model="statusFilter" @change="load">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="escrowed">Escrowed</option>
          <option value="retrying">Retrying</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select v-model="corridorFilter" @change="load">
          <option value="">All Corridors</option>
          <option v-for="c in availableCorridors" :key="c.key" :value="c">
            {{ c.from }} → {{ c.to }}
          </option>
        </select>
        <input type="date" v-model="fromDate" @change="load" class="date-input" />
        <input type="date" v-model="toDate"   @change="load" class="date-input" />
      </div>

      <!-- Loading / empty -->
      <div v-if="loading" class="state-empty">
        <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
        <p>Loading transactions...</p>
      </div>

      <div v-else-if="!transactions?.data?.length" class="state-empty">
        <i class="fa-sharp-duotone fa-solid fa-arrow-right-arrow-left"></i>
        <p>No transactions found</p>
      </div>

      <template v-else>
        <div class="table-scroll">
          <table class="tx-table">
            <thead>
              <tr>
                <th>Corridor</th>
                <th>Sent</th>
                <th>Received</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Reference</th>
                <th>User</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="tx in transactions.data"
                :key="tx.id"
                class="clickable-row"
                :class="{ 'row--active': selectedTx?.id === tx.id }"
                @click="openDetail(tx)"
              >
                <td>
                  <div class="cell-corridor">
                    <span class="corridor-from">{{ tx.send_currency }}</span>
                    <i class="fa-sharp-duotone fa-solid fa-arrow-right"></i>
                    <span class="corridor-to">{{ tx.receive_currency }}</span>
                  </div>
                </td>
                <td class="mono">{{ tx.send_currency }} {{ formatMoney(tx.send_amount) }}</td>
                <td class="mono accent">{{ tx.receive_currency }} {{ formatMoney(tx.receive_amount) }}</td>
                <td class="mono fee">{{ tx.send_currency }} {{ formatMoney(tx.fee_amount) }}</td>
                <td><span class="badge" :class="txBadge(tx.status)">{{ tx.status }}</span></td>
                <td><span class="mono-ref">{{ tx.reference_number }}</span></td>
                <td>{{ tx.sender?.name }}</td>
                <td class="cell-date">{{ formatDate(tx.created_at) }}</td>
                <td @click.stop>
                  <button
                    v-if="['failed','escrowed','processing','retrying'].includes(tx.status)"
                    class="btn-retry"
                    :disabled="retrying === tx.reference_number"
                    @click="retryTx(tx)"
                  >
                    <i v-if="retrying === tx.reference_number" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
                    <i v-else class="fa-sharp-duotone fa-solid fa-rotate-right" />
                    Retry
                  </button>
                  <span v-else class="cell-na">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="transactions.last_page > 1" class="pagination">
          <button :disabled="page===1" @click="page--;load()">
            <i class="fa-sharp-duotone fa-solid fa-chevron-left"></i>
          </button>
          <span>{{ page }} / {{ transactions.last_page }}</span>
          <button :disabled="page===transactions.last_page" @click="page++;load()">
            <i class="fa-sharp-duotone fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </template>

    </div>

    <!-- ── Detail Drawer ──────────────────────────────────────────────────── -->
    <transition name="drawer-fade">
      <div v-if="drawerOpen" class="drawer-overlay" @click.self="closeDetail">
        <transition name="drawer-slide">
          <div v-if="drawerOpen" class="drawer">

            <div class="drawer-header">
              <div class="drawer-header__left">
                <div class="drawer-icon" :class="txBadgeIcon(detail?.transaction?.status)">
                  <i class="fa-sharp-duotone fa-solid fa-arrow-right-arrow-left"></i>
                </div>
                <div>
                  <div class="drawer-ref">{{ selectedTx?.reference_number }}</div>
                  <div class="drawer-sub">{{ formatDate(selectedTx?.created_at) }}</div>
                </div>
              </div>
              <button class="drawer-close" @click="closeDetail">
                <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Loading -->
            <div v-if="detailLoading" class="drawer-loading">
              <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <span>Loading details...</span>
            </div>

            <div v-else-if="detail" class="drawer-body">

              <!-- Status + corridor -->
              <div class="drawer-badges">
                <span class="badge" :class="txBadge(detail.transaction.status)">
                  {{ detail.transaction.status }}
                </span>
                <span class="badge badge--gray">
                  {{ detail.transaction.send_currency }}
                  <i class="fa-sharp-duotone fa-solid fa-arrow-right" style="font-size:9px;margin:0 2px;"></i>
                  {{ detail.transaction.receive_currency }}
                </span>
                <span v-if="detail.transaction.partner" class="badge badge--gray">
                  <i class="fa-sharp-duotone fa-solid fa-building"></i>
                  {{ detail.transaction.partner.name }}
                </span>
              </div>

              <!-- Amounts grid -->
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-item__label">
                    <i class="fa-sharp-duotone fa-solid fa-arrow-up-from-bracket"></i> Sent
                  </div>
                  <div class="detail-item__value">
                    {{ detail.transaction.send_currency }} {{ formatMoney(detail.transaction.send_amount) }}
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-item__label">
                    <i class="fa-sharp-duotone fa-solid fa-arrow-down-to-bracket"></i> Received
                  </div>
                  <div class="detail-item__value accent">
                    {{ detail.transaction.receive_currency }} {{ formatMoney(detail.transaction.receive_amount) }}
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-item__label">
                    <i class="fa-sharp-duotone fa-solid fa-receipt"></i> Fee
                  </div>
                  <div class="detail-item__value">
                    {{ detail.transaction.send_currency }} {{ formatMoney(detail.transaction.fee_amount) }}
                  </div>
                </div>
                <div class="detail-item">
                  <div class="detail-item__label">
                    <i class="fa-sharp-duotone fa-solid fa-chart-line"></i> Rate
                  </div>
                  <div class="detail-item__value">{{ detail.transaction.locked_rate ?? '—' }}</div>
                </div>
              </div>

              <!-- Failure reason -->
              <div v-if="detail.transaction.failure_reason" class="failure-box">
                <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>
                <span>{{ detail.transaction.failure_reason }}</span>
              </div>

              <!-- Sender -->
              <div class="drawer-section">
                <div class="drawer-section__title">
                  <i class="fa-sharp-duotone fa-solid fa-user"></i> Sender
                </div>
                <div class="info-row">
                  <span class="info-row__label">Name</span>
                  <span class="info-row__value">{{ detail.transaction.sender?.name ?? '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Email</span>
                  <span class="info-row__value">{{ detail.transaction.sender?.email ?? '—' }}</span>
                </div>
              </div>

              <!-- Recipient -->
              <div v-if="detail.transaction.recipient" class="drawer-section">
                <div class="drawer-section__title">
                  <i class="fa-sharp-duotone fa-solid fa-user-check"></i> Recipient
                </div>
                <div class="info-row">
                  <span class="info-row__label">Name</span>
                  <span class="info-row__value">{{ detail.transaction.recipient.full_name }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Number</span>
                  <span class="info-row__value mono-sm">{{ detail.transaction.recipient.mobile_number }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Network</span>
                  <span class="info-row__value">{{ detail.transaction.recipient.mobile_network || detail.transaction.recipient.bank_name || '—' }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Country</span>
                  <span class="info-row__value">{{ detail.transaction.recipient.country_code }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Method</span>
                  <span class="info-row__value">{{ detail.transaction.recipient.payment_method }}</span>
                </div>
              </div>

              <!-- Partner reference -->
              <div v-if="detail.transaction.partner_reference" class="drawer-section">
                <div class="drawer-section__title">
                  <i class="fa-sharp-duotone fa-solid fa-building"></i> Partner
                </div>
                <div class="info-row">
                  <span class="info-row__label">Name</span>
                  <span class="info-row__value">{{ detail.transaction.partner?.name }}</span>
                </div>
                <div class="info-row">
                  <span class="info-row__label">Reference</span>
                  <span class="info-row__value mono-sm">{{ detail.transaction.partner_reference }}</span>
                </div>
              </div>

              <!-- Disbursement attempts -->
              <div v-if="detail.transaction.disbursements?.length" class="drawer-section">
                <div class="drawer-section__title">
                  <i class="fa-sharp-duotone fa-solid fa-rotate-right"></i>
                  Disbursement Attempts
                  <span class="section-count">{{ detail.transaction.disbursements.length }}</span>
                </div>
                <div class="attempt-list">
                  <div
                    v-for="a in detail.transaction.disbursements"
                    :key="a.id"
                    class="attempt-item"
                    :class="'attempt--' + a.status"
                  >
                    <div class="attempt-item__top">
                      <span class="attempt-num">#{{ a.attempt_number }}</span>
                      <span class="badge badge--sm" :class="txBadge(a.status)">{{ a.status }}</span>
                      <span class="attempt-ms" v-if="a.response_time_ms">{{ a.response_time_ms }}ms</span>
                    </div>
                    <div v-if="a.failure_reason" class="attempt-item__reason">
                      {{ a.failure_reason }}
                    </div>
                    <div class="attempt-item__time">{{ formatDateTime(a.attempted_at) }}</div>
                  </div>
                </div>
              </div>

              <!-- Journal entries -->
              <div v-if="detail.transaction.journalGroup?.entries?.length" class="drawer-section">
                <div class="drawer-section__title">
                  <i class="fa-sharp-duotone fa-solid fa-book"></i> Journal Entries
                </div>
                <div class="journal-list">
                  <div v-for="e in detail.transaction.journalGroup.entries" :key="e.id" class="journal-item">
                    <div class="journal-item__left">
                      <span class="journal-account">{{ e.account?.code ?? '—' }}</span>
                      <span class="journal-desc">{{ e.description }}</span>
                    </div>
                    <div class="journal-item__right" :class="'journal--' + e.entry_type">
                      <span class="journal-type">{{ e.entry_type }}</span>
                      <span class="journal-amount">{{ formatMoney(e.amount) }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Retry action -->
              <div v-if="['failed','escrowed','processing','retrying'].includes(detail.transaction.status)" class="drawer-actions">
                <button
                  class="btn-retry-full"
                  :disabled="retrying === detail.transaction.reference_number"
                  @click="retryFromDrawer"
                >
                  <i v-if="retrying === detail.transaction.reference_number" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
                  <i v-else class="fa-sharp-duotone fa-solid fa-rotate-right" />
                  Retry Disbursement
                </button>
              </div>

            </div>
          </div>
        </transition>
      </div>
    </transition>

  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui           = useUiStore()
const transactions = ref(null)
const loading      = ref(false)
const search       = ref('')
const statusFilter = ref('')
const corridorFilter = ref('')
const fromDate     = ref('')
const toDate       = ref('')
const page         = ref(1)
const exporting    = ref(null)
const retrying     = ref(null)
let debounceTimer  = null

// Drawer
const drawerOpen    = ref(false)
const selectedTx    = ref(null)
const detail        = ref(null)
const detailLoading = ref(false)

// ── Corridor options derived from loaded transactions ─────────────────────────

const availableCorridors = computed(() => {
  const txs = transactions.value?.data ?? []
  const map = {}
  for (const tx of txs) {
    const key = `${tx.send_currency}-${tx.receive_currency}`
    if (!map[key]) map[key] = { key, from: tx.send_currency, to: tx.receive_currency }
  }
  return Object.values(map)
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function txBadge(s) {
  return {
    completed: 'badge--green', failed: 'badge--red',
    processing: 'badge--amber', retrying: 'badge--amber',
    escrowed: 'badge--amber', refunded: 'badge--gray',
  }[s] || 'badge--gray'
}

function txBadgeIcon(s) {
  return {
    completed: 'icon--green', failed: 'icon--red',
    processing: 'icon--amber', retrying: 'icon--amber',
    escrowed: 'icon--amber', refunded: 'icon--gray',
  }[s] || 'icon--gray'
}

function formatMoney(v) {
  return Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
}

function formatDateTime(d) {
  return d ? new Date(d).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
}

// ── Data loading ──────────────────────────────────────────────────────────────

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.transactions({
      search:        search.value,
      status:        statusFilter.value,
      from_currency: corridorFilter.value?.from || '',
      to_currency:   corridorFilter.value?.to   || '',
      page:          page.value,
      from:          fromDate.value,
      to:            toDate.value,
    })
    transactions.value = data
  } finally {
    loading.value = false
  }
}

function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 400)
}

// ── Drawer ────────────────────────────────────────────────────────────────────

async function openDetail(tx) {
  selectedTx.value    = tx
  drawerOpen.value    = true
  detail.value        = null
  detailLoading.value = true
  try {
    const { data } = await adminApi.transactionShow(tx.reference_number)
    detail.value = data
  } catch {
    ui.error('Failed to load transaction details')
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  drawerOpen.value = false
  selectedTx.value = null
  detail.value     = null
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function doExport(format) {
  exporting.value = format
  try {
    const response = await adminApi.transactionExport({
      format,
      from:   fromDate.value   || undefined,
      to:     toDate.value     || undefined,
      status: statusFilter.value || undefined,
    })
    const mime = {
      csv:  'text/csv',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf:  'application/pdf',
    }[format]
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: mime })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.${format}`
    a.click()
    URL.revokeObjectURL(url)
    ui.success(`Exported as ${format.toUpperCase()}`)
  } catch {
    ui.error('Export failed. Try again.')
  } finally {
    exporting.value = null
  }
}

async function retryTx(tx) {
  retrying.value = tx.reference_number
  try {
    await adminApi.transactionRetry(tx.reference_number)
    ui.success(`${tx.reference_number} queued for retry`)
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Retry failed')
  } finally {
    retrying.value = null
  }
}

async function retryFromDrawer() {
  await retryTx(detail.value.transaction)
  closeDetail()
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 16px; max-width: 1100px; }
@media (min-width: 768px) { .admin-page { padding: 24px 20px; } }

.page-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
}
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.export-group { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-export {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg-card); color: #374151; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-export:hover:not(:disabled) { background: #f8fafc; border-color: var(--accent); color: var(--accent); }
.btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

/* Filters */
.filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
@media (min-width: 640px) { .filters { flex-direction: row; flex-wrap: wrap; } }
.search-box {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 10px 14px; flex: 1; min-width: 200px;
}
.search-box i { color: #94a3b8; font-size: 13px; }
.search-box input { border: none; outline: none; font-size: 14px; color: #374151; width: 100%; background: transparent; }
.filters select, .date-input {
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px;
  font-size: 13px; background: var(--bg-card); outline: none; font-family: inherit;
}
.date-input { color: #374151; }

/* States */
.state-empty { text-align: center; padding: 48px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.state-empty i { font-size: 32px; }

/* Table */
.table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.tx-table {
  width: 100%; border-collapse: collapse; min-width: 960px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
}
.tx-table th {
  text-align: left; font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.05em; color: #64748b; background: #f8fafc;
  padding: 12px 16px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; font-weight: 700;
}
.tx-table td {
  padding: 12px 16px; font-size: 13px; color: #334155;
  border-bottom: 1px solid #f1f5f9; vertical-align: middle;
}
.tx-table tr:last-child td { border-bottom: none; }
.tx-table tbody tr:hover td { background: #fafafa; }
.clickable-row { cursor: pointer; }
.row--active td { background: #fff7f0 !important; }

.cell-corridor { display: flex; align-items: center; gap: 6px; }
.cell-corridor i { color: #cbd5e1; font-size: 10px; }
.corridor-from { font-weight: 800; color: #0f172a; }
.corridor-to   { font-weight: 800; color: var(--accent); }
.mono    { font-family: monospace; font-size: 12px; }
.mono-sm { font-family: monospace; font-size: 11px; }
.accent  { color: var(--accent); font-weight: 700; }
.fee     { color: #64748b; }
.cell-date { font-size: 12px; color: #64748b; white-space: nowrap; }
.cell-na   { color: #cbd5e1; font-size: 13px; }
.mono-ref {
  font-family: monospace; font-size: 11px;
  background: #f8fafc; padding: 2px 7px; border-radius: 5px; color: #475569;
}

/* Badges */
.badge { display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.badge--sm    { padding: 2px 6px; font-size: 10px; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: var(--accent-dim); color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }

.btn-retry {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 7px; border: none;
  background: var(--accent-dim); color: #d97706; font-size: 11px;
  font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-retry:hover:not(:disabled) { background: #fef3c7; }
.btn-retry:disabled { opacity: 0.5; cursor: not-allowed; }

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 16px; font-size: 13px; color: #64748b;
}
.pagination button {
  width: 34px; height: 34px; border: 1px solid var(--border);
  background: var(--bg-card); border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

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
.drawer-icon {
  width: 40px; height: 40px; border-radius: 11px; display: flex;
  align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0;
}
.icon--green { background: #f0fdf4; color: #16a34a; }
.icon--red   { background: #fef2f2; color: #dc2626; }
.icon--amber { background: var(--accent-dim); color: #d97706; }
.icon--gray  { background: #f1f5f9; color: #475569; }
.drawer-ref  { font-family: monospace; font-size: 13px; font-weight: 700; color: #0f172a; }
.drawer-sub  { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.drawer-close {
  background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 9px;
  cursor: pointer; color: #64748b; font-size: 14px; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s;
}
.drawer-close:hover { background: #e2e8f0; }

.drawer-loading {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 12px; color: #94a3b8; font-size: 14px;
}
.drawer-loading i { font-size: 22px; }

.drawer-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 18px; }

.drawer-badges { display: flex; flex-wrap: wrap; gap: 6px; }

/* Detail grid */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.detail-item { background: #f8fafc; border-radius: 10px; padding: 10px 12px; }
.detail-item__label {
  font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;
  letter-spacing: 0.05em; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;
}
.detail-item__label i { font-size: 10px; }
.detail-item__value { font-size: 14px; font-weight: 700; color: #0f172a; font-family: monospace; }
.detail-item__value.accent { color: var(--accent); }

/* Failure box */
.failure-box {
  display: flex; align-items: flex-start; gap: 10px;
  background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
  padding: 10px 12px; font-size: 13px; color: #dc2626;
}
.failure-box i { flex-shrink: 0; margin-top: 1px; }

/* Sections */
.drawer-section { display: flex; flex-direction: column; gap: 8px; }
.drawer-section__title {
  font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.05em; display: flex; align-items: center; gap: 6px;
}
.section-count { background: #f1f5f9; color: #64748b; border-radius: 10px; padding: 1px 7px; font-size: 11px; font-weight: 600; }

/* Info rows */
.info-row { display: flex; justify-content: space-between; align-items: baseline; padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
.info-row:last-child { border-bottom: none; }
.info-row__label { font-size: 12px; color: #94a3b8; flex-shrink: 0; }
.info-row__value { font-size: 12px; font-weight: 600; color: #0f172a; text-align: right; }

/* Disbursement attempts */
.attempt-list { display: flex; flex-direction: column; gap: 8px; }
.attempt-item {
  border: 1px solid var(--border); border-radius: 10px;
  padding: 10px 12px; background: #fafafa;
}
.attempt--failed  { border-color: #fecaca; background: #fef9f9; }
.attempt--success { border-color: #bbf7d0; background: #f9fffe; }
.attempt-item__top { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.attempt-num  { font-size: 11px; font-weight: 700; color: #64748b; }
.attempt-ms   { font-size: 11px; color: #94a3b8; margin-left: auto; }
.attempt-item__reason { font-size: 12px; color: #dc2626; margin-bottom: 4px; }
.attempt-item__time   { font-size: 11px; color: #94a3b8; }

/* Journal entries */
.journal-list { border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
.journal-item {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 9px 12px; border-bottom: 1px solid #f1f5f9; gap: 8px;
}
.journal-item:last-child { border-bottom: none; }
.journal-item__left { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.journal-account { font-size: 11px; font-weight: 700; color: #475569; font-family: monospace; }
.journal-desc    { font-size: 11px; color: #94a3b8; }
.journal-item__right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
.journal-type   { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.journal-amount { font-size: 12px; font-weight: 700; font-family: monospace; color: #0f172a; }
.journal--debit  .journal-type { color: #dc2626; }
.journal--credit .journal-type { color: #16a34a; }

/* Drawer actions */
.drawer-actions { margin-top: auto; padding-top: 4px; }
.btn-retry-full {
  width: 100%; padding: 11px; border: none; border-radius: 10px;
  background: var(--accent-dim); color: #d97706; font-size: 13px;
  font-weight: 700; cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 8px; transition: background 0.15s;
}
.btn-retry-full:hover:not(:disabled) { background: #fef3c7; }
.btn-retry-full:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transitions */
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: background 0.25s; }
.drawer-fade-enter-from,   .drawer-fade-leave-to    { background: transparent; }
.drawer-slide-enter-active { transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.drawer-slide-leave-active { transition: transform 0.22s ease-in; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

@media (max-width: 640px) {
  .drawer { max-width: 100%; }
}
</style>
