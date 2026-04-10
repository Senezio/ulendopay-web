<template>
  <div class="field">
    <label>{{ label }}</label>
    <input v-bind="$attrs" :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="focused = true" @blur="focused = false"
      :style="[{ borderColor: focused ? 'var(--accent)' : 'var(--border)' }, inputStyle]" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps(['label', 'modelValue', 'inputStyle'])
defineEmits(['update:modelValue'])
defineOptions({ inheritAttrs: false })
const focused = ref(false)
</script>

<style scoped>
.field { margin-bottom: 16px; }
label  { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 500; }
input  {
  width: 100%; padding: 11px 14px; background: var(--bg-elevated);
  border: 1px solid var(--border); border-radius: 10px;
  color: var(--text-primary); font-size: 14px;
  font-family: 'Sora', sans-serif; outline: none; transition: border-color 0.15s;
}
</style>
