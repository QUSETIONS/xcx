<template>
  <view v-if="detailState === 'loading'" class="detail-state"><text>正在加载资料…</text></view>

  <view v-else-if="detailState === 'error'" class="detail-state error-state" @tap="reload">
    <image class="detail-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>资料加载失败，点击重试</text>
  </view>

  <view class="detail-page" v-else-if="resource">
    <view class="info-card">
      <text class="info-title">{{ resource.title }}</text>
      <view class="info-tags">
        <text class="tag">{{ categoryName(resource.category_id, resource.category_name) }}</text>
        <text class="tag">{{ resource.file_type }}</text>
        <text class="tag">{{ resource.file_size }}</text>
      </view>
    </view>

    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-val">{{ resource.view_count }}</text>
        <text class="stat-label">{{ t('demandDetail.views') }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-val">{{ resource.download_count }}</text>
        <text class="stat-label">{{ t('resource.downloads') }}</text>
      </view>
      <view class="stat-item">
        <text class="stat-val">{{ resource.favorite_count }}</text>
        <text class="stat-label">{{ t('demandDetail.favorites') }}</text>
      </view>
    </view>

    <view class="desc-card">
      <text class="card-label">{{ t('resource.summary') }}</text>
      <text class="desc-text">{{ resource.summary }}</text>
    </view>

    <view v-if="resource.content_rich" class="content-card">
      <text class="card-label">资料正文</text>
      <rich-text class="content-rich" :nodes="resource.content_rich" />
    </view>

    <view class="preview-card">
      <text class="card-label">{{ t('resource.preview') }}</text>
      <view class="preview-box">
        <image class="preview-icon" src="/static/icons/file.svg" mode="aspectFit" />
        <text class="preview-name">{{ resource.title }}.{{ resource.file_type }}</text>
      </view>
    </view>

    <view class="download-tips">
      <text class="tips-title">{{ t('resource.downloadTips') }}</text>
      <text class="tips-item">• {{ t('resource.tip1') }}</text>
      <text class="tips-item">• {{ t('resource.tip2') }}</text>
      <text class="tips-item">• {{ t('resource.tip3') }}</text>
    </view>

    <view v-if="resource.related?.length" class="related-card">
      <view class="related-head"><text class="card-label">你可能还需要</text><text class="related-count">同类资料</text></view>
      <view v-for="item in resource.related" :key="item._id" class="related-item" @tap="goRelated(item._id)">
        <view class="related-file"><text>{{ fileLabel(item.file_type) }}</text></view>
        <view class="related-copy"><text class="related-title">{{ item.title }}</text><text class="related-meta">{{ item.file_type || '在线资料' }} · {{ item.file_size || '—' }}</text></view>
        <text class="related-arrow">›</text>
      </view>
    </view>

    <view class="action-bar">
      <view class="collect-btn" @tap="toggleCollect">
        <text>{{ isCollected ? t('resource.collected') : t('demandDetail.favorite') }}</text>
      </view>
      <view class="download-btn" :class="{ free: resource.is_free || resource.can_download }" @tap="download">
        <text>{{ downloading ? t('resource.downloading') : (resource.can_download ? t('resource.downloadNow') : ('¥' + (resource.price/100).toFixed(0) + t('resource.getPrice'))) }}</text>
      </view>
    </view>
  </view>

  <view v-else class="detail-state"><image class="detail-state-icon" src="/static/icons/file.svg" mode="aspectFit" /><text>{{ t('resource.empty') }}</text></view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useRequest } from '@/hooks/useRequest'
import { useNavTitle } from '@/hooks/useNavTitle'
import { categoryName } from '@/utils/i18n-maps'
import { t } from '@/i18n'
import { baseURL } from '@/config/env'
import { useUserStore } from '@/stores/user'
import { getStoredSession, hasStoredAccessToken } from '@/utils/session'
useNavTitle('titles.resourceDetail')

const userStore = useUserStore()
const isCollected = ref(false)
const resourceId = ref('')
const purchasing = ref(false)
const downloading = ref(false)
const downloadRequestKey = ref('')
const { data: resource, state: detailState, run: loadResource } = useRequest(
  (id) => bridge.resource.detail(id)
)

