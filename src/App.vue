<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { ENV } from '@/utils/env'

onLaunch(async () => {
  // 正式联调：没有会话就保持游客态，登录页负责手机号/密码或微信授权。
  // 演示登录只有在显式设置 VITE_ALLOW_DEMO_LOGIN=true 时才启用。
  try {
    const userStore = useUserStore()
    if (!userStore.token && ENV.ALLOW_DEMO_LOGIN) {
      await userStore.demoLogin('user')
    } else if (userStore.token) {
      if (!ENV.ALLOW_DEMO_LOGIN && userStore.refreshToken) {
        await userStore.refreshSession().catch((error) => console.warn('[App] session refresh failed:', error))
      }
      await userStore.refreshInfo()
    }
  } catch (e) {
    console.warn('[App] session bootstrap failed:', e)
  }

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
  --page-bg: #F6F2EA;
  --surface: #FCFAF5;
  --surface-muted: #EEE7DA;
  --ink: #17232D;
  --ink-soft: #626B6D;
  --ink-muted: #968F83;
  --line: rgba(23, 35, 45, .13);
  --line-soft: rgba(23, 35, 45, .075);
  --brand: #5A2530;
  --brand-deep: #3E1922;
  --brand-soft: #EFE2DD;
  --accent: #B49460;
  --accent-soft: #E9DEC9;
  --navy: #172A38;
  --navy-soft: #DFE6E6;
  --olive: #526153;
  --page-gutter: 24rpx;
  --tabbar-height: 110rpx;
  background: var(--page-bg);
  font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  font-size: 28rpx;
  color: var(--ink);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* 统一视口边界：长文本、原生输入框和第三方图片不能把页面横向撑开。 */
html,
body,
page,
.uni-page-wrapper,
.uni-page-body,
#app {
  max-width: 100%;
  overflow-x: hidden;
}

#app,
.uni-page-wrapper,
.uni-page-body {
  min-width: 0;
  box-sizing: border-box;
}

view, text, image, scroll-view, swiper, swiper-item,
input, textarea, button {
  box-sizing: border-box;
}

image {
  max-width: 100%;
}

/* #ifdef H5 */
/* H5 预览统一图标画布，避免不同源图的透明边距造成忽大忽小。 */
.uni-tabbar .uni-tabbar__icon { width: 26px !important; height: 26px !important; }
.uni-tabbar .uni-tabbar__icon img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: center; }
/* #endif */

/* #ifdef H5 */
/* 固定宽屏预览：内容和所有固定层共用同一张小程序画布，不随桌面窗口拉伸。 */
@media (min-width: 561px) {
  /* 桌面预览使用更舒适的工作区；窄于它时只为避免横向溢出而收窄。 */
  :root { --h5-shell-width: min(960px, calc(100vw - 48px)); }

  #app {
    width: var(--h5-shell-width) !important;
    max-width: calc(100vw - 32px) !important;
    min-height: 100vh !important;
    margin: 0 auto !important;
    position: relative !important;
    isolation: isolate;
    overflow-x: hidden !important;
    background: var(--page-bg) !important;
    box-shadow: 0 0 42px rgba(48, 63, 92, .12);
  }

  body { background: #E6E0D5; }

  #app .uni-page-head,
  #app .uni-page-head-hd,
  #app .uni-page-wrapper {
    width: var(--h5-shell-width) !important;
    max-width: 100vw !important;
    margin: 0 auto !important;
  }

  /* 原生标题栏也必须和内容壳层同心，避免窗口变宽时标题向左漂移。 */
  #app .uni-page-head {
    left: 50% !important;
    right: auto !important;
    transform: translate3d(-50%, 0, 0) !important;
  }

  #app .uni-page-wrapper {
    min-height: 100% !important;
  }

  #app uni-tabbar.uni-tabbar-bottom,
  #app .uni-tabbar-bottom .uni-tabbar,
  #app .tabbar,
  #app .fixed-bottom,
  #app .action-bar,
  #app .bottom-bar,
  #app .submit-bar,
  #app .settle-bar,
  #app .comment-bar {
    left: 50% !important;
    right: auto !important;
    top: auto !important;
    bottom: 0 !important;
    width: var(--h5-shell-width) !important;
    max-width: 100vw !important;
    box-sizing: border-box;
    transform: translateX(-50%);
  }

  /* 导航栏必须固定在顶部；之前被误放进底部选择器，滚动后会跑位。 */
  #app .nav {
    left: 50% !important;
    right: auto !important;
    top: 0 !important;
    bottom: auto !important;
    width: var(--h5-shell-width) !important;
    max-width: 100vw !important;
    box-sizing: border-box;
    transform: translateX(-50%);
  }

  #app .modal-mask,
  #app .picker-mask,
  #app .sheet-mask {
    left: 50% !important;
    right: auto !important;
    top: 0 !important;
    bottom: 0 !important;
    width: var(--h5-shell-width) !important;
    max-width: 100vw !important;
    transform: translateX(-50%);
  }

  #app .publish-fab,
  #app .fab-btn {
    right: calc((100vw - var(--h5-shell-width)) / 2 + 14px) !important;
    /* H5 的 uni-tabbar 是 px 高度，使用固定安全间距，避免按钮被导航层裁掉。 */
    bottom: 96px !important;
  }
}
/* #endif */

/* #ifdef H5 */
.uni-page-wrapper { background: transparent; }
.uni-tabbar-bottom .uni-tabbar { border-top: 1px solid rgba(23, 35, 45, .13); box-shadow: 0 -10px 30px rgba(23, 35, 45, .055); }
/* #endif */

#app { background: #F6F2EA; }

button {
  padding: 0; margin: 0; background: transparent; border: none; border-radius: 0; line-height: inherit;
}
button::after { display: none; }

input::placeholder, textarea::placeholder { color: #B0AAA0; }

.surface-card {
  border: 1rpx solid var(--line);
  border-radius: 10rpx;
  background: var(--surface);
  box-shadow: none;
}

/* 统一可点击对象的反馈：轻微位移即可，不用大幅缩放破坏页面稳定性。 */
.card-press { transition: border-color .16s ease, background-color .16s ease, opacity .16s ease, transform .16s ease; }
.card-press:active { opacity: .84; transform: translateY(1rpx); }
button:focus-visible, input:focus-visible, textarea:focus-visible, .card-press:focus-visible {
  outline: 2px solid rgba(92,40,40,.48);
  outline-offset: 2px;
}

.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }

::-webkit-scrollbar { display: none; }

/* 共享的编辑式基础类，页面只负责组合，不再重复造一套视觉语言。 */
.editorial-eyebrow {
  display: block;
  color: var(--ink-muted);
  font-size: 18rpx;
  letter-spacing: .14em;
  line-height: 1.3;
  text-transform: uppercase;
}

.editorial-title {
  display: block;
  color: var(--ink);
  font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif;
  font-size: 42rpx;
  font-weight: 500;
  letter-spacing: -.03em;
  line-height: 1.16;
}

.editorial-divider {
  height: 1rpx;
  background: var(--line-soft);
}

.quiet-button {
  min-height: 76rpx;
  padding: 0 28rpx;
  border: 1rpx solid var(--brand);
  border-radius: 8rpx;
  color: #FCFBF8;
  background: var(--brand);
  font-size: 24rpx;
  line-height: 76rpx;
  transition: background-color .18s ease, opacity .18s ease;
}

.quiet-button:active { opacity: .82; }

.quiet-button.secondary {
  color: var(--brand);
  background: transparent;
}

/* #ifdef H5 */
/* 低动效设备仍保持信息层级，不让动效抢走操作焦点。 */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
  }
}
/* #endif */

/*
 * Quiet Intelligence 页面层：
 * 页面原有的业务样式继续保留，视觉层在这里统一收口，避免每个页面各自
 * 演化成一套蓝紫色组件。使用 #app 提升选择器优先级，不改动页面逻辑。
 */

