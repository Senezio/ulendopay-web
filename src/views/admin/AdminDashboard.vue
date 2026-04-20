<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div>
          <h1>Dashboard</h1>
          <p>Platform overview — {{ today }}</p>
        </div>
        <button class="btn-refresh" @click="load" :disabled="loading">
          <i class="fa-sharp-duotone fa-solid fa-rotate" :class="{ 'fa-spin': loading }"></i>
          Refresh
        </button>
      </div>

      <div v-if="loading && !stats" class="loading-grid">
        <div v-for="i in 8" :key="i" class="stat-skeleton"></div>
      </div>

      <template v-else-if="stats">
        <!-- Users row -->
        <div class="stats-section">
          <div class="stats-section__title">
            <i class="fa-sharp-duotone fa-solid fa-users"></i> Users
          </div>
          <div class="stats-grid">
            <StatCard label="Total Users"     :value="stats.users.total"       icon="fa-sharp-duotone fa-solid fa-users"           color="blue" />
            <StatCard label="Active"          :value="stats.users.active"      icon="fa-sharp-duotone fa-solid fa-circle-check"    color="green" />
            <StatCard label="Suspended"       :value="stats.users.suspended"   icon="fa-sharp-duotone fa-solid fa-ban"             color="red" />
            <StatCard label="Joined Today"    :value="stats.users.today"       icon="fa-sharp-duotone fa-solid fa-user-plus"       color="orange" />
            <StatCard label="KYC Pending"     :value="stats.users.kyc_pending" icon="fa-sharp-duotone fa-solid fa-id-card"         color="amber"
              :link="stats.users.kyc_pending > 0 ? '/admin/kyc' : null" />
          </div>
        </div>

        <!-- Transactions row -->
        <div class="stats-section">
          <div class="stats-section__title">
            <i class="fa-sharp-duotone fa-solid fa-arrow-right-arrow-left"></i> Transactions
          </div>
          <div class="stats-grid">
            <StatCard label="Total"           :value="stats.transactions.total"       icon="fa-sharp-duotone fa-solid fa-list"              color="blue" />
            <StatCard label="Today"           :value="stats.transactions.today"       icon="fa-sharp-duotone fa-solid fa-calendar-day"      color="blue" />
            <StatCard label="Completed"       :value="stats.transactions.completed"   icon="fa-sharp-duotone fa-solid fa-circle-check"      color="green" />
            <StatCard label="Failed"          :value="stats.transactions.failed"      icon="fa-sharp-duotone fa-solid fa-circle-xmark"      color="red" />
            <StatCard label="Volume Today"    :value="formatMoney(stats.transactions.volume_today)" icon="fa-sharp-duotone fa-solid fa-coins" color="green" raw />
          </div>
        </div>

        <!-- Top-ups row -->
        <div class="stats-section">
          <div class="stats-section__title">
            <i class="fa-duotone fa-solid fa-wallet"></i> Top-ups
          </div>
          <div class="stats-grid">
            <StatCard label="Total Top-ups"   :value="stats.topups.total"           icon="fa-sharp-duotone fa-solid fa-plus-circle"   color="blue" />
            <StatCard label="Today"           :value="stats.topups.today"           icon="fa-sharp-duotone fa-solid fa-calendar-day"  color="blue" />
            <StatCard label="Completed"       :value="stats.topups.completed"       icon="fa-sharp-duotone fa-solid fa-circle-check"  color="green" />
            <StatCard label="Volume Today"    :value="formatMoney(stats.topups.volume_today)" icon="fa-sharp-duotone fa-solid fa-coins" color="green" raw />
          </div>
        </div>

        <!-- System row -->
        <div class="stats-section">
          <div class="stats-section__title">
            <i class="fa-sharp-duotone fa-solid fa-server"></i> System
          </div>
          <div class="stats-grid">
            <StatCard label="Active Rates"    :value="stats.rates.active"           icon="fa-duotone fa-solid fa-chart-line"    color="green" />
            <StatCard label="Stale Rates"     :value="stats.rates.stale"            icon="fa-sharp-duotone fa-solid fa-triangle-exclamation" color="amber" />
            <StatCard label="New Fraud Alerts" :value="stats.fraud_alerts.new"      icon="fa-sharp-duotone fa-solid fa-shield-halved" color="red"
              :link="stats.fraud_alerts.new > 0 ? '/admin/fraud' : null" />
            <StatCard label="Last Rate Fetch" :value="formatDate(stats.rates.last_fetched)" icon="fa-sharp-duotone fa-solid fa-clock" color="blue" raw />
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
.admin-page { padding: 32px; max-width: 1200px; }
.admin-page__header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 32px;
}
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }

.btn-refresh {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; font-size: 13px; font-weight: 600;
  color: #475569; cursor: pointer; transition: all 0.15s;
}
.btn-refresh:hover { border-color: var(--accent); color: var(--accent); }
.btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }

.stats-section { margin-bottom: 28px; }
.stats-section__title {
  font-size: 12px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
}
.stats-section__title i { color: var(--accent); }

.stats-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.loading-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px; margin-bottom: 28px;
}
.stat-skeleton {
  height: 88px; background: #f1f5f9; border-radius: 12px;
  animation: pulse 1.5s ease infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
