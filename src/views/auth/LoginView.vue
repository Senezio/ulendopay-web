<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-logo">
        <div class="logo-icon">U</div>
        <h1>Welcome back</h1>
        <p>Sign in to your secure account</p>
      </div>

      <div class="auth-card">
        <template v-if="step === 'credentials'">
          <div class="method-toggle">
            <button
              v-for="m in methods" :key="m.value"
              :class="{ active: method === m.value }"
              @click="method = m.value"
            >{{ m.label }}</button>
          </div>

          <form @submit.prevent="handleCredentials">
            <template v-if="method === 'phone_pin'">
              <UField label="Phone Number" type="tel" v-model="form.phone" placeholder="+265" />
              <div class="field-header">
                <label class="field-label">Account PIN</label>
                <a href="#" class="forgot-link">Forgot?</a>
              </div>
              <UField type="password" v-model="form.pin" placeholder="••••" maxlength="4" />
            </template>
            
            <template v-else>
              <UField label="Email Address" type="email" v-model="form.email" placeholder="name@email.com" />
              <UField label="Password" type="password" v-model="form.password" placeholder="••••••••" />
            </template>

            <UError v-if="error" :message="error" class="error-spacing" />
            <UButton :loading="loading" class="btn-primary">Continue</UButton>
          </form>

          <div class="auth-footer">
            <span>New to Ulendo?</span>
            <RouterLink to="/register">Create an account</RouterLink>
          </div>
        </template>

        <template v-else>
          <div class="otp-header">
            <div class="otp-icon-wrapper">
              <i class="fa-solid fa-mobile-screen-button"></i>
            </div>
            <h2>Verify Identity</h2>
            <p>We sent a 6-digit code to your device</p>
          </div>
          
          <form @submit.prevent="handleOtp">
            <UField label="Verification Code" type="text" v-model="otp"
              placeholder="0 0 0 0 0 0" maxlength="6" class="otp-input" />
            <UError v-if="error" :message="error" />
            <UButton :loading="loading" class="btn-primary">Verify & Sign In</UButton>
            <button type="button" class="btn-back" @click="step = 'credentials'">
              <i class="fa-solid fa-arrow-left"></i> Use a different method
            </button>
          </form>
        </template>
      </div>
      
      <div class="security-footer">
        <i class="fa-solid fa-lock"></i>
        <span>End-to-end encrypted session</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import client from '@/api/client'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'

const router = useRouter()
const auth   = useAuthStore()

const step   = ref('credentials')
const method = ref('phone_pin')
const form   = ref({ phone: '', pin: '', email: '', password: '' })
const userId = ref(null)
const otp    = ref('')
const error  = ref('')
const loading = ref(false)

const methods = [
  { value: 'phone_pin',      label: 'Phone + PIN' },
  { value: 'email_password', label: 'Email' },
]

async function handleCredentials() {
  error.value = ''
  loading.value = true
  try {
    const payload = method.value === 'phone_pin'
      ? { method: method.value, phone: form.value.phone, pin: form.value.pin }
      : { method: method.value, email: form.value.email, password: form.value.password }
    const { data } = await client.post('/auth/login', payload)
    userId.value = data.user_id
    step.value = 'otp'
  } catch (err) {
    error.value = err.response?.data?.message || 'Check your credentials'
  } finally { loading.value = false }
}

async function handleOtp() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await client.post('/auth/verify-login', { user_id: userId.value, otp: otp.value })
    auth.setAuth(data.user, data.token)
    router.push('/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid code'
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center;
  justify-content: center; padding: 24px; background: #f9fafb;
}
.auth-container { width: 100%; max-width: 400px; }
.auth-logo { text-align: center; margin-bottom: 32px; }

.logo-icon {
  width: 48px; height: 48px; border-radius: 12px;
  background: #ff6b00; display: flex; align-items: center;
  justify-content: center; margin: 0 auto 16px;
  font-size: 24px; font-weight: 800; color: #fff;
}
.auth-logo h1 { font-size: 24px; font-weight: 800; color: #111827; letter-spacing: -0.02em; }
.auth-logo p  { color: #6b7280; font-size: 15px; margin-top: 4px; }

.auth-card {
  background: #fff; border-radius: 24px;
  border: 1px solid #e5e7eb; padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.03);
}

.method-toggle {
  display: flex; background: #f3f4f6;
  border-radius: 12px; padding: 4px; margin-bottom: 24px;
}
.method-toggle button {
  flex: 1; padding: 10px; border-radius: 10px; border: none;
  background: transparent; color: #6b7280;
  font-size: 14px; cursor: pointer; font-weight: 500;
  transition: all 0.2s;
}
.method-toggle button.active {
  background: #fff; color: #111827; font-weight: 600;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.field-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.field-label { font-size: 14px; font-weight: 600; color: #374151; }
.forgot-link { font-size: 13px; color: #ff6b00; text-decoration: none; font-weight: 500; }

.error-spacing { margin-bottom: 16px; }

.btn-primary {
  width: 100%; background: #ff6b00; color: #fff; border: none;
  padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s;
}

.auth-footer { text-align: center; margin-top: 24px; font-size: 14px; color: #6b7280; }
.auth-footer a { color: #ff6b00; font-weight: 600; text-decoration: none; margin-left: 6px; }

.otp-header { text-align: center; margin-bottom: 24px; }
.otp-icon-wrapper { color: #ff6b00; font-size: 32px; margin-bottom: 12px; }
.otp-header h2 { font-size: 20px; font-weight: 700; color: #111827; }
.otp-header p  { color: #6b7280; font-size: 14px; margin-top: 4px; }

.otp-input :deep(input) {
  text-align: center; letter-spacing: 0.5em; font-size: 20px; font-weight: 700;
}

.btn-back {
  width: 100%; margin-top: 16px; padding: 8px;
  background: transparent; border: none;
  color: #9ca3af; font-size: 13px; font-weight: 500;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}

.security-footer {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; margin-top: 24px; color: #9ca3af; font-size: 12px;
}
</style>