/* 首页：像一页产品目录，而不是彩色运营看板。 */
#app .home {
  color: var(--ink);
  background: var(--page-bg) !important;
}
#app .home::before { border-color: rgba(92, 40, 40, .08); box-shadow: none; }
#app .home .topbar {
  padding: 22rpx 24rpx 28rpx;
  background: transparent;
}
#app .home .topbar::after { background: var(--line-soft); }
#app .home .identity-avatar,
#app .home .topbar-avatar {
  border-radius: 10rpx;
  background: var(--brand) !important;
  box-shadow: none;
}
#app .home .identity-greeting,
#app .home .identity-subtitle { color: var(--ink-muted); }
#app .home .identity-greeting,
#app .home .home-intro-eyebrow,
#app .home .home-banner-eyebrow,
#app .home .section-eyebrow {
  letter-spacing: .14em;
  text-transform: uppercase;
}
#app .home .identity-greeting,
#app .home .home-intro-eyebrow,
#app .home .home-banner-eyebrow,
#app .home .section-eyebrow { font-size: 18rpx; }
#app .home .nickname,
#app .home .home-intro-title,
#app .home .section-title,
#app .home .home-banner-title,
#app .home .agent-hero .hero-title {
  color: var(--ink);
  font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif;
  font-weight: 500;
  letter-spacing: -.035em;
}
#app .home .nickname { font-size: 34rpx; }
#app .home .topbar-icon {
  border: 1rpx solid var(--line-soft);
  border-radius: 8rpx;
  background: transparent;
  box-shadow: none;
}
#app .home .search-box {
  height: 78rpx;
  margin: 24rpx 0 34rpx;
  border: 1rpx solid var(--line);
  border-radius: 8rpx;
  background: var(--surface);
  box-shadow: none;
}
#app .home .search-input { color: var(--ink); }
#app .home .search-placeholder,
#app .home .search-hint { color: var(--text-placeholder, #B0AAA0); }
#app .home .home-intro { padding: 0 0 28rpx; }
#app .home .home-intro-title { font-size: 48rpx; line-height: 1.14; }
#app .home .home-intro-caption { color: var(--ink-soft); }
#app .home .home-action-row { gap: 0; border-top: 1rpx solid var(--line-soft); border-bottom: 1rpx solid var(--line-soft); }
#app .home .home-action {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
#app .home .home-action + .home-action { border-left: 1rpx solid var(--line-soft); }
#app .home .home-action-icon,
#app .home .quick-entry-icon,
#app .home .category-icon,
#app .home .stat-icon,
#app .home .todo-icon {
  border-radius: 8rpx;
  color: var(--brand);
  background: var(--bg-tertiary, #F0EEE8);
  box-shadow: none;
}
#app .home .home-action-primary { color: var(--surface); background: var(--brand); }
#app .home .home-action-primary .home-action-icon { color: var(--surface); background: rgba(252, 251, 248, .14); }
#app .home .home-action-primary .home-action-copy,
#app .home .home-action-primary .home-action-arrow { color: var(--surface); }
#app .home .home-banner,
#app .home .home-banner-card,
#app .home .agent-hero {
  border-radius: 10rpx;
  box-shadow: none;
}
#app .home .home-banner-card {
  background: var(--brand) !important;
}
#app .home .home-banner-card::after,
#app .home .agent-hero::after { border-color: rgba(252, 251, 248, .16); box-shadow: none; }
#app .home .home-banner-title { color: var(--surface); }
#app .home .home-banner-subtitle,
#app .home .home-banner-eyebrow { color: rgba(252, 251, 248, .72); }
#app .home .agent-hero {
  background: var(--ink) !important;
}
#app .home .agent-hero .hero-title,
#app .home .agent-hero .hero-overline,
#app .home .agent-hero .hero-kicker,
#app .home .agent-hero .hero-topline { color: var(--surface); }
#app .home .agent-hero .hero-desc,
#app .home .agent-hero .hero-note,
#app .home .agent-hero .agent-input-hint { color: rgba(252, 251, 248, .66); }
#app .home .agent-hero .hero-highlight { color: var(--accent); }
#app .home .agent-input-wrap {
  border-color: rgba(252, 251, 248, .22);
  border-radius: 8rpx;
  background: rgba(252, 251, 248, .07);
}
#app .home .agent-input { color: var(--surface); }
#app .home .agent-submit,
#app .home .agent-apply { border-radius: 7rpx; background: var(--accent) !important; box-shadow: none; }
#app .home .agent-tags text,
#app .home .agent-question,
#app .home .agent-question-box { border-radius: 5rpx; color: var(--surface); background: rgba(252, 251, 248, .10); }
#app .home .stats-row { gap: 0; border-top: 1rpx solid var(--line-soft); border-bottom: 1rpx solid var(--line-soft); }
#app .home .stat-box {
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}
#app .home .stat-box + .stat-box { border-left: 1rpx solid var(--line-soft); }
#app .home .stat-num { color: var(--ink); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-weight: 500; }
#app .home .stat-label,
#app .home .stat-trend,
#app .home .section-eyebrow { color: var(--ink-muted); }
#app .home .quick-entry-card,
#app .home .todo-card,
#app .home .agent-team-card,
#app .home .agent-recommendation-card,
#app .home .service-inline-card,
#app .home .demand-card,
#app .home .home-product-card {
  border: 1rpx solid var(--line-soft);
  border-radius: 8rpx;
  background: var(--surface);
  box-shadow: none;
}
#app .home .quick-entry-card:hover,
#app .home .todo-card:hover,
#app .home .agent-team-card:hover { background: var(--bg-card-hover); }
#app .home .quick-entry-title,
#app .home .todo-title,
#app .home .agent-team-name,
#app .home .agent-recommendation-title,
#app .home .section-title { color: var(--ink); }
#app .home .quick-entry-desc,
#app .home .todo-meta,
#app .home .agent-team-meta,
#app .home .agent-recommendation-meta { color: var(--ink-muted); }
#app .home .agent-team-action,
#app .home .agent-recommendation-arrow,
#app .home .section-link { color: var(--brand); }
#app .home .agent-team-action { border: 1rpx solid var(--brand); border-radius: 6rpx; color: var(--brand); background: transparent; }
#app .home .agent-team-avatar,
#app .home .agent-recommendation-score { border-radius: 6rpx; color: var(--surface); background: var(--secondary, #69574A); }

/* Agent：聊天是工作台，结果卡只在有足够信息后出现。 */
#app .agent-page {
  color: var(--ink);
  background: var(--page-bg) !important;
}
#app .agent-page .agent-header {
  padding: 24rpx 24rpx 20rpx;
  border-bottom-color: var(--line-soft);
  background: var(--surface);
  box-shadow: none;
}
#app .agent-page .agent-eyebrow,
#app .agent-page .message-label,
#app .agent-page .match-section-kicker { color: var(--ink-muted); }
#app .agent-page .agent-title,
#app .agent-page .result-summary,
#app .agent-page .match-section-title { color: var(--ink); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-weight: 500; }
#app .agent-page .agent-title { font-size: 38rpx; }
#app .agent-page .agent-subtitle { color: var(--ink-muted); }
#app .agent-page .clear-button {
  border-color: var(--line);
  border-radius: 6rpx;
  color: var(--brand);
  background: transparent;
}
#app .agent-page .conversation { padding: 28rpx 24rpx 18rpx; }
#app .agent-page .message-avatar { border-radius: 8rpx; background: var(--brand); box-shadow: none; }
#app .agent-page .message-row.user .message-avatar { background: var(--secondary); }
#app .agent-page .message-bubble {
  border-color: var(--line-soft);
  border-radius: 10rpx;
  color: var(--ink);
  background: var(--surface);
  box-shadow: none;
}
#app .agent-page .message-row.user .message-bubble { color: var(--surface); background: var(--brand); box-shadow: none; }
#app .agent-page .result-card {
  border-color: var(--line);
  border-top: 2rpx solid var(--brand);
  border-radius: 8rpx;
  background: var(--surface);
}
#app .agent-page .result-label,
#app .agent-page .result-confidence,
#app .agent-page .match-section-count,
#app .agent-page .continue-button { color: var(--brand); }
#app .agent-page .result-meter { border-radius: 0; background: var(--bg-tertiary, #F0EEE8); }
#app .agent-page .result-meter-fill { border-radius: 0; background: var(--brand); }
#app .agent-page .result-facts view,
#app .agent-page .demand-match-card { border-radius: 6rpx; background: var(--bg-tertiary, #F0EEE8); }
#app .agent-page .result-facts view text:first-child,
#app .agent-page .result-missing,
#app .agent-page .questions-title { color: var(--ink-muted); }
#app .agent-page .result-tags text,
#app .agent-page .question-chip { border-radius: 5rpx; color: var(--brand); background: var(--brand-soft, #F0E5DF); }
#app .agent-page .conversation-state { border-color: rgba(86, 98, 76, .18); border-radius: 7rpx; background: rgba(86, 98, 76, .07); }
#app .agent-page .conversation-state.ready .conversation-state-title { color: var(--olive); }
#app .agent-page .editor-submit,
#app .agent-page .apply-button,
#app .agent-page .invite-button { border-radius: 6rpx; background: var(--brand); }
#app .agent-page .team-match-card { border-color: var(--line-soft); border-radius: 7rpx; background: var(--bg-secondary, #FCFBF8); }
#app .agent-page .team-avatar { border-radius: 6rpx; background: var(--secondary); }
#app .agent-page .team-score { color: var(--olive); }
#app .agent-page .team-contact { min-width: 138rpx; border-radius: 6rpx; background: var(--brand); }
#app .agent-page .quick-prompts,
#app .agent-page .composer { border-color: var(--line-soft); background: var(--surface); }
#app .agent-page .quick-prompt,
#app .agent-page .attach-trigger { border-color: var(--line); border-radius: 6rpx; color: var(--brand); background: transparent; }
#app .agent-page .composer-input { border-color: var(--line); border-radius: 7rpx; color: var(--ink); background: var(--bg-secondary, #FCFBF8); }
#app .agent-page .send-button.active { border-radius: 6rpx; background: var(--brand); }

