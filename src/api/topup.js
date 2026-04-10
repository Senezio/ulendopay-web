import client from './client'

export const topupApi = {
  getOperators: ()           => client.get('/topup/operators'),
  initiate: (data)           => client.post('/topup/initiate', data),
  getStatus: (reference)     => client.get(`/topup/status/${reference}`),
  getHistory: ()             => client.get('/topup/history'),
}

// Already exported above
