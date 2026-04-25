<template>
  <AppLayout>
    <div class="topup-page">

      <!-- Header -->
      <div class="page-header fade-up">
        <button class="back-btn" @click="router.back()">
          <i class="fa-sharp-duotone fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h1>Add Money</h1>
          <p>Top up your {{ wallet?.currency_code }} wallet via mobile money</p>
        </div>
      </div>

      <!-- Balance card -->
      <div class="balance-card fade-up-1">
        <div class="balance-card__top">
          <div class="balance-card__icon">
            <i class="fa-sharp-duotone fa-solid fa-wallet"></i>
          </div>
          <div class="balance-card__label">Current Balance</div>
        </div>
        <div class="balance-card__amount">
          <span class="balance-card__currency">{{ wallet?.currency_code }}</span>
          <span class="balance-card__number">{{ formatAmount(wallet?.balance) }}</span>
        </div>
        <div class="balance-card__shine" />
      </div>

      <!-- Step indicator -->
      <div v-if="state !== 'success'" class="step-indicator fade-up-1">
        <div class="step-dot" :class="{ active: step >= 1, done: step > 1 }">
          <i v-if="step > 1" class="fa-sharp-duotone fa-solid fa-check" />
          <span v-else>1</span>
        </div>
        <div class="step-line" :class="{ done: step > 1 }" />
        <div class="step-dot" :class="{ active: step >= 2 }">
          <span>2</span>
        </div>
      </div>

      <!-- Success state -->
      <div v-if="state === 'success'" class="result-card fade-up">
        <div class="result-card__icon">
          <i class="fa-sharp-duotone fa-solid fa-circle-check"></i>
        </div>
        <h2>Payment Initiated</h2>
        <p>Check your phone for a USSD prompt to approve the payment.</p>
        <div class="result-card__ref">
          <i class="fa-sharp-duotone fa-solid fa-hashtag" />
          {{ currentRef }}
        </div>
        <div class="polling-status" :class="pollingStatusClass">
          <i :class="pollingIcon"></i>
          {{ pollingMessage }}
        </div>
        <button class="btn-primary" @click="reset">
          <i class="fa-sharp-duotone fa-solid fa-plus"></i>
          Add More Money
        </button>
      </div>

      <!-- Form -->
      <div v-else class="topup-card fade-up-2">

        <!-- Step 1: Amount -->
        <div v-if="step === 1">
          <div class="step-header">
            <div class="step-header__icon">
              <i class="fa-sharp-duotone fa-solid fa-coins"></i>
            </div>
            <div>
              <div class="step-header__title">How much to add?</div>
              <div class="step-header__sub">Choose or enter an amount</div>
            </div>
          </div>

          <div class="amount-field">
            <div class="amount-field__currency">{{ wallet?.currency_code }}</div>
            <input
              v-model="form.amount"
              type="number"
              min="1"
              placeholder="0.00"
              class="amount-field__input"
              @keyup.enter="goToStep2"
            />
          </div>

          <div class="quick-amounts">
            <button
              v-for="amt in quickAmounts"
              :key="amt"
              class="quick-amount"
              :class="{ active: form.amount == amt }"
              @click="form.amount = amt"
            >
              {{ formatAmount(amt) }}
            </button>
          </div>

          <div v-if="errors.amount" class="field-error">
            <i class="fa-sharp-duotone fa-solid fa-circle-exclamation"></i>
            {{ errors.amount }}
          </div>

          <button class="btn-primary" @click="goToStep2">
            Continue
            <i class="fa-sharp-duotone fa-solid fa-arrow-right"></i>
          </button>
        </div>

        <!-- Step 2: Mobile Money Details -->
        <div v-else-if="step === 2">
          <div class="step-header">
            <div class="step-header__icon">
              <i class="fa-sharp-duotone fa-solid fa-mobile-screen"></i>
            </div>
            <div>
              <div class="step-header__title">Mobile money details</div>
              <div class="step-header__sub">Where should we charge?</div>
            </div>
          </div>

          <div class="amount-summary" @click="step = 1">
            <div class="amount-summary__left">
              <i class="fa-sharp-duotone fa-solid fa-coins"></i>
              <span>Adding</span>
              <strong>{{ wallet?.currency_code }} {{ formatAmount(form.amount) }}</strong>
            </div>
            <span class="amount-summary__edit">
              <i class="fa-sharp-duotone fa-solid fa-pen-to-square"></i> Edit
            </span>
          </div>

          <div class="form-field">
            <label>Mobile Operator</label>
            <div class="operator-grid">
              <button
                v-for="op in operators"
                :key="op"
                class="operator-btn"
                :class="{ active: form.mobile_operator === op }"
                @click="form.mobile_operator = op"
              >
                <i class="fa-sharp-duotone fa-solid fa-sim-card operator-btn__icon"></i>
                {{ op }}
              </button>
            </div>
            <div v-if="errors.mobile_operator" class="field-error">
              <i class="fa-sharp-duotone fa-solid fa-circle-exclamation"></i>
              {{ errors.mobile_operator }}
            </div>
          </div>

          <div class="form-field">
            <label>Mobile Money Number</label>
            <div class="phone-input">
              <div class="phone-input__prefix">{{ dialCode }}</div>
              <input
                v-model="form.phone_number"
                type="tel"
                placeholder="XXX XXX XXX"
                class="phone-input__field"
              />
            </div>
            <div class="field-hint">
              <i class="fa-sharp-duotone fa-solid fa-circle-info"></i>
              You will receive a USSD prompt on this number
            </div>
            <div v-if="errors.phone_number" class="field-error">
              <i class="fa-sharp-duotone fa-solid fa-circle-exclamation"></i>
              {{ errors.phone_number }}
            </div>
          </div>

          <div v-if="errors.general" class="error-banner">
            <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>
            {{ errors.general }}
          </div>

          <button class="btn-primary" :disabled="loading" @click="handleSubmit">
            <i v-if="loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
            <i v-else class="fa-sharp-duotone fa-solid fa-paper-plane"></i>
            {{ loading ? 'Sending prompt...' : 'Send Payment Prompt' }}
          </button>

          <button class="btn-ghost" @click="step = 1">
            <i class="fa-sharp-duotone fa-solid fa-arrow-left"></i>
            Back
          </button>
        </div>

      </div>

      <!-- Recent top-ups -->
      <div v-if="recentTopUps.length" class="recent-section fade-up-3">
        <div class="recent-section__title">Recent Top-ups</div>
        <div class="topup-list">
          <div v-for="topup in recentTopUps" :key="topup.id" class="topup-item">
            <div class="topup-item__icon" :class="`topup-item__icon--${topup.status}`">
              <i :class="statusIcon(topup.status)"></i>
            </div>
            <div class="topup-item__details">
              <div class="topup-item__amount">{{ topup.currency_code }} {{ formatAmount(topup.amount) }}</div>
              <div class="topup-item__meta">{{ topup.mobile_operator }} · {{ formatDate(topup.created_at) }}</div>
            </div>
            <div class="topup-item__status" :class="`topup-item__status--${topup.status}`">
              {{ topup.status }}
            </div>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { topupApi } from '@/api/topup'