/* 人脉圈：关系页使用目录式列表，让人、社群、分会有清楚的入口。 */
#app .page {
  color: var(--ink);
  background: var(--page-bg) !important;
}
#app .page .topbar { background: transparent; }
#app .page .eyebrow,
#app .page .section-eyebrow { color: var(--ink-muted); }
#app .page .page-title,
#app .page .section-title { color: var(--ink); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-weight: 500; }
#app .page .page-title { font-size: 46rpx; }
#app .page .top-action { border-color: var(--line-soft); border-radius: 7rpx; background: var(--surface); box-shadow: none; }
#app .page .hero-card {
  border-radius: 9rpx;
  background: var(--ink) !important;
  box-shadow: none;
}
#app .page .hero-orb-one,
#app .page .hero-orb-two { background: rgba(252, 251, 248, .08); }
#app .page .hero-label { color: rgba(252, 251, 248, .64); }
#app .page .hero-title { color: var(--surface); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-weight: 500; }
#app .page .hero-desc { color: rgba(252, 251, 248, .66); }
#app .page .search-box { border-color: rgba(252, 251, 248, .22); border-radius: 7rpx; background: rgba(252, 251, 248, .08); }
#app .page .main-tab,
#app .page .person-card,
#app .page .group-card,
#app .page .state-card,
#app .page .people-load-more {
  border-color: var(--line-soft);
  border-radius: 7rpx;
  background: var(--surface);
  box-shadow: none;
}
#app .page .main-tab.active { border-color: var(--brand); color: var(--brand); background: var(--brand-soft, #F0E5DF); }
#app .page .person-name,
#app .page .group-name,
#app .page .section-title { color: var(--ink); }
#app .page .person-company,
#app .page .person-bio,
#app .page .group-desc,
#app .page .group-meta { color: var(--ink-muted); }
#app .page .person-avatar,
#app .page .group-cover { border-radius: 6rpx; background: var(--secondary); box-shadow: none; }
#app .page .follow-button,
#app .page .group-action { border-radius: 6rpx; color: var(--brand); background: transparent; }
#app .page .follow-button { border-color: var(--brand); }
#app .page .follow-button.following { border-color: var(--line); color: var(--ink-muted); background: var(--bg-tertiary, #F0EEE8); }
#app .page .interaction-note { border-color: rgba(181, 160, 122, .28); border-radius: 7rpx; background: rgba(181, 160, 122, .10); }

/* 个人中心：从“积分/优惠卡片”切成安静、可继续完成的账户页。 */
#app .page .header .avatar-box { border-radius: 9rpx; background: var(--brand); box-shadow: none; }
#app .page .header .nickname { color: var(--ink); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-weight: 500; }
#app .page .profile-completion,
#app .page .quick-item,
#app .page .provider-entry,
#app .page .stats-panel,
#app .page .dashboard-card,
#app .page .admin-card {
  border-color: var(--line-soft);
  border-radius: 8rpx;
  background: var(--surface);
  box-shadow: none;
}
#app .page .profile-completion-icon,
#app .page .provider-entry-icon { border-radius: 7rpx; color: var(--brand); background: var(--brand-soft, #F0E5DF); }
#app .page .credit-card {
  border-radius: 8rpx;
  background: var(--ink);
  box-shadow: none;
}
#app .page .quick-num,
#app .page .provider-entry-action,
#app .page .stat-num { color: var(--brand); }
#app .page .network-entry { border: 1rpx solid var(--line); border-left: 3rpx solid var(--brand); border-radius: 8rpx; background: var(--surface); box-shadow: none; }
#app .page .network-entry-icon { border-radius: 7rpx; background: var(--brand-soft, #F0E5DF); }
#app .page .network-entry-icon image { filter: none; opacity: .82; }
#app .page .network-entry-title { color: var(--ink); }
#app .page .network-entry-desc,
#app .page .network-entry-stats text:last-child { color: var(--ink-muted); }
#app .page .network-entry-stats text:first-child,
#app .page .network-entry-arrow { color: var(--brand); }
#app .page .menu-icon-box { border-radius: 7rpx; background: var(--bg-tertiary, #F0EEE8); }
#app .page .menu-color-0,
#app .page .menu-color-1,
#app .page .menu-color-2,
#app .page .menu-color-3,
#app .page .menu-color-4,
#app .page .menu-color-5 { background: var(--bg-tertiary, #F0EEE8); }
#app .page .menu-label,
#app .page .dc-desc,
#app .page .admin-desc { color: var(--ink-muted); }

/* 聊天：用户消息固定在右侧，头像与气泡各自有明确归属。 */
#app .chat-page { background: var(--page-bg) !important; }
#app .chat-page .direct-header,
#app .chat-page .quick-bar,
#app .chat-page .input-bar { border-color: var(--line-soft); background: var(--surface); }
#app .chat-page .direct-kicker { color: var(--ink-muted); }
#app .chat-page .direct-title { color: var(--ink); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', serif; font-weight: 500; }
#app .chat-page .direct-status { border-radius: 5rpx; color: var(--olive); background: rgba(86, 98, 76, .10); }
#app .chat-page .time-divider text { border-radius: 4rpx; color: var(--ink-muted); background: var(--bg-tertiary, #F0EEE8); }
#app .chat-page .avatar { border-radius: 7rpx; background: var(--secondary); }
#app .chat-page .user-avatar { background: var(--brand); }
#app .chat-page .bubble { border-radius: 9rpx; box-shadow: none; }
#app .chat-page .bubble.service { color: var(--ink); background: var(--surface); }
#app .chat-page .bubble.user { color: var(--surface); background: var(--brand); }
#app .chat-page .quick-item,
#app .chat-page .attach-trigger { border-color: var(--line); border-radius: 6rpx; color: var(--brand); background: transparent; }
#app .chat-page .msg-input { border-color: var(--line); border-radius: 7rpx; color: var(--ink); background: var(--bg-secondary, #FCFBF8); }
#app .chat-page .send-btn.active { border-radius: 6rpx; background: var(--brand); }
#app .chat-page .service-action-panel { border-color: rgba(181, 160, 122, .28); border-radius: 7rpx; background: rgba(181, 160, 122, .10); }
#app .chat-page .service-action { border-color: rgba(181, 160, 122, .40); border-radius: 5rpx; color: var(--secondary); background: transparent; }

/* Quiet Intelligence v2：确保页面自己的编辑式结构高于旧版兼容层。 */
#app .home .agent-workspace {
  color: var(--ink);
  border-top: 1rpx solid var(--line-soft);
  border-bottom: 1rpx solid var(--line-soft);
  background: transparent;
}
#app .home .agent-workspace .agent-input-wrap {
  border-color: var(--line);
  border-radius: 4rpx;
  background: var(--surface);
}
#app .home .agent-workspace .agent-input { color: var(--ink); }
#app .home .agent-workspace .agent-submit,
#app .home .agent-workspace .agent-apply {
  border-radius: 4rpx;
  color: var(--surface);
  background: var(--brand) !important;
}
#app .home .agent-workspace .agent-tags text,
#app .home .agent-workspace .agent-question,
#app .home .agent-workspace .agent-question-box {
  border-radius: 3rpx;
  color: var(--secondary);
  background: var(--bg-tertiary);
}

#app .agent-page .agent-header {
  padding: 26rpx 36rpx 28rpx;
  color: var(--ink);
  background: var(--page-bg);
}
#app .agent-page .agent-title { max-width: 500rpx; font-size: 40rpx; font-weight: 400; }
#app .agent-page .clear-button { border: 0; border-bottom: 1rpx solid rgba(92, 40, 40, .30); border-radius: 0; }
#app .agent-page .conversation { max-width: 660rpx; margin: 0 auto; padding: 40rpx 36rpx 28rpx; }
#app .agent-page .message-avatar { display: none; }
#app .agent-page .message-row.user .user-avatar { display: flex; border-radius: 4rpx; color: var(--brand); background: var(--brand-soft); }
#app .agent-page .message-bubble,
#app .agent-page .message-row.assistant .message-bubble {
  padding: 0;
  border: 0;
  border-radius: 0;
  color: var(--ink);
  background: transparent;
}
#app .agent-page .message-row.user .message-bubble {
  padding: 15rpx 18rpx;
  border: 1rpx solid var(--line-soft);
  border-radius: 5rpx;
  color: var(--ink);
  background: var(--bg-tertiary);
}
#app .agent-page .result-card {
  border: 0;
  border-top: 1rpx solid var(--line);
  border-bottom: 1rpx solid var(--line-soft);
  border-radius: 0;
  background: transparent;
}
#app .agent-page .result-facts view,
#app .agent-page .demand-match-card,
#app .agent-page .team-match-card {
  border-radius: 0;
  background: transparent;
}
#app .agent-page .team-contact {
  border: 1rpx solid var(--brand);
  border-radius: 4rpx;
  color: var(--brand);
  background: transparent;
}
#app .agent-page .quick-prompts { background: var(--page-bg); }
#app .agent-page .composer { background: var(--surface); }
#app .agent-page .composer-input { border-right: 0; border-left: 0; border-radius: 0; background: transparent; }

