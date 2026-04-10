<template>
  <AppLayout>
    <div class="dashboard">
      <div class="dashboard__header fade-up">
        <h1>Good {{ greeting }}, {{ firstName }} 👋</h1>
        <p>Here's your financial overview</p>
      </div>

      <!-- KYC Banner -->
      <div v-if="auth.user?.kyc_status !== 'verified'" class="kyc-banner fade-up-1" @click="router.push('/kyc')">
        <div class="kyc-banner__left">
          <i class="fa-solid fa-triangle-exclamation" style="color: var(--accent-amber);"></i>
          <div>
            <div class="kyc-banner__title">KYC Verification Required</div>
            <div class="kyc-banner__sub">Verify your identity to send money</div>
          </div>
        </div>
        <span>→</span>
      </div>

      <!-- Wallets -->
      <div class="section fade-up-2">
        <div class="section__title">YOUR WALLETS</div>
        <div class="wallets-grid">
          <div v-if="loading" class="wallet-card wallet-card--loading">Loading...</div>
          <template v-else>
            <div v-for="w in wallets" :key="w.currency" class="wallet-card">
              <div class="wallet-card__currency mono">{{ w.currency }}</div>
              <div class="wallet-card__balance mono">{{ formatAmount(w.balance) }}</div>
              <div class="wallet-card__status" :class="w.status">{{ w.status }}</div>
            </div>
            <div class="wallet-card wallet-card--cta" @click="router.push('/send')">
              <i class="fa-solid fa-paper-plane"></i>
              <span>Send Money</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="section fade-up-3">
        <div class="section__title">RECENT TRANSACTIONS</div>
        <div class="tx-list">
          <div v-if="loading" class="tx-empty">Loading...</div>
          <div v-else-if="!transactions.length" class="tx-empty">No transactions yet</div>
          <div v-for="(tx, i) in transactions.slice(0, 5)" :key="tx.reference"
            class="tx-item" :class="{ 'tx-item--last': i === Math.min(transactions.length, 5) - 1 }">
            <div class="tx-item__left">
              <div class="tx-icon">↗</div>
              <div>
                <div class="tx-ref mono">{{ tx.reference }}</div>
                <div class="tx-date">{{ formatDate(tx.created_at) }}</div>
              </div>
            </div>
            <div class="tx-item__right">
              <div class="tx-amount mono">{{ formatAmount(tx.send_amount) }} {{ tx.send_currency }}</div>
              <div class="tx-status" :class="tx.status">{{ tx.status }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/AppLayout.vue'
import client from '@/api/client'

const router = useRouter()
const auth   = useAuthStore()

const wallets      = ref([])
const transactions = ref([])
const loading      = ref(true)

const firstName = computed(() => auth.user?.name?.split(' ')[0] || '')
const greeting  = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
})

onMounted(async () => {
  try {
    const [w, t] = await Promise.all([client.get('/wallets'), client.get('/transactions')])
    wallets.value      = w.data.wallets || []
    transactions.value = t.data.data   || []
  } catch {} finally { loading.value = false }
})

const formatAmount = (v) => Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2 })
const formatDate   = (d) => new Date(d).toLocaleDateString()
</script>

<style scoped>
.dashboard__header { margin-bottom: 28px; }
.dashboard__header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.dashboard__header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.kyc-banner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-radius: 12px; margin-bottom: 24px;
  background: #ffb93811; border: 1px solid #ffb93833;
  cursor: pointer; color: var(--accent-amber);
}
.kyc-banner__left  { display: flex; align-items: center; gap: 12px; }
.kyc-banner__title { font-weight: 600; font-size: 14px; }
.kyc-banner__sub   { font-size: 12px; opacity: 0.7; margin-top: 2px; }

.section { margin-bottom: 32px; }
.section__title {
  font-size: 11px; font-weight: 600; color: var(--text-secondary);
  letter-spacing: 0.1em; margin-bottom: 14px;
}

.wallets-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px;
}
.wallet-card {
  background: var(--bg-card); border-radius: 14px;
  border: 1px solid var(--border); padding: 18px;
}
.wallet-card--loading { color: var(--text-secondary); font-size: 13px; }
.wallet-card--cta {
  background: var(--accent); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  gap: 8px; transition: opacity 0.15s;
}
.wallet-card--cta:hover { opacity: 0.9; }
.wallet-card--cta i, .wallet-card--cta span { color: #000; font-weight: 700; font-size: 14px; }
.wallet-card__currency { font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; }
.wallet-card__balance  { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
.wallet-card__status   { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; }
.wallet-card__status.active { background: var(--accent-dim); color: var(--accent); }

.tx-list { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); }
.tx-empty { padding: 32px; text-align: center; color: var(--text-secondary); font-size: 14px; }
.tx-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.tx-item--last { border-bottom: none; }
.tx-item__left { display: flex; align-items: center; gap: 12px; }
.tx-icon {
  width: 36px; height: 36px; border-radius: 9px;
  background: var(--bg-elevated); display: flex;
  align-items: center; justify-content: center; font-size: 14px;
}
.tx-ref  { font-size: 12px; font-weight: 500; }
.tx-date { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
.tx-item__right { text-align: right; }
.tx-amount { font-size: 13px; font-weight: 600; }
.tx-status { font-size: 11px; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.04em; }
.tx-status.completed { color: var(--accent); }
.tx-status.failed    { color: var(--danger); }
.tx-status.processing,.tx-status.escrowed,.tx-status.retrying { color: var(--accent-amber); }
</style>
