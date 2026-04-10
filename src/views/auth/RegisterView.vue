<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-logo fade-up">
        <div class="logo-icon">U</div>
        <h1>{{ step === 'form' ? 'Create account' : 'Verify phone' }}</h1>
        <p>{{ step === 'form' ? 'Join Ulendo Pay — send money across Africa' : 'Enter the code sent to your phone' }}</p>
      </div>

      <div class="auth-card fade-up-1">
        <form v-if="step === 'form'" @submit.prevent="handleRegister">
          <UField label="Full Name" v-model="form.name" placeholder="Alinafe Banda" />
          <UField label="Phone Number" type="tel" v-model="form.phone" placeholder="+265 XXX XXX XXX" />

          <div class="field">
            <label>Country</label>
            <select v-model="form.country_code">
              <option v-for="c in countries" :key="c[0]" :value="c[0]">{{ c[1] }}</option>
            </select>
          </div>

          <UField label="4-digit PIN" type="password" v-model="form.pin" placeholder="••••" maxlength="4" />
          <UField label="Confirm PIN" type="password" v-model="form.pin_confirmation" placeholder="••••" maxlength="4" />

          <UError v-if="error" :message="error" />
          <UButton :loading="loading">Create Account</UButton>

          <div class="auth-link">
            <RouterLink to="/login">Already have an account? Sign in</RouterLink>
          </div>
        </form>

        <form v-else @submit.prevent="handleVerify">
          <div class="otp-header">
            <span class="otp-icon">📱</span>
            <p>Enter the 6-digit code we sent to your phone</p>
          </div>
          <UField label="Verification Code" type="text" v-model="otp"
            placeholder="000000" maxlength="6"
            :style="{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }" />
          <UError v-if="error" :message="error" />
          <UButton :loading="loading">Verify Phone</UButton>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import client from '@/api/client'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'

const router = useRouter()
const ui     = useUiStore()

const step   = ref('form')
const userId = ref(null)
const otp    = ref('')
const error  = ref('')
const loading = ref(false)

const form = ref({
  name: '', phone: '', country_code: 'MWI',
  pin: '', pin_confirmation: '',
})

const countries = [
  ['MWI','🇲🇼 Malawi'],['KEN','🇰🇪 Kenya'],['TZA','🇹🇿 Tanzania'],
  ['ZMB','🇿🇲 Zambia'],['ZAF','🇿🇦 South Africa'],['MOZ','🇲🇿 Mozambique'],
  ['BWA','🇧🇼 Botswana'],['ZWE','🇿🇼 Zimbabwe'],['UGA','🇺🇬 Uganda'],
  ['GHA','🇬🇭 Ghana'],['NGA','🇳🇬 Nigeria'],['ETH','🇪🇹 Ethiopia'],
]

async function handleRegister() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await client.post('/auth/register', form.value)
    userId.value = data.user_id
    step.value = 'otp'
  } catch (err) {
    const errs = err.response?.data?.errors
    error.value = errs ? Object.values(errs).flat()[0] : err.response?.data?.message || 'Registration failed'
  } finally { loading.value = false }
}

async function handleVerify() {
  error.value = ''
  loading.value = true
  try {
    await client.post('/auth/verify-phone', { user_id: userId.value, otp: otp.value })
    ui.success('Phone verified! You can now log in.')
    router.push('/login')
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid code'
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center;
  justify-content: center; padding: 20px;
}
.auth-container { width: 100%; max-width: 420px; }
.auth-logo { text-align: center; margin-bottom: 36px; }
.logo-icon {
  width: 56px; height: 56px; border-radius: 16px;
  background: var(--accent); display: flex; align-items: center;
  justify-content: center; margin: 0 auto 14px;
  font-size: 26px; font-weight: 700; color: #000;
}
.auth-logo h1 { font-size: 24px; font-weight: 700; letter-spacing: -0.03em; }
.auth-logo p  { color: var(--text-secondary); font-size: 14px; margin-top: 5px; }
.auth-card {
  background: var(--bg-card); border-radius: 20px;
  border: 1px solid var(--border); padding: 28px;
}
.field { margin-bottom: 16px; }
.field label {
  display: block; font-size: 12px; color: var(--text-secondary);
  margin-bottom: 6px; font-weight: 500;
}
.field select {
  width: 100%; padding: 11px 14px; background: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 10px;
  color: var(--text-primary); font-size: 14px;
  font-family: 'Sora', sans-serif; outline: none;
}
.otp-header { text-align: center; margin-bottom: 20px; }
.otp-icon   { font-size: 32px; display: block; margin-bottom: 10px; }
.otp-header p { color: var(--text-secondary); font-size: 13px; }
.auth-link { text-align: center; margin-top: 18px; }
.auth-link a { color: var(--accent); font-size: 13px; text-decoration: none; }
</style>