#app .page .top-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  min-width: 96rpx;
  min-height: 60rpx;
  padding: 12rpx 14rpx;
  border: 1rpx solid var(--line-soft);
  border-radius: 4rpx;
  background: var(--surface);
  box-sizing: border-box;
  font-size: 20rpx;
  line-height: 1.2;
  white-space: nowrap;
}
#app .page .top-action image { display: block; width: 28rpx; height: 28rpx; flex: 0 0 28rpx; object-fit: contain; opacity: .76; }
#app .page .hero-card {
  border: 0;
  border-bottom: 1rpx solid var(--line-soft);
  border-radius: 0;
  color: var(--ink);
  background: transparent !important;
}
#app .page .hero-label,
#app .page .hero-desc { color: var(--ink-muted); }
#app .page .hero-title { color: var(--ink); font-size: 48rpx; font-weight: 400; }
#app .page .main-tab,
#app .page .person-card,
#app .page .group-card {
  border-radius: 0;
  background: transparent;
}
#app .page .main-tab.active { border: 0; border-bottom: 3rpx solid var(--brand); color: var(--brand); background: transparent; }
#app .page .person-avatar,
#app .page .group-cover { border-radius: 4rpx; color: var(--secondary); background: var(--bg-tertiary) !important; }
#app .page .follow-button { border-color: var(--brand); border-radius: 4rpx; color: var(--brand); background: var(--surface); }
#app .page .group-action { border-radius: 0; color: var(--brand); background: transparent; }

#app .chat-page .direct-header { padding: 26rpx 36rpx 28rpx; background: var(--page-bg); }
#app .chat-page .direct-title { font-size: 34rpx; font-weight: 400; }
#app .chat-page .time-divider text { padding: 0; border-radius: 0; background: transparent; }
#app .chat-page .bubble.service { color: var(--ink); background: transparent; }
#app .chat-page .bubble.user { color: var(--ink); background: var(--bg-tertiary); }
#app .chat-page .quick-bar { background: var(--page-bg); }
#app .chat-page .input-bar { background: var(--surface); }
#app .chat-page .service-action-panel { border-right: 0; border-left: 0; border-radius: 0; background: transparent; }

@media (max-width: 420px) {
  #app .page .top-action { min-width: 82rpx; min-height: 56rpx; gap: 5rpx; padding: 10rpx 8rpx; font-size: 18rpx; }
  #app .page .top-action image { width: 24rpx; height: 24rpx; flex-basis: 24rpx; }
}

/* Quiet Intelligence v3：为渐进迁移中的页面统一收敛视觉噪声。
 * 只调整阴影、字距与图标色相，不影响任何页面状态或交互。 */
#app { text-rendering: optimizeLegibility; }

@media (min-width: 561px) {
  #app { box-shadow: 0 20px 64px rgba(54, 47, 37, .10); }
}

#app .page .header-eyebrow,
#app .page .section-eyebrow,
#app .page .intro-kicker,
#app .page .hot-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 500;
  letter-spacing: .12em;
}

#app .page .search-icon,
#app .page .header-link image,
#app .page .header-action image,
#app .page .product-icon,
#app .page .category-icon-image {
  filter: grayscale(1) sepia(.16) saturate(.70) contrast(.88);
}

/*
 * Quiet Luxury v4：以高级制表与建筑目录为灵感的统一层。
 * 午夜蓝建立秩序，深酒红承担行动，香槟金只做校准和强调；不依赖大面积
 * 渐变、玻璃或高饱和运营色，保证 H5 与小程序都能稳定复现。
 */
#app,
#app .home,
#app .page,
#app .agent-page,
#app .chat-page {
  color: var(--ink);
  background: var(--page-bg) !important;
}

#app .page image[src*="/static/icons/"],
#app .home image[src*="/static/icons/"],
#app .agent-page image[src*="/static/icons/"],
#app .chat-page image[src*="/static/icons/"] {
  filter: grayscale(.72) sepia(.18) saturate(.62) contrast(.94);
}

#app .page .header,
#app .page .topbar,
#app .page .section-heading,
#app .page .header-title,
#app .page .header-eyebrow,
#app .page .intro-kicker,
#app .page .hot-title {
  box-sizing: border-box;
}

#app .page .header,
#app .page .topbar {
  border-bottom: 1rpx solid var(--line);
  background: transparent;
}

#app .page .header-title,
#app .page .page-title,
#app .page .title,
#app .page .intro-title,
#app .page .section-title,
#app .page .mall-intro .intro-title,
#app .page .user-text .nickname,
#app .page .recent-title {
  color: var(--ink) !important;
  font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', Georgia, serif;
  font-weight: 400;
  letter-spacing: -.035em;
}

#app .page .header-eyebrow,
#app .page .eyebrow,
#app .page .intro-kicker,
#app .page .section-eyebrow,
#app .page .hot-title,
#app .page .recent-eyebrow,
#app .page .account-index {
  color: var(--accent) !important;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 16rpx;
  font-weight: 500;
  letter-spacing: .14em;
}

#app .page .header-action,
#app .page .header-link,
#app .page .discover,
#app .page .top-action {
  border-color: var(--line);
  border-radius: 4rpx;
  color: var(--brand);
  background: var(--surface);
  box-shadow: none;
}

#app .page .search-box,
#app .page .search-input-wrap,
#app .page .search-row .search-box {
  border-color: var(--line);
  border-radius: 4rpx;
  background: var(--surface);
  box-shadow: none;
}

#app .page .search-btn,
#app .page .filter-item.active,
#app .page .cat-item.active,
#app .page .topic-item.active,
#app .page .chip.active,
#app .page .tab.active {
  border-color: var(--brand);
  color: var(--surface) !important;
  background: var(--brand) !important;
}

#app .page .card,
#app .page .person-card,
#app .page .group-card,
#app .page .result-item,
#app .page .product-card,
#app .page .order-card,
#app .page .demand-item,
#app .page .quick-item,
#app .page .overview-card,
#app .page .chart-card,
#app .page .metrics-card {
  border-color: var(--line-soft);
  border-radius: 6rpx;
  background: var(--surface);
  box-shadow: 0 1rpx 0 rgba(23, 35, 45, .025);
}

#app .page .empty-icon,
#app .page .cell-icon,
#app .page .quick-icon,
#app .page .network-entry-icon,
#app .page .provider-entry-icon,
#app .page .menu-icon-box,
#app .page .stat-icon,
#app .page .product-icon,
#app .page .category-icon {
  border: 1rpx solid rgba(180, 148, 96, .26);
  border-radius: 4rpx;
  background: var(--accent-soft) !important;
}

#app .page .primary,
#app .page .primary-action,
#app .page .submit-btn,
#app .page .publish-fab,
#app .page .fab-btn,
#app .page .bottom-btn,
#app .page .search-btn {
  border-color: var(--brand);
  border-radius: 4rpx;
  background: var(--brand) !important;
  box-shadow: none;
}

#app .home {
  padding-right: 40rpx;
  padding-left: 40rpx;
}

#app .home .home-masthead {
  min-height: 112rpx;
  border-bottom-color: var(--line);
}

#app .home .brand-name {
  color: var(--navy);
  letter-spacing: .18em;
}

#app .home .brand-caption { color: var(--accent); }
#app .home .masthead-link { color: var(--ink-soft); }
#app .home .masthead-link:active { color: var(--brand); }

#app .home .masthead-avatar {
  border-color: var(--accent);
  border-radius: 3rpx;
  color: var(--brand);
  background: var(--surface);
}

#app .home .editorial-hero {
  padding-top: 100rpx;
  padding-bottom: 64rpx;
  border-bottom-color: var(--line);
}

#app .home .editorial-hero-eyebrow,
#app .home .ledger-label,
#app .home .workspace-search-label {
  color: var(--accent);
}

#app .home .editorial-hero-title {
  color: var(--navy);
  font-size: 68rpx;
}

#app .home .editorial-hero-desc { color: var(--ink-soft); }

#app .home .editorial-primary {
  min-height: 82rpx;
  border: 1rpx solid var(--brand);
  border-radius: 3rpx;
  line-height: 82rpx;
  background: var(--brand);
}

#app .home .editorial-secondary {
  padding-bottom: 5rpx;
  border-bottom: 1rpx solid rgba(180, 148, 96, .56);
  color: var(--brand);
}

#app .home .editorial-ledger,
#app .home .workspace-index,
#app .home .section-heading,
#app .home .todo-card,
#app .home .promo-strip {
  border-color: var(--line);
}

#app .home .ledger-value,
#app .home .stat-num {
  color: var(--navy);
  font-family: Georgia, 'Times New Roman', serif;
}

#app .home .workspace-search,
#app .home .workspace-action {
  min-height: 104rpx;
  border-bottom-color: var(--line-soft);
}

#app .home .workspace-action:active { background: var(--bg-card-hover); }
#app .home .workspace-action-index { color: var(--accent); }
#app .home .workspace-action-title { color: var(--ink); }
#app .home .workspace-action-desc { color: var(--ink-muted); }
#app .home .workspace-search-arrow,
#app .home .workspace-action-arrow,
#app .home .section-link,
#app .home .quick-entry-arrow,
#app .home .demand-arrow,
#app .home .promo-arrow { color: var(--brand); }

#app .home .brief-launcher {
  border-top-color: var(--accent);
  border-bottom-color: var(--line);
}

#app .home .brief-launcher-title,
#app .home .section-title { color: var(--ink); }

#app .home .brief-launcher-primary {
  border-color: var(--brand);
  border-radius: 3rpx;
  background: var(--brand);
}

#app .home .brief-examples text,
#app .home .home-product-card,
#app .home .quick-entry-card {
  border-color: var(--line-soft);
  border-radius: 4rpx;
  background: var(--surface);
}

#app .home .editorial-feature .home-banner-card {
  border-left: 4rpx solid var(--accent);
  border-radius: 4rpx;
  background: var(--navy) !important;
}

