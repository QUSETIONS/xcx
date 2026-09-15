<template>
  <view class="page" :style="a11yStyle">
    <view v-if="loading" class="state"><view class="loading-dot" /><text>正在打开成员资料…</text></view>
    <view v-else-if="!person" class="state"><text class="state-title">成员资料暂时不可见</text><text class="state-desc">返回认识新朋友，再换一个人看看。</text><view class="state-action" @tap="goDiscover">返回找人</view></view>
    <view v-else>
      <view class="profile-card"><view class="avatar" :style="{ background: avatarColor }"><text>{{ initial(person.nickname) }}</text></view><view class="profile-copy"><text class="name">{{ person.nickname }}</text><text class="meta">{{ person.company || '媒合智联成员' }}<text v-if="person.city"> · {{ person.city }}</text></text><text class="bio">{{ person.bio || person.title || '正在寻找长期合作伙伴' }}</text></view></view>
      <view class="context-card"><text class="context-label">为什么想认识对方？</text><textarea v-model="message" maxlength="120" auto-height placeholder="例如：看到你在做活动执行，我们有一个上海项目，想交流一下合作方式。" placeholder-class="placeholder" /><view class="counter">{{ message.length }}/120</view></view>
      <view class="tips"><text class="tips-title">写清楚这三件事，通过率更高</text><text>· 你从哪里看到对方</text><text>· 你正在做什么项目或方向</text><text>· 你希望从哪件小事开始交流</text></view>
      <view v-if="referralOptions.length && person.friend_status === 'none'" class="referral-card"><view class="referral-head"><view><text>也可以请共同联系人引荐</text><text>由认识双方的人决定是否转介绍</text></view></view><view v-for="connector in referralOptions" :key="connector.id" class="referral-person" @tap="requestReferral(connector)"><view class="referral-avatar">{{ initial(connector.nickname) }}</view><view><text>{{ connector.nickname }}</text><text>{{ connector.company || connector.title || '共同联系人' }}</text></view><text>{{ referralSending === connector.id ? '提交中…' : '请他引荐 →' }}</text></view></view>
      <view v-if="person.friend_status === 'pending_outgoing'" class="result-card"><text>好友申请已经发出</text><text>等对方回应后，你们就可以开始交流。</text><view @tap="goFriends">去关系管理 →</view></view>
      <view v-else-if="person.friend_status === 'friends'" class="result-card"><text>你们已经是好友</text><text>可以直接从一个具体项目开始聊天。</text><view @tap="goChat">进入对话 →</view></view>
      <view v-else class="submit" :class="{ disabled: sending }" @tap="submit"><text>{{ sending ? '发送中…' : '发出好友申请' }}</text> <text>→</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { a11yStyle } from '@/utils/accessibility'
import { toastError } from '@/utils/feedback'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'

const personId = ref('')
const person = ref(null)
const message = ref('')
const loading = ref(true)
const sending = ref(false)
const referralOptions = ref([])
const referralSending = ref('')
const avatarColor = ref('linear-gradient(135deg,#5968D8,#8794F5)')
const avatarColors = ['linear-gradient(135deg,#5968D8,#8794F5)', 'linear-gradient(135deg,#E17662,#F5AA89)', 'linear-gradient(135deg,#2F9B82,#72C7A8)', 'linear-gradient(135deg,#C78934,#E5BA6D)']
const userStore = useUserStore()

onLoad(async (query) => {
  if (!(await requirePageLogin(userStore, '登录后才能添加好友'))) return
  personId.value = String(query?.id || '').trim()
  if (!personId.value) { loading.value = false; return }
  try {
    person.value = await bridge.network.person(personId.value)
    avatarColor.value = avatarColors[personId.value.length % avatarColors.length]
    if (person.value?.title) message.value = `你好，我在媒合智联看到你的${person.value.title}方向，想进一步认识并交流合作。`
    if (person.value?.friend_status === 'none') {
      const options = await bridge.network.referralOptions(personId.value).catch(() => ({ list: [] }))
      referralOptions.value = options?.list || []
    }
  } catch (error) {
    console.warn('[network/add-friend] load failed:', error)
    toastError('成员资料加载失败，请稍后重试')
  } finally { loading.value = false }
})

