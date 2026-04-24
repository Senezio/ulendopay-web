<template>
  <AppLayout>
    <div class="dashboard">

      <!-- Header -->
      <div class="dashboard__header fade-up">
        <div class="header-text">
          <h1>Good {{ greeting }}, {{ firstName }} 👋</h1>
          <p>Here's your financial overview</p>
        </div>
      </div>

      <!-- KYC Banner -->
      <div v-if="auth.user?.kyc_status !== 'verified'" class="kyc-banner fade-up-1" @click="router.push('/kyc')">
        <div class="kyc-banner__left">
          <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>
          <div>
            <div class="kyc-banner__title">KYC Verification Required</div>
            <div class="kyc-banner__sub">Verify your identity to send money</div>
          </div>
        </div>
        <span class="kyc-arrow">→</span>
      </div>

      <!-- Wallets -->
      <div class="section fade-up-2">
        <div class="section__label">YOUR WALLETS</div>
        <div class="wallets-grid">
          <div v-if="loading" class="wallet-card wallet-card--loading">
            <div class="skeleton skeleton--sm"></div>
            <div class="skeleton skeleton--lg"></div>
          </div>
          <template v-else>
            <div v-for="w in wallets" :key="w.currency" class="wallet-card">
              <div class="wallet-card__top">
                <span class="wallet-card__currency">{{ w.currency }}</span>
                <span class="wallet-card__badge" :class="w.status">{{ w.status }}</span>
              </div>
              <div class="wallet-card__account">{{ accountFor(w.currency) }}</div>
              <div class="wallet-card__balance">
                <span class="balance-integer">{{ balanceInteger(w.balance) }}</span><span class="balance-decimal">.{{ balanceDecimal(w.balance) }}</span>
              </div>
            </div>
            <div class="wallet-card wallet-card--cta" @click="router.push('/send')">
              <div class="cta-icon"><i class="fa-sharp-duotone fa-solid fa-paper-plane"></i></div>
              <span>Send Money</span>
            </div>
          </template>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="section fade-up-3">
        <div class="section__header">
          <div class="section__label">RECENT ACTIVITY</div>
          <router-link to="/history" class="see-all">See all →</router-link>
        </div>

        <div class="activity-list">
          <div v-if="loading" class="activity-loading">
            <div v-for="i in 4" :key="i" class="activity-skeleton">
              <div class="skeleton skeleton--icon"></div>
              <div class="skeleton-lines">
                <div class="skeleton skeleton--line"></div>
                <div class="skeleton skeleton--line-sm"></div>
              </div>
              <div class="skeleton skeleton--amount"></div>
            </div>
          </div>

          <div v-else-if="!activity.length" class="activity-empty">
            <div class="empty-icon">◎</div>
            <p>No transactions yet</p>
          </div>

          <template v-else>
            <div
              v-for="(item, i) in activity.slice(0, 8)"
              :key="item.reference"
              class="activity-item"
              :class="{ 'activity-item--last': i === Math.min(activity.length, 8) - 1 }"
            >
              <div class="activity-icon" :class="item.kind">
                <i :class="iconFor(item)"></i>
              </div>
              <div class="activity-details">
                <div class="activity-title">{{ labelFor(item) }}</div>
                <div class="activity-meta">
                  <span class="activity-ref">{{ item.reference }}</span>
                  <span class="dot">·</span>
                  <span class="activity-date">{{ formatDate(item.created_at) }}</span>
                  <span v-if="item.kind === 'transfer-out' && item.receive_currency" class="dot">·</span>
                  <span v-if="item.kind === 'transfer-out' && item.receive_currency" class="activity-corridor">
                    {{ item.send_currency }} → {{ item.receive_currency }}
                  </span>
                </div>
              </div>
              <div class="activity-right">
                <div class="activity-amount" :class="amountClass(item)">
                  {{ amountPrefix(item) }}{{ formatAmount(amountFor(item)) }}
                  <span class="activity-ccy">{{ currencyFor(item) }}</span>
                </div>
                <div class="activity-status" :class="item.status">{{ item.status }}</div>
              </div>
            </div>
          </template>
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

const wallets  = ref([])
const accounts = ref([])
const activity = ref([])
const loading  = ref(true)

const firstName = computed(() => auth.user?.name?.split(' ')[0] || '')
const greeting  = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
})

