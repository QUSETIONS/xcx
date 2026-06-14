<template>
  <view class="page">
    <view class="page-header"><text class="page-title">我的对接</text></view>
    <view class="list">
      <view class="item glass-card" v-for="item in list" :key="item._id">
        <text class="item-title">{{ item.demand_title }}</text>
        <view class="item-meta"><text class="item-status">{{ item.status }}</text><text class="item-contact">{{ item.contact_name }}</text></view>
      </view>
      <view v-if="!list.length" class="empty"><text>暂无对接</text></view>
    </view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { leadService } from '@/mock/service'
const list = ref(leadService.myLeads().list)
</script>
<style lang="scss" scoped>
.page { min-height: 100vh; background: $bg-primary; padding: $space-4; }
.page-header { margin-bottom: $space-4; }
.page-title { font-size: $font-lg; font-weight: $weight-bold; color: $text-primary; }
.list { display: flex; flex-direction: column; gap: $space-3; }
.item { padding: $space-4; }
.item-title { font-size: $font-base; font-weight: $weight-semibold; color: $text-primary; display: block; margin-bottom: $space-2; }
.item-meta { display: flex; justify-content: space-between; }
.item-status { font-size: $font-xs; color: $color-primary; }
.item-contact { font-size: $font-xs; color: $text-tertiary; }
.empty { text-align: center; padding: $space-10; color: $text-tertiary; }
</style>