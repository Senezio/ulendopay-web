<template>
  <div class="error">
    <i class="fa-solid fa-circle-exclamation"></i>
    {{ message }}
  </div>
</template>
<script setup>
defineProps(['message'])
</script>
<style scoped>
.error {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; background: var(--danger-bg);
  border: 1px solid var(--danger-border); border-radius: 6px;
  color: var(--danger); font-size: 13px; margin-bottom: 16px;
}
.error i { font-size: 13px; flex-shrink: 0; }
</style>
