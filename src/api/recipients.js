import client from './client'

export const recipientsApi = {
  getAll: () => client.get('/recipients'),
  create: (data) => client.post('/recipients', data),
  update: (id, data) => client.put(`/recipients/${id}`, data),
  delete: (id) => client.delete(`/recipients/${id}`),
}
