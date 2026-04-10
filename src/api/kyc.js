import client from './client'

export const kycApi = {
  getStatus: () => client.get('/kyc/status'),
  submit: (formData) =>
    client.post('/kyc/submit', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