import { walletApi } from '@/api/wallet'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const router = useRouter()
const auth   = useAuthStore()
const ui     = useUiStore()

const wallet       = ref(null)
const operators    = ref([])
const recentTopUps = ref([])
const step         = ref(1)
const state        = ref('form') // form | success
const loading      = ref(false)
const currentRef   = ref('')
const pollingStatus = ref('waiting') // waiting | completed | failed
let pollingTimer   = null

const form = ref({
  amount:          '',
  mobile_operator: '',
  phone_number:    '',
})

const errors = ref({
  amount:          '',
  mobile_operator: '',
  phone_number:    '',
  general:         '',
})

// Quick amount options based on currency
const quickAmounts = computed(() => {
  const currency = wallet.value?.currency_code
  const presets = {
    MWK: [5000, 10000, 20000, 50000],
    KES: [500, 1000, 2000, 5000],
    TZS: [10000, 20000, 50000, 100000],
    ZMW: [50, 100, 200, 500],
    ZAR: [50, 100, 200, 500],
    default: [10, 20, 50, 100],
  }
  return presets[currency] || presets.default
})

// Dial code based on user country
const dialCode = computed(() => {
  const codes = {
    MWI: '+265', TZA: '+255', KEN: '+254',
    ZMB: '+260', ZAF: '+27',  MOZ: '+258',
    GHA: '+233', UGA: '+256', RWA: '+250',
  }
  return codes[auth.user?.country_code] || '+'
})

const pollingStatusClass = computed(() => ({
  'polling-status--waiting':   pollingStatus.value === 'waiting',
  'polling-status--completed': pollingStatus.value === 'completed',
  'polling-status--failed':    pollingStatus.value === 'failed',
}))