onLoad(async (q) => {
  resourceId.value = q.id || ''
  await loadResource(resourceId.value)
  if (resource.value) isCollected.value = !!resource.value.is_favorited
})

async function reload() {
  if (!resourceId.value) return
  await loadResource(resourceId.value)
}

async function toggleCollect() {
  if (!resource.value) return
  if (!(await ensureSession())) return
  const result = await bridge.favorite.toggle({ targetType: 'resource', targetId: resource.value._id })
  isCollected.value = !!result?.isFavorited
  resource.value.is_favorited = isCollected.value
  uni.showToast({ title: isCollected.value ? t('demandDetail.favorited') : t('user.removedFav'), icon: 'success' })
}

async function ensureSession() {
  // H5 首次打开详情页时，Pinia 可能还没完成持久化恢复，但请求层已经能读到
  // user 存储中的会话。这里先把同一份会话同步回 store，避免用户明明有 token
  // 却被误判为游客，尤其是点击下载时直接看到登录提示或后续拿到 401。
  if (restoreStoredSession()) return true
  const ok = await userStore.ensureLogin()
  if (ok) return true
  if (restoreStoredSession()) return true
  uni.showToast({ title: '请先登录后再操作', icon: 'none' })
  setTimeout(() => uni.navigateTo({ url: '/pages/user/login' }), 250)
  return false
}

function restoreStoredSession() {
  const stored = getStoredSession()
  if (!stored?.token) return false
  if (!userStore.isLoggedIn && typeof userStore.applySession === 'function') {
    userStore.applySession({
      token: stored.token,
      refresh_token: stored.refresh_token || stored.refreshToken || '',
      refresh_expires_at: stored.refresh_expires_at || stored.refreshExpiresAt || '',
      user: stored.userInfo || stored.user || undefined
    })
  }
  return Boolean(userStore.isLoggedIn || stored.token)
}

