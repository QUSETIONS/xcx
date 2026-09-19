<template>
  <view class="level-page" :style="a11yStyle">
    <view class="level-heading"><text class="page-title">我的等级与权益</text><text class="page-desc">让每一次连接，都多一些合作可能。</text></view>
    <view v-if="loadState === 'loading'" class="page-state">正在读取等级…</view>
    <view v-else-if="loadState === 'error'" class="page-state"><text>等级信息加载失败</text><button @tap="reload">重新加载</button></view>
    <template v-else>
      <view class="level-roadmap">
        <view v-for="level in levels" :key="level.id" class="level-card" :class="{ current: currentLevel === level.id, locked: level.rank > currentRank }">
          <view class="level-card-heading"><image :src="level.icon" mode="aspectFit" /><view><text class="level-number">{{ level.level }}</text><text>{{ level.name }}</text></view><text v-if="level.rank > currentRank" class="lock-label">可升级</text></view>
          <text class="level-tagline">{{ level.tagline }}</text>
          <view class="level-benefits"><text v-for="benefit in level.privileges" :key="benefit">{{ benefit }}</text></view>
          <view class="level-footer"><text>{{ currentLevel === level.id ? '当前等级' : level.rank < currentRank ? '已包含此级权益' : '升级后享有' }}</text><button v-if="level.rank > currentRank" class="upgrade-button" @tap="showUpgrade(level)">了解升级</button></view>
        </view>
      </view>
      <view class="level-explanation"><image src="/static/icons/shield.svg" mode="aspectFit" /><text>等级代表平台使用权益，甲乙方均适用。匹配数量是每轮上限，实际以符合条件的项目或团队为准；更高等级不保证成交，也不绕过联系授权。</text></view>
      <view class="account-benefits">
        <view><text class="benefits-title">我的现有权益</text><text class="benefits-desc">原会员等级、有效期、邀请奖励与优惠券继续保留。</text></view>
        <view class="benefits-grid"><view><text class="benefits-value">{{ activeLevel.level }} · {{ activeLevel.name }}</text><text>{{ expiryText }}</text></view><view><text class="benefits-value">{{ userStore.userInfo?.usage_credits || 0 }} 次</text><text>邀请体验余额 · {{ activeLevel.included_matching ? '当前匹配不扣减' : '按原有规则使用' }}</text></view></view>
        <text class="benefits-desc">需求发布、Agent 对话、档案、数据看板与人脉浏览均保留。等级到期后恢复基础级，已有资料与合作记录不会删除。在线付费升级暂未开放，邀请获得的等级体验仍可使用。</text>
        <view class="benefits-actions"><button @tap="goProfile">完善我的档案</button><button @tap="goCoupons">查看优惠券</button></view>
      </view>
    </template>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
import { a11yStyle } from '@/utils/accessibility'
import { MEMBER_LEVELS, getMemberLevel } from '../../../../Package/Member/levels.mjs'
const userStore = useUserStore()
const current = ref({ tier: 'free' })
const levels = computed(() => current.value.levels || MEMBER_LEVELS)
const activeLevel = computed(() => getMemberLevel(current.value))
const currentLevel = computed(() => activeLevel.value.id)
const currentRank = computed(() => activeLevel.value.rank)
const expiryText = computed(() => current.value.expired || (current.value.tier !== 'free' && currentLevel.value === 'free')
  ? '原等级已到期，基础功能继续可用'
  : currentLevel.value === 'free' ? '长期有效' : '有效期至 ' + String(current.value.expire).slice(0, 10))
const { state: loadState, run: loadRequest } = useRequest(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能查看会员权益'))) return null
  return bridge.member.current()
})
async function reload() {
  try {
    const data = await loadRequest()
    if (!data) return
    current.value = data
  } catch { /* 重试入口保持可见 */ }
}
function goProfile() { uni.navigateTo({ url: '/pages/intake/index' }) }
function goCoupons() { uni.navigateTo({ url: '/pages/coupon/index' }) }
function showUpgrade(level) {
  uni.showModal({ title: `了解${level.name}`, content: `${level.name}每轮最多匹配 ${level.match_limit} 个候选，有效期内不扣邀请体验次数。在线付费升级暂未开放；已有等级及邀请体验正常生效。`, showCancel: false, confirmText: '知道了' })
}
onMounted(reload)
</script>

