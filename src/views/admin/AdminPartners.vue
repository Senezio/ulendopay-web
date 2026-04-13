<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Partner Management</h1>
          <p>Manage payment partners and corridor settings</p>
        </div>
        <button class="btn-refresh" @click="load">
          <i class="fa-solid fa-rotate"></i>
        </button>
      </div>

      <div v-if="loading" class="state-empty">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Loading partners...</p>
      </div>

      <template v-else>
        <div v-for="partner in partners" :key="partner.id" class="partner-card">

          <!-- Partner Header -->
          <div class="partner-header">
            <div class="partner-info">
              <div class="partner-badge">{{ partner.code }}</div>
              <div>
                <div class="partner-name">{{ partner.name }}</div>
                <div class="partner-meta">
                  {{ partner.type }} · {{ partner.country_code }}
                  · Success rate: <strong>{{ partner.success_rate }}%</strong>
                  · Avg response: <strong>{{ partner.avg_response_time_ms }}ms</strong>
                </div>
              </div>
            </div>
            <div class="partner-actions">
              <span class="badge" :class="partner.is_active ? 'badge--green' : 'badge--red'">
                {{ partner.is_active ? 'Active' : 'Inactive' }}
              </span>
              <button
                class="btn-toggle"
                :class="partner.is_active ? 'btn-toggle--danger' : 'btn-toggle--success'"
                @click="togglePartner(partner)"
              >
                {{ partner.is_active ? 'Disable' : 'Enable' }}
              </button>
            </div>
          </div>

          <!-- Corridors -->
          <div class="corridors">
            <div class="corridors__title">Corridors</div>
            <div v-for="corridor in partner.corridors" :key="corridor.id" class="corridor-row">
              <div class="corridor-pair">
                <span class="currency">{{ corridor.from_currency }}</span>
                <i class="fa-solid fa-arrow-right"></i>
                <span class="currency">{{ corridor.to_currency }}</span>
                <span class="badge badge--sm" :class="corridor.is_active ? 'badge--green' : 'badge--gray'">
                  {{ corridor.is_active ? 'Active' : 'Off' }}
                </span>
              </div>
              <div class="corridor-stats">
                <span>Fee: {{ corridor.fee_percent }}% + {{ corridor.fee_flat }} flat</span>
                <span>Min: {{ corridor.min_amount }}</span>
                <span>Max: {{ corridor.max_amount }}</span>
              </div>
              <div class="corridor-actions">
                <button class="btn-sm btn-sm--edit" @click="openEdit(corridor)">
                  <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button
                  class="btn-sm"
                  :class="corridor.is_active ? 'btn-sm--danger' : 'btn-sm--success'"
                  @click="toggleCorridor(corridor)"
                >
                  {{ corridor.is_active ? 'Disable' : 'Enable' }}
                </button>
              </div>
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
                <label>Flat Fee <span class="hint">(in send currency)</span></label>
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

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui            = useUiStore()
const partners      = ref([])
const loading       = ref(false)
const actionLoading = ref(false)
const editTarget    = ref(null)
const editForm      = ref({})

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.partners()
    partners.value = data.partners
  } catch (e) {
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
  } catch (e) {
    ui.error(e.response?.data?.message || 'Failed')
  }
}

async function toggleCorridor(corridor) {
  try {
    await adminApi.corridorToggle(corridor.id)
    ui.success(`Corridor ${corridor.is_active ? 'disabled' : 'enabled'}`)
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Failed')
  }
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
    ui.success('Corridor updated successfully')
    editTarget.value = null
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Failed to save')
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 24px 20px; max-width: 900px; }
.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }
.btn-refresh { width: 36px; height: 36px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center; justify-content: center; }

.state-empty { text-align: center; padding: 48px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }

.partner-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; margin-bottom: 16px; overflow: hidden; }

.partner-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; gap: 12px; flex-wrap: wrap; }
.partner-info { display: flex; align-items: center; gap: 12px; }
.partner-badge { background: var(--accent); color: #fff; padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 700; }
.partner-name { font-size: 15px; font-weight: 700; color: #111827; }
.partner-meta { font-size: 12px; color: #64748b; margin-top: 2px; }
.partner-actions { display: flex; align-items: center; gap: 8px; }

.btn-toggle { padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
.btn-toggle--danger  { background: #fef2f2; color: #dc2626; }
.btn-toggle--success { background: #f0fdf4; color: #16a34a; }

.corridors { padding: 12px 20px; }
.corridors__title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 10px; }

.corridor-row { display: flex; flex-direction: column; gap: 6px; padding: 12px 0; border-bottom: 1px solid #f8fafc; }
.corridor-row:last-child { border-bottom: none; }

.corridor-pair { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.currency { font-weight: 700; color: #111827; }
.corridor-pair i { color: #94a3b8; font-size: 11px; }

.corridor-stats { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: #64748b; }

.corridor-actions { display: flex; gap: 8px; }
.btn-sm { padding: 5px 12px; border-radius: 7px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; display: flex; align-items: center; gap: 5px; }
.btn-sm--edit    { background: #eff6ff; color: #2563eb; }
.btn-sm--danger  { background: #fef2f2; color: #dc2626; }
.btn-sm--success { background: #f0fdf4; color: #16a34a; }

.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--sm { padding: 2px 6px; font-size: 10px; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--gray  { background: #f1f5f9; color: #475569; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
.modal { background: #fff; border-radius: 20px 20px 0 0; width: 100%; max-width: 480px; padding-bottom: env(safe-area-inset-bottom); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 20px 0; margin-bottom: 16px; }
.modal-header h3 { font-size: 15px; font-weight: 700; }
.modal-header button { background: #f1f5f9; border: none; width: 30px; height: 30px; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.modal-body { padding: 0 20px 16px; }
.modal-footer { display: flex; gap: 10px; padding: 0 20px 20px; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-field label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.form-field .hint { font-weight: 400; color: #94a3b8; }
.form-field input { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box; }
.form-field input:focus { border-color: var(--accent); }

.btn-ghost   { flex: 1; padding: 12px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-primary { flex: 1; padding: 12px; background: var(--accent); color: #fff; border: none; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

@media (min-width: 769px) {
  .modal-overlay { align-items: center; padding: 20px; }
  .modal { border-radius: 16px; }
  .corridor-row { flex-direction: row; align-items: center; justify-content: space-between; }
}
</style>
