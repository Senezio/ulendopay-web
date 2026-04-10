import client from './client'

export const transactionsApi = {
  create: (data) => client.post('/transactions', data),
  getAll: (params) => client.get('/transactions', { params }),
  getByReference: (reference) => client.get(`/transactions/${reference}`),
}
