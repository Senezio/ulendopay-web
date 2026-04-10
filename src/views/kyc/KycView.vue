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

