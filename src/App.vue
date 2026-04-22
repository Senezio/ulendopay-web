<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup>
import { onMounted } from 'vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const ui = useUiStore()
const auth = useAuthStore()

onMounted(() => {
  ui.initTheme()
  if (auth.isAuthenticated) auth.fetchMe()
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

:root {
  --bg: #ffffff;
  --bg-alt: #f9fafb;
  --bg-elevated: #f3f4f6;
  --bg-card: #ffffff;
  --bg-secondary: #ffffff;

  --border: #e5e7eb;
  --border-focus: #e85d04;

  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;

  --accent: #e85d04;
  --accent-hover: #d05204;
  --accent-dim: #fff3ec;
  --accent-amber: #b45309;

  --danger: #dc2626;
  --danger-bg: #fef2f2;

  --success: #16a34a;
  --success-bg: #f0fdf4;
  --text-inverse: #ffffff;
/* Global Icon Theming */  --fa-primary-color: #e85d04;  --fa-secondary-color: #f97316;  --fa-secondary-opacity: 0.4;  --fa-family: "Font Awesome 7 Sharp Duotone";  --fa-style-family-sharp-duotone: "Font Awesome 7 Sharp Duotone";
}

[data-theme="dark"] {
  --fa-secondary-opacity: 0.6;
  --bg: #0f1117;
  --bg-alt: #141720;
  --bg-elevated: #1c2030;
  --bg-card: #1a1f2e;
  --bg-secondary: #1a1f2e;

  --border: #2a3044;
  --border-focus: #e85d04;

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --accent: #e85d04;
  --accent-hover: #f06820;
  --accent-dim: #2a1a0e;
  --accent-amber: #f59e0b;

  --danger: #f87171;
  --danger-bg: #2d1515;

  --success: #4ade80;
  --success-bg: #0f2d1a;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { overflow-x: clip; max-width: 100%; }
body { max-width: 100%; }

body {
  transition: background-color 0.3s ease, color 0.3s ease;
  font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg);
  color: var(--text-primary);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.mono { font-family: 'DM Mono', monospace; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg-alt); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-up { animation: fadeUp 0.3s ease both; }
.fade-up-1 { animation: fadeUp 0.3s 0.07s ease both; }
.fade-up-2 { animation: fadeUp 0.3s 0.14s ease both; }
.fade-up-3 { animation: fadeUp 0.3s 0.21s ease both; }
i[class*='fa-duotone'], i[class*='fa-sharp-duotone'] {  --fa-primary-color: #e85d04;  --fa-secondary-color: #f97316;  --fa-secondary-opacity: 0.4;
  transition: color 0.3s ease, opacity 0.3s ease;}
.card, .navbar, .footer, section, div, input, select {  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;}
</style>
