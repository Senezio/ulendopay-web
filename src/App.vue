<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup>
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
@import '@fortawesome/fontawesome-free/css/all.min.css';

:root {
  --bg:             #ffffff;
  --bg-alt:         #f9fafb;
  --bg-elevated:    #f3f4f6;
  --border:         #e5e7eb;
  --border-focus:   #e85d04;
  --text-primary:   #111827;
  --text-secondary: #6b7280;
  --text-muted:     #9ca3af;
  --accent:         #e85d04;
  --accent-hover:   #d05204;
  --accent-dim:     #fff3ec;
  --danger:         #dc2626;
  --danger-bg:      #fef2f2;
  --success:        #16a34a;
  --success-bg:     #f0fdf4;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --accent-amber: #b45309;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
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
  to   { opacity: 1; transform: translateY(0); }
}
.fade-up   { animation: fadeUp 0.3s ease both; }
.fade-up-1 { animation: fadeUp 0.3s 0.07s ease both; }
.fade-up-2 { animation: fadeUp 0.3s 0.14s ease both; }
.fade-up-3 { animation: fadeUp 0.3s 0.21s ease both; }
</style>
