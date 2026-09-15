<template>
  <scroll-view class="legal-page" scroll-y :scroll-top="scrollTop" :scroll-into-view="scrollAnchor">
    <view id="legal-document-top" class="legal-hero">
      <text class="legal-kicker">媒合智联 MediaMatch</text>
      <text class="legal-title">{{ document.title }}</text>
      <text class="legal-meta">版本 {{ document.version }} · 更新日期 {{ document.version }}</text>
    </view>

    <view class="legal-card">
      <view v-for="section in document.sections" :key="section.title" class="legal-section">
        <text class="section-title">{{ section.title }}</text>
        <text class="section-body">{{ section.body }}</text>
      </view>
    </view>

    <text class="legal-footer">如需咨询，请通过“设置—在线客服”联系媒合智联运营团队。</text>
  </scroll-view>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getLegalDocument } from '@/config/legal'

const documentType = ref('agreement')
const scrollTop = ref(0)
const scrollAnchor = ref('')
const document = computed(() => getLegalDocument(documentType.value))

onLoad((query = {}) => {
  if (query.type === 'privacy' || query.type === 'agreement') documentType.value = query.type
  try { uni.setNavigationBarTitle({ title: document.value.title }) } catch {}
})

function resetReadingPosition() {
  // H5 从注册页底部打开协议时可能复用上一个 scroll-view 的位置。
  // 恢复动作可能晚于 mounted，因此在页面展示后再次制造位置变化并归零。
  scrollAnchor.value = ''
  scrollTop.value = 1
  setTimeout(() => {
    scrollTop.value = 2
    nextTick(() => {
      scrollTop.value = 0
      scrollAnchor.value = 'legal-document-top'
    })
    try { uni.pageScrollTo({ scrollTop: 0, duration: 0 }) } catch {}
  }, 250)
  try { uni.pageScrollTo({ scrollTop: 0, duration: 0 }) } catch {}
}

onMounted(resetReadingPosition)
onShow(resetReadingPosition)
</script>

<style scoped>
.legal-page { min-height: 100vh; padding: 34rpx 28rpx 80rpx; background: #F5F7FB; }
.legal-hero { padding: 22rpx 8rpx 28rpx; }
.legal-kicker { display: block; color: #6573DC; font-size: 22rpx; letter-spacing: 2rpx; }
.legal-title { display: block; margin-top: 12rpx; color: #303B57; font-size: 44rpx; font-weight: 800; }
.legal-meta { display: block; margin-top: 12rpx; color: #8D99AC; font-size: 22rpx; }
.legal-card { padding: 30rpx 28rpx; border: 1rpx solid #E7EBF2; border-radius: 24rpx; background: #FFFFFF; box-shadow: 0 12rpx 32rpx rgba(70,87,123,.05); }
.legal-section + .legal-section { margin-top: 30rpx; }
.section-title { display: block; margin-bottom: 10rpx; color: #3C4965; font-size: 28rpx; font-weight: 700; }
.section-body { display: block; color: #68758A; font-size: 25rpx; line-height: 1.8; }
.legal-footer { display: block; padding: 24rpx 12rpx 0; color: #9AA6B8; font-size: 22rpx; line-height: 1.6; }
/* Overflow guard: legal copy must wrap inside the scroll container on small screens. */
.legal-page,
.legal-hero,
.legal-card,
.legal-section { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.legal-page { overflow-x: hidden; }
.legal-kicker,
.legal-title,
.legal-meta,
.section-title,
.section-body,
.legal-footer { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
</style>
