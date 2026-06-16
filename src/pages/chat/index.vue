<template>
  <view class="chat-page">
    <!-- 消息列表 -->
    <scroll-view class="msg-scroll" scroll-y :scroll-top="scrollTop" :scroll-with-animation="true">
      <view class="msg-list">
        <view class="time-divider"><text>今天</text></view>
        <view class="msg-item" v-for="msg in messages" :key="msg.id" :class="msg.from">
          <view class="avatar" v-if="msg.from === 'service'"><text>客</text></view>
          <view class="bubble" :class="msg.from">
            <text>{{ msg.content }}</text>
          </view>
          <view class="avatar user-avatar" v-if="msg.from === 'user'"><text>我</text></view>
        </view>
        <view class="typing" v-if="serviceTyping">
          <view class="avatar"><text>客</text></view>
          <view class="bubble service typing-bubble">
            <text class="dot"></text><text class="dot"></text><text class="dot"></text>
          </view>
        </view>
      </view>
      <view style="height: 20rpx;"></view>
    </scroll-view>

    <!-- 快捷问题 -->
    <scroll-view class="quick-bar" scroll-x v-if="!inputText">
      <view class="quick-item" v-for="(q, i) in quickQuestions" :key="i" @tap="sendQuick(q)"><text>{{ q }}</text></view>
    </scroll-view>

    <!-- 输入栏 -->
    <view class="input-bar">
      <input class="msg-input" v-model="inputText" placeholder="请输入消息..." confirm-type="send" @confirm="send" />
      <view class="send-btn" :class="{ active: inputText.trim() }" @tap="send"><text>发送</text></view>
    </view>
  </view>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { chatService } from '@/mock/service'
import { useNavTitle } from '@/hooks/useNavTitle'
useNavTitle('titles.chat')

const messages = ref([])
const inputText = ref('')
const scrollTop = ref(0)
const serviceTyping = ref(false)
const quickQuestions = ['会员有什么权益？', '如何发布需求？', '退款流程', '联系人工客服']

onMounted(() => {
  messages.value = chatService.list()
  scrollToBottom()
})

function scrollToBottom() {
  nextTick(() => { scrollTop.value = scrollTop.value === 999 ? 998 : 999 })
}

function send() {
  const text = inputText.value.trim()
  if (!text) return
  messages.value = chatService.send(text)
  inputText.value = ''
  scrollToBottom()
  // 模拟客服回复
  serviceTyping.value = true
  scrollToBottom()
  setTimeout(() => {
    serviceTyping.value = false
    messages.value = chatService.reply()
    scrollToBottom()
  }, 1200)
}

function sendQuick(q) {
  inputText.value = q
  send()
}
</script>

<style scoped>
.chat-page { display: flex; flex-direction: column; height: 100vh; background: #EDEFF4; }

.msg-scroll { flex: 1; }
.msg-list { padding: 24rpx; }
.time-divider { text-align: center; margin-bottom: 24rpx; }
.time-divider text { font-size: 22rpx; color: rgba(0,0,0,0.35); background: rgba(0,0,0,0.05); padding: 6rpx 20rpx; border-radius: 12rpx; }

.msg-item { display: flex; margin-bottom: 24rpx; }
.msg-item.user { justify-content: flex-end; }
.avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: #FF6B35; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.avatar text { font-size: 26rpx; color: #FFFFFF; }
.user-avatar { background: #6366F1; }
.bubble { max-width: 480rpx; padding: 18rpx 24rpx; border-radius: 20rpx; font-size: 28rpx; line-height: 1.5; }
.bubble.service { background: #FFFFFF; color: rgba(0,0,0,0.85); margin-left: 16rpx; border-top-left-radius: 4rpx; }
.bubble.user { background: #FF6B35; color: #FFFFFF; margin-right: 16rpx; border-top-right-radius: 4rpx; }
.msg-item.user .bubble { order: 1; }

.typing { display: flex; margin-bottom: 24rpx; }
.typing-bubble { display: flex; align-items: center; margin-left: 16rpx; }
.dot { width: 12rpx; height: 12rpx; background: rgba(0,0,0,0.3); border-radius: 50%; margin: 0 3rpx; }

.quick-bar { white-space: nowrap; padding: 16rpx 24rpx; background: #FFFFFF; border-top: 1rpx solid #F0F1F5; }
.quick-item { display: inline-block; background: #F5F6FA; border-radius: 24rpx; padding: 12rpx 24rpx; margin-right: 12rpx; }
.quick-item text { font-size: 24rpx; color: rgba(0,0,0,0.7); }

.input-bar { display: flex; align-items: center; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); }
.msg-input { flex: 1; height: 72rpx; background: #F5F6FA; border-radius: 36rpx; padding: 0 28rpx; font-size: 28rpx; color: rgba(0,0,0,0.85); }
.send-btn { background: #E5E7EB; border-radius: 36rpx; padding: 18rpx 32rpx; margin-left: 16rpx; }
.send-btn.active { background: linear-gradient(135deg, #FF6B35, #FF9A5C); }
.send-btn text { font-size: 28rpx; color: rgba(0,0,0,0.5); }
.send-btn.active text { color: #FFFFFF; font-weight: bold; }
</style>