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
@import './styles/utils.wxss';

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
</style>