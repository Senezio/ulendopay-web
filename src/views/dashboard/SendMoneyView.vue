<template>
  <AppLayout>
    <div class="send-page">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="send-header fade-up">
        <h1>Send Money</h1>
        <p>Fast, secure transfers across Africa</p>
      </div>

      <!-- ── Step Indicator ─────────────────────────────────────────── -->
      <div class="steps fade-up-1">
        <template v-for="(s, i) in steps" :key="s">
          <div class="step" :class="{ active: currentStep === s, done: stepIndex > i }">
            <div class="step__dot">
              <i v-if="stepIndex > i" class="fa-sharp-duotone fa-solid fa-check"></i>
              <span v-else>{{ i + 1 }}</span>
            </div>
            <span class="step__label">{{ s }}</span>
          </div>
          <div v-if="i < steps.length - 1" class="step__line" :class="{ done: stepIndex > i }"></div>
        </template>
      </div>

      <!-- ── Card ───────────────────────────────────────────────────── -->
      <div class="send-card fade-up-2">

        <!-- STEP 1: Quote -->
        <template v-if="currentStep === 'Quote'">
          <div class="card-header">
            <div class="card-header__icon">
              <i class="fa-sharp-duotone fa-solid fa-money-bill-transfer"></i>
            </div>
            <div>
              <h2>How much to send?</h2>
              <p class="step-desc">Get a live rate from official sources</p>
            </div>
          </div>

          <div class="currency-row">
            <div class="field" :class="{ 'field--error': formErrors.from_currency }">
              <label>From</label>
              <select v-model="quoteForm.from_currency" @change="onCurrencyChange">
                <option v-for="c in sendCurrencies" :key="c" :value="c">{{ c }}</option>
              </select>
              <span v-if="formErrors.from_currency" class="field__error">{{ formErrors.from_currency }}</span>
            </div>
            <div class="currency-arrow">
              <i class="fa-sharp-duotone fa-solid fa-arrow-right"></i>
            </div>
            <div class="field" :class="{ 'field--error': formErrors.to_currency }">
              <label>To</label>
              <select v-model="quoteForm.to_currency" @change="onCurrencyChange">
                <option v-for="c in receiveCurrencies" :key="c" :value="c">{{ c }}</option>
              </select>
              <span v-if="formErrors.to_currency" class="field__error">{{ formErrors.to_currency }}</span>
            </div>
          </div>

          <div class="field" :class="{ 'field--error': formErrors.send_amount }">
            <label>Amount</label>
            <div class="amount-input-wrap">
              <span class="amount-currency">{{ quoteForm.from_currency }}</span>
              <input
                v-model="quoteForm.send_amount"
                type="number"
                inputmode="decimal"
                placeholder="0.00"
                min="1"
                class="amount-input"
                @input="quote = null"
              />
            </div>
            <span v-if="formErrors.send_amount" class="field__error">{{ formErrors.send_amount }}</span>
          </div>

          <transition name="fade">
            <div v-if="quote" class="quote-box">
              <div v-if="quoteForm.from_currency !== quoteForm.to_currency" class="quote-row">
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
          </transition>

          <UError v-if="error" :message="error" />
          <UButton :loading="loading" @click="handleQuote">
            {{ quote ? 'Lock Rate & Continue' : 'Get Quote' }}
          </UButton>
        </template>

        <!-- STEP 2: Recipient -->
        <template v-else-if="currentStep === 'Recipient'">
          <div class="card-header">
            <div class="card-header__icon">
              <i class="fa-sharp-duotone fa-solid fa-user"></i>
            </div>
            <div>
              <h2>Who are you sending to?</h2>
              <p v-if="rateLock" class="step-desc" :class="countdown <= 60 ? 'timer--urgent' : 'timer'">
                <i class="fa-sharp-duotone fa-solid fa-clock"></i>
                Rate locked · expires in {{ formatCountdown(countdown) }}
              </p>
              <p v-else class="step-desc">Enter recipient details</p>
            </div>
          </div>

          <!-- Saved recipients -->
          <div v-if="savedRecipients.length" class="saved-recipients">
            <div class="saved-label">Saved Recipients</div>
            <div class="saved-list">
              <div
                v-for="r in savedRecipients"
                :key="r.id"
                class="saved-row"
                :class="{ 'saved-row--active': selectedSavedId === r.id }"
                @click="selectSaved(r)"
              >
                <div class="saved-avatar">{{ r.full_name?.charAt(0) }}</div>
                <div class="saved-info">
                  <div class="saved-name">{{ r.full_name }}</div>
                  <div class="saved-meta">{{ r.mobile_number }} &middot; {{ r.mobile_network }}</div>
                </div>
                <i v-if="selectedSavedId === r.id" class="fa-sharp-duotone fa-solid fa-circle-check saved-check"></i>
              </div>
            </div>
          </div>

          <div class="field" :class="{ 'field--error': formErrors.full_name }">
            <label>Full Name</label>
            <input v-model="recipientForm.full_name" type="text" placeholder="John Doe" />
            <span v-if="formErrors.full_name" class="field__error">{{ formErrors.full_name }}</span>
          </div>

          <div class="field" :class="{ 'field--error': formErrors.phone }">
            <label>Phone</label>
            <div class="phone-lookup-wrap">
              <input v-model="recipientForm.phone" type="tel" placeholder="+265 88 123 4567" />
              <div v-if="lookupLoading" class="lookup-status lookup-status--loading">
                <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              </div>
            </div>
            <span v-if="formErrors.phone" class="field__error">{{ formErrors.phone }}</span>
            <!-- Platform user found -->
            <div v-if="recipientLookup" class="lookup-badge lookup-badge--found">
              <i class="fa-sharp-duotone fa-solid fa-circle-check"></i>
              <span>
                <strong>{{ recipientLookup.name }}</strong> is on UlendoPay
                <span v-if="recipientLookup.kyc_verified" class="lookup-verified">· Verified</span>
              </span>
            </div>
            <!-- Not on platform — soft notice, not an error -->
            <div v-else-if="lookupError === 'not_found' && !lookupLoading" class="lookup-badge lookup-badge--unknown">
              <i class="fa-sharp-duotone fa-solid fa-circle-info"></i>
              Not on UlendoPay — double-check number before sending
            </div>
          </div>

          <div class="field" :class="{ 'field--error': formErrors.mobile_network }">
            <label>
              Mobile Network
              <span v-if="recipientForm.mobile_network" class="auto-detected">
                <i class="fa-sharp-duotone fa-solid fa-wand-magic-sparkles"></i> Auto-detected
              </span>
            </label>
            <select v-model="recipientForm.mobile_network">
              <option value="" disabled>Select network</option>
              <option v-for="n in availableNetworks" :key="n" :value="n">{{ n }}</option>
            </select>
            <span v-if="formErrors.mobile_network" class="field__error">{{ formErrors.mobile_network }}</span>
          </div>

          <div class="field" :class="{ 'field--error': formErrors.mobile_number }">
            <label>Mobile Money Number</label>
            <input v-model="recipientForm.mobile_number" type="tel" placeholder="+255 XXX XXX XXX" />
            <span v-if="formErrors.mobile_number" class="field__error">{{ formErrors.mobile_number }}</span>
          </div>

          <div v-if="!selectedSavedId" class="save-toggle">
            <label class="save-toggle__label">
              <input type="checkbox" v-model="saveRecipient" class="save-toggle__check" />
              <span>Save recipient for future transfers</span>
            </label>
          </div>

          <UError v-if="error" :message="error" />
          <UButton :loading="loading" @click="goToConfirm">Continue</UButton>
          <button class="btn-back" @click="currentStep = 'Quote'">
            <i class="fa-sharp-duotone fa-solid fa-arrow-left"></i> Back
          </button>
        </template>

        <!-- STEP 3: Confirm -->
        <template v-else-if="currentStep === 'Confirm'">
          <div class="card-header">
            <div class="card-header__icon">
              <i class="fa-sharp-duotone fa-solid fa-circle-check"></i>
            </div>
            <div>
              <h2>Confirm Transfer</h2>
              <p class="step-desc">Review before sending</p>
            </div>
          </div>

          <div class="confirm-rows">
            <div
              v-for="([k, v], i) in confirmRows"
              :key="k"
              class="confirm-row"
              :class="{ last: i === confirmRows.length - 1 }"
            >
              <span>{{ k }}</span>
              <span :class="{ mono: true, accent: k === 'Recipient gets' }">{{ v }}</span>
            </div>
          </div>

          <UError v-if="error" :message="error" />
          <UButton :loading="loading" @click="openPinModal">
            <i class="fa-sharp-duotone fa-solid fa-lock"></i> Confirm & Send
          </UButton>
          <button class="btn-back" @click="currentStep = 'Recipient'">
            <i class="fa-sharp-duotone fa-solid fa-arrow-left"></i> Back
          </button>
        </template>

        <!-- STEP 4: Done -->
        <template v-else>
          <div class="done-state">
            <div class="done-icon">
              <i class="fa-sharp-duotone fa-solid fa-check"></i>
            </div>
            <h2>Transfer Initiated!</h2>
            <p>Your transfer is being processed</p>
            <div class="done-ref mono">{{ transaction?.reference }}</div>
            <UButton @click="reset">Send Another</UButton>
          </div>
        </template>

      </div>
    </div>

    <!-- ── PIN Modal ──────────────────────────────────────────────────── -->
    <Teleport to="body">
      <transition name="overlay">
        <div v-if="pinModal.open" class="modal-overlay" @click.self="closePinModal">
          <transition name="sheet">
            <div class="modal" role="dialog" aria-modal="true">

              <div class="modal__header">
                <div class="modal__icon">
                  <i class="fa-sharp-duotone fa-solid fa-lock"></i>
                </div>
                <div>
                  <div class="modal__title">Confirm with PIN</div>
                  <div class="modal__subtitle">Enter your 4-digit PIN to authorise this transfer</div>
                </div>
                <button class="modal__close" @click="closePinModal" aria-label="Close">
                  <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
                </button>
              </div>

              <div class="modal__body">
                <!-- Transfer summary -->
                <div class="pin-summary">
                  <div class="pin-summary__row">
                    <span>Sending</span>
                    <span class="pin-summary__value">
                      {{ Number(quoteForm.send_amount).toLocaleString() }} {{ quoteForm.from_currency }}
                    </span>
                  </div>
                  <div class="pin-summary__row">
                    <span>To</span>
                    <span class="pin-summary__value">{{ recipientForm.full_name }}</span>
                  </div>
                  <div class="pin-summary__row pin-summary__row--accent">
                    <span>They receive</span>
                    <span class="pin-summary__value accent">
                      {{ quote?.receive_amount }} {{ quoteForm.to_currency }}
                    </span>
                  </div>
                </div>

                <!-- PIN dots -->
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

                <transition name="fade">
                  <div v-if="pinModal.error" class="modal__error">
                    <i class="fa-sharp-duotone fa-solid fa-circle-exclamation"></i>
                    {{ pinModal.error }}
                  </div>
                </transition>

                <button
                  class="modal__btn modal__btn--primary"
                  :disabled="pinModal.loading || pinModal.digits.join('').length < 4"
                  @click="submitWithPin"
                >
                  <i v-if="pinModal.loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
                  <span v-else>
                    <i class="fa-sharp-duotone fa-solid fa-paper-plane"></i> Send Money
                  </span>
                </button>
              </div>

            </div>
          </transition>
        </div>
      </transition>
    </Teleport>

  </AppLayout>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import UField   from '@/components/ui/UField.vue'
