<template>
  <AdminLayout>
    <div class="analytics">

      <!-- Page header -->
      <div class="analytics__header">
        <div>
          <h1>Analytics</h1>
          <p>Platform performance — last {{ period }} days</p>
        </div>
        <div class="period-selector">
          <button v-for="d in [7, 14, 30, 90]" :key="d"
            :class="['period-btn', { active: period === d }]"
            @click="period = d; load()">{{ d }}d</button>
        </div>
      </div>

      <div v-if="loading" class="state-loading">
        <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
        Loading analytics...
      </div>

      <template v-else-if="data">

        <!-- Stat bar — only show currencies with activity -->
        <div class="stat-bar" v-if="activeCurrencies.length">
          <div class="stat-bar__item" v-for="cur in activeCurrencies" :key="cur">
            <div class="stat-bar__top">
              <span class="stat-bar__cur">{{ cur }}</span>
              <span class="stat-bar__tx">{{ data.totals_by_currency[cur].transactions }} transfers</span>
            </div>
            <div class="stat-bar__row">
              <div class="stat-bar__block">
                <span class="stat-bar__label">Volume</span>
                <span class="stat-bar__value">{{ formatMoney(data.totals_by_currency[cur].volume) }}</span>
              </div>
              <div class="stat-bar__divider"></div>
              <div class="stat-bar__block">
                <span class="stat-bar__label">Fees</span>
                <span class="stat-bar__value stat-bar__value--accent">{{ formatMoney(data.totals_by_currency[cur].revenue) }}</span>
              </div>
            </div>
          </div>
          <div class="stat-bar__item">
            <div class="stat-bar__top">
              <span class="stat-bar__cur">Activity</span>
            </div>
            <div class="stat-bar__row">
              <div class="stat-bar__block">
                <span class="stat-bar__label">Transactions</span>
                <span class="stat-bar__value">{{ totalTransactions }}</span>
              </div>
              <div class="stat-bar__divider"></div>
              <div class="stat-bar__block">
                <span class="stat-bar__label">Top-ups</span>
                <span class="stat-bar__value">{{ totalTopups }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- Empty state when no transactions -->
        <div class="empty-stat-bar" v-else>
          <i class="fa-sharp-duotone fa-solid fa-chart-line"></i>
          No transaction data yet for this period
        </div>

        <!-- Charts -->
        <div class="charts-grid">

          <div class="chart-section">
            <div class="chart-section__header">
              <span class="chart-section__title">Transfer Volume</span>
              <select v-if="availableCurrencies.length > 1" v-model="selectedCurrency" class="chart-select">
                <option value="">All</option>
                <option v-for="c in availableCurrencies" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div class="chart-wrap">
              <Line :data="volumeChartData" :options="lineOptions" />
            </div>
          </div>

          <div class="chart-section">
            <div class="chart-section__header">
              <span class="chart-section__title">Daily Fees</span>
            </div>
            <div class="chart-wrap">
              <Bar :data="revenueChartData" :options="barOptions" />
            </div>
          </div>

          <div class="chart-section">
            <div class="chart-section__header">
              <span class="chart-section__title">Daily Transactions</span>
            </div>
            <div class="chart-wrap">
              <Line :data="txChartData" :options="lineOptions" />
            </div>
          </div>

          <div class="chart-section">
            <div class="chart-section__header">
              <span class="chart-section__title">Daily Top-ups</span>
            </div>
            <div class="chart-wrap">
              <Bar :data="topupChartData" :options="barOptions" />
            </div>
          </div>

        </div>

        <!-- Corridors + Accounts side by side -->
        <div class="bottom-grid">

          <!-- Corridors -->
          <div class="data-section" v-if="data.corridors?.length">
            <div class="data-section__title">Top Corridors</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Corridor</th>
                  <th class="text-right">Transfers</th>
                  <th class="text-right">Volume</th>
                  <th class="bar-col"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in data.corridors" :key="`${c.send_currency}-${c.receive_currency}`">
                  <td>
                    <span class="cur-tag">{{ c.send_currency }}</span>
                    <i class="fa-sharp-duotone fa-solid fa-arrow-right cur-arrow"></i>
                    <span class="cur-tag cur-tag--to">{{ c.receive_currency }}</span>
                  </td>
                  <td class="text-right mono">{{ c.count }}</td>
                  <td class="text-right mono">{{ formatMoney(c.volume) }}</td>
                  <td class="bar-col">
                    <div class="inline-bar">
                      <div class="inline-bar__fill" :style="{ width: barWidth(c.count) + '%' }"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Account balances -->
          <div class="data-section" v-if="data.accounts?.length">
            <div class="data-section__title">Platform Balances</div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Type</th>
                  <th class="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!data.accounts.filter(a => a.balance > 0).length">
                  <td colspan="3" class="table-empty">No balances yet</td>
                </tr>
                <tr v-else v-for="acc in data.accounts.filter(a => a.balance > 0)" :key="acc.code">
                  <td class="mono">{{ acc.code }}</td>
                  <td><span class="type-tag" :class="`type-tag--${acc.type}`">{{ acc.type }}</span></td>
                  <td class="text-right mono" :class="{ 'positive': acc.balance > 0 }">
                    {{ acc.currency }} {{ formatMoney(acc.balance) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>

      </template>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js'
import { adminApi } from '@/api/admin'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

const data             = ref(null)
const loading          = ref(false)
const period           = ref(30)
const selectedCurrency = ref('')

const availableCurrencies = computed(() => Object.keys(data.value?.volume_by_currency ?? {}))
const activeCurrencies    = computed(() =>
  Object.entries(data.value?.totals_by_currency ?? {})
    .filter(([, t]) => t.transactions > 0)
    .map(([cur]) => cur)
)
const totalTransactions   = computed(() => data.value?.transactions?.reduce((s,v) => s+v, 0) ?? 0)
const totalTopups         = computed(() => data.value?.topups?.reduce((s,v) => s+v, 0) ?? 0)
const maxCorridorCount    = computed(() => Math.max(...(data.value?.corridors?.map(c=>c.count) ?? [1])))

function barWidth(count) { return Math.max(4, (count / maxCorridorCount.value) * 100) }
function formatMoney(v)  { return Number(v||0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const chartColors = ['#e85d04','#2563eb','#16a34a','#9333ea','#ca8a04','#0891b2']

const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 10 }, maxTicksLimit: 8 } },
    y: { min: 0, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } }
  }
}
const barOptions = {
  ...lineOptions,
  plugins: { ...lineOptions.plugins, legend: { display: true, labels: { font: { size: 10 }, boxWidth: 10 } } }
}