const pollingIcon = computed(() => ({
  waiting:   'fa-sharp-duotone fa-solid fa-spinner-third fa-spin',
  completed: 'fa-sharp-duotone fa-solid fa-circle-check',
  failed:    'fa-sharp-duotone fa-solid fa-circle-xmark',
}[pollingStatus.value]))

const pollingMessage = computed(() => ({
  waiting:   'Waiting for your approval...',
  completed: 'Payment confirmed! Your wallet has been topped up.',
  failed:    'Payment was not completed. Please try again.',
}[pollingStatus.value]))

function formatAmount(val) {
  if (!val) return '0.00'
  return Number(val).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusIcon(status) {
  return {
    completed: 'fa-sharp-duotone fa-solid fa-circle-check',
    pending:   'fa-sharp-duotone fa-solid fa-clock',
    failed:    'fa-sharp-duotone fa-solid fa-circle-xmark',
    initiated: 'fa-sharp-duotone fa-solid fa-hourglass-start',
    cancelled: 'fa-sharp-duotone fa-solid fa-ban',
  }[status] || 'fa-sharp-duotone fa-solid fa-circle'
}

function goToStep2() {
  errors.value.amount = ''
  if (!form.value.amount || Number(form.value.amount) < 1) {
    errors.value.amount = 'Please enter a valid amount'
    return
  }
  step.value = 2
}

function validateStep2() {
  let valid = true
  errors.value.mobile_operator = ''
  errors.value.phone_number    = ''

  if (!form.value.mobile_operator) {
    errors.value.mobile_operator = 'Please select your mobile operator'
    valid = false
  }

  if (!form.value.phone_number) {
    errors.value.phone_number = 'Please enter your mobile money number'
    valid = false
  }

  return valid
}

async function handleSubmit() {
  if (!validateStep2()) return

  errors.value.general = ''
  loading.value = true

  // Format phone with dial code if needed
  let phone = form.value.phone_number.trim()
  if (!phone.startsWith('+')) {
    phone = dialCode.value + phone.replace(/^0/, '')
  }

  try {
    const { data } = await topupApi.initiate({
      amount:          Number(form.value.amount),
      mobile_operator: form.value.mobile_operator,
      phone_number:    phone,
    })

    currentRef.value    = data.reference
    state.value         = 'success'
    pollingStatus.value = 'waiting'

    // Start polling for status
    startPolling(data.reference)

    // Refresh wallet balance
    await loadWallet()

  } catch (err) {
    const msg = err.response?.data?.message || 'Could not initiate payment. Please try again.'
    errors.value.general = msg
    ui.error(msg)
  } finally {
    loading.value = false
  }
}

function startPolling(reference) {
  let attempts = 0
  const maxAttempts = 24 // Poll for 2 minutes (24 × 5s)

  pollingTimer = setInterval(async () => {
    attempts++

    try {
      const { data } = await topupApi.getStatus(reference)

      if (data.status === 'completed') {
        pollingStatus.value = 'completed'
        clearInterval(pollingTimer)
        pollingTimer = null
        await loadWallet()
        await loadHistory()
        ui.success('Wallet topped up successfully!')
        return
      }

      if (['failed', 'cancelled'].includes(data.status)) {
        pollingStatus.value = 'failed'
        clearInterval(pollingTimer)
        pollingTimer = null
        return
      }

    } catch {
      // Silently ignore polling errors
    }

    if (attempts >= maxAttempts) {
      clearInterval(pollingTimer)
      // Don't mark as failed — webhook may still come
    }

  }, 5000) // Poll every 5 seconds
}

async function loadWallet() {
  try {
    const { data } = await walletApi.getAll()
    const raw = data.wallets?.[0] ?? null
    wallet.value = raw ? { ...raw, currency_code: raw.currency } : null
  } catch {
    // Silent fail
  }
}

async function loadOperators() {
  try {
    const { data } = await topupApi.getOperators()
    operators.value = data.operators ?? []
  } catch {
    // Silent fail
  }
}

async function loadHistory() {
  try {
    const { data } = await topupApi.getHistory()
    recentTopUps.value = data.data?.slice(0, 5) ?? []
  } catch {
    // Silent fail
  }
}

function reset() {
  state.value  = 'form'
  step.value   = 1
  form.value   = { amount: '', mobile_operator: '', phone_number: '' }
  errors.value = { amount: '', mobile_operator: '', phone_number: '', general: '' }
  currentRef.value    = ''
  pollingStatus.value = 'waiting'
  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
}

onMounted(async () => {
  await Promise.all([loadWallet(), loadOperators(), loadHistory()])
})

onUnmounted(() => {
  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
})
</script>

<style scoped>
.topup-page { max-width: 480px; margin: 0 auto; padding-bottom: 80px; }

/* Header */
.page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
.page-header h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; }
.page-header p  { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }
.back-btn {
  width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
  background: var(--bg-elevated); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--text-secondary); transition: all 0.15s;
}
.back-btn:hover { background: var(--border); color: var(--text-primary); }

