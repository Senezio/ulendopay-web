<template>
  <AppLayout>
    <div class="send-page">
      <div class="send-header fade-up">
        <h1>Send Money</h1>
        <p>Fast, secure transfers across Africa</p>
      </div>

      <div class="steps fade-up-1">
        <template v-for="(s, i) in steps" :key="s">
          <div class="step" :class="{ active: currentStep === s, done: stepIndex > i }">
            <div class="step__dot">{{ stepIndex > i ? '✓' : i + 1 }}</div>
            <span>{{ s }}</span>
          </div>
          <div v-if="i < steps.length - 1" class="step__line" :class="{ done: stepIndex > i }"></div>
        </template>
      </div>

      <div class="send-card fade-up-2">

        <template v-if="currentStep === 'Quote'">
          <h2>How much to send?</h2>
          <p class="step-desc">Get a live rate from official sources</p>

          <div class="currency-row">
            <div class="field">
              <label>From</label>
              <select v-model="quoteForm.from_currency">
                <option v-for="c in sendCurrencies" :key="c">{{ c }}</option>
              </select>
            </div>
            <div class="currency-arrow">→</div>
            <div class="field">
              <label>To</label>
              <select v-model="quoteForm.to_currency">
                <option v-for="c in receiveCurrencies" :key="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <UField label="Amount" type="number" v-model="quoteForm.send_amount" placeholder="0.00" min="1" />

          <div v-if="quote" class="quote-box">
            <div class="quote-row">
              <span>Exchange Rate</span>
              <span class="mono">1 {{ quoteForm.from_currency }} = {{ quote.exchange_rate }} {{ quoteForm.to_currency }}</span>
            </div>
            <div class="quote-row">
              <span>Fee</span>
              <span class="mono">{{ quote.fee_amount }} {{ quoteForm.from_currency }}</span>
            </div>
            <div class="quote-row quote-row--total">
              <span>Recipient gets</span>
              <span class="mono accent">{{ quote.receive_amount }} {{ quoteForm.to_currency }}</span>
            </div>
          </div>

          <UError v-if="error" :message="error" />
          <UButton :loading="loading" @click="handleQuote">
            {{ quote ? 'Lock Rate & Continue' : 'Get Quote' }}
          </UButton>
        </template>

        <template v-else-if="currentStep === 'Recipient'">
          <h2>Who are you sending to?</h2>
          <p v-if="rateLock" class="step-desc timer">
            Rate locked · expires in {{ countdown }}s
          </p>
          <UField label="Full Name" v-model="recipientForm.full_name" placeholder="John Doe" />
          <UField label="Phone" type="tel" v-model="recipientForm.phone" placeholder="+255 XXX XXX XXX" />
          <div class="field">
            <label>Mobile Network</label>
            <select v-model="recipientForm.mobile_network">
              <option v-for="n in availableNetworks" :key="n">{{ n }}</option>
            </select>
          </div>
          <UField label="Mobile Number" type="tel" v-model="recipientForm.mobile_number" placeholder="+255 XXX XXX XXX" />
          <UError v-if="error" :message="error" />
          <UButton :loading="loading" @click="currentStep = 'Confirm'">Continue</UButton>
          <button class="btn-back" @click="currentStep = 'Quote'">← Back</button>
        </template>

        <template v-else-if="currentStep === 'Confirm'">
          <h2>Confirm Transfer</h2>
          <div class="confirm-rows">
            <div v-for="([k,v], i) in confirmRows" :key="k" class="confirm-row"
              :class="{ last: i === confirmRows.length - 1 }">
              <span>{{ k }}</span>
              <span :class="{ mono: true, accent: k === 'Recipient gets' }">{{ v }}</span>
            </div>
          </div>
          <UError v-if="error" :message="error" />
          <UButton :loading="loading" @click="openPinModal">Confirm & Send</UButton>
          <button class="btn-back" @click="currentStep = 'Recipient'">← Back</button>
        </template>

        <template v-else>
          <div class="done-state">
            <div class="done-icon">✓</div>
            <h2>Transfer Initiated!</h2>
            <p>Your transfer is being processed</p>
            <div class="done-ref mono">{{ transaction?.reference }}</div>
            <UButton @click="reset">Send Another</UButton>
          </div>
        </template>

      </div>
    </div>

    <!-- ── PIN Confirmation Modal ──────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="pinModal.open" class="modal-overlay" @click.self="closePinModal">
        <div class="modal">
          <div class="modal__header">
            <div class="modal__icon">
              <i class="fa-solid fa-lock"></i>
            </div>
            <div>
              <div class="modal__title">Confirm with PIN</div>
              <div class="modal__subtitle">Enter your 4-digit PIN to authorise this transfer</div>
            </div>
            <button class="modal__close" @click="closePinModal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="modal__body">
            <!-- Transfer summary -->
            <div class="pin-summary">
              <div class="pin-summary__row">
                <span>Sending</span>
                <span class="pin-summary__value">{{ Number(quoteForm.send_amount).toLocaleString() }} {{ quoteForm.from_currency }}</span>
              </div>
              <div class="pin-summary__row">
                <span>To</span>
                <span class="pin-summary__value">{{ recipientForm.full_name }}</span>
              </div>
              <div class="pin-summary__row pin-summary__row--accent">
                <span>They receive</span>
                <span class="pin-summary__value accent">{{ quote?.receive_amount }} {{ quoteForm.to_currency }}</span>
              </div>
            </div>

            <!-- PIN dots input -->
            <div class="pin-input-group">
              <input
                v-for="(_, i) in 4" :key="i"
                :ref="el => { if (el) pinRefs[i] = el }"
                class="pin-box"
                type="password"
                inputmode="numeric"
                maxlength="1"
                :value="pinModal.digits[i] || ''"
                @input="onPinInput($event, i)"
                @keydown="onPinKeydown($event, i)"
                @paste="onPinPaste($event)"
              />
            </div>

            <div v-if="pinModal.error" class="modal__error">{{ pinModal.error }}</div>

            <button
              class="modal__btn modal__btn--primary"
              :disabled="pinModal.loading || pinModal.digits.join('').length < 4"
              @click="submitWithPin"
            >
              <i v-if="pinModal.loading" class="fa-solid fa-spinner fa-spin"></i>
              <span v-else><i class="fa-solid fa-paper-plane"></i> Send Money</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </AppLayout>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'
