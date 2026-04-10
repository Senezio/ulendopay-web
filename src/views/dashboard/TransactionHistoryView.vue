<template>
  <AppLayout>
    <div class="history">
      <div class="history__header fade-up">
        <h1>Transaction History</h1>
        <p>{{ transactions.length }} transaction{{ transactions.length !== 1 ? 's' : '' }}</p>
      </div>

      <div class="tx-card fade-up-1">
        <div v-if="loading" class="empty">Loading...</div>
        <div v-else-if="!transactions.length" class="empty">No transactions yet</div>
        <template v-else>
          <div v-for="(tx, i) in transactions" :key="tx.reference"
            class="tx-row" :class="{ 'tx-row--last': i === transactions.length - 1 }"
            @click="selected = selected?.reference === tx.reference ? null : tx">
            <div class="tx-row__left">
              <div class="tx-icon" :style="{ background: statusBg(tx.status) }">↗</div>
              <div>
                <div class="tx-ref mono">{{ tx.reference }}</div>
                <div class="tx-date">{{ new Date(tx.created_at).toLocaleString() }}</div>
              </div>
            </div>
            <div class="tx-row__right">
              <div class="tx-amount mono">{{ fmt(tx.send_amount) }} <span>{{ tx.send_currency }}</span></div>
              <div class="tx-status" :class="tx.status">{{ tx.status }}</div>
            </div>
          </div>
        </template>
      </div>

      <!-- Detail panel -->
      <div v-if="selected" class="detail-card fade-up">
        <h3>Transfer Details</h3>
        <div v-for="([k,v], i) in detailRows" :key="k" class="detail-row"
          :class="{ last: i === detailRows.length - 1 }">
          <span>{{ k }}</span>
          <span class="mono" :class="{ status: k === 'Status' }">{{ v }}</span>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import client from '@/api/client'

const transactions = ref([])
const selected     = ref(null)
const loading      = ref(true)

onMounted(async () => {
  try {
    const { data } = await client.get('/transactions')
    transactions.value = data.data || []
  } catch {} finally { loading.value = false }
})

const detailRows = computed(() => !selected.value ? [] : [
  ['Reference', selected.value.reference],
  ['Sent',      `${fmt(selected.value.send_amount)} ${selected.value.send_currency}`],
  ['Received',  `${fmt(selected.value.receive_amount)} ${selected.value.receive_currency}`],
  ['Rate',      selected.value.locked_rate],
  ['Fee',       `${fmt(selected.value.fee_amount)} ${selected.value.send_currency}`],
  ['Status',    selected.value.status],
  ['Date',      new Date(selected.value.created_at).toLocaleString()],
])

const statusBg = (s) => ({
  completed: '#00e88f22', failed: '#ff444422', processing: '#ffb93822',
  escrowed: '#4f8eff22', retrying: '#ffb93822',
}[s] || '#ffffff11')

const fmt = (v) => Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2 })
</script>

<style scoped>
.history__header { margin-bottom: 24px; }
.history__header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.history__header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.tx-card { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); margin-bottom: 14px; }
.empty   { padding: 40px; text-align: center; color: var(--text-secondary); font-size: 14px; }

.tx-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
  cursor: pointer; transition: background 0.15s;
}
.tx-row:hover { background: var(--bg-elevated); }
.tx-row--last { border-bottom: none; }
.tx-row__left { display: flex; align-items: center; gap: 12px; }
.tx-icon {
  width: 38px; height: 38px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
}
.tx-ref  { font-size: 12px; font-weight: 500; }
.tx-date { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.tx-row__right { text-align: right; }
.tx-amount { font-size: 13px; font-weight: 600; }
.tx-amount span { color: var(--text-secondary); font-weight: 400; }
.tx-status { font-size: 11px; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.04em; }
.tx-status.completed { color: var(--accent); }
.tx-status.failed    { color: var(--danger); }
.tx-status.processing,.tx-status.escrowed,.tx-status.retrying { color: var(--accent-amber); }

.detail-card { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); padding: 20px; }
.detail-card h3 { font-size: 14px; font-weight: 600; margin-bottom: 14px; }
.detail-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--border); }
.detail-row.last { border-bottom: none; }
.detail-row span:first-child { color: var(--text-secondary); font-size: 13px; }
.detail-row span:last-child  { font-size: 13px; font-weight: 500; }
</style>
