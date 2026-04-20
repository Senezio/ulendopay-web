<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          @click="ui.removeToast(toast.id)"
        >
          <i :class="iconClass(toast.type)" class="toast__icon"></i>
          <span class="toast__message">{{ toast.message }}</span>
          <i class="fa-solid fa-xmark toast__close"></i>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

function iconClass(type) {
  return {
    success: 'fa-solid fa-circle-check',
    error: 'fa-solid fa-circle-xmark',
    warning: 'fa-solid fa-triangle-exclamation',
    info: 'fa-solid fa-circle-info',
  }[type] || 'fa-solid fa-circle-info'
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 360px;
  width: calc(100vw - 3rem);
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  font-size: 0.9rem;
  font-weight: 500;
}

.toast--success { background: #1B4332; color: var(--text-inverse); }
.toast--error   { background: #7F1D1D; color: var(--text-inverse); }
.toast--warning { background: #78350F; color: var(--text-inverse); }
.toast--info    { background: #1E3A5F; color: var(--text-inverse); }

.toast__icon { font-size: 1.1rem; flex-shrink: 0; }
.toast__message { flex: 1; }
.toast__close { opacity: 0.6; font-size: 0.85rem; }

.toast-enter-active,
.toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateY(1rem); }
.toast-leave-to   { opacity: 0; transform: translateX(100%); }
</style>
