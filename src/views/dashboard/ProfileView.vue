<template>
  <AppLayout>
    <div class="profile">

      <!-- Header -->
      <div class="profile__header fade-up">
        <h1>Profile</h1>
        <p>Your account details</p>
      </div>

      <!-- Hero card -->
      <div class="hero-card fade-up-1">
        <div class="hero-card__glow" />
        <div class="hero-card__inner">
          <div class="avatar">
            <span>{{ initial }}</span>
            <div class="avatar__ring" />
          </div>
          <div class="hero-card__info">
            <div class="hero-card__name">{{ auth.user?.name }}</div>
            <div class="hero-card__phone">{{ auth.user?.phone || '—' }}</div>
            <div class="hero-card__badge" :class="badgeClass">
              <span class="badge-dot" />
              {{ badgeLabel }}
            </div>
          </div>
        </div>
        <div class="hero-card__stats">
          <div class="stat">
            <div class="stat__label">Country</div>
            <div class="stat__value">{{ auth.user?.country_code || '—' }}</div>
          </div>
          <div class="stat-divider" />
          <div class="stat">
            <div class="stat__label">KYC</div>
            <div class="stat__value" :class="kycClass">{{ kycLabel }}</div>
          </div>
          <div class="stat-divider" />
          <div class="stat">
            <div class="stat__label">Account</div>
            <div class="stat__value" :class="accountClass">{{ accountLabel }}</div>
          </div>
        </div>
      </div>

      <!-- Details section -->
      <div class="section fade-up-2">
        <div class="section__title">Account Details</div>
        <div class="detail-list">
          <div v-for="field in fields" :key="field.label" class="detail-item">
            <div class="detail-item__icon"><i :class="field.icon" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">{{ field.label }}</div>
              <div class="detail-item__value">{{ field.value }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Account Numbers -->
      <div class="section fade-up-3">
        <div class="section__title">Account Numbers</div>
        <div class="detail-list">
          <div v-if="accountsLoading" class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" /></div>
            <div class="detail-item__body"><div class="detail-item__label">Loading...</div></div>
          </div>
          <div v-else-if="!accounts.length" class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-wallet" /></div>
            <div class="detail-item__body"><div class="detail-item__label">No accounts found</div></div>
          </div>
          <div v-for="acc in accounts" :key="acc.account_number" class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-building-columns" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">{{ acc.currency }} Wallet</div>
              <div class="detail-item__value account-number">{{ formatAccountNumber(acc.account_number) }}</div>
            </div>
            <button class="copy-btn" @click="copyAccount(acc.account_number)">
              <i :class="copied === acc.account_number ? 'fa-sharp-duotone fa-solid fa-check' : 'fa-sharp-duotone fa-solid fa-copy'" />
            </button>
          </div>
        </div>
      </div>

      <!-- Bank Accounts -->
      <div class="section fade-up-3">
        <div class="section__title-row">
          <div class="section__title">Bank Accounts</div>
          <button class="section__add-btn" @click="openAddBank">
            <i class="fa-sharp-duotone fa-solid fa-plus"></i> Add
          </button>
        </div>
        <div class="detail-list">
          <div v-if="bankLoading" class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" /></div>
            <div class="detail-item__body"><div class="detail-item__label">Loading...</div></div>
          </div>
          <div v-else-if="!bankAccounts.length" class="detail-item detail-item--empty">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-building-columns" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">No bank accounts saved</div>
              <div class="detail-item__value">Add your bank account for withdrawals and top-ups</div>
            </div>
          </div>
          <div v-for="bank in bankAccounts" :key="bank.id" class="detail-item">
            <div class="detail-item__icon bank-icon">
              <i class="fa-sharp-duotone fa-solid fa-building-columns" />
            </div>
            <div class="detail-item__body">
              <div class="detail-item__label">
                {{ bank.label || bank.bank_name }}
                <span v-if="bank.is_default" class="badge--default">Default</span>
              </div>
              <div class="detail-item__value">{{ bank.account_name }}</div>
              <div class="detail-item__meta">{{ bank.bank_name }} · ****{{ bank.account_number_masked?.slice(-4) }} · {{ bank.currency_code }}</div>
            </div>
            <div class="bank-actions">
              <button class="icon-btn" @click="openEditBank(bank)" title="Edit">
                <i class="fa-sharp-duotone fa-solid fa-pen" />
              </button>
              <button class="icon-btn icon-btn--danger" @click="confirmDeleteBank(bank)" title="Remove">
                <i class="fa-sharp-duotone fa-solid fa-trash" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="section fade-up-3">
        <div class="section__title">Appearance</div>
        <div class="detail-list">
          <div class="detail-item">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-circle-half-stroke" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Theme</div>
              <div class="detail-item__value">{{ themeLabel }}</div>
            </div>
            <div class="theme-toggle">
              <button v-for="t in themeOptions" :key="t.value" class="theme-btn" :class="{ active: ui.theme === t.value }" @click="ui.setTheme(t.value)" :title="t.label">
                <i :class="t.icon" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Security shortcut -->
      <div class="section fade-up-3">
        <div class="section__title">Security & Privacy</div>
        <div class="detail-list">
          <RouterLink to="/security" class="detail-item detail-item--link">
            <div class="detail-item__icon"><i class="fa-sharp-duotone fa-solid fa-shield-halved" /></div>
            <div class="detail-item__body">
              <div class="detail-item__label">Security Center</div>
              <div class="detail-item__value">2FA, sessions, PIN, activity log</div>
            </div>
            <i class="fa-sharp-duotone fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 12px;" />
          </RouterLink>
        </div>
      </div>

      <!-- Logout -->
      <div class="fade-up-3">
        <button class="logout-btn" @click="handleLogout">
          <i class="fa-sharp-duotone fa-solid fa-right-from-bracket" />
          Sign Out
        </button>
      </div>

    </div>
  </AppLayout>

  <!-- ── Bank Account Modal ──────────────────────────────────────────── -->
  <Teleport to="body">
    <transition name="overlay">
      <div v-if="bankModal.open" class="modal-overlay" @click.self="closeBankModal">
        <transition name="sheet">
          <div class="modal" role="dialog" aria-modal="true">
            <div class="modal__header">
              <div class="modal__icon"><i class="fa-sharp-duotone fa-solid fa-building-columns" /></div>
              <div>
                <div class="modal__title">{{ bankModal.editing ? 'Edit Bank Account' : 'Add Bank Account' }}</div>
                <div class="modal__subtitle">Your details are stored encrypted</div>
              </div>
              <button class="modal__close" @click="closeBankModal">
                <i class="fa-sharp-duotone fa-solid fa-xmark" />
              </button>
            </div>

            <div class="modal__body">
              <div class="mfield" :class="{ 'mfield--error': bankErrors.label }">
                <label>Label <span class="optional">(optional)</span></label>
                <input v-model="bankForm.label" type="text" placeholder="e.g. My FDH Account" />
              </div>

              <div class="mfield" :class="{ 'mfield--error': bankErrors.bank_name }">
                <label>Bank Name</label>
                <input v-model="bankForm.bank_name" type="text" placeholder="e.g. National Bank of Malawi" />
                <span v-if="bankErrors.bank_name" class="mfield__error">{{ bankErrors.bank_name }}</span>
              </div>

              <div class="mfield" :class="{ 'mfield--error': bankErrors.account_number }">
                <label>Account Number</label>
                <input v-model="bankForm.account_number" type="text" placeholder="Account number" :disabled="bankModal.editing" />
                <span v-if="bankErrors.account_number" class="mfield__error">{{ bankErrors.account_number }}</span>
                <span v-if="bankModal.editing" class="mfield__hint">Account number cannot be changed. Remove and re-add to update.</span>
              </div>

              <div class="mfield" :class="{ 'mfield--error': bankErrors.account_name }">
                <label>Account Holder Name</label>
                <input v-model="bankForm.account_name" type="text" placeholder="Full name as on the account" />
                <span v-if="bankErrors.account_name" class="mfield__error">{{ bankErrors.account_name }}</span>
              </div>

              <div class="mrow">
                <div class="mfield" :class="{ 'mfield--error': bankErrors.currency_code }">
                  <label>Currency</label>
                  <select v-model="bankForm.currency_code" :disabled="bankModal.editing">
                    <option value="">Select</option>
                    <option v-for="c in bankCurrencies" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <span v-if="bankErrors.currency_code" class="mfield__error">{{ bankErrors.currency_code }}</span>
                </div>

                <div class="mfield" :class="{ 'mfield--error': bankErrors.country_code }">
                  <label>Country</label>
                  <select v-model="bankForm.country_code" :disabled="bankModal.editing">
                    <option value="">Select</option>
                    <option v-for="c in bankCountries" :key="c.code" :value="c.code">{{ c.name }}</option>
                  </select>
                  <span v-if="bankErrors.country_code" class="mfield__error">{{ bankErrors.country_code }}</span>
                </div>
              </div>

              <div class="mfield">
                <label>Branch Code <span class="optional">(optional)</span></label>
                <input v-model="bankForm.branch_code" type="text" placeholder="Branch / sort code" />
              </div>

              <div class="mfield">
                <label>Bank Code <span class="optional">(optional)</span></label>
                <input v-model="bankForm.bank_code" type="text" placeholder="SWIFT / BIC / routing code" />
              </div>

              <label class="default-toggle">
                <input type="checkbox" v-model="bankForm.is_default" />
                <span>Set as default bank account</span>
              </label>

              <div v-if="bankModal.error" class="modal__error">
                <i class="fa-sharp-duotone fa-solid fa-circle-exclamation" />
                {{ bankModal.error }}
              </div>

              <button class="btn-primary" :disabled="bankModal.loading" @click="submitBankAccount">
                <i v-if="bankModal.loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
                <span v-else>{{ bankModal.editing ? 'Save Changes' : 'Add Bank Account' }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>

  <!-- ── Delete Confirm Modal ─────────────────────────────────────────── -->
  <Teleport to="body">
    <transition name="overlay">
      <div v-if="deleteModal.open" class="modal-overlay" @click.self="deleteModal.open = false">
        <transition name="sheet">
          <div class="modal modal--sm" role="dialog">
            <div class="modal__header">
              <div class="modal__icon modal__icon--danger"><i class="fa-sharp-duotone fa-solid fa-trash" /></div>
              <div>
                <div class="modal__title">Remove Bank Account</div>
                <div class="modal__subtitle">This cannot be undone</div>
              </div>
              <button class="modal__close" @click="deleteModal.open = false">
                <i class="fa-sharp-duotone fa-solid fa-xmark" />
              </button>
            </div>
            <div class="modal__body">
              <p class="delete-desc">Remove <strong>{{ deleteModal.bank?.label || deleteModal.bank?.bank_name }}</strong> ending in <strong>{{ deleteModal.bank?.account_number_masked?.slice(-4) }}</strong>?</p>
              <button class="btn-danger" :disabled="deleteModal.loading" @click="deleteBank">
                <i v-if="deleteModal.loading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin" />
                <span v-else>Yes, Remove</span>
              </button>
              <button class="btn-cancel" @click="deleteModal.open = false">Cancel</button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </Teleport>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { authApi } from '@/api/auth'
import client from '@/api/client'

const auth   = useAuthStore()
const ui     = useUiStore()
const router = useRouter()

const themeOptions = [
  { value: 'system', label: 'System', icon: 'fa-sharp-duotone fa-solid fa-circle-half-stroke' },
  { value: 'light',  label: 'Light',  icon: 'fa-sharp-duotone fa-solid fa-sun' },
  { value: 'dark',   label: 'Dark',   icon: 'fa-sharp-duotone fa-solid fa-moon' },
]
const themeLabel = computed(() => {
  if (ui.theme === 'dark')  return 'Dark'
  if (ui.theme === 'light') return 'Light'
  return 'System default'
})

// ── Wallet account numbers ──────────────────────────────────────────────────
const accounts        = ref([])
const accountsLoading = ref(false)
const copied          = ref(null)

function formatAccountNumber(num) {
  return num ? num.toString().replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3') : '—'
}
async function copyAccount(num) {
  await navigator.clipboard.writeText(num)
  copied.value = num
  setTimeout(() => copied.value = null, 2000)
}

// ── Bank accounts ───────────────────────────────────────────────────────────
const bankAccounts = ref([])
const bankLoading  = ref(false)

const bankCurrencies = ['MWK','KES','TZS','ZMW','ZAR','MZN','ETB','MGA','BWP','USD','GBP','EUR']
const bankCountries  = [
  { code: 'MWI', name: 'Malawi' },
  { code: 'KEN', name: 'Kenya' },
  { code: 'TZA', name: 'Tanzania' },
  { code: 'ZMB', name: 'Zambia' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'MOZ', name: 'Mozambique' },
  { code: 'ETH', name: 'Ethiopia' },
  { code: 'MDG', name: 'Madagascar' },
  { code: 'BWA', name: 'Botswana' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'USA', name: 'United States' },
]

async function loadBankAccounts() {
  bankLoading.value = true
  try {
    const { data } = await client.get('/bank-accounts')
    bankAccounts.value = data.bank_accounts || []
  } catch (e) {
    console.error(e)
  } finally {
    bankLoading.value = false
  }
}

// ── Bank modal ──────────────────────────────────────────────────────────────
const bankModal = ref({ open: false, editing: false, id: null, loading: false, error: '' })
const bankErrors = ref({})
const bankForm  = ref({
  label: '', bank_name: '', account_number: '', account_name: '',
  branch_code: '', bank_code: '', currency_code: '', country_code: '', is_default: false,
})

function openAddBank() {
  bankForm.value  = { label: '', bank_name: '', account_number: '', account_name: '', branch_code: '', bank_code: '', currency_code: auth.user?.currency || 'MWK', country_code: auth.user?.country_code || 'MWI', is_default: false }
  bankErrors.value = {}
  bankModal.value  = { open: true, editing: false, id: null, loading: false, error: '' }
}

function openEditBank(bank) {
  bankForm.value  = { label: bank.label || '', bank_name: bank.bank_name, account_number: '', account_name: bank.account_name, branch_code: bank.branch_code || '', bank_code: bank.bank_code || '', currency_code: bank.currency_code, country_code: bank.country_code, is_default: bank.is_default }
  bankErrors.value = {}
  bankModal.value  = { open: true, editing: true, id: bank.id, loading: false, error: '' }
}

function closeBankModal() {
  bankModal.value.open = false
}

function validateBankForm() {
  const errs = {}
  if (!bankForm.value.bank_name.trim())    errs.bank_name    = 'Bank name is required'
  if (!bankModal.value.editing && !bankForm.value.account_number.trim()) errs.account_number = 'Account number is required'
  if (!bankForm.value.account_name.trim()) errs.account_name = 'Account holder name is required'
  if (!bankForm.value.currency_code)       errs.currency_code = 'Select a currency'
  if (!bankForm.value.country_code)        errs.country_code  = 'Select a country'
  bankErrors.value = errs
  return Object.keys(errs).length === 0
}

async function submitBankAccount() {
  if (!validateBankForm()) return
  bankModal.value.loading = true
  bankModal.value.error   = ''
  try {
    if (bankModal.value.editing) {
      const { data } = await client.put(`/bank-accounts/${bankModal.value.id}`, {
        label:        bankForm.value.label || null,
        bank_name:    bankForm.value.bank_name,
        account_name: bankForm.value.account_name,
        branch_code:  bankForm.value.branch_code || null,
        bank_code:    bankForm.value.bank_code || null,
        is_default:   bankForm.value.is_default,
      })
      const idx = bankAccounts.value.findIndex(b => b.id === bankModal.value.id)
      if (idx >= 0) bankAccounts.value[idx] = data.bank_account
    } else {
      const { data } = await client.post('/bank-accounts', bankForm.value)
      bankAccounts.value.unshift(data.bank_account)
    }
    if (bankForm.value.is_default) {
      bankAccounts.value.forEach(b => b.is_default = b.id === (bankModal.value.id || bankAccounts.value[0]?.id))
    }
    closeBankModal()
  } catch (e) {
    bankModal.value.error = e.response?.data?.message || 'Could not save bank account'
  } finally {
    bankModal.value.loading = false
  }
}

// ── Delete modal ────────────────────────────────────────────────────────────
const deleteModal = ref({ open: false, bank: null, loading: false })

function confirmDeleteBank(bank) {
  deleteModal.value = { open: true, bank, loading: false }
}

async function deleteBank() {
  deleteModal.value.loading = true
  try {
    await client.delete(`/bank-accounts/${deleteModal.value.bank.id}`)
    bankAccounts.value = bankAccounts.value.filter(b => b.id !== deleteModal.value.bank.id)
    deleteModal.value.open = false
  } catch (e) {
    console.error(e)
  } finally {
    deleteModal.value.loading = false
  }
}

// ── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(async () => {
  accountsLoading.value = true
  try {
    const [accRes] = await Promise.all([authApi.accountNumbers()])
    accounts.value = accRes.data.accounts
  } catch (e) { console.error(e) }
  finally { accountsLoading.value = false }
  loadBankAccounts()
})

