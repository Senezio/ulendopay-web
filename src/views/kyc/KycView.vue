<template>
  <AppLayout>
    <div class="kyc">
      <div class="kyc__header">
        <h1>KYC Verification</h1>
        <p>Verify your identity to unlock all features</p>
      </div>

      <div class="status-card">
        <div class="status-icon" :style="{ background: status.bg, color: status.color }">
          <i :class="status.iconClass"></i>
        </div>
        <div>
          <div class="status-label">Current Status</div>
          <div class="status-value" :style="{ color: status.color }">{{ status.text }}</div>
        </div>
      </div>

      <div v-if="auth.user?.kyc_status === 'verified'" class="verified-card">
        <div class="verified-icon">
          <i class="fa-sharp-duotone fa-solid fa-circle-check"></i>
        </div>
        <h2>You're verified!</h2>
        <p>Your identity has been verified. You can send money freely.</p>
        <div class="tier-status">
          <span class="tier-badge" :class="'tier-badge--' + (auth.user?.tier || 'unverified')">
            {{ auth.user?.tier ? auth.user.tier.charAt(0).toUpperCase() + auth.user.tier.slice(1) : 'Unverified' }} Tier
          </span>
          <span v-if="canUpgrade" class="upgrade-hint">
            Want higher limits? <RouterLink to="/kyc">Upgrade to Verified</RouterLink>
          </span>
        </div>
      </div>

      <div v-else class="kyc-card">
        <div v-if="submitted" class="submitted">
          <i class="fa-regular fa-circle-check" style="font-size: 48px; color: var(--accent); margin-bottom: 16px; display: block;"></i>
          <h3>Documents Submitted</h3>
          <p>We will review your documents within 24 hours. You will receive an SMS once processed.</p>
        </div>

        <form v-else @submit.prevent="handleSubmit">
          <div class="field">
            <label>Requested Tier</label>
            <select v-model="form.requested_tier" @change="onTierChange">
              <option v-if="tiersLoading" disabled value="">Loading tiers...</option>
              <option v-for="t in availableTiers" :key="t.name" :value="t.name">
                {{ t.label }} — {{ t.name }}
              </option>
            </select>
            <span class="field-hint">Select the tier you are applying for</span>
          </div>

          <div class="field">
            <label>Document Type</label>
            <select v-model="form.document_type">
              <option v-for="doc in availableDocuments" :key="doc.value" :value="doc.value">
                {{ doc.label }}
              </option>
            </select>
            <span class="field-hint">{{ tierDocHint }}</span>
          </div>

          <UField
            label="Document Number"
            v-model="form.document_number"
            :placeholder="isIdentityDoc ? 'Enter ID or Passport number (required)' : 'Enter document number'"
            :required="isIdentityDoc"
          />

          <div v-if="isIdentityDoc" class="field">
            <label>Date of Birth <span class="required">*</span></label>
            <input
              type="date"
              v-model="form.date_of_birth"
              :max="maxDob"
              min="1900-01-01"
              class="date-input"
              required
            />
            <span class="field-hint">Must match your document exactly</span>
          </div>

          <div v-if="isIdentityDoc" class="field">
            <label>Gender <span class="required">*</span></label>
            <select v-model="form.gender" required>
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <span class="field-hint">Must match your document exactly</span>
          </div>

          <div class="field">
            <label>Document Photo / PDF</label>
            <label class="file-upload">
              <span class="file-icon">
                <i :class="file ? 'fa-regular fa-file-pdf' : 'fa-regular fa-image'"></i>
              </span>
              <span class="file-text">{{ file ? file.name : 'Click to upload (Max 15MB)' }}</span>
              <input 
                type="file" 
                ref="fileInput"
                accept="image/jpeg,image/png,image/webp,application/pdf" 
                @change="handleFileChange" 
              />
            </label>
          </div>

          <UError v-if="error" :message="error" />

          <UButton :loading="loading" type="submit" style="margin-top: 10px;">
            Submit for Verification
          </UButton>
        </form>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'
import { useAuthStore } from '@/stores/auth'
import client from '@/api/client'
import { tierApi } from '@/api/tier'

const auth = useAuthStore()

const availableTiers  = ref([])
const tiersLoading    = ref(false)
const canUpgrade      = computed(() => availableTiers.value.length > 0)

const allDocs = [
  { value: 'national_id',     label: 'National ID / NRC' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'voters_card',     label: "Voter's Card" },
  { value: 'passport',        label: 'Passport' },
  { value: 'bank_statement',  label: 'Bank Statement (3 months, official letterhead)' },
]

const availableDocuments = computed(() => allDocs)
const tierDocHint = computed(() => 'Please upload a valid government-issued photo ID or supporting document.')

const form = ref({ document_type: 'national_id', document_number: '', date_of_birth: '', gender: '', requested_tier: '' })

const identityDocTypes = ['passport', 'national_id', 'drivers_license', 'voters_card']
const isIdentityDoc    = computed(() => identityDocTypes.includes(form.value.document_type))
const maxDob           = computed(() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18) // must be at least 18
  return d.toISOString().split('T')[0]
})

function onTierChange() {
  if (form.value.document_type === '') {
    form.value.document_type = allDocs[0].value
  }
}

