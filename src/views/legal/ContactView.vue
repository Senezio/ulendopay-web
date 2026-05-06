<template>
  <div class="contact-page">
    <div class="contact-wrap">

      <!-- Brand -->
      <div class="contact-brand fade-up">
        <RouterLink to="/" class="brand-link">
          <img src="/logo.png" alt="UlendoPay" class="brand-logo" />
        </RouterLink>
      </div>

      <div class="contact-header fade-up-1">
        <RouterLink to="/" class="contact-back">
          <i class="fa-sharp-duotone fa-solid fa-arrow-left"></i> Back to Ulendo Pay
        </RouterLink>
        <h1>Contact us</h1>
        <p>Have a question or need help? We'd love to hear from you.</p>
      </div>

      <!-- Success state -->
      <div v-if="sent" class="contact-success fade-up-1">
        <div class="contact-success__icon">
          <i class="fa-sharp-duotone fa-solid fa-circle-check"></i>
        </div>
        <h2>Message received</h2>
        <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
        <RouterLink to="/" class="btn-primary">Back to home</RouterLink>
      </div>

      <!-- Form -->
      <form v-else class="contact-form fade-up-1" @submit.prevent="submit">
        <div class="contact-form__field">
          <label class="contact-form__label">Full name</label>
          <input v-model="form.name" class="contact-form__input" type="text"
            placeholder="Your name" required />
        </div>
        <div class="contact-form__field">
          <label class="contact-form__label">Email address</label>
          <input v-model="form.email" class="contact-form__input" type="email"
            placeholder="you@example.com" required />
        </div>
        <div class="contact-form__field">
          <label class="contact-form__label">Message</label>
          <textarea v-model="form.message" class="contact-form__input contact-form__textarea"
            rows="5" placeholder="How can we help?" required></textarea>
        </div>

        <div v-if="error" class="contact-form__error">{{ error }}</div>

        <button type="submit" class="btn-primary" :disabled="loading">
          <i v-if="loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
          <span v-else>Send message</span>
        </button>

        <p class="contact-form__note">
          Or email us directly at
          <a href="mailto:support@ulendopay.com">support@ulendopay.com</a>
        </p>
      </form>

      <div class="auth-secure fade-up-2">
        <i class="fa-sharp-duotone fa-solid fa-lock"></i> Secured with end-to-end encryption
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import client from '@/api/client'

const sent    = ref(false)
const loading = ref(false)
const error   = ref('')

const form = ref({
  name: '',
  email: '',
  message: '',
})

async function submit() {
  if (!form.value.name || !form.value.email || !form.value.message) return
  error.value = ''
  loading.value = true
  try {
    await client.post('/contact', form.value)
    sent.value = true
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to send message. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--bg-alt);
  padding: 48px 24px 80px;
  font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
}

.contact-wrap {
  width: 100%;
  max-width: 520px;
}

/* ── Brand ───────────────────────────────────── */
.contact-brand { margin-bottom: 28px; }
.brand-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}
.brand-logo {
  height: 48px;
  width: auto;
  display: block;
}

/* ── Header ──────────────────────────────────── */
.contact-header { margin-bottom: 32px; }

.contact-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  margin-bottom: 20px;
  transition: color 0.15s;
}
.contact-back:hover { color: var(--text-secondary); }

.contact-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}
.contact-header p {
  font-size: 15px;
  color: var(--text-secondary);
}

/* ── Form ────────────────────────────────────── */
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.contact-form__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.contact-form__input {
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  background: var(--bg-card);
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
}
.contact-form__input:focus { border-color: var(--accent); }
.contact-form__input::placeholder { color: var(--text-muted); }

.contact-form__textarea {
  resize: vertical;
  min-height: 140px;
  line-height: 1.6;
}

.contact-form__error {
  font-size: 13px;
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: 10px;
  padding: 12px 14px;
}

.contact-form__note {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
}
.contact-form__note a {
  color: var(--accent);
  text-decoration: none;
}
.contact-form__note a:hover { text-decoration: underline; }

/* ── Button ──────────────────────────────────── */
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 14px 28px;
  font-size: 15px;
  font-weight: 600;
  background: var(--accent);
  color: #ffffff;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s;
  font-family: inherit;
}
.btn-primary:hover { opacity: 0.9; }
.btn-primary:active { opacity: 0.85; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Success ─────────────────────────────────── */
.contact-success {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 0;
}
.contact-success__icon {
  font-size: 56px;
  color: var(--success);
  line-height: 1;
  margin-bottom: 8px;
}
.contact-success h2 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}
.contact-success p {
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* ── Secure Footer ───────────────────────────── */
.auth-secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 32px;
  font-size: 12px;
  color: var(--text-muted);
}

/* ── Responsive ──────────────────────────────── */
@media (max-width: 480px) {
  .contact-page { padding: 32px 16px 60px; }
  .contact-header h1 { font-size: 24px; }
  .contact-form__input { font-size: 16px; }
}
</style>