#app .home .editorial-feature .home-banner-eyebrow { color: var(--accent); }
#app .home .editorial-feature .home-banner-title { color: var(--surface); }
#app .home .editorial-feature .home-banner-subtitle { color: rgba(252, 250, 245, .68); }
#app .home .editorial-feature .home-banner-action { color: var(--accent-light); }

#app .home .category-icon,
#app .home .quick-entry-icon,
#app .home .promo-icon {
  border-color: rgba(180, 148, 96, .26);
  background: var(--accent-soft) !important;
}

#app .home .filter-chip.active {
  color: var(--surface);
  background: var(--brand);
}

#app .network-page .hero-card {
  overflow: hidden;
  margin-top: 28rpx;
  padding: 34rpx;
  border: 0;
  border-radius: 7rpx;
  background: var(--navy) !important;
  box-shadow: 0 18rpx 36rpx rgba(23, 42, 56, .12);
}

#app .network-page .hero-card::after { border-color: rgba(180, 148, 96, .28); }
#app .network-page .hero-label { color: var(--accent); }
#app .network-page .hero-title { color: var(--surface) !important; font-size: 44rpx; font-weight: 400; }
#app .network-page .hero-desc { color: rgba(252, 250, 245, .68); }
#app .network-page .search-box { border-color: rgba(252, 250, 245, .25); background: rgba(252, 250, 245, .08); }
#app .network-page .search-input { color: var(--surface); }
#app .network-page .search-placeholder { color: rgba(252, 250, 245, .48); }
#app .network-page .hero-stat .stat-num { color: var(--accent-light); font-family: Georgia, serif; font-weight: 400; }
#app .network-page .hero-stat .stat-label { color: rgba(252, 250, 245, .58); }

#app .network-page .main-tabs {
  gap: 0;
  border-top: 1rpx solid var(--line);
  border-bottom: 1rpx solid var(--line);
}

#app .network-page .main-tab {
  border: 0;
  border-radius: 0;
  background: transparent;
}

#app .network-page .main-tab + .main-tab { border-left: 1rpx solid var(--line-soft); }
#app .network-page .main-tab.active { border-bottom: 3rpx solid var(--accent); color: var(--brand); background: transparent; }
#app .network-page .tab-index { color: var(--accent); font-family: Georgia, serif; }
#app .network-page .tab-title { color: var(--ink); font-weight: 500; }
#app .network-page .tab-desc { color: var(--ink-muted); }
#app .network-page .chip.active { border-color: var(--brand); color: var(--surface); background: var(--brand); }
#app .network-page .person-card,
#app .network-page .group-card { border-radius: 0; background: transparent; box-shadow: none; }
#app .network-page .person-avatar,
#app .network-page .group-cover { border: 1rpx solid rgba(180, 148, 96, .32); border-radius: 4rpx; }
#app .network-page .follow-button { border-color: var(--brand); border-radius: 3rpx; color: var(--brand); background: var(--surface); }
#app .network-page .group-action { color: var(--brand); }

#app .friends-page .summary-card {
  border: 1rpx solid rgba(180, 148, 96, .46);
  border-radius: 6rpx;
  background: var(--navy);
  box-shadow: none;
}

#app .friends-page .summary-card::after { border-color: rgba(180, 148, 96, .24); }
#app .friends-page .summary-number { color: var(--surface); font-family: Georgia, serif; font-weight: 400; }
#app .friends-page .summary-number.accent { color: var(--accent-light); }
#app .friends-page .tabs { border-top: 1rpx solid var(--line); border-bottom: 1rpx solid var(--line); border-radius: 0; background: transparent; }
#app .friends-page .tab { border-radius: 0; color: var(--ink-muted); background: transparent; }
#app .friends-page .tab.active { border-bottom: 3rpx solid var(--accent); color: var(--brand) !important; background: transparent !important; }
#app .friends-page .recent-card { border-top-color: var(--line); border-bottom-color: var(--line); border-radius: 0; background: transparent; }
#app .friends-page .recent-item { border-color: var(--line-soft); border-radius: 4rpx; background: var(--surface); }
#app .friends-page .person-card { border-radius: 0; background: transparent; box-shadow: none; }
#app .friends-page .avatar,
#app .friends-page .recent-avatar { border: 1rpx solid rgba(180, 148, 96, .32); border-radius: 4rpx; }
#app .friends-page .card-action.primary { border: 1rpx solid var(--brand); border-radius: 3rpx; color: var(--brand); background: var(--surface); }
#app .friends-page .count { border-radius: 3rpx; color: var(--brand); background: var(--accent-soft); }

#app .message-page .header {
  padding-top: 34rpx;
  padding-bottom: 28rpx;
  border-bottom-color: var(--line);
}

#app .message-page .header-kicker,
#app .message-page .reminder-kicker,
#app .message-page .timeline-head {
  color: var(--accent);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: .12em;
}

#app .message-page .header-title,
#app .message-page .reminder-title { color: var(--ink); font-family: 'Songti SC', 'Noto Serif CJK SC', 'STSong', Georgia, serif; font-weight: 400; }
#app .message-page .header-copy { color: var(--ink-muted); }
#app .message-page .action-desk { border: 1rpx solid var(--line); border-top: 3rpx solid var(--accent); border-radius: 5rpx; background: var(--surface); box-shadow: none; }
#app .message-page .action-row { border-color: var(--line-soft); background: transparent; }
#app .message-page .action-index { color: var(--accent); font-family: Georgia, serif; }
#app .message-page .action-label { color: var(--brand); }
#app .message-page .tab-bar { border-top: 1rpx solid var(--line); border-bottom: 1rpx solid var(--line); background: transparent; }
#app .message-page .tab-item { border-radius: 0; color: var(--ink-muted); }
#app .message-page .tab-item.active { border-bottom: 3rpx solid var(--accent); color: var(--brand); background: transparent; }
#app .message-page .tab-count { color: var(--brand); background: var(--accent-soft); }
#app .message-page .list-scroll { background: transparent; }
#app .message-page .msg-item { border-bottom: 1rpx solid var(--line-soft); border-radius: 0; background: transparent; }
#app .message-page .msg-icon-box { border: 1rpx solid rgba(180, 148, 96, .28); border-radius: 4rpx; background: var(--accent-soft); }
#app .message-page .msg-title { color: var(--ink); }
#app .message-page .msg-time,
#app .message-page .msg-desc { color: var(--ink-muted); }
#app .message-page .msg-dot { background: var(--accent); }

#app .chat-page .direct-header { border-bottom-color: var(--line); background: var(--surface); }
#app .chat-page .direct-avatar { border-color: rgba(180, 148, 96, .55); border-radius: 4rpx; background: var(--accent-soft); }
#app .chat-page .direct-kicker { color: var(--accent); }
#app .chat-page .direct-title { color: var(--ink); }
#app .chat-page .bubble.user { border-color: var(--brand); color: var(--surface); background: var(--brand); }
#app .chat-page .bubble.service { color: var(--ink); background: transparent; }
#app .chat-page .avatar { border-color: rgba(180, 148, 96, .42); border-radius: 4rpx; }
#app .chat-page .quick-bar,
#app .chat-page .input-bar { border-color: var(--line); background: var(--surface); }
#app .chat-page .quick-item,
#app .chat-page .attach-trigger { border-color: var(--line); color: var(--brand); }
#app .chat-page .msg-input { border-color: var(--line); background: var(--page-bg); }
#app .chat-page .send-btn.active { background: var(--brand); }

/* 消息中心：待处理事项先给出语义信号，再读标题；窄屏时操作区自动落到标题下方。 */
#app .message-page .action-row {
  grid-template-columns: 46rpx minmax(0, 1fr) auto;
  animation: mm-list-reveal .46s var(--mm-motion-ease-out) both;
}

#app .message-page .action-index-cell {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}

#app .message-page .action-icon {
  display: block;
  width: 26rpx;
  height: 26rpx;
  padding: 5rpx;
  border: 1rpx solid rgba(180, 148, 96, .3);
  border-radius: 50%;
  background: var(--accent-soft);
  box-sizing: border-box;
  object-fit: contain;
}

#app .message-page .action-row:nth-child(2) { animation-delay: .06s; }
#app .message-page .action-row:nth-child(3) { animation-delay: .12s; }
#app .message-page .action-row:nth-child(4) { animation-delay: .18s; }

#app .message-page .msg-item {
  animation: mm-list-reveal .46s var(--mm-motion-ease-out) both;
}

#app .message-page .msg-item:nth-child(1) { animation-delay: .06s; }
#app .message-page .msg-item:nth-child(2) { animation-delay: .1s; }
#app .message-page .msg-item:nth-child(3) { animation-delay: .14s; }
#app .message-page .msg-item:nth-child(4) { animation-delay: .18s; }

@media (max-width: 420px) {
  #app .message-page .header {
    flex-direction: column;
    gap: 12rpx;
  }

  #app .message-page .header-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

#app .demand-page .list-intro,
#app .mall-page .mall-intro,
#app .community-page .network-entry,
#app .account-page .profile-completion {
  border-top: 2rpx solid var(--accent);
}

