<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div>
          <h1>KYC Review Queue</h1>
          <p>Pending identity verification requests</p>
        </div>
      </div>

      <div class="admin-table-card">
        <div class="table-toolbar">
          <div class="table-toolbar__count">
            <i class="fa-solid fa-clock"></i>
            {{ records?.total ?? 0 }} pending
          </div>
          <button class="btn-icon" @click="load">
            <i class="fa-solid fa-rotate"></i>
          </button>
        </div>

        <div v-if="loading" class="table-loading">
          <i class="fa-solid fa-spinner fa-spin"></i> Loading...
        </div>

        <table v-else-if="records?.data?.length" class="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Document</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in records.data" :key="record.id">
              <td>
                <div class="cell-user">
                  <div class="cell-user__name">{{ record.user?.name }}</div>
                  <div class="cell-user__meta">{{ record.user?.email }}</div>
                </div>
              </td>
              <td>
                <span class="badge badge--gray">{{ formatDocType(record.document_type) }}</span>
              </td>
              <td class="cell-date">{{ formatDate(record.created_at) }}</td>
              <td>
                <div class="cell-actions">
                  <button class="btn-action btn-action--view" @click="openRecord(record)">
                    <i class="fa-solid fa-eye"></i> Review
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-else class="table-empty">
          <i class="fa-solid fa-circle-check"></i>
          <p>No pending KYC submissions</p>
        </div>
      </div>

      <!-- Review Modal -->
      <div v-if="selected" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal__header">
            <h3>KYC Review — {{ selected.user?.name }}</h3>
            <button class="modal__close" @click="closeModal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal__body">

            <!-- Document Viewer -->
            <div class="document-viewer">
              <div class="document-viewer__label">Submitted Document</div>
              <div v-if="documentLoading" class="document-viewer__loading">
                <i class="fa-solid fa-spinner fa-spin"></i> Loading document...
              </div>
              <div v-else-if="documentUrl" class="document-viewer__content">
                <img
                  v-if="isImage"
                  :src="documentUrl"
                  alt="KYC Document"
                  class="document-viewer__img"
                  @error="documentError = true"
                />
                <iframe
                  v-else-if="isPdf"
                  :src="documentUrl"
                  class="document-viewer__pdf"
                  frameborder="0"
                ></iframe>
                <div v-else class="document-viewer__error">
                  <i class="fa-solid fa-file"></i>
                  <a :href="documentUrl" target="_blank" class="document-viewer__link">
                    Open Document <i class="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                </div>
              </div>
              <div v-else class="document-viewer__error">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Document unavailable</span>
              </div>
            </div>

            <!-- Metadata -->
            <div class="review-grid">
              <div class="review-field">
                <span class="review-field__label">Name</span>
                <span class="review-field__value">{{ selected.user?.name }}</span>
              </div>
              <div class="review-field">
                <span class="review-field__label">Email</span>
                <span class="review-field__value">{{ selected.user?.email || '—' }}</span>
              </div>
              <div class="review-field">
                <span class="review-field__label">Country</span>
                <span class="review-field__value">{{ selected.user?.country_code }}</span>
              </div>
              <div class="review-field">
                <span class="review-field__label">Document Type</span>
                <span class="review-field__value">{{ formatDocType(selected.document_type) }}</span>
              </div>
              <div class="review-field">
                <span class="review-field__label">Document Number</span>
                <span class="review-field__value">{{ selected.document_number || 'Not provided' }}</span>
              </div>
              <div class="review-field">
                <span class="review-field__label">Submitted</span>
                <span class="review-field__value">{{ formatDate(selected.created_at) }}</span>
              </div>
            </div>

            <!-- Rejection reason -->
            <div v-if="rejectMode" class="reject-form">
              <label>Rejection Reason <span class="required">*</span></label>
              <textarea
                v-model="rejectReason"
                placeholder="Explain why the document was rejected..."
                rows="3"
              ></textarea>
            </div>

          </div>
          <div class="modal__footer">
            <template v-if="!rejectMode">
              <button class="btn-danger-outline" @click="rejectMode = true">
                <i class="fa-solid fa-xmark"></i> Reject
              </button>
              <button class="btn-success" :disabled="actionLoading" @click="approve">
                <i v-if="actionLoading" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-check"></i>
                Approve
              </button>
            </template>
            <template v-else>
              <button class="btn-ghost" @click="rejectMode = false; rejectReason = ''">
                <i class="fa-solid fa-arrow-left"></i> Back
              </button>
              <button class="btn-danger" :disabled="!rejectReason || actionLoading" @click="reject">
                <i v-if="actionLoading" class="fa-solid fa-spinner fa-spin"></i>
                <i v-else class="fa-solid fa-xmark"></i>
                Confirm Rejection
              </button>
            </template>
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

const ui            = useUiStore()
const records       = ref(null)
const selected      = ref(null)
const loading       = ref(false)
const actionLoading = ref(false)
const rejectMode    = ref(false)
const rejectReason  = ref('')
const documentUrl   = ref(null)
const documentLoading = ref(false)
const documentError = ref(false)

const isImage = computed(() => {
  if (!selected.value?.file_path) return false
  return /\.(jpg|jpeg|png|webp)$/i.test(selected.value.file_path)
})

const isPdf = computed(() => {
  if (!selected.value?.file_path) return false
  return /\.pdf$/i.test(selected.value.file_path)
})

function formatDocType(type) {
  return {
    national_id: 'National ID',
    passport: 'Passport',
    drivers_license: "Driver's License",
    utility_bill: 'Utility Bill',
  }[type] || type
}

function formatDate(d) {
  return d ? new Date(d).toLocaleString('en', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }) : ''
}

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.kycQueue()
    records.value = data
  } finally {
    loading.value = false
  }
}

