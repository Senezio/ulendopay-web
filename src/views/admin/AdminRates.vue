<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div><h1>Exchange Rates</h1><p>Live rates from RBM and SARB</p></div>
        <button class="btn-fetch" :disabled="fetching" @click="fetchRates">
          <i class="fa-solid fa-rotate" :class="{'fa-spin':fetching}"></i>
          {{ fetching ? 'Fetching...' : 'Fetch Latest Rates' }}
        </button>
      </div>
      <div class="admin-table-card">
        <table v-if="rates.length" class="admin-table">
          <thead>
            <tr>
              <th>Corridor</th>
              <th>Rate</th>
              <th>Source</th>
              <th>Fetched</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rate in rates" :key="rate.id">
              <td><span class="corridor-tag">{{ rate.from_currency }} → {{ rate.to_currency }}</span></td>
              <td class="mono-val">{{ Number(rate.rate).toFixed(6) }}</td>
              <td><span class="badge badge--gray">{{ rate.source }}</span></td>
              <td class="cell-date">{{ formatDate(rate.fetched_at) }}</td>
              <td class="cell-date">{{ formatDate(rate.expires_at) }}</td>
              <td>
                <span class="badge" :class="rate.is_stale ? 'badge--red' : 'badge--green'">
                  {{ rate.is_stale ? 'Stale' : 'Fresh' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="table-empty"><i class="fa-solid fa-chart-line"></i><p>No rates loaded</p></div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui      = useUiStore()
const rates   = ref([])
const fetching= ref(false)

function formatDate(d) { return d ? new Date(d).toLocaleString('en',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '' }

async function load() {
  const { data } = await adminApi.rates()
  rates.value = data.rates ?? []
}

async function fetchRates() {
  fetching.value = true
  try {
    await adminApi.fetchRates()
    ui.success('Rates updated successfully')
    await load()
  } catch(e) {
    ui.error(e.response?.data?.message || 'Rate fetch failed')
  } finally { fetching.value = false }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 32px; max-width: 1200px; }
.admin-page__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }
.btn-fetch { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-fetch:disabled { opacity: 0.6; cursor: not-allowed; }
.admin-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.admin-table td { padding: 12px 20px; border-bottom: 1px solid #f8fafc; font-size: 14px; color: #374151; }
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tr:hover td { background: #fafafa; }
.corridor-tag { background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.mono-val { font-family: monospace; font-size: 13px; }
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--gray  { background: #f1f5f9; color: #475569; }
.cell-date { font-size: 12px; color: #64748b; }
.table-empty { padding: 48px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.table-empty i { font-size: 32px; }
</style>