#app .demand-page .intro-live,
#app .mall-page .intro-count,
#app .community-page .topic-count { color: var(--accent); }
#app .demand-page .intent-chip.active,
#app .mall-page .offer-item,
#app .community-page .hot-card { border-color: var(--line); background: var(--surface); }
#app .demand-page .demand-item,
#app .mall-page .product-item,
#app .community-page .post-card { border-radius: 0; background: transparent; box-shadow: none; }
#app .demand-page .demand-item + .demand-item,
#app .mall-page .product-item + .product-item,
#app .community-page .post-card + .post-card { border-top: 1rpx solid var(--line-soft); }
#app .demand-page .demand-title,
#app .mall-page .product-title,
#app .community-page .post-title { color: var(--ink); }
#app .demand-page .demand-company,
#app .mall-page .product-price,
#app .community-page .post-author { color: var(--brand); }

#app .account-page .header { padding-bottom: 30rpx; }
#app .account-page .avatar-box { border: 1rpx solid var(--accent); border-radius: 4rpx; background: var(--brand); box-shadow: none; }
#app .account-page .credit-card { border: 1rpx solid rgba(180, 148, 96, .48); border-radius: 6rpx; background: var(--navy); box-shadow: none; }
#app .account-page .credit-score { color: var(--accent-light); font-family: Georgia, serif; font-weight: 400; }
#app .account-page .credit-label,
#app .account-page .ci-label { color: rgba(252, 250, 245, .64); }
#app .account-page .network-entry { border-left: 3rpx solid var(--accent); border-radius: 5rpx; background: var(--surface); }

#app .brief-page .agent-header {
  border-bottom: 1rpx solid var(--line);
  background: var(--page-bg);
}

#app .brief-page .agent-document-index,
#app .brief-page .agent-eyebrow,
#app .brief-page .message-label,
#app .brief-page .result-label,
#app .brief-page .match-section-kicker { color: var(--accent); }
#app .brief-page .agent-title,
#app .brief-page .result-summary,
#app .brief-page .match-section-title { color: var(--ink); }
#app .brief-page .clear-button { border-color: var(--brand); color: var(--brand); }
#app .brief-page .result-card { border-top-color: var(--accent); background: var(--surface); }
#app .brief-page .result-meter-fill { background: var(--brand); }
#app .brief-page .team-contact,
#app .brief-page .result-ready-primary,
#app .brief-page .editor-submit { border-radius: 3rpx; background: var(--brand); }

@media (max-width: 420px) {
  #app .home { padding-right: 28rpx; padding-left: 28rpx; }
  #app .home .editorial-hero-title { font-size: 56rpx; }
  #app .network-page .hero-card { padding: 28rpx; }
  #app .network-page .hero-title { font-size: 39rpx; }
}

/*
 * Motion system
 * 页面负责表达层级，组件负责表达反馈；两者使用同一套“慢而克制”的曲线。
 * 只改变 opacity / transform / color / shadow，不影响布局尺寸，避免动效造成越界。
 */
#app {
  --mm-motion-ease: cubic-bezier(.2, .78, .2, 1);
  --mm-motion-ease-out: cubic-bezier(.16, .84, .24, 1);
  --mm-motion-fast: .2s;
  --mm-motion-base: .36s;
  --mm-motion-slow: .62s;
}

#app .page,
#app .home,
#app .chat-page,
#app .detail-page,
#app .confirm-page,
#app .publish-page,
#app .login-page,
#app .profile-page,
#app .onboard-page,
#app .page-state,
#app .state-page {
  animation: mm-page-enter .62s var(--mm-motion-ease-out) both;
  transform-origin: 50% 12%;
  will-change: opacity, transform;
}

/* 首页是主入口，按阅读顺序进入；开屏结束后能自然接住视线。 */
#app .home .home-masthead,
#app .home .editorial-hero,
#app .home .service-alert,
#app .home .service-note,
#app .home .workspace-index,
#app .home .brief-launcher,
#app .home .editorial-feature,
#app .home .todo-card,
#app .home .industry-atlas,
#app .home .category-section,
#app .home .quick-entry-section,
#app .home .product-section,
#app .home .recommend-section,
#app .home .promo-strip {
  animation: mm-section-reveal .66s var(--mm-motion-ease-out) both;
  will-change: opacity, transform;
}

#app .home .home-masthead { animation-delay: .04s; }
#app .home .editorial-hero { animation-delay: .1s; }
#app .home .service-alert,
#app .home .service-note { animation-delay: .14s; }
#app .home .workspace-index { animation-delay: .18s; }
#app .home .brief-launcher { animation-delay: .24s; }
#app .home .editorial-feature { animation-delay: .3s; }
#app .home .todo-card { animation-delay: .36s; }
#app .home .industry-atlas { animation-delay: .42s; }
#app .home .category-section { animation-delay: .48s; }
#app .home .quick-entry-section,
#app .home .product-section,
#app .home .recommend-section,
#app .home .promo-strip { animation-delay: .54s; }

/* 普通页面的标题、摘要和内容块形成轻微的纵向层次。 */
#app .page .header,
#app .page .topbar,
#app .page .page-header,
#app .page .hero-card,
#app .page .list-intro,
#app .page .summary-card,
#app .page .action-desk,
#app .page .section-heading,
#app .page .section-head,
#app .page .section-card,
#app .page .form-card,
#app .page .result-card,
#app .detail-page .detail-card,
#app .chat-page .direct-header {
  animation: mm-section-reveal .54s var(--mm-motion-ease-out) .08s both;
  will-change: opacity, transform;
}

/* 已有列表级联统一节奏；保留各页面的 inline animationDelay。 */
#app .page .fade-in,
#app .home .todo-item,
#app .home .industry-lane,
#app .home .category-item,
#app .home .quick-entry-card,
#app .home .home-product-card {
  animation: mm-list-reveal .56s var(--mm-motion-ease-out) both;
  will-change: opacity, transform;
}

#app .home .todo-item:nth-child(1),
#app .home .industry-lane:nth-child(1),
#app .home .quick-entry-card:nth-child(1),
#app .home .home-product-card:nth-child(1) { animation-delay: .12s; }
#app .home .todo-item:nth-child(2),
#app .home .industry-lane:nth-child(2),
#app .home .quick-entry-card:nth-child(2),
#app .home .home-product-card:nth-child(2) { animation-delay: .18s; }
#app .home .todo-item:nth-child(3),
#app .home .industry-lane:nth-child(3),
#app .home .quick-entry-card:nth-child(3),
#app .home .home-product-card:nth-child(3) { animation-delay: .24s; }
#app .home .todo-item:nth-child(4),
#app .home .industry-lane:nth-child(4),
#app .home .quick-entry-card:nth-child(4),
#app .home .home-product-card:nth-child(4) { animation-delay: .3s; }

/* 点击反馈统一为“下沉 2rpx + 微弱收敛”，不会再被旧的 transform:none 抹掉。 */
#app .card-press,
#app .quiet-button,
#app .action-btn,
#app .empty-btn,
#app .page-state-action,
#app .home .workspace-search,
#app .home .workspace-action,
#app .home .editorial-primary,
#app .home .brief-launcher-primary,
#app .home .quick-entry-card,
#app .home .home-product-card,
#app .home .demand-item,
#app .home .industry-lane,
#app .home .category-item,
#app .home .todo-item,
#app .home .home-banner-card {
  transition: transform var(--mm-motion-base) var(--mm-motion-ease),
    border-color var(--mm-motion-base) ease,
    background-color var(--mm-motion-base) ease,
    box-shadow var(--mm-motion-base) ease,
    opacity var(--mm-motion-fast) ease;
}

#app .card-press:active,
#app .quiet-button:active,
#app .action-btn:active,
#app .empty-btn:active,
#app .page-state-action:active,
#app .home .workspace-search:active,
#app .home .workspace-action:active,
#app .home .editorial-primary:active,
#app .home .brief-launcher-primary:active,
#app .home .quick-entry-card:active,
#app .home .home-product-card:active,
#app .home .demand-item:active,
#app .home .industry-lane:active,
#app .home .category-item:active,
#app .home .todo-item:active,
#app .home .home-banner-card:active {
  opacity: .9;
  transform: translateY(2rpx) scale(.996);
}

/* tab 切换与弹层不再“瞬间出现”，但仍然保持响应迅速。 */
#app .tab,
#app .tab-item,
#app .tab-bar,
#app .main-tab,
#app .picker-opt,
#app .choice-item {
  transition: color var(--mm-motion-base) ease,
    background-color var(--mm-motion-base) ease,
    border-color var(--mm-motion-base) ease,
    opacity var(--mm-motion-fast) ease;
}

#app .tab.active,
#app .tab-item.active,
#app .main-tab.active,
#app .picker-opt.active,
#app .choice-item.selected {
  animation: mm-state-settle .42s var(--mm-motion-ease-out) both;
}

#app .modal-mask,
#app .picker-mask,
#app .sheet-mask,
#app .intro-mask {
  animation: mm-mask-in .28s ease-out both;
}

#app .modal-panel,
#app .modal,
#app .picker-panel,
#app .join-sheet,
#app .branch-sheet,
#app .manage-sheet,
#app .sheet,
#app .intro-sheet {
  animation: mm-panel-enter .46s var(--mm-motion-ease-out) both;
  transform-origin: 50% 100%;
  will-change: opacity, transform;
}

#app input,
#app textarea {
  transition: border-color var(--mm-motion-base) ease,
    box-shadow var(--mm-motion-base) ease,
    background-color var(--mm-motion-base) ease;
}

