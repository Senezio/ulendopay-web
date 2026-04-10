<template>
  <div class="error">{{ message }}</div>
</template>
<script setup>
defineProps(['message'])
</script>
<style scoped>
.error {
  padding: 10px 14px; background: #ff444411; border: 1px solid #ff444433;
  border-radius: 8px; color: #ff6666; font-size: 13px; margin-bottom: 16px;
}
</style>
