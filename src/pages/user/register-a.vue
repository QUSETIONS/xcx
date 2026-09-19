<template><AuthForm fixed-party="capital" :invite-code="inviteCode" /></template>
<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import AuthForm from '@/components/AccountAuth.vue'
const inviteCode = ref('')
onLoad((query) => { inviteCode.value = String(query?.invite_code || query?.inviteCode || '') })
</script>
