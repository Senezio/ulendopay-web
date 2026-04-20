<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Analytics</h1>
          <p>Platform performance — last {{ period }} days</p>
        </div>
        <div class="period-selector">
          <button v-for="d in [7, 14, 30, 90]" :key="d"
            :class="['period-btn', { active: period === d }]"
            @click="period = d; load()">
            {{ d }}d
          </button>
        </div>
      </div>

      <!-- Revenue cards -->
      <div class="revenue-grid" v-if="data">
        <div class="rev-card rev-card--primary">
          <div class="rev-card__icon"><i class="fa-solid fa-coins"></i></div>
          <div class="rev-card__body">
            <div class="rev-card__label">Total Fees Collected</div>
            <div class="rev-card__value">MWK {{ formatMoney(totalRevenue) }}</div>
            <div class="rev-card__sub">{{ formatMoney(data.accounts?.find(a=>a.code==='FEE-MWK')?.balance ?? 0) }} in fee account</div>
          </div>
        </div>
        <div class="rev-card">
          <div class="rev-card__icon"><i class="fa-solid fa-shield-halved"></i></div>
          <div class="rev-card__body">
            <div class="rev-card__label">Guarantee Fund</div>
            <div class="rev-card__value">MWK {{ formatMoney(totalGuarantee) }}</div>
            <div class="rev-card__sub">Across {{ data.accounts?.filter(a=>a.type==='guarantee').length }} corridors</div>
          </div>
        </div>
        <div class="rev-card">
          <div class="rev-card__icon"><i class="fa-solid fa-arrow-right-arrow-left"></i></div>
          <div class="rev-card__body">
            <div class="rev-card__label">Transfer Volume</div>
            <div class="rev-card__value">MWK {{ formatMoney(totalVolume) }}</div>
            <div class="rev-card__sub">{{ totalTransactions }} transfers in period</div>
          </div>
        </div>
        <div class="rev-card">
          <div class="rev-card__icon"><i class="fa-solid fa-wallet"></i></div>
          <div class="rev-card__body">
            <div class="rev-card__label">Escrow Held</div>
            <div class="rev-card__value">MWK {{ formatMoney(escrowBalance) }}</div>
            <div class="rev-card__sub">Pending disbursement</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <div class="charts-grid" v-if="data">

        <!-- Transaction volume chart -->
        <div class="chart-card">
          <div class="chart-card__header">
            <div class="chart-card__title">
              <i class="fa-solid fa-chart-line"></i>
              Transfer Volume
            </div>
          </div>
          <div class="chart-wrapper">
            <Line :data="volumeChartData" :options="lineOptions" />
          </div>
        </div>

        <!-- Revenue chart -->
        <div class="chart-card">
          <div class="chart-card__header">
            <div class="chart-card__title">
              <i class="fa-solid fa-coins"></i>
              Daily Revenue (Fees)
            </div>
          </div>
          <div class="chart-wrapper">
            <Bar :data="revenueChartData" :options="barOptions" />
          </div>
        </div>

        <!-- Transactions count chart -->
        <div class="chart-card">
          <div class="chart-card__header">
            <div class="chart-card__title">
              <i class="fa-solid fa-arrow-right-arrow-left"></i>
              Daily Transactions
            </div>
          </div>
          <div class="chart-wrapper">
            <Line :data="txChartData" :options="lineOptions" />
          </div>
        </div>

        <!-- Top-ups chart -->
        <div class="chart-card">
          <div class="chart-card__header">
            <div class="chart-card__title">
              <i class="fa-solid fa-plus-circle"></i>
              Daily Top-ups
            </div>
          </div>
          <div class="chart-wrapper">
            <Bar :data="topupChartData" :options="barOptions" />
          </div>
        </div>

      </div>

      <!-- Corridor breakdown -->
      <div class="chart-card" v-if="data?.corridors?.length" style="margin-top:16px;">
        <div class="chart-card__header">
          <div class="chart-card__title">
            <i class="fa-solid fa-globe-africa"></i>
            Top Corridors by Volume
          </div>
        </div>
        <div class="corridor-list">
          <div v-for="c in data.corridors" :key="`${c.send_currency}-${c.receive_currency}`" class="corridor-row">
            <div class="corridor-row__pair">
              <span class="cur-tag">{{ c.send_currency }}</span>
              <i class="fa-solid fa-arrow-right"></i>
              <span class="cur-tag cur-tag--to">{{ c.receive_currency }}</span>
            </div>
            <div class="corridor-row__bar-wrap">
              <div class="corridor-row__bar" :style="{ width: barWidth(c.count) + '%' }"></div>
            </div>
            <div class="corridor-row__stats">
              <span>{{ c.count }} tx</span>
              <span class="corridor-row__vol">MWK {{ formatMoney(c.volume) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Account balances table -->
      <div class="chart-card" v-if="data?.accounts?.length" style="margin-top:16px;">
        <div class="chart-card__header">
          <div class="chart-card__title">
            <i class="fa-solid fa-scale-balanced"></i>
            Platform Account Balances
          </div>
        </div>
        <div class="accounts-list">
          <div v-for="acc in data.accounts" :key="acc.code" class="account-row">
            <div class="account-row__left">
              <div class="account-row__code">{{ acc.code }}</div>
              <span class="account-badge" :class="`account-badge--${acc.type}`">{{ acc.type }}</span>
            </div>
            <div class="account-row__balance" :class="{ 'balance--positive': acc.balance > 0 }">
              {{ acc.currency }} {{ formatMoney(acc.balance) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="state-loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading analytics...</p>
      </div>

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

const data    = ref(null)
const loading = ref(false)
const period  = ref(30)

const totalRevenue      = computed(() => data.value?.revenue?.reduce((s,v) => s+v, 0) ?? 0)
const totalVolume       = computed(() => data.value?.volume?.reduce((s,v) => s+v, 0) ?? 0)
const totalTransactions = computed(() => data.value?.transactions?.reduce((s,v) => s+v, 0) ?? 0)
const totalGuarantee    = computed(() => data.value?.accounts?.filter(a=>a.type==='guarantee').reduce((s,a) => s+a.balance, 0) ?? 0)
const escrowBalance     = computed(() => data.value?.accounts?.find(a=>a.type==='escrow')?.balance ?? 0)

const maxCorridorCount = computed(() => Math.max(...(data.value?.corridors?.map(c=>c.count) ?? [1])))

function barWidth(count) { return Math.max(4, (count / maxCorridorCount.value) * 100) }
function formatMoney(v)  { return Number(v||0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const lineOptions = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
  scales: {
    x: { grid: { display: false }, ticks: { font: { size: 11 }, maxTicksLimit: 8 } },
    y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } }
  }
}

const barOptions = { ...lineOptions }

const volumeChartData = computed(() => ({
  labels: data.value?.labels ?? [],
  datasets: [{
    label: 'Volume (MWK)',
    data: data.value?.volume ?? [],
    borderColor: '#e85d04',
    backgroundColor: 'rgba(232,93,4,0.08)',
    borderWidth: 2, fill: true, tension: 0.4,
    pointRadius: 3, pointBackgroundColor: '#e85d04',
  }]
}))

const revenueChartData = computed(() => ({
  labels: data.value?.labels ?? [],
  datasets: [{
    label: 'Revenue (MWK)',
    data: data.value?.revenue ?? [],
    backgroundColor: 'rgba(22,163,74,0.8)',
    borderRadius: 4,
  }]
}))

const txChartData = computed(() => ({
  labels: data.value?.labels ?? [],
  datasets: [{
    label: 'Transactions',
    data: data.value?.transactions ?? [],
    borderColor: '#2563eb',
    backgroundColor: 'rgba(37,99,235,0.08)',
    borderWidth: 2, fill: true, tension: 0.4,
    pointRadius: 3, pointBackgroundColor: '#2563eb',
  }]
}))

const topupChartData = computed(() => ({
  labels: data.value?.labels ?? [],
  datasets: [{
    label: 'Top-ups',
    data: data.value?.topups ?? [],
    backgroundColor: 'rgba(234,179,8,0.8)',
    borderRadius: 4,
  }]
}))

async function load() {
  loading.value = true
  try {
    const { data: res } = await adminApi.analytics(period.value)
    data.value = res
  } finally {
    loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 24px 20px; max-width: 1100px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.period-selector { display: flex; gap: 6px; }
.period-btn { padding: 7px 12px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 8px; font-size: 12px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s; }
.period-btn.active { background: var(--accent); color: var(--text-inverse); border-color: var(--accent); }

.revenue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 16px; }
.rev-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; align-items: flex-start; gap: 14px; }
.rev-card--primary { background: linear-gradient(135deg, var(--accent) 0%, #c44e02 100%); border-color: transparent; color: var(--text-inverse); }
.rev-card__icon { width: 40px; height: 40px; border-radius: 10px; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.rev-card:not(.rev-card--primary) .rev-card__icon { background: var(--accent-dim); color: var(--accent); }
.rev-card__label { font-size: 11px; font-weight: 600; opacity: 0.8; margin-bottom: 4px; }
.rev-card:not(.rev-card--primary) .rev-card__label { color: #64748b; }
.rev-card__value { font-size: 18px; font-weight: 800; margin-bottom: 3px; }
.rev-card:not(.rev-card--primary) .rev-card__value { color: #0f172a; }
.rev-card__sub { font-size: 11px; opacity: 0.7; }
.rev-card:not(.rev-card--primary) .rev-card__sub { color: #94a3b8; }

.charts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
.chart-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 16px; }
.chart-card__header { margin-bottom: 12px; }
.chart-card__title { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #374151; }
.chart-card__title i { color: var(--accent); font-size: 12px; }
.chart-wrapper { height: 180px; }

.corridor-list { display: flex; flex-direction: column; gap: 10px; }
.corridor-row { display: flex; align-items: center; gap: 12px; }
.corridor-row__pair { display: flex; align-items: center; gap: 6px; min-width: 100px; }
.cur-tag { font-weight: 800; font-size: 12px; color: #0f172a; background: #f1f5f9; padding: 2px 6px; border-radius: 5px; }
.cur-tag--to { color: var(--accent); background: var(--accent-dim); }
.corridor-row__pair i { color: #cbd5e1; font-size: 10px; }
.corridor-row__bar-wrap { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; }
.corridor-row__bar { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.5s ease; }
.corridor-row__stats { display: flex; gap: 10px; min-width: 130px; justify-content: flex-end; font-size: 12px; color: #64748b; }
.corridor-row__vol { font-weight: 600; color: #374151; }

.accounts-list { display: flex; flex-direction: column; gap: 8px; }
.account-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: #f8fafc; border-radius: 10px; }
.account-row__left { display: flex; align-items: center; gap: 10px; }
.account-row__code { font-family: monospace; font-size: 13px; font-weight: 600; color: #374151; }
.account-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 5px; text-transform: uppercase; }
.account-badge--fee       { background: #fef3c7; color: #92400e; }
.account-badge--guarantee { background: #eff6ff; color: #1d4ed8; }
.account-badge--escrow    { background: #f0fdf4; color: #166534; }
.account-row__balance { font-size: 14px; font-weight: 700; color: #94a3b8; }
.balance--positive { color: #16a34a; }

.state-loading { text-align: center; padding: 48px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.state-loading i { font-size: 28px; }
</style>
