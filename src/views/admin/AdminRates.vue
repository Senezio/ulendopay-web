<template>
  <AdminLayout>
    <div class="admin-page">

      <div class="page-header">
        <div>
          <h1>Exchange Rates</h1>
          <p>{{ filteredRates.length }} corridors</p>
        </div>
        <button class="btn-fetch" :disabled="fetching" @click="fetchRates">
          <i class="fa-solid fa-rotate" :class="{'fa-spin': fetching}"></i>
          {{ fetching ? 'Fetching...' : 'Fetch Latest' }}
        </button>
      </div>

      <div class="table-card">

        <!-- Toolbar -->
        <div class="toolbar">
          <div class="search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input v-model="search" placeholder="Filter by currency e.g. MWK, TZS..." />
          </div>
          <div class="toolbar__meta">
            <span v-if="staleCount > 0" class="stale-warning">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ staleCount }} stale
            </span>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="state-center">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <p>Loading rates...</p>
        </div>

        <!-- Empty -->
        <div v-else-if="!pagedRates.length" class="state-center">
          <i class="fa-solid fa-chart-line"></i>
          <p>No rates match your search</p>
        </div>

        <template v-else>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Corridor</th>
                  <th>Rate</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="rate in pagedRates" :key="rate.id">
                  <td>
                    <div class="cell-corridor">
                      <span class="cur cur--from">{{ rate.from_currency }}</span>
                      <i class="fa-solid fa-arrow-right"></i>
                      <span class="cur cur--to">{{ rate.to_currency }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="rate-value">{{ Number(rate.rate).toFixed(6) }}</span>
                  </td>
                  <td>
                    <span class="source-tag" :class="rate.source === 'RBM' ? 'source-tag--primary' : 'source-tag--secondary'">
                      {{ rate.source }}
                    </span>
                  </td>
                  <td>
                    <span class="badge" :class="rate.is_stale ? 'badge--red' : 'badge--green'">
                      <i :class="rate.is_stale ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check'"></i>
                      {{ rate.is_stale ? 'Stale' : 'Fresh' }}
                    </span>
                  </td>
                  <td class="cell-secondary">{{ formatDate(rate.fetched_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button :disabled="page === 1" @click="page--">
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <span>Page {{ page }} of {{ totalPages }}</span>
            <button :disabled="page === totalPages" @click="page++">
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </template>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui       = useUiStore()
const rates    = ref([])
const fetching = ref(false)
const loading  = ref(false)
const search   = ref('')
const page     = ref(1)
const perPage  = 20

const filteredRates = computed(() => {
  if (!search.value) return rates.value
  const q = search.value.toUpperCase()
  return rates.value.filter(r => r.from_currency.includes(q) || r.to_currency.includes(q))
})

const totalPages = computed(() => Math.ceil(filteredRates.value.length / perPage))

const pagedRates = computed(() => {
  const start = (page.value - 1) * perPage
  return filteredRates.value.slice(start, start + perPage)
})

const staleCount = computed(() => rates.value.filter(r => r.is_stale).length)

// Reset to page 1 when filter changes
watch(search, () => { page.value = 1 })

function formatDate(d) {
  return d ? new Date(d).toLocaleString('en', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
  }) : '—'
}

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.rates()
    rates.value = data.rates ?? []
  } finally {
    loading.value = false
  }
}

async function fetchRates() {
  fetching.value = true
  try {
    await adminApi.fetchRates()
    ui.success('Rates updated')
    await load()
  } catch(e) {
    ui.error(e.response?.data?.message || 'Rate fetch failed')
  } finally {
    fetching.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 16px; max-width: 1100px; }
@media (min-width: 768px) { .admin-page { padding: 24px 20px; } }
.page-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 20px; gap: 12px;
}
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.btn-fetch {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: var(--accent); color: var(--text-inverse);
  border: none; border-radius: 12px; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
}
.btn-fetch:disabled { opacity: 0.6; cursor: not-allowed; }

/* Table card */
.table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }

/* Toolbar */
.toolbar {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.search-box {
  display: flex; align-items: center; gap: 8px; flex: 1;
  background: #f8fafc; border: 1px solid var(--border); border-radius: 10px;
  padding: 8px 12px; min-width: 200px;
}
.search-box i { color: #94a3b8; font-size: 12px; }
.search-box input { border: none; outline: none; font-size: 13px; color: #374151; width: 100%; background: transparent; }
.toolbar__meta { display: flex; align-items: center; gap: 8px; }
.stale-warning {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: #dc2626;
  background: #fef2f2; padding: 5px 10px; border-radius: 8px;
}

/* States */
.state-center {
  padding: 56px; text-align: center; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.state-center i { font-size: 28px; }
.state-center p { font-size: 14px; }

/* Table */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; min-width: 500px; }
.data-table th {
  padding: 11px 16px; text-align: left; font-size: 11px;
  font-weight: 700; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.05em; background: #f8fafc;
  border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
.data-table td {
  padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
  font-size: 13px; color: #374151; vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #fafafa; }

/* Corridor cell */
.cell-corridor { display: flex; align-items: center; gap: 6px; }
.cell-corridor i { color: #cbd5e1; font-size: 10px; }
.cur { font-weight: 800; font-size: 13px; }
.cur--from { color: #0f172a; }
.cur--to   { color: var(--accent); }

/* Rate value */
.rate-value { font-family: 'DM Mono', monospace; font-size: 13px; font-weight: 500; color: #111827; }

/* Source tag */
.source-tag { font-size: 10px; font-weight: 700; padding: 3px 7px; border-radius: 5px; text-transform: uppercase; }
.source-tag--primary   { background: #eff6ff; color: #2563eb; }
.source-tag--secondary { background: #f1f5f9; color: #475569; }

/* Badges */
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;
}
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }

.cell-secondary { color: #64748b; font-size: 12px; }

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 14px; font-size: 13px; color: #64748b;
  border-top: 1px solid #f1f5f9;
}
.pagination button {
  width: 32px; height: 32px; border: 1px solid var(--border);
  background: var(--bg-card); border-radius: 8px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #475569; transition: all 0.15s;
}
.pagination button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
