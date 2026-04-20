<template>
  <AppLayout>
    <div class="rewards-page">

      <div class="page-header fade-up">
        <h1>Rewards & Limits</h1>
        <p>Your transfer tier, limits and referral benefits</p>
      </div>

      <!-- Tier Card -->
      <div class="tier-card fade-up-1" :class="`tier-card--${tier?.tier || 'unverified'}`">
        <div class="tier-card__top">
          <div>
            <div class="tier-card__label">YOUR TIER</div>
            <div class="tier-card__name">{{ tier?.label || '—' }}</div>
          </div>
          <div class="tier-badge" :class="`tier-badge--${tier?.tier || 'unverified'}`">
            <i :class="tierIcon" />
          </div>
        </div>
        <div class="tier-card__discount" v-if="tier?.total_discount_percent > 0">
          <i class="fas fa-tag" /> {{ tier.total_discount_percent }}% fee discount active
        </div>
        <div class="tier-card__upgrade" v-if="tier?.can_upgrade">
          <RouterLink to="/kyc" class="upgrade-btn">
            <i class="fas fa-arrow-up" /> Verify identity to unlock higher limits
          </RouterLink>
        </div>
      </div>

      <!-- Limits -->
      <div class="section fade-up-2">
        <div class="section__title">Transfer Limits</div>
        <div class="detail-list">
          <div v-if="tierLoading" class="state-loading">
            <i class="fas fa-spinner fa-spin" /> Loading...
          </div>
          <template v-else>
            <div class="limit-item">
              <div class="limit-item__label">Per Transaction</div>
              <div class="limit-item__value">{{ tier?.currency }} {{ fmt(tier?.per_transaction_limit) }}</div>
            </div>
            <div class="limit-item">
              <div class="limit-item__label">Daily Limit</div>
              <div class="limit-item__right">
                <div class="limit-item__value">{{ tier?.currency }} {{ fmt(tier?.daily_remaining) }} remaining</div>
                <div class="limit-bar">
                  <div class="limit-bar__fill" :style="{ width: dailyPercent + '%' }"></div>
                </div>
                <div class="limit-item__sub">{{ tier?.currency }} {{ fmt(tier?.daily_used) }} of {{ fmt(tier?.daily_limit) }} used</div>
              </div>
            </div>
            <div class="limit-item">
              <div class="limit-item__label">Monthly Limit</div>
              <div class="limit-item__right">
                <div class="limit-item__value">{{ tier?.currency }} {{ fmt(tier?.monthly_remaining) }} remaining</div>
                <div class="limit-bar">
                  <div class="limit-bar__fill limit-bar__fill--monthly" :style="{ width: monthlyPercent + '%' }"></div>
                </div>
                <div class="limit-item__sub">{{ tier?.currency }} {{ fmt(tier?.monthly_used) }} of {{ fmt(tier?.monthly_limit) }} used</div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Referral -->
      <div class="section fade-up-3">
        <div class="section__title">Refer & Earn</div>
        <div class="referral-card">
          <div class="referral-card__top">
            <div class="referral-card__icon"><i class="fas fa-users" /></div>
            <div>
              <div class="referral-card__title">Invite friends, earn discounts</div>
              <div class="referral-card__sub">You and your friend each get 5% off fees when they complete their first transfer.</div>
            </div>
          </div>

          <div v-if="referralLoading" class="state-loading">
            <i class="fas fa-spinner fa-spin" /> Loading...
          </div>
          <template v-else>
            <div class="referral-code-box">
              <div class="referral-code-box__label">Your referral code</div>
              <div class="referral-code-box__code">{{ referral?.referral_code }}</div>
              <button class="copy-btn" @click="copyLink">
                <i :class="copied ? 'fas fa-check' : 'fas fa-copy'" />
                {{ copied ? 'Copied!' : 'Copy link' }}
              </button>
            </div>

            <div class="referral-stats">
              <div class="stat">
                <div class="stat__value">{{ referral?.total_referrals || 0 }}</div>
                <div class="stat__label">Invited</div>
              </div>
              <div class="stat-divider" />
              <div class="stat">
                <div class="stat__value">{{ referral?.qualified || 0 }}</div>
                <div class="stat__label">Qualified</div>
              </div>
              <div class="stat-divider" />
              <div class="stat">
                <div class="stat__value">{{ referral?.your_discount || 0 }}%</div>
                <div class="stat__label">Your discount</div>
              </div>
            </div>

            <div v-if="referral?.referrals?.length" class="referral-list">
              <div class="referral-list__title">Your referrals</div>
              <div v-for="r in referral.referrals" :key="r.name" class="referral-list__item">
                <div class="referral-list__name">{{ r.name }}</div>
                <span class="referral-badge" :class="r.status === 'qualified' ? 'badge--green' : 'badge--gray'">
                  {{ r.status }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui'
import AppLayout from '@/components/AppLayout.vue'
import { tierApi } from '@/api/tier'

const ui            = useUiStore()
const tier          = ref(null)
const referral      = ref(null)
const tierLoading   = ref(false)
const referralLoading = ref(false)
const copied        = ref(false)

const tierIcon = computed(() => {
  const t = tier.value?.tier
  if (t === 'verified')   return 'fas fa-shield-halved'
  if (t === 'basic')      return 'fas fa-id-card'
  return 'fas fa-user'
})

const dailyPercent = computed(() => {
  if (!tier.value) return 0
  return Math.min(100, (tier.value.daily_used / tier.value.daily_limit) * 100)
})

const monthlyPercent = computed(() => {
  if (!tier.value) return 0
  return Math.min(100, (tier.value.monthly_used / tier.value.monthly_limit) * 100)
})

const fmt = (v) => Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

async function copyLink() {
  await navigator.clipboard.writeText(referral.value?.referral_link || '')
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

onMounted(async () => {
  tierLoading.value = true
  referralLoading.value = true
  try {
    const [tierRes, refRes] = await Promise.all([
      tierApi.myTier(),
      tierApi.referral(),
    ])
    tier.value     = tierRes.data
    referral.value = refRes.data
  } catch {
    ui.error('Failed to load tier info')
  } finally {
    tierLoading.value = false
    referralLoading.value = false
  }
})
</script>

<style scoped>
.rewards-page { max-width: 480px; padding-bottom: 48px; }

.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.page-header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

/* Tier card */
.tier-card {
  border-radius: 20px; padding: 20px; margin-bottom: 24px;
  border: 1px solid var(--border);
}
.tier-card--unverified { background: var(--bg-card); }
.tier-card--basic      { background: #eff6ff; border-color: #bfdbfe; }
.tier-card--verified   { background: linear-gradient(135deg, #1B4332 0%, #2d6a4f 100%); color: #fff; }

.tier-card__top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.tier-card__label { font-size: 10px; font-weight: 700; opacity: 0.6; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
.tier-card__name  { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }

.tier-badge {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.tier-badge--unverified { background: var(--bg-elevated); color: var(--text-muted); }
.tier-badge--basic      { background: #dbeafe; color: #2563eb; }
.tier-badge--verified   { background: rgba(255,255,255,0.2); color: #fff; }

.tier-card__discount {
  font-size: 13px; font-weight: 600; opacity: 0.85;
  display: flex; align-items: center; gap: 6px; margin-bottom: 12px;
}

.upgrade-btn {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600; color: var(--accent);
  text-decoration: none; background: var(--accent-dim);
  padding: 8px 14px; border-radius: 99px;
}

/* Limits */
.section { margin-bottom: 24px; }
.section__title {
  font-size: 11px; font-weight: 600; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px;
}
.detail-list {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden;
}
.limit-item {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 14px 16px; border-bottom: 1px solid var(--border); gap: 12px;
}
.limit-item:last-child { border-bottom: none; }
.limit-item__label { font-size: 13px; color: var(--text-secondary); font-weight: 500; flex-shrink: 0; }
.limit-item__right { text-align: right; flex: 1; }
.limit-item__value { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.limit-item__sub   { font-size: 11px; color: var(--text-muted); margin-top: 4px; }

.limit-bar { height: 4px; background: var(--bg-elevated); border-radius: 99px; overflow: hidden; }
.limit-bar__fill { height: 100%; background: var(--accent); border-radius: 99px; transition: width 0.5s ease; }
.limit-bar__fill--monthly { background: #2563eb; }

/* Referral */
.referral-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden; padding: 16px;
  display: flex; flex-direction: column; gap: 16px;
}
.referral-card__top { display: flex; gap: 12px; align-items: flex-start; }
.referral-card__icon {
  width: 40px; height: 40px; background: var(--accent-dim);
  color: var(--accent); border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.referral-card__title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.referral-card__sub   { font-size: 12px; color: var(--text-secondary); margin-top: 3px; line-height: 1.5; }

.referral-code-box {
  background: var(--bg-elevated); border-radius: 12px; padding: 14px;
  display: flex; flex-direction: column; gap: 8px;
}
.referral-code-box__label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.referral-code-box__code  { font-size: 24px; font-weight: 800; letter-spacing: 0.1em; color: var(--text-primary); font-family: monospace; }

.copy-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; background: var(--accent); color: #fff;
  border: none; border-radius: 10px; font-size: 13px; font-weight: 600;
  cursor: pointer; align-self: flex-start;
}

.referral-stats {
  display: flex; align-items: center;
  background: var(--bg-elevated); border-radius: 12px; padding: 14px;
}
.stat { flex: 1; text-align: center; }
.stat__value { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.stat__label { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.stat-divider { width: 1px; height: 32px; background: var(--border); }

.referral-list__title { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 8px; }
.referral-list__item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid var(--border);
}
.referral-list__item:last-child { border-bottom: none; }
.referral-list__name { font-size: 13px; font-weight: 500; color: var(--text-primary); }

.referral-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.badge--green { background: var(--success-bg); color: var(--success); }
.badge--gray  { background: var(--bg-elevated); color: var(--text-muted); }

.state-loading {
  padding: 24px; text-align: center; color: var(--text-muted);
  font-size: 13px; display: flex; align-items: center; justify-content: center; gap: 8px;
}
</style>
