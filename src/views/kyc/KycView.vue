<template>
  <AppLayout>
    <div class="kyc">
      <div class="kyc__header fade-up">
        <h1>KYC Verification</h1>
        <p>Verify your identity to unlock all features</p>
      </div>

      <!-- Status -->
      <div class="status-card fade-up-1">
        <div class="status-icon" :style="{ background: status.bg, color: status.color }">
          <i :class="status.iconClass"></i>
        </div>
        <div>
          <div class="status-label">Current Status</div>
          <div class="status-value" :style="{ color: status.color }">{{ status.text }}</div>
        </div>
      </div>

      <!-- Verified -->
      <div v-if="auth.user?.kyc_status === 'verified'" class="verified-card fade-up-2">
        <span>✅</span>
        <h2>You're verified!</h2>
        <p>Your identity has been verified. You can send money freely.</p>
      </div>

      <!-- Form -->
      <div v-else class="kyc-card fade-up-2">
        <div v-if="submitted" class="submitted">
          <i class="fa-regular fa-file-lines"></i>
          <h3>Documents Submitted</h3>
          <p>We will review your documents within 24 hours.</p>
        </div>
        <form v-else @submit.prevent="handleSubmit">
          <div class="field">
            <label>Document Type</label>
            <select v-model="form.document_type">
              <option value="national_id">National ID</option>
              <option value="passport">Passport</option>
              <option value="drivers_license">Driver's License</option>
            </select>
          </div>
          <UField label="Document Number" v-model="form.document_number" placeholder="Enter document number" />
          <div class="field">
            <label>Document Photo</label>
            <label class="file-upload" @dragover.prevent @drop.prevent="onDrop">
              <span class="file-icon"><i :class="file ? 'fa-regular fa-file' : 'fa-regular fa-image'"></i></span>
              <span class="file-text">{{ file ? file.name : 'Click to upload document photo' }}</span>
              <input type="file" accept="image/*,.pdf" @change="e => file = e.target.files[0]" />
            </label>
          </div>
          <UError v-if="error" :message="error" />
          <UButton :loading="loading">Submit for Verification</UButton>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'
import { useAuthStore } from '@/stores/auth'
import client from '@/api/client'

const auth = useAuthStore()

const form      = ref({ document_type: 'national_id', document_number: '' })
const file      = ref(null)
const error     = ref('')
const loading   = ref(false)
const submitted = ref(false)

const statuses = {
  none:     { color: 'var(--text-secondary)', bg: '#ffffff11', iconClass: 'fa-regular fa-circle', text: 'Not submitted' },
  pending:  { color: 'var(--accent-amber)',   bg: '#ffb93822', iconClass: 'fa-regular fa-clock', text: 'Under review' },
  verified: { color: 'var(--accent)',         bg: 'var(--accent-dim)', iconClass: 'fa-solid fa-circle-check', text: 'Verified' },
  rejected: { color: 'var(--danger)',         bg: '#ff444422', iconClass: 'fa-solid fa-circle-xmark', text: 'Rejected' },
}
const status = computed(() => statuses[auth.user?.kyc_status] || statuses.none)

const onDrop = (e) => { file.value = e.dataTransfer.files[0] }

async function handleSubmit() {
  if (!file.value) { error.value = 'Please select a document photo'; return }
  error.value = ''
  loading.value = true
  try {
    const fd = new FormData()
    fd.append('document_type',   form.value.document_type)
    fd.append('document_number', form.value.document_number)
    fd.append('document', file.value)
    await client.post('/kyc', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    submitted.value = true
  } catch (err) {
    const errs = err.response?.data?.errors
    error.value = errs ? Object.values(errs).flat()[0] : err.response?.data?.message || 'Submission failed'
  } finally { loading.value = false }
}
</script>

<style scoped>
.kyc__header { margin-bottom: 24px; }
.kyc__header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.kyc__header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.status-card {
  display: flex; align-items: center; gap: 14px;
  background: var(--bg-card); border-radius: 12px;
  border: 1px solid var(--border); padding: 16px 18px; margin-bottom: 20px;
}
.status-icon {
  width: 42px; height: 42px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
}
.status-label { font-size: 12px; color: var(--text-secondary); }
.status-value { font-size: 15px; font-weight: 700; margin-top: 2px; }

.verified-card {
  text-align: center; padding: 48px; background: var(--bg-card);
  border-radius: 14px; border: 1px solid var(--border); max-width: 480px;
}
.verified-card span { font-size: 44px; display: block; margin-bottom: 14px; }
.verified-card h2   { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.verified-card p    { color: var(--text-secondary); font-size: 14px; }

.kyc-card { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); padding: 24px; max-width: 480px; }

.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 500; }
.field select {
  width: 100%; padding: 11px 14px; background: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 10px;
  color: var(--text-primary); font-size: 14px; font-family: 'Sora', sans-serif; outline: none;
}

.file-upload {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 24px; background: var(--bg-elevated);
  border: 2px dashed var(--border); border-radius: 10px; cursor: pointer; transition: border-color 0.15s;
}
.file-upload:hover { border-color: var(--accent); }
.file-upload input { display: none; }
.file-icon { font-size: 28px; }
.file-text { font-size: 13px; color: var(--text-secondary); }

.submitted { text-align: center; padding: 24px 0; }
.submitted span { font-size: 36px; display: block; margin-bottom: 12px; }
.submitted h3 { font-size: 17px; font-weight: 600; margin-bottom: 8px; }
.submitted p  { color: var(--text-secondary); font-size: 13px; }
</style>
