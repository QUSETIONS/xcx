<template>
  <text class="icon-emoji">{{ iconMap[name] || name }}</text>
</template>

<script setup>
const props = defineProps({
  name: { type: String, required: true }
})

const iconMap = {
  // Tab栏
  'home': '🏠',
  'home-active': '🏠',
  'list': '📋',
  'list-active': '📋',
  'community': '💬',
  'community-active': '💬',
  'mall': '🛒',
  'mall-active': '🛒',
  'user': '👤',
  'user-active': '👤',
  // 功能图标
  'search': '🔍',
  'bell': '🔔',
  'eye': '👁',
  'handshake': '🤝',
  'edit': '✏️',
  'heart': '❤️',
  'download': '⬇️',
  'settings': '⚙️',
  'help': '❓',
  'target': '🎯',
  'briefcase': '💼',
  'chat': '💬',
  'package': '📦',
  'shield': '🛡️',
  // 分类
  'cat_01': '📢',
  'cat_02': '📺',
  'cat_03': '🏠',
  'cat_04': '📱',
  'cat_05': '📚',
  'cat_06': '⚙️',
  'cat_07': '⭐',
  'cat_08': '🎬',
  'cat_09': '⏰',
  'cat_10': '👥',
  // 服务类型
  'member': '👑',
  'linker': '🔗',
  'survey': '📊',
  'resource_pack': '📦',
  'certification': '✅'
}
</script>

<style lang="scss" scoped>
.icon-emoji {
  font-size: inherit;
  line-height: 1;
}
</style>