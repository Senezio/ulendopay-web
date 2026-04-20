<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Transactions</h1>
          <p>{{ transactions?.total ?? 0 }} platform transfers</p>
        </div>
        <!-- Export buttons -->
        <div class="export-group">
          <button class="btn-export" :disabled="exporting" @click="doExport('csv')">
            <i v-if="exporting==='csv'" class="fa-solid fa-spinner fa-spin" />
            <i v-else class="fa-solid fa-file-csv" />
            CSV
          </button>
          <button class="btn-export" :disabled="exporting" @click="doExport('xlsx')">
            <i v-if="exporting==='xlsx'" class="fa-solid fa-spinner fa-spin" />
            <i v-else class="fa-solid fa-file-excel" />
            Excel
          </button>
          <button class="btn-export" :disabled="exporting" @click="doExport('pdf')">
            <i v-if="exporting==='pdf'" class="fa-solid fa-spinner fa-spin" />
            <i v-else class="fa-solid fa-file-pdf" />
            PDF
          </button>
        </div>
      </div>

      <div class="filters">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass"></i>
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
        <input type="date" v-model="fromDate" @change="load" class="date-input" />
        <input type="date" v-model="toDate"   @change="load" class="date-input" />
      </div>

      <div v-if="loading" class="state-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading transactions...</p>
      </div>

      <div v-else-if="!transactions?.data?.length" class="state-empty">
        <i class="fa-solid fa-arrow-right-arrow-left"></i>
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
                <th>Status</th>
                <th>Reference</th>
                <th>User</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in transactions.data" :key="tx.id">
                <td>
                  <div class="cell-corridor">
                    <span class="corridor-from">{{ tx.send_currency }}</span>
                    <i class="fa-solid fa-arrow-right"></i>
                    <span class="corridor-to">{{ tx.receive_currency }}</span>
                  </div>
                </td>
                <td class="mono">{{ tx.send_currency }} {{ formatMoney(tx.send_amount) }}</td>
                <td class="mono accent">{{ tx.receive_currency }} {{ formatMoney(tx.receive_amount) }}</td>
                <td><span class="badge" :class="txBadge(tx.status)">{{ tx.status }}</span></td>
                <td><span class="mono-ref">{{ tx.reference_number }}</span></td>
                <td>{{ tx.sender?.name }}</td>
                <td class="cell-date">{{ formatDate(tx.created_at) }}</td>
                <td>
                  <button
                    v-if="['failed','escrowed','processing','retrying'].includes(tx.status)"
                    class="btn-retry"
                    :disabled="retrying === tx.reference_number"
                    @click="retryTx(tx)"
                    title="Retry disbursement"
                  >
                    <i v-if="retrying === tx.reference_number" class="fa-solid fa-spinner fa-spin" />
                    <i v-else class="fa-solid fa-rotate-right" />
                    Retry
                  </button>
                  <span v-else class="cell-na">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="transactions.last_page > 1" class="pagination">
          <button :disabled="page===1" @click="page--;load()"><i class="fa-solid fa-chevron-left"></i></button>
          <span>{{ page }} / {{ transactions.last_page }}</span>
          <button :disabled="page===transactions.last_page" @click="page++;load()"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui           = useUiStore()
const transactions = ref(null)
const loading      = ref(false)
const search       = ref('')
const statusFilter = ref('')
const fromDate     = ref('')
const toDate       = ref('')
const page         = ref(1)
const exporting    = ref(null)
const retrying     = ref(null)
let debounceTimer  = null

function txBadge(s) {
  return {
    completed: 'badge--green', failed: 'badge--red',
    processing: 'badge--amber', retrying: 'badge--amber',
    escrowed: 'badge--amber', refunded: 'badge--gray',
  }[s] || 'badge--gray'
}
function formatMoney(v) { return Number(v||0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function formatDate(d)  { return d ? new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '' }

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.transactions({
      search: search.value,
      status: statusFilter.value,
      page:   page.value,
      from:   fromDate.value,
      to:     toDate.value,
    })
    transactions.value = data
  } finally { loading.value = false }
}

function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }

async function doExport(format) {
  exporting.value = format
  try {
    const response = await adminApi.transactionExport({
      format,
      from:   fromDate.value || undefined,
      to:     toDate.value   || undefined,
      status: statusFilter.value || undefined,
    })
    const ext      = format === 'xlsx' ? 'xls' : format
    const mime     = { csv: 'text/csv', xlsx: 'application/vnd.ms-excel', pdf: 'application/pdf' }[format]
    const blob     = new Blob([response.data], { type: mime })
    const url      = URL.createObjectURL(blob)
    const a        = document.createElement('a')
    a.href         = url
    a.download     = `transactions_${new Date().toISOString().slice(0,10)}.${ext}`
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
  padding: 8px 14px; border-radius: 10px; border: 1px solid #e2e8f0;
  background: #fff; color: #374151; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-export:hover:not(:disabled) { background: #f8fafc; border-color: var(--accent); color: var(--accent); }
.btn-export:disabled { opacity: 0.5; cursor: not-allowed; }

.filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
@media (min-width: 640px) { .filters { flex-direction: row; flex-wrap: wrap; } }
.search-box {
  display: flex; align-items: center; gap: 10px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px;
  flex: 1; min-width: 200px;
}
.search-box i { color: #94a3b8; font-size: 13px; }
.search-box input { border: none; outline: none; font-size: 14px; color: #374151; width: 100%; background: transparent; }
.filters select, .date-input {
  padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 12px;
  font-size: 13px; background: #fff; outline: none; font-family: inherit;
}
.date-input { color: #374151; }

.state-empty { text-align: center; padding: 48px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.state-empty i { font-size: 32px; }

.table-scroll { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
.tx-table {
  width: 100%; border-collapse: collapse; min-width: 900px;
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
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

.cell-corridor { display: flex; align-items: center; gap: 6px; }
.cell-corridor i { color: #cbd5e1; font-size: 10px; }
.corridor-from { font-weight: 800; color: #0f172a; }
.corridor-to   { font-weight: 800; color: var(--accent); }
.mono   { font-family: monospace; font-size: 12px; }
.accent { color: var(--accent); font-weight: 700; }
.cell-date { font-size: 12px; color: #64748b; white-space: nowrap; }
.cell-na { color: #cbd5e1; font-size: 13px; }
.mono-ref {
  font-family: monospace; font-size: 11px;
  background: #f8fafc; padding: 2px 7px; border-radius: 5px; color: #475569;
}

.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; white-space: nowrap; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }

.btn-retry {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 7px; border: none;
  background: #fffbeb; color: #d97706; font-size: 11px;
  font-weight: 600; cursor: pointer; transition: all 0.15s;
  white-space: nowrap;
}
.btn-retry:hover:not(:disabled) { background: #fef3c7; }
.btn-retry:disabled { opacity: 0.5; cursor: not-allowed; }

.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 16px; font-size: 13px; color: #64748b;
}
.pagination button {
  width: 34px; height: 34px; border: 1px solid #e2e8f0;
  background: #fff; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