const volumeChartData = computed(() => {
  const labels = data.value?.labels ?? []
  const vol    = data.value?.volume_by_currency ?? {}
  const currencies = selectedCurrency.value ? [selectedCurrency.value] : Object.keys(vol)
  return {
    labels,
    datasets: currencies.map((cur, i) => ({
      label: cur,
      data: vol[cur] ?? [],
      borderColor: chartColors[i % chartColors.length],
      backgroundColor: chartColors[i % chartColors.length] + '14',
      borderWidth: 2, fill: true, tension: 0.4, pointRadius: 2,
      pointBackgroundColor: chartColors[i % chartColors.length],
    }))
  }
})

const revenueChartData = computed(() => {
  const labels = data.value?.labels ?? []
  const rev    = data.value?.revenue_by_currency ?? {}
  return {
    labels,
    datasets: Object.entries(rev).map(([cur, series], i) => ({
      label: cur,
      data: series,
      backgroundColor: chartColors[i % chartColors.length] + 'cc',
      borderRadius: 3,
    }))
  }
})

const txChartData = computed(() => ({
  labels: data.value?.labels ?? [],
  datasets: [{
    label: 'Transactions',
    data: data.value?.transactions ?? [],
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderWidth: 2, fill: true, tension: 0.4, pointRadius: 2,
    pointBackgroundColor: '#2563eb',
  }]
}))

