<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')

  // 初始化应用
  initApp()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

/**
 * 初始化应用
 */
function initApp() {
  // 检查更新
  // #ifdef MP-WEIXIN
  const updateManager = uni.getUpdateManager()
  updateManager.onUpdateReady(() => {
    uni.showModal({
      title: '更新提示',
      content: '新版本已经准备好，是否重启应用？',
      success: (res) => {
        if (res.confirm) {
          updateManager.applyUpdate()
        }
      }
    })
  })
  updateManager.onUpdateFailed(() => {
    uni.showToast({
      title: '更新失败，请稍后重试',
      icon: 'none'
    })
  })
  // #endif
}
</script>

<style lang="scss">
/* 全局样式初始化 */
@import './styles/reset.scss';
@import './styles/common.scss';

/* 使用设计令牌变量 */
page {
  background-color: $color-bg-page;
  font-family: $font-family-base;
  font-size: $font-size-base;
  color: $color-text-primary;
  line-height: 1.5;
}

/* 全局盒子模型 */
view,
text,
image,
scroll-view,
swiper,
swiper-item {
  box-sizing: border-box;
}

/* 清除按钮默认样式 */
button {
  padding: 0;
  margin: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  line-height: inherit;

  &::after {
    display: none;
  }
}

/* 输入框占位符样式 */
input,
textarea {
  &::placeholder {
    color: $color-text-placeholder;
  }
}

/* 滚动条样式优化 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

/* 安全区域适配 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>