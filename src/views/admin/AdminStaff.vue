<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="admin-page__header">
        <div><h1>Staff Management</h1><p>Manage admin team access</p></div>
        <button class="btn-primary" @click="showCreate = true">
          <i class="fa-solid fa-user-plus"></i> Add Staff
        </button>
      </div>

      <div class="admin-table-card">
        <table v-if="staff.length" class="admin-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th></tr>
          </thead>
          <tbody>
            <tr v-for="member in staff" :key="member.id">
              <td><div class="cell-user__name">{{ member.name }}</div></td>
              <td class="cell-date">{{ member.email }}</td>
              <td><span class="role-badge">{{ formatRole(member.role) }}</span></td>
              <td><span class="badge" :class="member.status==='active'?'badge--green':'badge--red'">{{ member.status }}</span></td>
              <td class="cell-date">{{ member.last_login_at ? formatDate(member.last_login_at) : 'Never' }}</td>
            </tr>
          </tbody>
        </table>
        <div v-else class="table-empty"><i class="fa-solid fa-user-shield"></i><p>No staff members</p></div>
      </div>

      <!-- Create staff modal -->
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate=false">
        <div class="modal">
          <div class="modal__header">
            <h3>Add Staff Member</h3>
            <button class="modal__close" @click="showCreate=false"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal__body">
            <div class="form-field">
              <label>Full Name</label>
              <input v-model="newStaff.name" type="text" placeholder="Jane Banda" />
            </div>
            <div class="form-field">
              <label>Email</label>
              <input v-model="newStaff.email" type="email" placeholder="jane@ulendopay.com" />
            </div>
            <div class="form-field">
              <label>Role</label>
              <select v-model="newStaff.role">
                <option value="kyc_reviewer">KYC Reviewer</option>
                <option value="finance_officer">Finance Officer</option>
                <option value="support_agent">Support Agent</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            <div class="form-field">
              <label>Temporary Password</label>
              <input v-model="newStaff.password" type="password" placeholder="Min 8 characters" />
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn-ghost" @click="showCreate=false">Cancel</button>
            <button class="btn-success" :disabled="createLoading" @click="createStaff">
              <i v-if="createLoading" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-user-plus"></i>
              Create Account
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

const ui           = useUiStore()
const staff        = ref([])
const showCreate   = ref(false)
const createLoading= ref(false)
const newStaff     = ref({ name:'', email:'', role:'kyc_reviewer', password:'' })

function formatRole(r) { return {super_admin:'Super Admin',kyc_reviewer:'KYC Reviewer',finance_officer:'Finance Officer',support_agent:'Support Agent'}[r]||r }
function formatDate(d) { return new Date(d).toLocaleDateString('en',{day:'numeric',month:'short',year:'numeric'}) }

async function load() {
  const { data } = await adminApi.staffList()
  staff.value = data.staff ?? []
}

async function createStaff() {
  createLoading.value = true
  try {
    await adminApi.staffCreate(newStaff.value)
    ui.success('Staff account created')
    showCreate.value = false
    newStaff.value = { name:'', email:'', role:'kyc_reviewer', password:'' }
    await load()
  } catch(e) { ui.error(e.response?.data?.message || 'Failed') }
  finally { createLoading.value = false }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 32px; max-width: 1200px; }
.admin-page__header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.admin-page__header h1 { font-size: 24px; font-weight: 800; color: #0f172a; }
.admin-page__header p  { font-size: 13px; color: #64748b; margin-top: 4px; }
.btn-primary { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: var(--accent); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }
.admin-table-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
.admin-table { width: 100%; border-collapse: collapse; }
.admin-table th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; background: #f8fafc; border-bottom: 1px solid #f1f5f9; }
.admin-table td { padding: 14px 20px; border-bottom: 1px solid #f8fafc; font-size: 14px; color: #374151; }
.admin-table tr:last-child td { border-bottom: none; }
.cell-user__name { font-weight: 600; color: #111827; }
.cell-date { font-size: 13px; color: #64748b; }
.role-badge { background: #eff6ff; color: #2563eb; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.table-empty { padding: 48px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.table-empty i { font-size: 32px; }
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.modal { background: #fff; border-radius: 16px; width: 100%; max-width: 480px; }
.modal__header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
.modal__header h3 { font-size: 16px; font-weight: 700; }
.modal__close { width: 30px; height: 30px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center; justify-content: center; }
.modal__body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.form-field label { display: block; font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 6px; }
.form-field input, .form-field select { width: 100%; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; font-family: inherit; transition: border-color 0.15s; }
.form-field input:focus, .form-field select:focus { border-color: var(--accent); }
.modal__footer { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
.btn-ghost { padding: 10px 20px; background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-success { padding: 10px 20px; background: #16a34a; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; }
.btn-success:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
