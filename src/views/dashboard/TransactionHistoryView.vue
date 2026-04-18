<template>
  <AppLayout>
    <div class="history">

      <!-- Header -->
      <div class="history__header fade-up">
        <h1>Transaction History</h1>
        <p>{{ filtered.length }} {{ filtered.length === 1 ? 'transaction' : 'transactions' }}</p>
      </div>

      <!-- Filter tabs -->
      <div class="filters fade-up-1">
        <button
          v-for="f in filters" :key="f.key"
          class="filter-btn"
          :class="{ active: activeFilter === f.key }"
          @click="activeFilter = f.key"
        >
          {{ f.label }}
        </button>
      </div>

      <!-- List -->
      <div class="tx-card fade-up-2">
        <div v-if="loading" class="activity-loading">
          <div v-for="i in 6" :key="i" class="activity-skeleton">
            <div class="skeleton skeleton--icon"></div>
            <div class="skeleton-lines">
              <div class="skeleton skeleton--line"></div>
              <div class="skeleton skeleton--line-sm"></div>
            </div>
            <div class="skeleton skeleton--amount"></div>
          </div>
        </div>

        <div v-else-if="!filtered.length" class="empty">
          <div class="empty-icon">◎</div>
          <p>No transactions found</p>
        </div>

        <template v-else>
          <div
            v-for="(item, i) in filtered"
            :key="item.reference"
            class="tx-row"
            :class="{ 'tx-row--last': i === filtered.length - 1 }"
            @click="open(item)"
          >
            <div class="tx-row__left">
              <div class="tx-icon" :class="item.kind">
                <i :class="iconFor(item)"></i>
              </div>
              <div>
                <div class="tx-label">{{ labelFor(item) }}</div>
                <div class="tx-meta">
                  <span class="tx-ref">{{ item.reference }}</span>
                  <span class="dot">·</span>
                  <span class="tx-date">{{ formatDate(item.created_at) }}</span>
                </div>
              </div>
            </div>
            <div class="tx-row__right">
              <div class="tx-amount" :class="amountClass(item)">
                {{ amountPrefix(item) }}{{ fmt(amountFor(item)) }}
                <span class="tx-ccy">{{ currencyFor(item) }}</span>
              </div>
              <div class="tx-status" :class="item.status">{{ item.status }}</div>
            </div>
          </div>
        </template>
      </div>

    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="selected" class="modal-backdrop" @click.self="selected = null">
          <div class="modal">

            <div class="modal__header">
              <div class="modal-icon" :class="selected.kind">
                <i :class="iconFor(selected)"></i>
              </div>
              <div>
                <div class="modal-title">{{ labelFor(selected) }}</div>
                <div class="modal-ref">{{ selected.reference }}</div>
              </div>
              <button class="modal-close" @click="selected = null">✕</button>
            </div>

            <div class="modal-amount-block">
              <span class="modal-prefix" :class="amountClass(selected)">{{ amountPrefix(selected) }}</span>
              <span class="modal-amount-int" :class="amountClass(selected)">{{ fmtInt(amountFor(selected)) }}</span>
              <span class="modal-amount-dec" :class="amountClass(selected)">.{{ fmtDec(amountFor(selected)) }}</span>
              <span class="modal-amount-ccy">{{ currencyFor(selected) }}</span>
            </div>

            <div class="modal-status-row">
              <span class="modal-status-pill" :class="selected.status">{{ selected.status }}</span>
              <span class="modal-date">{{ formatDateTime(selected.created_at) }}</span>
            </div>

            <div class="modal-rows">
              <template v-for="([k, v]) in modalRows(selected)" :key="k">
                <div v-if="v" class="modal-row">
                  <span class="modal-row__key">{{ k }}</span>
                  <span class="modal-row__val">{{ v }}</span>
                </div>
              </template>
            </div>

            <button class="modal-dismiss" @click="selected = null">Close</button>
          </div>
        </div>
      </Transition>
    </Teleport>

  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import client from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const allActivity = ref([])
const selected    = ref(null)
const loading     = ref(true)

