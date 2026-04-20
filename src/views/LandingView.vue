<template>
  <div class="landing">

    <!-- ── Navbar ─────────────────────────────────────────────────────────── -->
    <header class="navbar" :class="{ 'navbar--scrolled': scrolled }">
      <div class="navbar__inner">
        <!-- Logo -->
        <RouterLink to="/" class="navbar__logo">
          <img src="/logo.png" alt="Logo" style="height: 40px; width: auto; display: block;">
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
    <!-- ── Hero ──────────────────────────────────────────────────────────── -->
    <section class="hero" :style="{ backgroundImage: `url(${bannerImage})` }">
      <div class="hero__overlay"></div>
      <div class="container hero__content">
        <div class="hero__tag hero-animate">Available across Sub-Saharan Africa</div>
        <h1 class="hero__headline hero-animate">
          Send money across Africa.<br />
          <span>Instantly. Securely.</span>
        </h1>
        <p class="hero__sub hero-animate">
          Ulendo Pay lets individuals and families send money between African countries
          at official exchange rates — with no hidden fees.
        </p>
        <div class="hero__actions hero-animate">
          <RouterLink to="/register" class="btn-primary btn-primary--lg">Create account</RouterLink>
          <RouterLink to="/login"    class="btn-outline btn-outline--lg btn-outline--light">Sign in</RouterLink>
        </div>
        <div class="hero__disclaimer hero-animate">
          No subscription required. Free to register.
        </div>
      </div>
    </section>


    <!-- ── Fee Calculator ───────────────────────────────────────────────────── -->
    <section class="calculator-section reveal">
      <div class="container">
        <div class="calc-card">
          <div class="calc-card__header">
            <div class="calc-card__title">How much will it cost?</div>
            <div class="calc-card__sub">Get a live estimate — no account needed</div>
          </div>
          <div class="calc-card__body">
            <div class="calc-row">
              <div class="calc-field">
                <label>You send</label>
                <div class="calc-input-wrap">
                  <input v-model.number="calcAmount" type="number" min="1" placeholder="5,000" @input="debouncedCalc" />
                  <select v-model="calcFrom" @change="runCalc">
                    <option v-for="c in calcCurrencies" :key="c">{{ c }}</option>
                  </select>
                </div>
              </div>
              <div class="calc-arrow"><i class="fa-sharp-duotone fa-solid fa-chevron-right"></i></div>
              <div class="calc-field">
                <label>They receive</label>
                <div class="calc-input-wrap calc-input-wrap--receive">
                  <div class="calc-receive-amount">
                    <span v-if="calcLoading"><i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i></span>
                    <span v-else-if="calcResult">{{ formatCalc(calcResult.receive_amount) }}</span>
                    <span v-else class="calc-placeholder">—</span>
                  </div>
                  <select v-model="calcTo" @change="runCalc">
                    <option v-for="c in calcCurrencies.filter(c => c !== calcFrom)" :key="c">{{ c }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div v-if="calcResult" class="calc-breakdown">
              <div class="calc-breakdown__row">
                <span>Fee ({{ calcResult.fee_percent }}%)</span>
                <span>{{ calcFrom }} {{ formatCalc(calcResult.fee_amount) }}</span>
              </div>
              <div class="calc-breakdown__row">
                <span>Exchange rate</span>
                <span>1 {{ calcFrom }} = {{ calcResult.exchange_rate }} {{ calcTo }}</span>
              </div>
              <div class="calc-breakdown__row calc-breakdown__row--total">
                <span>They receive</span>
                <span class="accent">{{ calcTo }} {{ formatCalc(calcResult.receive_amount) }}</span>
              </div>
                Rates updated daily from official central bank sources
              </div>
            </div>

            <div v-if="calcError" class="calc-error">{{ calcError }}</div>

            <RouterLink to="/register" class="btn-primary btn-primary--full calc-cta">
              Send money at this rate →
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Trust bar ─────────────────────────────────────────────────────── -->
    <section class="trust-bar reveal">
      <div class="container trust-bar__inner">
        <div v-for="t in trustPoints" :key="t.label" class="trust-item stagger-item">
          <span class="trust-item__icon"><i :class="t.iconClass"></i></span>
          <div>
            <div class="trust-item__label">{{ t.label }}</div>
            <div class="trust-item__desc">{{ t.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How it works ──────────────────────────────────────────────────── -->
    <section id="how-it-works" class="section reveal reveal--left">
      <div class="container">
        <div class="section__label reveal reveal--scale">HOW IT WORKS</div>
        <h2 class="section__title reveal reveal--scale">Three steps to send money</h2>
        <div class="steps-grid stagger-children">
          <div v-for="(step, i) in steps" :key="step.title" class="step-card stagger-item">
            <div class="step-card__num">{{ String(i + 1).padStart(2, '0') }}</div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Features ──────────────────────────────────────────────────────── -->
    <section id="features" class="section section--alt reveal reveal--right">
      <div class="container">
        <div class="section__label reveal reveal--scale">FEATURES</div>
        <h2 class="section__title reveal reveal--scale">Built for real transfers</h2>
        <div class="features-grid stagger-children">
          <div v-for="f in features" :key="f.title" class="feature-card stagger-item">
            <div class="feature-card__icon"><i :class="f.iconClass"></i></div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Security ──────────────────────────────────────────────────────── -->
    <section id="security" class="section reveal reveal--left">
      <div class="container security-grid">
        <div class="security__text">
          <div class="section__label reveal reveal--scale">SECURITY</div>
          <h2 class="section__title reveal reveal--scale">Your money is protected</h2>
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
    <section class="cta-section" :style="{ backgroundImage: `linear-gradient(rgba(0,0,0,0.78), rgba(0,0,0,0.78)), url(${ctaBannerImage})` }">
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
          <img src="/logo.png" alt="Logo" style="height: 32px; width: auto; display: block;">
          <span>Ulendo Pay</span>
        </div>
        <div class="footer__links">
          <RouterLink to="/privacy">Privacy Policy</RouterLink>
          <RouterLink to="/terms">Terms of Service</RouterLink>
          <RouterLink to="/contact">Contact</RouterLink>
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
import bannerImage from '../assets/banner3.png'
import ctaBannerImage from '../assets/banner2.png'

const menuOpen = ref(false)
const scrolled = ref(false)

function onScroll() {
  scrolled.value = window.scrollY > 20

  // Reveal sections with direction variants
  document.querySelectorAll('.reveal, .reveal--left, .reveal--right, .reveal--scale').forEach(el => {
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight - 60) {
      el.classList.add('revealed')
    }
  })

  // Staggered children
  document.querySelectorAll('.stagger-children').forEach(parent => {
    const rect = parent.getBoundingClientRect()
    if (rect.top < window.innerHeight - 60) {
      parent.querySelectorAll('.stagger-item').forEach((el, i) => {
        setTimeout(() => el.classList.add('stagger-in'), i * 100)
      })
    }
  })

  // Parallax hero
  const hero = document.querySelector('.hero')
  if (hero) {
    const offset = window.scrollY * 0.3
    hero.style.backgroundPositionY = `calc(50% + ${offset}px)`
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  // Animate hero content on load
  setTimeout(() => {
    document.querySelectorAll('.hero__tag, .hero__headline, .hero__sub, .hero__actions, .hero__disclaimer').forEach((el, i) => {
      setTimeout(() => el.classList.add('hero-in'), i * 120)
    })
  }, 100)
  setTimeout(() => onScroll(), 200)
  runCalc()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

// Calculator
const calcAmount    = ref(5000)
const calcFrom      = ref('MWK')
const calcTo        = ref('ZMW')
const calcResult    = ref(null)
const calcLoading   = ref(false)
const calcError     = ref('')
const calcCurrencies = ['MWK', 'ZMW', 'KES', 'TZS', 'UGX', 'ZAR', 'GHS', 'MZN', 'RWF', 'ETB']
let calcTimer = null

function formatCalc(v) {
  return Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function runCalc() {
  if (!calcAmount.value || calcAmount.value < 1) return
  calcLoading.value = true
  calcError.value = ''
  try {
    const res = await fetch(`/api/v1/calculator?from_currency=${calcFrom.value}&to_currency=${calcTo.value}&amount=${calcAmount.value}`)
    const data = await res.json()
    if (data.message) {
      calcError.value = data.message
      calcResult.value = null
    } else {
      calcResult.value = data
    }
  } catch {
    calcError.value = 'Could not fetch rate. Please try again.'
  } finally {
    calcLoading.value = false
  }
}

function debouncedCalc() {
  clearTimeout(calcTimer)
  calcTimer = setTimeout(runCalc, 500)
}

const trustPoints = [
  { iconClass: 'fa-sharp-duotone fa-sharp-duotone fa-solid fa-clock', label: 'Fast transfers',    desc: 'Most transfers complete within minutes' },
  { iconClass: 'fa-sharp-duotone fa-sharp-duotone fa-solid fa-chart-trend-up', label: 'Official rates',    desc: 'Rates sourced from central banks' },
  { iconClass: 'fa-sharp-duotone fa-sharp-duotone fa-solid fa-shield-check', label: 'Secure by design',  desc: 'KYC verified, PIN protected, encrypted' },
  { iconClass: 'fa-sharp-duotone fa-sharp-duotone fa-solid fa-earth-africa', label: 'Pan-African',        desc: 'Supported across Sub-Saharan Africa' },
]

const steps = [
  { title: 'Create your account',     desc: 'Register with your phone number and verify your identity. Takes less than 2 minutes.' },
  { title: 'Add a recipient',          desc: 'Enter the recipient\'s mobile money number or bank account. Save them for future transfers.' },
  { title: 'Send and track',           desc: 'Enter the amount, confirm the rate, and send. Track your transfer in real time.' },
]

const features = [
  { iconClass: 'fa-duotone fa-duotone fa-solid fa-money-bill-transfer', title: 'Send money',         desc: 'Transfer to mobile money accounts and bank accounts across Africa at transparent rates.' },
  { iconClass: 'fa-sharp-duotone fa-solid fa-chart-mixed', title: 'Live exchange rates', desc: 'Rates are pulled directly from official central bank sources. No inflated margins.' },
  { iconClass: 'fa-duotone fa-duotone fa-solid fa-history', title: 'Transaction history', desc: 'Every transfer is logged with a unique reference number and full status tracking.' },
  { iconClass: 'fa-sharp-duotone fa-solid fa-key-skeleton-left-right', title: 'PIN & 2FA login',    desc: 'Log in using your phone number and PIN. Every session requires a one-time verification code.' },
  { iconClass: 'fa-sharp-duotone fa-solid fa-address-card', title: 'KYC verification',   desc: 'Submit your national ID or passport once. Verified accounts get higher transfer limits.' },
  { iconClass: 'fa-sharp-duotone fa-solid fa-comment-sms', title: 'SMS notifications',  desc: 'Receive SMS updates for every transfer — initiated, completed, or refunded.' },
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
  background: var(--bg-card);
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
  background: var(--bg-card);
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
  color: var(--text-inverse);
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
  color: var(--text-inverse);
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
  position: relative;
  min-height: 580px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  border-bottom: none;
  overflow: hidden;
}
.hero__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.72) 0%,
    rgba(0, 0, 0, 0.45) 50%,
    rgba(0, 0, 0, 0.15) 100%
  );
  z-index: 1;
}
.hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  max-width: 560px;
  padding: 72px 0;
}
.hero__tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  margin-bottom: 20px;
}
.hero__headline {
  font-size: clamp(32px, 4.5vw, 56px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text-inverse);
  margin-bottom: 18px;
}
.hero__headline span { color: #f97316; }
.hero__sub {
  font-size: 17px;
  color: rgba(255,255,255,0.82);
  max-width: 460px;
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
  color: rgba(255,255,255,0.5);
}
.btn-outline--light {
  color: var(--text-inverse);
  border-color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.08);
}
.btn-outline--light:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.8);
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

