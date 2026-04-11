<template>
  <AdminLayout>
    <div class="ap">

      <div class="ap__head">
        <div>
          <h1>Transactions</h1>
          <p>{{ transactions?.total ?? '—' }} platform transfers</p>
        </div>
      </div>

      <div class="card">
        <div class="toolbar">
          <div class="search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="search" placeholder="Search by reference or name…" @input="debouncedLoad" />
          </div>
          <select v-model="statusFilter" @change="load" class="fselect">
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="escrowed">Escrowed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <!-- Desktop table -->
        <div class="table-wrap">
          <table v-if="transactions?.data?.length" class="dt">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Sender</th>
                <th>Amount sent</th>
                <th>Amount received</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tx in transactions.data" :key="tx.id" class="dt__row">
                <td><span class="ref">{{ tx.reference_number }}</span></td>
                <td>
                  <div class="uname">{{ tx.sender?.name }}</div>
                  <div class="umeta">{{ tx.sender?.phone || tx.sender?.email }}</div>
                </td>
                <td>
                  <div class="money">
                    <span class="money__cur">{{ tx.send_currency }}</span>
                    <span class="money__amt">{{ fmtMoney(tx.send_amount) }}</span>
                  </div>
                </td>
                <td>
                  <div class="money money--receive">
                    <span class="money__cur">{{ tx.receive_currency }}</span>
                    <span class="money__amt">{{ fmtMoney(tx.receive_amount) }}</span>
                  </div>
                </td>
                <td><span class="pill" :class="txClass(tx.status)">{{ tx.status }}</span></td>
                <td class="date">{{ fmtDate(tx.created_at) }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile cards -->
          <div v-if="transactions?.data?.length" class="mcards">
            <div v-for="tx in transactions.data" :key="tx.id" class="mcard">
              <div class="mcard__top">
                <span class="ref">{{ tx.reference_number }}</span>
                <span class="pill" :class="txClass(tx.status)">{{ tx.status }}</span>
              </div>
              <div class="mcard__transfer">
                <div class="transfer-block">
                  <div class="transfer-block__label">Sent</div>
                  <div class="money">
                    <span class="money__cur">{{ tx.send_currency }}</span>
                    <span class="money__amt">{{ fmtMoney(tx.send_amount) }}</span>
                  </div>
                </div>
                <div class="transfer-arrow"><i class="fa-solid fa-arrow-right"></i></div>
                <div class="transfer-block">
                  <div class="transfer-block__label">Received</div>
                  <div class="money money--receive">
                    <span class="money__cur">{{ tx.receive_currency }}</span>
                    <span class="money__amt">{{ fmtMoney(tx.receive_amount) }}</span>
                  </div>
                </div>
              </div>
              <div class="mcard__row">
                <span class="mcard__label">Sender</span>
                <span class="uname" style="font-size:13px;">{{ tx.sender?.name }}</span>
              </div>
              <div class="mcard__row">
                <span class="mcard__label">Date</span>
                <span class="date">{{ fmtDate(tx.created_at) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="empty">
            <i class="fa-solid fa-arrow-right-arrow-left"></i>
            <span>No transactions found</span>
          </div>
        </div>

        <div v-if="transactions?.last_page > 1" class="pager">
          <button :disabled="page===1" @click="page--;load()"><i class="fa-solid fa-chevron-left"></i></button>
          <span>{{ page }} / {{ transactions.last_page }}</span>
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
const search = ref('')
const statusFilter = ref('')
const page = ref(1)
let debounceTimer = null

const txClass = s => ({ completed:'pill--green', failed:'pill--red', processing:'pill--amber', refunded:'pill--gray', escrowed:'pill--blue' }[s]||'pill--gray')
const fmtMoney = v => Number(v||0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtDate = d => d ? new Date(d).toLocaleDateString('en', { day:'numeric', month:'short', year:'numeric' }) : '—'

async function load() {
  const { data } = await adminApi.transactions({ search: search.value, status: statusFilter.value, page: page.value })
  transactions.value = data
}
function debouncedLoad() { clearTimeout(debounceTimer); debounceTimer = setTimeout(load, 400) }
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
.fselect { padding: 9px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; color: #374151; background: #fff; outline: none; cursor: pointer; font-family: inherit; transition: border-color 0.15s; }
.fselect:focus { border-color: #ea580c; }

.table-wrap { overflow-x: auto; }
.dt { width: 100%; border-collapse: collapse; }
.dt th { padding: 11px 18px; text-align: left; font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; background: #f8fafc; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.dt td { padding: 14px 18px; border-bottom: 1px solid #f8fafc; font-size: 14px; vertical-align: middle; }
.dt__row:hover td { background: #fdf8f5; }
.dt__row:hover td:first-child { box-shadow: inset 3px 0 0 #ea580c; }
.dt tr:last-child td { border-bottom: none; }

.ref { font-family: 'DM Mono', monospace; font-size: 11.5px; background: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; font-weight: 500; white-space: nowrap; }
.uname { font-weight: 700; color: #0d1117; font-size: 14px; }
.umeta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.date { font-family: 'DM Mono', monospace; font-size: 12px; color: #6b7280; white-space: nowrap; }

/* Money display — the hero element */
.money { display: flex; align-items: baseline; gap: 4px; }
.money__cur { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; color: #94a3b8; letter-spacing: 0.05em; }
.money__amt { font-family: 'DM Mono', monospace; font-size: 16px; font-weight: 700; color: #0d1117; letter-spacing: -0.02em; }
.money--receive .money__cur { color: #86efac; }
.money--receive .money__amt { color: #15803d; }

.pill { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; text-transform: capitalize; }
.pill--green { background: #dcfce7; color: #15803d; }
.pill--red   { background: #fee2e2; color: #b91c1c; }
.pill--amber { background: #fef3c7; color: #b45309; }
.pill--gray  { background: #f1f5f9; color: #475569; }
.pill--blue  { background: #dbeafe; color: #1d4ed8; }

.empty { padding: 56px 24px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty i { font-size: 30px; opacity: 0.5; }
.empty span { font-size: 14px; font-weight: 500; }

.pager { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #64748b; font-family: 'DM Mono', monospace; }
.pager button { width: 32px; height: 32px; border: 1.5px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 11px; transition: all 0.15s; }
.pager button:hover:not(:disabled) { border-color: #ea580c; color: #ea580c; }
.pager button:disabled { opacity: 0.3; cursor: not-allowed; }

/* Mobile cards */
.mcards { display: none; }
@media (max-width: 700px) {
  .dt { display: none; }
  .mcards { display: flex; flex-direction: column; }
  .mcard { padding: 16px; border-bottom: 1px solid #f1f5f9; }
  .mcard:last-child { border-bottom: none; }
  .mcard__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 10px; }
  .mcard__transfer { display: flex; align-items: center; gap: 12px; background: #f8fafc; border-radius: 12px; padding: 14px; margin-bottom: 12px; }
  .transfer-block { flex: 1; }
  .transfer-block__label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
  .transfer-arrow { color: #94a3b8; font-size: 14px; flex-shrink: 0; }
  .mcard__row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f8fafc; }
  .mcard__row:last-child { border-bottom: none; }
  .mcard__label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
}
</style>