import UButton  from '@/components/ui/UButton.vue'
import UError   from '@/components/ui/UError.vue'
import client   from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// ── Currency / network maps ─────────────────────────────────────────────────
const CURRENCY_LABELS = {
  XOF: 'XOF – West Africa',
  XAF: 'XAF – Central Africa',
  CDF: 'CDF – Congolese Franc',
  USD: 'USD – US Dollar',
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

const allCurrencies     = Object.keys(CURRENCY_LABELS)
const userCurrency      = computed(() => auth.user?.currency || 'MWK')
const sendCurrencies    = computed(() => [userCurrency.value, ...allCurrencies.filter(c => c !== userCurrency.value)])
const receiveCurrencies = computed(() => allCurrencies)
const availableNetworks = computed(() => NETWORKS_BY_CURRENCY[quoteForm.value.to_currency] ?? [])

// ── Steps ───────────────────────────────────────────────────────────────────
const steps       = ['Quote', 'Recipient', 'Confirm', 'Done']
const currentStep = ref('Quote')
const stepIndex   = computed(() => steps.indexOf(currentStep.value))

// ── Forms ───────────────────────────────────────────────────────────────────
const quoteForm = ref({
  from_currency: userCurrency.value,
  to_currency:   '',
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

// ── State ───────────────────────────────────────────────────────────────────
const quote       = ref(null)
const rateLock    = ref(null)
const transaction = ref(null)
const error       = ref('')
const loading     = ref(false)
const countdown   = ref(0)
const formErrors  = ref({})

// Recipient lookup state
const recipientLookup = ref(null)  // { name, kyc_verified, country_code } | null
const lookupLoading   = ref(false)
const lookupError     = ref('')    // 'not_found' | 'error' | ''

// Saved recipients
const savedRecipients  = ref([])
const saveRecipient    = ref(false)
const selectedSavedId  = ref(null)

async function fetchSavedRecipients() {
  try {
    const { data } = await client.get('/recipients')
    savedRecipients.value = data.data || []
  } catch (e) {
    console.error('Could not load saved recipients', e)
  }
}

let timer       = null
let lookupTimer = null

// ── Reset network when to_currency changes ──────────────────────────────────
watch(() => quoteForm.value.to_currency, () => {
  recipientForm.value.mobile_network = ''
  quote.value = null
})

// ── Debounced phone watcher — user lookup + PawaPay network prediction ────────
// Single debounce handles both calls in parallel once phone is long enough.
// No prefix map — PawaPay accounts for MNP and is the authoritative source.
watch(() => recipientForm.value.phone, (phone) => {
  clearTimeout(lookupTimer)
  recipientLookup.value = null
  lookupError.value     = ''

  const normalized = (phone || '').replace(/[\s\-()]/g, '')
  if (normalized.length < 10) return

  lookupTimer = setTimeout(async () => {
    lookupLoading.value = true
    try {
      // Run user lookup and network prediction in parallel
      const [userRes, networkRes] = await Promise.allSettled([
        client.get('/users/lookup', { params: { phone } }),
        client.post('/recipients/predict-network', { phone }),
      ])

      // Handle user lookup
      if (userRes.status === 'fulfilled' && userRes.value.data.found) {
        recipientLookup.value = userRes.value.data.user
        lookupError.value     = ''
      } else if (userRes.status === 'rejected' && userRes.reason?.response?.status === 404) {
        lookupError.value = 'not_found'
      }

      // Handle network prediction — only apply if valid for selected currency
      if (networkRes.status === 'fulfilled' && networkRes.value.data.found) {
        const operator = networkRes.value.data.operator
        if (operator && availableNetworks.value.includes(operator)) {
          recipientForm.value.mobile_network = operator
        }
      }
      // If network prediction fails silently — user selects manually, no error shown

    } finally {
      lookupLoading.value = false
    }
  }, 600)
})

// ── Countdown formatter ─────────────────────────────────────────────────────
function formatCountdown(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

// ── Confirm summary rows ────────────────────────────────────────────────────
const isSameCurrency = computed(() => quoteForm.value.from_currency === quoteForm.value.to_currency)
const confirmRows = computed(() => [
  ['You send',       `${Number(quoteForm.value.send_amount).toLocaleString()} ${quoteForm.value.from_currency}`],
  ['Fee',            `${quote.value?.fee_amount} ${quoteForm.value.from_currency}`],
  ...(!isSameCurrency.value ? [['Rate', `1 ${quoteForm.value.from_currency} = ${quote.value?.exchange_rate} ${quoteForm.value.to_currency}`]] : []),
  ['Recipient gets', `${quote.value?.receive_amount} ${quoteForm.value.to_currency}`],
  ['To',             recipientForm.value.full_name],
  ['Via',            recipientForm.value.mobile_network],
])

// ── Currency change handler ─────────────────────────────────────────────────
function onCurrencyChange() {
  quote.value = null
  formErrors.value = {}
}

// ── Validation ──────────────────────────────────────────────────────────────
function validateQuote() {
  const errs = {}
  if (!quoteForm.value.from_currency) errs.from_currency = 'Select a currency'
  if (!quoteForm.value.to_currency)   errs.to_currency   = 'Select a currency'
  // Note: same currency IS allowed (domestic transfers)
  const amt = Number(quoteForm.value.send_amount)
  if (!quoteForm.value.send_amount || isNaN(amt) || amt <= 0) {
    errs.send_amount = 'Enter a valid amount greater than 0'
  }
  formErrors.value = errs
  return Object.keys(errs).length === 0
}

function validateRecipient() {
  const errs = {}
  const phoneRegex = /^\+?[0-9\s\-]{7,15}$/

  if (!recipientForm.value.full_name.trim())
    errs.full_name = 'Full name is required'

  if (!recipientForm.value.phone.trim())
    errs.phone = 'Phone number is required'
  else if (!phoneRegex.test(recipientForm.value.phone))
    errs.phone = 'Enter a valid phone number (e.g. +255 712 345 678)'

  if (!recipientForm.value.mobile_network)
    errs.mobile_network = 'Select a mobile network'

  if (!recipientForm.value.mobile_number.trim())
    errs.mobile_number = 'Mobile money number is required'
  else if (!phoneRegex.test(recipientForm.value.mobile_number))
    errs.mobile_number = 'Enter a valid mobile money number'

  formErrors.value = errs
  return Object.keys(errs).length === 0
}

// ── Handlers ────────────────────────────────────────────────────────────────
async function handleQuote() {
  if (!validateQuote()) return
  if (quote.value) { currentStep.value = 'Recipient'; return }

  error.value   = ''
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
    startTimer()
    currentStep.value = 'Recipient'
    fetchSavedRecipients()
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not get quote'
  } finally {
    loading.value = false
  }
}

function goToConfirm() {
  if (!validateRecipient()) return
  error.value = ''
  currentStep.value = 'Confirm'
}

async function handleSend() {
  error.value   = ''
  loading.value = true
  try {
    let recipientId = selectedSavedId.value

    if (!recipientId) {
      const { data: rd } = await client.post('/recipients', {
        ...recipientForm.value,
        is_active: saveRecipient.value,
      })
      recipientId = rd.recipient.id
    }

    const { data } = await client.post('/transactions', {
      idempotency_key: `send-${Date.now()}`,
      rate_lock_id:    rateLock.value.id,
      recipient_id:    recipientId,
      send_amount:     quoteForm.value.send_amount,
    })
    transaction.value = data.transaction
    currentStep.value = 'Done'
    stopTimer()
  } catch (err) {
    error.value = err.response?.data?.message || 'Transfer failed'
    closePinModal()
  } finally {
    loading.value = false
  }
}

function selectSaved(r) {
  selectedSavedId.value = r.id
  recipientForm.value = {
    full_name:      r.full_name,
    phone:          r.phone || '',
    country_code:   r.country_code || 'TZA',
    payment_method: r.payment_method || 'mobile_money',
    mobile_network: r.mobile_network || '',
    mobile_number:  r.mobile_number || '',
  }
  saveRecipient.value = false
}

function reset() {
  stopTimer()
  currentStep.value = 'Quote'
  quote.value = rateLock.value = transaction.value = null
  error.value = ''
  formErrors.value = {}
  recipientLookup.value = null
  lookupError.value     = ''
  lookupLoading.value   = false
  saveRecipient.value   = false
  selectedSavedId.value = null
  savedRecipients.value = []
  quoteForm.value = { from_currency: userCurrency.value, to_currency: '', send_amount: '' }
  recipientForm.value = {
    full_name: '', phone: '', country_code: 'TZA',
    payment_method: 'mobile_money', mobile_network: '', mobile_number: '',
  }
}

// ── Timer ───────────────────────────────────────────────────────────────────
function startTimer() {
  stopTimer()
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      stopTimer()
      // Rate lock expired — reset quote so user gets a fresh one
      quote.value = null
      rateLock.value = null
      error.value = 'Your rate lock expired. Please get a new quote.'
      currentStep.value = 'Quote'
    }
  }, 1000)
}

