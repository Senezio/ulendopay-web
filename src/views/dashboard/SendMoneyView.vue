<template>
  <AppLayout>
    <div class="send-page">
      <div class="send-header fade-up">
        <h1>Send Money</h1>
        <p>Fast, secure transfers across Africa</p>
      </div>

      <!-- Progress Steps -->
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

        <!-- Step 1: Quote -->
        <template v-if="currentStep === 'Quote'">
          <h2>How much to send?</h2>
          <p class="step-desc">Get a live rate from official sources</p>

          <div class="currency-row">
            <div class="field">
              <label>From</label>
              <select v-model="quoteForm.from_currency">
                <option v-for="c in currencies" :key="c">{{ c }}</option>
              </select>
            </div>
            <div class="currency-arrow">→</div>
            <div class="field">
              <label>To</label>
              <select v-model="quoteForm.to_currency">
                <option v-for="c in currencies" :key="c">{{ c }}</option>
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

        <!-- Step 2: Recipient -->
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
              <option v-for="n in networks" :key="n">{{ n }}</option>
            </select>
          </div>
          <UField label="Mobile Number" type="tel" v-model="recipientForm.mobile_number" placeholder="+255 XXX XXX XXX" />
          <UError v-if="error" :message="error" />
          <UButton :loading="loading" @click="currentStep = 'Confirm'">Continue</UButton>
          <button class="btn-back" @click="currentStep = 'Quote'">← Back</button>
        </template>

        <!-- Step 3: Confirm -->
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
          <UButton :loading="loading" @click="handleSend">Confirm & Send</UButton>
          <button class="btn-back" @click="currentStep = 'Recipient'">← Back</button>
        </template>

        <!-- Step 4: Done -->
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
  </AppLayout>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'
import client from '@/api/client'

const steps       = ['Quote', 'Recipient', 'Confirm', 'Done']
const currentStep = ref('Quote')
const stepIndex   = computed(() => steps.indexOf(currentStep.value))

const currencies = ['MWK','KES','TZS','ZMW','ZAR','MZN','BWP','NGN','GHS','ZWG']
const networks   = ['Airtel','TNM','M-Pesa','MTN','Vodacom','Zamtel','Tigo']

const quoteForm = ref({ from_currency: 'MWK', to_currency: 'TZS', send_amount: '' })
const recipientForm = ref({ full_name: '', phone: '', country_code: 'TZA', payment_method: 'mobile_money', mobile_network: '', mobile_number: '' })

const quote       = ref(null)
const rateLock    = ref(null)
const transaction = ref(null)
const error       = ref('')
const loading     = ref(false)
const countdown   = ref(0)
let timer = null

const confirmRows = computed(() => [
  ['You send',      `${Number(quoteForm.value.send_amount).toLocaleString()} ${quoteForm.value.from_currency}`],
  ['Fee',           `${quote.value?.fee_amount} ${quoteForm.value.from_currency}`],
  ['Rate',          `1 ${quoteForm.value.from_currency} = ${quote.value?.exchange_rate} ${quoteForm.value.to_currency}`],
  ['Recipient gets',`${quote.value?.receive_amount} ${quoteForm.value.to_currency}`],
  ['To',            recipientForm.value.full_name],
  ['Via',           recipientForm.value.mobile_network],
])

async function handleQuote() {
  error.value = ''
  loading.value = true
  try {
    const { data: q } = await client.post('/rates/quote', quoteForm.value)
    quote.value = q.quote
    const { data: rl } = await client.post('/rate-locks', quoteForm.value)
    rateLock.value = rl.rate_lock
    countdown.value = rl.rate_lock.expires_in_seconds
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
    const { data } = await client.post('/transactions', {
      idempotency_key: `send-${Date.now()}`,
      rate_lock_id:    rateLock.value.id,
      recipient_id:    rd.recipient.id,
      send_amount:     quoteForm.value.send_amount,
    })
    transaction.value = data.transaction
    currentStep.value = 'Done'
    clearInterval(timer)
  } catch (err) {
    error.value = err.response?.data?.message || 'Transfer failed'
  } finally { loading.value = false }
}

function reset() {
  currentStep.value = 'Quote'
  quote.value = rateLock.value = transaction.value = null
  error.value = ''
  quoteForm.value = { from_currency: 'MWK', to_currency: 'TZS', send_amount: '' }
  recipientForm.value = { full_name: '', phone: '', country_code: 'TZA', payment_method: 'mobile_money', mobile_network: '', mobile_number: '' }
}

onUnmounted(() => clearInterval(timer))
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
  animation: pulse-green 2s infinite;
}
.done-state h2 { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
.done-state p  { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
.done-ref { background: var(--bg-elevated); padding: 10px 14px; border-radius: 8px; margin-bottom: 20px; color: var(--accent); font-size: 13px; }

.btn-back {
  width: 100%; margin-top: 8px; padding: 11px; background: transparent;
  border: none; color: var(--text-secondary); font-size: 13px;
  cursor: pointer; font-family: 'Sora', sans-serif;
}
</style>
