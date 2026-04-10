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
                <option v-for="c in Object.keys(currencyMap)" :key="c">{{ c }}</option>
              </select>
            </div>
            <div class="currency-arrow">→</div>
            <div class="field">
              <label>To</label>
              <select v-model="quoteForm.to_currency" @change="syncCountry">
                <option v-for="c in Object.keys(currencyMap)" :key="c">{{ c }}</option>
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
            <div class="quote-row" v-if="rateLock">
              <span>Rate locked</span>
              <span class="mono">{{ countdown }}s remaining</span>
            </div>
          </div>

          <UError v-if="error" :message="error" />
          <UButton :loading="loading" @click="handleQuote">
            {{ quote ? 'Continue' : 'Get Quote' }}
          </UButton>
        </template>

        <template v-else-if="currentStep === 'Recipient'">
          <h2>Who are you sending to?</h2>
          <p v-if="rateLock" class="step-desc timer">
            Rate locked · expires in {{ countdown }}s
          </p>
          <UField label="Full Name" v-model="recipientForm.full_name" placeholder="John Doe" />
          <div class="field">
            <label>Mobile Network ({{ recipientForm.country_code }})</label>
            <select v-model="recipientForm.mobile_network">
              <option value="">Select Network</option>
              <option v-for="n in availableNetworks" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <UField label="Mobile Number" type="tel" v-model="recipientForm.mobile_number" placeholder="Enter number" />
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
          <UButton :loading="loading" @click="handleSend">Confirm & Send</UButton>
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
  </AppLayout>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import UField from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError from '@/components/ui/UError.vue'
import client from '@/api/client'

const steps = ['Quote', 'Recipient', 'Confirm', 'Done']
const currentStep = ref('Quote')
const stepIndex = computed(() => steps.indexOf(currentStep.value))

const currencyMap = {
  'MWK': { code: 'MWI', networks: ['Airtel', 'TNM'] },
  'ZAR': { code: 'ZAF', networks: ['MTN', 'Vodacom', 'Telkom'] },
  'TZS': { code: 'TZA', networks: ['Airtel', 'Vodacom', 'Tigo', 'Halotel'] },
  'KES': { code: 'KEN', networks: ['Safaricom', 'Airtel'] },
  'ZMW': { code: 'ZMB', networks: ['Airtel', 'MTN', 'Zamtel'] },
  'NGN': { code: 'NGA', networks: ['MTN', 'Airtel', 'Glo'] },
  'BWP': { code: 'BWA', networks: ['Orange', 'Mascom'] }
}

const quoteForm = ref({ from_currency: 'MWK', to_currency: 'ZAR', send_amount: '' })
const recipientForm = ref({
  full_name: '',
  country_code: 'ZAF',
  payment_method: 'mobile_money',
  mobile_network: '',
  mobile_number: ''
})

const quote = ref(null)
const rateLock = ref(null)
const transaction = ref(null)
const error = ref('')
const loading = ref(false)
const countdown = ref(0)
let timer = null

const availableNetworks = computed(() => {
  return currencyMap[quoteForm.value.to_currency]?.networks || []
})

const confirmRows = computed(() => [
  ['You send', `${Number(quoteForm.value.send_amount).toLocaleString()} ${quoteForm.value.from_currency}`],
  ['Fee', `${quote.value?.fee_amount} ${quoteForm.value.from_currency}`],
  ['Rate', `1 ${quoteForm.value.from_currency} = ${quote.value?.exchange_rate} ${quoteForm.value.to_currency}`],
  ['Recipient gets', `${quote.value?.receive_amount} ${quoteForm.value.to_currency}`],
  ['To', recipientForm.value.full_name],
  ['Via', recipientForm.value.mobile_network],
])

function syncCountry() {
  const data = currencyMap[quoteForm.value.to_currency]
  if (data) {
    recipientForm.value.country_code = data.code
    recipientForm.value.mobile_network = '' 
  }
}

const handleQuote = async () => {
  if (quote.value) {
    currentStep.value = 'Recipient'
    return
  }
  if (!quoteForm.value.send_amount || quoteForm.value.send_amount <= 0) {
    error.value = 'Please enter a valid amount'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const { data } = await client.post('/rate-locks', quoteForm.value)
    rateLock.value = data.rate_lock
    quote.value = {
      exchange_rate: data.rate_lock.locked_rate,
      fee_amount: data.rate_lock.fee_amount,
      receive_amount: data.rate_lock.receive_amount
    }
    if (data.rate_lock.expires_at) startCountdown(data.rate_lock.expires_at)
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to get quote'
  } finally {
    loading.value = false
  }
}

const handleSend = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data } = await client.post('/transactions', {
      rate_lock_id: rateLock.value?.id,
      recipient_data: recipientForm.value,
      amount: quoteForm.value.send_amount
    })
    transaction.value = data
    currentStep.value = 'Done'
  } catch (err) {
    error.value = err.response?.data?.message || 'Transaction failed'
  } finally {
    loading.value = false
  }
}

const startCountdown = (expiresAt) => {
  const expiry = new Date(expiresAt).getTime()
  timer = setInterval(() => {
    const distance = expiry - new Date().getTime()
    if (distance <= 0) {
      clearInterval(timer)
      reset()
    } else {
      countdown.value = Math.floor(distance / 1000)
    }
  }, 1000)
}

const reset = () => {
  quote.value = rateLock.value = transaction.value = null
  quoteForm.value.send_amount = ''
  currentStep.value = 'Quote'
  if (timer) clearInterval(timer)
}

onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.send-page { max-width: 600px; margin: 0 auto; padding: 20px; }
.send-header { text-align: center; margin-bottom: 30px; }
.steps { display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; position: relative; }
.step { display: flex; align-items: center; gap: 8px; z-index: 1; background: var(--bg-body); padding: 0 4px; }
.step__dot { width: 32px; height: 32px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; }
.step.active .step__dot { background: var(--accent); color: white; }
.step.done .step__dot { background: var(--accent); color: white; }
.step__line { flex: 1; height: 2px; background: #eee; margin: 0 -15px; }
.step__line.done { background: var(--accent); }
.send-card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
.currency-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 15px; margin-bottom: 20px; }
.currency-arrow { font-size: 20px; color: #999; padding-top: 20px; }
.quote-box { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; }
.quote-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
.quote-row--total { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-weight: bold; font-size: 16px; }
.accent { color: var(--accent); }
.mono { font-family: monospace; }
.btn-back { display: block; width: 100%; margin-top: 15px; background: none; border: none; color: #64748b; cursor: pointer; }
</style>
