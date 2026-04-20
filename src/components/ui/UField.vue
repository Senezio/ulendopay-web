<template>
  <div class="field">
    <label v-if="label">{{ label }}</label>
    <input
      v-bind="$attrs"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="focused = true"
      @blur="focused = false"
      :class="{ focused }"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps(['label', 'modelValue'])
defineEmits(['update:modelValue'])
defineOptions({ inheritAttrs: false })
const focused = ref(false)
</script>

<style scoped>
.field { margin-bottom: 16px; }
label {
  display: block; font-size: 13px; font-weight: 600;
  color: var(--text-primary); margin-bottom: 6px;
}
input {
  width: 100%; padding: 11px 14px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 14px;
  font-family: 'DM Sans', sans-serif;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input.focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(232, 93, 4, 0.1);
}
input::placeholder { color: var(--text-muted); }
</style>