const topupChartData = computed(() => ({
  labels: data.value?.labels ?? [],
  datasets: [{
    label: 'Top-ups',
    data: data.value?.topups ?? [],
    backgroundColor: 'rgba(234,179,8,0.8)',
    borderRadius: 3,
  }]
}))

async function load() {
  loading.value = true
  try {
    const { data: res } = await adminApi.analytics(period.value)
    data.value = res
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.analytics { padding: 24px 20px; max-width: 1100px; }

.analytics__header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.analytics__header h1 { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
.analytics__header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.period-selector { display: flex; gap: 6px; }
.period-btn {
  padding: 6px 12px; border: 1px solid var(--border); background: var(--bg-card);
  border-radius: 7px; font-size: 12px; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.period-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

/* Stat bar */
.stat-bar {
  display: flex; gap: 0; margin-bottom: 24px;
  border: 1px solid var(--border); border-radius: 12px;
  overflow: hidden; background: var(--bg-card);
  flex-wrap: wrap;
}
.stat-bar__item {
  flex: 1; min-width: 180px; padding: 16px 20px;
  border-right: 1px solid var(--border);
}
.stat-bar__item:last-child { border-right: none; }
.stat-bar__top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.stat-bar__cur { font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.06em; }
.stat-bar__tx  { font-size: 11px; color: #94a3b8; }
.stat-bar__row { display: flex; align-items: center; gap: 0; }
.stat-bar__block { flex: 1; }
.stat-bar__label { display: block; font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 3px; }
.stat-bar__value { font-size: 16px; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; }
.stat-bar__value--accent { color: var(--accent); }
.stat-bar__divider { width: 1px; height: 32px; background: var(--border); margin: 0 16px; }

/* Charts */
.charts-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px; margin-bottom: 16px;
}
.chart-section {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px;
}
.chart-section__header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.chart-section__title { font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.05em; }
.chart-select {
  padding: 3px 8px; border: 1px solid var(--border); border-radius: 6px;
  font-size: 11px; background: var(--bg-card); color: #374151; outline: none;
}
.chart-wrap { height: 160px; }

/* Bottom grid */
.bottom-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 12px;
}
.data-section {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px; overflow: hidden;
}
.data-section__title {
  font-size: 12px; font-weight: 700; color: #374151;
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 14px;
}

/* Tables */
.data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.data-table th {
  text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 0 8px 10px; border-bottom: 1px solid #f1f5f9;
}
.data-table td {
  padding: 9px 8px; border-bottom: 1px solid #f8fafc;
  color: #374151; vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.text-right { text-align: right; }
.mono { font-family: monospace; }
.positive { color: #16a34a; font-weight: 700; }

.cur-tag {
  font-weight: 800; font-size: 11px; color: #0f172a;
  background: #f1f5f9; padding: 2px 6px; border-radius: 4px;
}
.cur-tag--to { color: var(--accent); background: var(--accent-dim); }
.cur-arrow { color: #cbd5e1; font-size: 9px; margin: 0 4px; }

.bar-col { width: 80px; }
.inline-bar { height: 4px; background: #f1f5f9; border-radius: 2px; overflow: hidden; }
.inline-bar__fill { height: 100%; background: var(--accent); border-radius: 2px; }

.type-tag {
  font-size: 10px; font-weight: 700; padding: 2px 6px;
  border-radius: 4px; text-transform: uppercase; letter-spacing: 0.04em;
}
.type-tag--fee       { background: #fef3c7; color: #92400e; }
.type-tag--guarantee { background: #eff6ff; color: #1d4ed8; }
.type-tag--escrow    { background: #f0fdf4; color: #166534; }

.empty-stat-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 20px 24px; color: #94a3b8; font-size: 13px;
  border: 1px solid var(--border); border-radius: 12px;
  background: var(--bg-card); margin-bottom: 24px;
}
.empty-stat-bar i { color: #cbd5e1; font-size: 16px; }
.table-empty { padding: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
.state-loading {
  display: flex; align-items: center; gap: 10px;
  padding: 48px; color: #94a3b8; font-size: 14px;
}
</style>