@keyframes mm-page-enter {
  from { opacity: 0; transform: translate3d(0, 14rpx, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes mm-section-reveal {
  from { opacity: 0; transform: translate3d(0, 18rpx, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes mm-list-reveal {
  from { opacity: 0; transform: translate3d(0, 12rpx, 0) scale(.994); }
  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

@keyframes mm-state-settle {
  from { opacity: .62; transform: translateY(3rpx); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes mm-mask-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes mm-panel-enter {
  from { opacity: 0; transform: translate3d(0, 24rpx, 0) scale(.988); }
  to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}

/* Visual polish v3：用真实品牌印章做主视觉锚点，补足层次，但不把页面变成装饰展板。 */
#app .home .editorial-hero,
#app .network-page .hero-card {
  position: relative;
}

#app .home .editorial-hero { overflow: hidden; }

#app .home .editorial-hero-seal {
  position: absolute;
  z-index: 0;
  top: 18rpx;
  right: 28rpx;
  width: 220rpx;
  height: 220rpx;
  opacity: .1;
  pointer-events: none;
  transform: rotate(12deg);
  animation: mm-seal-drift 7s ease-in-out .35s infinite alternate;
}

#app .home .editorial-hero-eyebrow,
#app .home .editorial-hero-title,
#app .home .editorial-hero-desc,
#app .home .editorial-hero-actions,
#app .home .editorial-ledger {
  position: relative;
  z-index: 1;
}

#app .home .editorial-primary {
  box-shadow: 0 12rpx 22rpx rgba(92, 40, 40, .12);
}

/* 首页入口的 icon 使用统一的“器物框”，保留原 SVG 线稿，不再让每个入口各自抢颜色。 */
#app .home .quick-entry-icon {
  width: 42rpx;
  height: 42rpx;
  border: 1rpx solid rgba(180, 148, 96, .3);
  border-radius: 3rpx;
  background: var(--accent-soft) !important;
}

#app .home .quick-entry-icon-image {
  width: 27rpx;
  height: 27rpx;
}

#app .home .quick-entry-card {
  border-left: 2rpx solid rgba(180, 148, 96, .42);
}

#app .network-page .hero-seal {
  position: absolute;
  z-index: 0;
  top: -18rpx;
  right: 32rpx;
  width: 210rpx;
  height: 210rpx;
  opacity: .11;
  pointer-events: none;
  transform: rotate(10deg);
  animation: mm-seal-drift 8s ease-in-out .5s infinite alternate-reverse;
}

#app .network-page .hero-copy,
#app .network-page .search-box,
#app .network-page .hero-stats {
  position: relative;
  z-index: 1;
}

/* 三个高频入口需要成为操作台，而不是一排小字。 */
#app .network-page .top-action {
  min-width: 108rpx;
  min-height: 70rpx;
  gap: 8rpx;
  border-color: rgba(180, 148, 96, .28);
  border-radius: 4rpx;
  color: var(--brand);
  background: var(--surface);
  font-size: 20rpx;
}

#app .network-page .top-action image {
  width: 32rpx;
  height: 32rpx;
  flex-basis: 32rpx;
  padding: 5rpx;
  border: 1rpx solid rgba(180, 148, 96, .3);
  border-radius: 50%;
  box-sizing: border-box;
  opacity: .86;
}

#app .network-page .cover-icon {
  display: block;
  top: 62rpx;
  right: 18rpx;
  bottom: auto;
  width: 44rpx;
  height: 44rpx;
  opacity: .52;
  filter: none;
}

#app .network-page .group-cover {
  border-left: 2rpx solid rgba(180, 148, 96, .46);
}

/* 对话流按角色入场，服务消息从左侧、用户消息从右侧，反馈比统一淡入更可读。 */
#app .chat-page .msg-item,
#app .chat-page .typing,
#app .chat-page .service-action-panel {
  animation: mm-message-in .42s var(--mm-motion-ease-out) both;
}

#app .chat-page .msg-item.user { animation-name: mm-message-in-user; }
#app .chat-page .msg-item:nth-child(2) { animation-delay: .04s; }
#app .chat-page .msg-item:nth-child(3) { animation-delay: .08s; }
#app .chat-page .msg-item:nth-child(4) { animation-delay: .12s; }
#app .chat-page .msg-item:nth-child(5) { animation-delay: .16s; }
#app .chat-page .msg-item:nth-child(6) { animation-delay: .2s; }

@keyframes mm-seal-drift {
  from { opacity: .07; transform: rotate(9deg) scale(.98); }
  to { opacity: .13; transform: rotate(15deg) scale(1.03); }
}

@keyframes mm-message-in {
  from { opacity: 0; transform: translate3d(-8rpx, 10rpx, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes mm-message-in-user {
  from { opacity: 0; transform: translate3d(8rpx, 10rpx, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  #app .page,
  #app .home,
  #app .chat-page,
  #app .detail-page,
  #app .confirm-page,
  #app .publish-page,
  #app .login-page,
  #app .profile-page,
  #app .onboard-page,
  #app .page-state,
  #app .state-page,
  #app .home .home-masthead,
  #app .home .editorial-hero,
  #app .home .service-alert,
  #app .home .service-note,
  #app .home .workspace-index,
  #app .home .brief-launcher,
  #app .home .editorial-feature,
  #app .home .todo-card,
  #app .home .industry-atlas,
  #app .home .category-section,
  #app .home .quick-entry-section,
  #app .home .product-section,
  #app .home .recommend-section,
  #app .home .promo-strip,
  #app .page .header,
  #app .page .topbar,
  #app .page .page-header,
  #app .page .hero-card,
  #app .page .list-intro,
  #app .page .summary-card,
  #app .page .action-desk,
  #app .page .section-heading,
  #app .page .section-head,
  #app .page .section-card,
  #app .page .form-card,
  #app .page .result-card,
  #app .detail-page .detail-card,
  #app .chat-page .direct-header,
  #app .page .fade-in,
  #app .home .todo-item,
  #app .home .industry-lane,
  #app .home .category-item,
  #app .home .quick-entry-card,
  #app .home .home-product-card,
  #app .home .editorial-hero-seal,
  #app .network-page .hero-seal,
  #app .chat-page .msg-item,
  #app .chat-page .typing,
  #app .chat-page .service-action-panel,
  #app .message-page .action-row,
  #app .message-page .msg-item,
  #app .modal-mask,
  #app .picker-mask,
  #app .sheet-mask,
  #app .intro-mask,
  #app .modal-panel,
  #app .modal,
  #app .picker-panel,
  #app .join-sheet,
  #app .branch-sheet,
  #app .manage-sheet,
  #app .sheet,
  #app .intro-sheet {
    animation: none !important;
    transform: none !important;
    will-change: auto;
  }

  #app .card-press,
  #app .quiet-button,
  #app .action-btn,
  #app .empty-btn,
  #app .page-state-action,
  #app .home .workspace-search,
  #app .home .workspace-action,
  #app .home .editorial-primary,
  #app .home .brief-launcher-primary,
  #app .home .quick-entry-card,
  #app .home .home-product-card,
  #app .home .demand-item,
  #app .home .industry-lane,
  #app .home .category-item,
  #app .home .todo-item,
  #app .home .home-banner-card,
  #app .tab,
  #app .tab-item,
  #app .tab-bar,
  #app .main-tab,
  #app .picker-opt,
  #app .choice-item,
  #app input,
  #app textarea {
    transition: none !important;
  }
}
/* Quiet Atelier v4：覆盖旧版首页视觉层，避免全局 polish 规则把新主视觉压回角落。 */
#app .home {
  padding-right: 28rpx;
  padding-left: 28rpx;
  background: #f7f3eb;
}

#app .home .editorial-hero {
  padding-top: 24rpx;
  padding-bottom: 52rpx;
}

#app .home .editorial-hero-visual {
  position: relative;
  width: 100%;
  height: 346rpx;
  margin-top: 18rpx;
  overflow: hidden;
  background: #efe9df;
}

#app .home .editorial-hero-seal {
  position: static;
  display: block;
  width: 100%;
  height: 100%;
  opacity: 1;
  transform: none;
  animation: mm-porcelain-float 8s ease-in-out .2s infinite alternate;
}

#app .home .editorial-hero-copy { position: relative; z-index: 1; margin-top: 34rpx; }
#app .home .editorial-hero-title { margin-top: 0; color: #2d352d; font-size: 50rpx; }
#app .home .editorial-hero-desc { color: #777466; }
#app .home .editorial-primary,
#app .home .brief-launcher-primary {
  border-color: #8b3031;
  border-radius: 5rpx;
  color: #fffaf4;
  background: #8b3031;
}
#app .home .editorial-primary:active,
#app .home .brief-launcher-primary:active { background: #6f2526; }
#app .home .brief-launcher-input { border-color: rgba(43, 48, 40, .14); border-radius: 6rpx; background: #fbfaf6; }
#app .home .home-loading-screen { background: #f7f3eb; }
#app .home .home-loading-progress-fill { background: #8b3031; }

@media (max-width: 420px) {
  #app .home .editorial-hero-visual { height: 316rpx; }
  #app .home .editorial-hero-title { font-size: 46rpx; }
}

