<template>
  <div class="legal-page">
    <nav class="legal-nav">
      <div class="nav-content">
        <RouterLink to="/" class="logo">
          <div class="logo-mark">U</div>
          <span>Ulendo <strong>Pay</strong></span>
        </RouterLink>
        <RouterLink to="/login" class="back-link">Sign In</RouterLink>
      </div>
    </nav>

    <main class="legal-content fade-up">
      <div class="content-box">
        <h1>{{ data.title }}</h1>
        <p class="last-updated">Last Updated: {{ data.lastUpdated }}</p>

        <section v-for="(section, index) in data.sections" :key="index">
          <h2>{{ section.h }}</h2>
          <p>{{ section.p }}</p>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
defineProps({
  data: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.legal-page { min-height: 100vh; background: #fff; }
.legal-nav { border-bottom: 1px solid var(--border); padding: 16px 24px; position: sticky; top: 0; background: #fff; z-index: 10; }
.nav-content { max-width: 800px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
.logo { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--text-primary); font-weight: 700; }
.logo-mark { width: 32px; height: 32px; background: var(--accent); color: #fff; border-radius: 6px; display: flex; align-items: center; justify-content: center; }
.back-link { color: var(--accent); text-decoration: none; font-size: 14px; font-weight: 600; }
.legal-content { padding: 60px 24px; }
.content-box { max-width: 800px; margin: 0 auto; }
h1 { font-size: 32px; font-weight: 800; color: #111; margin-bottom: 8px; }
.last-updated { font-size: 14px; color: var(--text-muted); margin-bottom: 40px; }
h2 { font-size: 20px; font-weight: 700; color: #111; margin-top: 32px; margin-bottom: 12px; }
p { line-height: 1.7; color: var(--text-secondary); margin-bottom: 16px; }
</style>
