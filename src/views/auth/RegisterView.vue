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
        <template v-if="step === 'form'">
          <div class="auth-head">
            <h1>Create account</h1>
            <p>Join Ulendo Pay and send money across Africa.</p>
          </div>

          <form @submit.prevent="handleRegister">
            <UField label="Full Name" v-model="form.name" placeholder="e.g. Alinafe Banda" />
            <UField label="Phone Number" type="tel" v-model="form.phone" placeholder="+265 XXX XXX XXX" />
            <UField label="Email Address (optional)" type="email" v-model="form.email" placeholder="name@email.com" />

            <div class="field">
              <label class="field__label">Country</label>
              <select v-model="form.country_code" class="field__select">
                <option v-for="c in countries" :key="c[0]" :value="c[0]">{{ c[1] }}</option>
              </select>
            </div>

            <div class="pin-row">
              <UField label="4-digit PIN" type="password" v-model="form.pin" placeholder="••••" maxlength="4" />
              <UField label="Confirm PIN" type="password" v-model="form.pin_confirmation" placeholder="••••" maxlength="4" />
            </div>

            <UError v-if="error" :message="error" />
            <UButton :loading="loading">Create Account</UButton>
          </form>

          <p class="auth-alt">Already have an account? <RouterLink to="/login">Sign in</RouterLink></p>
          <p class="auth-terms">
            By creating an account you agree to our
            <RouterLink to="/terms">Terms of Service</RouterLink> and
            <RouterLink to="/privacy">Privacy Policy</RouterLink>.
          </p>
        </template>

        <template v-else-if="step === 'otp'">
          <div class="auth-head">
            <div class="otp-icon"><i class="fa-sharp-duotone fa-solid fa-mobile-screen-button"></i></div>
            <h1>Verify your phone</h1>
            <p>We sent a 6-digit code to <strong>{{ form.phone }}</strong>. Enter it below.</p>
          </div>
          <form @submit.prevent="handleVerify">
            <UField label="Verification Code" type="text" v-model="otp"
              placeholder="000000" maxlength="6" class="otp-field" />
            <UError v-if="error" :message="error" />
            <UButton :loading="loading">Verify Phone Number</UButton>
            <button type="button" class="btn-text" @click="step = 'form'">← Go back</button>
          </form>
        </template>

        <template v-else-if="step === 'email_otp'">
          <div class="auth-head">
            <div class="otp-icon"><i class="fa-sharp-duotone fa-solid fa-envelope"></i></div>
            <h1>Verify your email</h1>
            <p>We sent a 6-digit code to <strong>{{ form.email }}</strong>. Enter it below.</p>
          </div>
          <form @submit.prevent="handleEmailVerify">
            <UField label="Verification Code" type="text" v-model="emailOtp"
              placeholder="000000" maxlength="6" class="otp-field" />
            <UError v-if="error" :message="error" />
            <UButton :loading="loading">Verify Email</UButton>
            <button type="button" class="btn-text" @click="skipEmailVerification">Skip for now →</button>
          </form>
        </template>
      </div>

      <div class="auth-secure fade-up-2">
        <i class="fa-sharp-duotone fa-solid fa-lock"></i> Secured with end-to-end encryption
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { authApi } from '@/api/auth'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import client from '@/api/client'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'

const router   = useRouter()
const ui       = useUiStore()
const auth     = useAuthStore()
const step     = ref('form')
const userId   = ref(null)
const otp      = ref('')
const emailOtp = ref('')
const error    = ref('')
const loading  = ref(false)

const form = ref({
  name: '', phone: '', email: '', country_code: 'MWI',
  pin: '', pin_confirmation: '',
})

const countries = [
  ['MWI', '🇲🇼 Malawi'],   ['KEN', '🇰🇪 Kenya'],        ['TZA', '🇹🇿 Tanzania'],
  ['ZMB', '🇿🇲 Zambia'],   ['ZAF', '🇿🇦 South Africa'], ['MOZ', '🇲🇿 Mozambique'],
  ['BWA', '🇧🇼 Botswana'], ['ZWE', '🇿🇼 Zimbabwe'],     ['UGA', '🇺🇬 Uganda'],
  ['GHA', '🇬🇭 Ghana'],    ['NGA', '🇳🇬 Nigeria'],       ['ETH', '🇪🇹 Ethiopia'],
]

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await client.post('/auth/register', form.value)
    if (data.next_step === 'dashboard') {
      auth.setSession(data.token, data.user)
      router.push(auth.isStaff ? '/admin' : '/dashboard')
      return
    }
    userId.value = data.user_id
    step.value = 'otp'
  } catch (err) {
    const errs = err.response?.data?.errors
    error.value = errs
      ? Object.values(errs).flat()[0]
      : err.response?.data?.message || 'Registration failed'
  } finally { loading.value = false }
}

async function handleVerify() {
  error.value = ''
  loading.value = true
  try {
    await client.post('/auth/verify-phone', { user_id: userId.value, otp: otp.value })
    if (form.value.email) {
      await authApi.verifyEmail({ user_id: userId.value, send: true })
      step.value = 'email_otp'
    } else {
      ui.success('Phone verified. You can now sign in.')
      router.push('/login')
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid or expired code'
  } finally { loading.value = false }
}

async function handleEmailVerify() {
  error.value = ''
  loading.value = true
  try {
    await authApi.verifyEmail({ user_id: userId.value, otp: emailOtp.value })
    ui.success('Email verified. You can now sign in.')
    router.push('/login')
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid or expired code'
  } finally { loading.value = false }
}

function skipEmailVerification() {
  ui.success('Account created. You can verify your email later from your profile.')
  router.push('/login')
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
.auth-wrap { width: 100%; max-width: 420px; }

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
.auth-head strong { color: var(--text-primary); }
.otp-icon {
  font-size: 28px;
  color: var(--accent);
  margin-bottom: 10px;
}

/* ── Country Select ──────────────────────────── */
/* Native selects don't inherit CSS vars reliably in dark mode,
   so we set all relevant properties explicitly */
.field { margin-bottom: 16px; }
.field__label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}
.field__select {
  width: 100%;
  padding: 11px 14px;
  background: var(--bg-elevated);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  appearance: auto;
}
.field__select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(232, 93, 4, 0.1);
}

/* ── PIN Row ─────────────────────────────────── */
.pin-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

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

.auth-terms {
  text-align: center;
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
}
.auth-terms a {
  color: var(--text-secondary);
  text-decoration: underline;
}

.auth-secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-muted);
}

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
</style>
