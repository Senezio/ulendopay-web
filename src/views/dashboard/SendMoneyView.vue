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
            <span class="step__label">{{ s }}</span>
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

        <template v-else-if="currentStep === 'Recipient'">
          <h2>Who are you sending to?</h2>
          <UField label="Full Name" v-model="recipientForm.full_name" placeholder="John Doe" />
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

        <template v-else-if="currentStep === 'Confirm'">
          <h2>Confirm Transfer</h2>
          <div class="confirm-rows">
            <div v-for="([k,v], i) in confirmRows" :key="k" class="confirm-row" :class="{ last: i === confirmRows.length - 1 }">
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
            <UButton @click="reset">Send Another</UButton>
          </div>
        </template>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import UField from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError from '@/components/ui/UError.vue'
import client from '@/api/client'

const steps = ['Quote', 'Recipient', 'Confirm', 'Done']
const currentStep = ref('Quote')
const stepIndex = computed(() => steps.indexOf(currentStep.value))
const currencies = ['MWK','KES','TZS','ZMW','ZAR','MZN','BWP','NGN','GHS','ZWG']
const networks = ['Airtel','TNM','M-Pesa','MTN','Vodacom','Zamtel','Tigo']

const quoteForm = ref({ from_currency: 'MWK', to_currency: 'TZS', send_amount: '' })
const recipientForm = ref({ full_name: '', mobile_network: '', mobile_number: '' })

const quote = ref(null)
const rateLock = ref(null)
const error = ref('')
const loading = ref(false)

const confirmRows = computed(() => [
  ['You send', `${Number(quoteForm.value.send_amount).toLocaleString()} ${quoteForm.value.from_currency}`],
  ['Fee', `${quote.value?.fee_amount} ${quoteForm.value.from_currency}`],
  ['Rate', `1 ${quoteForm.value.from_currency} = ${quote.value?.exchange_rate} ${quoteForm.value.to_currency}`],
  ['Recipient gets', `${quote.value?.receive_amount} ${quoteForm.value.to_currency}`],
  ['To', recipientForm.value.full_name]
])

const handleQuote = async () => {
  if (quote.value) { currentStep.value = 'Recipient'; return }
  loading.value = true; error.value = ''
  try {
    const { data } = await client.post('/rate-locks', quoteForm.value)
    rateLock.value = data.rate_lock
    quote.value = {
      exchange_rate: data.rate_lock.locked_rate,
      fee_amount: data.rate_lock.fee_amount,
      receive_amount: data.rate_lock.receive_amount
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to get quote'
  } finally { loading.value = false }
}

const handleSend = async () => {
  loading.value = true
  try {
    await client.post('/transactions', {
      rate_lock_id: rateLock.value.id,
      amount: quoteForm.value.send_amount,
      recipient_data: recipientForm.value
    })
    currentStep.value = 'Done'
  } catch (err) {
    error.value = 'Transaction failed'
  } finally { loading.value = false }
}

const reset = () => {
  quote.value = null; currentStep.value = 'Quote'; quoteForm.value.send_amount = ''
}
</script>

<style scoped>
.send-page { max-width: 480px; margin: 40px auto; padding: 0 20px; }
.send-header { text-align: center; margin-bottom: 40px; }
.send-header h1 { font-size: 32px; font-weight: 800; color: #1a202c; margin-bottom: 8px; }
.send-header p { color: #718096; font-size: 16px; }

.steps { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding: 0 10px; }
.step { display: flex; align-items: center; gap: 10px; z-index: 1; }
.step__dot { width: 34px; height: 34px; border-radius: 50%; background: #edf2f7; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #a0aec0; transition: all 0.3s; }
.step.active .step__dot { background: var(--accent); color: white; transform: scale(1.1); box-shadow: 0 0 0 4px rgba(255, 107, 0, 0.1); }
.step.done .step__dot { background: var(--accent); color: white; }
.step__label { font-size: 14px; font-weight: 600; color: #4a5568; }
.step__line { flex: 1; height: 2px; background: #edf2f7; margin: 0 12px; transition: background 0.3s; }
.step__line.done { background: var(--accent); }

.send-card { background: white; border-radius: 24px; padding: 40px; border: 1px solid #f0f0f0; box-shadow: 0 10px 25px rgba(0,0,0,0.03); }
.send-card h2 { font-size: 22px; font-weight: 700; color: #1a202c; margin-bottom: 8px; }
.step-desc { color: #718096; font-size: 14px; margin-bottom: 30px; }

.currency-row { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 20px; margin-bottom: 24px; }
.currency-arrow { color: #cbd5e0; padding-top: 24px; font-size: 18px; }

.quote-box { background: #f8fafc; border-radius: 16px; padding: 20px; margin: 24px 0; border: 1px solid #edf2f7; }
.quote-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; color: #4a5568; }
.quote-row--total { border-top: 1px dashed #e2e8f0; padding-top: 15px; margin-top: 15px; font-weight: 700; font-size: 16px; color: #1a202c; }
.accent { color: var(--accent); }
.mono { font-family: 'JetBrains Mono', monospace; font-weight: 600; }

.btn-back { display: block; width: 100%; margin-top: 20px; background: transparent; border: none; color: #a0aec0; font-weight: 600; cursor: pointer; transition: color 0.2s; }
.btn-back:hover { color: #4a5568; }

.done-state { text-align: center; padding: 20px 0; }
.done-icon { width: 64px; height: 64px; background: #f0fff4; color: #38a169; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 20px; }
</style>
