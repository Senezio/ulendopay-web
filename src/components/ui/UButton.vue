<template>
  <button type="submit" :disabled="loading" class="btn" @click="$emit('click')">
    {{ loading ? 'Please wait...' : $slots.default?.()[0]?.children }}
  </button>
</template>

<script setup>
defineProps({ loading: Boolean })
defineEmits(['click'])
</script>

<style scoped>
.btn {
  width: 100%; padding: 13px; background: var(--accent);
  border: none; border-radius: 10px; color: #000;
  font-size: 14px; font-weight: 700; cursor: pointer;
  font-family: 'Sora', sans-serif; transition: opacity 0.15s; margin-top: 4px;
}
.btn:disabled { opacity: 0.7; cursor: not-allowed; }
.btn:hover:not(:disabled) { opacity: 0.9; }
</style>
