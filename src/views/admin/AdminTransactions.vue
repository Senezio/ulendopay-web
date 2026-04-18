<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Transactions</h1>
          <p>{{ transactions?.total ?? 0 }} platform transfers</p>
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
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
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
        <div class="table-scroll" v-else>
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="tx in transactions.data" :key="tx.id">
            <div class="tx-card__top">
              <div class="tx-card__corridor">
                <span class="corridor-from">{{ tx.send_currency }}</span>
                <i class="fa-solid fa-arrow-right"></i>
                <span class="corridor-to">{{ tx.receive_currency }}</span>
              </div>
              <span class="badge" :class="txBadge(tx.status)">{{ tx.status }}</span>
            </div>

            <div class="tx-card__amounts">
              <div class="amount-sent">
                <div class="amount-label">Sent</div>
                <div class="amount-value">{{ tx.send_currency }} {{ formatMoney(tx.send_amount) }}</div>
              </div>
              <i class="fa-solid fa-arrow-right amount-arrow"></i>
              <div class="amount-received">
                <div class="amount-label">Received</div>
                <div class="amount-value accent">{{ tx.receive_currency }} {{ formatMoney(tx.receive_amount) }}</div>
              </div>
            </div>

            <div class="tx-card__footer">
              <div class="tx-meta">
                <span class="mono-ref">{{ tx.reference_number }}</span>
              </div>
              <div class="tx-meta">
                <i class="fa-solid fa-user"></i>
                {{ tx.sender?.name }}
              </div>
              <div class="tx-meta">
                <i class="fa-solid fa-clock"></i>
                {{ formatDate(tx.created_at) }}
              </div>
            </div>
          </div>
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

const transactions = ref(null)
const loading      = ref(false)
const search       = ref('')
const statusFilter = ref('')
const page         = ref(1)
let debounceTimer  = null

function txBadge(s)     { return {completed:'badge--green',failed:'badge--red',processing:'badge--amber',retrying:'badge--amber',escrowed:'badge--amber',refunded:'badge--gray'}[s]||'badge--gray' }
function formatMoney(v) { return Number(v||0).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) }
function formatDate(d)  { return d ? new Date(d).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'}) : '' }

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.transactions({ search: search.value, status: statusFilter.value, page: page.value })
    transactions.value = data
  } finally { loading.value = false }
}

function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }
onMounted(load)
</script>

<style scoped>
.admin-page { padding: 24px 20px; max-width: 900px; }
.page-header { margin-bottom: 20px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.search-box { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; }
.search-box i { color: #94a3b8; font-size: 13px; }
.search-box input { border: none; outline: none; font-size: 14px; color: #374151; width: 100%; background: transparent; }
.filters select { padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 13px; background: #fff; outline: none; }

.state-empty { text-align: center; padding: 48px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.state-empty i { font-size: 32px; }

.tx-cards { display: flex; flex-direction: column; gap: 10px; }
.tx-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; }
.tx-card__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.tx-card__corridor { display: flex; align-items: center; gap: 8px; }
.corridor-from { font-weight: 800; font-size: 15px; color: #0f172a; }
.corridor-to   { font-weight: 800; font-size: 15px; color: var(--accent); }
.tx-card__corridor i { color: #94a3b8; font-size: 12px; }

.tx-card__amounts { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-bottom: 12px; }
.amount-sent, .amount-received { flex: 1; }
.amount-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
.amount-value { font-size: 16px; font-weight: 700; color: #0f172a; }
.amount-value.accent { color: var(--accent); }
.amount-arrow { color: #cbd5e1; font-size: 12px; flex-shrink: 0; }

.tx-card__footer { display: flex; flex-wrap: wrap; gap: 10px; }
.tx-meta { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
.tx-meta i { color: #94a3b8; font-size: 11px; }
.mono-ref { font-family: monospace; font-size: 11px; background: #f8fafc; padding: 2px 7px; border-radius: 5px; color: #475569; }

.badge { display: inline-block; padding: 4px 10px; border-radius: 7px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; font-size: 13px; color: #64748b; }
.pagination button { width: 34px; height: 34px; border: 1px solid #e2e8f0; background: #fff; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>

<style scoped>

.table-scroll {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.tx-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 900px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.tx-table th {
  text-align: left;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  background: #f8fafc;
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.tx-table td {
  padding: 12px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.tx-table tr:hover td {
  background: #fafafa;
}

</style>