const filters = [
  { key: 'all',      label: 'All' },
  { key: 'transfer', label: 'Transfers' },
  { key: 'topup',    label: 'Top Ups' },
  { key: 'withdraw', label: 'Withdrawals' },
]
const activeFilter = ref('all')

const filtered = computed(() => {
  if (activeFilter.value === 'all') return allActivity.value
  if (activeFilter.value === 'transfer')
    return allActivity.value.filter(i => i.kind === 'transfer-out' || i.kind === 'transfer-in')
  return allActivity.value.filter(i => i.kind === activeFilter.value)
})

function normalise(raw) {
  const ref = raw.reference_number || raw.reference
  let kind = 'transfer-out'
  if (ref?.startsWith('TUP-')) kind = 'topup'
  else if (ref?.startsWith('WDR-')) kind = 'withdraw'
  else if (raw.sender_id && raw.sender_id !== auth.user?.id) kind = 'transfer-in'
  return { ...raw, reference: ref, kind }
}

onMounted(async () => {
  try {
    const [txRes, topupRes, withdrawRes] = await Promise.all([
      client.get('/transactions'),
      client.get('/topup/history'),
      client.get('/withdraw/history'),
    ])
    const txs       = (txRes.data?.data      || txRes.data?.transactions || []).map(normalise)
    const topups    = (topupRes.data?.data    || topupRes.data?.top_ups   || []).map(normalise)
    const withdraws = (withdrawRes.data?.data || withdrawRes.data?.withdrawals || []).map(normalise)
    allActivity.value = [...txs, ...topups, ...withdraws]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

function open(item) { selected.value = item }

function iconFor(item) {
  if (item.kind === 'topup')       return 'fa-solid fa-arrow-down-to-line'
  if (item.kind === 'withdraw')    return 'fa-solid fa-arrow-up-from-line'
  if (item.kind === 'transfer-in') return 'fa-solid fa-arrow-down-left'
  return 'fa-solid fa-arrow-up-right'
}

function labelFor(item) {
  if (item.kind === 'topup')       return `Top Up${item.mobile_operator ? ' · ' + item.mobile_operator : ''}`
  if (item.kind === 'withdraw')    return `Withdrawal${item.mobile_operator ? ' · ' + item.mobile_operator : ''}`
  if (item.kind === 'transfer-in') return 'Money Received'
  return 'Money Sent'
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

function modalRows(item) {
  if (item.kind === 'topup' || item.kind === 'withdraw') return [
    ['Reference',  item.reference],
    ['Amount',     `${fmt(item.amount)} ${item.currency_code}`],
    ['Network',    item.mobile_operator],
    ['Phone',      item.phone_number],
    ['Country',    item.country_code],
    ['Initiated',  formatDateTime(item.initiated_at)],
    ['Completed',  item.completed_at  ? formatDateTime(item.completed_at) : null],
    ['Failed at',  item.failed_at     ? formatDateTime(item.failed_at)    : null],
    ['Reason', friendlyError(item.failure_reason)],
  ]
  return [
    ['Reference',      item.reference],
    ['You sent',       item.send_amount    ? `${fmt(item.send_amount)} ${item.send_currency}`       : null],
    ['Recipient gets', item.receive_amount ? `${fmt(item.receive_amount)} ${item.receive_currency}` : null],
    ['Exchange rate',  item.locked_rate    ? `1 ${item.send_currency} = ${item.locked_rate} ${item.receive_currency}` : null],
    ['Fee',            item.fee_amount     ? `${fmt(item.fee_amount)} ${item.send_currency}`        : null],
    ['Partner ref',    item.partner_reference],
    ['Failure reason', friendlyError(item.failure_reason)],
    ['Escrowed at',    item.escrowed_at  ? formatDateTime(item.escrowed_at)  : null],
    ['Completed at',   item.completed_at ? formatDateTime(item.completed_at) : null],
    ['Refunded at',    item.refunded_at  ? formatDateTime(item.refunded_at)  : null],
  ]
}

const fmt        = (v) => Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtInt     = (v) => Math.floor(Number(v || 0)).toLocaleString('en')
const fmtDec     = (v) => Number(v || 0).toFixed(2).split('.')[1]
const formatDate     = (d) => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : null

function friendlyError(code) {
  if (!code) return null
  const map = {
    'AMOUNT_TOO_LARGE':      'Amount exceeds the maximum allowed. Please try a smaller amount.',
    'AMOUNT_TOO_SMALL':      'Amount is below the minimum allowed.',
    'INSUFFICIENT_FUNDS':    'Insufficient funds in your mobile wallet. Please top up and try again.',
    'INVALID_MSISDN':        'The phone number is invalid. Please check and try again.',
    'LIMIT_REACHED':         'Your daily or monthly transaction limit has been reached.',
    'PAYER_LIMIT_REACHED':   'Transaction limit reached. Please try again tomorrow.',
    'NOT_ALLOWED':           'This transaction is not permitted on your account.',
    'NOT_ALLOWED_COUNTRY':   'Transactions from your country are not currently supported.',
    'PAYEE_REJECTED':        'Payment declined by your mobile network. Please contact your provider.',
    'SERVICE_UNAVAILABLE':   'Payment service temporarily unavailable. Please try again shortly.',
    'SYSTEM_ERROR':          'A temporary error occurred. Please try again.',
    'TIMED_OUT':             'Payment request timed out. Please try again.',
    'REQUEST_CANCELLED':     'Payment was cancelled. Please try again.',
    'UNSPECIFIED_REJECTION': 'Payment was declined. Please try again or contact support.',
  }
  return map[code] || 'Payment could not be processed. Please try again or contact support.'
}
</script>

<style scoped>
.history { padding-bottom: 40px; }
.history__header { margin-bottom: 20px; }
.history__header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.history__header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.filters { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
.filter-btn {
  padding: 7px 16px; border-radius: 20px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--border); background: var(--bg-elevated);
  color: var(--text-secondary); cursor: pointer; font-family: 'Sora', sans-serif;
  transition: all 0.15s;
}
.filter-btn:hover  { border-color: var(--accent); color: var(--accent); }
.filter-btn.active { background: var(--accent); border-color: var(--accent); color: #000; }

.tx-card { background: var(--bg-card); border-radius: 16px; border: 1px solid var(--border); overflow: hidden; }

.empty { padding: 48px; text-align: center; color: var(--text-secondary); font-size: 14px; }
.empty-icon { font-size: 28px; margin-bottom: 10px; opacity: 0.3; }

.tx-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
  cursor: pointer; transition: background 0.15s;
}
.tx-row:hover { background: var(--bg-elevated); }
.tx-row--last { border-bottom: none; }
.tx-row__left { display: flex; align-items: center; gap: 12px; }

.tx-icon {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.tx-icon.topup        { background: rgba(34,197,94,0.1);  color: #22c55e; }
.tx-icon.withdraw     { background: rgba(249,115,22,0.1); color: #f97316; }
.tx-icon.transfer-out { background: rgba(239,68,68,0.1);  color: #ef4444; }
.tx-icon.transfer-in  { background: rgba(34,197,94,0.1);  color: #22c55e; }

.tx-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.tx-meta  { display: flex; align-items: center; gap: 5px; margin-top: 3px; }
.tx-ref   { font-size: 11px; color: var(--text-muted); font-family: monospace; }
.tx-date  { font-size: 11px; color: var(--text-secondary); }
.dot      { font-size: 11px; color: var(--text-muted); }

.tx-row__right { text-align: right; flex-shrink: 0; }
.tx-amount { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.amount--in  { color: #22c55e; }
.amount--out { color: var(--text-primary); }
.tx-ccy { font-size: 10px; font-weight: 600; letter-spacing: 0.05em; opacity: 0.6; margin-left: 2px; }

.tx-status { font-size: 10px; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; }
.tx-status.completed { color: #22c55e; }
.tx-status.failed    { color: var(--danger); }
.tx-status.refunded  { color: var(--accent-amber); }
.tx-status.processing,
.tx-status.pending,
.tx-status.escrowed,
.tx-status.initiated,
.tx-status.retrying  { color: var(--accent-amber); }

/* ── Modal ───────────────────────────────────────────────────────────────── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center;
}
.modal {
  background: var(--bg-card); border-radius: 24px 24px 0 0;
  border: 1px solid var(--border); border-bottom: none;
  width: 100%; max-width: 560px;
  padding: 28px 24px 40px;
  max-height: 90vh; overflow-y: auto;
}
.modal__header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.modal-icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.modal-icon.topup        { background: rgba(34,197,94,0.1);  color: #22c55e; }
.modal-icon.withdraw     { background: rgba(249,115,22,0.1); color: #f97316; }
.modal-icon.transfer-out { background: rgba(239,68,68,0.1);  color: #ef4444; }
.modal-icon.transfer-in  { background: rgba(34,197,94,0.1);  color: #22c55e; }
.modal-title { font-size: 15px; font-weight: 700; }
.modal-ref   { font-size: 11px; color: var(--text-muted); font-family: monospace; margin-top: 2px; }
.modal-close {
  margin-left: auto; width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-elevated); border: 1px solid var(--border);
  color: var(--text-secondary); font-size: 12px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Sora', sans-serif;
}
.modal-close:hover { color: var(--text-primary); }

.modal-amount-block { display: flex; align-items: baseline; gap: 2px; margin-bottom: 14px; }
.modal-prefix      { font-size: 28px; font-weight: 800; }
.modal-amount-int  { font-size: 48px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
.modal-amount-dec  { font-size: 24px; font-weight: 600; opacity: 0.6; }
.modal-amount-ccy  { font-size: 14px; font-weight: 700; color: var(--text-secondary); margin-left: 6px; letter-spacing: 0.05em; }

.modal-status-row { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
.modal-status-pill {
  padding: 4px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.modal-status-pill.completed  { background: rgba(34,197,94,0.15);  color: #22c55e; }
.modal-status-pill.failed     { background: rgba(239,68,68,0.15);  color: #ef4444; }
.modal-status-pill.refunded   { background: rgba(251,191,36,0.15); color: var(--accent-amber); }
.modal-status-pill.processing,
.modal-status-pill.pending,
.modal-status-pill.escrowed,
.modal-status-pill.initiated,
.modal-status-pill.retrying   { background: rgba(251,191,36,0.15); color: var(--accent-amber); }
.modal-date { font-size: 12px; color: var(--text-secondary); }

.modal-rows { background: var(--bg-elevated); border-radius: 12px; overflow: hidden; margin-bottom: 20px; }
.modal-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 11px 16px; border-bottom: 1px solid var(--border);
}
.modal-row:last-child { border-bottom: none; }
.modal-row__key { font-size: 12px; color: var(--text-secondary); }
.modal-row__val { font-size: 13px; font-weight: 600; color: var(--text-primary); text-align: right; max-width: 60%; word-break: break-all; }

.modal-dismiss {
  width: 100%; padding: 14px; border-radius: 12px;
  background: var(--bg-elevated); border: 1px solid var(--border);
  color: var(--text-secondary); font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.15s;
}
.modal-dismiss:hover { color: var(--text-primary); border-color: var(--text-secondary); }

.modal-enter-active, .modal-leave-active { transition: all 0.25s ease; }
.modal-enter-from .modal, .modal-leave-to .modal { transform: translateY(100%); }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
.skeleton {
  border-radius: 6px;
  background: linear-gradient(90deg, var(--bg-elevated) 25%, var(--border) 50%, var(--bg-elevated) 75%);
  background-size: 800px 100%; animation: shimmer 1.4s infinite;
}
.skeleton--icon    { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; }
.skeleton--line    { height: 12px; width: 140px; margin-bottom: 6px; }
.skeleton--line-sm { height: 10px; width: 90px; }
.skeleton--amount  { height: 14px; width: 70px; border-radius: 4px; }
.activity-loading  { display: flex; flex-direction: column; }
.activity-skeleton {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 18px; border-bottom: 1px solid var(--border);
}
.skeleton-lines { flex: 1; }
</style>
