import client from './client'

export const walletApi = {
  getAll: () => client.get('/wallets'),
  getByCurrency: (currency) => client.get(`/wallets/${currency}`),
}
