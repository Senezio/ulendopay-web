<template>
  <div class="auth-page">
    <div class="auth-wrap">

      <!-- Brand -->
      <div class="auth-brand fade-up">
        <RouterLink to="/" class="brand-link">
          <img src="/logo.png" alt="UlendoPay" class="brand-logo" />
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
                <button type="button" class="field-link" @click="openForgotPin">Forgot PIN?</button>
              </div>
              <UField type="password" v-model="form.pin" placeholder="••••" maxlength="4" />
            </template>
            <template v-else>
              <UField label="Email" type="email" v-model="form.email" placeholder="name@email.com" />
              <div class="field-row">
                <label class="field-label">Password</label>
                <button type="button" class="field-link" @click="openForgotPassword">Forgot Password?</button>
              </div>
              <UField type="password" v-model="form.password" placeholder="••••••••" />
            </template>

            <UError v-if="error" :message="error" />
            <UButton :loading="loading">Continue</UButton>
          </form>

          <p class="auth-alt">New to Ulendo Pay? <RouterLink to="/register">Create account</RouterLink></p>
        </template>

        <template v-else>
          <div class="auth-head">
            <div class="otp-icon">
              <i :class="isTotpStep ? 'fa-sharp-duotone fa-solid fa-shield-halved' : 'fa-sharp-duotone fa-solid fa-mobile-screen-button'"></i>
            </div>
            <h1>Verify your identity</h1>
            <p v-if="isTotpStep">Enter the 6-digit code from your authenticator app.</p>
            <p v-else>We sent a 6-digit code to your phone. Enter it below.</p>
          </div>
          <form @submit.prevent="handleOtp">
            <UField
              :label="isTotpStep ? 'Authenticator Code' : 'Verification Code'"
              type="text" v-model="otp"
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
        <i class="fa-sharp-duotone fa-solid fa-lock"></i> Secured with end-to-end encryption
      </div>

    </div>

    <!-- ── Forgot PIN Modal ──────────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="pinModal.open" class="modal-overlay" @click.self="closePinModal">
        <div class="modal">

          <div class="modal__header">
            <div class="modal__icon">
              <i class="fa-sharp-duotone fa-solid fa-lock"></i>
            </div>
            <div>
              <div class="modal__title">Reset PIN</div>
              <div class="modal__subtitle">
                {{ pinModal.step === 'phone'   ? 'Enter your registered phone number'   :
                   pinModal.step === 'otp'     ? 'Enter the code sent to your phone'    :
                   pinModal.step === 'new'     ? 'Choose a new 4-digit PIN'             :
                   'PIN reset successfully' }}
              </div>
            </div>
            <button class="modal__close" @click="closePinModal">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Step 1: phone -->
          <div v-if="pinModal.step === 'phone'" class="modal__body">
            <p class="modal__info">We'll send a 6-digit reset code to your registered phone number.</p>
            <div class="modal__field">
              <label class="modal__label">Phone Number</label>
              <input v-model="pinModal.phone" class="modal__input" type="tel"
                placeholder="+265 XXX XXX XXX" @keyup.enter="requestPinOtp" />
            </div>
            <div v-if="pinModal.error" class="modal__error">{{ pinModal.error }}</div>
            <button class="modal__btn modal__btn--primary"
              :disabled="pinModal.loading || !pinModal.phone" @click="requestPinOtp">
              <i v-if="pinModal.loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <span v-else>Send Code</span>
            </button>
          </div>

          <!-- Step 2: OTP -->
          <div v-if="pinModal.step === 'otp'" class="modal__body">
            <p class="modal__info">Enter the 6-digit code sent to <strong>{{ pinModal.phone }}</strong>.</p>
            <input v-model="pinModal.otp" class="modal__input modal__input--otp"
              type="tel" placeholder="000000" maxlength="6" inputmode="numeric" />
            <div v-if="pinModal.error" class="modal__error">{{ pinModal.error }}</div>
            <button class="modal__btn modal__btn--primary"
              :disabled="pinModal.loading || pinModal.otp.length < 6" @click="goToNewPin">
              <span>Continue</span>
            </button>
            <button class="modal__btn modal__btn--ghost" @click="pinModal.step = 'phone'">← Back</button>
          </div>

          <!-- Step 3: new PIN -->
          <div v-if="pinModal.step === 'new'" class="modal__body">
            <div class="modal__field">
              <label class="modal__label">New PIN</label>
              <input v-model="pinModal.newPin" class="modal__input modal__input--pin"
                type="password" inputmode="numeric" maxlength="4" placeholder="••••" />
            </div>
            <div class="modal__field">
              <label class="modal__label">Confirm PIN</label>
              <input v-model="pinModal.confirmPin" class="modal__input modal__input--pin"
                type="password" inputmode="numeric" maxlength="4" placeholder="••••" />
            </div>
            <div v-if="pinModal.error" class="modal__error">{{ pinModal.error }}</div>
            <button class="modal__btn modal__btn--primary"
              :disabled="pinModal.loading || pinModal.newPin.length < 4 || pinModal.newPin !== pinModal.confirmPin"
              @click="submitPinReset">
              <i v-if="pinModal.loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <span v-else>Reset PIN</span>
            </button>
          </div>

          <!-- Step 4: done -->
          <div v-if="pinModal.step === 'done'" class="modal__body modal__body--center">
            <div class="modal__success-icon">
              <i class="fa-sharp-duotone fa-solid fa-circle-check"></i>
            </div>
            <p class="modal__info">Your PIN has been reset successfully.<br>Please sign in with your new PIN.</p>
            <button class="modal__btn modal__btn--primary" @click="closePinModal">Back to Sign In</button>
          </div>

        </div>
      </div>
    </Teleport>

    <!-- ── Forgot Password Modal ────────────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="pwModal.open" class="modal-overlay" @click.self="closePwModal">
        <div class="modal">

          <div class="modal__header">
            <div class="modal__icon">
              <i class="fa-sharp-duotone fa-solid fa-key"></i>
            </div>
            <div>
              <div class="modal__title">Reset Password</div>
              <div class="modal__subtitle">
                {{ pwModal.step === 'email'  ? 'Enter your registered email address'  :
                   pwModal.step === 'otp'    ? 'Enter the code sent to your email'    :
                   pwModal.step === 'new'    ? 'Choose a new password'                :
                   'Password reset successfully' }}
              </div>
            </div>
            <button class="modal__close" @click="closePwModal">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- Step 1: email -->
          <div v-if="pwModal.step === 'email'" class="modal__body">
            <p class="modal__info">We'll send a reset code to your registered email address.</p>
            <div class="modal__field">
              <label class="modal__label">Email Address</label>
              <input v-model="pwModal.email" class="modal__input" type="email"
                placeholder="name@email.com" @keyup.enter="requestPwOtp" />
            </div>
            <div v-if="pwModal.error" class="modal__error">{{ pwModal.error }}</div>
            <button class="modal__btn modal__btn--primary"
              :disabled="pwModal.loading || !pwModal.email" @click="requestPwOtp">
              <i v-if="pwModal.loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <span v-else>Send Code</span>
            </button>
          </div>

          <!-- Step 2: OTP -->
          <div v-if="pwModal.step === 'otp'" class="modal__body">
            <p class="modal__info">Enter the 6-digit code sent to <strong>{{ pwModal.email }}</strong>.</p>
            <input v-model="pwModal.otp" class="modal__input modal__input--otp"
              type="tel" placeholder="000000" maxlength="6" inputmode="numeric" />
            <div v-if="pwModal.error" class="modal__error">{{ pwModal.error }}</div>
            <button class="modal__btn modal__btn--primary"
              :disabled="pwModal.loading || pwModal.otp.length < 6" @click="goToNewPassword">
              <span>Continue</span>
            </button>
            <button class="modal__btn modal__btn--ghost" @click="pwModal.step = 'email'">← Back</button>
          </div>

          <!-- Step 3: new password -->
          <div v-if="pwModal.step === 'new'" class="modal__body">
            <div class="modal__field">
              <label class="modal__label">New Password</label>
              <input v-model="pwModal.newPw" class="modal__input" type="password"
                placeholder="Min 8 chars, upper + lower + number" />
            </div>
            <div class="modal__field">
              <label class="modal__label">Confirm Password</label>
              <input v-model="pwModal.confirmPw" class="modal__input" type="password"
                placeholder="Repeat password" />
            </div>
            <div v-if="pwModal.error" class="modal__error">{{ pwModal.error }}</div>
            <button class="modal__btn modal__btn--primary"
              :disabled="pwModal.loading || pwModal.newPw.length < 8 || pwModal.newPw !== pwModal.confirmPw"
              @click="submitPwReset">
              <i v-if="pwModal.loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <span v-else>Reset Password</span>
            </button>
          </div>

          <!-- Step 4: done -->
          <div v-if="pwModal.step === 'done'" class="modal__body modal__body--center">
            <div class="modal__success-icon">
              <i class="fa-sharp-duotone fa-solid fa-circle-check"></i>
            </div>
            <p class="modal__info">Your password has been reset successfully.<br>Please sign in with your new password.</p>
            <button class="modal__btn modal__btn--primary" @click="closePwModal">Back to Sign In</button>
          </div>

        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import client from '@/api/client'
