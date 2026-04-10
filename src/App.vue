<template>
  <RouterView />
  <ToastContainer />
</template>

<script setup>
import ToastContainer from '@/components/ui/ToastContainer.vue'
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
@import '@fortawesome/fontawesome-free/css/all.min.css';

:root {
  --bg-primary:   #0a0a0f;
  --bg-secondary: #111118;
  --bg-card:      #16161f;
  --bg-elevated:  #1c1c28;
  --accent:       #00e88f;
  --accent-dim:   #00e88f22;
  --accent-blue:  #4f8eff;
  --accent-amber: #ffb938;
  --text-primary: #f0f0f5;
  --text-secondary: #8888aa;
  --text-muted:   #44445a;
  --border:       #ffffff0f;
  --danger:       #ff4444;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Sora', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}

.mono { font-family: 'DM Mono', monospace; }

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 2px; }

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-up   { animation: fadeUp 0.35s ease both; }
.fade-up-1 { animation: fadeUp 0.35s 0.08s ease both; }
.fade-up-2 { animation: fadeUp 0.35s 0.16s ease both; }
.fade-up-3 { animation: fadeUp 0.35s 0.24s ease both; }

@keyframes pulse-green {
  0%, 100% { box-shadow: 0 0 0 0 #00e88f44; }
  50%       { box-shadow: 0 0 0 10px #00e88f00; }
}
</style>
