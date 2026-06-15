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

<style>
page {
  background: #F5F6FA;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', sans-serif;
  font-size: 28rpx;
  color: rgba(0,0,0,0.88);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

view, text, image, scroll-view, swiper, swiper-item { box-sizing: border-box; }

button {
  padding: 0; margin: 0; background: transparent; border: none; border-radius: 0; line-height: inherit;
}
button::after { display: none; }

input, textarea::placeholder { color: rgba(0,0,0,0.25); }

::-webkit-scrollbar { display: none; }

/* 安全区 */
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }

/* 动画基础 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes countUp {
  from { opacity: 0; transform: translateY(10rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20rpx); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
</style>