import { authApi } from '@/api/auth'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'

const router     = useRouter()
const auth       = useAuthStore()
const step       = ref('credentials')
const method     = ref('phone_pin')
const form       = ref({ phone: '', pin: '', email: '', password: '' })
const userId     = ref(null)
const isTotpStep = ref(false)
const otp        = ref('')
const error      = ref('')
const loading    = ref(false)

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

    alert('next_step=' + data.next_step + ' token=' + (data.token ? 'yes' : 'no') + ' err=' + JSON.stringify(data.errors || data.message || ''))

    if (data.next_step === 'dashboard') {
      auth.setSession(data.token, data.user)
      router.push(auth.isStaff ? '/admin' : '/dashboard')
      return
    }

    userId.value     = data.user_id
    isTotpStep.value = data.next_step === 'verify_totp'
    step.value       = 'otp'
  } catch (err) {
    error.value = err.response?.data?.message || 'Check your credentials and try again'
  } finally { loading.value = false }
}

async function handleOtp() {
  error.value = ''
  loading.value = true
  try {
    const endpoint = isTotpStep.value ? '/auth/verify-totp' : '/auth/verify-login'
    const payload  = isTotpStep.value
      ? { user_id: userId.value, code: otp.value }
      : { user_id: userId.value, otp: otp.value }
    const { data } = await client.post(endpoint, payload)
    auth.setSession(data.token, data.user)
    router.push(auth.isStaff ? '/admin' : '/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid or expired code'
  } finally { loading.value = false }
}

// ── Forgot Password ────────────────────────────────────────────────────────
const pwModal = ref({
  open: false, step: 'email',
  email: '', otp: '', newPw: '', confirmPw: '',
  loading: false, error: '',
})

function openForgotPassword() {
  pwModal.value = {
    open: true, step: 'email',
    email: form.value.email || '',
    otp: '', newPw: '', confirmPw: '',
    loading: false, error: '',
  }
}
function closePwModal() { pwModal.value.open = false }

async function requestPwOtp() {
  if (!pwModal.value.email) return
  pwModal.value.loading = true
  pwModal.value.error   = ''
  try {
    await authApi.forgotPassword({ email: pwModal.value.email })
    pwModal.value.step = 'otp'
    pwModal.value.otp  = ''
  } catch (e) {
    pwModal.value.error = e.response?.data?.message || 'Failed to send code. Try again.'
  } finally { pwModal.value.loading = false }
}

function goToNewPassword() {
  if (pwModal.value.otp.length < 6) return
  pwModal.value.error = ''
  pwModal.value.step  = 'new'
}

async function submitPwReset() {
  const { email, otp, newPw, confirmPw } = pwModal.value
  if (newPw !== confirmPw) { pwModal.value.error = 'Passwords do not match.'; return }
  pwModal.value.loading = true
  pwModal.value.error   = ''
  try {
    await authApi.resetPassword({ email, otp, password: newPw, password_confirmation: confirmPw })
    pwModal.value.step = 'done'
  } catch (e) {
    const errors = e.response?.data?.errors
    pwModal.value.error = errors
      ? Object.values(errors).flat()[0]
      : (e.response?.data?.message || 'Reset failed. The code may have expired.')
    if (errors?.otp) pwModal.value.step = 'otp'
  } finally { pwModal.value.loading = false }
}

// ── Forgot PIN ─────────────────────────────────────────────────────────────
const pinModal = ref({
  open: false, step: 'phone',
  phone: '', otp: '', newPin: '', confirmPin: '',
  loading: false, error: '',
})

function openForgotPin() {
  pinModal.value = {
    open: true, step: 'phone',
    phone: form.value.phone || '',
    otp: '', newPin: '', confirmPin: '',
    loading: false, error: '',
  }
}
function closePinModal() { pinModal.value.open = false }

async function requestPinOtp() {
  if (!pinModal.value.phone) return
  pinModal.value.loading = true
  pinModal.value.error   = ''
  try {
    await authApi.forgotPin({ phone: pinModal.value.phone })
    pinModal.value.step = 'otp'
    pinModal.value.otp  = ''
  } catch (e) {
    pinModal.value.error = e.response?.data?.message || 'Failed to send code. Try again.'
  } finally { pinModal.value.loading = false }
}

function goToNewPin() {
  if (pinModal.value.otp.length < 6) return
  pinModal.value.error = ''
  pinModal.value.step  = 'new'
}

async function submitPinReset() {
  const { phone, otp, newPin, confirmPin } = pinModal.value
  if (newPin !== confirmPin) { pinModal.value.error = 'PINs do not match.'; return }
  if (!/^\d{4}$/.test(newPin)) { pinModal.value.error = 'PIN must be 4 digits.'; return }
  pinModal.value.loading = true
  pinModal.value.error   = ''
  try {
    await authApi.resetPin({ phone, otp, pin: newPin, pin_confirmation: confirmPin })
    pinModal.value.step = 'done'
  } catch (e) {
    const errors = e.response?.data?.errors
    pinModal.value.error = errors
      ? Object.values(errors).flat()[0]
      : (e.response?.data?.message || 'Reset failed. The code may have expired.')
    if (errors?.otp) pinModal.value.step = 'otp'
  } finally { pinModal.value.loading = false }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-alt);
  padding: 24px;
}
.auth-wrap { width: 100%; max-width: 400px; }

