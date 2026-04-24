<template>
  <AdminLayout>
    <div class="page">

      <!-- ── Header ──────────────────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <h1>System Accounts</h1>
          <p>Escrow, fee, guarantee and partner accounts — the financial backbone of every transfer</p>
        </div>
        <div class="header-actions">
          <button class="btn-icon" @click="load" :title="loading ? 'Loading…' : 'Refresh'">
            <i class="fa-sharp-duotone fa-solid fa-rotate" :class="{ 'fa-spin': loading }"></i>
          </button>
          <button class="btn-primary-sm" @click="showCreate = true">
            <i class="fa-sharp-duotone fa-solid fa-plus"></i> New Account
          </button>
        </div>
      </div>

      <!-- ── Summary cards — per currency, per type ──────────────────── -->
      <template v-if="accounts.length">
        <div class="currency-summary" v-for="grp in currencyGroups" :key="grp.currency">
          <div class="currency-group-label">
            <span class="currency-flag">{{ grp.currency }}</span>
            <span class="currency-total-label">Total across all types</span>
            <span class="currency-total mono">{{ formatBalance(grp.total) }}</span>
          </div>
          <div class="currency-cards">
            <div class="summary-card" v-for="card in grp.cards" :key="card.label">
              <div class="summary-card__label">{{ card.label }}</div>
              <div class="summary-card__value mono">{{ formatBalance(card.value) }}</div>
              <div class="summary-card__sub">{{ card.count }} account{{ card.count !== 1 ? 's' : '' }}</div>
            </div>
          </div>
        </div>
      </template>
      <div v-else-if="loading" class="analytics-skeleton">
        <div class="skel" v-for="n in 4" :key="n"></div>
      </div>

      <!-- ── Filters ─────────────────────────────────────────────────── -->
      <div class="filters-bar">
        <div class="search-box">
          <i class="fa-sharp-duotone fa-solid fa-magnifying-glass"></i>
          <input v-model="search" placeholder="Search by code or owner name..." />
        </div>
        <select v-model="currencyFilter">
          <option value="">All Currencies</option>
          <option v-for="c in availableCurrencies" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="statusFilter">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <!-- ── Type tabs ───────────────────────────────────────────────── -->
      <div class="filter-tabs">
        <button v-for="t in tabs" :key="t.value"
          class="filter-tab" :class="{ active: activeTab === t.value }"
          @click="activeTab = t.value">
          {{ t.label }}
          <span class="tab-count">{{ countByType(t.value) }}</span>
        </button>
      </div>

      <!-- ── Account list ────────────────────────────────────────────── -->
      <div v-if="loading && !accounts.length" class="state-loading">
        <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i> Loading accounts...
      </div>

      <div v-else class="accounts-table-wrap">
        <div class="accounts-table">
          <div class="table-head">
            <span>Account</span>
            <span>Type</span>
            <span>Currency</span>
            <span>Balance</span>
            <span>Normal</span>
            <span>Owner</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          <div v-for="acc in filteredAccounts" :key="acc.id"
            class="table-row" :class="{ 'table-row--inactive': !acc.is_active }">

            <div class="col-account">
              <div class="account-code">{{ acc.code }}</div>
              <div class="account-sub" v-if="acc.corridor">{{ acc.corridor }}</div>
            </div>

            <div class="col-type">
              <span class="type-badge" :class="`type-badge--${acc.type}`">{{ acc.type }}</span>
            </div>

            <div class="col-currency mono">{{ acc.currency_code }}</div>

            <div class="col-balance">
              <span class="balance-value mono" :class="{ 'balance--low': isLow(acc), 'balance--zero': isZero(acc) }">
                {{ formatBalance(acc.balance) }}
              </span>
              <span class="balance-currency">{{ acc.currency_code }}</span>
            </div>

            <div class="col-normal">
              <span class="normal-badge" :class="`normal-badge--${acc.normal_balance}`">
                {{ acc.normal_balance }}
              </span>
            </div>

            <div class="col-owner">
              <span v-if="acc.owner_name" class="owner-name">{{ acc.owner_name }}</span>
              <span v-else class="cell-na">—</span>
            </div>

            <div class="col-status">
              <span class="status-dot" :class="acc.is_active ? 'status-dot--green' : 'status-dot--red'"></span>
              {{ acc.is_active ? 'Active' : 'Inactive' }}
            </div>

            <div class="col-actions">
              <button class="action-btn" @click="openLedger(acc)" title="View ledger">
                <i class="fa-sharp-duotone fa-solid fa-book-open"></i>
              </button>
              <button class="action-btn" @click="openAdjust(acc)" title="Manual adjustment">
                <i class="fa-sharp-duotone fa-solid fa-sliders"></i>
              </button>
              <button class="action-btn"
                :class="acc.is_active ? 'action-btn--danger' : 'action-btn--success'"
                @click="toggleAccount(acc)"
                :title="acc.is_active ? 'Deactivate' : 'Activate'">
                <i :class="acc.is_active
                  ? 'fa-sharp-duotone fa-solid fa-ban'
                  : 'fa-sharp-duotone fa-solid fa-check'"></i>
              </button>
            </div>
          </div>

          <div v-if="filteredAccounts.length === 0" class="table-empty">
            No accounts match your filters
          </div>
        </div>
      </div>

      <!-- ── Ledger Modal ─────────────────────────────────────────────── -->
      <div v-if="ledgerAccount" class="modal-overlay" @click.self="ledgerAccount = null">
        <div class="modal modal--wide">
          <div class="modal-header">
            <div>
              <h3>{{ ledgerAccount.code }}</h3>
              <p>{{ ledgerAccount.type }} · {{ ledgerAccount.currency_code }} · Normal balance: {{ ledgerAccount.normal_balance }}</p>
            </div>
            <button class="modal-close" @click="ledgerAccount = null">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="ledger-balance-bar">
            <div class="ledger-balance-item">
              <span>Current Balance</span>
              <strong class="mono">{{ formatBalance(ledgerAccount.balance) }} {{ ledgerAccount.currency_code }}</strong>
            </div>
            <div class="ledger-balance-item">
              <span>Total Debits</span>
              <strong class="mono debit-color">{{ formatBalance(ledgerAccount.total_debits) }}</strong>
            </div>
            <div class="ledger-balance-item">
              <span>Total Credits</span>
              <strong class="mono credit-color">{{ formatBalance(ledgerAccount.total_credits) }}</strong>
            </div>
            <div class="ledger-balance-item">
              <span>Entries</span>
              <strong>{{ ledgerEntries.length }}</strong>
            </div>
          </div>

          <div class="modal-body">
            <div v-if="ledgerLoading" class="state-loading">
              <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i> Loading entries...
            </div>
            <div v-else-if="ledgerEntries.length === 0" class="table-empty">
              No journal entries for this account
            </div>
            <div v-else class="ledger-table-wrap">
              <table class="ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th style="text-align:right">Amount</th>
                    <th style="text-align:right">Running Balance</th>
                    <th>Group Ref</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="entry in ledgerEntriesWithBalance" :key="entry.id"
                    :class="`ledger-row--${entry.entry_type}`">
                    <td class="mono" style="font-size:11px;white-space:nowrap">{{ formatDate(entry.posted_at) }}</td>
                    <td>
                      <span class="entry-type" :class="`entry-type--${entry.entry_type}`">
                        {{ entry.entry_type }}
                      </span>
                    </td>
                    <td class="mono" style="text-align:right;font-weight:700"
                      :class="entry.entry_type === 'credit' ? 'credit-color' : 'debit-color'">
                      {{ formatBalance(entry.amount) }}
                    </td>
                    <td class="mono" style="text-align:right;font-weight:700;color:#0f172a">
                      {{ formatBalance(entry.running_balance) }}
                    </td>
                    <td class="mono" style="font-size:11px;color:#64748b">{{ entry.group_reference ?? '—' }}</td>
                    <td style="font-size:12px;color:#64748b">{{ entry.description ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Adjustment Modal ─────────────────────────────────────────── -->
      <div v-if="adjustAccount" class="modal-overlay" @click.self="adjustAccount = null">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>Manual Adjustment</h3>
              <p>{{ adjustAccount.code }} · Current: {{ formatBalance(adjustAccount.balance) }} {{ adjustAccount.currency_code }}</p>
            </div>
            <button class="modal-close" @click="adjustAccount = null">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="warning-box">
              <i class="fa-sharp-duotone fa-solid fa-triangle-exclamation"></i>
              Manual adjustments post directly to the ledger. Use only for corrections. All actions are audited.
            </div>
            <div class="form-field">
              <label>Type</label>
              <div class="radio-group">
                <label class="radio-label" :class="{ active: adjustForm.type === 'credit' }">
                  <input type="radio" v-model="adjustForm.type" value="credit" />
                  <span>Credit (increase)</span>
                </label>
                <label class="radio-label" :class="{ active: adjustForm.type === 'debit' }">
                  <input type="radio" v-model="adjustForm.type" value="debit" />
                  <span>Debit (decrease)</span>
                </label>
              </div>
            </div>
            <div class="form-field">
              <label>Amount</label>
              <input type="number" v-model="adjustForm.amount" placeholder="0.00" step="0.01" min="0.01" />
            </div>
            <div class="form-field">
              <label>Reason <span class="hint">(required for audit trail)</span></label>
              <textarea v-model="adjustForm.reason" placeholder="Explain why this adjustment is needed..." rows="3"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="adjustAccount = null">Cancel</button>
            <button class="btn-primary"
              :disabled="actionLoading || !adjustForm.amount || !adjustForm.reason"
              @click="saveAdjustment">
              <i v-if="actionLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <i v-else class="fa-sharp-duotone fa-solid fa-check"></i>
              Post Adjustment
            </button>
          </div>
        </div>
      </div>

      <!-- ── Create Account Modal ─────────────────────────────────────── -->
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
        <div class="modal">
          <div class="modal-header">
            <div>
              <h3>Create System Account</h3>
              <p>Escrow, fee, guarantee, or partner accounts</p>
            </div>
            <button class="modal-close" @click="showCreate = false">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-field">
              <label>Account Code <span class="hint">(e.g. ESCROW-NGN, GUAR-MWK-NGN)</span></label>
              <input type="text" v-model="createForm.code" placeholder="ESCROW-NGN" />
            </div>
            <div class="form-grid">
              <div class="form-field">
                <label>Type</label>
                <select v-model="createForm.type">
                  <option value="escrow">Escrow</option>
                  <option value="fee">Fee</option>
                  <option value="guarantee">Guarantee</option>
                  <option value="partner">Partner</option>
                  <option value="system">System</option>
                </select>
              </div>
              <div class="form-field">
                <label>Currency</label>
                <select v-model="createForm.currency_code">
                  <option v-for="c in ALL_CURRENCIES" :key="c">{{ c }}</option>
                </select>
              </div>
            </div>
            <div class="form-field" v-if="createForm.type === 'guarantee'">
              <label>Corridor <span class="hint">(e.g. MWK-NGN)</span></label>
              <input type="text" v-model="createForm.corridor" placeholder="MWK-NGN" />
            </div>
            <div class="form-field">
              <label>Normal Balance</label>
              <div class="radio-group">
                <label class="radio-label" :class="{ active: createForm.normal_balance === 'credit' }">
                  <input type="radio" v-model="createForm.normal_balance" value="credit" />
                  <span>Credit (liabilities)</span>
                </label>
                <label class="radio-label" :class="{ active: createForm.normal_balance === 'debit' }">
                  <input type="radio" v-model="createForm.normal_balance" value="debit" />
                  <span>Debit (assets)</span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="showCreate = false">Cancel</button>
            <button class="btn-primary" :disabled="actionLoading || !createForm.code" @click="createAccount">
              <i v-if="actionLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <i v-else class="fa-sharp-duotone fa-solid fa-plus"></i>
              Create Account
            </button>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

// ── Constants ────────────────────────────────────────────────────────────
const ALL_CURRENCIES = ['MWK','KES','TZS','ZMW','ZAR','MZN','BWP','NGN','GHS','ZWG','AOA','ETB','UGX','RWF','XOF','XAF']

const ACCOUNT_TYPES = [
  { label: 'All',         value: 'all' },
  { label: 'Escrow',      value: 'escrow' },
  { label: 'Fee',         value: 'fee' },
  { label: 'Guarantee',   value: 'guarantee' },
  { label: 'Partner',     value: 'partner' },
  { label: 'User Wallet', value: 'user_wallet' },
  { label: 'System',      value: 'system' },
]

// ── State ────────────────────────────────────────────────────────────────
const accounts      = ref([])
const loading       = ref(false)
const actionLoading = ref(false)
const activeTab     = ref('all')
const search        = ref('')
const currencyFilter= ref('')
const statusFilter  = ref('')
const showCreate    = ref(false)

const ledgerAccount = ref(null)
const ledgerEntries = ref([])
const ledgerLoading = ref(false)

const adjustAccount = ref(null)
const adjustForm    = ref({ type: 'credit', amount: '', reason: '' })

const createForm = ref({
  code: '', type: 'escrow', currency_code: 'MWK',
  corridor: '', normal_balance: 'credit',
})

// ── Derived ───────────────────────────────────────────────────────────────
const availableCurrencies = computed(() => {
  return [...new Set(accounts.value.map(a => a.currency_code))].sort()
})

const tabs = computed(() => {
  return ACCOUNT_TYPES.map(t => ({ ...t }))
})

// Accounts after all filters applied
const filteredAccounts = computed(() => {
  return accounts.value.filter(a => {
    if (activeTab.value !== 'all' && a.type !== activeTab.value) return false
    if (currencyFilter.value && a.currency_code !== currencyFilter.value) return false
    if (statusFilter.value === 'active'   && !a.is_active) return false
    if (statusFilter.value === 'inactive' &&  a.is_active) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      const matchCode  = a.code?.toLowerCase().includes(q)
      const matchOwner = a.owner_name?.toLowerCase().includes(q)
      if (!matchCode && !matchOwner) return false
    }
    return true
  })
})

function countByType(type) {
  if (type === 'all') return filteredByFiltersOnly.value.length
  return filteredByFiltersOnly.value.filter(a => a.type === type).length
}

// Accounts filtered by currency/status/search but NOT by tab — used for tab counts
const filteredByFiltersOnly = computed(() => {
  return accounts.value.filter(a => {
    if (currencyFilter.value && a.currency_code !== currencyFilter.value) return false
    if (statusFilter.value === 'active'   && !a.is_active) return false
    if (statusFilter.value === 'inactive' &&  a.is_active) return false
    if (search.value) {
      const q = search.value.toLowerCase()
      if (!a.code?.toLowerCase().includes(q) && !a.owner_name?.toLowerCase().includes(q)) return false
    }
    return true
  })
})

// Currency groups for summary — scoped to current currency filter
const currencyGroups = computed(() => {
  const source = currencyFilter.value
    ? accounts.value.filter(a => a.currency_code === currencyFilter.value)
    : accounts.value

  const currencies = [...new Set(source.map(a => a.currency_code))].sort()

  return currencies.map(currency => {
    const inCurrency = source.filter(a => a.currency_code === currency)
    const types      = ['escrow','fee','guarantee','partner','system']
    const cards      = types.map(type => {
      const group = inCurrency.filter(a => a.type === type)
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        value: group.reduce((s, a) => s + a.balance, 0),
        count: group.length,
      }
    }).filter(c => c.count > 0)

    return {
      currency,
      total: inCurrency.reduce((s, a) => s + a.balance, 0),
      cards,
    }
  })
})

