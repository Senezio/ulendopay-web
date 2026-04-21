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
          <input v-model="name" class="contact-form__input" type="text"
            placeholder="Your name" required />
        </div>
        <div class="contact-form__field">
          <label class="contact-form__label">Email address</label>
          <input v-model="email" class="contact-form__input" type="email"
            placeholder="you@example.com" required />
        </div>
        <div class="contact-form__field">
          <label class="contact-form__label">Message</label>
          <textarea v-model="message" class="contact-form__input contact-form__textarea"
            rows="5" placeholder="How can we help?" required></textarea>
        </div>
        <button type="submit" class="btn-primary">Send message</button>
        <p class="contact-form__note">
          You can also reach us at
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

const name    = ref('')
const email   = ref('')
const message = ref('')
const sent    = ref(false)

function submit() {
  if (!name.value || !email.value || !message.value) return
  sent.value = true
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

.contact-wrap { width: 100%; max-width: 520px; }

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
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
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
  padding: 11px 14px;
  font-size: 14px;
  font-family: inherit;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
  background: var(--bg-elevated);
  color: var(--text-primary);
  width: 100%;
  box-sizing: border-box;
}
.contact-form__input:focus { border-color: var(--accent); }
.contact-form__input::placeholder { color: var(--text-muted); }

.contact-form__textarea {
  resize: vertical;
  min-height: 120px;
  line-height: 1.5;
}

.contact-form__note {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
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

/* ── Success ─────────────────────────────────── */
.contact-success {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.contact-success__icon {
  font-size: 52px;
  color: var(--success);
  line-height: 1;
  margin-bottom: 8px;
}
.contact-success h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.contact-success p {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* ── Secure Footer ───────────────────────────── */
.auth-secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-muted);
}
</style>
