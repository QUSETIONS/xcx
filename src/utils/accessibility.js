/**
 * 无障碍设置
 * - 字体缩放（满足视力不佳用户）
 * - 高对比度模式
 *
 * 用法：
 *   import { fontScale, highContrast, setFontScale, toggleContrast, rootStyle } from '@/utils/accessibility'
 *   <view :style="rootStyle">  // 应用全局缩放
 */
import { ref, computed } from 'vue'
import { STORAGE_KEYS } from '@/config/constants'

const FONT_KEY = STORAGE_KEYS.FONT_SCALE
const CONTRAST_KEY = STORAGE_KEYS.CONTRAST

// 字体档位
export const fontScales = [
  { value: 0.875, label: '小' },
  { value: 1, label: '标准' },
  { value: 1.125, label: '大' },
  { value: 1.25, label: '超大' }
]

function getInitialFont() {
  try { const v = uni.getStorageSync(FONT_KEY); return v || 1 } catch { return 1 }
}
function getInitialContrast() {
  try { return uni.getStorageSync(CONTRAST_KEY) === true } catch { return false }
}

export const fontScale = ref(getInitialFont())
export const highContrast = ref(getInitialContrast())

/** 设置字体缩放 */
export function setFontScale(scale) {
  fontScale.value = scale
  try { uni.setStorageSync(FONT_KEY, scale) } catch {}
}

/** 切换高对比度 */
export function toggleContrast() {
  highContrast.value = !highContrast.value
  try { uni.setStorageSync(CONTRAST_KEY, highContrast.value) } catch {}
  return highContrast.value
}

/**
 * 全局根样式：注入 font-size 缩放
 * 页面根节点 :style="rootStyle" 即可继承缩放
 */
export const rootStyle = computed(() => ({
  fontSize: (28 * fontScale.value) + 'rpx'
}))

/**
 * 高对比度主题色覆盖
 */
export const contrastColors = computed(() => highContrast.value ? {
  text: '#000000',
  textSecondary: '#333333',
  bg: '#FFFFFF',
  primary: '#D94A1A' // 加深的橙色，对比度更高
} : {
  text: 'rgba(0,0,0,0.85)',
  textSecondary: 'rgba(0,0,0,0.5)',
  bg: '#F5F6FA',
  primary: '#FF6B35'
})

/** 当前字体档位标签 */
export const currentFontLabel = computed(() => {
  const found = fontScales.find(f => f.value === fontScale.value)
  return found ? found.label : '标准'
})
