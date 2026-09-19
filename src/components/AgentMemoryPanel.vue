<template>
  <view class="memory-panel">
    <button class="memory-heading" @tap="open = !open">我的能力与偏好 <text>{{ open ? '收起' : '查看 / 修改' }}</text></button>
    <view v-if="open" class="memory-editor">
      <text class="memory-help">只供你的 AI 找单与项目问答使用，不自动发给甲方。明确介绍的能力和偏好会持续保存；错误或过时的内容可在这里修改。</text>
      <view v-if="error" class="memory-error"><text>{{ error }}</text><button @tap="load">重新读取</button></view>
      <template v-else-if="!loading">
        <text class="memory-label">能力、行业与案例（用户自述）</text>
        <textarea v-model="draft.profile_text" maxlength="3000" placeholder="例如：擅长品牌快闪和发布会，曾负责三场服装品牌线下活动。请粘贴案例文字，上传文件不代表已读取正文。" />
        <text class="memory-label">找单偏好与限制（后面的修改优先）</text>
        <textarea v-model="draft.preferences_text" maxlength="3000" placeholder="例如：只接上海或杭州，不接巡展，预算至少10万元。取消限制可写：城市不限、预算不限、可以接巡展。" />
        <text v-if="summary" class="memory-summary">已识别硬条件：{{ summary }}</text>
        <button class="memory-toggle" :disabled="busy" @tap="reload">重新读取已保存档案</button>
        <button class="memory-toggle" @tap="draft.auto_remember = !draft.auto_remember">{{ draft.auto_remember ? '✓' : '○' }} 自动记住我在找单对话中明确介绍的信息（保存后生效）</button>
        <text v-if="data.authorized_intake" class="memory-help">另已接入你授权 AI 匹配的入驻资料，包括业务介绍、案例及目标城市。授权可在入驻档案中撤回。</text>
        <text v-if="data.service_profile" class="memory-help">另已接入你的服务商档案；资料有变化请同步更新。</text>
        <view class="memory-actions"><button :disabled="busy" @tap="save">{{ busy ? '保存中…' : '保存能力与偏好' }}</button><button :disabled="busy" @tap="forget">清空并停止记忆</button><button @tap="goIntake">查看入驻授权</button></view>
      </template>
      <text v-else>正在读取能力档案…</text>
    </view>
  </view>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { bridge } from '@/api/bridge'
import { updateConstraints } from '../../../Package/AgentProfile/constraints.mjs'
const open = ref(false), loading = ref(false), busy = ref(false), error = ref(''), data = ref({})
const draft = ref({ profile_text: '', preferences_text: '', auto_remember: true, version: 0 })
const summary = computed(() => {
  const c = updateConstraints({}, draft.value.preferences_text)
  return [c.allowed_regions.length ? `仅限${c.allowed_regions.join('、')}` : '', c.excluded_regions.length ? `不去${c.excluded_regions.join('、')}` : '', c.excluded.length ? `不接${c.excluded.join('、')}` : '', c.strict_budget ? `预算${c.budget_min / 100}元起${c.budget_max ? '，最高'+c.budget_max/100+'元' : ''}` : '', c.unresolved.length ? `待确认：${c.unresolved.join('；')}` : ''].filter(Boolean).join('；')
})
async function load() {
  loading.value = true; error.value = ''
  try {
    const result = await bridge.agent.providerProfile()
    if (!result) throw new Error('能力档案暂时不可用')
    data.value = result
    draft.value = { profile_text: result.profile_text || '', preferences_text: result.preferences_text || '', auto_remember: result.auto_remember !== false, version: result.version || 0 }
  } catch { error.value = '能力档案读取失败，请重试；不会用空内容覆盖已保存的信息。' }
  finally { loading.value = false }
}
async function save() {
  if (busy.value || loading.value || error.value) return
  busy.value = true
  try {
    const result = await bridge.agent.saveProviderProfile({ ...draft.value })
    data.value = result; draft.value.version = result.version
    uni.showToast({ title: '已保存，下次对话即使用新档案', icon: 'none' })
  } catch (e) { uni.showToast({ title: e?.message || '保存失败，请稍后重试', icon: 'none' }) }
  finally { busy.value = false }
}
function forget() {
  uni.showModal({ title: '清空专属记忆？', content: '将清空这里的能力和偏好并停止自动记录；聊天历史不删除。已授权的入驻资料需在入驻档案另行撤回。', success: async result => {
    if (!result.confirm) return
    draft.value = { ...draft.value, profile_text: '', preferences_text: '', auto_remember: false }
    await save()
  } })
}
function goIntake() { uni.navigateTo({ url: '/pages/intake/index' }) }
function reload() { uni.showModal({ title: '重新读取档案？', content: '将替换本页尚未保存的编辑。', success: result => { if (result.confirm) load() } }) }
defineExpose({ refresh: () => { if (!open.value) return load() } })
onMounted(load)
</script>
<style scoped>
.memory-panel { flex-shrink: 0; width: 100%; box-sizing: border-box; padding: 8px 16px; background: #fbfaf7; border-bottom: 1px solid #ded7ce; color: #39332c; }
.memory-heading { display: flex; align-items: center; justify-content: space-between; margin: 0; padding: 8px 0; background: transparent; font-size: 15px; line-height: 1.5; color: #5c2828; }
.memory-heading text { font-size: 13px; }
.memory-editor { max-height: 48vh; overflow-y: auto; padding-bottom: 12px; }
.memory-label,.memory-help,.memory-summary { display: block; margin: 10px 0; font-size: 13px; line-height: 1.7; }
.memory-label { font-size: 15px; font-weight: 600; }
.memory-editor textarea { box-sizing: border-box; width: 100%; height: 100px; background: white; border: 1px solid #b7aaa0; padding: 10px; font-size: 14px; line-height: 1.6; }
.memory-toggle { background: transparent; padding: 8px 0; margin: 0; font-size: 13px; color: #5c2828; text-align: left; line-height: 1.7; }
.memory-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.memory-actions button,.memory-error button { background: #5c2828; color: white; margin: 0; padding: 8px 12px; font-size: 13px; line-height: 1.8; }
.memory-actions button:not(:first-child) { background: #ede6dd; color: #493e35; }
.memory-panel button::after { border: 0; }
</style>
