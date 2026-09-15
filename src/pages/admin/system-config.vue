<template>
  <view class="page">
    <view class="header">
      <view>
        <text class="title">{{ t('titles.systemConfig') }}</text>
        <text class="subtitle">统一维护站点展示信息、客服入口和业务开关</text>
      </view>
      <view class="status-dot"><text /> 已连接</view>
    </view>

    <view v-if="loading" class="loading-card">正在读取配置…</view>

    <view v-else class="form-wrap">
      <view class="section-card">
        <text class="section-title">站点信息</text>
        <text class="section-desc">这些内容会作为客户端和客服页面的统一基础信息。</text>
        <view class="field">
          <text class="field-label">站点名称</text>
          <input v-model="form.site_name" class="field-input" maxlength="40" placeholder="请输入站点名称" />
        </view>
        <view class="field">
          <text class="field-label">站点 slogan</text>
          <input v-model="form.site_slogan" class="field-input" maxlength="80" placeholder="请输入站点副标题" />
        </view>
        <view class="field-row">
          <view class="field half">
            <text class="field-label">默认地区</text>
            <input v-model="form.default_region" class="field-input" maxlength="20" placeholder="全国" />
          </view>
          <view class="field half">
            <text class="field-label">默认分页</text>
            <input v-model="form.default_page_size" class="field-input" type="number" maxlength="2" placeholder="10" />
          </view>
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">客服联系方式</text>
        <text class="section-desc">用于在线客服和问题反馈场景，修改后即时生效。</text>
        <view class="field">
          <text class="field-label">客服电话</text>
          <input v-model="form.contact_phone" class="field-input" type="tel" maxlength="30" placeholder="请输入客服电话" />
        </view>
        <view class="field">
          <text class="field-label">客服微信</text>
          <input v-model="form.service_wechat" class="field-input" maxlength="60" placeholder="请输入客服微信号" />
        </view>
      </view>

      <view class="section-card">
        <text class="section-title">业务开关</text>
        <text class="section-desc">开关会影响对应客户端行为，关闭发布或浏览前请确认运营安排。</text>
        <view class="switch-row">
          <view class="switch-copy"><text class="switch-label">维护模式</text><text class="switch-desc">标记系统正在维护中</text></view>
          <switch :checked="form.maintenance_mode" color="#FF6B35" @change="onSwitch('maintenance_mode', $event)" />
        </view>
        <view class="switch-row">
          <view class="switch-copy"><text class="switch-label">开放需求发布</text><text class="switch-desc">允许用户新建需求</text></view>
          <switch :checked="form.allow_publish" color="#FF6B35" @change="onSwitch('allow_publish', $event)" />
        </view>
        <view class="switch-row">
          <view class="switch-copy"><text class="switch-label">需求发布审核</text><text class="switch-desc">新需求先进入待审核状态</text></view>
          <switch :checked="form.require_demand_review" color="#FF6B35" @change="onSwitch('require_demand_review', $event)" />
        </view>
        <view class="switch-row no-border">
          <view class="switch-copy"><text class="switch-label">允许游客浏览</text><text class="switch-desc">关闭后需求大厅要求登录</text></view>
          <switch :checked="form.allow_guest_browse" color="#FF6B35" @change="onSwitch('allow_guest_browse', $event)" />
        </view>
      </view>

      <view class="save-bar">
        <text class="save-hint">配置保存后会写入真实后端数据库</text>
        <view class="save-btn" :class="{ disabled: saving }" @tap="save"><text>{{ saving ? '保存中…' : t('common.save') }}</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { t } from '@/i18n'

useNavTitle('titles.systemConfig')

const loading = ref(true)
const saving = ref(false)
const form = ref(defaultConfig())

onMounted(load)

