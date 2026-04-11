<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div><h1>Transactions</h1><p>Monitor all platform transfers</p></div>
      </div>
      <div class="admin-table-card">
        <div class="table-toolbar">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="search" placeholder="Search by reference..." @input="debouncedLoad" />
          </div>
          <div class="filter-group">
            <select v-model="statusFilter" @change="load">
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        <table v-if="transactions?.data?.length" class="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Sender</th>
              <th>Amount</th>
              <th>Corridor</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactions.data" :key="tx.id">
              <td><span class="mono-ref">{{ tx.reference_number }}</span></td>
              <td>
                <div class="cell-user__name">{{ tx.sender?.name }}</div>
                <div class="cell-user__meta">{{ tx.sender?.email }}</div>
              </td>
              <td>
                <div style="font-weight:700;">{{ tx.send_currency }} {{ formatMoney(tx.send_amount) }}</div>
                <div style="font-size:12px;color:#94a3b8;">→ {{ tx.receive_currency }} {{ formatMoney(tx.receive_amount) }}</div>
              </td>
              <td><span class="corridor-tag">{{ tx.send_currency }}/{{ tx.receive_currency }}</span></td>
              <td><span class="badge" :class="txBadge(tx.status)">{{ tx.status }}</span></td>
              <td class="cell-date">{{ formatDate(tx.created_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="table-empty"><i class="fa-solid fa-arrow-right-arrow-left"></i><p>No transactions found</p></div>
        <div v-if="transactions?.last_page > 1" class="table-pagination">
          <button :disabled="page===1" @click="page--;load()"><i class="fa-solid fa-chevron-left"></i></button>
          <span>Page {{ page }} of {{ transactions.last_page }}</span>
          <button :disabled="page===transactions.last_page" @click="page++;load()"><i class="fa-solid fa-chevron-right"></i></button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'

const transactions = ref(null)
const search       = ref('')
const statusFilter = ref('')
const page         = ref(1)
let debounceTimer  = null

function txBadge(s) { return { completed:'badge--green', failed:'badge--red', processing:'badge--amber', refunded:'badge--gray', escrowed:'badge--amber' }[s]||'badge--gray' }
function formatMoney(v) { return Number(v||0).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) }
function formatDate(d)  { return d ? new Date(d).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'}) : '' }

async function load() {
  const { data } = await adminApi.transactions({ search: search.value, status: statusFilter.value, page: page.value })
  transactions.value = data
}
function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }
onMounted(load)
</script>

<style scoped>
.admin-page { padding: 32px; max-width: 1200px; }
.admin-page__header { margin-bottom: 24px; }
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }
.admin-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; gap: 12px; flex-wrap: wrap; }
.search-box { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 8px 14px; flex: 1; }
.search-box i { color: #94a3b8; font-size: 13px; }
.search-box input { border: none; background: transparent; outline: none; font-size: 14px; color: #374151; width: 100%; }
.filter-group select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; background: #fff; outline: none; cursor: pointer; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.admin-table td { padding: 14px 20px; border-bottom: 1px solid #f8fafc; font-size: 14px; color: #374151; }
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tr:hover td { background: #fafafa; }
.mono-ref { font-family: monospace; font-size: 12px; background: #f8fafc; padding: 3px 8px; border-radius: 6px; color: #475569; }
.cell-user__name { font-weight: 600; color: #111827; font-size: 13px; }
.cell-user__meta { font-size: 12px; color: #9ca3af; }
.corridor-tag { background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }
.cell-date { font-size: 13px; color: #64748b; }
.table-empty { padding: 48px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.table-empty i { font-size: 32px; }
.table-pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b; }
.table-pagination button { width: 32px; height: 32px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.table-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
