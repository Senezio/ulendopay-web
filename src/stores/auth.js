import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import client from '@/api/client'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)
  const isKycVerified   = computed(() => user.value?.kyc_status === 'verified')
  const isPhoneVerified = computed(() => !!user.value?.phone_verified)

  function setAuth(userData, authToken) {
    user.value  = userData
    token.value = authToken
    localStorage.setItem('token', authToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function updateUser(userData) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  async function logout() {
    try { await client.post('/auth/logout') } catch {}
    user.value  = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return { user, token, isAuthenticated, isKycVerified, isPhoneVerified, setAuth, updateUser, logout }
})
