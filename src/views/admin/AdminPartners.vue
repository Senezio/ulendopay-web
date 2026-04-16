<template>
  <AdminLayout>
    <div class="admin-page">

      <div class="page-header">
        <div>
          <h1>Partner Management</h1>
          <p>Manage payment partners and corridor settings</p>
        </div>
        <button class="btn-primary" @click="openAddPartner">
          <i class="fa-solid fa-plus"></i> Add Partner
        </button>
      </div>

      <div v-if="loading" class="state-center">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading partners...</p>
      </div>

      <template v-else>
        <div v-for="partner in partners" :key="partner.id" class="partner-block">

          <!-- Partner header -->
          <div class="partner-header">
            <div class="partner-header__left">
              <div class="partner-badge">{{ partner.code }}</div>
              <div>
                <div class="partner-name">{{ partner.name }}</div>
                <div class="partner-meta">
                  {{ partner.type }} · {{ partner.country_code }}
                  · Success: <strong>{{ partner.success_rate }}%</strong>
                  · Avg: <strong>{{ partner.avg_response_time_ms }}ms</strong>
                </div>
              </div>
            </div>
            <div class="partner-header__right">
              <span class="badge" :class="partner.is_active ? 'badge--green' : 'badge--red'">
                {{ partner.is_active ? 'Active' : 'Inactive' }}
              </span>
              <button class="btn-sm btn-sm--edit" @click="openEditPartner(partner)">
                <i class="fa-solid fa-pen"></i> Edit
              </button>
              <button
                class="btn-sm"
                :class="partner.is_active ? 'btn-sm--danger' : 'btn-sm--success'"
                @click="togglePartner(partner)"
              >
                {{ partner.is_active ? 'Disable' : 'Enable' }}
              </button>
            </div>
          </div>

          <!-- Corridors table -->
          <div class="corridors-section">
            <div class="corridors-toolbar">
              <span class="corridors-title">
                <i class="fa-solid fa-route"></i>
                {{ partner.corridors?.length ?? 0 }} Corridors
              </span>
              <div class="search-box search-box--sm">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                  v-model="corridorSearch[partner.id]"
                  placeholder="Filter corridors..."
                />
              </div>
            </div>

            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Fee %</th>
                    <th>Flat Fee</th>
                    <th>Min</th>
                    <th>Max</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="corridor in filteredCorridors(partner)"
                    :key="corridor.id"
                  >
                    <td><span class="cur cur--from">{{ corridor.from_currency }}</span></td>
                    <td><span class="cur cur--to">{{ corridor.to_currency }}</span></td>
                    <td class="cell-mono">{{ corridor.fee_percent }}%</td>
                    <td class="cell-mono">{{ corridor.fee_flat }}</td>
                    <td class="cell-mono">{{ corridor.min_amount }}</td>
                    <td class="cell-mono">{{ corridor.max_amount }}</td>
                    <td>
                      <span class="badge badge--sm" :class="corridor.is_active ? 'badge--green' : 'badge--gray'">
                        {{ corridor.is_active ? 'Active' : 'Off' }}
                      </span>
                    </td>
                    <td>
                      <div class="cell-actions">
                        <button class="btn-xs btn-xs--edit" @click="openEdit(corridor)">
                          <i class="fa-solid fa-pen"></i>
                        </button>
                        <button
                          class="btn-xs"
                          :class="corridor.is_active ? 'btn-xs--danger' : 'btn-xs--success'"
                          @click="toggleCorridor(corridor)"
                        >
                          {{ corridor.is_active ? 'Off' : 'On' }}
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!filteredCorridors(partner).length">
                    <td colspan="8" class="cell-empty">No corridors match filter</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </template>

      <!-- Edit Corridor Modal -->
      <div v-if="editTarget" class="modal-overlay" @click.self="editTarget = null">
        <div class="modal">
          <div class="modal-header">
            <h3>Edit Corridor — {{ editTarget.from_currency }} → {{ editTarget.to_currency }}</h3>
            <button @click="editTarget = null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-field">
                <label>Fee % <span class="hint">(e.g. 1.5 = 1.5%)</span></label>
                <input type="number" v-model="editForm.fee_percent" step="0.01" min="0" max="100" />
              </div>
              <div class="form-field">
                <label>Flat Fee</label>
                <input type="number" v-model="editForm.fee_flat" step="0.01" min="0" />
              </div>
              <div class="form-field">
                <label>Min Amount</label>
                <input type="number" v-model="editForm.min_amount" step="1" min="0" />
              </div>
              <div class="form-field">
                <label>Max Amount</label>
                <input type="number" v-model="editForm.max_amount" step="1" min="0" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="editTarget = null">Cancel</button>
            <button class="btn-primary" :disabled="actionLoading" @click="saveCorridor">
              <i v-if="actionLoading" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-floppy-disk"></i>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <!-- Add / Edit Partner Modal -->
      <div v-if="partnerModal" class="modal-overlay" @click.self="partnerModal = null">
        <div class="modal">
          <div class="modal-header">
            <h3>{{ partnerModal.id ? 'Edit Partner' : 'Add Partner' }}</h3>
            <button @click="partnerModal = null"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal-body">
            <div class="form-grid form-grid--single">
              <div class="form-field">
                <label>Partner Name <span class="required">*</span></label>
                <input type="text" v-model="partnerModal.name" placeholder="e.g. PawaPay" />
              </div>
              <div class="form-field">
                <label>Code <span class="required">*</span></label>
                <input type="text" v-model="partnerModal.code" placeholder="e.g. pawapay" />
              </div>
              <div class="form-field">
                <label>Type <span class="required">*</span></label>
                <select v-model="partnerModal.type">
                  <option value="mobile_money">Mobile Money</option>
                  <option value="bank">Bank</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div class="form-field">
                <label>Country Code <span class="required">*</span></label>
                <input type="text" v-model="partnerModal.country_code" placeholder="e.g. MWI" maxlength="3" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-ghost" @click="partnerModal = null">Cancel</button>
            <button class="btn-primary" :disabled="actionLoading" @click="savePartner">
              <i v-if="actionLoading" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-floppy-disk"></i>
              {{ partnerModal.id ? 'Save Changes' : 'Add Partner' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui             = useUiStore()
const partners       = ref([])
const loading        = ref(false)
const actionLoading  = ref(false)
const editTarget     = ref(null)
const editForm       = ref({})
const partnerModal   = ref(null)
const corridorSearch = reactive({})

function filteredCorridors(partner) {
  const q = (corridorSearch[partner.id] || '').toUpperCase()
  if (!q) return partner.corridors ?? []
  return (partner.corridors ?? []).filter(c =>
    c.from_currency.includes(q) || c.to_currency.includes(q)
  )
}

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.partners()
    partners.value = data.partners
  } catch {
    ui.error('Failed to load partners')
  } finally {
    loading.value = false
  }
}

