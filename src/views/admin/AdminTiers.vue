<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Transfer Tiers</h1>
          <p>Manage KYC tiers and transfer limits</p>
        </div>
        <button class="btn-primary" @click="openCreate">
          <i class="fa-sharp-duotone fa-solid fa-plus"></i> New Tier
        </button>
      </div>

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
              <span class="limit-row__value">{{ formatAmount(tier.per_transaction_limit) }}</span>
            </div>
            <div class="limit-row">
              <span class="limit-row__label">Daily Limit</span>
              <span class="limit-row__value">{{ formatAmount(tier.daily_limit) }}</span>
            </div>
            <div class="limit-row">
              <span class="limit-row__label">Monthly Limit</span>
              <span class="limit-row__value">{{ formatAmount(tier.monthly_limit) }}</span>
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

      <!-- User Tier Upgrade Section -->
      <div class="section-header">
        <h2>Upgrade User Tier</h2>
        <p>Manually upgrade a user's KYC tier</p>
      </div>

      <div class="upgrade-form">
        <div class="form-row">
          <div class="form-field">
            <label>User ID</label>
            <input v-model="upgradeUserId" type="number" placeholder="Enter user ID" />
          </div>
          <div class="form-field">
            <label>Upgrade To</label>
            <select v-model="upgradeTier">
              <option value="">Select tier</option>
              <option v-for="tier in tiers" :key="tier.name" :value="tier.name">{{ tier.label }}</option>
            </select>
          </div>
          <div class="form-field form-field--full">
            <label>Reason <span class="muted">(optional)</span></label>
            <input v-model="upgradeReason" type="text" placeholder="Reason for upgrade..." />
          </div>
        </div>
        <button class="btn-primary" :disabled="!upgradeUserId || !upgradeTier || upgradeLoading" @click="doUpgrade">
          <i v-if="upgradeLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
          <i v-else class="fa-sharp-duotone fa-solid fa-arrow-up"></i>
          Upgrade Tier
        </button>
      </div>

      <!-- Create/Edit Modal -->
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
                <span class="form-hint">Lowercase, no spaces. Used internally.</span>
              </div>
              <div class="form-field">
                <label>Display Label <span class="required">*</span></label>
                <input v-model="form.label" placeholder="e.g. Premium" />
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
const actionLoading = ref(false)
const modal         = ref(null)
const editTarget    = ref(null)
const form          = ref({})

const upgradeUserId = ref('')
const upgradeTier   = ref('')
const upgradeReason = ref('')
const upgradeLoading = ref(false)

function formatAmount(v) {
  return Number(v || 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
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

function openCreate() {
  modal.value = 'create'
  form.value = {
    name: '', label: '', per_transaction_limit: 0,
    daily_limit: 0, monthly_limit: 0,
    fee_discount_percent: 0, is_active: true
  }
}

function openEdit(tier) {
  modal.value = 'edit'
  editTarget.value = tier
  form.value = {
    label: tier.label,
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

async function doUpgrade() {
  upgradeLoading.value = true
  try {
    await adminApi.userUpgradeTier(upgradeUserId.value, {
      tier: upgradeTier.value,
      reason: upgradeReason.value || undefined,
    })
    ui.success(`User upgraded to ${upgradeTier.value} tier`)
    upgradeUserId.value = ''
    upgradeTier.value   = ''
    upgradeReason.value = ''
  } catch (e) {
    ui.error(e.response?.data?.message || 'Upgrade failed')
  } finally {
    upgradeLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 16px; max-width: 1100px; }
@media (min-width: 768px) { .admin-page { padding: 24px 20px; } }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 12px; flex-wrap: wrap; }
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.tiers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px; }

.tier-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden;
  transition: box-shadow 0.2s;
}
.tier-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
.tier-card--inactive { opacity: 0.6; }

.tier-card__header {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  background: #f8fafc;
}
.tier-card__name { font-size: 15px; font-weight: 700; color: #0f172a; }
.tier-card__slug { font-size: 11px; color: #94a3b8; margin-top: 2px; font-family: monospace; }

.tier-card__limits { padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
.limit-row { display: flex; justify-content: space-between; align-items: center; }
.limit-row__label { font-size: 12px; color: #64748b; }
.limit-row__value { font-size: 13px; font-weight: 600; color: #0f172a; font-family: monospace; }
.limit-row__value.accent { color: var(--accent); }

.tier-card__footer { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }

.btn-edit {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-card); color: #374151; font-size: 12px;
  font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }

.section-header { margin-bottom: 16px; }
.section-header h2 { font-size: 17px; font-weight: 700; color: #0f172a; }
.section-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.upgrade-form {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; padding: 20px; margin-bottom: 32px;
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
@media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
.form-field--full { grid-column: 1 / -1; }
.form-field label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.form-field input, .form-field select {
  width: 100%; padding: 10px 12px; border: 1px solid var(--border);
  border-radius: 10px; font-size: 14px; background: var(--bg-card);
  outline: none; box-sizing: border-box; font-family: inherit;
  transition: border-color 0.15s;
}
.form-field input:focus, .form-field select:focus { border-color: var(--accent); }
.form-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; display: block; }
.muted { color: #94a3b8; font-weight: 400; }

.state-empty { text-align: center; padding: 48px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 18px; background: var(--accent); color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.modal {
  background: var(--bg-card); border-radius: 16px; width: 100%;
  max-width: 480px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid var(--border);
  position: sticky; top: 0; background: var(--bg-card); z-index: 1;
}
.modal__header h3 { font-size: 16px; font-weight: 700; }
.modal__close {
  width: 30px; height: 30px; background: #f1f5f9; border: none;
  border-radius: 8px; cursor: pointer; color: #64748b;
  display: flex; align-items: center; justify-content: center;
}
.modal__body { padding: 24px; }
.modal__footer {
  padding: 16px 24px; border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: 10px;
  position: sticky; bottom: 0; background: var(--bg-card);
}
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
@media (max-width: 480px) { .form-grid { grid-template-columns: 1fr; } }

.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--gray  { background: #f1f5f9; color: #475569; }

.required { color: var(--danger); }
.btn-ghost {
  padding: 10px 18px; background: #f8fafc; color: #475569;
  border: 1px solid var(--border); border-radius: 10px; font-size: 14px;
  font-weight: 600; cursor: pointer;
}
</style>
