import { createI18n } from 'vue-i18n'
import en from './en.js'
import ny from './ny.js'
import sw from './sw.js'

const savedLocale = localStorage.getItem('ulendo_locale') || 'en'

export const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: { en, ny, sw },
})

export const availableLocales = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ny', label: 'Chichewa', flag: '🇲🇼' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
]
