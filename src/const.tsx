export const APP_DOM_ID = 'bilibili-subtitle'

export const IFRAME_ID = 'bilibili-subtitle-iframe'

export const STORAGE_ENV = 'bilibili-subtitle_env'

export const EVENT_EXPAND = 'expand'

export const TASK_EXPIRE_TIME = 15*60*1000

export const PAGE_MAIN = 'main'
export const PAGE_SETTINGS = 'settings'

export const TRANSLATE_COOLDOWN = 5*1000
export const TRANSLATE_FETCH_DEFAULT = 15
export const TRANSLATE_FETCH_MIN = 5
export const TRANSLATE_FETCH_MAX = 25
export const TRANSLATE_FETCH_STEP = 5
export const LANGUAGE_DEFAULT = 'en'

export const TOTAL_HEIGHT_MIN = 400
export const TOTAL_HEIGHT_DEF = 520
export const TOTAL_HEIGHT_MAX = 800
export const HEADER_HEIGHT = 44
export const TITLE_HEIGHT = 24

export const WORDS_DEFAULT = import.meta.env.VITE_ENV === 'web-dev'?500:2000
export const WORDS_MIN = 1000
export const WORDS_MAX = 3000
export const WORDS_STEP = 500
export const SUMMARIZE_THRESHOLD = 100
export const SUMMARIZE_LANGUAGE_DEFAULT = 'cn'
export const SUMMARIZE_ALL_THRESHOLD = 5

export const SERVER_URL_OPENAI = 'https://api.openai.com'
export const SERVER_URL_THIRD = 'https://op.kongkongye.com'

export const LANGUAGES = [{
  code: 'en',
  name: 'English',
}, {
  code: 'ena',
  name: 'American English',
}, {
  code: 'enb',
  name: 'British English',
}, {
  code: 'cn',
  name: '中文简体',
}, {
  code: 'cnt',
  name: '中文繁体',
}, {
  code: 'Spanish',
  name: 'español',
}, {
  code: 'French',
  name: 'Français',
}, {
  code: 'Arabic',
  name: 'العربية',
}, {
  code: 'Russian',
  name: 'русский',
}, {
  code: 'German',
  name: 'Deutsch',
}, {
  code: 'Portuguese',
  name: 'Português',
}, {
  code: 'Italian',
  name: 'Italiano',
}]
export const LANGUAGES_MAP: {[key: string]: typeof LANGUAGES[number]} = {}
for (const language of LANGUAGES) {
  LANGUAGES_MAP[language.code] = language
}
