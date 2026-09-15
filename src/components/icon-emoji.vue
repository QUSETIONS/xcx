<template>
  <image class="ui-icon" :src="iconMap[name] || '/static/icons/file.svg'" mode="aspectFit" />
</template>

<script setup>
const props = defineProps({
  name: { type: String, required: true }
})

const iconMap = {
  home: '/static/icons/tab/home.svg', 'home-active': '/static/icons/tab/home-active.svg',
  list: '/static/icons/tab/list.svg', 'list-active': '/static/icons/tab/list-active.svg',
  community: '/static/icons/tab/community.svg', 'community-active': '/static/icons/tab/community-active.svg',
  mall: '/static/icons/tab/mall.svg', 'mall-active': '/static/icons/tab/mall-active.svg',
  user: '/static/icons/tab/user.svg', 'user-active': '/static/icons/tab/user-active.svg',
  search: '/static/icons/search.svg', bell: '/static/icons/bell.svg', eye: '/static/icons/eye.svg',
  handshake: '/static/icons/handshake.svg', edit: '/static/icons/edit.svg', heart: '/static/icons/heart.svg',
  download: '/static/icons/file.svg', settings: '/static/icons/settings.svg', help: '/static/icons/alert.svg',
  target: '/static/icons/dashboard.svg', briefcase: '/static/icons/package.svg', chat: '/static/icons/chat.svg',
  package: '/static/icons/package.svg', shield: '/static/icons/shield.svg',
  cat_01: '/static/icons/cat/cat_01.svg', cat_02: '/static/icons/cat/cat_02.svg',
  cat_03: '/static/icons/cat/cat_03.svg', cat_04: '/static/icons/cat/cat_04.svg',
  cat_05: '/static/icons/cat/cat_05.svg', cat_06: '/static/icons/cat/cat_06.svg',
  cat_07: '/static/icons/cat/cat_07.svg', cat_08: '/static/icons/cat/cat_08.svg',
  cat_09: '/static/icons/cat/cat_09.svg', cat_10: '/static/icons/cat/cat_10.svg',
  cat_11: '/static/icons/cat/cat_11.svg', cat_12: '/static/icons/cat/cat_12.svg',
  cat_13: '/static/icons/cat/cat_13.svg', cat_14: '/static/icons/cat/cat_14.svg',
  cat_15: '/static/icons/cat/cat_15.svg', cat_16: '/static/icons/cat/cat_16.svg',
  cat_17: '/static/icons/cat/cat_17.svg',
  member: '/static/icons/service/member.svg', linker: '/static/icons/service/linker.svg',
  survey: '/static/icons/service/survey.svg', resource_pack: '/static/icons/service/resource_pack.svg',
  certification: '/static/icons/service/certification.svg'
}
</script>

<style lang="scss" scoped>
.ui-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  object-fit: contain;
}
</style>