import client from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// ---------------------------------------------------------------------------
// Currency / network maps
// ---------------------------------------------------------------------------
const CURRENCY_LABELS = {
  XOF: 'XOF – West Africa (Benin / Burkina Faso / Côte d\'Ivoire / Senegal)',
  XAF: 'XAF – Central Africa (Cameroon / Congo / Gabon)',
  CDF: 'CDF – Congolese Franc (DR Congo)',
  USD: 'USD – US Dollar (DR Congo)',
  GHS: 'GHS – Ghanaian Cedi',
  KES: 'KES – Kenyan Shilling',
  MWK: 'MWK – Malawian Kwacha',
  MZN: 'MZN – Mozambican Metical',
  RWF: 'RWF – Rwandan Franc',
  SLE: 'SLE – Sierra Leonean Leone',
  TZS: 'TZS – Tanzanian Shilling',
  UGX: 'UGX – Ugandan Shilling',
  ZMW: 'ZMW – Zambian Kwacha',
  ZAR: 'ZAR – South African Rand',
  BWP: 'BWP – Botswana Pula',
  NGN: 'NGN – Nigerian Naira',
}

const NETWORKS_BY_CURRENCY = {
  XOF: ['MOOV', 'MTN', 'MOOV_BFA', 'MTN_CIV', 'ORANGE_CIV', 'FREE', 'ORANGE_SEN'],
  XAF: ['MTN', 'ORANGE_CMR', 'AIRTEL_COG', 'MTN_COG', 'AIRTEL_GAB'],
  CDF: ['AIRTEL', 'ORANGE', 'VODACOM'],
  USD: ['AIRTEL', 'ORANGE', 'VODACOM'],
  GHS: ['AIRTELTIGO', 'MTN', 'VODAFONE'],
  KES: ['SAFARICOM'],
  MZN: ['VODACOM'],
  MWK: ['AIRTEL', 'TNM'],
  RWF: ['AIRTEL', 'MTN'],
  SLE: ['ORANGE'],
  TZS: ['AIRTEL', 'HALOTEL', 'TIGO'],
  UGX: ['AIRTEL', 'MTN'],
  ZMW: ['AIRTEL', 'MTN', 'ZAMTEL'],
  ZAR: ['Vodacom', 'MTN', 'Cell C'],
  BWP: ['Orange', 'Mascom'],
  NGN: ['MTN', 'Airtel', 'Glo', '9mobile'],
}

