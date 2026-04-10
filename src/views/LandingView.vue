<template>
  <div class="landing">
    <nav class="navbar">
      <div class="container navbar__inner">
        <div class="brand">
          <span class="brand__icon">U</span>
          <span class="brand__text">Ulendo<span class="text-orange">Pay</span></span>
        </div>
        <div class="nav-links">
          <a href="#how" class="nav-link">How it works</a>
          <a href="#security" class="nav-link">Security</a>
          <RouterLink to="/login" class="nav-btn-text">Sign in</RouterLink>
          <RouterLink to="/register" class="nav-btn-primary">Open Account</RouterLink>
        </div>
      </div>
    </nav>

    <header class="hero">
      <div class="container hero__grid">
        <div class="hero__text">
          <div class="badge fade-up">Real-time settlement</div>
          <h1 class="hero__title fade-up-1">
            Africa's instant exchange, <span class="text-orange">managed.</span>
          </h1>
          <p class="hero__description fade-up-2">
            Send money directly to mobile wallets across 12+ African networks at official rates. No hidden fees, no black market rates.
          </p>
          <div class="hero__trust fade-up-3">
            <i class="fa-solid fa-circle-check"></i>
            <span>Licensed by the Reserve Bank of Malawi</span>
          </div>
        </div>

        <div class="calc fade-up-1">
          <div class="calc__header">
            <span class="calc__status"><span class="dot"></span> Live Rate</span>
            <span class="calc__timer">Guaranteed for 30s</span>
          </div>
          
          <div class="calc__group">
            <label>You send</label>
            <div class="calc__input-wrapper">
              <input v-model.number="sendAmount" type="number" step="0.01" />
              <select v-model="fromCurrency">
                <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <div class="calc__divider">
            <div class="calc__rate-pill">1 {{ fromCurrency }} = {{ exchangeRate }} {{ toCurrency }}</div>
          </div>

          <div class="calc__group">
            <label>Recipient gets</label>
            <div class="calc__input-wrapper is-readonly">
              <input :value="receiveAmount.toFixed(2)" readonly />
              <select v-model="toCurrency">
                <option v-for="c in currencies" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
          </div>

          <div class="calc__breakdown">
            <div class="breakdown-row">
              <span>Transfer Fee</span>
              <span>{{ feeAmount }} {{ fromCurrency }}</span>
            </div>
          </div>

          <RouterLink to="/register" class="btn-send">
            Start Instant Transfer
            <i class="fa-solid fa-arrow-right"></i>
          </RouterLink>
        </div>
      </div>
    </header>

    <section class="partners">
      <div class="container">
        <p class="partners__title">Direct Network Integration</p>
        <div class="partners__grid">
          <span class="partner-logo">Airtel Money</span>
          <span class="partner-logo">MTN MoMo</span>
          <span class="partner-logo">M-Pesa</span>
          <span class="partner-logo">TNM Mpamba</span>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container footer__bottom">
        <p>© 2026 Ulendo Pay. All rights reserved.</p>
        <p>Regulated & Compliant Financial Service</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const currencies = ['MWK', 'KES', 'TZS', 'ZMW', 'ZAR']
const fromCurrency = ref('MWK')
const toCurrency = ref('TZS')
const sendAmount = ref(1000)
const exchangeRate = ref(2.45)
const feeAmount = ref(15.00)

const receiveAmount = computed(() => {
  return (sendAmount.value - feeAmount.value) * exchangeRate.value
})
</script>

<style scoped>
.landing {
  --orange: #ff6b00;
  --orange-dim: #ff6b0011;
  --dark: #111827;
  --gray: #4b5563;
  --light-gray: #f3f4f6;
  --border: #e5e7eb;
  background: #ffffff;
  color: var(--dark);
  min-height: 100vh;
}

.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.text-orange { color: var(--orange); }

