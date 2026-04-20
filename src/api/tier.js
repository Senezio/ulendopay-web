import client from './client'

export const tierApi = {
  // Get user's current tier and limits
  myTier: () => client.get('/tier'),

  // Get referral info and referral list
  referral: () => client.get('/referral'),

  // Fee calculator (auth optional)
  calculate: (params) => client.get('/calculator', { params }),
}