@keyframes mm-porcelain-float {
  from { transform: translate3d(0, 0, 0) scale(1); }
  to { transform: translate3d(0, -4rpx, 0) scale(1.012); }
}

/* Quiet Atelier v5：消息、私聊与关系管理使用同一套“目录页”节奏。
 * 重点是边界、头像归属和窄屏收缩，不改变数据、路由或交互语义。 */
#app .message-page,
#app .chat-page,
#app .friends-page {
  overflow-x: hidden;
  color: var(--ink);
  background: #f7f3eb !important;
}

#app .message-page .header {
  margin: 0 28rpx;
  padding: 32rpx 0 24rpx;
  border-bottom-color: var(--line);
}

#app .message-page .header-actions {
  display: flex;
  max-width: 46%;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8rpx 14rpx;
}

#app .message-page .subscribe-btn,
#app .message-page .read-all-btn {
  display: inline-flex;
  min-height: 48rpx;
  align-items: center;
  padding: 0 10rpx;
  box-sizing: border-box;
  white-space: nowrap;
}

#app .message-page .subscribe-btn {
  border-color: rgba(139, 48, 49, .24);
  color: #8b3031;
  background: rgba(139, 48, 49, .035);
}

#app .message-page .action-desk { margin-right: 28rpx; margin-left: 28rpx; }
#app .message-page .action-desk-head { padding-top: 20rpx; }
#app .message-page .action-row { min-width: 0; padding: 17rpx 0; }
#app .message-page .action-copy { overflow: hidden; }
#app .message-page .action-label { max-width: 120rpx; overflow: hidden; text-overflow: ellipsis; }
#app .message-page .tab-bar { gap: 14rpx; padding-right: 28rpx; padding-left: 28rpx; }
#app .message-page .tab-item { min-height: 54rpx; padding-right: 0; padding-left: 0; }
#app .message-page .list-scroll { padding-right: 28rpx; padding-left: 28rpx; }
#app .message-page .msg-item { margin-bottom: 0; padding: 21rpx 0; border-top: 0; border-bottom: 1rpx solid var(--line-soft); background: transparent; }
#app .message-page .msg-item.unread { padding-left: 14rpx; border-left: 2rpx solid #8b3031; background: rgba(139, 48, 49, .035); }
#app .message-page .msg-icon-box { width: 58rpx; height: 58rpx; margin-right: 16rpx; flex-basis: 58rpx; border-color: rgba(180, 148, 96, .34); background: var(--accent-soft); }
#app .message-page .msg-icon { width: 30rpx; height: 30rpx; }
#app .message-page .msg-title { font-size: 24rpx; font-weight: 500; }
#app .message-page .msg-desc { font-size: 19rpx; }
#app .message-page .empty { padding: 72rpx 24rpx; }

#app .chat-page { min-width: 0; }
#app .chat-page .direct-header { min-width: 0; padding: 26rpx 28rpx 24rpx; background: #fbfaf6; }
#app .chat-page .direct-identity { min-width: 0; }
#app .chat-page .direct-avatar { width: 58rpx; height: 58rpx; flex-basis: 58rpx; border-radius: 5rpx; background: #ece6dc; }
#app .chat-page .direct-title { min-width: 0; font-size: 32rpx; }
#app .chat-page .direct-subtitle { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#app .chat-page .direct-status { min-width: 0; max-width: 180rpx; overflow: hidden; text-overflow: ellipsis; }
#app .chat-page .msg-list { padding: 34rpx 28rpx 40rpx; }
#app .chat-page .msg-item { width: 100%; min-width: 0; }
#app .chat-page .msg-item.service { justify-content: flex-start; }
#app .chat-page .msg-item.user { justify-content: flex-end; }
#app .chat-page .avatar { width: 52rpx; height: 52rpx; flex-basis: 52rpx; border-radius: 4rpx; }
#app .chat-page .bubble { max-width: min(510rpx, calc(100% - 68rpx)); overflow-wrap: anywhere; word-break: break-word; }
#app .chat-page .bubble.service { margin-left: 14rpx; padding: 8rpx 0 8rpx 2rpx; }
#app .chat-page .bubble.user { margin-right: 14rpx; padding: 14rpx 18rpx; border: 1rpx solid rgba(139, 48, 49, .32); border-radius: 5rpx; color: var(--surface); background: #8b3031; }
#app .chat-page .user-avatar { border-color: rgba(139, 48, 49, .32); background: #8b3031; }
#app .chat-page .user-avatar text { color: #fffaf4; }
#app .chat-page .bubble.user .message-attachment { border-color: rgba(255, 255, 255, .28); background: rgba(255, 255, 255, .1); }
#app .chat-page .bubble.user .message-attachment-name,
#app .chat-page .bubble.user .message-attachment-meta { color: rgba(255, 250, 244, .9); }
#app .chat-page .typing { min-width: 0; }
#app .chat-page .quick-bar,
#app .chat-page .input-bar { padding-right: 28rpx; padding-left: 28rpx; background: #fbfaf6; }
#app .chat-page .quick-bar { overflow: hidden; }
#app .chat-page .input-row { gap: 8rpx; }
#app .chat-page .msg-input { min-width: 0; flex: 1 1 auto; }
#app .chat-page .send-btn { min-width: 92rpx; min-height: 76rpx; margin-left: 0; padding: 0 16rpx; display: inline-flex; align-items: center; justify-content: center; }
#app .chat-page .composer-tools { min-width: 0; flex-wrap: wrap; }
#app .chat-page .attachment-hint { margin-left: auto; }
#app .chat-page .service-action-panel { margin-left: 66rpx; max-width: calc(100% - 66rpx); box-sizing: border-box; }

#app .friends-page { padding-right: 28rpx; padding-left: 28rpx; }
#app .friends-page .topbar { margin-right: -28rpx; margin-left: -28rpx; padding: 32rpx 28rpx 24rpx; border-bottom-color: var(--line); }
#app .friends-page .title { font-size: 44rpx; }
#app .friends-page .subtitle { max-width: 480rpx; color: var(--ink-muted); }
#app .friends-page .discover { min-width: 84rpx; min-height: 56rpx; border-color: var(--line); border-radius: 4rpx; color: var(--brand); background: var(--surface); }
#app .friends-page .summary-card { margin-top: 28rpx; padding: 22rpx 14rpx; border-color: rgba(180, 148, 96, .52); border-radius: 6rpx; background: #4d5545; }
#app .friends-page .summary-card::after { right: -76rpx; bottom: -128rpx; border-color: rgba(244, 235, 217, .2); box-shadow: 0 0 0 28rpx rgba(244, 235, 217, .055); }
#app .friends-page .summary-label { color: rgba(252, 250, 245, .72); }
#app .friends-page .summary-number { color: #fcfaf5; }
#app .friends-page .summary-number.accent { color: #e9c78f; }
#app .friends-page .tabs { margin-top: 28rpx; margin-bottom: 24rpx; gap: 18rpx; padding: 0; border-top-color: var(--line); border-bottom-color: var(--line); }
#app .friends-page .tab { min-width: 124rpx; min-height: 56rpx; padding: 15rpx 0 13rpx; }
#app .friends-page .recent-card { padding-top: 22rpx; padding-bottom: 22rpx; }
#app .friends-page .recent-item { width: 304rpx; min-width: 0; }
#app .friends-page .recent-avatar,
#app .friends-page .avatar { width: 62rpx; height: 62rpx; flex-basis: 62rpx; border-radius: 5rpx; }
#app .friends-page .person-card { gap: 14rpx; padding: 21rpx 0; }
#app .friends-page .name-line { align-items: flex-start; flex-wrap: wrap; gap: 6rpx; }
#app .friends-page .name { font-size: 24rpx; }
#app .friends-page .online { max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
#app .friends-page .card-action { min-width: 78rpx; min-height: 52rpx; padding: 10rpx 10rpx; border-radius: 4rpx; }
#app .friends-page .request-actions { gap: 6rpx; }
#app .friends-page .empty { margin-top: 8rpx; padding: 68rpx 24rpx; border-color: rgba(30, 27, 22, .15); border-radius: 5rpx; background: rgba(252, 250, 245, .76); }
#app .friends-page .empty-icon { background: var(--accent-soft); }
#app .friends-page .empty-action { border: 1rpx solid rgba(139, 48, 49, .24); border-radius: 4rpx; color: #8b3031; background: transparent; }
#app .friends-page .bottom-note { align-items: flex-start; }

@media (max-width: 420px) {
  #app .message-page .header-actions { max-width: 100%; justify-content: flex-start; }
  #app .message-page .header { gap: 14rpx; }
  #app .chat-page .direct-header,
  #app .chat-page .msg-list,
  #app .chat-page .quick-bar,
  #app .chat-page .input-bar { padding-right: 24rpx; padding-left: 24rpx; }
  #app .chat-page .direct-status { max-width: 144rpx; }
  #app .chat-page .bubble { max-width: calc(100% - 64rpx); }
  #app .friends-page { padding-right: 24rpx; padding-left: 24rpx; }
  #app .friends-page .topbar { margin-right: -24rpx; margin-left: -24rpx; padding-right: 24rpx; padding-left: 24rpx; }
  #app .friends-page .recent-scroll { margin-right: -24rpx; margin-left: -24rpx; padding-right: 24rpx; padding-left: 24rpx; }
}
</style>