async function load() {
  loading.value = true
  try {
    const config = await bridge.admin.system.get()
    form.value = { ...defaultConfig(), ...(config || {}) }
  } catch (error) {
    uni.showToast({ title: error?.message || '配置读取失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function onSwitch(key, event) {
  form.value[key] = !!event?.detail?.value
}

async function save() {
  if (saving.value) return
  if (!String(form.value.site_name || '').trim()) {
    uni.showToast({ title: '站点名称不能为空', icon: 'none' })
    return
  }
  saving.value = true
  try {
    const config = await bridge.admin.system.update({
      ...form.value,
      default_page_size: Number(form.value.default_page_size)
    })
    form.value = { ...defaultConfig(), ...(config || {}) }
    uni.showToast({ title: '配置已保存', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: error?.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function defaultConfig() {
  return {
    site_name: '媒合智联 MediaMatch',
    site_slogan: '找项目、找伙伴、找服务',
    contact_phone: '400-800-1234',
    service_wechat: 'mediamatch_service',
    default_region: '全国',
    default_page_size: 10,
    maintenance_mode: false,
    allow_publish: true,
    require_demand_review: true,
    allow_guest_browse: true
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 24rpx 120rpx; box-sizing: border-box; background: #F5F6FA; }
.header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22rpx; }
.title { display: block; color: rgba(0,0,0,.86); font-size: 38rpx; font-weight: 750; }
.subtitle { display: block; margin-top: 8rpx; color: rgba(0,0,0,.45); font-size: 22rpx; }
.status-dot { display: flex; align-items: center; gap: 8rpx; padding: 8rpx 12rpx; border-radius: 20rpx; color: #10B981; background: rgba(16,185,129,.1); font-size: 20rpx; }
.status-dot text { width: 10rpx; height: 10rpx; border-radius: 50%; background: #10B981; }
.loading-card, .section-card { border-radius: 20rpx; background: #FFFFFF; box-shadow: 0 2rpx 8rpx rgba(0,0,0,.04); }
.loading-card { padding: 50rpx 24rpx; color: rgba(0,0,0,.45); text-align: center; font-size: 26rpx; }
.section-card { margin-bottom: 18rpx; padding: 24rpx; }
.section-title { display: block; color: rgba(0,0,0,.86); font-size: 29rpx; font-weight: 700; }
.section-desc { display: block; margin-top: 7rpx; color: rgba(0,0,0,.43); font-size: 21rpx; line-height: 1.5; }
.field { margin-top: 22rpx; }
.field-row { display: flex; gap: 20rpx; }
.field.half { flex: 1; min-width: 0; }
.field-label { display: block; margin-bottom: 9rpx; color: rgba(0,0,0,.62); font-size: 23rpx; }
.field-input { width: 100%; padding: 16rpx; box-sizing: border-box; border: 1rpx solid #E9EBF0; border-radius: 12rpx; color: rgba(0,0,0,.82); background: #FAFBFC; font-size: 25rpx; }
.switch-row { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; padding: 20rpx 0; border-bottom: 1rpx solid #F1F2F5; }
.switch-row.no-border { border-bottom: 0; padding-bottom: 0; }
.switch-copy { flex: 1; min-width: 0; }
.switch-label, .switch-desc { display: block; }
.switch-label { color: rgba(0,0,0,.78); font-size: 25rpx; }
.switch-desc { margin-top: 5rpx; color: rgba(0,0,0,.4); font-size: 20rpx; }
.save-bar { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; margin-top: 24rpx; }
.save-hint { flex: 1; color: rgba(0,0,0,.4); font-size: 20rpx; line-height: 1.4; }
.save-btn { padding: 18rpx 32rpx; border-radius: 16rpx; color: #FFFFFF; background: linear-gradient(135deg, #FF6B35, #FF9A5C); font-size: 25rpx; font-weight: 700; }
.save-btn.disabled { opacity: .55; }

/* 配置页的状态、开关和保存条在小屏自动收缩，说明文字不会挤出卡片。 */
.page, .header, .header > view:first-child, .section-card, .field-row, .switch-row, .switch-copy, .save-bar { min-width: 0; }
.page { width: 100%; max-width: 100%; overflow-x: hidden; }
.header > view:first-child, .switch-copy { flex: 1; overflow: hidden; }
.title, .subtitle, .section-desc, .switch-desc, .save-hint { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.title, .subtitle { overflow: hidden; text-overflow: ellipsis; }
.title { white-space: nowrap; }
.status-dot, .save-btn { flex: 0 0 auto; white-space: nowrap; }
.save-bar { flex-wrap: wrap; }

@media (max-width: 420px) {
  .page { padding-right: 16rpx; padding-left: 16rpx; }
  .header { gap: 12rpx; }
  .subtitle { white-space: normal; }
  .save-hint { flex-basis: 100%; }
  .save-btn { width: 100%; box-sizing: border-box; text-align: center; }
}
</style>