/* Balance card */
.balance-card {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, var(--accent) 0%, #c94a00 100%);
  color: #fff; border-radius: 20px; padding: 22px 24px; margin-bottom: 20px;
  box-shadow: 0 8px 24px rgba(232, 93, 4, 0.3);
}
.balance-card__top {
  display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
}
.balance-card__icon {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.2);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
}
.balance-card__label { font-size: 12px; font-weight: 600; opacity: 0.85; }
.balance-card__amount { display: flex; align-items: baseline; gap: 8px; }
.balance-card__currency { font-size: 16px; font-weight: 700; opacity: 0.85; }
.balance-card__number { font-size: 36px; font-weight: 900; letter-spacing: -0.04em; }
.balance-card__shine {
  position: absolute; top: -40px; right: -40px;
  width: 160px; height: 160px; border-radius: 50%;
  background: rgba(255,255,255,0.07); pointer-events: none;
}

/* Step indicator */
.step-indicator {
  display: flex; align-items: center; margin-bottom: 20px; padding: 0 4px;
}
.step-dot {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  background: var(--bg-elevated); color: var(--text-muted);
  border: 2px solid var(--border); transition: all 0.3s;
}
.step-dot.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.step-dot.done   { background: var(--accent); border-color: var(--accent); color: #fff; }
.step-line {
  flex: 1; height: 2px; background: var(--border); margin: 0 8px; transition: background 0.3s;
}
.step-line.done { background: var(--accent); }

/* Form card */
.topup-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 20px; padding: 24px; margin-bottom: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

/* Step header */
.step-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
.step-header__icon {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  background: var(--accent-dim); color: var(--accent);
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.step-header__title { font-size: 17px; font-weight: 700; color: var(--text-primary); }
.step-header__sub   { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

/* Amount field */
.amount-field {
  display: flex; align-items: center;
  border: 2px solid var(--border); border-radius: 14px;
  overflow: hidden; margin-bottom: 16px; transition: border-color 0.15s;
  background: var(--bg-elevated);
}
.amount-field:focus-within { border-color: var(--accent); background: var(--bg-card); }
.amount-field__currency {
  padding: 16px 18px; font-weight: 800; font-size: 15px;
  color: var(--accent); border-right: 1px solid var(--border); flex-shrink: 0;
}
.amount-field__input {
  flex: 1; padding: 16px 18px; border: none; outline: none;
  font-size: 26px; font-weight: 800; background: transparent;
  color: var(--text-primary); font-family: inherit;
}
.amount-field__input::placeholder { color: var(--text-muted); font-weight: 400; font-size: 20px; }

/* Quick amounts */
.quick-amounts {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 24px;
}
.quick-amount {
  padding: 12px 4px; border: 1.5px solid var(--border);
  border-radius: 12px; background: var(--bg-elevated);
  font-size: 12px; font-weight: 700; cursor: pointer;
  color: var(--text-secondary); transition: all 0.15s; font-family: inherit;
}
.quick-amount:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
.quick-amount.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }

/* Amount summary */
.amount-summary {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--accent-dim); border: 1px solid var(--accent);
  border-radius: 12px; padding: 12px 16px; margin-bottom: 22px;
  cursor: pointer; transition: background 0.15s;
}
.amount-summary:hover { background: var(--accent-dim); }
.amount-summary__left {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; color: var(--accent);
}
.amount-summary__left i { font-size: 13px; }
.amount-summary__left strong { font-weight: 800; }
.amount-summary__edit { font-size: 12px; font-weight: 600; color: var(--accent); display: flex; align-items: center; gap: 4px; }

/* Form fields */
.form-field { margin-bottom: 20px; }
.form-field label {
  display: block; font-size: 11px; font-weight: 700;
  color: var(--text-secondary); margin-bottom: 10px;
  text-transform: uppercase; letter-spacing: 0.06em;
}

/* Operator grid */
.operator-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.operator-btn {
  padding: 14px 8px; border: 1.5px solid var(--border);
  border-radius: 12px; background: var(--bg-elevated);
  font-size: 13px; font-weight: 700; cursor: pointer;
  color: var(--text-secondary); transition: all 0.15s;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-family: inherit;
}
.operator-btn__icon { font-size: 18px; }
.operator-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }
.operator-btn.active { border-color: var(--accent); background: var(--accent-dim); color: var(--accent); }

