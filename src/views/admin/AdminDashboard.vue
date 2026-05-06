<template>
  <AdminLayout>
    <div class="admin-page">

      <!-- Header -->
      <div class="admin-page__header">
        <div>
          <h1>Dashboard</h1>
          <p>{{ today }}</p>
        </div>
        <button class="btn-refresh" @click="load" :disabled="loading">
          <i class="fa-sharp-duotone fa-solid fa-rotate" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>

      <!-- Skeleton -->
      <div v-if="loading && !stats" class="skeleton-grid">
        <div v-for="i in 12" :key="i" class="skeleton-card"></div>
      </div>

      <template v-else-if="stats">

        <!-- ── Users ──────────────────────────────────────────────── -->
        <div class="dash-section">
          <div class="dash-section__header">
            <i class="fa-sharp-duotone fa-solid fa-users"></i>
            <span>Users</span>
          </div>
          <div class="stats-grid">
            <StatCard label="Total Users"   :value="stats.users.total"       icon="fa-sharp-duotone fa-solid fa-users"         color="blue" />
            <StatCard label="Active"        :value="stats.users.active"      icon="fa-sharp-duotone fa-solid fa-circle-check"  color="green" />
            <StatCard label="Suspended"     :value="stats.users.suspended"   icon="fa-sharp-duotone fa-solid fa-ban"           color="red" />
            <StatCard label="Joined Today"  :value="stats.users.today"       icon="fa-sharp-duotone fa-solid fa-user-plus"     color="orange" />
            <StatCard label="KYC Pending"   :value="stats.users.kyc_pending" icon="fa-sharp-duotone fa-solid fa-id-card"       color="amber"
              :link="stats.users.kyc_pending > 0 ? '/admin/kyc' : null" />
          </div>
        </div>

        <!-- ── Transactions ──────────────────────────────────────── -->
        <div class="dash-section">
          <div class="dash-section__header">
            <i class="fa-sharp-duotone fa-solid fa-arrow-right-arrow-left"></i>
            <span>Transactions</span>
          </div>
          <div class="stats-grid">
            <StatCard label="Total"         :value="stats.transactions.total"     icon="fa-sharp-duotone fa-solid fa-list"            color="blue" />
            <StatCard label="Today"         :value="stats.transactions.today"     icon="fa-sharp-duotone fa-solid fa-calendar-day"    color="blue" />
            <StatCard label="Completed"     :value="stats.transactions.completed" icon="fa-sharp-duotone fa-solid fa-circle-check"    color="green" />
            <StatCard label="Failed"        :value="stats.transactions.failed"    icon="fa-sharp-duotone fa-solid fa-circle-xmark"    color="red" />
            <StatCard label="Volume Today"  :value="formatMoney(stats.transactions.volume_today)" icon="fa-sharp-duotone fa-solid fa-coins" color="green" raw />
          </div>
        </div>

        <!-- ── Top-ups ───────────────────────────────────────────── -->
        <div class="dash-section">
          <div class="dash-section__header">
            <i class="fa-duotone fa-solid fa-wallet"></i>
            <span>Top-ups</span>
          </div>
          <div class="stats-grid">
            <StatCard label="Total"         :value="stats.topups.total"     icon="fa-sharp-duotone fa-solid fa-plus-circle"  color="blue" />
            <StatCard label="Today"         :value="stats.topups.today"     icon="fa-sharp-duotone fa-solid fa-calendar-day" color="blue" />
            <StatCard label="Completed"     :value="stats.topups.completed" icon="fa-sharp-duotone fa-solid fa-circle-check" color="green" />
            <StatCard label="Volume Today"  :value="formatMoney(stats.topups.volume_today)" icon="fa-sharp-duotone fa-solid fa-coins" color="green" raw />
          </div>
        </div>

        <!-- ── System ────────────────────────────────────────────── -->
        <div class="dash-section">
          <div class="dash-section__header">
            <i class="fa-sharp-duotone fa-solid fa-server"></i>
            <span>System</span>
          </div>
          <div class="stats-grid">
            <StatCard label="Active Rates"      :value="stats.rates.active"        icon="fa-duotone fa-solid fa-chart-line"               color="green" />
            <StatCard label="Stale Rates"       :value="stats.rates.stale"         icon="fa-sharp-duotone fa-solid fa-triangle-exclamation" color="amber" />
            <StatCard label="New Fraud Alerts"  :value="stats.fraud_alerts.new"    icon="fa-sharp-duotone fa-solid fa-shield-halved"       color="red"
              :link="stats.fraud_alerts.new > 0 ? '/admin/fraud' : null" />
          </div>

          <!-- Rate fetch inline row -->
          <div class="system-meta">
            <span class="system-meta__label">
              <i class="fa-sharp-duotone fa-solid fa-clock"></i>
              Last rate fetch
            </span>
            <span class="system-meta__value">{{ formatDate(stats.rates.last_fetched) }}</span>
          </div>
        </div>

      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import StatCard from '@/components/admin/StatCard.vue'
import { useAdminStore } from '@/stores/admin'

const admin   = useAdminStore()
const loading = ref(false)
const stats   = computed(() => admin.stats)
const today   = new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

function formatMoney(val) {
  if (!val) return '0.00'
  return Number(val).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(val) {
  if (!val) return 'Never'
  return new Date(val).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

async function load() {
  loading.value = true
  await admin.fetchStats()
  loading.value = false
}

onMounted(load)
</script>

<style scoped>
.admin-page {
  padding: 28px 32px;
  max-width: 1200px;
}

/* ── Header ──────────────────────────────────────────── */
.admin-page__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
}
.admin-page__header h1 {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}
.admin-page__header p {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 3px;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-refresh:hover { border-color: var(--accent); color: var(--accent); }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Sections ────────────────────────────────────────── */
.dash-section {
  margin-bottom: 24px;
}

.dash-section__header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.dash-section__header i {
  color: var(--accent);
  font-size: 12px;
}

/* ── Stats Grid ──────────────────────────────────────── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

/* ── System meta row ─────────────────────────────────── */
.system-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 10px 14px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.system-meta__label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}
.system-meta__label i { color: var(--accent); font-size: 12px; }
.system-meta__value {
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
}

/* ── Skeleton ────────────────────────────────────────── */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.skeleton-card {
  height: 80px;
  background: #f1f5f9;
  border-radius: 10px;
  animation: pulse 1.5s ease infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* ── Responsive ──────────────────────────────────────── */
@media (max-width: 1024px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
  .skeleton-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .admin-page { padding: 20px 16px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .skeleton-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 400px) {
  .stats-grid { grid-template-columns: 1fr; }
  .skeleton-grid { grid-template-columns: 1fr; }
}
</style>
