<template>
  <AppLayout>
    <div class="profile">
      <div class="profile__header fade-up">
        <h1>Profile</h1>
        <p>Your account details</p>
      </div>

      <div class="avatar-row fade-up-1">
        <div class="avatar">{{ initial }}</div>
        <div>
          <div class="avatar__name">{{ auth.user?.name }}</div>
          <div class="avatar__status">
            {{ auth.isKycVerified ? '✓ Verified Account' : '○ Unverified Account' }}
          </div>
        </div>
      </div>

      <div class="profile-card fade-up-2">
        <div v-for="([k,v], i) in fields" :key="k" class="profile-row"
          :class="{ last: i === fields.length - 1 }">
          <span>{{ k }}</span>
          <span>{{ v }}</span>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup>
import { computed } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth    = useAuthStore()
const initial = computed(() => auth.user?.name?.[0]?.toUpperCase() || '?')
const fields  = computed(() => [
  ['Full Name',    auth.user?.name],
  ['Email',        auth.user?.email || '—'],
  ['Country',      auth.user?.country_code],
  ['KYC Status',   auth.user?.kyc_status],
  ['Account',      auth.user?.status],
  ['Phone Verified', auth.user?.phone_verified ? 'Yes' : 'No'],
])
</script>

<style scoped>
.profile__header { margin-bottom: 24px; }
.profile__header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.profile__header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

.avatar-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.avatar {
  width: 60px; height: 60px; border-radius: 16px; background: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 700; color: #000; flex-shrink: 0;
}
.avatar__name   { font-size: 18px; font-weight: 700; }
.avatar__status { font-size: 13px; color: var(--text-secondary); margin-top: 3px; }

.profile-card { background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border); max-width: 480px; }
.profile-row  { display: flex; justify-content: space-between; padding: 13px 18px; border-bottom: 1px solid var(--border); }
.profile-row.last { border-bottom: none; }
.profile-row span:first-child { color: var(--text-secondary); font-size: 13px; }
.profile-row span:last-child  { font-size: 13px; font-weight: 500; }
</style>