function stopTimer() {
  if (timer) { clearInterval(timer); timer = null }
  if (lookupTimer) { clearTimeout(lookupTimer); lookupTimer = null }
}

onUnmounted(stopTimer)

// ── PIN modal ────────────────────────────────────────────────────────────────
const pinRefs  = ref([])
const pinModal = ref({ open: false, digits: [], loading: false, error: '' })

function openPinModal() {
  pinModal.value = { open: true, digits: [], loading: false, error: '' }
  setTimeout(() => pinRefs.value[0]?.focus(), 100)
}

function closePinModal() {
  pinModal.value.open   = false
  pinModal.value.digits = []
  pinModal.value.error  = ''
}

function onPinInput(event, index) {
  const val = event.target.value.replace(/\D/g, '').slice(-1)
  pinModal.value.digits[index] = val
  event.target.value = val
  if (val && index < 3) pinRefs.value[index + 1]?.focus()
  if (pinModal.value.digits.join('').length === 4) submitWithPin()
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
    await client.post('/auth/verify-pin', { pin })
    await handleSend()
    closePinModal()
  } catch (err) {
    const errors = err.response?.data?.errors
    pinModal.value.error = errors?.pin?.[0] || err.response?.data?.message || 'Incorrect PIN.'
    pinModal.value.digits = []
    pinRefs.value.forEach(el => { if (el) el.value = '' })
    pinRefs.value[0]?.focus()
  } finally {
    pinModal.value.loading = false
  }
}
</script>