const balanceInteger = (v) => {
  const n = Number(v || 0)
  return Math.floor(n).toLocaleString('en')
}
const balanceDecimal = (v) => {
  const n = Number(v || 0)
  return n.toFixed(2).split('.')[1]
}

function normalise(raw) {
  const ref = raw.reference_number || raw.reference
  let kind = 'transfer-out'
  if (ref?.startsWith('TUP-'))           kind = 'topup'
  else if (ref?.startsWith('WDR-'))      kind = 'withdraw'
  else if (raw.direction === 'received') kind = 'transfer-in'
  return { ...raw, reference: ref, kind }
}

onMounted(async () => {
  try {
    const [accRes, txRes, topupRes, withdrawRes] = await Promise.all([
      client.get('/auth/account-numbers'),
      client.get('/transactions'),
      client.get('/topup/history'),
      client.get('/withdraw/history'),
    ])

    accounts.value = accRes.data?.accounts || []

    const txs       = (txRes.data?.data       || txRes.data?.transactions  || []).map(normalise)
    const topups    = (topupRes.data?.data     || topupRes.data?.top_ups   || []).map(normalise)
    const withdraws = (withdrawRes.data?.data  || withdrawRes.data?.withdrawals || []).map(normalise)

    activity.value = [...txs, ...topups, ...withdraws]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    wallets.value = txRes.data?.wallets || []
    if (!wallets.value.length) {
      const wRes = await client.get('/wallets')
      wallets.value = wRes.data?.wallets || []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function accountFor(currency) {
  const acc = accounts.value.find(a => a.currency === currency)
  if (!acc) return ''
  const n = acc.account_number
  return n.slice(0, 4) + ' ' + n.slice(4, 7) + ' ' + n.slice(7)
}

function iconFor(item) {
  if (item.kind === 'topup')       return 'fa-sharp-duotone fa-solid fa-arrow-down-to-line'
  if (item.kind === 'withdraw')    return 'fa-sharp-duotone fa-solid fa-arrow-up-from-line'
  if (item.kind === 'transfer-in') return 'fa-sharp-duotone fa-solid fa-arrow-down-left'
  return 'fa-sharp-duotone fa-solid fa-arrow-up-right'
}

function labelFor(item) {
  if (item.kind === 'topup')       return `Top Up · ${item.mobile_operator || ''}`
  if (item.kind === 'withdraw')    return `Withdrawal · ${item.mobile_operator || ''}`
  if (item.kind === 'transfer-in') return `Money Received${item.sender_name ? ' · ' + item.sender_name : ''}`
  return `Money Sent${item.recipient_name ? ' · ' + item.recipient_name : ''}`
}

function amountFor(item) {
  if (item.kind === 'topup')       return item.amount
  if (item.kind === 'withdraw')    return item.amount
  if (item.kind === 'transfer-in') return item.receive_amount
  return item.send_amount
}

function currencyFor(item) {
  if (item.kind === 'topup')       return item.currency_code
  if (item.kind === 'withdraw')    return item.currency_code
  if (item.kind === 'transfer-in') return item.receive_currency
  return item.send_currency
}

function amountPrefix(item) {
  return (item.kind === 'topup' || item.kind === 'transfer-in') ? '+' : '-'
}

function amountClass(item) {
  return (item.kind === 'topup' || item.kind === 'transfer-in') ? 'amount--in' : 'amount--out'
}

const formatAmount = (v) => Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate   = (d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
</script>

<style scoped>
.dashboard { padding-bottom: 40px; }

.dashboard__header { margin-bottom: 24px; }
.dashboard__header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.dashboard__header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.kyc-banner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-radius: 12px; margin-bottom: 24px;
  background: #ffb93811; border: 1px solid #ffb93833; cursor: pointer;
}
.kyc-banner__left  { display: flex; align-items: center; gap: 12px; color: var(--accent-amber); }
.kyc-banner__title { font-weight: 600; font-size: 14px; }
.kyc-banner__sub   { font-size: 12px; opacity: 0.7; margin-top: 2px; }
.kyc-arrow         { color: var(--accent-amber); font-size: 16px; }

.section { margin-bottom: 32px; }
.section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.section__label {
  font-size: 11px; font-weight: 600; color: var(--text-secondary);
  letter-spacing: 0.1em; margin-bottom: 14px;
}
.section__header .section__label { margin-bottom: 0; }
.see-all { font-size: 12px; color: var(--accent); text-decoration: none; }
.see-all:hover { opacity: 0.8; }

.wallets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}

.wallet-card {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border);
  padding: 20px;
}
.wallet-card--loading { min-height: 100px; display: flex; flex-direction: column; gap: 12px; }
.wallet-card--cta {
  background: var(--accent); cursor: pointer;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 10px; transition: opacity 0.15s; min-height: 100px;
}
.wallet-card--cta:hover { opacity: 0.9; }
.cta-icon {
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(0,0,0,0.15);
  display: flex; align-items: center; justify-content: center;
}
.wallet-card--cta i    { color: #fff; font-size: 16px; }
.wallet-card--cta span { color: #fff; font-weight: 700; font-size: 13px; }

.wallet-card__account {
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  font-family: monospace; letter-spacing: 0.08em; margin-bottom: 8px;
}
.wallet-card__top {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 4px;
}
.wallet-card__currency {
  font-size: 12px; font-weight: 700;
  color: var(--text-secondary); letter-spacing: 0.06em;
}
.wallet-card__badge {
  font-size: 10px; font-weight: 600; padding: 2px 8px;
  border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em;
}
.wallet-card__badge.active { background: var(--accent-dim); color: var(--accent); }

.wallet-card__balance { line-height: 1; }
.balance-integer {
  font-size: 32px; font-weight: 800;
  letter-spacing: -0.04em; color: var(--text-primary);
}
.balance-decimal {
  font-size: 16px; font-weight: 500;
  color: var(--text-secondary); margin-left: 1px;
}

.activity-list {
  background: var(--bg-card);
  border-radius: 16px;
  border: 1px solid var(--border);
  overflow: hidden;
}
.activity-empty {
  padding: 48px 24px; text-align: center;
  color: var(--text-secondary); font-size: 14px;
}
.empty-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.3; }

.activity-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.activity-item:hover { background: var(--bg-elevated); }
.activity-item--last { border-bottom: none; }

.activity-icon {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.activity-icon.topup        { background: rgba(34,197,94,0.1);   color: #22c55e; }
.activity-icon.withdraw     { background: rgba(249,115,22,0.1);  color: #f97316; }
.activity-icon.transfer-out { background: rgba(239,68,68,0.1);   color: #ef4444; }
.activity-icon.transfer-in  { background: rgba(34,197,94,0.1);   color: #22c55e; }

.activity-details { flex: 1; min-width: 0; }
.activity-title {
  font-size: 13px; font-weight: 600;
  color: var(--text-primary); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.activity-meta {
  display: flex; align-items: center; gap: 5px;
  margin-top: 3px; flex-wrap: wrap;
}
.activity-ref      { font-size: 11px; color: var(--text-muted); font-family: monospace; }
.activity-date     { font-size: 11px; color: var(--text-secondary); }
.activity-corridor { font-size: 11px; color: var(--accent); font-weight: 600; }
.dot               { font-size: 11px; color: var(--text-muted); }

.activity-right { text-align: right; flex-shrink: 0; }
.activity-amount {
  font-size: 15px; font-weight: 800;
  letter-spacing: -0.02em; line-height: 1;
}
.amount--in  { color: #22c55e; }
.amount--out { color: var(--text-primary); }
.activity-ccy {
  font-size: 10px; font-weight: 600;
  letter-spacing: 0.05em; opacity: 0.6; margin-left: 2px;
}
.activity-status {
  font-size: 10px; font-weight: 600; margin-top: 4px;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.activity-status.completed { color: #22c55e; }
.activity-status.failed    { color: var(--danger); }
.activity-status.refunded  { color: var(--accent-amber); }
.activity-status.processing,
.activity-status.pending,
.activity-status.escrowed,
.activity-status.initiated,
.activity-status.retrying  { color: var(--accent-amber); }

@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  border-radius: 6px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--border) 50%, var(--bg-elevated) 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite;
}
.skeleton--sm      { height: 12px; width: 60px; }
.skeleton--lg      { height: 32px; width: 120px; }
.skeleton--icon    { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; }
.skeleton--line    { height: 12px; width: 140px; margin-bottom: 6px; }
.skeleton--line-sm { height: 10px; width: 90px; }
.skeleton--amount  { height: 14px; width: 70px; border-radius: 4px; }

.activity-loading { display: flex; flex-direction: column; }
.activity-skeleton {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.skeleton-lines { flex: 1; }
</style>
