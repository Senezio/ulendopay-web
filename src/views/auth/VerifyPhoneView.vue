<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card fade-up">
        <div class="otp-header">
          <span>📱</span>
          <h2>Verify your phone</h2>
          <p>Enter the 6-digit code we sent you</p>
        </div>
        <form @submit.prevent="handleVerify">
          <UField label="Verification Code" type="text" v-model="otp"
            placeholder="000000" maxlength="6"
            :style="{ textAlign: 'center', letterSpacing: '8px', fontSize: '20px' }" />
          <UError v-if="error" :message="error" />
          <UButton :loading="loading">Verify</UButton>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import client from '@/api/client'
import UField  from '@/components/ui/UField.vue'
import UButton from '@/components/ui/UButton.vue'
import UError  from '@/components/ui/UError.vue'

const router = useRouter()
const route  = useRoute()
const otp    = ref('')
const error  = ref('')
const loading = ref(false)

async function handleVerify() {
  error.value = ''
  loading.value = true
  try {
    await client.post('/auth/verify-phone', {
      user_id: route.query.user_id,
      otp: otp.value,
    })
    router.push('/login')
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
