import client from './client'

export const ratesApi = {
  createLock: (data) => client.post('/rate-locks', data),
  getLock: (id) => client.get(`/rate-locks/${id}`),
}
