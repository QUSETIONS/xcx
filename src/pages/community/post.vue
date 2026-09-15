<template>
  <view class="page">
    <!-- 话题选择 -->
    <view class="section">
      <text class="section-title">{{ t('community.selectTopic') }}</text>
      <scroll-view scroll-x class="topic-scroll">
        <view class="topic-list">
          <view class="topic-item" :class="{ active: selectedTopic === t.id }" v-for="t in topics" :key="t.id" @tap="selectedTopic = t.id">
            <text>{{ t.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 内容输入 -->
    <view class="section">
      <text class="section-title">{{ t('community.shareInsight') }}</text>
      <textarea class="content-input" v-model="content" :placeholder="t('community.contentPlaceholder')" maxlength="1000" />
      <text class="word-count">{{ content.length }}/1000</text>
    </view>

    <!-- 图片上传区域 -->
    <view class="section">
      <text class="section-title">{{ t('community.addImages') }}</text>
      <view class="image-grid">
        <view class="image-item" v-for="(img, i) in images" :key="i">
          <image class="image-placeholder" src="/static/icons/file.svg" mode="aspectFit" />
          <view class="image-delete" @tap="removeImage(i)"><text>✕</text></view>
        </view>
        <view class="image-add" v-if="images.length < 9" @tap="addImage">
          <text class="add-icon">+</text>
          <text class="add-text">{{ t('community.addImage') }}</text>
        </view>
      </view>
    </view>

    <!-- 发布须知 -->
    <view class="notice">
      <text class="notice-title">{{ t('community.noticeTitle') }}</text>
      <text class="notice-item">• {{ t('community.notice1') }}</text>
      <text class="notice-item">• {{ t('community.notice2') }}</text>
      <text class="notice-item">• {{ t('community.notice3') }}</text>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-bar">
      <button class="submit-btn" :disabled="!canSubmit || submitting" @tap="submit">
        <text>{{ submitting ? t('community.publishing') : t('community.publish') }}</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { toastError } from '@/utils/feedback'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useUserStore } from '@/stores/user'
import { requirePageLogin } from '@/utils/require-login'
useNavTitle('titles.communityPost')

const topics = ref([])
const selectedTopic = ref('')
const content = ref('')
const images = ref([])
const userStore = useUserStore()
const { state: submitState, run: submitRequest } = useRequest((payload) => bridge.community.createPost(payload))
const submitting = computed(() => submitState.value === 'loading')

const canSubmit = computed(() => content.value.trim().length >= 10 && selectedTopic.value)

onMounted(async () => {
  if (!(await requirePageLogin(userStore, '登录后才能发布动态'))) return
  try {
    topics.value = await bridge.community.topics()
  } catch {
    toastError(t('common.loadFailed'))
  }
})

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
  if (!canSubmit.value || !(await requirePageLogin(userStore, '登录后才能发布动态'))) return
  try {
    await submitRequest({
      content: content.value,
      topic_id: selectedTopic.value,
      images: images.value
    })
    uni.showToast({ title: t('community.publishSuccess'), icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch {
    toastError(t('common.loadFailed'))
  }
}
</script>

<style lang="scss" scoped>
.page { width: 100%; min-height: 100vh; overflow-x: hidden; background: #F5F6FA; padding: 24rpx; padding-bottom: 160rpx; box-sizing: border-box; }

.section { margin-bottom: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }

.topic-scroll { white-space: nowrap; }
.topic-list { display: flex; }
.topic-item { padding: 12rpx 24rpx; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 24rpx; font-size: 26rpx; color: rgba(0,0,0,0.6); }
.topic-item.active { background: rgba(255,107,53,0.15); border-color: rgba(255,107,53,0.25); color: #FF6B35; }

.content-input { width: 100%; height: 300rpx; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 16rpx; padding: 20rpx; font-size: 28rpx; color: rgba(0,0,0,0.85); line-height: 1.6; }
.word-count { font-size: 22rpx; color: rgba(0,0,0,0.4); text-align: right; display: block; margin-top: 8rpx; }

.image-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12rpx; min-width: 0; }
.image-item { width: auto; max-width: 100%; height: 200rpx; min-width: 0; background: #FFFFFF; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 12rpx; display: flex; align-items: center; justify-content: center; position: relative; box-sizing: border-box; }
.image-placeholder { width: 48rpx; height: 48rpx; }
.image-delete { position: absolute; top: 8rpx; right: 8rpx; width: 40rpx; height: 40rpx; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.image-delete text { font-size: 20rpx; color: #333333; }
.image-add { width: auto; max-width: 100%; height: 200rpx; min-width: 0; background: rgba(255,255,255,0.04); border: 2rpx dashed rgba(255,255,255,0.15); border-radius: 12rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; }
.add-icon { font-size: 48rpx; color: rgba(255,255,255,0.3); }
.add-text { font-size: 22rpx; color: rgba(0,0,0,0.4); margin-top: 8rpx; }

.notice { background: rgba(245,158,11,0.08); border: 1rpx solid rgba(245,158,11,0.15); border-radius: 16rpx; padding: 20rpx; margin-bottom: 24rpx; }
.notice-title { font-size: 26rpx; font-weight: bold; color: #FBBF24; display: block; margin-bottom: 12rpx; }
.notice-item { font-size: 24rpx; color: rgba(255,255,255,0.6); display: block; margin-bottom: 8rpx; }

.submit-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 24rpx; background: #12121A; border-top: 1rpx solid rgba(0,0,0,0.06); }
.submit-btn { width: 100%; height: 80rpx; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 40rpx; font-size: 32rpx; font-weight: bold; color: #333333; border: none; }
.submit-btn[disabled] { opacity: 0.5; }

/* 发布页的图片网格改为三列自适应，窄屏下不再把上传入口推出容器。 */
.section,
.topic-scroll,
.content-input,
.notice,
.submit-bar { max-width: 100%; box-sizing: border-box; }
.image-grid { overflow: hidden; }
.topic-item { flex: 0 0 auto; white-space: nowrap; }
.content-input,
.notice-item { overflow-wrap: anywhere; word-break: break-word; }
.submit-bar { width: 100%; }

@media (max-width: 360px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .image-item,
  .image-add { height: 184rpx; }
}
</style>