async function openRecord(record) {
  rejectMode.value   = false
  rejectReason.value = ''
  documentUrl.value  = null
  documentError.value = false
  selected.value     = record

  // Fetch full record with document_url
  documentLoading.value = true
  try {
    const { data } = await adminApi.kycShow(record.id)
    selected.value   = { ...data.record, user: data.user }
    if (data.record.document_url) {
      const url = new URL(data.record.document_url);
      documentUrl.value = data.record.document_url;
    } else {
      documentUrl.value = null;
    }
  } catch (e) {
    ui.error('Failed to load document')
  } finally {
    documentLoading.value = false
  }
}

function closeModal() {
  selected.value     = null
  rejectMode.value   = false
  rejectReason.value = ''
  documentUrl.value  = null
}

async function approve() {
  actionLoading.value = true
  try {
    await adminApi.kycApprove(selected.value.id)
    ui.success('KYC approved successfully')
    closeModal()
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Approval failed')
  } finally {
    actionLoading.value = false
  }
}

async function reject() {
  if (!rejectReason.value) return
  actionLoading.value = true
  try {
    await adminApi.kycReject(selected.value.id, rejectReason.value)
    ui.success('KYC rejected')
    closeModal()
    await load()
  } catch (e) {
    ui.error(e.response?.data?.message || 'Rejection failed')
  } finally {
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 32px; max-width: 1200px; }
.admin-page__header { margin-bottom: 24px; }
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }

.admin-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }

.table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 20px; border-bottom: 1px solid #f1f5f9;
}
.table-toolbar__count {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 600; color: #64748b;
}
.table-toolbar__count i { color: var(--accent); }

.btn-icon {
  width: 32px; height: 32px; background: #f8fafc;
  border: 1px solid #e2e8f0; border-radius: 8px;
  color: #64748b; cursor: pointer; font-size: 13px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.btn-icon:hover { border-color: var(--accent); color: var(--accent); }

.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th {
  padding: 12px 20px; text-align: left; font-size: 11px;
  font-weight: 700; color: #64748b; text-transform: uppercase;
  letter-spacing: 0.05em; background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}
.admin-table td {
  padding: 14px 20px; border-bottom: 1px solid #f8fafc;
  font-size: 14px; color: #374151;
}
.admin-table tr:last-child td { border-bottom: none; }
.admin-table tr:hover td { background: #fafafa; }

.cell-user__name { font-weight: 600; color: #111827; }
.cell-user__meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.cell-date { font-size: 13px; color: #64748b; }

.badge {
  display: inline-block; padding: 3px 8px; border-radius: 6px;
  font-size: 11px; font-weight: 600;
}
.badge--gray { background: #f1f5f9; color: #475569; }

.cell-actions { display: flex; gap: 6px; }
.btn-action {
  padding: 6px 12px; border-radius: 8px; font-size: 12px;
  font-weight: 600; cursor: pointer; border: none;
  display: flex; align-items: center; gap: 6px; transition: all 0.15s;
}
.btn-action--view { background: #eff6ff; color: #2563eb; }
.btn-action--view:hover { background: #dbeafe; }

.table-loading, .table-empty {
  padding: 48px; text-align: center; color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.table-empty i { font-size: 32px; color: #d1fae5; }
.table-empty p  { font-size: 14px; }

/* Document Viewer */
.document-viewer {
  margin-bottom: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}
.document-viewer__label {
  padding: 10px 16px;
  font-size: 11px; font-weight: 700;
  color: #64748b; text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.document-viewer__loading {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.document-viewer__content { background: #000; }
.document-viewer__img {
  width: 100%; max-height: 500px;
  object-fit: contain; display: block;
}
.document-viewer__pdf {
  width: 100%; height: 500px; display: block;
}
.document-viewer__error {
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.document-viewer__error i { font-size: 28px; color: #fbbf24; }
.document-viewer__link {
  color: #2563eb; font-size: 14px; font-weight: 600;
  text-decoration: none; display: flex; align-items: center; gap: 6px;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15,23,42,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100; padding: 20px;
}
.modal {
  background: #fff; border-radius: 16px; width: 100%;
  max-width: 560px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #f1f5f9;
  position: sticky; top: 0; background: #fff; z-index: 1;
}
.modal__header h3 { font-size: 16px; font-weight: 700; }
.modal__close {
  width: 30px; height: 30px; background: #f1f5f9; border: none;
  border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.modal__body { padding: 24px; }
.modal__footer {
  padding: 16px 24px; border-top: 1px solid #f1f5f9;
  display: flex; justify-content: flex-end; gap: 10px;
  position: sticky; bottom: 0; background: #fff;
}

.review-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.review-field__label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.review-field__value { font-size: 14px; font-weight: 500; color: #111827; }

.reject-form { margin-top: 20px; }
.reject-form label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; }
.reject-form .required { color: var(--danger); }
.reject-form textarea {
  width: 100%; padding: 12px; border: 1px solid #e2e8f0;
  border-radius: 10px; font-size: 14px; font-family: inherit;
  resize: vertical; outline: none; transition: border-color 0.15s;
  box-sizing: border-box;
}
.reject-form textarea:focus { border-color: var(--accent); }

.btn-success {
  padding: 10px 20px; background: #16a34a; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: 8px;
  transition: background 0.15s;
}
.btn-success:hover:not(:disabled) { background: #15803d; }
.btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger { padding: 10px 20px; background: var(--danger); color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-danger-outline { padding: 10px 20px; background: #fff; color: var(--danger); border: 1px solid var(--danger); border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-ghost { padding: 10px 20px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
</style>
