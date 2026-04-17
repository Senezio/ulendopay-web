import client from './client'

export const adminApi = {
  // Dashboard
  stats: () => client.get('/admin/stats'),

  // KYC
  kycQueue: (params) => client.get('/admin/kyc/queue', { params }),
  kycShow: (id) => client.get(`/admin/kyc/${id}`),
  kycApprove: (id) => client.post(`/admin/kyc/${id}/approve`),
  kycReject: (id, reason) => client.post(`/admin/kyc/${id}/reject`, { reason }),

  // Users
  users: (params) => client.get('/admin/users', { params }),
  userShow: (id) => client.get(`/admin/users/${id}`),
  userSuspend: (id, reason) => client.post(`/admin/users/${id}/suspend`, { reason }),
  userRestore: (id) => client.post(`/admin/users/${id}/restore`),

  // Transactions
  transactions: (params) => client.get('/admin/transactions', { params }),
  transactionShow: (ref) => client.get(`/admin/transactions/${ref}`),

  // Rates
  rates: () => client.get('/admin/rates'),
  fetchRates: () => client.post('/admin/rates/fetch'),

  // Partners
  partners: () => client.get('/admin/partners'),
  partnerUpdate: (id, data) => client.put(`/admin/partners/${id}`, data),
  partnerCreate: (data) => client.post('/admin/partners', data),
  partnerToggle: (id) => client.post(`/admin/partners/${id}/toggle`),
  corridorUpdate: (id, data) => client.put(`/admin/corridors/${id}`, data),
  corridorToggle: (id) => client.post(`/admin/corridors/${id}/toggle`),

  // Fraud
  fraudAlerts: (params) => client.get('/admin/fraud-alerts', { params }),
  fraudClear: (id, notes) => client.post(`/admin/fraud-alerts/${id}/clear`, { notes }),
  fraudConfirm: (id, notes) => client.post(`/admin/fraud-alerts/${id}/confirm`, { notes }),

  // Staff
  staffList: () => client.get('/admin/staff'),
  staffCreate: (data) => client.post('/admin/staff', data),
  analytics: (days) => client.get('/admin/analytics', { params: { days } }),

  // KYC Document (fetched as blob to avoid direct IP access)
  kycDocument: (url) => client.get(url.replace(/.*\/api\/v1/, ''), { responseType: 'blob' }),

  // System Accounts
  systemAccounts: ()         => client.get('/admin/accounts'),
  accountLedger:  (id)       => client.get(`/admin/accounts/${id}/ledger`),
  accountToggle:  (id)       => client.post(`/admin/accounts/${id}/toggle`),
  accountAdjust:  (id, data) => client.post(`/admin/accounts/${id}/adjust`, data),
  accountCreate:  (data)     => client.post('/admin/accounts', data),
}
