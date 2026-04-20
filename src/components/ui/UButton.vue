<template>
  <button
    :type="type || 'submit'"
    :disabled="loading"
    class="btn"
    :class="variant"
    @click="$emit('click')"
  >
    <span v-if="loading" class="spinner"></span>
    <span v-else><slot /></span>
  </button>
</template>

<script setup>
defineProps({ loading: Boolean, variant: String, type: String })
defineEmits(['click'])
</script>

<style scoped>
.btn {
  width: 100%; padding: 12px 20px;
  background: var(--accent); color: var(--text-inverse);
  border: none; border-radius: 6px;
  font-size: 15px; font-weight: 700;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: background 0.15s; margin-top: 6px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn:hover:not(:disabled) { background: var(--accent-hover); }
.btn:disabled { opacity: 0.65; cursor: not-allowed; }

.btn.outline {
  background: transparent; color: var(--text-primary);
  border: 1px solid var(--border);
}
.btn.outline:hover:not(:disabled) { background: var(--bg-alt); }

.spinner {
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
