/**
 * 国际化 i18n
 *
 * 用法：
 *   import { t, locale, setLocale } from '@/i18n'
 *   t('home.recommend')           // 取当前语言文案
 *   setLocale('en')               // 切换语言
 *   t('common.empty', '默认值')    // 带兜底
 */
import { ref, computed } from 'vue'
import zh from './locales/zh'
import en from './locales/en'

const messages = { 'zh-CN': zh, 'en-US': en }
const STORAGE_KEY = 'qiye_ku_locale'

// 读取持久化的语言偏好
function getInitialLocale() {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY)
    if (saved && messages[saved]) return saved
  } catch {}
  return 'zh-CN'
}

export const locale = ref(getInitialLocale())

/** 支持的语言列表 */
export const locales = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' }
]

/** 当前语言包（响应式） */
export const messages_ref = computed(() => messages[locale.value] || messages['zh-CN'])

/**
 * 翻译函数
 * @param {string} key 点分路径，如 'home.recommend'
 * @param {string} fallback 找不到时的兜底文案
 */
export function t(key, fallback) {
  const parts = key.split('.')
  let val = messages[locale.value]
  for (const p of parts) {
    if (val == null) break
    val = val[p]
  }
  if (val == null) {
    // 回退到中文
    let zhVal = messages['zh-CN']
    for (const p of parts) { if (zhVal == null) break; zhVal = zhVal[p] }
    return zhVal != null ? zhVal : (fallback != null ? fallback : key)
  }
  return val
}

/** 切换语言（持久化） */
export function setLocale(l) {
  if (!messages[l]) return false
  locale.value = l
  try { uni.setStorageSync(STORAGE_KEY, l) } catch {}
  return true
}

/** 是否英文 */
export function isEn() { return locale.value === 'en-US' }