<style scoped>
/* 与主站 Quiet Intelligence 令牌一致：暖纸白底、酒红主色、香槟金点缀。 */
.level-page { box-sizing: border-box; min-height: 100vh; padding: 32px 28px 80px; background: #F6F2EA; color: #17232D; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
.level-heading, .level-roadmap, .level-explanation, .account-benefits { width: 100%; max-width: 1440px; margin: 0 auto; box-sizing: border-box; }
.page-title { display: block; color: #3E1922; font-size: 28px; font-weight: 700; line-height: 1.4; }
.page-desc { display: block; margin-top: 8px; color: #626B6D; font-size: 15px; }
.level-roadmap { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; margin-top: 32px; }
.level-card { display: flex; flex-direction: column; min-width: 0; min-height: 292px; padding: 28px; border: 2px solid rgba(23, 35, 45, .13); border-radius: 24px; box-sizing: border-box; background: #FCFAF5; }
.level-card.current { border-color: #5A2530; box-shadow: 0 8px 24px rgba(90, 37, 48, .08); }
.level-card.locked { background: #FCFAF5; color: #626B6D; }
.level-card-heading { display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 700; }
.level-card-heading image { width: 36px; height: 36px; flex-shrink: 0; }
.level-number { display: block; font-size: 12px; letter-spacing: 1px; color: #968F83; margin-bottom: 4px; }
.level-tagline { display: block; margin-top: 16px; color: #626B6D; font-size: 14px; line-height: 1.6; }
.upgrade-button { margin: 0; padding: 6px 12px; border-radius: 6px; background: #F2EBDD; color: #5A2530; font-size: 13px; line-height: 1.5; }
.upgrade-button::after { border: 0; }
.locked .level-card-heading image { opacity: .5; filter: grayscale(1); }
.lock-label { margin-left: auto; color: #A47B42; font-size: 12px; font-weight: 400; white-space: nowrap; }
.level-benefits { display: flex; flex-direction: column; gap: 16px; padding: 32px 0; font-size: 15px; line-height: 1.6; overflow-wrap: anywhere; }
.level-footer { display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; margin-top: auto; padding-top: 20px; border-top: 1px solid rgba(23, 35, 45, .1); font-size: 14px; font-weight: 600; }
.level-note { font-size: 12px; font-weight: 400; }
.level-explanation { display: flex; align-items: flex-start; gap: 10px; padding: 22px 0; color: #626B6D; font-size: 13px; line-height: 1.7; }
.level-explanation image { width: 20px; height: 20px; flex-shrink: 0; }
.account-benefits { padding: 24px; border: 1px solid rgba(23, 35, 45, .13); border-radius: 20px; background: #FCFAF5; }
.benefits-title, .benefits-desc, .benefits-value { display: block; }
.benefits-title { font-size: 19px; font-weight: 700; }
.benefits-desc { margin-top: 8px; font-size: 14px; color: #626B6D; }
.benefits-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 24px 0; font-size: 13px; color: #626B6D; }
.benefits-value { color: #3E1922; font-size: 20px; font-weight: 600; margin-bottom: 8px; }
.benefits-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
.benefits-actions button, .page-state button { margin: 0; padding: 10px 20px; background: #5A2530; color: #FCFAF5; border-radius: 8px; font-size: 14px; line-height: 1.5; }
.benefits-actions button::after { border: 0; }
.page-state { padding: 80px 0; display: flex; align-items: center; flex-direction: column; gap: 20px; color: #626B6D; }
@media (max-width: 760px) { .level-page { padding: 24px 16px 60px; }.page-title { font-size: 23px; }.level-roadmap { grid-template-columns: 1fr; gap: 16px; margin-top: 24px; }.level-card { padding: 24px; min-height: 250px; }.level-benefits { padding: 24px 0; }.level-card-heading { font-size: 21px; } }
</style>
