<template>
  <view v-if="loadState === 'loading'" class="page-state">
    <text>{{ t('common.loading') }}</text>
  </view>
  <view v-else-if="loadState === 'error'" class="page-state error-state" @tap="reload">
    <image class="page-state-icon" src="/static/icons/alert.svg" mode="aspectFit" />
    <text>{{ t('common.loadFailed') }}</text>
    <text class="page-state-action">{{ t('common.retry') }}</text>
  </view>
  <view v-else class="page">
    <view class="header"><text class="header-title">{{ t('user.admin') }}</text></view>

    <view class="menu-grid" :class="{ 'animate-in': animated }">
      <view class="menu-item card-press" v-for="(item, idx) in menuItems" :key="item.path" @tap="goPage(item.path)"
        :class="{ 'fade-in': animated }" :style="{ animationDelay: (idx * 0.08) + 's' }">
        <view class="menu-icon-box" :class="'menu-color-' + idx">
          <image class="menu-icon" :src="item.icon" mode="aspectFit"/>
        </view>
        <text class="menu-label">{{ item.label }}</text>
        <text class="menu-count">{{ item.count }}</text>
      </view>
    </view>

    <view class="stats-card" :class="{ 'fade-in': animated }">
      <text class="stats-title">{{ t('admin.todayStats') }}</text>
      <view class="stats-row">
        <view class="stats-item"><text class="stats-num">{{ todayDemands }}</text><text class="stats-label">{{ t('admin.newDemand') }}</text></view>
        <view class="stats-item"><text class="stats-num">{{ todayLeads }}</text><text class="stats-label">{{ t('admin.newLead') }}</text></view>
        <view class="stats-item"><text class="stats-num">{{ todayOrders }}</text><text class="stats-label">{{ t('admin.newOrder') }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'
import { useRequest } from '@/hooks/useRequest'
import { toastError } from '@/utils/feedback'
useNavTitle('titles.admin')

const animated = ref(true)
const todayDemands = ref(0)
const todayLeads = ref(0)
const todayOrders = ref(0)

const menuItems = ref([
  { label: t('titles.demandManage'), path: '/pages/admin/demand-manage', icon: '/static/icons/tab/list.svg', count: 0, permission: 'admin.demands.read' },
  { label: t('titles.leadManage'), path: '/pages/admin/lead-manage', icon: '/static/icons/handshake.svg', count: 0, permission: 'admin.leads.read' },
  { label: t('titles.orderManage'), path: '/pages/admin/order-manage', icon: '/static/icons/tab/mall.svg', count: 0, permission: 'admin.orders.read' },
  { label: t('titles.productManage'), path: '/pages/admin/product-manage', icon: '/static/icons/package.svg', count: 0, permission: 'admin.catalog.read' },
  { label: t('titles.resourceManage'), path: '/pages/admin/resource-manage', icon: '/static/icons/file.svg', count: 0, permission: 'admin.catalog.read' },
  { label: t('titles.categoryManage'), path: '/pages/admin/category-manage', icon: '/static/icons/tab/list.svg', count: 0, permission: 'admin.catalog.read' },
  { label: t('titles.bannerManage'), path: '/pages/admin/banner-manage', icon: '/static/icons/star.svg', count: 0, permission: 'admin.catalog.read' },
  { label: t('titles.campaignManage'), path: '/pages/admin/campaign-manage', icon: '/static/icons/dashboard.svg', count: 0, permission: 'admin.catalog.read' },
  { label: t('titles.newsManage'), path: '/pages/admin/news-manage', icon: '/static/icons/file.svg', count: 0, permission: 'admin.catalog.read' },
  { label: t('titles.userManage'), path: '/pages/admin/user-manage', icon: '/static/icons/user.svg', count: 0, permission: 'admin.users.read' },
  { label: '服务方审核', path: '/pages/admin/provider-manage', icon: '/static/icons/handshake.svg', count: 0, permission: 'admin.providers.read' },
  { label: '内测资料审核', path: '/pages/admin/intake-manage', icon: '/static/icons/file.svg', count: 0, permission: 'admin.intakes.read' },
  { label: '举报处理', path: '/pages/admin/report-manage', icon: '/static/icons/shield.svg', count: '安全', permission: 'admin.reports.read' },
  { label: '申诉复核', path: '/pages/admin/appeal-manage', icon: '/static/icons/shield.svg', count: '安全', permission: 'admin.reports.read' },
  { label: '运营指标', path: '/pages/admin/screen', icon: '/static/icons/dashboard.svg', count: '7天', permission: 'admin.metrics.read' },
  { label: t('titles.systemConfig'), path: '/pages/admin/system-config', icon: '/static/icons/settings.svg', count: 'P2', permission: 'admin.system.read' }
])

const { state: loadState, run: loadRequest } = useRequest(async () => {
  const access = await bridge.admin.access()
  const permissions = access?.permissions || ['*']
  const can = (permission) => permissions.includes('*') || permissions.includes(permission)
  const [demands, leads, orders, products, resources, categories, banners, campaigns, news, users, providers, intakes] = await Promise.all([
    // 首页只展示各模块数量，不需要把整页业务记录一起拉下来。
    can('admin.demands.read') ? bridge.admin.demands.list({ page: 1, pageSize: 1 }) : Promise.resolve({ total: 0 }),
    can('admin.leads.read') ? bridge.admin.leads.list({ page: 1, pageSize: 1 }) : Promise.resolve({ total: 0 }),
    can('admin.orders.read') ? bridge.admin.orders.list({ page: 1, pageSize: 1 }) : Promise.resolve({ total: 0 }),
    can('admin.catalog.read') ? bridge.admin.products.list({ page: 1, pageSize: 1 }) : Promise.resolve({ total: 0 }),
    can('admin.catalog.read') ? bridge.admin.resources.list({ page: 1, pageSize: 1 }) : Promise.resolve({ total: 0 }),
    can('admin.catalog.read') ? bridge.admin.categories.list({}) : Promise.resolve([]),
    can('admin.catalog.read') ? bridge.admin.banners.list() : Promise.resolve([]),
    can('admin.catalog.read') ? bridge.admin.campaigns.list() : Promise.resolve([]),
    can('admin.catalog.read') ? bridge.admin.news.list() : Promise.resolve([]),
    can('admin.users.read') ? bridge.admin.users.list({ page: 1, pageSize: 1 }) : Promise.resolve({ total: 0 }),
    can('admin.providers.read') ? bridge.admin.providers.list({ status: 'pending', page: 1, pageSize: 1 }) : Promise.resolve({ total: 0 }),
    can('admin.intakes.read') ? bridge.admin.intakes.list({ status: 'submitted', page: 1, pageSize: 1 }) : Promise.resolve({ total: 0 })
  ])
  return { demands, leads, orders, products, resources, categories, banners, campaigns, news, users, providers, intakes, permissions }
})

async function reload() {
  try {
    const data = await loadRequest()
    const countByPath = {
      '/pages/admin/demand-manage': data.demands?.total || 0,
      '/pages/admin/lead-manage': data.leads?.total || 0,
      '/pages/admin/order-manage': data.orders?.total || 0,
      '/pages/admin/product-manage': data.products?.total || 0,
      '/pages/admin/resource-manage': data.resources?.total || 0,
      '/pages/admin/category-manage': data.categories?.length || 0,
      '/pages/admin/banner-manage': data.banners?.length || 0,
      '/pages/admin/campaign-manage': data.campaigns?.length || 0,
      '/pages/admin/news-manage': data.news?.length || 0,
      '/pages/admin/user-manage': data.users?.total || 0,
      '/pages/admin/provider-manage': data.providers?.total || 0,
      '/pages/admin/intake-manage': data.intakes?.total || 0
    }
    menuItems.value = menuItems.value.map((item) => countByPath[item.path] === undefined
      ? item
      : { ...item, count: countByPath[item.path] })
    const permissions = data.permissions || ['*']
    menuItems.value = menuItems.value.filter((item) => permissions.includes('*') || permissions.includes(item.permission))
    todayDemands.value = Number(menuItems.value.find((item) => item.path === '/pages/admin/demand-manage')?.count || 0)
    todayLeads.value = Number(menuItems.value.find((item) => item.path === '/pages/admin/lead-manage')?.count || 0)
    todayOrders.value = Number(menuItems.value.find((item) => item.path === '/pages/admin/order-manage')?.count || 0)
  } catch {
    toastError(t('common.loadFailed'))
  }
}

onMounted(reload)

function goPage(url) { uni.navigateTo({ url }) }
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #F5F6FA; padding: 24rpx; padding-bottom: 120rpx; }
.page-state { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16rpx; color: rgba(0,0,0,0.5); }
.page-state-icon { width: 72rpx; height: 72rpx; }
.error-state { color: #FF6B35; }
.page-state-action { font-size: 24rpx; color: rgba(0,0,0,0.45); }
.header { margin-bottom: 24rpx; }
.header-title { font-size: 40rpx; font-weight: bold; color: rgba(0,0,0,0.85); }

.menu-grid { display: flex; flex-wrap: wrap; margin-bottom: 24rpx; opacity: 0; }
.animate-in { opacity: 1; transition: opacity 0.5s ease-out; }
.menu-item { width: calc(50% - 8rpx); background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; display: flex; flex-direction: column; align-items: center; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.fade-in { opacity: 1; animation: fadeInUp 0.4s ease-out both; }
.menu-icon-box { width: 64rpx; height: 64rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; margin-bottom: 12rpx; }
.menu-color-0 { background: rgba(255,107,53,0.1); }
.menu-color-1 { background: rgba(99,102,241,0.1); }
.menu-color-2 { background: rgba(16,185,129,0.1); }
.menu-color-3 { background: rgba(236,72,153,0.1); }
.menu-icon { width: 32rpx; height: 32rpx; }
.menu-label { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); margin-bottom: 8rpx; }
.menu-count { font-size: 24rpx; color: #FF6B35; }

.stats-card { background: #FFFFFF; border-radius: 20rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); opacity: 0; }
.stats-title { font-size: 28rpx; font-weight: bold; color: rgba(0,0,0,0.85); display: block; margin-bottom: 16rpx; }
.stats-row { display: flex; justify-content: space-around; }
.stats-item { display: flex; flex-direction: column; align-items: center; }
.stats-num { font-size: 36rpx; font-weight: bold; color: #FF6B35; }
.stats-label { font-size: 22rpx; color: rgba(0,0,0,0.5); margin-top: 4rpx; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(20rpx); } to { opacity: 1; transform: translateY(0); } }
/* Overflow guard: menu labels and metric values must remain inside their grid cells. */
.page,
.header,
.menu-grid,
.menu-item,
.stats-card,
.stats-row,
.stats-item { max-width: 100%; min-width: 0; box-sizing: border-box; }
.page { width: 100%; overflow-x: hidden; }
.menu-grid { width: 100%; }
.menu-item { width: calc(50% - 8rpx); }
.menu-label,
.menu-count,
.stats-title,
.stats-label,
.stats-num { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.menu-label,
.menu-count,
.stats-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.menu-item,
.stats-item { flex-shrink: 1; }
.stats-row { display: flex; }
.stats-item { flex: 1 1 0; overflow: hidden; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .menu-item { width: calc(50% - 4rpx); padding-right: 16rpx; padding-left: 16rpx; }
  .menu-label { font-size: 25rpx; }
}
</style>