// ── Computed ────────────────────────────────────────────────────────────────
const initial      = computed(() => auth.user?.name?.[0]?.toUpperCase() || '?')
const badgeLabel   = computed(() => auth.isKycVerified ? 'Verified Account' : 'Unverified Account')
const badgeClass   = computed(() => auth.isKycVerified ? 'badge--verified' : 'badge--unverified')
const kycLabel     = computed(() => { const s = auth.user?.kyc_status; if (s === 'verified') return 'Verified'; if (s === 'pending') return 'Pending'; if (s === 'rejected') return 'Rejected'; return 'None' })
const kycClass     = computed(() => { const s = auth.user?.kyc_status; if (s === 'verified') return 'value--success'; if (s === 'pending') return 'value--warn'; if (s === 'rejected') return 'value--danger'; return '' })
const accountLabel = computed(() => { const s = auth.user?.status; return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—' })
const accountClass = computed(() => { const s = auth.user?.status; if (s === 'active') return 'value--success'; if (s === 'suspended') return 'value--danger'; return '' })
const fields       = computed(() => [
  { label: 'Full Name',     value: auth.user?.name || '—',         icon: 'fa-sharp-duotone fa-solid fa-user' },
  { label: 'Email Address', value: auth.user?.email || '—',        icon: 'fa-sharp-duotone fa-solid fa-envelope' },
  { label: 'Country',       value: auth.user?.country_code || '—', icon: 'fa-sharp-duotone fa-solid fa-globe-africa' },
])

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.profile { max-width: 480px; padding-bottom: 48px; }

/* ── Header ── */
.profile__header { margin-bottom: 24px; }
.profile__header h1 { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
.profile__header p  { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }

/* ── Hero card ── */
.hero-card { position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; margin-bottom: 20px; }
.hero-card__glow { position: absolute; top: -40px; right: -40px; width: 180px; height: 180px; background: radial-gradient(circle, rgba(232,93,4,0.12) 0%, transparent 70%); pointer-events: none; }
.hero-card__inner { display: flex; align-items: center; gap: 16px; padding: 20px 20px 16px; }
.avatar { position: relative; width: 64px; height: 64px; flex-shrink: 0; }
.avatar span { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; border-radius: 18px; background: var(--accent); font-size: 24px; font-weight: 700; color: var(--text-inverse); position: relative; z-index: 1; }
.avatar__ring { position: absolute; inset: -3px; border-radius: 21px; border: 2px solid rgba(232,93,4,0.25); animation: pulse-ring 3s ease-in-out infinite; }
@keyframes pulse-ring { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.03); } }
.hero-card__name  { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 2px; }
.hero-card__phone { font-size: 13px; color: var(--text-secondary); margin-bottom: 8px; }
.hero-card__badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 99px; }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.badge--verified   { background: var(--success-bg); color: var(--success); }
.badge--unverified { background: var(--bg-elevated); color: var(--text-secondary); }
.hero-card__stats  { display: flex; align-items: center; border-top: 1px solid var(--border); padding: 14px 20px; }
.stat { flex: 1; text-align: center; }
.stat__label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
.stat__value { font-size: 13px; font-weight: 600; }
.stat-divider { width: 1px; height: 28px; background: var(--border); }
.value--success { color: var(--success); }
.value--warn    { color: #d97706; }
.value--danger  { color: var(--danger); }

/* ── Sections ── */
.section { margin-bottom: 20px; }
.section__title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 10px; padding-left: 2px; }
.section__title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.section__title-row .section__title { margin-bottom: 0; }
.section__add-btn { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--accent); background: var(--accent-dim); border: none; border-radius: 8px; padding: 5px 12px; cursor: pointer; font-family: inherit; }

