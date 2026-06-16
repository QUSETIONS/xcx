/**
 * useNavTitle - 动态设置导航栏标题（支持 i18n）
 *
 * 页面挂载时按当前语言设置导航栏标题，语言切换时自动更新。
 * 用法：
 *   import { useNavTitle } from '@/hooks/useNavTitle'
 *   useNavTitle('demand.detail')   // 标题走 i18n
 *
 * 这让所有页面的导航栏标题随语言切换，无需在 pages.json 写死。
 */
import { watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { t, locale } from '@/i18n'

export function useNavTitle(key, fallback) {
  const apply = () => {
    const title = t(key, fallback)
    try { uni.setNavigationBarTitle({ title }) } catch {}
  }
  onLoad(() => apply())
  // 语言切换时实时更新
  watch(locale, () => apply())
}
