<template>
  <view class="page">
    <!-- 话题选择 -->
    <view class="section">
      <text class="section-title">选择话题</text>
      <scroll-view scroll-x class="topic-scroll">
        <view class="topic-list">
          <view class="topic-item" :class="{ active: selectedTopic === t.id }" v-for="t in topics" :key="t.id" @tap="selectedTopic = t.id">
            <text>{{ t.icon }} {{ t.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 内容输入 -->
    <view class="section">
      <text class="section-title">分享你的见解</text>
      <textarea class="content-input" v-model="content" placeholder="分享你的经验、见解或提问，与同行交流..." maxlength="1000" />
      <text class="word-count">{{ content.length }}/1000</text>
    </view>

    <!-- 图片上传区域 -->
    <view class="section">
      <text class="section-title">添加图片（可选）</text>
      <view class="image-grid">
        <view class="image-item" v-for="(img, i) in images" :key="i">
          <text class="image-placeholder">📷</text>
          <view class="image-delete" @tap="removeImage(i)"><text>✕</text></view>
        </view>
        <view class="image-add" v-if="images.length < 9" @tap="addImage">
          <text class="add-icon">+</text>
          <text class="add-text">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 发布须知 -->
    <view class="notice">
      <text class="notice-title">📢 发布须知</text>
      <text class="notice-item">• 分享有价值的内容，帮助更多同行</text>
      <text class="notice-item">• 禁止发布广告、营销等内容</text>
      <text class="notice-item">• 尊重他人，理性讨论</text>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-bar">
      <button class="submit-btn" :disabled="!canSubmit || submitting" @tap="submit">
        <text>{{ submitting ? '发布中...' : '发布动态' }}</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { communityService } from '@/mock/service'

const topics = ref(communityService.topics())
const selectedTopic = ref('')
const content = ref('')
const images = ref([])
const submitting = ref(false)

const canSubmit = computed(() => content.value.trim().length >= 10 && selectedTopic.value)

function addImage() {
  uni.chooseImage({
    count: 9 - images.value.length,
    success: (res) => {
      images.value.push(...res.tempFilePaths.map(() => ({})))
    }
  })
}

function removeImage(i) { images.value.splice(i, 1) }

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    communityService.createPost({
      content: content.value,
      topic_id: selectedTopic.value,
      images: images.value
    })
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } finally { submitting.value = false }
}
</script>

<style lang="scss">
.page { min-height: 100vh; background: #0A0A0F; padding: 24rpx; padding-bottom: 160rpx; }

.section { margin-bottom: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: rgba(255,255,255,0.95); display: block; margin-bottom: 12rpx; }

.topic-scroll { white-space: nowrap; }
.topic-list { display: flex; gap: 12rpx; }
.topic-item { padding: 12rpx 24rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 24rpx; font-size: 26rpx; color: rgba(255,255,255,0.65); }
.topic-item.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }

.content-input { width: 100%; height: 300rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 16rpx; padding: 20rpx; font-size: 28rpx; color: rgba(255,255,255,0.95); line-height: 1.6; }
.word-count { font-size: 22rpx; color: rgba(255,255,255,0.4); text-align: right; display: block; margin-top: 8rpx; }

.image-grid { display: flex; flex-wrap: wrap; gap: 12rpx; }
.image-item { width: 200rpx; height: 200rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); border-radius: 12rpx; display: flex; align-items: center; justify-content: center; position: relative; }
.image-placeholder { font-size: 48rpx; }
.image-delete { position: absolute; top: 8rpx; right: 8rpx; width: 40rpx; height: 40rpx; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.image-delete text { font-size: 20rpx; color: #fff; }
.image-add { width: 200rpx; height: 200rpx; background: rgba(255,255,255,0.04); border: 2rpx dashed rgba(255,255,255,0.15); border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.add-icon { font-size: 48rpx; color: rgba(255,255,255,0.3); }
.add-text { font-size: 22rpx; color: rgba(255,255,255,0.4); margin-top: 8rpx; }

.notice { background: rgba(245,158,11,0.08); border: 1rpx solid rgba(245,158,11,0.15); border-radius: 16rpx; padding: 20rpx; margin-bottom: 24rpx; }
.notice-title { font-size: 26rpx; font-weight: bold; color: #FBBF24; display: block; margin-bottom: 12rpx; }
.notice-item { font-size: 24rpx; color: rgba(255,255,255,0.6); display: block; margin-bottom: 8rpx; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 24rpx; background: #12121A; border-top: 1rpx solid rgba(255,255,255,0.1); }
.submit-btn { width: 100%; height: 80rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 40rpx; font-size: 32rpx; font-weight: bold; color: #fff; border: none; }
.submit-btn[disabled] { opacity: 0.5; }
</style>