async function togglePartner(partner) {
  try {
    await adminApi.partnerToggle(partner.id)
    ui.success(`Partner ${partner.is_active ? 'disabled' : 'enabled'}`)
    await load()
  } catch(e) { ui.error(e.response?.data?.message || 'Failed') }
}

async function toggleCorridor(corridor) {
  try {
    await adminApi.corridorToggle(corridor.id)
    ui.success(`Corridor ${corridor.is_active ? 'disabled' : 'enabled'}`)
    await load()
  } catch(e) { ui.error(e.response?.data?.message || 'Failed') }
}

function openEdit(corridor) {
  editTarget.value = corridor
  editForm.value   = {
    fee_percent: corridor.fee_percent,
    fee_flat:    corridor.fee_flat,
    min_amount:  corridor.min_amount,
    max_amount:  corridor.max_amount,
  }
}

async function saveCorridor() {
  actionLoading.value = true
  try {
    await adminApi.corridorUpdate(editTarget.value.id, editForm.value)
    ui.success('Corridor updated')
    editTarget.value = null
    await load()
  } catch(e) { ui.error(e.response?.data?.message || 'Failed') }
  finally { actionLoading.value = false }
}

function openAddPartner() {
  partnerModal.value = { name: '', code: '', type: 'mobile_money', country_code: '' }
}

function openEditPartner(partner) {
  partnerModal.value = {
    id:           partner.id,
    name:         partner.name,
    code:         partner.code,
    type:         partner.type,
    country_code: partner.country_code,
  }
}

async function savePartner() {
  if (!partnerModal.value.name || !partnerModal.value.code || !partnerModal.value.country_code) {
    ui.error('Please fill in all required fields')
    return
  }
  actionLoading.value = true
  try {
    if (partnerModal.value.id) {
      await adminApi.partnerUpdate(partnerModal.value.id, partnerModal.value)
      ui.success('Partner updated')
    } else {
      await adminApi.partnerCreate(partnerModal.value)
      ui.success('Partner added')
    }
    partnerModal.value = null
    await load()
  } catch(e) { ui.error(e.response?.data?.message || 'Failed to save partner') }
  finally { actionLoading.value = false }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 24px 20px; max-width: 1100px; }
