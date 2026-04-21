<template>
  <AdminLayout>
    <div class="admin-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>Transfer Tiers</h1>
          <p>Manage KYC tiers and user limits</p>
        </div>
        <button class="btn-primary" @click="openCreate">
          <i class="fa-sharp-duotone fa-solid fa-plus"></i> New Tier
        </button>
      </div>

      <!-- Tier Cards -->
      <div v-if="loading" class="state-empty">
        <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
        <p>Loading tiers...</p>
      </div>

      <div v-else class="tiers-grid">
        <div v-for="tier in tiers" :key="tier.id" class="tier-card" :class="{ 'tier-card--inactive': !tier.is_active }">
          <div class="tier-card__header">
            <div>
              <div class="tier-card__name">{{ tier.label }}</div>
              <div class="tier-card__slug">{{ tier.name }}</div>
            </div>
            <span class="badge" :class="tier.is_active ? 'badge--green' : 'badge--gray'">
              {{ tier.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="tier-card__limits">
            <div class="limit-row">
              <span class="limit-row__label">Per Transaction</span>
              <span class="limit-row__value">{{ tier.limit_currency }} {{ formatAmount(tier.per_transaction_limit) }}</span>
            </div>
            <div class="limit-row">
              <span class="limit-row__label">Daily Limit</span>
              <span class="limit-row__value">{{ tier.limit_currency }} {{ formatAmount(tier.daily_limit) }}</span>
            </div>
            <div class="limit-row">
              <span class="limit-row__label">Monthly Limit</span>
              <span class="limit-row__value">{{ tier.limit_currency }} {{ formatAmount(tier.monthly_limit) }}</span>
            </div>
            <div class="limit-row">
              <span class="limit-row__label">Fee Discount</span>
              <span class="limit-row__value accent">{{ tier.fee_discount_percent }}%</span>
            </div>
          </div>
          <div class="tier-card__footer">
            <button class="btn-edit" @click="openEdit(tier)">
              <i class="fa-sharp-duotone fa-solid fa-pen"></i> Edit
            </button>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="section-header">
        <h2>Users & Tiers</h2>
        <p>Search, filter and upgrade user tiers</p>
      </div>

      <div class="table-card">
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="search-box">
            <i class="fa-sharp-duotone fa-solid fa-magnifying-glass"></i>
            <input v-model="search" placeholder="Search by name or email..." @input="debouncedLoad" />
          </div>
          <select v-model="filterTier" class="filter-select" @change="loadUsers">
            <option value="">All Tiers</option>
            <option v-for="tier in tiers" :key="tier.name" :value="tier.name">{{ tier.label }}</option>
          </select>
          <select v-model="filterKyc" class="filter-select" @change="loadUsers">
            <option value="">All KYC</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="none">None</option>
          </select>
        </div>

        <!-- Loading -->
        <div v-if="usersLoading" class="state-empty">
          <i class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
          <p>Loading users...</p>
        </div>

        <!-- Table -->
        <div v-else-if="users?.data?.length" class="table-scroll">
          <table class="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Country</th>
                <th>Account</th>
                <th>KYC</th>
                <th>Current Tier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users.data" :key="user.id">
                <td>
                  <div class="cell-user__name">{{ user.name }}</div>
                  <div class="cell-user__meta">{{ user.email }}</div>
                </td>
                <td class="cell-secondary">{{ user.country_code }}</td>
                <td class="cell-mono">{{ user.wallets?.[0]?.account_id ?? '—' }}</td>
                <td>
                  <span class="badge" :class="kycBadgeClass(user.kyc_status)">
                    {{ user.kyc_status || 'none' }}
                  </span>
                </td>
                <td>
                  <span class="tier-badge" :class="'tier-badge--' + (user.tier || 'unverified')">
                    {{ user.tier ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1) : 'Unverified' }}
                  </span>
                </td>
                <td>
                  <button class="btn-upgrade" @click="openUpgrade(user)">
                    <i class="fa-sharp-duotone fa-solid fa-arrow-up"></i> Upgrade
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="state-empty">
          <i class="fa-sharp-duotone fa-solid fa-users"></i>
          <p>No users found</p>
        </div>

        <!-- Pagination -->
        <div v-if="users?.last_page > 1" class="pagination">
          <button :disabled="users.current_page === 1" @click="changePage(users.current_page - 1)">
            <i class="fa-sharp-duotone fa-solid fa-chevron-left"></i>
          </button>
          <span>Page {{ users.current_page }} of {{ users.last_page }}</span>
          <button :disabled="users.current_page === users.last_page" @click="changePage(users.current_page + 1)">
            <i class="fa-sharp-duotone fa-solid fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <!-- Upgrade Modal -->
      <div v-if="upgradeTarget" class="modal-overlay" @click.self="upgradeTarget = null">
        <div class="modal">
          <div class="modal__header">
            <h3>Upgrade Tier — {{ upgradeTarget.name }}</h3>
            <button class="modal__close" @click="upgradeTarget = null">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal__body">
            <div class="upgrade-info">
              <div class="upgrade-info__row">
                <span>Current Tier</span>
                <span class="tier-badge" :class="'tier-badge--' + (upgradeTarget.tier || 'unverified')">
                  {{ upgradeTarget.tier || 'unverified' }}
                </span>
              </div>
              <div class="upgrade-info__row">
                <span>KYC Status</span>
                <span class="badge" :class="kycBadgeClass(upgradeTarget.kyc_status)">
                  {{ upgradeTarget.kyc_status || 'none' }}
                </span>
              </div>
            </div>
            <div class="form-field">
              <label>Upgrade To <span class="required">*</span></label>
              <select v-model="upgradeTier">
                <option value="">Select tier</option>
                <option v-for="tier in tiers" :key="tier.name" :value="tier.name">{{ tier.label }}</option>
              </select>
            </div>
            <div class="form-field" style="margin-top: 12px;">
              <label>Reason <span class="muted">(optional)</span></label>
              <input v-model="upgradeReason" type="text" placeholder="Reason for upgrade..." />
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn-ghost" @click="upgradeTarget = null">Cancel</button>
            <button class="btn-primary" :disabled="!upgradeTier || upgradeLoading" @click="doUpgrade">
              <i v-if="upgradeLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <i v-else class="fa-sharp-duotone fa-solid fa-arrow-up"></i>
              Confirm Upgrade
            </button>
          </div>
        </div>
      </div>

      <!-- Create/Edit Tier Modal -->
      <div v-if="modal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal__header">
            <h3>{{ modal === 'create' ? 'New Tier' : 'Edit Tier — ' + editTarget?.label }}</h3>
            <button class="modal__close" @click="closeModal">
              <i class="fa-sharp-duotone fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal__body">
            <div class="form-grid">
              <div v-if="modal === 'create'" class="form-field">
                <label>Tier Name <span class="required">*</span></label>
                <input v-model="form.name" placeholder="e.g. premium" />
                <span class="form-hint">Lowercase, no spaces.</span>
              </div>
              <div class="form-field">
                <label>Display Label <span class="required">*</span></label>
                <input v-model="form.label" placeholder="e.g. Premium" />
              </div>
              <div class="form-field">
                <label>Limit Currency</label>
                <input v-model="form.limit_currency" placeholder="USD" maxlength="3" />
              </div>
              <div class="form-field">
                <label>Per Transaction Limit</label>
                <input v-model="form.per_transaction_limit" type="number" min="0" />
              </div>
              <div class="form-field">
                <label>Daily Limit</label>
                <input v-model="form.daily_limit" type="number" min="0" />
              </div>
              <div class="form-field">
                <label>Monthly Limit</label>
                <input v-model="form.monthly_limit" type="number" min="0" />
              </div>
              <div class="form-field">
                <label>Fee Discount (%)</label>
                <input v-model="form.fee_discount_percent" type="number" min="0" max="100" />
              </div>
              <div class="form-field">
                <label>Status</label>
                <select v-model="form.is_active">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn-ghost" @click="closeModal">Cancel</button>
            <button class="btn-primary" :disabled="actionLoading" @click="saveModal">
              <i v-if="actionLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <i v-else class="fa-sharp-duotone fa-solid fa-floppy-disk"></i>
              {{ modal === 'create' ? 'Create Tier' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui            = useUiStore()
const tiers         = ref([])
const loading       = ref(false)
const modal         = ref(null)
const editTarget    = ref(null)
const form          = ref({})
const actionLoading = ref(false)

const users         = ref(null)
const usersLoading  = ref(false)
const search        = ref('')
const filterTier    = ref('')
const filterKyc     = ref('')
const currentPage   = ref(1)

const upgradeTarget  = ref(null)
const upgradeTier    = ref('')
const upgradeReason  = ref('')
const upgradeLoading = ref(false)

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { currentPage.value = 1; loadUsers() }, 400)
}

function formatAmount(v) {
  return Number(v || 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function kycBadgeClass(status) {
  return {
    verified: 'badge--green',
    pending:  'badge--amber',
    rejected: 'badge--red',
  }[status] || 'badge--gray'
}

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.tierList()
    tiers.value = data.tiers
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  usersLoading.value = true
  try {
    const { data } = await adminApi.users({
      search:     search.value || undefined,
      tier:       filterTier.value || undefined,
      kyc_status: filterKyc.value || undefined,
      page:       currentPage.value,
    })
    users.value = data
  } finally {
    usersLoading.value = false
  }
}

function changePage(page) {
  currentPage.value = page
  loadUsers()
}

function openCreate() {
  modal.value = 'create'
  form.value = {
    name: '', label: '', limit_currency: 'USD',
    per_transaction_limit: 0, daily_limit: 0, monthly_limit: 0,
    fee_discount_percent: 0, is_active: true,
  }
}

function openEdit(tier) {
  modal.value = 'edit'
  editTarget.value = tier
  form.value = {
    label: tier.label,
    limit_currency: tier.limit_currency ?? 'USD',
    per_transaction_limit: tier.per_transaction_limit,
    daily_limit: tier.daily_limit,
    monthly_limit: tier.monthly_limit,
    fee_discount_percent: tier.fee_discount_percent,
    is_active: tier.is_active,
  }
}

function closeModal() {
  modal.value = null
  editTarget.value = null
  form.value = {}
}

async function saveModal() {
  actionLoading.value = true
  try {
    if (modal.value === 'create') {
      await adminApi.tierCreate(form.value)
      ui.success('Tier created successfully')
    } else {
      await adminApi.tierUpdate(editTarget.value.id, form.value)
      ui.success('Tier updated successfully')
    }
    closeModal()
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Action failed')
  } finally {
    actionLoading.value = false
  }
}

function openUpgrade(user) {
  upgradeTarget.value = user
  upgradeTier.value   = ''
  upgradeReason.value = ''
}

async function doUpgrade() {
  upgradeLoading.value = true
  try {
    await adminApi.userUpgradeTier(upgradeTarget.value.id, {
      tier:   upgradeTier.value,
      reason: upgradeReason.value || undefined,
    })
    ui.success(`${upgradeTarget.value.name} upgraded to ${upgradeTier.value} tier`)
    upgradeTarget.value = null
    await loadUsers()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Upgrade failed')
  } finally {
    upgradeLoading.value = false
  }
}

onMounted(async () => {
  await load()
  await loadUsers()
})
</script>

<style scoped>
.admin-page { padding: 16px; max-width: 1100px; }
@media (min-width: 768px) { .admin-page { padding: 24px 20px; } }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.tiers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; margin-bottom: 32px; }

.tier-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; transition: box-shadow 0.2s; }
.tier-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.tier-card--inactive { opacity: 0.6; }
.tier-card__header { display: flex; justify-content: space-between; align-items: flex-start; padding: 16px 20px; border-bottom: 1px solid var(--border); background: #f8fafc; }
.tier-card__name { font-size: 15px; font-weight: 700; color: #0f172a; }
.tier-card__slug { font-size: 11px; color: #94a3b8; margin-top: 2px; font-family: monospace; }
.tier-card__limits { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.limit-row { display: flex; justify-content: space-between; align-items: center; }
.limit-row__label { font-size: 12px; color: #64748b; }
.limit-row__value { font-size: 13px; font-weight: 600; color: #0f172a; font-family: monospace; }
.limit-row__value.accent { color: var(--accent); }
.tier-card__footer { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }

.section-header { margin-bottom: 16px; }
.section-header h2 { font-size: 17px; font-weight: 700; color: #0f172a; }
.section-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.table-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 32px; }

.toolbar { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; }
.search-box { display: flex; align-items: center; gap: 8px; flex: 1; background: #f8fafc; border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; min-width: 180px; }
.search-box i { color: #94a3b8; font-size: 12px; }
.search-box input { border: none; outline: none; font-size: 13px; color: #374151; width: 100%; background: transparent; }
.filter-select { padding: 8px 12px; border: 1px solid var(--border); border-radius: 10px; font-size: 13px; background: var(--bg-card); outline: none; cursor: pointer; }

.table-scroll { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; min-width: 650px; }
.data-table th { padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap; }
.data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #374151; vertical-align: middle; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #fafafa; }

.cell-user__name { font-weight: 600; color: #111827; }
.cell-user__meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.cell-secondary { color: #64748b; }
.cell-mono { font-family: monospace; font-size: 12px; color: #475569; }

.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--amber { background: #fffbeb; color: #b45309; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--gray  { background: #f1f5f9; color: #475569; }

.tier-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; }
.tier-badge--unverified { background: #f1f5f9; color: #475569; }
.tier-badge--basic      { background: #fff7ed; color: #c2410c; }
.tier-badge--verified   { background: #f0fdf4; color: #16a34a; }

.btn-upgrade { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--accent); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.btn-upgrade:hover { background: var(--accent-dim); border-color: var(--accent); }

.btn-edit { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: #374151; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }

.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 14px; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; }
.pagination button { width: 32px; height: 32px; border: 1px solid var(--border); background: var(--bg-card); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #475569; }
.pagination button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

.state-empty { padding: 48px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.state-empty i { font-size: 28px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: var(--bg-card); border-radius: 16px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal__header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--bg-card); z-index: 1; }
.modal__header h3 { font-size: 16px; font-weight: 700; }
.modal__close { width: 30px; height: 30px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; }
.modal__body { padding: 24px; }
.modal__footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; position: sticky; bottom: 0; background: var(--bg-card); }

.upgrade-info { background: #f8fafc; border-radius: 10px; padding: 14px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px; }
.upgrade-info__row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #64748b; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 480px) { .form-grid { grid-template-columns: 1fr; } }
.form-field label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.form-field input, .form-field select { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; font-size: 14px; background: var(--bg-card); outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.15s; }
.form-field input:focus, .form-field select:focus { border-color: var(--accent); }
.form-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; display: block; }
.muted { color: #94a3b8; font-weight: 400; }
.required { color: var(--danger); }

.btn-primary { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost { padding: 10px 18px; background: #f8fafc; color: #475569; border: 1px solid var(--border); border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
</style>
