<template>
  <div class="auth-page">
    <div class="auth-wrap">

      <!-- Logo -->
      <div class="auth-brand fade-up">
        <RouterLink to="/" class="brand-link">
          <img src="/logo.png" alt="Logo" class="h-12 w-auto mb-4">
          <span>Ulendo <strong>Pay</strong></span>
        </RouterLink>
      </div>

      <div class="auth-box fade-up-1">
        <template v-if="step === 'credentials'">
          <div class="auth-head">
            <h1>Sign in</h1>
            <p>Welcome back. Enter your details to continue.</p>
          </div>

          <div class="method-toggle">
            <button v-for="m in methods" :key="m.value"
              :class="{ active: method === m.value }"
              type="button" @click="method = m.value">
              {{ m.label }}
            </button>
          </div>

          <form @submit.prevent="handleCredentials">
            <template v-if="method === 'phone_pin'">
              <UField label="Phone Number" type="tel" v-model="form.phone" placeholder="+265 XXX XXX XXX" />
              <div class="field-row">
                <label class="field-label">PIN</label>
                <a href="#" class="field-link">Forgot PIN?</a>
              </div>
              <UField type="password" v-model="form.pin" placeholder="••••" maxlength="4" />
            </template>
            <template v-else>
              <UField label="Email" type="email" v-model="form.email" placeholder="name@email.com" />
              <UField label="Password" type="password" v-model="form.password" placeholder="••••••••" />
            </template>

            <UError v-if="error" :message="error" />
            <UButton :loading="loading">Continue</UButton>
          </form>

          <p class="auth-alt">New to Ulendo Pay? <RouterLink to="/register">Create account</RouterLink></p>
        </template>

        <template v-else>
          <div class="auth-head">
            <div class="otp-icon"><i class="fa-solid fa-mobile-screen-button"></i></div>
            <h1>Verify your identity</h1>
            <p>We sent a 6-digit code to your phone. Enter it below.</p>
          </div>
          <form @submit.prevent="handleOtp">
            <UField label="Verification Code" type="text" v-model="otp"
              placeholder="000000" maxlength="6" class="otp-field" />
            <UError v-if="error" :message="error" />
            <UButton :loading="loading">Verify & Sign In</UButton>
            <button type="button" class="btn-text" @click="step = 'credentials'">
              ← Try a different method
            </button>
          </form>
        </template>
      </div>

      <div class="auth-secure fade-up-2">
        <i class="fa-solid fa-lock"></i> Secured with end-to-end encryption
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

const router  = useRouter()
const auth    = useAuthStore()
const step    = ref('credentials')
const method  = ref('phone_pin')
const form    = ref({ phone: '', pin: '', email: '', password: '' })
const userId  = ref(null)
const otp     = ref('')
const error   = ref('')
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
    error.value = err.response?.data?.message || 'Check your credentials and try again'
  } finally { loading.value = false }
}

async function handleOtp() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await client.post('/auth/verify-login', { user_id: userId.value, otp: otp.value })
    auth.setSession(data.token, data.user)
    router.push(auth.isStaff ? '/admin' : '/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid or expired code'
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center;
  justify-content: center; background: var(--bg-alt);
  padding: 24px;
}
.auth-wrap { width: 100%; max-width: 400px; }

.auth-brand { margin-bottom: 28px; }
.brand-link {
  display: inline-flex; align-items: center; gap: 8px;
  text-decoration: none; color: var(--text-primary);
  font-size: 16px;
}
.brand-mark {
  width: 30px; height: 30px; background: var(--accent);
  color: #fff; border-radius: 7px; display: flex;
  align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800;
}
.brand-link strong { font-weight: 700; }

.auth-box {
  background: #fff; border: 1px solid var(--border);
  border-radius: 8px; padding: 32px;
}

.auth-head { margin-bottom: 24px; }
.auth-head h1 { font-size: 22px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
.auth-head p  { font-size: 14px; color: var(--text-secondary); margin-top: 4px; }
.otp-icon { font-size: 28px; color: var(--accent); margin-bottom: 10px; }

.method-toggle {
  display: flex; background: var(--bg-elevated);
  border-radius: 6px; padding: 3px; margin-bottom: 20px;
  border: 1px solid var(--border);
}
.method-toggle button {
  flex: 1; padding: 8px 12px; border-radius: 4px; border: none;
  background: transparent; color: var(--text-secondary);
  font-size: 13px; font-weight: 500; cursor: pointer;
  font-family: 'DM Sans', sans-serif; transition: all 0.15s;
}
.method-toggle button.active {
  background: #fff; color: var(--text-primary); font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.field-row {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 6px;
}
.field-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.field-link  { font-size: 13px; color: var(--accent); text-decoration: none; }
.field-link:hover { text-decoration: underline; }

.otp-field :deep(input) {
  text-align: center; letter-spacing: 0.4em;
  font-size: 20px; font-weight: 700;
}

.auth-alt {
  text-align: center; margin-top: 20px;
  font-size: 14px; color: var(--text-secondary);
}
.auth-alt a { color: var(--accent); font-weight: 600; text-decoration: none; }
.auth-alt a:hover { text-decoration: underline; }

.btn-text {
  width: 100%; margin-top: 10px; padding: 8px;
  background: none; border: none; color: var(--text-muted);
  font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif;
}
.btn-text:hover { color: var(--text-secondary); }

.auth-secure {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; margin-top: 20px;
  font-size: 12px; color: var(--text-muted);
}
</style>
