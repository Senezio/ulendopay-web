<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Exchange Rates</h1>
          <p>{{ rates.length }} active corridors</p>
        </div>
        <button class="btn-fetch" :disabled="fetching" @click="fetchRates">
          <i class="fa-solid fa-rotate" :class="{'fa-spin':fetching}"></i>
          {{ fetching ? 'Fetching...' : 'Fetch Latest' }}
        </button>
      </div>

      <div class="search-box" style="margin-bottom:16px;">
        <i class="fa-solid fa-magnifying-glass"></i>
        <input v-model="search" placeholder="Filter by currency e.g. MWK, TZS..." />
      </div>

      <div class="rates-grid">
        <div v-for="rate in filteredRates" :key="rate.id" class="rate-card">
          <div class="rate-card__header">
            <div class="rate-corridor">
              <span class="cur cur--from">{{ rate.from_currency }}</span>
              <i class="fa-solid fa-arrow-right"></i>
              <span class="cur cur--to">{{ rate.to_currency }}</span>
            </div>
            <span class="source-tag" :class="rate.source === 'RBM' ? 'source-tag--primary' : 'source-tag--secondary'">
              {{ rate.source }}
            </span>
          </div>
          <div class="rate-value">{{ Number(rate.rate).toFixed(6) }}</div>
          <div class="rate-meta">
            <span :class="rate.is_stale ? 'status--stale' : 'status--fresh'">
              <i :class="rate.is_stale ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'"></i>
              {{ rate.is_stale ? 'Stale' : 'Fresh' }}
            </span>
            <span class="rate-date">{{ formatDate(rate.fetched_at) }}</span>
          </div>
        </div>
      </div>

      <div v-if="!filteredRates.length" class="state-empty">
        <i class="fa-solid fa-chart-line"></i>
        <p>No rates match your search</p>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui      = useUiStore()
const rates   = ref([])
const fetching= ref(false)
const search  = ref('')

const filteredRates = computed(() => {
  if (!search.value) return rates.value
  const q = search.value.toUpperCase()
  return rates.value.filter(r => r.from_currency.includes(q) || r.to_currency.includes(q))
})

function formatDate(d) { return d ? new Date(d).toLocaleString('en',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '' }

async function load() {
  const { data } = await adminApi.rates()
  rates.value = data.rates ?? []
}

async function fetchRates() {
  fetching.value = true
  try { await adminApi.fetchRates(); ui.success('Rates updated'); await load() }
  catch(e) { ui.error(e.response?.data?.message || 'Rate fetch failed') }
  finally { fetching.value = false }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 24px 20px; max-width: 900px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 12px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }
.btn-fetch { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--accent); color: #fff; border: none; border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; flex-shrink: 0; }
.btn-fetch:disabled { opacity: 0.6; cursor: not-allowed; }

.search-box { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px 14px; }
.search-box i { color: #94a3b8; font-size: 13px; }
.search-box input { border: none; outline: none; font-size: 14px; color: #374151; width: 100%; background: transparent; }

.rates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
.rate-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
.rate-card__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.rate-corridor { display: flex; align-items: center; gap: 5px; }
.rate-corridor i { color: #cbd5e1; font-size: 10px; }
.cur { font-weight: 800; font-size: 13px; }
.cur--from { color: #0f172a; }
.cur--to   { color: var(--accent); }

.source-tag { font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 4px; text-transform: uppercase; }
.source-tag--primary   { background: #eff6ff; color: #2563eb; }
.source-tag--secondary { background: #f1f5f9; color: #475569; }

.rate-value { font-size: 15px; font-weight: 800; color: #0f172a; font-family: monospace; margin-bottom: 8px; }
.rate-meta { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px; }
.rate-date { font-size: 10px; color: #94a3b8; }

.status--fresh { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; color: #16a34a; }
.status--stale { display: flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; color: #dc2626; }

.state-empty { text-align: center; padding: 48px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.state-empty i { font-size: 32px; }
</style>
