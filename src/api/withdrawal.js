import client from './client'

export const withdrawalApi = {
  getOperators: ()           => client.get('/withdraw/operators'),
  initiate:     (data)       => client.post('/withdraw/initiate', data),
  getStatus:    (reference)  => client.get(`/withdraw/status/${reference}`),
  getHistory:   ()           => client.get('/withdraw/history'),
}
