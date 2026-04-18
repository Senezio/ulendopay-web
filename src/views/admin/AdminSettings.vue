<template>
  <AdminLayout>
    <div class="admin-page">
      <div class="page-header">
        <div>
          <h1>Settings</h1>
          <p>System configuration and service status</p>
        </div>
        <button class="btn-icon" @click="load" title="Refresh">
          <i class="fa-solid fa-rotate" :class="{ 'fa-spin': loading }"></i>
        </button>
      </div>

      <div v-if="loading" class="state-loading">
        <i class="fa-solid fa-spinner fa-spin"></i> Loading...
      </div>

      <template v-else>

        <!-- App Info -->
        <div class="section">
          <div class="section-title">Application</div>
          <div class="info-grid">
            <div class="info-card">
              <div class="info-card__label">Environment</div>
              <div class="info-card__value">
                <span class="badge" :class="settings.app?.environment === 'production' ? 'badge--green' : 'badge--amber'">
                  {{ settings.app?.environment }}
                </span>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card__label">App URL</div>
              <div class="info-card__value mono">{{ settings.app?.url }}</div>
            </div>
            <div class="info-card">
              <div class="info-card__label">Timezone</div>
              <div class="info-card__value mono">{{ settings.app?.timezone }}</div>
            </div>
            <div class="info-card">
              <div class="info-card__label">Debug Mode</div>
              <div class="info-card__value">
                <span class="badge" :class="settings.app?.debug ? 'badge--red' : 'badge--green'">
                  {{ settings.app?.debug ? 'ON — disable in production' : 'OFF' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Services -->
        <div class="section">
          <div class="section-title">Payment & Communication Services</div>
          <div class="services-grid">
            <div
              v-for="(service, key) in settings.services"
              :key="key"
              class="service-card"
              :class="{ 'service-card--error': !service.configured }"
            >
              <div class="service-card__header">
                <div class="service-icon" :class="serviceIcon(key).color">
                  <i :class="serviceIcon(key).icon"></i>
                </div>
                <div class="service-card__title">{{ service.label }}</div>
                <span class="badge" :class="service.configured ? 'badge--green' : 'badge--red'">
                  {{ service.configured ? 'Configured' : 'Missing' }}
                </span>
              </div>

              <div class="service-card__body">
                <div class="service-field">
                  <span class="service-field__label">Environment</span>
                  <span class="badge badge--sm" :class="service.environment === 'production' ? 'badge--green' : 'badge--amber'">
                    {{ service.environment }}
                  </span>
                </div>
                <div class="service-field">
                  <span class="service-field__label">Base URL</span>
                  <span class="mono service-field__value">{{ service.base_url }}</span>
                </div>
                <div class="service-field">
                  <span class="service-field__label">API Key</span>
                  <span v-if="service.configured" class="mono service-field__value key-preview">
                    {{ service.preview }}
                  </span>
                  <span v-else class="service-field__missing">
                    <i class="fa-solid fa-triangle-exclamation"></i> Not set in .env
                  </span>
                </div>
              </div>

              <div v-if="!service.configured" class="service-card__warning">
                <i class="fa-solid fa-circle-info"></i>
                Update <code>.env</code> on the server to configure this service.
              </div>
            </div>
          </div>
        </div>

        <!-- Security notice -->
        <div class="security-notice">
          <i class="fa-solid fa-shield-halved"></i>
          <div>
            <strong>Security Notice</strong>
            <p>API keys are stored in the server <code>.env</code> file and are never exposed through this interface. Only masked previews are shown. To update a key, SSH into the server and edit <code>.env</code> directly, then run <code>php artisan config:clear</code>.</p>
          </div>
        </div>

      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api/admin'
import { useUiStore } from '@/stores/ui'

const ui       = useUiStore()
const loading  = ref(false)
const settings = ref({ app: {}, services: {} })

function serviceIcon(key) {
  const icons = {
    pawapay:               { icon: 'fa-solid fa-money-bill-wave', color: 'icon--blue' },
    mtn_momo_collection:   { icon: 'fa-solid fa-mobile-screen',   color: 'icon--yellow' },
    mtn_momo_disbursement: { icon: 'fa-solid fa-paper-plane',     color: 'icon--yellow' },
    africastalking:        { icon: 'fa-solid fa-comment-sms',     color: 'icon--green' },
  }
  return icons[key] || { icon: 'fa-solid fa-plug', color: 'icon--gray' }
}

async function load() {
  loading.value = true
  try {
    const { data } = await adminApi.settings()
    settings.value = data
  } catch {
    ui.error('Failed to load settings')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-page { padding: 16px; max-width: 1100px; }
@media (min-width: 768px) { .admin-page { padding: 24px 20px; } }

.page-header {
  display: flex; justify-content: space-between;
  align-items: flex-start; margin-bottom: 24px; gap: 12px;
}
.page-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
.page-header p  { font-size: 13px; color: #64748b; margin-top: 3px; }

.btn-icon {
  width: 36px; height: 36px; background: #f8fafc;
  border: 1px solid #e2e8f0; border-radius: 8px;
  color: #64748b; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}

.state-loading {
  display: flex; align-items: center; justify-content: center;
  gap: 10px; padding: 48px; color: #94a3b8; font-size: 14px;
}

.section { margin-bottom: 28px; }
.section-title {
  font-size: 12px; font-weight: 700; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 12px;
}

/* App info grid */
.info-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
@media (min-width: 768px) { .info-grid { grid-template-columns: repeat(4, 1fr); } }

.info-card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 14px 16px;
}
.info-card__label {
  font-size: 11px; font-weight: 600; color: #94a3b8;
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;
}
.info-card__value { font-size: 13px; font-weight: 600; color: #0f172a; word-break: break-all; }

/* Services grid */
.services-grid {
  display: grid; grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 768px) { .services-grid { grid-template-columns: repeat(2, 1fr); } }

.service-card {
  background: #fff; border: 1px solid #e2e8f0;
  border-radius: 12px; overflow: hidden;
}
.service-card--error { border-color: #fecaca; }

.service-card__header {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-bottom: 1px solid #f1f5f9;
}
.service-card__title { font-size: 14px; font-weight: 700; color: #0f172a; flex: 1; }

.service-icon {
  width: 36px; height: 36px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.icon--blue   { background: #eff6ff; color: #2563eb; }
.icon--yellow { background: #fefce8; color: #ca8a04; }
.icon--green  { background: #f0fdf4; color: #16a34a; }
.icon--gray   { background: #f1f5f9; color: #64748b; }

.service-card__body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }

.service-field { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.service-field__label {
  font-size: 12px; font-weight: 600; color: #64748b;
  text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0;
}
.service-field__value { font-size: 12px; color: #374151; word-break: break-all; text-align: right; }
.service-field__missing { font-size: 12px; color: #dc2626; display: flex; align-items: center; gap: 5px; }

.key-preview {
  background: #f1f5f9; padding: 2px 8px;
  border-radius: 6px; font-size: 12px; color: #475569;
  letter-spacing: 0.05em;
}

.service-card__warning {
  margin: 0 16px 14px; padding: 10px 12px;
  background: #fef2f2; border-radius: 8px;
  font-size: 12px; color: #dc2626;
  display: flex; align-items: flex-start; gap: 8px;
}
.service-card__warning code {
  background: rgba(220,38,38,0.1); padding: 1px 4px;
  border-radius: 4px; font-size: 11px;
}

/* Security notice */
.security-notice {
  display: flex; gap: 14px; padding: 16px 20px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 12px; margin-top: 8px;
}
.security-notice i { color: #2563eb; font-size: 18px; margin-top: 2px; flex-shrink: 0; }
.security-notice strong { display: block; font-size: 13px; color: #0f172a; margin-bottom: 4px; }
.security-notice p { font-size: 12px; color: #64748b; line-height: 1.6; margin: 0; }
.security-notice code {
  background: #e2e8f0; padding: 1px 5px;
  border-radius: 4px; font-size: 11px; color: #374151;
}

/* Badges */
.badge { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; }
.badge--sm { padding: 2px 6px; font-size: 10px; }
.badge--green { background: #f0fdf4; color: #16a34a; }
.badge--red   { background: #fef2f2; color: #dc2626; }
.badge--amber { background: #fffbeb; color: #d97706; }

.mono { font-family: 'DM Mono', monospace; }
</style>
