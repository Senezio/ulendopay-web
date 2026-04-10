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