const allCurrencies   = Object.keys(CURRENCY_LABELS)
const userCurrency    = computed(() => auth.user?.currency || 'MWK')
const sendCurrencies  = computed(() => [userCurrency.value, ...allCurrencies.filter(c => c !== userCurrency.value)])
const receiveCurrencies = computed(() => allCurrencies)
const availableNetworks = computed(() => NETWORKS_BY_CURRENCY[quoteForm.value.to_currency] ?? [])

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
const steps       = ['Quote', 'Recipient', 'Confirm', 'Done']
const currentStep = ref('Quote')
const stepIndex   = computed(() => steps.indexOf(currentStep.value))

// ---------------------------------------------------------------------------
// Forms
// ---------------------------------------------------------------------------
const quoteForm = ref({
  from_currency: userCurrency.value,
  to_currency:   userCurrency.value,
  send_amount:   '',
})

const recipientForm = ref({
  full_name:      '',
  phone:          '',
  country_code:   'TZA',
  payment_method: 'mobile_money',
  mobile_network: '',
  mobile_number:  '',
})

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const quote       = ref(null)
const rateLock    = ref(null)
const transaction = ref(null)
const error       = ref('')
const loading     = ref(false)
const countdown   = ref(0)
let timer = null

// ---------------------------------------------------------------------------
// Confirm summary rows
// ---------------------------------------------------------------------------
const confirmRows = computed(() => [
  ['You send',      `${Number(quoteForm.value.send_amount).toLocaleString()} ${quoteForm.value.from_currency}`],
  ['Fee',           `${quote.value?.fee_amount} ${quoteForm.value.from_currency}`],
  ['Rate',          `1 ${quoteForm.value.from_currency} = ${quote.value?.exchange_rate} ${quoteForm.value.to_currency}`],
  ['Recipient gets',`${quote.value?.receive_amount} ${quoteForm.value.to_currency}`],
  ['To',            recipientForm.value.full_name],
  ['Via',           recipientForm.value.mobile_network],
])

// ---------------------------------------------------------------------------
// Quote & send handlers
// ---------------------------------------------------------------------------
async function handleQuote() {
  if (quote.value) { currentStep.value = 'Recipient'; return }
  error.value = ''
  loading.value = true
  try {
    const { data: rl } = await client.post('/rate-locks', quoteForm.value)
    rateLock.value = rl.rate_lock
    quote.value = {
      exchange_rate:  rl.rate_lock.locked_rate,
      fee_amount:     rl.rate_lock.fee_amount,
      receive_amount: rl.rate_lock.receive_amount,
    }
    countdown.value = rl.rate_lock.expires_in_seconds || 600
    if (timer) clearInterval(timer)
    timer = setInterval(() => { if (countdown.value > 0) countdown.value-- }, 1000)
    currentStep.value = 'Recipient'
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not get quote'
  } finally { loading.value = false }
}

async function handleSend() {
  error.value = ''
  loading.value = true
  try {
    const { data: rd } = await client.post('/recipients', recipientForm.value)
    const { data }     = await client.post('/transactions', {
      idempotency_key: `send-${Date.now()}`,
      rate_lock_id:    rateLock.value.id,
      recipient_id:    rd.recipient.id,
      send_amount:     quoteForm.value.send_amount,
    })
    transaction.value = data.transaction
    currentStep.value = 'Done'
    if (timer) clearInterval(timer)
  } catch (err) {
    error.value = err.response?.data?.message || 'Transfer failed'
    closePinModal()
  } finally { loading.value = false }
}

