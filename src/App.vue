<script setup>
import { onLaunch } from '@dcloudio/uni-app'

onLaunch(() => {
  // 小程序更新检测
  // #ifdef MP-WEIXIN
  const updateManager = uni.getUpdateManager()
  updateManager.onUpdateReady(() => {
    uni.showModal({
      title: '更新提示',
      content: '新版本已准备好，是否重启？',
      success: (res) => { if (res.confirm) updateManager.applyUpdate() }
    })
  })
  // #endif
})
</script>

<style lang="scss">
page {
  background: $bg-primary;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif;
  font-size: 28rpx;
  color: $text-primary;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

view, text, image, scroll-view, swiper, swiper-item { box-sizing: border-box; }

button {
  padding: 0; margin: 0; background: transparent; border: none; border-radius: 0; line-height: inherit;
  &::after { display: none; }
}

input, textarea {
  &::placeholder { color: $text-placeholder; }
}

/* 滚动条隐藏 */
::-webkit-scrollbar { display: none; }

/* 通用玻璃卡片 */
.glass-card {
  background: $glass-bg;
  backdrop-filter: blur($glass-blur);
  -webkit-backdrop-filter: blur($glass-blur);
  border: 1rpx solid $glass-border;
  border-radius: $radius-lg;
}

.glass-card-strong {
  background: $glass-bg-strong;
  backdrop-filter: blur($glass-blur-strong);
  -webkit-backdrop-filter: blur($glass-blur-strong);
  border: 1rpx solid $glass-border-strong;
  border-radius: $radius-lg;
}

/* 渐变文字 */
.gradient-text {
  background: $gradient-primary;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 通用标签 */
.ui-tag {
  display: inline-flex;
  align-items: center;
  padding: 6rpx 16rpx;
  border-radius: $radius-sm;
  font-size: $font-xs;
  font-weight: $weight-medium;
  line-height: 1.4;

  &--primary { background: rgba(255,107,53,0.15); color: #FF9A5C; }
  &--secondary { background: rgba(99,102,241,0.15); color: #8B5CF6; }
  &--success { background: rgba(16,185,129,0.15); color: #34D399; }
  &--warning { background: rgba(245,158,11,0.15); color: #FBBF24; }
  &--danger { background: rgba(239,68,68,0.15); color: #F87171; }
  &--info { background: rgba(59,130,246,0.15); color: #60A5FA; }
  &--accent { background: rgba(236,72,153,0.15); color: #F472B6; }
}

/* 渐变按钮 */
.btn-glow {
  background: $gradient-primary;
  color: #fff;
  border-radius: $radius-full;
  padding: 20rpx 48rpx;
  font-size: $font-base;
  font-weight: $weight-semibold;
  text-align: center;
  box-shadow: $shadow-glow-primary;
  transition: all $duration-base $ease-out;

  &:active { transform: scale(0.97); opacity: 0.9; }
}

/* 安全区 */
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
</style>