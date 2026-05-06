<template>
  <component
    :is="link ? 'RouterLink' : 'div'"
    :to="link"
    class="stat-card"
    :class="[`stat-card--${color}`, { 'stat-card--link': link }]"
  >
    <div class="stat-card__top">
      <span class="stat-card__label">{{ label }}</span>
      <span class="stat-card__icon"><i :class="icon"></i></span>
    </div>
    <div class="stat-card__value">{{ value }}</div>
    <div v-if="link" class="stat-card__link-hint">
      View <i class="fa-sharp-duotone fa-solid fa-arrow-right"></i>
    </div>
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
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-decoration: none;
  transition: all 0.15s;
  min-width: 0;
}
.stat-card--link:hover {
  border-color: var(--accent);
  box-shadow: 0 2px 12px rgba(232,93,4,0.08);
}

.stat-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.stat-card__label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.3;
}
.stat-card__icon {
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.7;
}

.stat-card--blue   .stat-card__icon { color: #2563eb; }
.stat-card--green  .stat-card__icon { color: #16a34a; }
.stat-card--red    .stat-card__icon { color: #dc2626; }
.stat-card--amber  .stat-card__icon { color: #d97706; }
.stat-card--orange .stat-card__icon { color: var(--accent); }

.stat-card__value {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1;
  letter-spacing: -0.02em;
}

.stat-card__link-hint {
  font-size: 11px;
  font-weight: 600;
  color: var(--accent);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
.stat-card__link-hint i { font-size: 10px; }
</style>