function initial(value) { return String(value || '人').slice(0, 1) }
async function submit() {
  if (!person.value?.id || sending.value) return
  sending.value = true
  try {
    const result = await bridge.network.sendFriendRequest({ target_user_id: person.value.id, message: message.value.trim() || '你好，想和你认识一下，后续有机会一起交流合作。' })
    person.value.friend_status = result?.status === 'accepted' ? 'friends' : 'pending_outgoing'
    uni.showToast({ title: '申请已发出', icon: 'success' })
  } catch (error) {
    console.warn('[network/add-friend] submit failed:', error)
    toastError(error?.message || '申请发送失败，请稍后重试')
  } finally { sending.value = false }
}
async function requestReferral(connector) {
  if (!connector?.id || !person.value?.id || referralSending.value) return
  referralSending.value = connector.id
  try {
    await bridge.network.requestReferral({ connector_id: connector.id, target_user_id: person.value.id, context: message.value.trim() || '想先就合作方向做一次简单交流。' })
    uni.showToast({ title: '引荐申请已交给共同联系人', icon: 'success' })
  } catch (error) { toastError(error?.message || '引荐申请发送失败，请稍后重试') }
  finally { referralSending.value = '' }
}
function goDiscover() { uni.navigateBack({ delta: 1 }) }
function goFriends() { uni.navigateTo({ url: '/pages/network/friends' }) }
function goChat() { uni.navigateTo({ url: `/pages/chat/index?userId=${encodeURIComponent(person.value.id)}&name=${encodeURIComponent(person.value.nickname || '')}` }) }
</script>

<style scoped lang="scss">
.page { min-height: 100vh; padding: 28rpx 24rpx 100rpx; color: #27334f; background: #f5f7fb; box-sizing: border-box; }.profile-card,.context-card,.tips,.result-card { border: 1rpx solid #e6eaf2; border-radius: 22rpx; background: #fff; }.profile-card { display: flex; align-items: center; gap: 15rpx; padding: 22rpx; }.avatar { display: flex; align-items: center; justify-content: center; width: 92rpx; height: 92rpx; flex: 0 0 auto; border-radius: 28rpx; color: #fff; font-size: 39rpx; font-weight: 800; }.profile-copy { min-width: 0; }.name,.meta,.bio { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.name { color: #3a4662; font-size: 29rpx; font-weight: 760; }.meta { margin-top: 7rpx; color: #8e9aae; font-size: 19rpx; }.bio { margin-top: 8rpx; color: #6f7b91; font-size: 19rpx; }.context-card { margin-top: 16rpx; padding: 20rpx; }.context-label,.tips-title { display: block; color: #59657e; font-size: 22rpx; font-weight: 700; }.context-card textarea { display: block; width: 100%; min-height: 170rpx; margin-top: 14rpx; color: #3a4662; font-size: 21rpx; line-height: 1.55; box-sizing: border-box; }.placeholder { color: #adb6c5; }.counter { color: #adb6c5; font-size: 17rpx; text-align: right; }.tips { display: flex; flex-direction: column; gap: 8rpx; margin-top: 16rpx; padding: 18rpx 20rpx; color: #8f9bb0; font-size: 18rpx; line-height: 1.45; }.tips-title { margin-bottom: 2rpx; color: #6573dc; font-size: 19rpx; }.submit { display: flex; align-items: center; justify-content: space-between; margin-top: 22rpx; padding: 18rpx 22rpx; border-radius: 18rpx; color: #fff; background: #6573dc; font-size: 22rpx; font-weight: 700; box-shadow: 0 12rpx 25rpx rgba(101,115,220,.2); }.submit.disabled { opacity: .6; }.result-card { display: flex; flex-direction: column; gap: 8rpx; margin-top: 22rpx; padding: 20rpx; color: #8f9bb0; font-size: 19rpx; }.result-card text:first-child { color: #5968c8; font-size: 22rpx; font-weight: 700; }.result-card view { align-self: flex-start; margin-top: 8rpx; color: #6573dc; font-size: 20rpx; }.state { display: flex; min-height: 70vh; flex-direction: column; align-items: center; justify-content: center; gap: 9rpx; color: #9aa5b6; font-size: 20rpx; }.loading-dot { width: 28rpx; height: 28rpx; border: 3rpx solid #dfe3fb; border-top-color: #6573dc; border-radius: 50%; animation: spin 1s linear infinite; }.state-title { color: #59657e; font-size: 25rpx; font-weight: 700; }.state-action { margin-top: 12rpx; padding: 11rpx 16rpx; border-radius: 14rpx; color: #6573dc; background: #eef0ff; }.state-desc { font-size: 18rpx; }@keyframes spin { to { transform: rotate(360deg); } }
.referral-card { margin-top: 16rpx; padding: 18rpx 20rpx; border: 1rpx solid #e3e7f6; border-radius: 22rpx; background: #f9faff; }.referral-head text { display: block; color: #5664a8; font-size: 21rpx; font-weight: 700; }.referral-head text + text { margin-top: 5rpx; color: #8e9aae; font-size: 17rpx; font-weight: 400; }.referral-person { display: flex; align-items: center; gap: 10rpx; padding-top: 15rpx; }.referral-avatar { display: flex; width: 46rpx; height: 46rpx; align-items: center; justify-content: center; border-radius: 14rpx; color: #fff; background: #7884dc; font-size: 20rpx; }.referral-person view:nth-child(2) { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3rpx; color: #52607a; font-size: 19rpx; }.referral-person view:nth-child(2) text + text { color: #96a0b0; font-size: 16rpx; }.referral-person > text { color: #6573dc; font-size: 18rpx; }
</style>
