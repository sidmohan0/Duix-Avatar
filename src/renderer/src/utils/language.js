const SUPPORTED_LANGUAGES = ['zh', 'en']

/*
 * Saved choice first, otherwise follow the system locale.
 * Falls back to English for locales without a translation.
 */
export function defaultLanguage() {
  const saved = window.localStorage.getItem('language')
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) {
    return saved
  }
  const system = (navigator.language || '').split('-')[0]
  return SUPPORTED_LANGUAGES.includes(system) ? system : 'en'
}
