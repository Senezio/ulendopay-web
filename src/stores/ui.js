import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])

  // ── Theme ──────────────────────────────────────────────────────────────────
  // 'system' | 'light' | 'dark'
  const theme = ref(localStorage.getItem('ulendo_theme') || 'system')

  function initTheme() {
    applyTheme(theme.value)
  }

  function applyTheme(value) {
    const root = document.documentElement
    if (value === 'dark') {
      root.setAttribute('data-theme', 'dark')
    } else if (value === 'light') {
      root.setAttribute('data-theme', 'light')
    } else {
      // system — remove override, let media query handle it
      root.removeAttribute('data-theme')
    }
  }

  function setTheme(value) {
    theme.value = value
    localStorage.setItem('ulendo_theme', value)
    applyTheme(value)
  }

  function toggleTheme() {
    // Cycle: system → light → dark → system
    const next = theme.value === 'system' ? 'light' : theme.value === 'light' ? 'dark' : 'system'
    setTheme(next)
  }

  const isDark = () => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

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

  return {
    toasts, addToast, removeToast, success, error, warning, info,
    theme, initTheme, setTheme, toggleTheme, isDark,
  }
})
