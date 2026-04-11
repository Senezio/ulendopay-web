import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('ulendo_user') || 'null'))
  const token = ref(localStorage.getItem('ulendo_token') || null)
  const loading = ref(false)
  const pendingUserId = ref(null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isKycVerified   = computed(() => user.value?.kyc_status === 'verified')
  const isPhoneVerified = computed(() => !!user.value?.phone_verified)
  const isStaff         = computed(() => !!user.value?.is_staff)
  const role            = computed(() => user.value?.role ?? null)

  function setSession(newToken, newUser) {
    token.value = newToken
    user.value  = newUser
    localStorage.setItem('ulendo_token', newToken)
    localStorage.setItem('ulendo_user', JSON.stringify(newUser))
  }

  function clearSession() {
    token.value         = null
    user.value          = null
    pendingUserId.value = null
    localStorage.removeItem('ulendo_token')
    localStorage.removeItem('ulendo_user')
  }

  async function fetchMe() {
    try {
      const { data } = await authApi.me()
      user.value = data.user
      localStorage.setItem('ulendo_user', JSON.stringify(data.user))
    } catch {
      clearSession()
    }
  }

  async function logout() {
    try { await authApi.logout() } finally { clearSession() }
  }

  return {
    user, token, loading, pendingUserId,
    isAuthenticated, isKycVerified, isPhoneVerified, isStaff, role,
    setSession, clearSession, fetchMe, logout,
  }
})