async function completeDownload() {
  if (!resource.value || downloading.value) return
  if (!(await ensureSession())) return
  downloading.value = true
  try {
    if (!downloadRequestKey.value) downloadRequestKey.value = `resource-download-${resourceId.value}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const result = await bridge.resource.download(resourceId.value, { requestKey: downloadRequestKey.value })
    resource.value.download_count = result?.download_count ?? ((resource.value.download_count || 0) + 1)
    const path = result?.download_url || resource.value.download_url
    if (!path) throw new Error(t('resource.downloadFailed'))
    const url = path.startsWith('http') ? path : `${baseURL}${path}`

    // H5 不能用 window.open 直接打开受保护地址：新窗口不会继承 Authorization，
    // 于是服务端会把正常登录用户误判成未登录并返回 401。这里用当前会话拉取文件流，
    // 再交给浏览器下载；小程序端继续走 downloadFile + openDocument。
    if (typeof window !== 'undefined' && window.open) {
      await downloadH5File(url)
      uni.showToast({ title: t('resource.downloadSuccess'), icon: 'success' })
      return
    }
    if (typeof uni.downloadFile !== 'function') throw new Error(t('resource.downloadFailed'))
    const stored = uni.getStorageSync('user')
    const token = typeof stored === 'string' ? JSON.parse(stored || '{}')?.token : stored?.token
    uni.downloadFile({
      url,
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (downloadResult) => {
        if (downloadResult.statusCode !== 200) {
          uni.showToast({ title: t('resource.downloadFailed'), icon: 'none' })
          return
        }
        if (typeof uni.openDocument === 'function') {
          uni.openDocument({ filePath: downloadResult.tempFilePath, showMenu: true })
        }
        uni.showToast({ title: t('resource.downloadSuccess'), icon: 'success' })
      },
      fail: () => uni.showToast({ title: t('resource.downloadFailed'), icon: 'none' })
    })
  } catch (error) {
    uni.showToast({ title: error?.message || t('resource.downloadFailed'), icon: 'none' })
  } finally {
    downloading.value = false
  }
}

async function downloadH5File(url) {
  const requestFile = () => {
    restoreStoredSession()
    const token = getStoredSession()?.token || userStore.token || ''
    const fetchFile = typeof window !== 'undefined' && typeof window.fetch === 'function'
      ? window.fetch.bind(window)
      : null
    if (!fetchFile) throw new Error(t('resource.downloadFailed'))
    return fetchFile(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
  }
  let response = await requestFile()
  // 文件流是页面自己 fetch 的，绕不过统一 request 封装；这里补上同样的 refresh token 轮换，
  // 避免旧 access token 直接落到 401，用户明明还在有效会话里却被迫重新登录。
  if (response.status === 401) {
    const refreshed = await userStore.refreshSession().catch(() => false)
    if (refreshed) response = await requestFile()
  }
  if (!response.ok) {
    const error = new Error(response.status === 401 ? '登录已过期，请重新登录' : `资料下载失败（${response.status}）`)
    error.statusCode = response.status
    throw error
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const suffix = String(resource.value?.file_type || 'html').replace(/[^a-z0-9]+/gi, '').toLowerCase() || 'html'
  anchor.href = objectUrl
  anchor.download = `${String(resource.value?.title || '媒合智联资料').replace(/[\\/:*?"<>|]/g, '_')}.${suffix}`
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

function download() {
  if (!resource.value) return

  if (!userStore.isLoggedIn && !hasStoredAccessToken()) {
    uni.showModal({
      title: '登录后下载',
      content: '登录后即可下载这份资料，并保留下载记录。',
      confirmText: '去登录',
      success: ({ confirm }) => {
        if (confirm) uni.navigateTo({ url: '/pages/user/login' })
      }
    })
    return
  }

  if (resource.value.can_download) {
    uni.showModal({
      title: t('resource.downloadConfirm'),
      content: t('resource.downloadContent').replace('{title}', resource.value.title),
      success: async (res) => {
        if (res.confirm) await completeDownload()
      }
    })
  } else {
    uni.showModal({
      title: t('resource.payTitle'),
      content: t('resource.payContent').replace('{price}', (resource.value.price/100).toFixed(0)),
      confirmText: t('mall.buyNow'),
      success: async (res) => {
        if (!res.confirm || purchasing.value) return
        purchasing.value = true
        try {
          const result = await bridge.resource.purchase(resourceId.value)
          if (result?.resource) Object.assign(resource.value, result.resource)
          if (result?.mode === 'wechat' && result?.payment) {
            if (typeof uni.requestPayment !== 'function') throw new Error('当前运行环境不支持微信支付，请在微信小程序中完成支付')
            uni.requestPayment({
              ...result.payment,
              success: async () => {
                await loadResource(resourceId.value)
                if (resource.value?.can_download) {
                  uni.showToast({ title: t('resource.purchaseSuccess'), icon: 'success' })
                  await completeDownload()
                } else {
                  uni.showToast({ title: '支付已提交，到账后即可下载', icon: 'none' })
                }
              },
              fail: (error) => uni.showToast({ title: error?.errMsg || '微信支付未完成', icon: 'none' })
            })
            return
          }
          if (result?.status === 'pending') {
            uni.showToast({ title: '订单已创建，请到订单中心完成支付', icon: 'none' })
            return
          }
          uni.showToast({ title: t('resource.purchaseSuccess'), icon: 'success' })
          await completeDownload()
        } catch (error) {
          uni.showToast({ title: error?.message || t('resource.downloadFailed'), icon: 'none' })
        } finally {
          purchasing.value = false
        }
      }
    })
  }
}

function goRelated(id) { uni.navigateTo({ url: `/pages/resource/detail?id=${id}` }) }
function fileLabel(type) { return String(type || 'FILE').toUpperCase().slice(0, 4) }
</script>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 160rpx; }

.info-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.info-title { font-size: 36rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.info-tags { display: flex; }
.tag { font-size: 22rpx; color: rgba(0,0,0,0.6); background: #F5F6FA; padding: 8rpx 16rpx; border-radius: 12rpx; }

.stats-card { display: flex; background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-val { font-size: 32rpx; font-weight: bold; color: #FF6B35; }
.stat-label { font-size: 22rpx; color: rgba(0,0,0,0.5); margin-top: 4rpx; }

.desc-card, .preview-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.content-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.card-label { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.desc-text { font-size: 28rpx; color: rgba(0,0,0,0.6); line-height: 1.7; }
.content-rich { display: block; color: rgba(0,0,0,0.68); font-size: 28rpx; line-height: 1.8; }

.preview-box { display: flex; align-items: center; padding: 24rpx; background: #F5F6FA; border-radius: 16rpx; }
.preview-icon { width: 48rpx; height: 48rpx; }
.preview-name { font-size: 24rpx; color: rgba(0,0,0,0.6); }

.download-tips { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.tips-title { font-size: 26rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 12rpx; }
.tips-item { font-size: 24rpx; color: rgba(0,0,0,0.5); line-height: 2; display: block; }
.related-card { background: #FFF; border-radius: 20rpx; padding: 24rpx; margin-bottom: 12rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }.related-head { display: flex; align-items: center; justify-content: space-between; }.related-head .card-label { margin-bottom: 0; }.related-count { color: #A0AABD; font-size: 20rpx; }.related-item { display: flex; align-items: center; padding: 18rpx 0 2rpx; border-top: 1rpx solid #F0F2F6; margin-top: 16rpx; }.related-file { display: flex; align-items: center; justify-content: center; width: 58rpx; height: 58rpx; border-radius: 16rpx; color: #6573DC; background: #EEF0FF; font-size: 16rpx; font-weight: 800; }.related-copy { flex: 1; min-width: 0; margin-left: 14rpx; }.related-title { display: block; overflow: hidden; color: rgba(0,0,0,.76); font-size: 24rpx; text-overflow: ellipsis; white-space: nowrap; }.related-meta { display: block; margin-top: 5rpx; color: #A0AABD; font-size: 19rpx; }.related-arrow { margin-left: 10rpx; color: #A0AABD; font-size: 34rpx; }

.action-bar { position: fixed; bottom: 0; left: 0; right: 0; display: flex; padding: 16rpx 24rpx; padding-bottom: calc(16rpx + env(safe-area-inset-bottom)); background: #FFFFFF; border-top: 1rpx solid rgba(0,0,0,0.06); box-shadow: 0 -4rpx 12rpx rgba(0,0,0,0.04); }
.collect-btn { padding: 20rpx 32rpx; background: #F5F6FA; border-radius: 24rpx; font-size: 28rpx; color: rgba(0,0,0,0.6); }
.download-btn { flex: 1; background: linear-gradient(135deg, #FF6B35, #FF9A5C); border-radius: 24rpx; text-align: center; padding: 20rpx; }
.download-btn text { font-size: 28rpx; color: #FFFFFF; font-weight: bold; }
.download-btn.free { background: linear-gradient(135deg, #10B981, #34D399); }
.detail-state { min-height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; color: rgba(0,0,0,0.5); font-size: 28rpx; }
.detail-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
/* Overflow guard: resource metadata, rich content and the download bar share the viewport safely. */
.detail-page,
.info-card,
.stats-card,
.desc-card,
.preview-card,
.content-card,
.download-tips,
.related-card,
.info-tags,
.preview-box,
.related-head,
.related-item,
.action-bar { width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; }
.detail-page { overflow-x: hidden; }
.info-title,
.desc-text,
.content-rich,
.preview-name,
.tips-item,
.related-title,
.related-meta { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.info-title,
.preview-name,
.related-title,
.related-meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.info-tags { flex-wrap: wrap; gap: 8rpx; }
.tag { flex: 0 0 auto; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stats-card { gap: 8rpx; }
.stat-item { min-width: 0; overflow: hidden; }
.preview-box { gap: 12rpx; }
.preview-icon,
.related-file,
.related-arrow { flex: 0 0 auto; }
.preview-name,
.related-copy { min-width: 0; flex: 1 1 auto; overflow: hidden; }
.related-arrow { white-space: nowrap; }
.action-bar { overflow-x: hidden; }
.collect-btn { flex: 0 0 auto; white-space: nowrap; }
.download-btn { min-width: 0; flex: 1 1 auto; overflow: hidden; white-space: nowrap; }
.download-btn text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.content-rich image { max-width: 100%; box-sizing: border-box; }

@media (max-width: 420px) {
  .detail-page { padding-right: 16rpx; padding-left: 16rpx; }
  .info-card,
  .desc-card,
  .preview-card,
  .content-card,
  .download-tips,
  .related-card { padding-right: 18rpx; padding-left: 18rpx; }
  .action-bar { padding-right: 16rpx; padding-left: 16rpx; }
  .collect-btn { padding-right: 20rpx; padding-left: 20rpx; }
}
</style>
