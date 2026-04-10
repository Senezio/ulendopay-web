<template>
  <div class="landing">

    <!-- ── Navbar ─────────────────────────────────────────────────────────── -->
    <header class="navbar" :class="{ 'navbar--scrolled': scrolled }">
      <div class="navbar__inner">
        <!-- Logo -->
        <RouterLink to="/" class="navbar__logo">
          <div class="navbar__logo-mark">U</div>
          <span>Ulendo <strong>Pay</strong></span>
        </RouterLink>

        <!-- Desktop nav links -->
        <nav class="navbar__links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#security">Security</a>
        </nav>

        <!-- Desktop CTAs -->
        <div class="navbar__actions">
          <RouterLink to="/login" class="btn-ghost">Sign in</RouterLink>
          <RouterLink to="/register" class="btn-primary">Create account</RouterLink>
        </div>

        <!-- Mobile: sign in + hamburger -->
        <div class="navbar__mobile-actions">
          <RouterLink to="/login" class="btn-ghost btn-ghost--sm">Sign in</RouterLink>
          <button class="hamburger" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      <!-- Mobile dropdown -->
      <div class="mobile-menu" :class="{ open: menuOpen }">
        <a href="#features"     @click="menuOpen = false">Features</a>
        <a href="#how-it-works" @click="menuOpen = false">How it works</a>
        <a href="#security"     @click="menuOpen = false">Security</a>
      </div>
    </header>

    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="hero">
      <div class="container">
        <div class="hero__tag">Available across Sub-Saharan Africa</div>
        <h1 class="hero__headline">
          Send money across Africa.<br />
          <span>Instantly. Securely.</span>
        </h1>
        <p class="hero__sub">
          Ulendo Pay lets individuals and families send money between African countries
          at official exchange rates — with no hidden fees.
        </p>
        <div class="hero__actions">
          <RouterLink to="/register" class="btn-primary btn-primary--lg">Create account</RouterLink>
          <RouterLink to="/login"    class="btn-outline btn-outline--lg">Sign in</RouterLink>
        </div>
        <div class="hero__disclaimer">
          No subscription required. Free to register.
        </div>
      </div>
    </section>

    <!-- ── Trust bar ─────────────────────────────────────────────────────── -->
    <section class="trust-bar">
      <div class="container trust-bar__inner">
        <div v-for="t in trustPoints" :key="t.label" class="trust-item">
          <span class="trust-item__icon">{{ t.icon }}</span>
          <div>
            <div class="trust-item__label">{{ t.label }}</div>
            <div class="trust-item__desc">{{ t.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How it works ──────────────────────────────────────────────────── -->
    <section id="how-it-works" class="section">
      <div class="container">
        <div class="section__label">HOW IT WORKS</div>
        <h2 class="section__title">Three steps to send money</h2>
        <div class="steps-grid">
          <div v-for="(step, i) in steps" :key="step.title" class="step-card">
            <div class="step-card__num">{{ String(i + 1).padStart(2, '0') }}</div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ──────────────────────────────────────────────────────── -->
    <section id="features" class="section section--alt">
      <div class="container">
        <div class="section__label">FEATURES</div>
        <h2 class="section__title">Built for real transfers</h2>
        <div class="features-grid">
          <div v-for="f in features" :key="f.title" class="feature-card">
            <div class="feature-card__icon">{{ f.icon }}</div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Security ──────────────────────────────────────────────────────── -->
    <section id="security" class="section">
      <div class="container security-grid">
        <div class="security__text">
          <div class="section__label">SECURITY</div>
          <h2 class="section__title">Your money is protected</h2>
          <p class="security__body">
            Every transaction on Ulendo Pay goes through multiple layers of verification.
            Your PIN is never stored in plain text. All sensitive data is encrypted at rest
            and in transit using industry-standard protocols.
          </p>
          <ul class="security__list">
            <li v-for="s in securityPoints" :key="s">
              <span>✓</span> {{ s }}
            </li>
          </ul>
        </div>
        <div class="security__visual">
          <div class="security__card">
            <div class="security__card-row">
              <span>Transfer protected</span>
              <span class="badge badge--green">Active</span>
            </div>
            <div class="security__card-row security__card-row--muted">
              <span>Double-entry ledger</span>
              <span class="badge badge--green">Enabled</span>
            </div>
            <div class="security__card-row security__card-row--muted">
              <span>2FA verification</span>
              <span class="badge badge--green">Required</span>
            </div>
            <div class="security__card-row security__card-row--muted">
              <span>KYC identity check</span>
              <span class="badge badge--green">Enforced</span>
            </div>
            <div class="security__card-divider"></div>
            <div class="security__card-status">
              All systems operational
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA Section ────────────────────────────────────────────────────── -->
    <section class="cta-section">
      <div class="container cta-section__inner">
        <h2>Ready to send money?</h2>
        <p>Join thousands of people already using Ulendo Pay to support their families across Africa.</p>
        <RouterLink to="/register" class="btn-primary btn-primary--lg">Create a free account</RouterLink>
        <div class="cta-section__note">No card required. Takes less than 2 minutes.</div>
      </div>
    </section>

    <!-- ── Footer ─────────────────────────────────────────────────────────── -->
    <footer class="footer">
      <div class="container footer__inner">
        <div class="footer__brand">
          <div class="navbar__logo-mark navbar__logo-mark--sm">U</div>
          <span>Ulendo Pay</span>
        </div>
        <div class="footer__links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
          <a href="#">Contact</a>
        </div>
        <div class="footer__copy">© {{ new Date().getFullYear() }} Ulendo Pay. All rights reserved.</div>
      </div>
    </footer>

    <!-- ── Mobile sticky CTA ──────────────────────────────────────────────── -->
    <div class="sticky-cta">
      <RouterLink to="/register" class="btn-primary btn-primary--full">Create account</RouterLink>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const menuOpen = ref(false)
const scrolled = ref(false)

function onScroll() { scrolled.value = window.scrollY > 20 }
onMounted(()    => window.addEventListener('scroll', onScroll))
onUnmounted(()  => window.removeEventListener('scroll', onScroll))

const trustPoints = [
  { icon: '⏱', label: 'Fast transfers',    desc: 'Most transfers complete within minutes' },
  { icon: '📊', label: 'Official rates',    desc: 'Rates sourced from central banks' },
  { icon: '🔒', label: 'Secure by design',  desc: 'KYC verified, PIN protected, encrypted' },
  { icon: '🌍', label: 'Pan-African',        desc: 'Supported across Sub-Saharan Africa' },
]

const steps = [
  { title: 'Create your account',     desc: 'Register with your phone number and verify your identity. Takes less than 2 minutes.' },
  { title: 'Add a recipient',          desc: 'Enter the recipient\'s mobile money number or bank account. Save them for future transfers.' },
  { title: 'Send and track',           desc: 'Enter the amount, confirm the rate, and send. Track your transfer in real time.' },
]

const features = [
  { icon: '↗', title: 'Send money',         desc: 'Transfer to mobile money accounts and bank accounts across Africa at transparent rates.' },
  { icon: '📈', title: 'Live exchange rates', desc: 'Rates are pulled directly from official central bank sources. No inflated margins.' },
  { icon: '🧾', title: 'Transaction history', desc: 'Every transfer is logged with a unique reference number and full status tracking.' },
  { icon: '🔑', title: 'PIN & 2FA login',    desc: 'Log in using your phone number and PIN. Every session requires a one-time verification code.' },
  { icon: '📋', title: 'KYC verification',   desc: 'Submit your national ID or passport once. Verified accounts get higher transfer limits.' },
  { icon: '💬', title: 'SMS notifications',  desc: 'Receive SMS updates for every transfer — initiated, completed, or refunded.' },
]

const securityPoints = [
  'Phone numbers are encrypted and hashed at rest',
  'PINs are never stored in plain text',
  'All transfers use escrow with double-entry ledger',
  'Every login requires a 6-digit OTP',
  'KYC identity verification required for all users',
]
</script>

<style scoped>
/* ── Base ──────────────────────────────────────────────────────────────── */
.landing {
  font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
  color: #1a1a1a;
  background: #fff;
  line-height: 1.6;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ── Navbar ────────────────────────────────────────────────────────────── */
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #fff;
  border-bottom: 1px solid transparent;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.navbar--scrolled {
  border-bottom-color: #e5e5e5;
  box-shadow: 0 1px 6px rgba(0,0,0,0.06);
}
.navbar__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  gap: 32px;
}
.navbar__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #1a1a1a;
  font-size: 16px;
  white-space: nowrap;
}
.navbar__logo-mark {
  width: 30px; height: 30px;
  background: #e85d04;
  color: #fff;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800;
  flex-shrink: 0;
}
.navbar__logo-mark--sm { width: 24px; height: 24px; font-size: 12px; border-radius: 5px; }
.navbar__logo strong { font-weight: 700; }

.navbar__links {
  display: flex;
  gap: 28px;
  flex: 1;
}
.navbar__links a {
  font-size: 14px;
  color: #555;
  text-decoration: none;
  transition: color 0.15s;
}
.navbar__links a:hover { color: #1a1a1a; }

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.navbar__mobile-actions {
  display: none;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

/* Buttons */
.btn-ghost {
  padding: 8px 16px;
  font-size: 14px;
  color: #333;
  text-decoration: none;
  border: 1px solid #d4d4d4;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, background 0.15s;
}
.btn-ghost:hover { border-color: #aaa; background: #f7f7f7; }
.btn-ghost--sm { padding: 6px 12px; font-size: 13px; }

.btn-primary {
  display: inline-block;
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 600;
  background: #e85d04;
  color: #fff;
  text-decoration: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s;
}
.btn-primary:hover { background: #d05204; }
.btn-primary--lg   { padding: 13px 28px; font-size: 15px; }
.btn-primary--full { width: 100%; text-align: center; border-radius: 8px; padding: 14px; }

.btn-outline {
  display: inline-block;
  padding: 9px 20px;
  font-size: 14px;
  font-weight: 500;
  background: transparent;
  color: #333;
  text-decoration: none;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: border-color 0.15s, background 0.15s;
}
.btn-outline:hover { border-color: #888; background: #f7f7f7; }
.btn-outline--lg   { padding: 13px 28px; font-size: 15px; }

/* Hamburger */
.hamburger {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  background: none;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
}
.hamburger span {
  display: block;
  width: 18px;
  height: 2px;
  background: #333;
  border-radius: 2px;
}

/* Mobile menu */
.mobile-menu {
  display: none;
  flex-direction: column;
  padding: 8px 24px 14px;
  border-top: 1px solid #eee;
  gap: 2px;
}
.mobile-menu.open { display: flex; }
.mobile-menu a {
  padding: 10px 0;
  font-size: 15px;
  color: #333;
  text-decoration: none;
  border-bottom: 1px solid #f0f0f0;
}
.mobile-menu a:last-child { border-bottom: none; }

/* ── Hero ──────────────────────────────────────────────────────────────── */
.hero {
  padding: 80px 0 72px;
  border-bottom: 1px solid #efefef;
}
.hero__tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 20px;
}
.hero__headline {
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: #111;
  margin-bottom: 18px;
}
.hero__headline span { color: #e85d04; }
.hero__sub {
  font-size: 17px;
  color: #555;
  max-width: 520px;
  margin-bottom: 36px;
  line-height: 1.65;
}
.hero__actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.hero__disclaimer {
  font-size: 13px;
  color: #999;
}

/* ── Trust bar ─────────────────────────────────────────────────────────── */
.trust-bar {
  background: #fafafa;
  border-bottom: 1px solid #efefef;
  padding: 32px 0;
}
.trust-bar__inner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}
.trust-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.trust-item__icon { font-size: 20px; margin-top: 2px; flex-shrink: 0; }
.trust-item__label { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.trust-item__desc  { font-size: 13px; color: #777; margin-top: 2px; }

/* ── Sections ──────────────────────────────────────────────────────────── */
.section     { padding: 80px 0; }
.section--alt { background: #fafafa; border-top: 1px solid #efefef; border-bottom: 1px solid #efefef; }

.section__label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #e85d04;
  text-transform: uppercase;
  margin-bottom: 10px;
}
.section__title {
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 800;
  color: #111;
  letter-spacing: -0.02em;
  margin-bottom: 40px;
}

/* ── Steps ─────────────────────────────────────────────────────────────── */
.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: #e5e5e5;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  overflow: hidden;
}
.step-card {
  background: #fff;
  padding: 32px;
}
.step-card__num {
  font-size: 28px;
  font-weight: 800;
  color: #e5e5e5;
  margin-bottom: 16px;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.03em;
}
.step-card h3 { font-size: 16px; font-weight: 700; color: #111; margin-bottom: 8px; }
.step-card p  { font-size: 14px; color: #666; line-height: 1.6; }

/* ── Features ──────────────────────────────────────────────────────────── */
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.feature-card {
  padding: 24px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}
.feature-card__icon {
  font-size: 22px;
  margin-bottom: 14px;
  display: block;
}
.feature-card h3 { font-size: 15px; font-weight: 700; color: #111; margin-bottom: 6px; }
.feature-card p  { font-size: 13px; color: #666; line-height: 1.6; }

/* ── Security ──────────────────────────────────────────────────────────── */
.security-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
}
.security__body {
  font-size: 15px;
  color: #555;
  line-height: 1.7;
  margin-bottom: 24px;
}
.security__list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.security__list li {
  display: flex;
  gap: 10px;
  font-size: 14px;
  color: #333;
}
.security__list li span { color: #e85d04; font-weight: 700; flex-shrink: 0; }

.security__visual { display: flex; justify-content: center; }
.security__card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 24px;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}
.security__card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 600;
  color: #111;
  border-bottom: 1px solid #f0f0f0;
}
.security__card-row--muted { font-weight: 400; color: #555; }
.security__card-row:last-of-type { border-bottom: none; }
.security__card-divider { height: 1px; background: #efefef; margin: 8px 0; }
.security__card-status {
  font-size: 12px;
  color: #888;
  text-align: center;
  padding-top: 4px;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  letter-spacing: 0.03em;
}
.badge--green { background: #e8f5e9; color: #2e7d32; }

/* ── CTA Section ────────────────────────────────────────────────────────── */
.cta-section {
  background: #111;
  padding: 80px 0;
}
.cta-section__inner {
  text-align: center;
}
.cta-section h2 {
  font-size: clamp(24px, 3.5vw, 36px);
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  margin-bottom: 12px;
}
.cta-section p {
  font-size: 16px;
  color: #aaa;
  max-width: 460px;
  margin: 0 auto 32px;
  line-height: 1.6;
}
.cta-section__note {
  margin-top: 14px;
  font-size: 13px;
  color: #666;
}

/* ── Footer ─────────────────────────────────────────────────────────────── */
.footer {
  padding: 32px 0;
  border-top: 1px solid #efefef;
}
.footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}
.footer__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}
.footer__links {
  display: flex;
  gap: 20px;
}
.footer__links a { font-size: 13px; color: #666; text-decoration: none; }
.footer__links a:hover { color: #111; }
.footer__copy { font-size: 12px; color: #aaa; }

/* ── Sticky mobile CTA ───────────────────────────────────────────────────── */
.sticky-cta {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #e5e5e5;
  z-index: 99;
}

/* ── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .navbar__links   { display: none; }
  .navbar__actions { display: none; }
  .navbar__mobile-actions { display: flex; }

  .trust-bar__inner   { grid-template-columns: 1fr 1fr; }
  .steps-grid         { grid-template-columns: 1fr; }
  .features-grid      { grid-template-columns: 1fr 1fr; }
  .security-grid      { grid-template-columns: 1fr; gap: 40px; }
  .security__visual   { order: -1; }

  .footer__inner { flex-direction: column; align-items: flex-start; gap: 12px; }
  .sticky-cta    { display: block; }

  /* Push content above sticky CTA */
  .footer { padding-bottom: 80px; }
}

@media (max-width: 480px) {
  .hero { padding: 56px 0 52px; }
  .trust-bar__inner { grid-template-columns: 1fr; }
  .features-grid    { grid-template-columns: 1fr; }
}
</style>
