<template>
  <view class="list-page">
    <view class="item" v-for="item in list" :key="item._id" @tap="goDetail(item._id)">
      <text class="item-title">{{ item.title }}</text>
      <text class="item-meta">{{ item.status }} · {{ formatDate(item.created_at || item.publish_time) }}</text>
    </view>
    <view v-if="!list.length" class="empty"><text>暂无数据</text></view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { demandService, leadService, orderService, favoriteService } from '@/mock/service'

const list = ref([])
const type = ref('')

function formatDate(t) { if (!t) return ''; const d = new Date(t); return `${d.getMonth()+1}/${d.getDate()}` }
function goDetail(id) { uni.navigateTo({ url: `/pages/demand/detail?id=${id}` }) }

onLoad((q) => {
  type.value = q.type || 'demands'
  if (type.value === 'demands') {
    const res = demandService.myDemands()
    list.value = res.list.map(d => ({ ...d, status: '已发布' }))
  } else if (type.value === 'leads') {
    const res = leadService.myLeads()
    list.value = res.list.map(l => ({ _id: l._id, title: l.demand_title, status: '已对接', created_at: l.created_at }))
  } else if (type.value === 'orders') {
    const res = orderService.myOrders()
    list.value = res.list.map(o => ({ _id: o._id, title: o.items[0]?.title, status: '服务中', created_at: o.created_at }))
  } else if (type.value === 'favorites') {
    const res = favoriteService.list()
    list.value = res.list.map(f => ({ _id: f.targetId, title: '收藏项', status: '', created_at: '' }))
  }
})
</script>

<style lang="scss" scoped>
.list-page { min-height: 100vh; background: #f5f5f5; padding: 16rpx 24rpx; }
.item { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 12rpx; }
.item-title { font-size: 28rpx; color: #333; display: block; margin-bottom: 8rpx; }
.item-meta { font-size: 24rpx; color: #999; }
.empty { text-align: center; padding: 80rpx; color: #999; font-size: 28rpx; }
</style>