<style scoped>
/* ── Page ───────────────────────────────────────────────────────────── */
.send-header { margin-bottom: 24px; }
.send-header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
.send-header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

/* ── Steps ──────────────────────────────────────────────────────────── */
.steps {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  overflow: hidden;
  width: 100%;
}
.step {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.step__dot {
  width: 28px; height: 28px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  background: var(--bg-elevated);
  color: var(--text-muted);
  border: 2px solid var(--border);
  transition: all 0.3s;
  flex-shrink: 0;
}
.step.active .step__dot {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.step.done .step__dot {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.step__label { font-size: 11px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 52px; }
.step.active .step__label { color: var(--text-primary); font-weight: 600; }
.step.done   .step__label { color: var(--accent); }
.step__line {
  flex: 1;
  height: 2px;
  background: var(--border);
  margin: 0 8px;
  min-width: 8px;
  transition: background 0.3s;
}
.step__line.done { background: var(--accent); }

/* ── Card ───────────────────────────────────────────────────────────── */
.send-card {
  background: var(--bg-card);
  border-radius: 20px;
  border: 1px solid var(--border);
  padding: 16px;
  max-width: 100%;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 24px;
}
.card-header__icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: var(--accent-dim);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.card-header h2 { font-size: 18px; font-weight: 700; margin-bottom: 3px; }
.step-desc { color: var(--text-secondary); font-size: 13px; }
.timer      { color: var(--accent-amber); font-weight: 500; }
.timer--urgent { color: var(--danger); font-weight: 600; }

/* ── Fields ─────────────────────────────────────────────────────────── */
.field { margin-bottom: 16px; }
.field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.field input,
.field select {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.field input:focus,
.field select:focus { border-color: var(--accent); }
.field--error input,
.field--error select { border-color: var(--danger); }
.field__error {
  font-size: 12px;
  color: var(--danger);
  margin-top: 5px;
  display: block;
}

/* ── Amount input ────────────────────────────────────────────────────── */
.amount-input-wrap {
  display: flex;
  align-items: center;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.15s;
}
.amount-input-wrap:focus-within { border-color: var(--accent); }
.field--error .amount-input-wrap { border-color: var(--danger); }
.amount-currency {
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-dim);
  border-right: 1px solid var(--border);
  white-space: nowrap;
}
.amount-input {
  flex: 1;
  padding: 12px 14px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  outline: none;
}

/* ── Currency row ───────────────────────────────────────────────────── */
.currency-row {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: start;
  margin-bottom: 4px;
}
.currency-arrow {
  padding-top: 32px;
  color: var(--text-muted);
  font-size: 14px;
  text-align: center;
}

/* ── Quote box ──────────────────────────────────────────────────────── */
.quote-box {
  background: var(--bg-elevated);
  border-radius: 12px;
  padding: 4px 0;
  margin-bottom: 20px;
  border: 1px solid var(--border);
  overflow: hidden;
}
.quote-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
}
.quote-row:last-child { border-bottom: none; }
.quote-row span:first-child { color: var(--text-secondary); font-size: 13px; }
.quote-row span:last-child  { font-size: 13px; font-weight: 500; }
.quote-row--total { background: var(--accent-dim); }
.quote-row--total span:first-child { font-weight: 700; color: var(--text-primary); font-size: 14px; }
.accent { color: var(--accent) !important; font-weight: 700 !important; }

/* ── Confirm rows ───────────────────────────────────────────────────── */
.confirm-rows {
  background: var(--bg-elevated);
  border-radius: 12px;
  margin-bottom: 20px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}
.confirm-row.last { border-bottom: none; }
.confirm-row span:first-child { color: var(--text-secondary); font-size: 13px; }
.confirm-row span:last-child  { font-size: 13px; font-weight: 600; }

/* ── Done state ─────────────────────────────────────────────────────── */
.done-state { text-align: center; padding: 20px 0; }
.done-icon {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: var(--accent);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
  font-size: 26px; color: #fff;
  box-shadow: 0 8px 24px rgba(232, 93, 4, 0.3);
}
.done-state h2 { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
.done-state p  { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
.done-ref {
  background: var(--bg-elevated);
  padding: 10px 14px;
  border-radius: 10px;
  margin-bottom: 24px;
  color: var(--accent);
  font-size: 13px;
}

/* ── Phone lookup ───────────────────────────────────────────────────── */
.phone-lookup-wrap {
  position: relative;
}
.phone-lookup-wrap input {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.phone-lookup-wrap input:focus { border-color: var(--accent); }
.field--error .phone-lookup-wrap input { border-color: var(--danger); }

.lookup-status {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 14px;
}

.lookup-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
}
.lookup-badge--found {
  background: var(--success-bg);
  color: var(--success);
}
.lookup-badge--unknown {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}
.lookup-verified {
  color: var(--success);
  font-weight: 600;
}

/* ── Auto-detected label ────────────────────────────────────────────── */
.auto-detected {
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  margin-left: 8px;
  text-transform: none;
  letter-spacing: 0;
}

/* ── Back button ────────────────────────────────────────────────────── */
/* Saved recipients */
.saved-recipients { margin-bottom: 20px; }
.saved-label {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.06em; color: var(--text-secondary); margin-bottom: 10px;
}
.saved-list {
  display: flex; flex-direction: column;
  max-height: 220px; overflow-y: auto;
  border: 1px solid var(--border); border-radius: 14px;
  background: var(--bg-elevated);
  scrollbar-width: none;
}
.saved-list::-webkit-scrollbar { display: none; }
.saved-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}
.saved-row:last-child { border-bottom: none; }
.saved-row:hover { background: var(--bg-card); }
.saved-row--active { background: var(--accent-dim); }
.saved-avatar {
  width: 38px; height: 38px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700;
}
.saved-info { flex: 1; min-width: 0; }
.saved-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.saved-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.saved-check { color: var(--accent); font-size: 16px; flex-shrink: 0; }

/* Save toggle */
.save-toggle { margin-bottom: 16px; }
.save-toggle__label {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: var(--text-secondary); cursor: pointer;
}
.save-toggle__check { accent-color: var(--accent); width: 16px; height: 16px; cursor: pointer; }

.btn-back {
  width: 100%;
  margin-top: 10px;
  padding: 11px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: color 0.15s;
}
.btn-back:hover { color: var(--text-primary); }

/* ── Transitions ────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.sheet-enter-active { transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active { transition: transform 0.2s ease-in; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }

/* ── Modal overlay ──────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;    /* bottom sheet on mobile */
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.modal {
  background: var(--bg-card);
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 480px;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  box-sizing: border-box;
  overflow: hidden;
}

/* Desktop: centered modal instead of bottom sheet */
@media (min-width: 1024px) {
  .modal-overlay {
    align-items: center;
  }
  .modal {
    border-radius: 20px;
    max-width: 440px;
    padding-bottom: 0;
  }
  /* Desktop sheet animation: scale instead of slide */
  .sheet-enter-from,
  .sheet-leave-to {
    transform: scale(0.95);
    opacity: 0;
  }
  .sheet-enter-active,
  .sheet-leave-active {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.modal__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
}
.modal__icon {
  width: 42px; height: 42px;
  border-radius: 12px;
  background: var(--accent-dim);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.modal__title    { font-size: 16px; font-weight: 700; }
.modal__subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.modal__close {
  margin-left: auto;
  width: 32px; height: 32px;
  border-radius: 99px;
  border: none;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  font-size: 13px;
  flex-shrink: 0;
  transition: background 0.15s;
}
.modal__close:hover { background: var(--border); }

.modal__body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal__error {
  font-size: 13px;
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── PIN summary ────────────────────────────────────────────────────── */
.pin-summary {
  background: var(--bg-elevated);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border);
}
.pin-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}
.pin-summary__row:last-child { border-bottom: none; }
.pin-summary__row span:first-child { color: var(--text-secondary); }
.pin-summary__value { font-weight: 600; }
.pin-summary__row--accent .pin-summary__value { color: var(--accent); }

/* ── PIN boxes ──────────────────────────────────────────────────────── */
.pin-input-group {
  display: flex;
  gap: 8px;
  justify-content: center;
  width: 100%;
}
.pin-box {
  width: 56px; height: 62px;
  border-radius: 14px;
  border: 1.5px solid var(--border);
  background: var(--bg-elevated);
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
  font-family: monospace;
  outline: none;
  transition: border-color 0.15s, transform 0.1s, box-shadow 0.15s;
  -webkit-text-security: disc;
}
.pin-box:focus {
  border-color: var(--accent);
  transform: scale(1.06);
  background: var(--bg-card);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

/* ── Modal button ───────────────────────────────────────────────────── */
.modal__btn {
  width: 100%;
  height: 52px;
  border-radius: 14px;
  border: none;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  transition: opacity 0.15s, transform 0.1s;
}
.modal__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.modal__btn--primary { background: var(--accent); color: #fff; }
.modal__btn--primary:active:not(:disabled) {
  opacity: 0.88;
  transform: scale(0.98);
}
</style>
~ $