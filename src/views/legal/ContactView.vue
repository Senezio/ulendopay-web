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

<template>
  <div class="contact-page">
    <div class="contact-wrap">
      <div class="contact-header">
        <RouterLink to="/" class="contact-back">← Back to Ulendo Pay</RouterLink>
        <h1>Contact us</h1>
        <p>Have a question or need help? We would love to hear from you.</p>
      </div>

      <div v-if="sent" class="contact-success">
        <div class="contact-success__icon">✓</div>
        <h2>Message received</h2>
        <p>Thanks for reaching out. We will get back to you within 24 hours.</p>
        <RouterLink to="/" class="btn-primary">Back to home</RouterLink>
      </div>

      <form v-else class="contact-form" @submit.prevent="submit">
        <div class="contact-form__field">
          <label>Full name</label>
          <input v-model="name" type="text" placeholder="Your name" required />
        </div>
        <div class="contact-form__field">
          <label>Email address</label>
          <input v-model="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="contact-form__field">
          <label>Message</label>
          <textarea v-model="message" rows="5" placeholder="How can we help?" required></textarea>
        </div>
        <button type="submit" class="btn-primary btn-primary--lg">Send message</button>
        <p class="contact-form__note">
          You can also reach us at
          <a href="mailto:support@ulendopay.com">support@ulendopay.com</a>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.contact-page {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 24px 80px;
  font-family: "DM Sans", "Helvetica Neue", Arial, sans-serif;
}

.contact-wrap { width: 100%; max-width: 520px; }
.contact-header { margin-bottom: 36px; }

.contact-back {
  display: inline-block;
  font-size: 13px;
  color: var(--text-muted);
  text-decoration: none;
  margin-bottom: 20px;
  transition: color 0.15s;
}
.contact-back:hover { color: var(--text); }

.contact-header h1 {
  font-size: 28px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
  margin-bottom: 8px;
}

.contact-header p {
  font-size: 15px;
  color: var(--text-secondary);
}

.contact-form {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contact-form__field { display: flex; flex-direction: column; gap: 6px; }

.contact-form__field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.contact-form__field input,
.contact-form__field textarea {
  padding: 10px 14px;
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 6px;
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s;
  resize: vertical;
  background: var(--bg);
  color: var(--text);
}

.contact-form__field input:focus,
.contact-form__field textarea:focus {
  border-color: var(--accent);
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

.btn-primary {
  display: inline-block;
  padding: 13px 28px;
  font-size: 15px;
  font-weight: 600;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.15s;
  text-align: center;
}

.btn-primary:hover { filter: brightness(0.9); }
.btn-primary--lg { width: 100%; }

.contact-success {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.contact-success__icon {
  width: 48px;
  height: 48px;
  background: rgba(34,197,94,0.15);
  color: #22c55e;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 8px;
}

.contact-success h2 { font-size: 20px; font-weight: 700; color: var(--text); }
.contact-success p { font-size: 14px; color: var(--text-secondary); margin-bottom: 8px; }
</style>

