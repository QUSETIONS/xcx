<template>
  <view class="page">
    <view class="page-header"><text class="page-title">我的收藏</text></view>
    <view class="list">
      <view class="item glass-card" v-for="item in list" :key="item.targetId">
        <text class="item-title">{{ item.targetId }}</text>
      </view>
      <view v-if="!list.length" class="empty"><text>暂无收藏</text></view>
    </view>
  </view>
</template>
<script setup>
import { ref } from 'vue'
import { favoriteService } from '@/mock/service'
const list = ref(favoriteService.list().list)
</script>
<style lang="scss" scoped>
.page { min-height: 100vh; background: $bg-primary; padding: $space-4; }
.page-header { margin-bottom: $space-4; }
.page-title { font-size: $font-lg; font-weight: $weight-bold; color: $text-primary; }
.list { display: flex; flex-direction: column; gap: $space-3; }
.item { padding: $space-4; }
.item-title { font-size: $font-base; color: $text-primary; }
.empty { text-align: center; padding: $space-10; color: $text-tertiary; }
</style>