/* Phone input */
.phone-input {
  display: flex; border: 1.5px solid var(--border);
  border-radius: 14px; overflow: hidden; transition: border-color 0.15s;
  background: var(--bg-elevated);
}
.phone-input:focus-within { border-color: var(--accent); background: var(--bg-card); }
.phone-input__prefix {
  padding: 14px 16px; background: transparent;
  font-size: 15px; font-weight: 700; color: var(--accent);
  border-right: 1px solid var(--border); flex-shrink: 0;
}
.phone-input__field {
  flex: 1; padding: 14px 16px; border: none; outline: none;
  font-size: 16px; background: transparent; color: var(--text-primary);
  font-family: inherit;
}

.field-hint {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--text-muted); margin-top: 8px;
}
.field-error {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--danger); margin-top: 6px;
}

.error-banner {
  display: flex; align-items: center; gap: 10px;
  background: var(--danger-bg); color: var(--danger);
  border-radius: 12px; padding: 12px 14px;
  font-size: 13px; font-weight: 500; margin-bottom: 16px;
}

/* Buttons */
.btn-primary {
  width: 100%; padding: 16px; background: var(--accent);
  color: #fff; border: none; border-radius: 14px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  gap: 8px; transition: all 0.15s; margin-bottom: 10px;
  font-family: inherit; box-shadow: 0 4px 14px rgba(232,93,4,0.3);
}
.btn-primary:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }

.btn-ghost {
  width: 100%; padding: 13px; background: transparent;
  color: var(--text-secondary); border: 1px solid var(--border);
  border-radius: 14px; font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 8px; transition: all 0.15s; font-family: inherit;
}
.btn-ghost:hover { border-color: var(--text-secondary); color: var(--text-primary); }

/* Result card */
.result-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 20px; padding: 36px 24px; text-align: center;
  margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.result-card__icon { font-size: 56px; margin-bottom: 16px; color: var(--success); }
.result-card h2 { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
.result-card p  { font-size: 14px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5; }
.result-card__ref {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--text-muted);
  font-family: monospace; background: var(--bg-elevated);
  padding: 8px 14px; border-radius: 8px; margin-bottom: 20px;
}

.polling-status {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 14px 16px; border-radius: 12px;
  font-size: 13px; font-weight: 600; margin-bottom: 20px;
}
.polling-status--waiting   { background: #fef3c7; color: #92400e; }
.polling-status--completed { background: var(--success-bg); color: var(--success); }
.polling-status--failed    { background: var(--danger-bg); color: var(--danger); }

/* Recent top-ups */
.recent-section { margin-top: 8px; }
.recent-section__title {
  font-size: 11px; font-weight: 700; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;
}
.topup-list { display: flex; flex-direction: column; gap: 0; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
.topup-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; border-bottom: 1px solid var(--border);
}
.topup-item:last-child { border-bottom: none; }
.topup-item__icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.topup-item__icon--completed { background: var(--success-bg); color: var(--success); }
.topup-item__icon--pending   { background: #fef3c7; color: #92400e; }
.topup-item__icon--failed    { background: var(--danger-bg); color: var(--danger); }
.topup-item__icon--initiated { background: var(--bg-elevated); color: var(--text-secondary); }
.topup-item__details { flex: 1; }
.topup-item__amount  { font-size: 15px; font-weight: 700; }
.topup-item__meta    { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.topup-item__status {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; padding: 4px 10px; border-radius: 20px;
}
.topup-item__status--completed { background: var(--success-bg); color: var(--success); }
.topup-item__status--pending   { background: #fef3c7; color: #92400e; }
.topup-item__status--failed    { background: var(--danger-bg); color: var(--danger); }
.topup-item__status--initiated { background: var(--bg-elevated); color: var(--text-secondary); }
</style>