.page-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 24px; gap: 12px;
}
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.btn-primary {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; background: var(--accent); color: #fff;
  border: none; border-radius: 12px; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap; flex-shrink: 0;
  transition: background 0.15s;
}
.btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* States */
.state-center {
  padding: 56px; text-align: center; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}

/* Partner block */
.partner-block {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 16px; margin-bottom: 20px; overflow: hidden;
}

.partner-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
  gap: 12px; flex-wrap: wrap;
}
.partner-header__left { display: flex; align-items: center; gap: 12px; }
.partner-badge {
  background: var(--accent); color: #fff;
  padding: 6px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}
.partner-name { font-size: 15px; font-weight: 700; color: #111827; }
.partner-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
.partner-header__right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

/* Badges */
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--sm  { padding: 2px 6px; font-size: 10px; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--gray  { background: #f1f5f9; color: #475569; }

/* Buttons */
.btn-sm {
  padding: 6px 12px; border-radius: 8px; font-size: 12px;
  font-weight: 600; cursor: pointer; border: none;
  display: inline-flex; align-items: center; gap: 5px;
  transition: all 0.15s;
}
.btn-sm--edit    { background: #eff6ff; color: #2563eb; }
.btn-sm--danger  { background: #fef2f2; color: #dc2626; }
.btn-sm--success { background: #f0fdf4; color: #16a34a; }

/* Corridors section */
.corridors-section { padding: 0; }
.corridors-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid #f8fafc;
  gap: 10px; flex-wrap: wrap;
}
.corridors-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.corridors-title i { color: #94a3b8; }

.search-box--sm {
  display: flex; align-items: center; gap: 6px;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
  padding: 6px 10px;
}
.search-box--sm i { color: #94a3b8; font-size: 11px; }
.search-box--sm input { border: none; outline: none; font-size: 12px; background: transparent; width: 140px; }

/* Table */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  padding: 9px 14px; text-align: left; font-size: 10px;
  font-weight: 700; color: #94a3b8; text-transform: uppercase;
  letter-spacing: 0.06em; background: #fafafa;
  border-bottom: 1px solid #f1f5f9; white-space: nowrap;
}
.data-table td {
  padding: 10px 14px; border-bottom: 1px solid #f8fafc;
  font-size: 13px; color: #374151; vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr:hover td { background: #fafafa; }

.cur { font-weight: 800; font-size: 13px; }
.cur--from { color: #0f172a; }
.cur--to   { color: var(--accent); }
.cell-mono { font-family: 'DM Mono', monospace; font-size: 12px; color: #475569; }
.cell-empty { text-align: center; color: #94a3b8; font-size: 13px; padding: 24px; }

.cell-actions { display: flex; gap: 6px; }
.btn-xs {
  padding: 4px 10px; border-radius: 6px; font-size: 11px;
  font-weight: 600; cursor: pointer; border: none;
  display: inline-flex; align-items: center; gap: 4px;
  transition: all 0.15s;
}
.btn-xs--edit    { background: #eff6ff; color: #2563eb; }
.btn-xs--danger  { background: #fef2f2; color: #dc2626; }
.btn-xs--success { background: #f0fdf4; color: #16a34a; }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.6);
  display: flex; align-items: flex-end; justify-content: center; z-index: 100;
}
.modal {
  background: #fff; border-radius: 20px 20px 0 0;
  width: 100%; max-width: 480px;
  padding-bottom: env(safe-area-inset-bottom);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 20px 0; margin-bottom: 16px;
}
.modal-header h3 { font-size: 15px; font-weight: 700; }
.modal-header button {
  background: #f1f5f9; border: none; width: 30px; height: 30px;
  border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.modal-body { padding: 0 20px 16px; }
.modal-footer { display: flex; gap: 10px; padding: 0 20px 20px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-grid--single { grid-template-columns: 1fr; }
.form-field label {
  display: block; font-size: 12px; font-weight: 600;
  color: #374151; margin-bottom: 6px;
}
.form-field .hint { font-weight: 400; color: #94a3b8; }
.form-field .required { color: var(--danger); }
.form-field input,
.form-field select {
  width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0;
  border-radius: 10px; font-size: 14px; outline: none;
  box-sizing: border-box; font-family: inherit; background: #fff;
}
.form-field input:focus,
.form-field select:focus { border-color: var(--accent); }

.btn-ghost {
  flex: 1; padding: 12px; background: #f8fafc; color: #475569;
  border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px;
  font-weight: 600; cursor: pointer;
}

@media (min-width: 641px) {
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 16px; }
}
</style>