/* ── Detail list ── */
.detail-list { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
.detail-item { display: flex; align-items: center; gap: 12px; padding: 13px 16px; border-bottom: 1px solid var(--border); transition: background 0.15s; }
.detail-item:last-child { border-bottom: none; }
.detail-item--empty .detail-item__value { font-size: 12px; color: var(--text-muted); font-weight: 400; }
.detail-item__icon { width: 34px; height: 34px; border-radius: 10px; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 13px; flex-shrink: 0; }
.bank-icon { background: var(--accent-dim); color: var(--accent); }
.detail-item__body { flex: 1; min-width: 0; }
.detail-item__label { font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }
.detail-item__value { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.detail-item__meta  { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.detail-item--link  { text-decoration: none; color: inherit; }

/* ── Bank account actions ── */
.bank-actions { display: flex; gap: 6px; flex-shrink: 0; }
.icon-btn { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-secondary); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; }
.icon-btn--danger { color: var(--danger); border-color: var(--danger); background: var(--danger-bg, #fef2f2); }
.badge--default { display: inline-block; font-size: 10px; font-weight: 600; background: var(--success-bg); color: var(--success); padding: 1px 7px; border-radius: 99px; margin-left: 6px; vertical-align: middle; }

/* ── Copy btn ── */
.account-number { font-family: monospace; font-size: 15px; font-weight: 700; letter-spacing: 0.05em; }
.copy-btn { width: 32px; height: 32px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-elevated); color: var(--text-secondary); cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

/* ── Theme toggle ── */
.theme-toggle { display: flex; gap: 4px; background: var(--bg-elevated); border-radius: 10px; padding: 3px; border: 1px solid var(--border); }
.theme-btn { width: 30px; height: 30px; border-radius: 7px; border: none; background: transparent; color: var(--text-muted); cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: background 0.15s, color 0.15s; }
.theme-btn.active { background: var(--bg-card); color: var(--accent); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

/* ── Logout ── */
.logout-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border: 1px solid var(--border); border-radius: 14px; background: var(--bg-card); color: var(--danger); font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; font-family: inherit; }
.logout-btn:active { background: var(--danger-bg); border-color: var(--danger); }

/* ── Modal ── */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: flex; align-items: flex-end; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal { background: var(--bg-card); border-radius: 24px 24px 0 0; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding-bottom: env(safe-area-inset-bottom, 16px); box-sizing: border-box; }
.modal--sm { max-height: 60vh; }
.modal__header { display: flex; align-items: center; gap: 12px; padding: 20px 20px 16px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg-card); z-index: 1; }
.modal__icon { width: 42px; height: 42px; border-radius: 12px; background: var(--accent-dim); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.modal__icon--danger { background: var(--danger-bg, #fef2f2); color: var(--danger); }
.modal__title    { font-size: 16px; font-weight: 700; }
.modal__subtitle { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
.modal__close { margin-left: auto; width: 32px; height: 32px; border-radius: 99px; border: none; background: var(--bg-elevated); color: var(--text-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 13px; flex-shrink: 0; }
.modal__body  { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.modal__error { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px; background: var(--danger-bg, #fef2f2); color: var(--danger); font-size: 13px; }

/* ── Modal fields ── */
.mfield { display: flex; flex-direction: column; gap: 6px; }
.mfield label { font-size: 12px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.04em; }
.optional { text-transform: none; font-weight: 400; letter-spacing: 0; color: var(--text-muted); }
.mfield input,
.mfield select { width: 100%; padding: 12px 14px; background: var(--bg-elevated); border: 1.5px solid var(--border); border-radius: 12px; color: var(--text-primary); font-size: 14px; font-family: inherit; outline: none; transition: border-color 0.15s; box-sizing: border-box; }
.mfield input:focus,
.mfield select:focus { border-color: var(--accent); }
.mfield input:disabled,
.mfield select:disabled { opacity: 0.5; cursor: not-allowed; }
.mfield--error input,
.mfield--error select { border-color: var(--danger); }
.mfield__error { font-size: 12px; color: var(--danger); }
.mfield__hint  { font-size: 12px; color: var(--text-muted); font-style: italic; }
.mrow { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.default-toggle { display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-secondary); cursor: pointer; }
.default-toggle input { accent-color: var(--accent); width: 16px; height: 16px; }

.delete-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.5; margin: 0; }

.btn-primary { width: 100%; padding: 14px; background: var(--accent); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger  { width: 100%; padding: 14px; background: var(--danger); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-cancel  { width: 100%; padding: 12px; background: transparent; border: none; color: var(--text-secondary); font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; margin-top: 4px; }

/* ── Transitions ── */
.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s; }
.overlay-enter-from,   .overlay-leave-to     { opacity: 0; }
.sheet-enter-active { transition: transform 0.28s cubic-bezier(0.32,0.72,0,1); }
.sheet-leave-active { transition: transform 0.2s ease-in; }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }

@media (min-width: 1024px) {
  .modal-overlay { align-items: center; }
  .modal { border-radius: 20px; max-width: 440px; padding-bottom: 0; }
  .sheet-enter-from, .sheet-leave-to { transform: scale(0.95); opacity: 0; }
  .sheet-enter-active, .sheet-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
}
</style>