/* ── Scroll reveal animations ──────────────────────────────────────────── */
.reveal {
  opacity: 0;
  transform: translateY(60px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}
.reveal--left {
  opacity: 0;
  transform: translateX(-60px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal--left.revealed {
  opacity: 1;
  transform: translateX(0);
}
.reveal--right {
  opacity: 0;
  transform: translateX(60px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal--right.revealed {
  opacity: 1;
  transform: translateX(0);
}
.reveal--scale {
  opacity: 0;
  transform: scale(0.92) translateY(30px);
  transition: opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1), transform 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}
.reveal--scale.revealed {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* CTA section background */
.cta-section {
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}

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
  background: var(--bg-card);
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
  background: var(--bg-card);
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
  background: var(--bg-card);
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
  color: var(--text-inverse);
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
  background: var(--bg-card);
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
  .hero { min-height: 480px; }
  .hero__content { padding: 56px 0; }
  .trust-bar__inner { grid-template-columns: 1fr; }
  .features-grid    { grid-template-columns: 1fr; }
}

/* ── Hero entrance animations ──────────────────────────────────────────── */
.hero-animate {
  opacity: 0;
  transform: translateY(40px);
  filter: blur(4px);
  transition: opacity 0.9s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.9s cubic-bezier(0.22, 1, 0.36, 1),
              filter 0.9s ease;
}
.hero-animate.hero-in {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

/* ── Stagger animations ─────────────────────────────────────────────────── */
.stagger-item {
  opacity: 0;
  transform: translateY(40px) scale(0.97);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}
.stagger-item.stagger-in {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* ── Feature card hover ─────────────────────────────────────────────────── */
.feature-card {
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease !important;
}
.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.09);
  border-color: #e85d04 !important;
}

/* ── Step card hover ────────────────────────────────────────────────────── */
.step-card {
  transition: background 0.2s ease !important;
}
.step-card:hover .step-card__num {
  color: #e85d04;
  transition: color 0.2s ease;
}

/* ── Security card pulse ────────────────────────────────────────────────── */
.security__card {
  transition: transform 0.3s ease, box-shadow 0.3s ease !important;
}
.security__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.1) !important;
}

/* ── Trust item hover ───────────────────────────────────────────────────── */
.trust-item {
  transition: transform 0.2s ease !important;
}
.trust-item:hover {
  transform: translateX(4px);
}

/* ── CTA button pulse ───────────────────────────────────────────────────── */
.btn-primary--lg {
  transition: background 0.15s, transform 0.15s, box-shadow 0.15s !important;
}
.btn-primary--lg:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(232, 93, 4, 0.35);
}

/* ── Navbar link underline animation ───────────────────────────────────── */
.navbar__links a {
  position: relative;
}
.navbar__links a::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #e85d04;
  transition: width 0.2s ease;
}
.navbar__links a:hover::after {
  width: 100%;
}



