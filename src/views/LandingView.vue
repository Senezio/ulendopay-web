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
          <span class="trust-item__icon"><i :class="t.iconClass"></i></span>
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
            <div class="feature-card__icon"><i :class="f.iconClass"></i></div>
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

