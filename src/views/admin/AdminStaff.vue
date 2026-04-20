<template>
  <AdminLayout>
    <div class="ap">

      <div class="ap__head">
        <div>
          <h1>Staff Management</h1>
          <p>{{ staff.length }} team member{{ staff.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-add" @click="showCreate=true">
          <i class="fa-sharp-duotone fa-solid fa-user-plus"></i>
          Add Staff
        </button>
      </div>

      <div class="card">
        <!-- Desktop table -->
        <div class="table-wrap">
          <table v-if="staff.length" class="dt">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in staff" :key="m.id" class="dt__row">
                <td>
                  <div class="member">
                    <div class="member__avatar">{{ initials(m.name) }}</div>
                    <div>
                      <div class="uname">{{ m.name }}</div>
                      <div class="umeta">{{ m.email }}</div>
                    </div>
                  </div>
                </td>
                <td><span class="role-pill" :class="roleClass(m.role)">{{ fmtRole(m.role) }}</span></td>
                <td><span class="pill" :class="m.status==='active'?'pill--green':'pill--red'">{{ m.status }}</span></td>
                <td class="date">{{ m.last_login_at ? fmtDate(m.last_login_at) : 'Never' }}</td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile cards -->
          <div v-if="staff.length" class="mcards">
            <div v-for="m in staff" :key="m.id" class="mcard">
              <div class="mcard__top">
                <div class="member">
                  <div class="member__avatar">{{ initials(m.name) }}</div>
                  <div>
                    <div class="uname">{{ m.name }}</div>
                    <div class="umeta">{{ m.email }}</div>
                  </div>
                </div>
                <span class="pill" :class="m.status==='active'?'pill--green':'pill--red'">{{ m.status }}</span>
              </div>
              <div class="mcard__row">
                <span class="mcard__label">Role</span>
                <span class="role-pill" :class="roleClass(m.role)">{{ fmtRole(m.role) }}</span>
              </div>
              <div class="mcard__row">
                <span class="mcard__label">Last login</span>
                <span class="date">{{ m.last_login_at ? fmtDate(m.last_login_at) : 'Never' }}</span>
              </div>
            </div>
          </div>

          <div v-else class="empty">
            <i class="fa-duotone fa-solid fa-user-shield"></i>
            <span>No staff members yet</span>
          </div>
        </div>
      </div>

      <!-- Create modal -->
      <div v-if="showCreate" class="overlay" @click.self="showCreate=false">
        <div class="modal">
          <div class="modal__hd">
            <div>
              <div class="modal__title">Add Staff Member</div>
              <div class="modal__sub">They'll receive a welcome email with login instructions</div>
            </div>
            <button class="modal__x" @click="showCreate=false"><i class="fa-sharp-duotone fa-solid fa-xmark"></i></button>
          </div>
          <div class="modal__bd">
            <div class="frow">
              <label>Full Name</label>
              <input v-model="form.name" type="text" placeholder="e.g. Jane Banda" />
            </div>
            <div class="frow">
              <label>Email Address</label>
              <input v-model="form.email" type="email" placeholder="jane@ulendopay.com" />
            </div>
            <div class="frow">
              <label>Role</label>
              <select v-model="form.role">
                <option value="support">Support Agent</option>
                <option value="operations">Operations</option>
                <option value="compliance">Compliance</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <div class="role-hint">{{ roleHint(form.role) }}</div>
            </div>
            <div class="frow">
              <label>Temporary Password</label>
              <input v-model="form.password" type="password" placeholder="Min 8 characters" />
            </div>
          </div>
          <div class="modal__ft">
            <button class="btn-ghost" @click="showCreate=false">Cancel</button>
            <button class="btn-create" :disabled="createLoading" @click="createStaff">
              <i v-if="createLoading" class="fa-sharp-duotone fa-solid fa-spinner-third fa-spin"></i>
              <i v-else class="fa-sharp-duotone fa-solid fa-user-plus"></i>
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

const ui = useUiStore()
const staff = ref([])
const showCreate = ref(false)
const createLoading = ref(false)
const form = ref({ name:'', email:'', role:'support', password:'' })

const fmtRole = r => ({ super_admin:'Super Admin', operations:'Operations', compliance:'Compliance', support:'Support' }[r]||r)
const fmtDate = d => new Date(d).toLocaleDateString('en', { day:'numeric', month:'short', year:'numeric' })
const initials = n => n?.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase()||'?'
const roleClass = r => ({ super_admin:'role--super', operations:'role--ops', compliance:'role--comp', support:'role--sup' }[r]||'')
const roleHint = r => ({ super_admin:'Full platform access including staff management', operations:'Top-up, withdrawals and transaction management', compliance:'KYC review and fraud alerts', support:'User account management and transaction visibility' }[r]||'')

async function load() {
  const { data } = await adminApi.staffList()
  staff.value = data.staff ?? []
}

async function createStaff() {
  createLoading.value = true
  try {
    await adminApi.staffCreate(form.value)
    ui.success('Staff account created')
    showCreate.value = false
    form.value = { name:'', email:'', role:'support', password:'' }
    await load()
  } catch(e) { ui.error(e.response?.data?.message||'Failed') }
  finally { createLoading.value = false }
}

onMounted(load)
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');

.ap { padding: 28px 24px 48px; max-width: 900px; font-family: 'Sora', sans-serif; }
.ap__head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; gap: 16px; }
.ap__head h1 { font-size: 26px; font-weight: 800; color: #0d1117; letter-spacing: -0.03em; }
.ap__head p  { font-size: 13px; color: #6b7280; margin-top: 3px; font-weight: 500; }

.btn-add { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; background: #ea580c; color: var(--text-inverse); border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; transition: background 0.15s; white-space: nowrap; }
.btn-add:hover { background: #c2410c; }

.card { background: var(--bg-card); border-radius: 16px; border: 1px solid #e8edf2; box-shadow: 0 1px 4px rgba(0,0,0,0.05); overflow: hidden; }
.table-wrap { overflow-x: auto; }

.dt { width: 100%; border-collapse: collapse; }
.dt th { padding: 11px 20px; text-align: left; font-size: 10.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; background: #f8fafc; border-bottom: 1px solid #f1f5f9; white-space: nowrap; }
.dt td { padding: 16px 20px; border-bottom: 1px solid #f8fafc; font-size: 14px; vertical-align: middle; }
.dt__row:hover td { background: #fdf8f5; }
.dt__row:hover td:first-child { box-shadow: inset 3px 0 0 #ea580c; }
.dt tr:last-child td { border-bottom: none; }

.member { display: flex; align-items: center; gap: 12px; }
.member__avatar { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #ea580c, #f97316); display: flex; align-items: center; justify-content: center; color: var(--text-inverse); font-size: 13px; font-weight: 800; flex-shrink: 0; letter-spacing: 0.05em; }
.uname { font-weight: 700; color: #0d1117; font-size: 14px; }
.umeta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.date { font-family: 'DM Mono', monospace; font-size: 12px; color: #6b7280; }

.pill { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: capitalize; }
.pill--green { background: #dcfce7; color: #15803d; }
.pill--red   { background: #fee2e2; color: #b91c1c; }

.role-pill { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; letter-spacing: 0.03em; }
.role--super { background: #fef3c7; color: #92400e; }
.role--ops   { background: #ede9fe; color: #5b21b6; }
.role--comp  { background: #dbeafe; color: #1e40af; }
.role--sup   { background: #f0fdf4; color: #166534; }

.empty { padding: 56px 24px; text-align: center; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.empty i { font-size: 30px; opacity: 0.5; }
.empty span { font-size: 14px; font-weight: 500; }

/* Mobile cards */
.mcards { display: none; }
@media (max-width: 640px) {
  .dt { display: none; }
  .mcards { display: flex; flex-direction: column; }
  .mcard { padding: 16px; border-bottom: 1px solid #f1f5f9; }
  .mcard:last-child { border-bottom: none; }
  .mcard__top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
  .mcard__row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f8fafc; }
  .mcard__row:last-child { border-bottom: none; }
  .mcard__label { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
}

/* Modal */
.overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); display: flex; align-items: flex-end; justify-content: center; z-index: 200; }
@media (min-width: 600px) { .overlay { align-items: center; padding: 20px; } }
.modal { background: var(--bg-card); border-radius: 20px 20px 0 0; width: 100%; max-width: 500px; }
@media (min-width: 600px) { .modal { border-radius: 16px; } }
.modal__hd { padding: 22px 24px 16px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.modal__title { font-size: 17px; font-weight: 800; color: #0d1117; }
.modal__sub { font-size: 13px; color: #6b7280; margin-top: 3px; }
.modal__x { width: 30px; height: 30px; background: #f1f5f9; border: none; border-radius: 8px; cursor: pointer; color: #64748b; font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.modal__bd { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.frow label { display: block; font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 7px; letter-spacing: 0.02em; }
.frow input, .frow select { width: 100%; padding: 11px 14px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; font-family: inherit; color: #1e293b; transition: border-color 0.15s; }
.frow input:focus, .frow select:focus { border-color: #ea580c; }
.role-hint { font-size: 12px; color: #94a3b8; margin-top: 6px; font-weight: 500; }
.modal__ft { padding: 16px 24px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
.btn-ghost { padding: 10px 20px; background: #f8fafc; color: #475569; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; }
.btn-create { padding: 10px 20px; background: #0d1117; color: var(--text-inverse); border: none; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; font-family: inherit; transition: background 0.15s; }
.btn-create:hover:not(:disabled) { background: #1e293b; }
.btn-create:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