/* ── Fee Calculator (Responsive Fix) ─────────────────────────────────────── */
.calculator-section {
  background: #f8f9fa;
  padding: 48px 0;
}
.calc-card {
  background: var(--bg-card);
  border: 1px solid #e5e5e5;
  border-radius: 16px;
  overflow: hidden;
  max-width: 680px;
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}
.calc-card__header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}
.calc-card__title { font-size: 17px; font-weight: 700; color: #111; }
.calc-card__sub   { font-size: 13px; color: #888; margin-top: 3px; }

.calc-card__body { padding: 24px; }

.calc-row {
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}
.calc-field {
  flex: 1;
  min-width: 0; /* Prevents flex items from overflowing parent */
}
.calc-arrow {
  font-size: 16px; 
  color: #e85d04;
  padding-bottom: 12px; 
  text-align: center;
  transition: transform 0.3s ease;
}
.calc-field label {
  display: block; font-size: 12px; font-weight: 600;
  color: #666; margin-bottom: 6px;
}
.calc-input-wrap {
  display: flex; 
  border: 1px solid #ddd;
  border-radius: 10px; 
  overflow: hidden;
  background: var(--bg-card); 
  transition: border-color 0.15s;
}
.calc-input-wrap:focus-within { border-color: #e85d04; }
.calc-input-wrap input {
  flex: 1; padding: 11px 12px; border: none; outline: none;
  font-size: 16px; font-weight: 600; color: #111;
  background: transparent; width: 100%;
}
.calc-input-wrap select {
  padding: 0 8px; border: none; border-left: 1px solid #eee;
  background: #f8f8f8; font-size: 13px; font-weight: 600;
  color: #333; outline: none; cursor: pointer;
}
.calc-input-wrap--receive { background: #fafafa; border-color: #eee; }
.calc-receive-amount {
  flex: 1; padding: 11px 12px;
  font-size: 16px; font-weight: 700; color: #e85d04;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.calc-placeholder { color: #ccc; font-weight: 400; }

.calc-breakdown {
  background: #fafafa; border-radius: 10px;
  padding: 14px; margin-bottom: 16px;
  display: flex; flex-direction: column; gap: 8px;
}
.calc-breakdown__row {
  display: flex; justify-content: space-between;
  font-size: 13px; color: #555;
  gap: 8px;
}
.calc-breakdown__row span:last-child { text-align: right; font-weight: 600; }

.calc-breakdown__row--total {
  padding-top: 8px; border-top: 1px solid #eee;
  font-weight: 700; color: #111; font-size: 14px;
}
.calc-breakdown__row--total .accent { color: #e85d04; }
  /* font-size: 11px; color: #aaa; text-align: right; margin-top: 2px; */

.calc-error {
  font-size: 13px; color: #dc2626; margin-bottom: 12px;
  background: #fef2f2; padding: 10px 12px; border-radius: 8px;
}
.calc-cta { margin-top: 4px; display: block; text-align: center; }

@media (max-width: 600px) {
  .calc-row {
    flex-direction: column;
    align-items: stretch;
  }
  .calc-arrow {
    padding: 0;
    margin: -8px 0;
    transform: rotate(90deg);
  }
}

.trust-item__icon i, .feature-card__icon i {
  --fa-primary-color: #e85d04;
  --fa-secondary-color: #f97316;
}
</style>