async function loadTiers() {
  tiersLoading.value = true
  try {
    const res = await client.get('/tier/available')
    availableTiers.value = res.data.tiers || []
    if (availableTiers.value.length > 0) {
      form.value.requested_tier = availableTiers.value[0].name
    }
  } catch {
    availableTiers.value = []
  } finally {
    tiersLoading.value = false
  }
}

onMounted(loadTiers)
const file      = ref(null)
const fileInput = ref(null)
const error     = ref('')
const loading   = ref(false)
const submitted = ref(false)

const statuses = {
  none:     { color: 'var(--text-secondary)', bg: '#ffffff11', iconClass: 'fa-regular fa-circle', text: 'Not submitted' },
  pending:  { color: 'var(--accent-amber)',   bg: '#ffb93822', iconClass: 'fa-regular fa-clock', text: 'Under review' },
  verified: { color: 'var(--accent)',         bg: 'var(--accent-dim)', iconClass: 'fa-sharp-duotone fa-solid fa-circle-check', text: 'Verified' },
  approved: { color: 'var(--accent)',         bg: 'var(--accent-dim)', iconClass: 'fa-sharp-duotone fa-solid fa-circle-check', text: 'Verified' },
  rejected: { color: 'var(--danger)',         bg: '#ff444422', iconClass: 'fa-sharp-duotone fa-solid fa-circle-xmark', text: 'Rejected' },
}

const status = computed(() => statuses[auth.user?.kyc_status] || statuses.none)

function handleFileChange(e) {
  const selectedFile = e.target.files[0]
  if (selectedFile) {
    file.value = selectedFile
    error.value = ''
    console.log('File selected:', selectedFile.name, selectedFile.size, selectedFile.type)
  } else {
    file.value = null
  }
}

async function handleSubmit() {
  // Clear previous error
  error.value = ''
  
  // Validate DOB and gender for identity documents
  if (identityDocTypes.includes(form.value.document_type)) {
    if (!form.value.date_of_birth) {
      error.value = 'Date of birth is required for identity documents'
      return
    }
    if (!form.value.gender) {
      error.value = 'Gender is required for identity documents'
      return
    }
    if (!form.value.document_number) {
      error.value = 'Document number is required for identity documents'
      return
    }
  }

  // Validate file exists
  if (!file.value) {
    error.value = 'Please select a document to upload'
    return
  }

  // Validate file size (15MB limit)
  if (file.value.size > 15 * 1024 * 1024) {
    error.value = 'File size exceeds 15MB limit'
    return
  }

  loading.value = true

  try {
    const fd = new FormData()
    fd.append('document_type', form.value.document_type)
    fd.append('document_number', form.value.document_number || '')
    fd.append('requested_tier', form.value.requested_tier)
    if (form.value.date_of_birth) fd.append('date_of_birth', form.value.date_of_birth)
    if (form.value.gender)        fd.append('gender', form.value.gender)
    fd.append('document', file.value, file.value.name)

    // Log FormData contents for debugging
    console.log('Submitting KYC:', {
      document_type: form.value.document_type,
      document_number: form.value.document_number,
      file_name: file.value.name,
      file_size: file.value.size,
      file_type: file.value.type
    })

    const response = await client.post('/kyc/submit', fd, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    console.log('KYC submission successful:', response.data)
    submitted.value = true
    
    // Refresh user data to update KYC status
    await auth.fetchMe?.() || null
    
  } catch (err) {
    console.error('KYC Submission Error:', err)
    const errData = err.response?.data

    if (errData?.errors) {
      // Flatten Laravel validation errors
      const errors = errData.errors
      error.value = Object.values(errors).flat()[0]
    } else {
      error.value = errData?.message || 'Submission failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
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
.verified-card .verified-icon { 
  font-size: 48px; 
  color: var(--accent); 
  margin-bottom: 16px; 
  display: flex; 
  justify-content: center; 
}
.verified-card h2   { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
.verified-card p    { color: var(--text-secondary); font-size: 14px; }
.tier-status {
  display: flex; align-items: center; gap: 10px;
  margin-top: 16px; justify-content: center; flex-wrap: wrap;
}
.upgrade-hint { font-size: 13px; color: var(--text-secondary); }
.upgrade-hint a { color: var(--accent); font-weight: 600; text-decoration: none; }
.tier-badge {
  display: inline-block; padding: 4px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 700;
}
.tier-badge--unverified { background: #f1f5f9; color: #475569; }
.tier-badge--basic      { background: #fff7ed; color: #c2410c; }
.tier-badge--verified   { background: #f0fdf4; color: #16a34a; }


.kyc-card { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); padding: 24px; max-width: 480px; }

.field { margin-bottom: 16px; }
.field label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 500; }
.field-hint { display: block; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
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
.file-text { font-size: 13px; color: var(--text-secondary); text-align: center; }

.date-input {
  width: 100%; padding: 11px 14px; background: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 10px;
  color: var(--text-primary); font-size: 14px; font-family: 'Sora', sans-serif;
  outline: none; box-sizing: border-box;
}
.date-input:focus { border-color: var(--accent); }
.required { color: var(--danger); margin-left: 2px; }

.submitted { text-align: center; padding: 20px 0; }
.submitted h3 { font-size: 18px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
.submitted p  { color: var(--text-secondary); font-size: 14px; line-height: 1.5; }
</style>
