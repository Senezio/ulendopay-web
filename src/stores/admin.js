import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminApi } from '@/api/admin'

export const useAdminStore = defineStore('admin', () => {
  const stats       = ref(null)
  const loading     = ref(false)

  async function fetchStats() {
    loading.value = true
    try {
      const { data } = await adminApi.stats()
      stats.value = data
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, fetchStats }
})