// Running balance for ledger — entries come newest-first, reverse to accumulate
const ledgerEntriesWithBalance = computed(() => {
  if (!ledgerEntries.value.length) return []
  const normal = ledgerAccount.value?.normal_balance ?? 'credit'

  // Work oldest → newest to accumulate running balance
  const reversed = [...ledgerEntries.value].reverse()
  let running = 0
  const withBalance = reversed.map(entry => {
    if (normal === 'credit') {
      running += entry.entry_type === 'credit' ? entry.amount : -entry.amount
    } else {
      running += entry.entry_type === 'debit' ? entry.amount : -entry.amount
    }
    return { ...entry, running_balance: running }
  })

  // Return newest-first again (matches the display order)
  return withBalance.reverse()
})

// ── Helpers ───────────────────────────────────────────────────────────────
function isLow(acc) {
  return acc.type === 'guarantee' && acc.balance < 1000
}
function isZero(acc) {
  return acc.balance === 0
}
const formatBalance = (v) =>
  Number(v || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate = (d) =>
  d ? new Date(d).toLocaleString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

// ── API ───────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.systemAccounts()
    accounts.value = data.accounts
  } catch {
    ui.error('Failed to load accounts')
  } finally {
    loading.value = false
  }
}

async function openLedger(acc) {
  ledgerAccount.value = { ...acc, total_debits: 0, total_credits: 0 }
  ledgerEntries.value = []
  ledgerLoading.value = true
  try {
    const { data } = await adminApi.accountLedger(acc.id)
    ledgerEntries.value = data.entries
    ledgerAccount.value = {
      ...acc,
      total_debits:  data.total_debits,
      total_credits: data.total_credits,
    }
  } catch {
    ui.error('Failed to load ledger')
  } finally {
    ledgerLoading.value = false
  }
}

