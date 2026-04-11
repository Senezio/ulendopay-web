<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div><h1>Fraud Alerts</h1><p>Suspicious activity requiring review</p></div>
      </div>
      <div class="admin-table-card">
        <div class="table-toolbar">
          <select v-model="statusFilter" @change="load">
            <option value="">All</option>
            <option value="new">New</option>
            <option value="reviewing">Reviewing</option>
            <option value="cleared">Cleared</option>
            <option value="confirmed">Confirmed Fraud</option>
          </select>
        </div>
        <table v-if="alerts?.data?.length" class="admin-table">
          <thead>
            <tr><th>User</th><th>Rule</th><th>Risk Score</th><th>Transaction</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-for="alert in alerts.data" :key="alert.id">
              <td>
                <div class="cell-user__name">{{ alert.user?.name }}</div>
                <div class="cell-user__meta">{{ alert.user?.email }}</div>
              </td>
              <td><span class="rule-tag">{{ alert.rule_triggered }}</span></td>
              <td>
                <div class="risk-score" :class="riskClass(alert.risk_score)">
                  {{ alert.risk_score }}
                </div>
              </td>
              <td>
                <span v-if="alert.transaction" class="mono-ref">{{ alert.transaction?.reference_number }}</span>
                <span v-else class="cell-date">—</span>
              </td>
              <td><span class="badge" :class="alertBadge(alert.status)">{{ alert.status }}</span></td>
              <td>
                <div v-if="alert.status === 'new' || alert.status === 'reviewing'" class="cell-actions">
                  <button class="btn-action btn-action--success" @click="clear(alert.id)" title="Clear — not fraud">
                    <i class="fa-solid fa-check"></i>
                  </button>
                  <button class="btn-action btn-action--danger" @click="confirm(alert.id)" title="Confirm fraud">
                    <i class="fa-solid fa-skull"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="table-empty">
          <i class="fa-solid fa-shield-halved"></i>
          <p>No fraud alerts</p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui           = useUiStore()
const alerts       = ref(null)
const statusFilter = ref('new')

function riskClass(score) { return score >= 80 ? 'risk--high' : score >= 50 ? 'risk--medium' : 'risk--low' }
function alertBadge(s)    { return { new:'badge--red', reviewing:'badge--amber', cleared:'badge--green', confirmed:'badge--red' }[s]||'badge--gray' }

async function load() {
  const { data } = await adminApi.fraudAlerts({ status: statusFilter.value })
  alerts.value = data
}

async function clear(id) {
  try { await adminApi.fraudClear(id, ''); ui.success('Alert cleared'); await load() }
  catch { ui.error('Failed') }
}

async function confirm(id) {
  try { await adminApi.fraudConfirm(id, 'Confirmed fraud'); ui.success('Fraud confirmed — user suspended'); await load() }
  catch { ui.error('Failed') }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 32px; max-width: 1200px; }
.admin-page__header { margin-bottom: 24px; }
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }
.admin-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.table-toolbar { padding: 16px 20px; border-bottom: 1px solid #f1f5f9; }
.table-toolbar select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 13px; background: #fff; outline: none; cursor: pointer; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.admin-table td { padding: 14px 20px; border-bottom: 1px solid #f8fafc; font-size: 14px; color: #374151; }
.admin-table tr:last-child td { border-bottom: none; }
.cell-user__name { font-weight: 600; color: #111827; font-size: 13px; }
.cell-user__meta { font-size: 12px; color: #9ca3af; }
.rule-tag { background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; font-family: monospace; }
.risk-score { display: inline-block; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 14px; }
.risk--high   { background: #fef2f2; color: #dc2626; }
.risk--medium { background: #fffbeb; color: #d97706; }
.risk--low    { background: #f0fdf4; color: #16a34a; }
.mono-ref { font-family: monospace; font-size: 12px; background: #f8fafc; padding: 3px 8px; border-radius: 6px; }
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #d97706; }
.badge--gray  { background: #f1f5f9; color: #475569; }
.cell-actions { display: flex; gap: 6px; }
.btn-action { width: 30px; height: 30px; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; }
.btn-action--success { background: #f0fdf4; color: #16a34a; }
.btn-action--danger  { background: #fef2f2; color: #dc2626; }
.cell-date { font-size: 13px; color: #94a3b8; }
.table-empty { padding: 48px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.table-empty i { font-size: 32px; color: #d1fae5; }
</style>
