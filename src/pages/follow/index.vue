<template>
  <view v-if="loadState === 'loading'" class="page-state">
    <text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
    <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>{{ t('common.loadFailed') }}</text>
    <text class="page-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="page">
    <view class="header"><text class="header-title">{{ t('user.following') }}</text></view>

    <view class="follow-list">
      <view class="follow-item" v-for="item in list" :key="item._id">
        <view class="avatar-box" :style="{ background: getAvatarColor(item.user.id) }">
          <text class="avatar-text">{{ item.user.nickname[0] }}</text>
        </view>
        <view class="user-info">
          <text class="user-name">{{ item.user.nickname }}</text>
          <text class="user-company">{{ item.user.company }}</text>
          <text class="user-bio">{{ item.user.bio }}</text>
        </view>
        <view class="follow-btn following" @tap="unfollow(item)">
          <text>{{ t('community.followed') }}</text>
        </view>
      </view>
    </view>

    <view v-if="!list.length" class="empty">
      <image class="empty-icon" src="/static/icons/users.svg" mode="aspectFit" />
      <text class="empty-text">{{ t('follow.empty') }}</text>
      <text class="empty-btn" @tap="goCommunity">{{ t('follow.goCommunity') }}</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.follow')

const list = ref([])
const userStore = useUserStore()

const { state: loadState, run: loadRequest } = useRequest(() => bridge.follow.list())
const { state: unfollowState, run: unfollowRequest } = useRequest(async (userId) => {
  await bridge.follow.toggle(userId)
  return bridge.follow.list()
})

async function reload() {
  if (!(await requirePageLogin(userStore, '登录后才能查看关注'))) return
  try {
    list.value = (await loadRequest()) || []
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

const colors = [
  'linear-gradient(135deg, #FF6B35, #FF9A5C)',
  'linear-gradient(135deg, #6366F1, #8B5CF6)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #EC4899, #F472B6)',
  'linear-gradient(135deg, #3B82F6, #60A5FA)',
]

function getAvatarColor(id) {
  return colors[id ? id.charCodeAt(id.length - 1) % 5 : 0]
}

function unfollow(item) {
  if (unfollowState.value === 'loading') return
  uni.showModal({
    title: t('follow.unfollowTitle'),
    content: t('follow.unfollowConfirm').replace('{name}', item.user.nickname),
    success: async (res) => {
      if (res.confirm) {
        try {
          list.value = (await unfollowRequest(item.user.id)) || []
          uni.showToast({ title: t('follow.unfollowed'), icon: 'none' })
        } catch {
          toastError(t('common.loadFailed'))
        }
      }
    }
  })
}

function goCommunity() { uni.navigateTo({ url: '/pages/community/index' }) }
</script>

<style scoped>
.page { background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }
.header { margin-bottom: 16rpx; }
.header-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.follow-list { display: flex; flex-direction: column; }
.follow-item { display: flex; align-items: center; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; margin-bottom: 12rpx; }
.avatar-box { width: 80rpx; height: 80rpx; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.avatar-text { font-size: 32rpx; color: #FFFFFF; font-weight: bold; }
.user-info { flex: 1; }
.user-name { font-size: 30rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 4rpx; }
.user-company { font-size: 24rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 4rpx; }
.user-bio { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.follow-btn { padding: 12rpx 28rpx; border-radius: 24rpx; flex-shrink: 0; }
.follow-btn.following { background: #F5F6FA; }
.follow-btn.following text { font-size: 24rpx; color: rgba(0,0,0,0.5); }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { width: 64rpx; height: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); display: block; margin-bottom: 16rpx; }
.empty-btn { font-size: 24rpx; color: #FF6B35; background: rgba(255,107,53,0.1); padding: 12rpx 32rpx; border-radius: 24rpx; display: inline-flex; }

/* 关注列表的用户资料列可收缩，操作按钮始终留在卡片内。 */
.page { width: 100%; max-width: 100%; overflow-x: hidden; box-sizing: border-box; }
.header, .follow-item, .user-info { min-width: 0; }
.user-info { flex: 1; overflow: hidden; }
.user-name, .user-company, .user-bio { display: block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.follow-btn { flex: 0 0 auto; white-space: nowrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .follow-item { padding: 16rpx; }
  .avatar-box { width: 68rpx; height: 68rpx; margin-right: 12rpx; }
  .follow-btn { padding-right: 18rpx; padding-left: 18rpx; }
}
</style>
