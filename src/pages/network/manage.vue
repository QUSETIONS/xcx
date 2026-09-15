<template>
  <view class="page" :style="a11yStyle">
    <view v-if="loading" class="state">正在打开社群运营台…</view>
    <view v-else-if="!group" class="state" @tap="load"
      >社群暂时不可用，点击重试</view
    >
    <view v-else>
      <view class="topbar"
        ><view
          ><text class="eyebrow">COMMUNITY OPS</text
          ><text class="title">社群运营台</text
          ><text class="subtitle"
            >{{ group.name }} · 把日常运营做成可持续的关系。</text
          ></view
        ><view class="chat-link" @tap="openChat"><text>群聊</text></view></view
      >

      <view class="section-card"
        ><view class="section-head"
          ><view
            ><text class="section-title">基本资料</text
            ><text class="section-desc"
              >让新成员一眼知道这里适不适合他。</text
            ></view
          ><text class="status">{{
            group.join_mode === "approval" ? "审核加入" : "直接加入"
          }}</text></view
        ><view class="field"
          ><text class="label">社群名称</text
          ><input v-model="form.name" class="input" maxlength="60" /></view
        ><view class="field"
          ><text class="label">社群介绍</text
          ><textarea
            v-model="form.description"
            class="textarea"
            maxlength="500"
            auto-height
          /></view
        ><view class="field-row"
          ><view class="field half"
            ><text class="label">城市</text
            ><input v-model="form.city" class="input" maxlength="30" /></view
          ><view class="field half"
            ><text class="label">方向</text
            ><input
              v-model="form.industry"
              class="input"
              maxlength="40" /></view></view
        ><view class="field"
          ><text class="label">入群方式</text
          ><view class="chip-row"
            ><text
              class="chip"
              :class="{ active: form.join_mode === 'open' }"
              @tap="form.join_mode = 'open'"
              >直接加入</text
            ><text
              class="chip"
              :class="{ active: form.join_mode === 'approval' }"
              @tap="form.join_mode = 'approval'"
              >审核加入</text
            ></view
          ></view
        ><view class="save" :class="{ disabled: saving }" @tap="saveGroup"><text>{{
          saving ? "保存中…" : "保存资料"
        }}</text></view></view
      >

      <view class="section-card"
        ><view class="section-head"
          ><view
            ><text class="section-title">分会网络</text
            ><text class="section-desc"
              >按城市或主题拆出更近的交流场。</text
            ></view
          ><text class="status">{{ branches.length }} 个</text></view
        ><view v-if="branches.length" class="branch-list"
          ><view v-for="branch in branches" :key="branch.id" class="branch-item"
            ><view class="branch-mark">＋</view
            ><view class="branch-copy"
              ><text class="branch-name">{{ branch.name }}</text
              ><text class="branch-meta"
                >{{ branch.city || "线上" }} ·
                {{ branch.member_count || 0 }} 位成员</text
              ><text v-if="branch.intro" class="branch-intro">{{
                branch.intro
              }}</text></view
            ><view class="branch-actions"
              ><text @tap="editBranch(branch)">编辑</text
              ><text class="danger" @tap="removeBranch(branch)"
                >删除</text
              ></view
            ></view
          ></view
        ><view v-else class="empty-line"
          >还没有分会，先创建一个城市或主题分会。</view
        ><view class="branch-form"
          ><text class="form-caption">{{
            editingBranchId ? "编辑分会" : "新增分会"
          }}</text
          ><input
            v-model="branchForm.name"
            class="input"
            maxlength="60"
            placeholder="分会名称"
            placeholder-class="placeholder"
          /><view class="field-row"
            ><input
              v-model="branchForm.city"
              class="input half-input"
              maxlength="30"
              placeholder="城市 / 线上"
              placeholder-class="placeholder" /><input
              v-model="branchForm.intro"
              class="input half-input"
              maxlength="300"
              placeholder="一句话介绍"
              placeholder-class="placeholder" /></view
          ><view class="form-actions"
            ><text v-if="editingBranchId" class="cancel" @tap="resetBranch"
              >取消编辑</text
            ><view
              class="save small"
              :class="{ disabled: branchSaving || !branchForm.name.trim() }"
              @tap="saveBranch"
              ><text>{{
                branchSaving
                  ? "保存中…"
                  : editingBranchId
                    ? "保存分会"
                    : "创建分会"
              }}</text></view
            ></view
          ></view
        ></view
      >

      <view class="section-card"
        ><view class="section-head"
          ><view
            ><text class="section-title">社群活动</text
            ><text class="section-desc"
              >把线上的认识，落到一次具体见面或共创。</text
            ></view
          ><text class="status">{{ events.length }} 场</text></view
        ><view v-if="events.length" class="event-list"
          ><view
            v-for="event in events"
            :key="event.id || event._id"
            class="event-wrap"
            ><view class="event-item"
              ><view class="event-copy"
                ><text class="event-name">{{ event.title }}</text
                ><text class="event-meta"
                  >{{ eventTime(event.starts_at) }} ·
                  {{ event.location || "线上" }}</text
                ><text class="event-meta"
                  >{{ event.signup_count || 0 }} 人报名<text
                    v-if="event.capacity"
                  >
                    / {{ event.capacity }} 个名额</text
                  ><text v-if="event.checkin_count">
                    · 已签到 {{ event.checkin_count }} 人</text
                  ></text
                ><text v-if="event.recap" class="event-recap"
                  >已有复盘 · {{ event.recap }}</text
                ></view
              ><view class="event-actions"
                ><text @tap="editEvent(event)">编辑</text
                ><text @tap="showEventSignups(event)">报名名单</text
                ><text @tap="toggleCheckins(event)">{{
                  checkinEventId === (event.id || event._id)
                    ? "收起签到"
                    : "签到管理"
                }}</text
                ><text
                  v-if="event.status === 'finished'"
                  @tap="editRecap(event)"
                  >{{
                    recapEventId === (event.id || event._id)
                      ? "收起复盘"
                      : "写复盘"
                  }}</text
                ><text
                  v-if="event.status === 'upcoming'"
                  class="danger"
                  @tap="finishEvent(event)"
                  >结束</text
                ></view
              ></view
            ><view
              v-if="checkinEventId === (event.id || event._id)"
              class="checkin-panel"
              ><view class="panel-caption"
                ><text>签到名单</text
                ><text
                  >{{ checkinRows.filter((item) => item.checked_in).length }} /
                  {{ checkinRows.length }} 人已签到</text
                ></view
              ><view v-if="checkinLoading" class="empty-line"
                >正在加载报名成员…</view
              ><view v-else-if="!checkinRows.length" class="empty-line"
                >还没有报名成员，暂时不能签到。</view
              ><view v-else class="checkin-list"
                ><view
                  v-for="row in checkinRows"
                  :key="row.user_id"
                  class="checkin-row"
                  ><view class="checkin-copy"
                    ><text class="app-name">{{ row.nickname }}</text
                    ><text class="app-meta">{{
                      row.company || row.title || "社群成员"
                    }}</text></view
                  ><text
                    class="checkin-action"
                    :class="{ checked: row.checked_in }"
                    @tap="toggleCheckin(event, row)"
                    >{{ row.checked_in ? "已签到" : "签到" }}</text
                  ></view
                ></view
              ></view
            ><view
              v-if="recapEventId === (event.id || event._id)"
              class="recap-panel"
              ><text class="panel-caption">活动复盘</text
              ><textarea
                v-model="recapDraft"
                class="textarea"
                maxlength="1000"
                auto-height
                placeholder="记录现场发生了什么、哪些做法值得保留、下次准备怎么调整"
                placeholder-class="placeholder"
              /><view class="form-actions"
                ><text class="cancel" @tap="resetRecap">取消</text
                ><view
                  class="save small"
                  :class="{ disabled: recapSaving || !recapDraft.trim() }"
                  @tap="saveRecap(event)"
                  ><text>{{ recapSaving ? "保存中…" : "发布复盘" }}</text></view
                ></view
              ></view
            ></view
          ></view
        ><view v-else class="empty-line"
          >还没有活动，先发一场小范围的交流。</view
        ><view class="event-form"
          ><text class="form-caption">{{
            editingEventId ? "编辑活动" : "发布活动"
          }}</text
          ><input
            v-model="eventForm.title"
            class="input"
            maxlength="80"
            placeholder="活动标题"
            placeholder-class="placeholder"
          /><textarea
            v-model="eventForm.intro"
            class="textarea event-intro-input"
            maxlength="500"
            auto-height
            placeholder="活动介绍：聊什么、适合谁参加"
            placeholder-class="placeholder"
          /><view class="field-row"
            ><input
              v-model="eventForm.starts_at"
              class="input half-input"
              maxlength="30"
              placeholder="开始时间，如 2026-08-01 19:00"
              placeholder-class="placeholder" /><input
              v-model="eventForm.location"
              class="input half-input"
              maxlength="120"
              placeholder="地点 / 会议链接说明"
              placeholder-class="placeholder" /></view
          ><input
            v-model="eventForm.capacity"
            class="input half-input"
            type="number"
            maxlength="6"
            placeholder="人数上限，0 表示不限"
            placeholder-class="placeholder"
          /><view class="form-actions"
            ><text v-if="editingEventId" class="cancel" @tap="resetEvent"
              >取消编辑</text
            ><view
              class="save small"
              :class="{
                disabled:
                  eventSaving ||
                  !eventForm.title.trim() ||
                  !eventForm.starts_at.trim(),
              }"
              @tap="saveEvent"
              ><text>{{
                eventSaving
                  ? "保存中…"
                  : editingEventId
                    ? "保存活动"
                    : "发布活动"
              }}</text></view
            ></view
          ></view
        ></view
      >

      <view class="section-card"
        ><view class="section-head"
          ><view
            ><text class="section-title">入群申请</text
            ><text class="section-desc"
              >先了解对方想在这里获得什么，再决定是否通过。</text
            ></view
          ><text class="status accent"
            >{{ applications.length }} 条待处理</text
          ></view
        ><view v-if="!applications.length" class="empty-line"
          >目前没有待处理申请。</view
        ><view v-else class="application-list"
          ><view
            v-for="item in applications"
            :key="item.member_id || item.id"
            class="application"
            ><view class="avatar"
              ><text>{{ initial(item) }}</text></view
            ><view class="application-copy"
              ><text class="app-name">{{ item.nickname }}</text
              ><text class="app-meta">{{
                item.company || item.title || "媒合智联成员"
              }}</text
              ><text class="app-intent"
                >想加入：{{ item.join_intent || "认识同行" }}</text
              ></view
            ><view class="app-actions"
              ><text class="reject" @tap="review(item, 'left')">暂不通过</text
              ><text class="approve" @tap="review(item, 'active')"
                >通过</text
              ></view
            ></view
          ></view
        ></view
      >

      <view class="section-card compact"
        ><view class="section-head"
          ><view
            ><text class="section-title">当前成员</text
            ><text class="section-desc"
              >成员角色可以在社群详情的成员管理里调整。</text
            ></view
          ><text class="status">{{ members.length }} 人可见</text></view
        ><view class="member-summary"
          ><text
            >社群总成员
            {{
              group.active_member_count ??
              group.member_count ??
              group.memberCount ??
              0
            }}
            人</text
          ><text
            >动态
            {{ group.activity_count ?? group.activityCount ?? 0 }} 条</text
          ><text @tap="openDetail">查看社群 →</text></view
        ></view
      >

      <view
        v-if="group.can_transfer || group.can_dissolve"
        class="section-card lifecycle-card"
      >
        <view class="section-head"
          ><view
            ><text class="section-title">社群生命周期</text
            ><text class="section-desc"
              >重要操作会留下审计记录，也会通知相关成员。</text
            ></view
          ><text class="status accent">群主权限</text></view
        >
        <view v-if="group.can_transfer" class="lifecycle-block">
          <text class="form-caption">把群主交给一位现有成员</text>
          <text class="lifecycle-hint"
            >交接后你会自动保留管理员身份，社群资料和历史内容不会丢失。</text
          >
          <view v-if="transferCandidates.length" class="transfer-list">
            <view
              v-for="member in transferCandidates"
              :key="member.id"
              class="transfer-item"
            >
              <view class="avatar transfer-avatar"
                ><text>{{ initial(member) }}</text></view
              >
              <view class="application-copy"
                ><text class="app-name">{{ member.nickname }}</text
                ><text class="app-meta"
                  >{{ member.company || member.title || "社群成员" }} ·
                  {{ member.role === "admin" ? "管理员" : "成员" }}</text
                ></view
              >
              <text class="transfer-action" @tap="transferOwnership(member)">{{
                transferringUserId === member.id ? "交接中…" : "交给他"
              }}</text>
            </view>
          </view>
          <view v-else class="empty-line"
            >至少还需要一位活跃成员，才能完成群主交接。</view
          >
        </view>
        <view v-if="group.can_dissolve" class="danger-zone">
          <view
            ><text class="danger-title">解散社群</text
            ><text class="danger-desc"
              >解散后社群将从公开列表移除，成员、动态和活动历史保留为不可继续操作的记录。</text
            ></view
          >
          <text class="dissolve-action" @tap="dissolveGroup">{{
            dissolving ? "处理中…" : "解散社群"
          }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { bridge } from "@/api/bridge";
import { a11yStyle } from "@/utils/accessibility";
import { toastError } from "@/utils/feedback";
import { useUserStore } from "@/stores/user";
import { requirePageLogin } from "@/utils/require-login";

const userStore = useUserStore();

const groupId = ref("");
const group = ref(null);
const members = ref([]);
const applications = ref([]);
const branches = ref([]);
const events = ref([]);
const loading = ref(true);
const saving = ref(false);
const branchSaving = ref(false);
const eventSaving = ref(false);
const checkinEventId = ref("");
const checkinRows = ref([]);
const checkinLoading = ref(false);
const recapEventId = ref("");
const recapDraft = ref("");
const recapSaving = ref(false);
const transferringUserId = ref("");
const dissolving = ref(false);
const editingBranchId = ref("");
const editingEventId = ref("");
const form = reactive({
  name: "",
  description: "",
  city: "",
  industry: "",
  join_mode: "open",
});
const branchForm = reactive({ name: "", city: "", intro: "" });
const eventForm = reactive({
  title: "",
  intro: "",
  starts_at: "",
  location: "",
  capacity: 0,
});
const transferCandidates = computed(() =>
  members.value.filter(
    (member) => member?.status !== "left" && member.role !== "owner",
  ),
);

async function load() {
  if (!(await requirePageLogin(userStore, "登录后才能打开社群管理"))) return;
  if (!groupId.value) return;
  loading.value = true;
  try {
    const [detail, manage, appResult, eventResult] = await Promise.all([
      bridge.network.groupDetail(groupId.value),
      bridge.network.manageGroup(groupId.value),
      bridge.network.applications(groupId.value),
      bridge.network.events(groupId.value),
    ]);
    group.value = detail;
    form.name = detail?.name || "";
    form.description = detail?.description || "";
    form.city = detail?.city || "";
    form.industry = detail?.industry || "";
    form.join_mode = detail?.join_mode || "open";
    branches.value = detail?.branches || [];
    events.value = eventResult?.list || detail?.events || [];
    members.value = manage?.members || [];
    applications.value = appResult?.list || manage?.applications || [];
  } catch {
    toastError("运营台加载失败，请确认你是社群管理员");
  } finally {
    loading.value = false;
  }
}
async function saveGroup() {
  if (saving.value || !form.name.trim()) return;
  saving.value = true;
  try {
    group.value = await bridge.network.updateGroup(groupId.value, {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
    });
    uni.showToast({ title: "资料已保存", icon: "success" });
  } catch {
    toastError("资料保存失败");
  } finally {
    saving.value = false;
  }
}
function resetBranch() {
  editingBranchId.value = "";
  Object.assign(branchForm, { name: "", city: "", intro: "" });
}
function editBranch(branch) {
  editingBranchId.value = branch.id;
  Object.assign(branchForm, {
    name: branch.name || "",
    city: branch.city || "",
    intro: branch.intro || "",
  });
}
async function saveBranch() {
  if (branchSaving.value || !branchForm.name.trim()) return;
  branchSaving.value = true;
  try {
    const editing = !!editingBranchId.value;
    const branchId = editingBranchId.value;
    const result = editing
      ? await bridge.network.updateBranch(groupId.value, branchId, {
          ...branchForm,
        })
      : await bridge.network.createBranch(groupId.value, { ...branchForm });
    if (editing)
      branches.value = branches.value.map((item) =>
        item.id === branchId ? result : item,
      );
    else branches.value.push(result);
    resetBranch();
    uni.showToast({
      title: editing ? "分会已保存" : "分会已创建",
      icon: "success",
    });
  } catch {
    toastError("分会保存失败");
  } finally {
    branchSaving.value = false;
  }
}
function removeBranch(branch) {
  uni.showModal({
    title: "删除分会？",
    content: "有成员的分会不能删除，删除后不会影响社群本身。",
    confirmText: "确认删除",
    confirmColor: "#d86b59",
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        await bridge.network.deleteBranch(groupId.value, branch.id);
        branches.value = branches.value.filter((item) => item.id !== branch.id);
        uni.showToast({ title: "分会已删除", icon: "none" });
      } catch {
        toastError("分会删除失败");
      }
    },
  });
}
function resetEvent() {
  editingEventId.value = "";
  Object.assign(eventForm, {
    title: "",
    intro: "",
    starts_at: "",
    location: "",
    capacity: 0,
  });
}
function editEvent(event) {
  editingEventId.value = event.id || event._id;
  Object.assign(eventForm, {
    title: event.title || "",
    intro: event.intro || "",
    starts_at: event.starts_at
      ? event.starts_at.replace("T", " ").slice(0, 16)
      : "",
    location: event.location || "",
    capacity: event.capacity || 0,
  });
}
function eventTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "时间待定";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
async function toggleCheckins(event) {
  const eventId = event?.id || event?._id;
  if (!eventId) return;
  if (checkinEventId.value === eventId) {
    checkinEventId.value = "";
    checkinRows.value = [];
    return;
  }
  checkinEventId.value = eventId;
  checkinLoading.value = true;
  try {
    const result = await bridge.network.eventSignups(groupId.value, eventId);
    checkinRows.value = result?.list || [];
    event.checkin_count = Number(
      result?.checkin_count ||
        checkinRows.value.filter((item) => item.checked_in).length,
    );
  } catch {
    checkinRows.value = [];
    toastError("签到名单加载失败");
  } finally {
    checkinLoading.value = false;
  }
}
async function toggleCheckin(event, row) {
  if (!event || !row?.user_id) return;
  try {
    const result = await bridge.network.updateEventCheckin(
      groupId.value,
      event.id || event._id,
      row.user_id,
      !row.checked_in,
    );
    row.checked_in = !!result?.checked_in;
    event.checkin_count = Number(
      result?.checkin_count ||
        checkinRows.value.filter((item) => item.checked_in).length,
    );
  } catch {
    toastError("签到状态更新失败");
  }
}
function resetRecap() {
  recapEventId.value = "";
  recapDraft.value = "";
}
function editRecap(event) {
  recapEventId.value = event.id || event._id;
  recapDraft.value = event.recap || "";
}
async function saveRecap(event) {
  if (!event || recapSaving.value || !recapDraft.value.trim()) return;
  recapSaving.value = true;
  try {
    const result = await bridge.network.updateEventRecap(
      groupId.value,
      event.id || event._id,
      recapDraft.value.trim(),
    );
    if (result) Object.assign(event, result);
    resetRecap();
    uni.showToast({ title: "复盘已发布", icon: "success" });
  } catch {
    toastError("复盘发布失败，请确认活动已结束");
  } finally {
    recapSaving.value = false;
  }
}
async function saveEvent() {
  if (
    eventSaving.value ||
    !eventForm.title.trim() ||
    !eventForm.starts_at.trim()
  )
    return;
  eventSaving.value = true;
  try {
    const data = {
      ...eventForm,
      title: eventForm.title.trim(),
      intro: eventForm.intro.trim(),
      starts_at: eventForm.starts_at.trim(),
      location: eventForm.location.trim(),
      capacity: Number(eventForm.capacity) || 0,
    };
    const editing = !!editingEventId.value;
    const result = editing
      ? await bridge.network.updateEvent(
          groupId.value,
          editingEventId.value,
          data,
        )
      : await bridge.network.createEvent(groupId.value, data);
    if (editing)
      events.value = events.value.map((item) =>
        (item.id || item._id) === editingEventId.value ? result : item,
      );
    else events.value.unshift(result);
    resetEvent();
    uni.showToast({
      title: editing ? "活动已保存" : "活动已发布",
      icon: "success",
    });
  } catch {
    toastError("活动保存失败，请检查时间和内容");
  } finally {
    eventSaving.value = false;
  }
}
function finishEvent(event) {
  uni.showModal({
    title: "结束这场活动？",
    content: "结束后成员不能继续报名，但历史报名记录会保留。",
    confirmText: "确认结束",
    confirmColor: "#d86b59",
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        const result = await bridge.network.updateEvent(
          groupId.value,
          event.id || event._id,
          { status: "finished" },
        );
        if (result)
          events.value = events.value.map((item) =>
            (item.id || item._id) === (event.id || event._id) ? result : item,
          );
        uni.showToast({ title: "活动已结束", icon: "none" });
      } catch {
        toastError("活动状态更新失败");
      }
    },
  });
}
async function showEventSignups(event) {
  try {
    const result = await bridge.network.eventSignups(
      groupId.value,
      event.id || event._id,
    );
    const names = (result?.list || [])
      .map((item) => `${item.checked_in ? "✓" : "○"} ${item.nickname}`)
      .filter(Boolean);
    const suffix =
      result?.total > names.length
        ? `等 ${result.total} 人`
        : `${names.length} 人`;
    const waitlist = (result?.waitlist || [])
      .map((item) => `${item.position || ""}. ${item.nickname}`)
      .filter(Boolean);
    const content = [
      names.length
        ? `已报名：${names.join("、")}（共 ${suffix}）`
        : "已报名：暂时还没有成员",
      waitlist.length ? `候补：${waitlist.join("、")}` : "候补：暂无",
    ].join("\n");
    uni.showModal({ title: "报名名单", content, showCancel: false });
  } catch {
    toastError("报名名单加载失败");
  }
}
async function review(item, status) {
  try {
    await bridge.network.reviewApplication(
      groupId.value,
      item.member_id || item.id,
      status,
      status === "left" ? "当前阶段暂不开放" : "欢迎加入",
    );
    applications.value = applications.value.filter(
      (row) => (row.member_id || row.id) !== (item.member_id || item.id),
    );
    // 审核结果可能触发分会和成员数的重算，重新取服务端聚合值，不在前端手动 +1。
    await load();
    uni.showToast({
      title: status === "active" ? "已通过申请" : "已标记为不通过",
      icon: "none",
    });
  } catch {
    toastError("申请处理失败");
  }
}
function transferOwnership(member) {
  if (!member?.id || transferringUserId.value) return;
  uni.showModal({
    title: "交接群主？",
    content: `确认把「${group.value?.name || "这个社群"}」交给 ${member.nickname || "这位成员"} 吗？交接后你仍是管理员。`,
    confirmText: "确认交接",
    confirmColor: "#6573dc",
    success: async ({ confirm }) => {
      if (!confirm) return;
      transferringUserId.value = member.id;
      try {
        await bridge.network.transferOwnership(groupId.value, member.id);
        await load();
        uni.showToast({ title: "群主已交接", icon: "success" });
      } catch {
        toastError("群主交接失败，请确认对方仍在社群中");
      } finally {
        transferringUserId.value = "";
      }
    },
  });
}
function dissolveGroup() {
  if (dissolving.value) return;
  uni.showModal({
    title: "解散社群？",
    content:
      "解散后将不能继续发动态、发消息或报名活动；历史内容会保留，但社群不会再出现在公开列表。",
    confirmText: "确认解散",
    confirmColor: "#d86b59",
    success: async ({ confirm }) => {
      if (!confirm) return;
      dissolving.value = true;
      try {
        await bridge.network.dissolveGroup(groupId.value, "群主主动解散");
        uni.showToast({ title: "社群已解散", icon: "success" });
        setTimeout(() => uni.reLaunch({ url: "/pages/network/index" }), 350);
      } catch {
        toastError("解散失败，请稍后重试");
      } finally {
        dissolving.value = false;
      }
    },
  });
}
function initial(item) {
  return String(item?.nickname || "人").slice(0, 1);
}
function openChat() {
  uni.navigateTo({
    url: `/pages/network/group-chat?id=${encodeURIComponent(groupId.value)}&name=${encodeURIComponent(group.value?.name || "")}`,
  });
}
function openDetail() {
  uni.navigateTo({
    url: `/pages/network/detail?id=${encodeURIComponent(groupId.value)}`,
  });
}
onLoad((query) => {
  groupId.value = query?.id || "";
  load();
});
onShow(() => {
  if (groupId.value && !loading.value) load();
});
</script>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  padding: 28rpx 24rpx 120rpx;
  color: #27334f;
  background: #f5f7fb;
  box-sizing: border-box;
}
.topbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.eyebrow {
  display: block;
  color: #a0aabd;
  font: 700 16rpx/1.2 monospace;
  letter-spacing: 0.1em;
}
.title {
  display: block;
  margin-top: 8rpx;
  color: #303b57;
  font-size: 40rpx;
  font-weight: 760;
  letter-spacing: -0.05em;
}
.subtitle {
  display: block;
  margin-top: 8rpx;
  color: #8f9bb0;
  font-size: 20rpx;
}
.chat-link {
  padding: 12rpx 17rpx;
  border-radius: 17rpx;
  color: #6573dc;
  background: #eef0ff;
  font-size: 20rpx;
}
.section-card {
  margin-bottom: 14rpx;
  padding: 20rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 8rpx 20rpx rgba(70, 87, 123, 0.03);
}
.section-card.compact {
  margin-bottom: 0;
}
.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 14rpx;
}
.section-title,
.section-desc {
  display: block;
}
.section-title {
  color: #4a5670;
  font-size: 25rpx;
  font-weight: 750;
}
.section-desc {
  margin-top: 5rpx;
  color: #a0aabd;
  font-size: 17rpx;
}
.status {
  flex: 0 0 auto;
  color: #6573dc;
  font-size: 18rpx;
}
.status.accent {
  color: #d27b59;
}
.field {
  margin-top: 15rpx;
}
.field-row {
  display: flex;
  gap: 12rpx;
}
.half {
  min-width: 0;
  flex: 1;
}
.label {
  display: block;
  margin-bottom: 7rpx;
  color: #68748a;
  font-size: 18rpx;
}
.input,
.textarea {
  width: 100%;
  padding: 12rpx 13rpx;
  border: 1rpx solid #e7ebf2;
  border-radius: 13rpx;
  color: #4b5872;
  background: #fbfcfe;
  font-size: 20rpx;
  box-sizing: border-box;
}
.textarea {
  min-height: 100rpx;
  line-height: 1.5;
}
.chip-row {
  display: flex;
  gap: 8rpx;
}
.chip {
  padding: 9rpx 16rpx;
  border: 1rpx solid #e7ebf2;
  border-radius: 18rpx;
  color: #8d99ac;
  font-size: 18rpx;
}
.chip.active {
  border-color: #8b96e7;
  color: #5968d8;
  background: #eef0ff;
  font-weight: 700;
}
.save {
  margin-top: 16rpx;
  padding: 13rpx;
  border-radius: 16rpx;
  color: #fff;
  background: #6573dc;
  font-size: 20rpx;
  font-weight: 700;
  text-align: center;
}
.save.small {
  display: inline-block;
  width: 180rpx;
  margin-top: 0;
  padding: 11rpx 15rpx;
  box-sizing: border-box;
}
.save.disabled {
  opacity: 0.45;
  pointer-events: none;
}
.branch-list {
  display: flex;
  flex-direction: column;
  gap: 9rpx;
}
.branch-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 13rpx;
  border-radius: 16rpx;
  background: #f8f9fc;
}
.branch-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 43rpx;
  height: 43rpx;
  border-radius: 13rpx;
  color: #6573dc;
  background: #eef0ff;
  font-size: 24rpx;
}
.branch-copy {
  min-width: 0;
  flex: 1;
}
.branch-name,
.branch-meta,
.branch-intro {
  display: block;
}
.branch-name {
  color: #55617a;
  font-size: 20rpx;
  font-weight: 700;
}
.branch-meta {
  margin-top: 4rpx;
  color: #9aa5b6;
  font-size: 16rpx;
}
.branch-intro {
  margin-top: 4rpx;
  overflow: hidden;
  color: #a0aabd;
  font-size: 16rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.branch-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7rpx;
  color: #6573dc;
  font-size: 16rpx;
}
.branch-actions .danger {
  color: #d86b59;
}
.empty-line {
  padding: 18rpx 0;
  color: #a0aabd;
  font-size: 18rpx;
  text-align: center;
}
.branch-form {
  margin-top: 17rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #f0f2f6;
}
.form-caption {
  display: block;
  margin-bottom: 8rpx;
  color: #68748a;
  font-size: 18rpx;
  font-weight: 700;
}
.placeholder {
  color: #b1bac7;
}
.half-input {
  margin-top: 9rpx;
}
.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 15rpx;
  margin-top: 12rpx;
}
.cancel {
  color: #a0aabd;
  font-size: 18rpx;
}
.application-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.application {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx;
  border: 1rpx solid #f0e7dc;
  border-radius: 16rpx;
  background: #fffaf5;
}
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48rpx;
  height: 48rpx;
  border-radius: 15rpx;
  color: #fff;
  background: linear-gradient(135deg, #d86b59, #f3a487);
  font-size: 20rpx;
  font-weight: 700;
}
.application-copy {
  min-width: 0;
  flex: 1;
}
.app-name,
.app-meta,
.app-intent {
  display: block;
}
.app-name {
  color: #56627d;
  font-size: 20rpx;
  font-weight: 700;
}
.app-meta,
.app-intent {
  margin-top: 3rpx;
  overflow: hidden;
  color: #a0aabd;
  font-size: 16rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-intent {
  color: #b38255;
}
.app-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7rpx;
  flex: 0 0 auto;
  font-size: 16rpx;
}
.approve {
  color: #2f9b82;
}
.reject {
  color: #d86b59;
}
.member-summary {
  display: flex;
  align-items: center;
  gap: 12rpx;
  color: #8d99ac;
  font-size: 18rpx;
}
.member-summary text:last-child {
  margin-left: auto;
  color: #6573dc;
}
.state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #9aa5b6;
  font-size: 21rpx;
}
.event-list {
  display: flex;
  flex-direction: column;
  gap: 9rpx;
}
.event-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 13rpx;
  border-radius: 16rpx;
  background: #f8f9fc;
}
.event-copy {
  min-width: 0;
  flex: 1;
}
.event-name,
.event-meta {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-name {
  color: #55617a;
  font-size: 20rpx;
  font-weight: 700;
}
.event-meta {
  margin-top: 5rpx;
  color: #9aa5b6;
  font-size: 16rpx;
}
.event-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 7rpx;
  flex: 0 0 auto;
  color: #6573dc;
  font-size: 16rpx;
}
.event-actions .danger {
  color: #d86b59;
}
.event-form {
  margin-top: 17rpx;
  padding-top: 15rpx;
  border-top: 1rpx solid #f0f2f6;
}
.event-intro-input {
  margin-top: 9rpx;
}
.event-form > .half-input {
  display: block;
}
.lifecycle-card {
  border-color: #ede6e2;
}
.lifecycle-block {
  padding: 14rpx;
  border-radius: 16rpx;
  background: #faf8ff;
}
.lifecycle-hint,
.danger-desc {
  display: block;
  margin-top: 6rpx;
  color: #a0aabd;
  font-size: 16rpx;
  line-height: 1.55;
}
.transfer-list {
  display: flex;
  flex-direction: column;
  gap: 9rpx;
  margin-top: 12rpx;
}
.transfer-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 11rpx;
  border: 1rpx solid #eceafb;
  border-radius: 14rpx;
  background: #fff;
}
.transfer-avatar {
  flex: 0 0 auto;
  width: 43rpx;
  height: 43rpx;
  border-radius: 13rpx;
  background: linear-gradient(135deg, #6573dc, #9c8de8);
}
.transfer-action {
  flex: 0 0 auto;
  color: #6573dc;
  font-size: 17rpx;
  font-weight: 700;
}
.danger-zone {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 14rpx;
  padding: 14rpx;
  border: 1rpx solid #f2dfda;
  border-radius: 16rpx;
  background: #fffaf8;
}
.danger-title {
  display: block;
  color: #b95e50;
  font-size: 19rpx;
  font-weight: 700;
}
.dissolve-action {
  flex: 0 0 auto;
  padding: 9rpx 13rpx;
  border-radius: 13rpx;
  color: #fff;
  background: #d86b59;
  font-size: 17rpx;
}
.event-wrap {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.checkin-panel,
.recap-panel {
  padding: 13rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 15rpx;
  background: #fbfcff;
}
.panel-caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  color: #68748a;
  font-size: 17rpx;
  font-weight: 700;
}
.panel-caption text:last-child {
  color: #9aa5b6;
  font-size: 15rpx;
  font-weight: 400;
}
.checkin-list {
  display: flex;
  flex-direction: column;
  gap: 7rpx;
  margin-top: 10rpx;
}
.checkin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  padding: 9rpx 10rpx;
  border-radius: 12rpx;
  background: #fff;
}
.checkin-copy {
  min-width: 0;
  flex: 1;
}
.checkin-action {
  padding: 7rpx 10rpx;
  border-radius: 11rpx;
  color: #fff;
  background: #6573dc;
  font-size: 15rpx;
}
.checkin-action.checked {
  color: #2f9b82;
  background: #e8f7f2;
}
.recap-panel .textarea {
  margin-top: 10rpx;
  min-height: 110rpx;
}
</style>
