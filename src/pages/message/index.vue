<template>
  <view class="page">
    <view class="header"><text class="header-title">消息中心</text></view>

    <view class="tab-bar">
      <view class="tab-item" :class="{ active: currentTab === 'all' }" @tap="currentTab = 'all'"><text>全部</text></view>
      <view class="tab-item" :class="{ active: currentTab === 'system' }" @tap="currentTab = 'system'"><text>系统通知</text></view>
      <view class="tab-item" :class="{ active: currentTab === 'interact' }" @tap="currentTab = 'interact'"><text>互动消息</text></view>
    </view>

    <scroll-view class="list-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <view class="msg-list" :class="{ 'animate-in': animated }">
        <view class="msg-item" v-for="(item, idx) in filteredList" :key="item.id"
          :class="{ 'fade-in': animated, unread: !item.read }" :style="{ animationDelay: (idx * 0.08) + 's' }"
          @tap="readMsg(item)">
          <view class="msg-icon-box" :class="'type-' + item.type">
            <text class="msg-icon">{{ getIcon(item.type) }}</text>
          </view>
          <view class="msg-content">
            <view class="msg-top">
              <text class="msg-title">{{ item.title }}</text>
              <text class="msg-time">{{ item.time }}</text>
            </view>
            <text class="msg-desc">{{ item.desc }}</text>
          </view>
          <view class="msg-dot" v-if="!item.read"/>
        </view>
      </view>
      <view v-if="!filteredList.length" class="empty">
        <text class="empty-icon">📭</text>
        <text class="empty-text">暂无消息</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const currentTab = ref('all')
const refreshing = ref(false)
const animated = ref(false)

const messages = ref([
  { id: 1, type: 'system', title: '系统维护通知', desc: '系统将于今晚22:00进行维护升级，预计持续2小时', time: '刚刚', read: false },
  { id: 2, type: 'interact', title: '有人对接了您的需求', desc: '张经理对接了「短视频运营合作」需求，请及时查看', time: '10分钟前', read: false },
  { id: 3, type: 'system', title: '需求审核通过', desc: '您发布的「品牌营销策划」需求已通过审核，正在展示中', time: '1小时前', read: true },
  { id: 4, type: 'interact', title: '新的评论', desc: '李总评论了您的帖子「私域流量增长方法论」', time: '2小时前', read: false },
  { id: 5, type: 'system', title: '会员权益到期提醒', desc: '您的会员权益将于3天后到期，续费享8折优惠', time: '昨天', read: true },
  { id: 6, type: 'interact', title: '收到新订单', desc: '您购买的「会员月卡」已生效，有效期至2025年1月15日', time: '昨天', read: true },
  { id: 7, type: 'system', title: '平台规则更新', desc: '平台用户协议已更新，请查阅了解最新规则', time: '3天前', read: true },
])

const filteredList = computed(() => {
  if (currentTab.value === 'all') return messages.value
  return messages.value.filter(m => m.type === currentTab.value)
})


function getIcon(type) {
  const map = { system: '📢', interact: '💬' }
  return map[type] || '📬'
}

function readMsg(item) {
  item.read = true
  uni.showToast({ title: item.title, icon: 'none' })
}

function onRefresh() { refreshing.value = true; refreshing.value = false }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding-bottom: 40rpx; }

.header { padding: 24rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.tab-bar { display: flex; padding: 0 24rpx 16rpx; }
.tab-item { padding: 12rpx 24rpx; background: #FFFFFF; border-radius: 20rpx; font-size: 26rpx; color: rgba(0,0,0,0.6); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.tab-item.active { background: rgba(255,107,53,0.1); color: #FF6B35; font-weight: bold; }

.list-scroll { height: calc(100vh - 160rpx); padding: 0 24rpx; }
.msg-list { display: flex; flex-direction: column; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }

.msg-item { margin-bottom: 12rpx; display: flex; align-items: flex-start; background: #FFFFFF; border-radius: 16rpx; padding: 20rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; position: relative; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }
.msg-item.unread { background: rgba(255,107,53,0.02); border-left: 4rpx solid #FF6B35; }

.msg-icon-box { width: 48rpx; height: 48rpx; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; }
.type-system { background: rgba(59,130,246,0.1); }
.type-interact { background: rgba(16,185,129,0.1); }
.msg-icon { font-size: 24rpx; }

.msg-content { flex: 1; }
.msg-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8rpx; }
.msg-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); }
.msg-time { font-size: 22rpx; color: rgba(0,0,0,0.4); }
.msg-desc { font-size: 24rpx; color: rgba(0,0,0,0.6); line-height: 1.5; }

.msg-dot { position: absolute; top: 20rpx; right: 20rpx; width: 12rpx; height: 12rpx; background: #FF6B35; border-radius: 50%; }

.empty { text-align: center; padding: 64rpx; }
.empty-icon { font-size: 64rpx; display: block; margin-bottom: 16rpx; }
.empty-text { font-size: 28rpx; color: rgba(0,0,0,0.5); }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
</style>