/* Nav */
.navbar {
  padding: 20px 0; border-bottom: 1px solid var(--border);
  position: sticky; top: 0; background: #ffffffcc; backdrop-filter: blur(10px); z-index: 100;
}
.navbar__inner { display: flex; justify-content: space-between; align-items: center; }
.brand { display: flex; align-items: center; gap: 10px; }
.brand__icon { 
  background: var(--orange); color: #fff; width: 32px; height: 32px; 
  display: flex; align-items: center; justify-content: center; 
  border-radius: 8px; font-weight: 800;
}
.brand__text { font-weight: 700; font-size: 20px; }
.nav-links { display: flex; gap: 24px; align-items: center; }
.nav-link { text-decoration: none; color: var(--gray); font-size: 14px; font-weight: 500; }
.nav-btn-primary { 
  background: var(--orange); color: white; padding: 10px 20px; 
  border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;
}
.nav-btn-text { text-decoration: none; color: var(--dark); font-weight: 600; font-size: 14px; }

/* Hero */
.hero { padding: 80px 0; background: radial-gradient(circle at 100% 0%, var(--orange-dim) 0%, transparent 40%); }
.hero__grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; }
.hero__title { font-size: 64px; font-weight: 800; line-height: 1.1; letter-spacing: -0.04em; margin-bottom: 24px; }
.hero__description { font-size: 20px; color: var(--gray); line-height: 1.6; margin-bottom: 40px; }
.hero__trust { display: flex; align-items: center; gap: 10px; color: #059669; font-weight: 600; font-size: 14px; }

/* Calculator */
.calc { 
  background: #ffffff; border: 1px solid var(--border); border-radius: 24px; 
  padding: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.05);
}
.calc__header { display: flex; justify-content: space-between; margin-bottom: 24px; }
.calc__status { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 13px; color: #059669; }
.dot { width: 8px; height: 8px; background: #059669; border-radius: 50%; animation: pulse 2s infinite; }
.calc__timer { font-size: 12px; color: var(--gray); }

.calc__group label { display: block; font-size: 12px; font-weight: 600; color: var(--gray); margin-bottom: 8px; text-transform: uppercase; }
.calc__input-wrapper { 
  display: flex; border: 1px solid var(--border); border-radius: 12px; 
  overflow: hidden; margin-bottom: 12px; transition: border-color 0.2s;
}
.calc__input-wrapper:focus-within { border-color: var(--orange); }
.calc__input-wrapper input { flex: 1; padding: 16px; border: none; font-size: 20px; font-weight: 700; outline: none; width: 60%; }
.calc__input-wrapper select { border: none; border-left: 1px solid var(--border); padding: 0 16px; background: var(--light-gray); font-weight: 600; outline: none; }
.is-readonly { background: var(--light-gray); }

.calc__divider { position: relative; margin: 20px 0; text-align: center; }
.calc__divider::before { content: ""; position: absolute; top: 50%; left: 0; right: 0; border-top: 1px dashed var(--border); z-index: 1; }
.calc__rate-pill { position: relative; z-index: 2; background: white; border: 1px solid var(--border); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display: inline-block; }

.btn-send { 
  width: 100%; background: var(--orange); color: white; border: none; 
  padding: 18px; border-radius: 12px; font-size: 16px; font-weight: 700; 
  cursor: pointer; display: flex; justify-content: center; align-items: center; 
  gap: 12px; text-decoration: none; margin-top: 20px;
}

/* Partners */
.partners { padding: 40px 0; border-top: 1px solid var(--border); }
.partners__title { text-align: center; font-size: 12px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 30px; }
.partners__grid { display: flex; justify-content: center; gap: 60px; filter: grayscale(1); opacity: 0.6; font-weight: 700; font-size: 18px; }

/* Footer */
.footer { padding: 40px 0; border-top: 1px solid var(--border); font-size: 13px; color: var(--gray); }
.footer__bottom { display: flex; justify-content: space-between; }

@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }

@media (max-width: 968px) {
  .hero__grid { grid-template-columns: 1fr; text-align: center; gap: 40px; }
  .hero__title { font-size: 48px; }
  .hero__trust { justify-content: center; }
  .nav-links { display: none; }
}
</style>
