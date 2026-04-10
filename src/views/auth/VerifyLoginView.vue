<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card fade-up">
        <div class="otp-header">
          <span>🔐</span>
          <h2>Two-factor verification</h2>
          <p>Enter the 6-digit code sent to your phone</p>
        </div>
        <form @submit.prevent="handleVerify">
          <UField label="Verification Code" type="text" v-model="otp"
            placeholder="000000" maxlength="6"
            :style="{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }" />
          <UError v-if="error" :message="error" />
          <UButton :loading="loading">Verify & Sign In</UButton>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import client from '@/api/client'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'

const router = useRouter()
const route  = useRoute()
const auth   = useAuthStore()
const otp    = ref('')
const error  = ref('')
const loading = ref(false)

async function handleVerify() {
  error.value = ''
  loading.value = true
  try {
    const { data } = await client.post('/auth/verify-login', {
      user_id: route.query.user_id,
      otp: otp.value,
    })
    auth.setAuth(data.user, data.token)
    router.push(route.query.redirect || '/dashboard')
  } catch (err) {
    error.value = err.response?.data?.message || 'Invalid code'
  } finally { loading.value = false }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.auth-container { width: 100%; max-width: 380px; }
.auth-card { background: var(--bg-card); border-radius: 20px; border: 1px solid var(--border); padding: 28px; }
.otp-header { text-align: center; margin-bottom: 22px; }
.otp-header span { font-size: 36px; display: block; margin-bottom: 12px; }
.otp-header h2 { font-size: 20px; font-weight: 700; }
.otp-header p  { color: var(--text-secondary); font-size: 13px; margin-top: 5px; }
</style>