function reset() {
  currentStep.value = 'Quote'
  quote.value = rateLock.value = transaction.value = null
  error.value = ''
  quoteForm.value = { from_currency: userCurrency.value, to_currency: userCurrency.value, send_amount: '' }
  recipientForm.value = { full_name: '', phone: '', country_code: 'TZA', payment_method: 'mobile_money', mobile_network: '', mobile_number: '' }
}

onUnmounted(() => { if (timer) clearInterval(timer) })

// ---------------------------------------------------------------------------
// PIN modal
// ---------------------------------------------------------------------------
const pinRefs = ref([])
const pinModal = ref({
  open: false,
  digits: [],
  loading: false,
  error: '',
})

function openPinModal() {
  pinModal.value = { open: true, digits: [], loading: false, error: '' }
  // Focus first PIN box after modal renders
  setTimeout(() => pinRefs.value[0]?.focus(), 100)
}

function closePinModal() {
  pinModal.value.open = false
  pinModal.value.digits = []
  pinModal.value.error = ''
}

function onPinInput(event, index) {
  const val = event.target.value.replace(/\D/g, '').slice(-1)
  pinModal.value.digits[index] = val
  event.target.value = val
  if (val && index < 3) pinRefs.value[index + 1]?.focus()
  // Auto-submit when all 4 digits entered
  if (pinModal.value.digits.join('').length === 4) {
    submitWithPin()
  }
}

function onPinKeydown(event, index) {
  if (event.key === 'Backspace' && !pinModal.value.digits[index] && index > 0) {
    pinRefs.value[index - 1]?.focus()
  }
}

function onPinPaste(event) {
  event.preventDefault()
  const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4).split('')
  digits.forEach((d, i) => {
    pinModal.value.digits[i] = d
    if (pinRefs.value[i]) pinRefs.value[i].value = d
  })
  pinRefs.value[Math.min(digits.length, 3)]?.focus()
}

async function submitWithPin() {
  const pin = pinModal.value.digits.join('')
  if (pin.length < 4) return

  pinModal.value.loading = true
  pinModal.value.error   = ''

  try {
    // Step 1: verify PIN
    await client.post('/auth/verify-pin', { pin })
    // Step 2: PIN correct — proceed with transfer
    await handleSend()
    closePinModal()
  } catch (err) {
    const errors = err.response?.data?.errors
    pinModal.value.error = errors?.pin?.[0] || err.response?.data?.message || 'Incorrect PIN.'
    // Clear digits so user can re-enter
    pinModal.value.digits = []
    pinRefs.value.forEach(el => { if (el) el.value = '' })
    pinRefs.value[0]?.focus()
  } finally {
    pinModal.value.loading = false
  }
}
</script>

