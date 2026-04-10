import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    nav: { home: 'Home', send: 'Send', history: 'History', kyc: 'KYC', profile: 'Profile' },
    auth: {
      login: 'Sign In', register: 'Create Account', logout: 'Sign Out',
      phone: 'Phone Number', pin: 'PIN', email: 'Email', password: 'Password',
      verifyPhone: 'Verify Phone', verifyLogin: 'Verify Login',
      otp: 'Verification Code', back: 'Back',
    },
    common: { loading: 'Please wait...', error: 'Something went wrong', submit: 'Submit' },
  }
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages,
})