/* ── Brand ───────────────────────────────────── */
.auth-brand { margin-bottom: 28px; }
.brand-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
.brand-logo {
  height: 48px;
  width: auto;
  display: block;
}

/* ── Auth Box ────────────────────────────────── */
.auth-box {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
}

.auth-head { margin-bottom: 24px; }
.auth-head h1 {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.auth-head p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}
.otp-icon {
  font-size: 28px;
  color: var(--accent);
  margin-bottom: 10px;
}

/* ── Method Toggle ───────────────────────────── */
.method-toggle {
  display: flex;
  background: var(--bg-elevated);
  border-radius: 8px;
  padding: 3px;
  margin-bottom: 20px;
  border: 1px solid var(--border);
}
.method-toggle button {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: all 0.15s;
}
.method-toggle button.active {
  background: var(--bg-card);
  color: var(--text-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* ── Field Row ───────────────────────────────── */
.field-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.field-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.field-link {
  font-size: 13px;
  color: var(--accent);
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  padding: 0;
}
.field-link:hover { text-decoration: underline; }

/* ── OTP Field ───────────────────────────────── */
.otp-field :deep(input) {
  text-align: center;
  letter-spacing: 0.4em;
  font-size: 20px;
  font-weight: 700;
}

/* ── Footer ──────────────────────────────────── */
.auth-alt {
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}
.auth-alt a {
  color: var(--accent);
  font-weight: 600;
  text-decoration: none;
}
.auth-alt a:hover { text-decoration: underline; }

.btn-text {
  width: 100%;
  margin-top: 10px;
  padding: 8px;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
}
.btn-text:hover { color: var(--text-secondary); }

.auth-secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Modal ───────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  animation: overlay-in 0.2s ease;
}
@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }

.modal {
  background: var(--bg-card);
  border-radius: 24px 24px 0 0;
  width: 100%;
  max-width: 480px;
  padding-bottom: env(safe-area-inset-bottom, 16px);
  animation: sheet-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
  max-height: 90vh;
  overflow-y: auto;
}
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }

.modal__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom: 1px solid var(--border);
}
.modal__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--accent-dim);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}
.modal__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}
.modal__subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}
.modal__close {
  margin-left: auto;
  width: 32px;
  height: 32px;
  border-radius: 99px;
  border: none;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  flex-shrink: 0;
}

.modal__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.modal__body--center { align-items: center; text-align: center; }

.modal__info {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
}
.modal__info strong { color: var(--text-primary); }

.modal__error {
  font-size: 13px;
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: 10px;
  padding: 10px 12px;
}

.modal__field { display: flex; flex-direction: column; gap: 6px; }
.modal__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.modal__input {
  height: 48px;
  border-radius: 12px;
  border: 1.5px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-size: 15px;
  padding: 0 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.modal__input:focus { border-color: var(--accent); }
.modal__input--otp {
  text-align: center;
  letter-spacing: 0.4em;
  font-size: 22px;
  font-weight: 700;
  font-family: monospace;
}
.modal__input--pin {
  text-align: center;
  letter-spacing: 0.3em;
  font-size: 20px;
  font-weight: 700;
  font-family: monospace;
}

.modal__btn {
  width: 100%;
  height: 50px;
  border-radius: 14px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: inherit;
  transition: opacity 0.15s;
}
.modal__btn:disabled { opacity: 0.45; cursor: not-allowed; }
.modal__btn--primary { background: var(--accent); color: #ffffff; }
.modal__btn--primary:active:not(:disabled) { opacity: 0.88; }
.modal__btn--ghost {
  background: var(--bg-elevated);
  color: var(--text-secondary);
}

.modal__success-icon {
  font-size: 52px;
  color: var(--success);
  line-height: 1;
}
</style>
