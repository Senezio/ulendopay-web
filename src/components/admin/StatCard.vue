<template>
  <component
    :is="link ? 'RouterLink' : 'div'"
    :to="link"
    class="stat-card"
    :class="[`stat-card--${color}`, { 'stat-card--link': link }]"
  >
    <div class="stat-card__icon">
      <i :class="icon"></i>
    </div>
    <div class="stat-card__body">
      <div class="stat-card__value">{{ value }}</div>
      <div class="stat-card__label">{{ label }}</div>
    </div>
    <i v-if="link" class="fa-solid fa-arrow-right stat-card__arrow"></i>
  </component>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  icon:  String,
  color: { type: String, default: 'blue' },
  link:  { type: String, default: null },
  raw:   { type: Boolean, default: false },
})
</script>

<style scoped>
.stat-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
  padding: 16px 18px; display: flex; align-items: center;
  gap: 14px; text-decoration: none; transition: all 0.15s;
}
.stat-card--link:hover { border-color: var(--accent); box-shadow: 0 2px 12px rgba(232,93,4,0.1); }
.stat-card__icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0;
}
.stat-card--blue   .stat-card__icon { background: #eff6ff; color: #2563eb; }
.stat-card--green  .stat-card__icon { background: #f0fdf4; color: #16a34a; }
.stat-card--red    .stat-card__icon { background: #fef2f2; color: #dc2626; }
.stat-card--amber  .stat-card__icon { background: #fffbeb; color: #d97706; }
.stat-card--orange .stat-card__icon { background: #fff7ed; color: var(--accent); }

.stat-card__body { flex: 1; }
.stat-card__value { font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1; }
.stat-card__label { font-size: 12px; color: #64748b; margin-top: 4px; font-weight: 500; }
.stat-card__arrow { color: #cbd5e1; font-size: 12px; }
</style>
