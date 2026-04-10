import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])

  function addToast(message, type = 'info', duration = 4000) {
    const id = Date.now()
    toasts.value.push({ id, message, type })
    setTimeout(() => removeToast(id), duration)
  }

  function removeToast(id) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  const success = (msg) => addToast(msg, 'success')
  const error   = (msg) => addToast(msg, 'error')
  const warning = (msg) => addToast(msg, 'warning')
  const info    = (msg) => addToast(msg, 'info')

  return { toasts, addToast, removeToast, success, error, warning, info }
})