function openAdjust(acc) {
  adjustAccount.value = acc
  adjustForm.value = { type: 'credit', amount: '', reason: '' }
}

async function saveAdjustment() {
  actionLoading.value = true
  try {
    await adminApi.accountAdjust(adjustAccount.value.id, adjustForm.value)
    ui.success('Adjustment posted to ledger')
    adjustAccount.value = null
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Adjustment failed')
  } finally { actionLoading.value = false }
}

async function toggleAccount(acc) {
  try {
    await adminApi.accountToggle(acc.id)
    ui.success(`Account ${acc.is_active ? 'deactivated' : 'activated'}`)
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Failed')
  }
}

async function createAccount() {
  actionLoading.value = true
  try {
    await adminApi.accountCreate(createForm.value)
    ui.success('Account created successfully')
    showCreate.value = false
    createForm.value = { code: '', type: 'escrow', currency_code: 'MWK', corridor: '', normal_balance: 'credit' }
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Failed to create')
  } finally { actionLoading.value = false }
}

onMounted(load)
</script>

<style scoped>
.page { padding: 20px; max-width: 1200px; }

/* ── Header ──────────────────────────────────────────────── */
.page-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.page-header h1 { font-size: 20px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; max-width: 500px; }
.header-actions { display: flex; align-items: center; gap: 8px; }
.btn-icon {
  width: 36px; height: 36px; background: #f8fafc; border: 1px solid var(--border);
  border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.btn-primary-sm {
  display: flex; align-items: center; gap: 6px; padding: 8px 14px;
  background: var(--accent); color: var(--text-inverse); border: none;
  border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
}

/* ── Currency summary ────────────────────────────────────── */
.currency-summary { margin-bottom: 20px; }
.currency-group-label {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
}
.currency-flag {
  font-size: 13px; font-weight: 800; font-family: monospace;
  background: #0f172a; color: #fff; padding: 3px 10px; border-radius: 6px;
}
.currency-total-label { font-size: 12px; color: #94a3b8; }
.currency-total { font-size: 14px; font-weight: 700; color: #0f172a; }

.currency-cards {
  display: grid; gap: 10px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}
.summary-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; padding: 12px 14px;
}
.summary-card__label {
  font-size: 10px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px;
}
.summary-card__value { font-size: 16px; font-weight: 800; color: #0f172a; }
.summary-card__sub   { font-size: 11px; color: #94a3b8; margin-top: 3px; }

/* Skeleton */
.analytics-skeleton { display: flex; gap: 12px; margin-bottom: 20px; }
.skel {
  flex: 1; height: 72px;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%; border-radius: 12px;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Filters ─────────────────────────────────────────────── */
.filters-bar {
  display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;
}
.search-box {
  display: flex; align-items: center; gap: 10px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; padding: 9px 14px; flex: 1; min-width: 200px;
}
.search-box i { color: #94a3b8; font-size: 12px; }
.search-box input {
  border: none; outline: none; font-size: 13px;
  color: #374151; width: 100%; background: transparent;
}
.filters-bar select {
  padding: 9px 12px; border: 1px solid var(--border); border-radius: 10px;
  font-size: 13px; background: var(--bg-card); outline: none;
  font-family: inherit; color: #374151;
}

/* ── Tabs ────────────────────────────────────────────────── */
.filter-tabs { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
.filter-tab {
  padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-card); color: #64748b; font-size: 12px; font-weight: 500;
  cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.15s;
}
.filter-tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
.tab-count {
  font-size: 11px; background: #f1f5f9; color: #475569;
  padding: 1px 6px; border-radius: 10px;
}
.filter-tab.active .tab-count { background: rgba(255,255,255,0.2); color: #fff; }

/* ── Table ───────────────────────────────────────────────── */
.accounts-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.accounts-table {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden; min-width: 860px;
}
.table-head {
  display: grid;
  grid-template-columns: 2fr 1fr 0.7fr 1.3fr 0.7fr 1.2fr 0.8fr 1fr;
  padding: 10px 16px; background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 0.7fr 1.3fr 0.7fr 1.2fr 0.8fr 1fr;
  padding: 11px 16px; border-bottom: 1px solid #f1f5f9;
  align-items: center; transition: background 0.1s;
}
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: #fafafa; }
.table-row--inactive { opacity: 0.5; }
.table-empty { padding: 36px; text-align: center; color: #94a3b8; font-size: 14px; }

.account-code { font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace; }
.account-sub  { font-size: 11px; color: #94a3b8; margin-top: 2px; }

.type-badge { padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.type-badge--escrow      { background: #eff6ff; color: #2563eb; }
.type-badge--fee         { background: #fdf4ff; color: #9333ea; }
.type-badge--guarantee   { background: #fff7ed; color: #ea580c; }
.type-badge--partner     { background: #f0fdf4; color: #16a34a; }
.type-badge--user_wallet { background: #f1f5f9; color: #475569; }
.type-badge--system      { background: #fef9c3; color: #854d0e; }

.col-currency { font-size: 13px; font-weight: 600; color: #334155; }
.col-normal   { font-size: 12px; }
.col-owner    { font-size: 12px; color: #475569; }
.owner-name   { font-weight: 500; }

.normal-badge { padding: 2px 7px; border-radius: 5px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
.normal-badge--credit { background: #f0fdf4; color: #15803d; }
.normal-badge--debit  { background: #fef2f2; color: #b91c1c; }

.balance-value { font-size: 13px; font-weight: 700; color: #0f172a; }
.balance-value.balance--low  { color: #dc2626; }
.balance-value.balance--zero { color: #94a3b8; }
.balance-currency { font-size: 11px; color: #94a3b8; margin-left: 3px; }

.col-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; }
.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-dot--green { background: #16a34a; }
.status-dot--red   { background: #dc2626; }

.col-actions { display: flex; gap: 5px; }
.action-btn {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border);
  background: #f8fafc; color: #64748b; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center; transition: all 0.15s;
}
.action-btn:hover          { background: #f1f5f9; }
.action-btn--danger:hover  { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
.action-btn--success:hover { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }
.cell-na { color: #cbd5e1; }

/* ── Loading ─────────────────────────────────────────────── */
.state-loading {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 48px; color: #94a3b8; font-size: 14px;
}

/* ── Modal ───────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.55);
  display: flex; align-items: flex-end; justify-content: center; z-index: 200;
}
.modal {
  background: var(--bg-card); border-radius: 20px 20px 0 0;
  width: 100%; max-width: 520px; max-height: 92vh; overflow-y: auto;
}
.modal--wide { max-width: 900px; }
.modal-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 20px 20px 16px; position: sticky; top: 0;
  background: var(--bg-card); z-index: 1; border-bottom: 1px solid #f1f5f9;
}
.modal-header h3 { font-size: 16px; font-weight: 700; color: #0f172a; }
.modal-header p  { font-size: 12px; color: #64748b; margin-top: 3px; }
.modal-close {
  width: 30px; height: 30px; background: #f1f5f9; border: none;
  border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.modal-body   { padding: 0 20px 16px; }
.modal-footer {
  display: flex; gap: 10px; padding: 12px 20px 20px;
  position: sticky; bottom: 0; background: var(--bg-card);
  border-top: 1px solid #f1f5f9;
}

/* ── Ledger ──────────────────────────────────────────────── */
.ledger-balance-bar {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1px; background: #f1f5f9;
  border-top: 1px solid #f1f5f9; border-bottom: 1px solid #e2e8f0;
}
.ledger-balance-item { background: var(--bg-card); padding: 14px 20px; }
.ledger-balance-item span {
  display: block; font-size: 11px; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px;
}
.ledger-balance-item strong { font-size: 15px; color: #0f172a; }

.ledger-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.ledger-table { width: 100%; border-collapse: collapse; min-width: 640px; }
.ledger-table th {
  text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em;
  padding: 8px 12px; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
  background: #f8fafc;
}
.ledger-table td {
  padding: 9px 12px; font-size: 13px; color: #334155;
  border-bottom: 1px solid #f8fafc; vertical-align: middle;
}
.ledger-table tr:last-child td { border-bottom: none; }
.ledger-row--credit td { background: #f0fdf4; }
.ledger-row--debit  td { background: #fef2f2; }

.entry-type {
  font-size: 11px; font-weight: 700; padding: 2px 8px;
  border-radius: 5px; text-transform: uppercase; white-space: nowrap;
}
.entry-type--credit { background: #dcfce7; color: #15803d; }
.entry-type--debit  { background: #fee2e2; color: #b91c1c; }
.credit-color { color: #15803d; }
.debit-color  { color: #b91c1c; }

/* ── Forms ───────────────────────────────────────────────── */
.form-field { margin-bottom: 16px; }
.form-field label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.form-field .hint { font-weight: 400; color: #94a3b8; }
.form-field input, .form-field select, .form-field textarea {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border);
  border-radius: 8px; font-size: 14px; outline: none; font-family: inherit;
  box-sizing: border-box; transition: border-color 0.15s;
}
.form-field input:focus, .form-field select:focus, .form-field textarea:focus {
  border-color: var(--accent);
}
.form-field textarea { resize: vertical; min-height: 72px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.radio-group { display: flex; gap: 8px; }
.radio-label {
  flex: 1; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  font-size: 13px; transition: all 0.15s;
}
.radio-label.active { border-color: var(--accent); background: #fff3ec; color: var(--accent); }
.radio-label input { display: none; }

.warning-box {
  display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px;
  background: var(--bg-elevated); border: 1px solid #fed7aa; border-radius: 8px;
  font-size: 13px; color: #9a3412; margin-bottom: 16px; line-height: 1.5;
}
.warning-box i { flex-shrink: 0; margin-top: 1px; }

.btn-ghost {
  flex: 1; padding: 12px; background: #f8fafc; color: #475569;
  border: 1px solid var(--border); border-radius: 10px;
  font-size: 14px; font-weight: 600; cursor: pointer;
}
.btn-primary {
  flex: 1; padding: 12px; background: var(--accent); color: var(--text-inverse);
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Responsive ──────────────────────────────────────────── */
@media (min-width: 769px) {
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 16px; }
}
@media (max-width: 768px) {
  .ledger-balance-bar { grid-template-columns: 1fr 1fr; }
}
</style>