<style scoped>
.send-header { margin-bottom: 24px; }
.send-header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.send-header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.steps { display: flex; align-items: center; margin-bottom: 24px; max-width: 480px; }
.step  { display: flex; align-items: center; gap: 7px; }
.step__dot {
  width: 26px; height: 26px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 11px; font-weight: 700;
  background: var(--bg-elevated); color: var(--text-muted); transition: all 0.3s;
}
.step.active .step__dot { background: var(--accent); color: #000; }
.step.done   .step__dot { background: var(--accent); color: #000; }
.step span { font-size: 12px; color: var(--text-secondary); }
.step.active span { color: var(--text-primary); font-weight: 600; }
.step__line { flex: 1; height: 2px; background: var(--border); margin: 0 8px; transition: all 0.3s; min-width: 20px; }
.step__line.done { background: var(--accent); }

.send-card {
  background: var(--bg-card); border-radius: 18px;
  border: 1px solid var(--border); padding: 28px; max-width: 480px;
}
.send-card h2 { font-size: 18px; font-weight: 700; margin-bottom: 5px; }
.step-desc { color: var(--text-secondary); font-size: 13px; margin-bottom: 22px; }
.step-desc.timer { color: var(--accent-amber); }

.currency-row { display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: end; margin-bottom: 4px; }
.currency-arrow { font-size: 18px; color: var(--text-secondary); padding-bottom: 12px; text-align: center; }

.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 500; }
.field select {
  width: 100%; padding: 11px 14px; background: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 10px;
  color: var(--text-primary); font-size: 14px; font-family: 'Sora', sans-serif; outline: none;
}

.quote-box { background: var(--bg-elevated); border-radius: 10px; padding: 14px; margin-bottom: 18px; }
.quote-row { display: flex; justify-content: space-between; padding: 7px 0; }
.quote-row:not(:last-child) { border-bottom: 1px solid var(--border); }
.quote-row span:first-child { color: var(--text-secondary); font-size: 13px; }
.quote-row span:last-child  { font-size: 13px; }
.quote-row--total span:first-child { font-weight: 600; font-size: 14px; color: var(--text-primary); }
.accent { color: var(--accent) !important; font-weight: 700 !important; }

.confirm-rows { background: var(--bg-elevated); border-radius: 10px; margin-bottom: 20px; overflow: hidden; }
.confirm-row  { display: flex; justify-content: space-between; padding: 11px 14px; border-bottom: 1px solid var(--border); }
.confirm-row.last { border-bottom: none; }
.confirm-row span:first-child { color: var(--text-secondary); font-size: 13px; }
.confirm-row span:last-child  { font-size: 13px; font-weight: 500; }

.done-state { text-align: center; padding: 16px 0; }
.done-icon {
  width: 60px; height: 60px; border-radius: 50%; background: var(--accent);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px; font-size: 24px; color: #000; font-weight: 700;
}
.done-state h2 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
.done-state p  { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
.done-ref { background: var(--bg-elevated); padding: 10px 14px; border-radius: 8px; margin-bottom: 20px; color: var(--accent); font-size: 13px; }

.btn-back {
  width: 100%; margin-top: 8px; padding: 11px; background: transparent;
  border: none; color: var(--text-secondary); font-size: 13px;
  cursor: pointer; font-family: 'Sora', sans-serif;
}

/* ── Modal ───────────────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: flex-end; justify-content: center;
  z-index: 1000; backdrop-filter: blur(2px);
  animation: overlay-in 0.2s ease;
}
@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }

.modal {
  background: var(--bg-card);
  border-radius: 24px 24px 0 0;
  width: 100%; max-width: 480px;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  animation: sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
}
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }

.modal__header {
  display: flex; align-items: center; gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
}
.modal__icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: rgba(232,93,4,0.12); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.modal__title    { font-size: 16px; font-weight: 700; }
.modal__subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.modal__close {
  margin-left: auto; width: 32px; height: 32px; border-radius: 99px;
  border: none; background: var(--bg-elevated); color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 13px; flex-shrink: 0;
}

.modal__body {
  padding: 20px;
  display: flex; flex-direction: column; gap: 16px;
}

.modal__error {
  font-size: 13px; color: var(--danger);
  background: var(--danger-bg);
  border-radius: 10px; padding: 10px 12px;
}

/* Transfer summary inside modal */
.pin-summary {
  background: var(--bg-elevated);
  border-radius: 12px; overflow: hidden;
}
.pin-summary__row {
  display: flex; justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.pin-summary__row:last-child { border-bottom: none; }
.pin-summary__row span:first-child { color: var(--text-secondary); }
.pin-summary__value { font-weight: 600; }
.pin-summary__row--accent .pin-summary__value { color: var(--accent); }

/* PIN digit boxes */
.pin-input-group {
  display: flex; gap: 12px; justify-content: center;
}
.pin-box {
  width: 56px; height: 64px;
  border-radius: 14px;
  border: 1.5px solid var(--border);
  background: var(--bg-elevated);
  text-align: center;
  font-size: 24px; font-weight: 700;
  color: var(--text-primary);
  font-family: monospace;
  outline: none;
  transition: border-color 0.15s, transform 0.1s;
  -webkit-appearance: none;
  -webkit-text-security: disc;
}
.pin-box:focus {
  border-color: var(--accent);
  transform: scale(1.05);
  background: var(--bg-card);
}

/* Modal button */
.modal__btn {
  width: 100%; height: 52px; border-radius: 14px; border: none;
  font-size: 15px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  gap: 8px; font-family: inherit;
  transition: opacity 0.15s;
}
.modal__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.modal__btn--primary { background: var(--accent); color: var(--text-inverse); }
.modal__btn--primary:active:not(:disabled) { opacity: 0.88; }
</style>
