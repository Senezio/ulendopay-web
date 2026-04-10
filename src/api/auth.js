import client from './client'

export const authApi = {
  register: (data) => client.post('/auth/register', data),
  verifyPhone: (data) => client.post('/auth/verify-phone', data),
  login: (data) => client.post('/auth/login', data),
  verifyLogin: (data) => client.post('/auth/verify-login', data),
  forgotPin: (data) => client.post('/auth/forgot-pin', data),
  resetPin: (data) => client.post('/auth/reset-pin', data),
  forgotPassword: (data) => client.post('/auth/forgot-password', data),
  resetPassword: (data) => client.post('/auth/reset-password', data),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),
}
