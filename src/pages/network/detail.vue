<template>
  <view class="network-detail-root">
    <view v-if="loading" class="state-page"
      ><view class="loading-dot" /><text>正在打开…</text></view
    >
    <view v-else-if="!group" class="state-page" @tap="loadDetail"
      ><image src="/static/icons/users.svg" mode="aspectFit" /><text
        >社群暂时不可用</text
      ><text class="state-action">点击重试</text></view
    >
    <view v-else class="page" :style="a11yStyle">
      <view class="cover-hero" :style="coverStyle">
        <view class="cover-decoration decoration-one" /><view
          class="cover-decoration decoration-two"
        />
        <view class="cover-topline"
          ><text class="cover-label">{{
            groupTypeLabel(group.group_type || group.type)
          }}</text
          ><view class="cover-top-actions"
            ><text
              v-if="group.joined"
              class="cover-manage"
              @tap.stop="goGroupChat"
              >群聊</text
            ><text
              v-if="group.can_manage"
              class="cover-manage"
              @tap.stop="goManageCenter"
              >运营台</text
            ><text
              v-if="group.can_manage"
              class="cover-manage"
              @tap.stop="openManage"
              >成员</text
            ><text class="cover-code">{{ groupShortName(group) }}</text></view
          ></view
        >
        <image
          class="hero-icon"
          src="/static/icons/users.svg"
          mode="aspectFit"
        />
        <text class="hero-title">{{ group.name }}</text>
        <text class="hero-desc">{{ group.description }}</text>
        <view class="hero-meta"
          ><text
            >{{ group.city || "全国" }} ·
            {{ group.industry || "行业交流" }}</text
          ><text
            >{{
              formatCount(
                group.active_member_count ??
                  group.member_count ??
                  group.memberCount,
              )
            }}
            位成员</text
          ></view
        >
      </view>

      <view class="summary-card">
        <view class="summary-stats"
          ><view
            ><text class="summary-num">{{
              formatCount(
                group.active_member_count ??
                  group.member_count ??
                  group.memberCount,
              )
            }}</text
            ><text class="summary-label">社群成员</text></view
          ><view class="summary-divider" /><view
            ><text class="summary-num">{{
              group.activity_count ?? group.activityCount ?? 0
            }}</text
            ><text class="summary-label">近期动态</text></view
          ><view class="summary-divider" /><view
            ><text class="summary-num">{{
              group.branch_count ?? group.branchCount ?? 0
            }}</text
            ><text class="summary-label">分会</text></view
          ></view
        >
        <view class="join-row"
          ><text class="join-hint">{{
            group.joined
              ? `你在${joinedBranchName || "社群"}，可以开始发动态`
              : group.join_pending
                ? "申请已提交，等待社群管理员确认"
                : group.join_mode === "approval"
                  ? "提交申请后，管理员会先了解你的参与方向"
                  : "加入后能发动态，也能参加分会活动"
          }}</text
          ><view
            class="join-button"
            :class="{ joined: group.joined, pending: group.join_pending }"
            @tap="handleJoinAction"
            ><text>{{
              group.joined
                ? "已加入"
                : group.join_pending
                  ? "申请中"
                  : "加入社群"
            }}</text></view
          ></view
        >
      </view>

      <view
        v-if="group.branches && group.branches.length"
        class="branch-section"
      >
        <view class="section-heading"
          ><view
            ><text class="section-eyebrow">分会</text
            ><text class="section-title">分会网络</text></view
          ><text class="section-link"
            >{{ group.branches.length }} 个分会</text
          ></view
        >
        <scroll-view class="branch-scroll" scroll-x show-scrollbar="false"
          ><view class="branch-row"
            ><view
              class="branch-card"
              :class="{
                selected:
                  group.joined_branch_id === branch.id ||
                  group.joinedBranchId === branch.id,
              }"
              v-for="branch in group.branches"
              :key="branch.id"
              @tap="selectBranch(branch)"
              ><view class="branch-mark">＋</view
              ><view class="branch-copy"
                ><text class="branch-name">{{ branch.name }}</text
                ><text class="branch-meta"
                  >{{ branch.city }} ·
                  {{ formatCount(branch.member_count) }} 人</text
                ></view
              ><text
                v-if="
                  group.joined_branch_id === branch.id ||
                  group.joinedBranchId === branch.id
                "
                class="branch-selected"
                >我的分会</text
              ><text v-else class="branch-arrow">→</text></view
            ></view
          ></scroll-view
        >
      </view>

      <view v-if="group.events && group.events.length" class="events-section">
        <view class="section-heading"
          ><view
            ><text class="section-eyebrow">活动</text
            ><text class="section-title">接下来见</text></view
          ><text class="section-link">{{ group.events.length }} 场</text></view
        >
        <view class="event-list"
          ><view
            v-for="event in group.events"
            :key="event.id || event._id"
            :id="'event-' + (event.id || event._id)"
            class="event-card"
            ><view class="event-date"
              ><text>{{ eventMonth(event.starts_at) }}</text
              ><text>{{ eventDay(event.starts_at) }}</text></view
            ><view class="event-copy"
              ><text class="event-title">{{ event.title }}</text
              ><text v-if="event.intro" class="event-intro">{{
                event.intro
              }}</text
              ><text class="event-meta"
                >{{ eventTime(event.starts_at) }} ·
                {{ event.location || "线上" }}</text
              ><text class="event-capacity"
                >{{ event.signup_count || 0 }} 人已报名<text
                  v-if="event.capacity"
                >
                  · 限 {{ event.capacity }} 人</text
                ><text v-if="event.waitlist_count">
                  · 候补 {{ event.waitlist_count }} 人</text
                ><text v-if="event.checkin_count">
                  · 已签到 {{ event.checkin_count }} 人</text
                ></text
              ><text v-if="event.waitlisted" class="event-waiting"
                >你在候补第 {{ event.waitlist_position || 1 }} 位</text
              ><text
                v-if="event.status === 'finished' && event.recap"
                class="event-recap"
                >复盘：{{ event.recap }}</text
              ></view
            ><view
              v-if="group.joined"
              class="event-action"
              :class="{
                signed: event.signed_up,
                waiting: event.waitlisted,
                pending: eventBusy(event),
                disabled:
                  event.status !== 'upcoming' ||
                  (!event.can_signup &&
                    !event.can_waitlist &&
                    !event.signed_up &&
                    !event.waitlisted),
              }"
              @tap.stop="toggleEventSignup(event)"
              ><text>{{
                eventBusy(event)
                  ? "处理中…"
                  : event.signed_up
                    ? "已报名"
                    : event.waitlisted
                      ? "候补中"
                      : event.status !== "upcoming"
                        ? "已结束"
                        : event.can_signup
                          ? "报名"
                          : event.can_waitlist
                            ? "加入候补"
                            : "名额已满"
              }}</text></view
            ><view v-else class="event-action disabled"><text>加入后报名</text></view
            ></view
          ></view
        >
      </view>

      <view v-if="group.opportunities && group.opportunities.length" class="opportunity-section">
        <view class="section-heading"><view><text class="section-eyebrow">机会板</text><text class="section-title">正在寻找的合作</text></view><text v-if="group.joined" class="section-link" @tap="openOpportunitySheet">发布机会</text></view>
        <view class="opportunity-list"><view v-for="item in group.opportunities.slice(0, 3)" :key="item.id || item._id" class="opportunity-card"><view class="opportunity-top"><text class="opportunity-type">{{ opportunityTypeLabel(item.opportunity_type) }}</text><text class="opportunity-status" :class="{ closed: item.status !== 'open' }">{{ item.status === 'open' ? '开放中' : '已结束' }}</text></view><text class="opportunity-title">{{ item.title }}</text><text v-if="item.content" class="opportunity-copy">{{ item.content }}</text><view class="opportunity-meta"><text>{{ item.author?.nickname || '社群成员' }}</text><text v-if="item.deadline_at">截至 {{ simpleDate(item.deadline_at) }}</text><text v-if="item.can_manage && item.status === 'open'" class="opportunity-close" @tap="closeOpportunity(item)">结束征集</text></view></view></view>
      </view>

      <view class="content-tabs"
        ><text
          :class="{ active: activeTab === 'activity' }"
          @tap="activeTab = 'activity'"
          >群内动态</text
        ><text
          :class="{ active: activeTab === 'members' }"
          @tap="activeTab = 'members'"
          >成员
          {{
            group.active_member_count ??
            group.member_count ??
            group.memberCount ??
            group.members?.length ??
            0
          }}</text
        ></view
      >

      <view v-if="activeTab === 'activity'" class="activity-section">
        <view class="feed-toolbar"
          ><scroll-view
            class="feed-filter-scroll"
            scroll-x
            show-scrollbar="false"
            ><view class="feed-filter-row"
              ><text
                v-for="filter in postFilters"
                :key="filter.value"
                class="feed-filter"
                :class="{ active: postFilter === filter.value }"
                @tap="postFilter = filter.value"
                >{{ filter.label }}</text
              ></view
            ></scroll-view
          ><text class="feed-sort" @tap="toggleFeedSort"
            >{{ feedSort === "latest" ? "最新" : "最热" }}⌄</text
          ></view
        >
        <view v-if="group.joined" class="post-composer"
          ><view class="composer-avatar">我</view
          ><view class="composer-main">
            <textarea
              v-model="postContent"
              class="composer-input"
              maxlength="500"
              auto-height
              placeholder="说说你想找的合作、资源或活动…"
              placeholder-class="composer-placeholder"
            /><view class="composer-footer"
              ><scroll-view
                class="post-type-scroll"
                scroll-x
                show-scrollbar="false"
                ><view class="post-type-row"
                  ><text
                    v-for="type in postTypes"
                    :key="type.value"
                    class="post-type-chip"
                    :class="{ active: postType === type.value }"
                    @tap="postType = type.value"
                    >{{ type.label }}</text
                  ></view
                ></scroll-view
              ><text class="composer-counter">{{ postContent.length }}/500</text
              ><view
                class="composer-send"
                :class="{ disabled: !postContent.trim() || posting }"
                @tap="createPost"
                ><text>{{ posting ? "…" : "发布" }}</text></view
              ></view
            ></view
          ></view
        >
        <view v-else class="join-prompt"
          ><view class="prompt-icon"
            ><image src="/static/icons/chat.svg" mode="aspectFit" /></view
          ><view class="prompt-copy"
            ><text>加入社群，和大家聊起来</text
            ><text>发布项目、分享经验，或找合作伙伴</text></view
          ><text class="prompt-action" @tap="openJoinSheet">加入 →</text></view
        >
        <view v-if="!group.posts || !group.posts.length" class="empty-card"
          ><image src="/static/icons/chat.svg" mode="aspectFit" /><text
            >这里还没有动态</text
          ><text v-if="group.joined" class="empty-hint"
            >先发一条动态，让大家认识你</text
          ></view
        >
        <view v-else class="post-list"
          ><view class="post-card" v-for="post in visiblePosts" :key="post._id"
            ><view class="post-author"
              ><view
                class="post-avatar"
                :style="{ background: avatarColor(post.author?.id) }"
                ><text>{{ getInitial(post.author?.nickname) }}</text></view
              ><view class="post-author-copy"
                ><view class="post-name-line"
                  ><text class="post-name">{{
                    post.author?.nickname || "社群成员"
                  }}</text
                  ><text
                    class="post-type-tag"
                    :class="`type-${post.post_type || post.postType || 'general'}`"
                    >{{ postTypeLabel(post.post_type || post.postType) }}</text
                  ></view
                ><text class="post-meta"
                  >{{ post.author?.company || "媒合智联成员" }} ·
                  {{ formatTime(post.created_at) }}</text
                ></view
              ><text class="post-more" @tap.stop="showPostMenu(post)"
                >···</text
              ></view
            ><text class="post-content">{{ post.content }}</text
            ><view v-if="post.accepted_answer" class="accepted-answer"><text class="accepted-label">已采纳</text><text>{{ post.accepted_answer.author?.nickname || '社群成员' }}：{{ post.accepted_answer.content }}</text></view
            ><view class="post-actions"
              ><view
                class="post-action"
                :class="{ liked: post.liked, disabled: postBusy(post) }"
                @tap="likePost(post)"
                ><image
                  src="/static/icons/heart.svg"
                  mode="aspectFit"
                /><text>{{ post.like_count || 0 }}</text></view
              ><view
                class="post-action"
                :class="{ active: activeCommentPostId === post._id }"
                @tap="toggleComments(post)"
                ><image src="/static/icons/chat.svg" mode="aspectFit" /><text>{{
                  post.comment_count || 0
                }}</text></view
              ><text class="post-action-hint">{{
                postTypeHint(post.post_type || post.postType)
              }}</text></view
            ><view
              v-if="activeCommentPostId === post._id"
              class="comment-thread"
              ><view v-if="commentsLoading" class="comment-loading"
                >正在打开评论…</view
              ><view v-else-if="!comments.length" class="comment-empty"
                >还没有评论，来做第一个回应</view
              ><view v-else class="comment-list"
                ><view
                  class="comment-item"
                  v-for="comment in comments"
                  :key="comment._id"
                  ><view
                    class="comment-avatar"
                    :style="{ background: avatarColor(comment.author?.id) }"
                    >{{ getInitial(comment.author?.nickname) }}</view
                  ><view class="comment-copy"
                    ><text class="comment-author">{{
                      comment.author?.nickname || "社群成员"
                    }}</text
                    ><text class="comment-content">{{
                      comment.content
                    }}</text><text v-if="post.can_accept_answer && (post.post_type || post.postType) === 'question' && post.accepted_comment_id !== comment._id" class="accept-answer" @tap="acceptAnswer(post, comment)">采纳答案</text></view
                  ><text class="comment-time">{{
                    formatTime(comment.created_at)
                  }}</text></view
                ></view
              ><view v-if="group.joined" class="comment-compose"
                ><input
                  v-model="commentDraft"
                  class="comment-input"
                  placeholder="回复这条动态…"
                  confirm-type="send"
                  @confirm="submitComment(post)"
                /><view class="comment-send" @tap="submitComment(post)"
                  >发送</view
                ></view
              ></view
            ></view
          ><view
            v-if="group.posts.length && !visiblePosts.length"
            class="empty-card compact-empty"
            ><text>这个分类还没有动态</text
            ><text class="empty-hint" @tap="postFilter = 'all'"
              >查看全部动态</text
            ></view
          ></view
        >
      </view>

      <view v-else class="members-section"
        ><view class="member-toolbar"
          ><view
            ><text class="member-toolbar-title">社群成员</text
            ><text class="member-toolbar-desc"
              >先看看大家最近在聊什么</text
            ></view
          ><text class="member-toolbar-count"
            >{{
              group.active_member_count ??
              group.member_count ??
              group.memberCount ??
              0
            }}
            人</text
          ></view
        ><view class="member-grid"
          ><view
            class="member-card"
            v-for="member in group.members || []"
            :key="member.id"
            @tap="goProfile(member.id)"
            @longpress="showMemberMenu(member)"
            ><view
              class="member-avatar"
              :style="{ background: avatarColor(member.id) }"
              ><text>{{ getInitial(member.nickname) }}</text></view
            ><text class="member-name">{{ member.nickname }}</text
            ><text class="member-company">{{
              member.company || member.title || "社群成员"
            }}</text
            ><view
              v-if="member.role === 'admin' || member.role === 'owner'"
              class="member-role"
              >管理员</view
            ><view
              class="member-connect"
              :class="{ disabled: memberBusy(member) }"
              @tap.stop="toggleMemberFollow(member)"
              ><text>{{
                memberBusy(member)
                  ? "处理中…"
                  : member.followed
                    ? "已关注"
                    : "+ 关注"
              }}</text></view
            ></view
          ></view
        ><view v-if="!group.members?.length" class="empty-card"
          ><image src="/static/icons/users.svg" mode="aspectFit" /><text
            >成员信息暂不可见</text
          ></view
        ></view
      >

      <view v-if="group.joined" class="leave-link" @tap="leaveGroup"
        >退出社群</view
      >
      <view style="height: 44rpx" />
    </view>

    <view v-if="showJoinSheet" class="sheet-mask" @tap="closeJoinSheet"
      ><view class="join-sheet" @tap.stop
        ><view class="sheet-handle" /><text class="sheet-kicker">加入社群</text
        ><text class="sheet-title">先选你想参与的方向</text
        ><text class="sheet-desc"
          >加入后可以发动态、进入分会，也能报名活动。</text
        ><text class="sheet-label"
          >选择分会 <text class="sheet-optional">可选</text></text
        ><scroll-view
          class="sheet-branch-scroll"
          scroll-x
          show-scrollbar="false"
          ><view class="sheet-branch-row"
            ><view
              v-for="branch in group?.branches || []"
              :key="branch.id"
              class="sheet-branch"
              :class="{ active: selectedBranchId === branch.id }"
              @tap="selectedBranchId = branch.id"
              ><text>{{ branch.name }}</text
              ><text
                >{{ branch.city }} ·
                {{ formatCount(branch.member_count) }}人</text
              ></view
            ></view
          ></scroll-view
        ><text class="sheet-label">你希望在这里获得什么</text
        ><view class="intent-grid"
          ><text
            v-for="intent in joinIntents"
            :key="intent"
            class="intent-chip"
            :class="{ active: joinIntent === intent }"
            @tap="joinIntent = intent"
            >{{ intent }}</text
          ></view
        ><view
          class="sheet-confirm"
          :class="{ disabled: joining }"
          @tap="confirmJoin"
          ><text>{{ joining ? "加入中…" : "确认加入社群" }}</text></view
        ><text class="sheet-cancel" @tap="closeJoinSheet">先看看</text></view
      ></view
    >
    <view
      v-if="showBranchSheet && selectedBranch"
      class="sheet-mask"
      @tap="showBranchSheet = false"
      ><view class="branch-sheet" @tap.stop
        ><view class="sheet-handle" /><text class="sheet-kicker">分会</text
        ><text class="sheet-title">{{ selectedBranch.name }}</text
        ><text class="sheet-desc">{{
          selectedBranch.intro || "在这里认识同城伙伴，参加线下交流。"
        }}</text
        ><view class="branch-sheet-stats"
          ><text>{{ selectedBranch.city }}</text
          ><text
            >{{ formatCount(selectedBranch.member_count) }} 位成员</text
          ></view
        ><view
          v-if="!group.joined"
          class="sheet-confirm"
          @tap="openJoinFromBranch"
          >加入并选择此分会</view
        ><text class="sheet-cancel" @tap="showBranchSheet = false"
          >关闭</text
        ></view
      ></view
    >
    <view v-if="showManageSheet" class="sheet-mask" @tap="closeManage"
      ><view class="manage-sheet" @tap.stop
        ><view class="sheet-handle" /><view class="manage-header"
          ><view
            ><text class="sheet-kicker">COMMUNITY MANAGEMENT</text
            ><text class="sheet-title">成员管理</text></view
          ><text class="manage-count"
            >{{ managedMembers.length }} 人</text
          ></view
        ><text class="sheet-desc"
          >管理员可以调整成员身份，也可以移出不再参与的成员。</text
        ><view v-if="manageLoading" class="manage-loading"
          ><view class="loading-dot" /><text>正在加载成员…</text></view
        ><view v-else-if="!managedMembers.length" class="manage-empty"
          >暂时没有可管理的成员</view
        ><scroll-view v-else class="manage-list" scroll-y
          ><view
            v-for="member in managedMembers"
            :key="member.id"
            class="manage-member"
            ><view
              class="manage-avatar"
              :style="{ background: avatarColor(member.id) }"
              ><text>{{ getInitial(member.nickname) }}</text></view
            ><view class="manage-member-copy"
              ><view class="manage-name-line"
                ><text class="manage-name">{{ member.nickname }}</text
                ><text v-if="member.role === 'owner'" class="role-badge owner"
                  >群主</text
                ><text v-else-if="member.role === 'admin'" class="role-badge"
                  >管理员</text
                ></view
              ><text class="manage-meta">{{
                member.company || member.title || "社群成员"
              }}</text></view
            ><view
              v-if="member.role !== 'owner' && member.id !== group.created_by"
              class="manage-actions"
              ><text class="manage-action" @tap="toggleMemberRole(member)">{{
                member.role === "admin" ? "撤销管理员" : "设为管理员"
              }}</text
              ><text class="manage-action danger" @tap="removeMember(member)"
                >移出</text
              ></view
            ></view
          ></scroll-view
        ><text class="sheet-cancel" @tap="closeManage">完成</text></view
      ></view
    >
    <view v-if="showOpportunitySheet" class="sheet-mask" @tap="showOpportunitySheet = false"><view class="join-sheet" @tap.stop><view class="sheet-handle" /><text class="sheet-kicker">OPPORTUNITY BOARD</text><text class="sheet-title">发布一条合作机会</text><input v-model="opportunityForm.title" class="opportunity-input" maxlength="100" placeholder="例如：寻找首批联合验证伙伴" /><textarea v-model="opportunityForm.content" class="opportunity-textarea" maxlength="1000" auto-height placeholder="说明项目阶段、希望对方提供什么，以及下一步如何开始。" /><view class="intent-grid"><text v-for="item in opportunityTypes" :key="item.value" class="intent-chip" :class="{ active: opportunityForm.opportunity_type === item.value }" @tap="opportunityForm.opportunity_type = item.value">{{ item.label }}</text></view><view class="sheet-confirm" :class="{ disabled: opportunitySaving }" @tap="submitOpportunity"><text>{{ opportunitySaving ? '发布中…' : '发布到机会板' }}</text></view><text class="sheet-cancel" @tap="showOpportunitySheet = false">取消</text></view></view>
  </view>
</template>

<script setup>
import { onLoad, onReady, onShareAppMessage, onShareTimeline } from "@dcloudio/uni-app";
import { computed, nextTick, ref } from "vue";
import { bridge } from "@/api/bridge";
import { a11yStyle } from "@/utils/accessibility";
import { useNavTitle } from "@/hooks/useNavTitle";
import { formatRelativeTime as relativeTime } from "@/utils/util";
import { toastError } from "@/utils/feedback";
import { useUserStore } from "@/stores/user";
import { requirePageLogin } from "@/utils/require-login";
useNavTitle("titles.networkDetail");

const groupId = ref("");
const requestedEventId = ref("");
const pageReady = ref(false);
const userStore = useUserStore();
const group = ref(null);
const loading = ref(true);
const activeTab = ref("activity");
const postContent = ref("");
const postType = ref("collab");
const postFilter = ref("all");
const feedSort = ref("latest");
const posting = ref(false);
const joining = ref(false);
const showJoinSheet = ref(false);
const showBranchSheet = ref(false);
const selectedBranch = ref(null);
const selectedBranchId = ref("");
const joinIntent = ref("项目合作");
const activeCommentPostId = ref("");
const comments = ref([]);
const commentsLoading = ref(false);
const commentDraft = ref("");
const commenting = ref(false);
const showManageSheet = ref(false);
const manageLoading = ref(false);
const managedMembers = ref([]);
const showOpportunitySheet = ref(false);
const opportunitySaving = ref(false);
const opportunityForm = ref({ title: '', content: '', opportunity_type: 'collaboration' });
const eventPendingIds = ref(new Set());
const likingPostIds = ref(new Set());
const followingMemberIds = ref(new Set());
const avatarColors = [
  "linear-gradient(135deg, #5968D8, #8794F5)",
  "linear-gradient(135deg, #E17662, #F5AA89)",
  "linear-gradient(135deg, #2F9B82, #72C7A8)",
  "linear-gradient(135deg, #C78934, #E5BA6D)",
  "linear-gradient(135deg, #7A69C7, #AC99E5)",
];
const coverPalettes = [
  "linear-gradient(135deg, #35484A 0%, #5F7C6C 100%)",
  "linear-gradient(135deg, #875949 0%, #C88768 100%)",
  "linear-gradient(135deg, #66724E 0%, #A4AF70 100%)",
  "linear-gradient(135deg, #8C673C 0%, #C9A25D 100%)",
  "linear-gradient(135deg, #4E6670 0%, #78959A 100%)",
];
const postTypes = [
  { value: "collab", label: "求合作" },
  { value: "experience", label: "经验分享" },
  { value: "event", label: "活动公告" },
  { value: "question", label: "提个问题" },
];
const opportunityTypes = [
  { value: 'collaboration', label: '合作伙伴' }, { value: 'investment', label: '融资引荐' }, { value: 'procurement', label: '采购供应' }, { value: 'channel', label: '渠道场景' }, { value: 'research', label: '联合研发' }
];
const postFilters = [{ value: "all", label: "全部" }, ...postTypes];
const joinIntents = ["项目合作", "资源互换", "经验分享", "参加活动"];

const joinedBranchName = computed(() => {
  const branchId = group.value?.joined_branch_id || group.value?.joinedBranchId;
  return (
    group.value?.branches?.find((branch) => branch.id === branchId)?.name || ""
  );
});
const coverStyle = computed(() => {
  const seed = String(
    group.value?.id || group.value?._id || group.value?.name || "network",
  );
  const hash = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return { background: coverPalettes[hash % coverPalettes.length] };
});
const visiblePosts = computed(() => {
  const list = (group.value?.posts || []).filter(
    (post) =>
      postFilter.value === "all" ||
      (post.post_type || post.postType || "general") === postFilter.value,
  );
  return [...list].sort((a, b) =>
    feedSort.value === "hot"
      ? Number(b.like_count || 0) - Number(a.like_count || 0)
      : new Date(b.created_at || 0) - new Date(a.created_at || 0),
  );
});

async function loadDetail() {
  if (!(await requirePageLogin(userStore, "登录后才能查看社群详情"))) return;
  if (!groupId.value) return;
  loading.value = true;
  try {
    group.value = await bridge.network.groupDetail(groupId.value);
  } catch {
    toastError("社群加载失败，请稍后重试");
  } finally {
    loading.value = false;
    void focusRequestedEvent();
  }
}
onLoad((query) => {
  groupId.value = query?.id || "";
  requestedEventId.value = /^[a-zA-Z0-9_-]+$/.test(String(query?.event_id || '')) ? query.event_id : '';
  loadDetail();
});
onReady(() => { pageReady.value = true; void focusRequestedEvent(); });
async function focusRequestedEvent() {
  if (!pageReady.value || loading.value || !requestedEventId.value || !group.value?.events?.some(event => (event.id || event._id) === requestedEventId.value)) return;
  const eventId = requestedEventId.value;
  requestedEventId.value = '';
  await nextTick();
  // #ifdef H5
  document.getElementById('event-' + eventId)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  // #endif
  // #ifndef H5
  const query = uni.createSelectorQuery();
  query.select('#event-' + eventId).boundingClientRect();
  query.selectViewport().scrollOffset();
  query.exec(([rect, viewport]) => {
    if (rect) uni.pageScrollTo({ scrollTop: Math.max(0, rect.top + (viewport?.scrollTop || 0) - 64), duration: 250 });
  });
  // #endif
}

onShareAppMessage(() => ({
  title: group.value?.name
    ? `加入${group.value.name}，认识更多合作伙伴`
    : "媒合智联：加入一个真实活跃的社群",
  path: `/pages/network/detail?id=${encodeURIComponent(groupId.value)}`,
}));

onShareTimeline(() => ({
  title: group.value?.name
    ? `${group.value.name}｜媒合智联社群`
    : "媒合智联：加入一个真实活跃的社群",
  query: `id=${encodeURIComponent(groupId.value)}`,
}));

async function openManage() {
  if (!group.value?.can_manage) return;
  showManageSheet.value = true;
  manageLoading.value = true;
  try {
    const result = await bridge.network.manageGroup(groupId.value);
    managedMembers.value = result?.members || [];
  } catch {
    toastError("成员列表加载失败，请稍后重试");
  } finally {
    manageLoading.value = false;
  }
}
function closeManage() {
  if (!manageLoading.value) showManageSheet.value = false;
}
async function toggleMemberRole(member) {
  if (!member?.id || member.role === "owner") return;
  try {
    const nextRole = member.role === "admin" ? "member" : "admin";
    const result = await bridge.network.updateMemberRole(
      groupId.value,
      member.id,
      nextRole,
    );
    if (result) Object.assign(member, result);
    else member.role = nextRole;
    uni.showToast({
      title: nextRole === "admin" ? "已设为管理员" : "已撤销管理员",
      icon: "none",
    });
  } catch {
    toastError("角色调整失败，请稍后重试");
  }
}
function removeMember(member) {
  if (!member?.id || member.role === "owner") return;
  uni.showModal({
    title: "移出社群？",
    content: `确定将${member.nickname || "该成员"}移出当前社群吗？`,
    confirmText: "确认移出",
    confirmColor: "#d86b59",
    success: async ({ confirm }) => {
      if (!confirm) return;
      try {
        const result = await bridge.network.removeMember(
          groupId.value,
          member.id,
        );
        managedMembers.value = managedMembers.value.filter(
          (item) => item.id !== member.id,
        );
        if (result?.group) Object.assign(group.value, result.group);
        else
          setLocalMemberCount(
            Number(
              group.value.active_member_count ??
                group.value.member_count ??
                group.value.memberCount ??
                0,
            ) - 1,
          );
        uni.showToast({ title: "已移出社群", icon: "none" });
      } catch {
        toastError("移出失败，请稍后重试");
      }
    },
  });
}

function formatCount(value) {
  const normalized =
    typeof value === "string" ? value.replace(/[，,\s]/g, "") : value;
  const count = Number(normalized);
  if (!Number.isFinite(count) || count <= 0) return "0";
  const compact = (number, unit) =>
    `${number.toFixed(1).replace(/\.0$/, "")}${unit}`;
  if (count >= 10000) return compact(count / 10000, "万");
  if (count >= 1000) return compact(count / 1000, "千");
  return String(Math.floor(count));
}
function getInitial(value) {
  return (
    String(value || "人")
      .trim()
      .slice(0, 1) || "人"
  );
}
function setLocalMemberCount(value) {
  if (!group.value) return;
  const count = Math.max(0, Number(value) || 0);
  group.value.member_count = count;
  group.value.memberCount = count;
  group.value.active_member_count = count;
  group.value.activeMemberCount = count;
}
function avatarColor(id) {
  return avatarColors[String(id || "").charCodeAt(0) % avatarColors.length];
}
function formatTime(value) {
  return relativeTime(value);
}
function eventDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
function eventMonth(value) {
  const date = eventDate(value);
  return date ? `${date.getMonth() + 1}月` : "待定";
}
function eventDay(value) {
  const date = eventDate(value);
  return date ? String(date.getDate()).padStart(2, "0") : "--";
}
function eventTime(value) {
  const date = eventDate(value);
  if (!date) return "时间待定";
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
function groupTypeLabel(type) {
  return (
    { circle: "人脉圈", community: "社群", branch: "分会" }[type] || "社群"
  );
}
function groupShortName(group) {
  const shortName = String(group?.short_name || "").trim();
  return (
    {
      "FOUNDER CIRCLE": "创始人圈",
      "CONTROLLER BRANCH": "实控人分会",
      "GROWTH COMMUNITY": "增长同业",
      "BRAND BRANCH": "市场与品牌",
      "PRIVATE DOMAIN": "私域运营",
    }[shortName] ||
    shortName ||
    "社群"
  );
}
function postTypeLabel(type) {
  return (
    {
      collab: "求合作",
      experience: "经验分享",
      event: "活动公告",
      question: "提问",
      general: "动态",
    }[type] || "动态"
  );
}
function postTypeHint(type) {
  return (
    {
      collab: "项目 / 资源 / 合作",
      experience: "方法 / 案例 / 复盘",
      event: "活动 / 见面 / 分会",
      question: "问题 / 投票 / 求建议",
      general: "项目 / 经验 / 合作",
    }[type] || "项目 / 经验 / 合作"
  );
}
function toggleFeedSort() {
  feedSort.value = feedSort.value === "latest" ? "hot" : "latest";
}
function eventKey(event) {
  return event?.id || event?._id || "";
}
function eventBusy(event) {
  return !!eventKey(event) && eventPendingIds.value.has(eventKey(event));
}
function postBusy(post) {
  return !!post?._id && likingPostIds.value.has(post._id);
}
function memberBusy(member) {
  return !!member?.id && followingMemberIds.value.has(member.id);
}

function openJoinSheet(branchId = "") {
  if (!group.value || group.value.joined) return;
  const branchIds = (group.value.branches || []).map((branch) => branch.id);
  if (branchId && branchIds.includes(branchId))
    selectedBranchId.value = branchId;
  else if (
    !selectedBranchId.value ||
    !branchIds.includes(selectedBranchId.value)
  )
    selectedBranchId.value = branchIds[0] || "";
  joinIntent.value = "项目合作";
  showJoinSheet.value = true;
}
function closeJoinSheet() {
  if (!joining.value) showJoinSheet.value = false;
}
function selectBranch(branch) {
  if (!branch) return;
  selectedBranch.value = branch;
  if (group.value?.joined) showBranchSheet.value = true;
  else {
    openJoinSheet(branch.id);
  }
}
function openJoinFromBranch() {
  showBranchSheet.value = false;
  openJoinSheet(selectedBranch.value?.id || "");
}

async function toggleJoin() {
  if (!group.value) return;
  if (!group.value.joined) return openJoinSheet();
  uni.showModal({
    title: "退出社群？",
    content: "退出后将无法继续发布动态，也会离开当前分会。",
    confirmText: "确认退出",
    confirmColor: "#d86b59",
    success: async (result) => {
      if (!result.confirm) return;
      try {
        const result = await bridge.network.leaveGroup(groupId.value);
        group.value.joined = false;
        group.value.joined_branch_id = "";
        group.value.joinedBranchId = "";
        if (result?.group) Object.assign(group.value, result.group);
        else
          setLocalMemberCount(
            Number(
              group.value.active_member_count ??
                group.value.member_count ??
                group.value.memberCount ??
                0,
            ) - 1,
          );
        uni.showToast({ title: "已退出社群", icon: "none" });
      } catch {
        toastError("操作失败，请稍后重试");
      }
    },
  });
}

async function confirmJoin() {
  if (!group.value || joining.value) return;
  joining.value = true;
  try {
    const result = await bridge.network.joinGroup(groupId.value, {
      branch_id: selectedBranchId.value,
      join_intent: joinIntent.value,
    });
    group.value.joined = !!result?.joined;
    group.value.join_pending = !!result?.pending;
    if (result?.group) Object.assign(group.value, result.group);
    showJoinSheet.value = false;
    uni.showToast({
      title: result?.pending ? "申请已提交" : "已加入社群",
      icon: result?.pending ? "none" : "success",
    });
  } catch {
    toastError("加入失败，请稍后重试");
  } finally {
    joining.value = false;
  }
}

async function createPost() {
  const content = postContent.value.trim();
  if (!content || posting.value) return;
  posting.value = true;
  try {
    const post = await bridge.network.createPost(
      groupId.value,
      content,
      postType.value,
    );
    if (post) group.value.posts = [post, ...(group.value.posts || [])];
    group.value.activity_count = Number(group.value.activity_count || 0) + 1;
    postContent.value = "";
    uni.showToast({ title: "动态已发布", icon: "success" });
  } catch {
    toastError("发布失败，请稍后重试");
  } finally {
    posting.value = false;
  }
}

function opportunityTypeLabel(type) {
  return ({ collaboration: '合作伙伴', investment: '融资引荐', procurement: '采购供应', channel: '渠道场景', talent: '人才协作', research: '联合研发' })[type] || '合作机会';
}
function simpleDate(value) { return String(value || '').replace('T', ' ').slice(0, 10); }
function openOpportunitySheet() {
  if (!group.value?.joined) return openJoinSheet();
  opportunityForm.value = { title: '', content: '', opportunity_type: 'collaboration' };
  showOpportunitySheet.value = true;
}
async function submitOpportunity() {
  const title = opportunityForm.value.title.trim();
  if (!title || opportunitySaving.value) return uni.showToast({ title: '请说明这次想找什么合作', icon: 'none' });
  opportunitySaving.value = true;
  try {
    const item = await bridge.network.createOpportunity(groupId.value, { ...opportunityForm.value, title, content: opportunityForm.value.content.trim() });
    if (item) group.value.opportunities = [item, ...(group.value.opportunities || [])];
    showOpportunitySheet.value = false;
    uni.showToast({ title: '已发布到机会板', icon: 'success' });
  } catch (error) { toastError(error?.message || '机会发布失败，请稍后重试'); }
  finally { opportunitySaving.value = false; }
}
async function closeOpportunity(item) {
  if (!item?.id && !item?._id) return;
  try {
    const updated = await bridge.network.updateOpportunity(groupId.value, item.id || item._id, { status: 'closed' });
    if (updated) Object.assign(item, updated);
  } catch (error) { toastError(error?.message || '机会状态更新失败'); }
}

async function toggleEventSignup(event) {
  const eventId = eventKey(event);
  if (!event || !eventId || event.status !== "upcoming" || eventBusy(event))
    return;
  if (!group.value?.joined) return openJoinSheet();
  if (
    !event.signed_up &&
    !event.waitlisted &&
    event.can_signup === false &&
    event.can_waitlist === false
  ) {
    uni.showToast({ title: "活动名额已满", icon: "none" });
    return;
  }
  eventPendingIds.value = new Set([...eventPendingIds.value, eventId]);
  try {
    const wasSignedUp = !!event.signed_up;
    const wasWaitlisted = !!event.waitlisted;
    const result =
      wasSignedUp || wasWaitlisted
        ? await bridge.network.cancelEventSignup(groupId.value, eventId)
        : await bridge.network.signupEvent(groupId.value, eventId);
    if (result) Object.assign(event, result);
    if (result?.signed_up === false) {
      event.signed_up = false;
      event.waitlisted = result.waitlisted === true;
      if (result.signup_count === undefined && wasSignedUp)
        event.signup_count = Math.max(0, Number(event.signup_count || 0) - 1);
      if (result.waitlist_count === undefined && wasWaitlisted)
        event.waitlist_count = Math.max(
          0,
          Number(event.waitlist_count || 0) - 1,
        );
      if (result.can_signup !== undefined) event.can_signup = result.can_signup;
      if (result.can_waitlist !== undefined)
        event.can_waitlist = result.can_waitlist;
    }
    const title = result?.waitlisted
      ? `已加入候补${result.waitlist_position ? `，当前第 ${result.waitlist_position} 位` : ""}`
      : event.signed_up
        ? "已报名活动"
        : wasWaitlisted
          ? "已退出候补"
          : "已取消报名";
    uni.showToast({ title, icon: "none" });
  } catch {
    toastError("报名状态更新失败，请稍后重试");
  } finally {
    const next = new Set(eventPendingIds.value);
    next.delete(eventId);
    eventPendingIds.value = next;
  }
}

async function likePost(post) {
  if (!post?._id || postBusy(post)) return;
  likingPostIds.value = new Set([...likingPostIds.value, post._id]);
  try {
    const result = await bridge.network.likePost(groupId.value, post._id);
    post.like_count = result?.count ?? post.like_count;
    post.liked = !!result?.liked;
  } catch {
    toastError("点赞失败，请稍后重试");
  } finally {
    const next = new Set(likingPostIds.value);
    next.delete(post._id);
    likingPostIds.value = next;
  }
}
function leaveGroup() {
  toggleJoin();
}
function handleJoinAction() {
  if (group.value?.join_pending) return;
  if (group.value?.joined) return toggleJoin();
  return openJoinSheet();
}
async function toggleComments(post) {
  if (activeCommentPostId.value === post._id) {
    activeCommentPostId.value = "";
    comments.value = [];
    commentDraft.value = "";
    return;
  }
  activeCommentPostId.value = post._id;
  commentsLoading.value = true;
  try {
    const result = await bridge.network.comments(groupId.value, post._id);
    comments.value = result?.list || [];
  } catch {
    toastError("评论加载失败，请稍后重试");
  } finally {
    commentsLoading.value = false;
  }
}
async function submitComment(post) {
  const content = commentDraft.value.trim();
  if (!content || commenting.value) return;
  commenting.value = true;
  try {
    const comment = await bridge.network.createComment(
      groupId.value,
      post._id,
      content,
    );
    if (comment) comments.value = [...comments.value, comment];
    post.comment_count = Number(post.comment_count || 0) + 1;
    commentDraft.value = "";
    uni.showToast({ title: "已回复", icon: "success" });
  } catch {
    toastError("评论失败，请稍后重试");
  } finally {
    commenting.value = false;
  }
}
async function acceptAnswer(post, comment) {
  if (!post?._id || !comment?._id) return;
  try {
    const updated = await bridge.network.acceptAnswer(groupId.value, post._id, comment._id);
    if (updated) Object.assign(post, updated);
    uni.showToast({ title: '已采纳这条回答', icon: 'success' });
  } catch (error) { toastError(error?.message || '采纳失败，请稍后重试'); }
}
async function toggleMemberFollow(member) {
  if (!member?.id || memberBusy(member)) return;
  followingMemberIds.value = new Set([...followingMemberIds.value, member.id]);
  try {
    const result = await bridge.follow.toggle(member.id);
    member.followed = !!result?.followed;
    uni.showToast({
      title: member.followed ? "已关注成员" : "已取消关注",
      icon: "none",
    });
  } catch {
    toastError("关注失败，请稍后重试");
  } finally {
    const next = new Set(followingMemberIds.value);
    next.delete(member.id);
    followingMemberIds.value = next;
  }
}
function showPostMenu(post) {
  uni.showActionSheet({
    itemList: ["复制动态", "举报内容", "少看这个人的动态"],
    success: async ({ tapIndex }) => {
      if (tapIndex === 0)
        uni.setClipboardData({
          data: post.content,
          success: () => uni.showToast({ title: "已复制", icon: "none" }),
        });
      if (tapIndex === 1) {
        try {
          await bridge.governance.report({
            target_type: "network_post",
            target_id: post._id,
            reason: "other",
            detail: "用户从群内动态菜单发起举报",
          });
          uni.showToast({ title: "已提交举报", icon: "none" });
        } catch {
          toastError("举报提交失败");
        }
      }
      if (tapIndex === 2 && post.author?.id) {
        try {
          await bridge.governance.mute({
            target_type: "user",
            target_id: post.author.id,
            duration_days: 30,
          });
          group.value.posts = (group.value.posts || []).filter(
            (item) => item.author?.id !== post.author.id,
          );
          uni.showToast({ title: "已减少这类内容", icon: "none" });
        } catch {
          toastError("操作失败");
        }
      }
    },
  });
}
function showMemberMenu(member) {
  if (!member?.id || member.role === "owner") return;
  uni.showActionSheet({
    itemList: ["屏蔽此人", "举报此人"],
    success: async ({ tapIndex }) => {
      try {
        if (tapIndex === 0) {
          await bridge.governance.block(member.id, "暂不希望看到对方内容");
          uni.showToast({ title: "已屏蔽此人", icon: "none" });
        }
        if (tapIndex === 1) {
          await bridge.governance.report({
            target_type: "user",
            target_id: member.id,
            reason: "other",
            detail: "用户从成员菜单发起举报",
          });
          uni.showToast({ title: "已提交举报", icon: "none" });
        }
      } catch {
        toastError("操作失败，请稍后重试");
      }
    },
  });
}
function goGroupChat() {
  if (group.value?.joined)
    uni.navigateTo({
      url: `/pages/network/group-chat?id=${encodeURIComponent(groupId.value)}&name=${encodeURIComponent(group.value?.name || "")}`,
    });
}
function goManageCenter() {
  if (group.value?.can_manage)
    uni.navigateTo({
      url: `/pages/network/manage?id=${encodeURIComponent(groupId.value)}`,
    });
}
function goProfile(id) {
  uni.navigateTo({ url: `/pages/profile/index?id=${id}` });
}
</script>

<style scoped lang="scss">
.network-detail-root {
  min-height: 100vh;
}
.page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  color: #27334f;
  background: #f5f7fb;
}
.cover-hero {
  position: relative;
  overflow: hidden;
  min-height: 300rpx;
  padding: 25rpx 24rpx 28rpx;
  color: #fff;
  box-sizing: border-box;
}
.cover-hero::after {
  position: absolute;
  right: -100rpx;
  bottom: -170rpx;
  width: 430rpx;
  height: 430rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  content: "";
  box-shadow:
    0 0 0 40rpx rgba(255, 255, 255, 0.04),
    0 0 0 80rpx rgba(255, 255, 255, 0.03);
}
.cover-decoration {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}
.decoration-one {
  top: -80rpx;
  right: 80rpx;
  width: 210rpx;
  height: 210rpx;
}
.decoration-two {
  bottom: 38rpx;
  right: 330rpx;
  width: 56rpx;
  height: 56rpx;
  background: rgba(255, 190, 145, 0.18);
}
.cover-topline {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.74);
  font-size: 17rpx;
}
.cover-top-actions {
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.cover-manage {
  padding: 7rpx 10rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.28);
  border-radius: 10rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
  font-size: 17rpx;
}
.cover-code {
  font-family: monospace;
  letter-spacing: 0.06em;
}
.hero-icon {
  position: relative;
  z-index: 1;
  width: 48rpx;
  height: 48rpx;
  margin-top: 30rpx;
  filter: brightness(0) invert(1);
  opacity: 0.9;
}
.hero-title {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 10rpx;
  color: #fff;
  font-size: 42rpx;
  font-weight: 760;
  letter-spacing: -0.05em;
}
.hero-desc {
  position: relative;
  z-index: 1;
  display: block;
  max-width: 650rpx;
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.7);
  font-size: 22rpx;
  line-height: 1.5;
}
.hero-meta {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 18rpx;
  color: rgba(255, 255, 255, 0.68);
  font-size: 18rpx;
}
.summary-card {
  position: relative;
  z-index: 2;
  margin: -24rpx 24rpx 22rpx;
  padding: 22rpx 20rpx 18rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 22rpx;
  background: #fff;
  box-shadow: 0 12rpx 28rpx rgba(70, 87, 123, 0.08);
}
.summary-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  text-align: center;
}
.summary-stats > view {
  display: flex;
  flex: 1;
  flex-direction: column;
}
.summary-num {
  color: #3e4b68;
  font-size: 32rpx;
  font-weight: 760;
}
.summary-label {
  margin-top: 5rpx;
  color: #9aa5b6;
  font-size: 19rpx;
}
.summary-stats > .summary-divider {
  display: block;
  width: 1rpx;
  height: 42rpx;
  flex: 0 0 auto;
  background: #eef0f4;
}
.join-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f2f6;
}
.join-hint {
  min-width: 0;
  color: #8d99ac;
  font-size: 19rpx;
}
.join-button {
  min-width: 126rpx;
  padding: 13rpx 20rpx;
  border-radius: 22rpx;
  color: #fff;
  background: #6573dc;
  font-size: 21rpx;
  font-weight: 700;
  text-align: center;
}
.join-button.joined {
  color: #2f9b82;
  background: #e8f7f2;
}
.branch-section,
.activity-section,
.members-section {
  margin: 0 24rpx;
}
.section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14rpx;
}
.section-eyebrow {
  display: block;
  color: #a0aabd;
  font-family: monospace;
  font-size: 17rpx;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.section-title {
  display: block;
  margin-top: 7rpx;
  color: #3b4864;
  font-size: 30rpx;
  font-weight: 760;
}
.section-link {
  color: #6875d8;
  font-size: 20rpx;
}
.branch-scroll {
  margin: 0 -24rpx;
  padding: 0 24rpx 3rpx;
  white-space: nowrap;
}
.branch-row {
  display: inline-flex;
  gap: 10rpx;
}
.branch-card {
  display: flex;
  align-items: center;
  width: 315rpx;
  padding: 14rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 17rpx;
  background: #fff;
  box-shadow: 0 7rpx 18rpx rgba(70, 87, 123, 0.03);
  box-sizing: border-box;
}
.branch-card.selected {
  border-color: #8c98e8;
  background: #f7f8ff;
}
.branch-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  margin-right: 11rpx;
  border-radius: 13rpx;
  color: #6573dc;
  background: #eef0ff;
  font-size: 27rpx;
}
.branch-copy {
  min-width: 0;
  flex: 1;
}
.branch-name,
.branch-meta {
  display: block;
}
.branch-name {
  overflow: hidden;
  color: #4a5670;
  font-size: 21rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.branch-meta {
  margin-top: 5rpx;
  color: #a0aabd;
  font-size: 17rpx;
}
.branch-arrow {
  color: #99a4b5;
  font-size: 23rpx;
}
.branch-selected {
  padding: 5rpx 8rpx;
  border-radius: 7rpx;
  color: #6573dc;
  background: #e9ebff;
  font-size: 15rpx;
  white-space: nowrap;
}
.events-section {
  margin: 25rpx 24rpx 0;
}
.opportunity-section { margin: 25rpx 24rpx 0; }.opportunity-list { display: flex; flex-direction: column; gap: 10rpx; }.opportunity-card { padding: 16rpx; border: 1rpx solid #e8ebf2; border-radius: 18rpx; background: #fff; }.opportunity-top,.opportunity-meta { display: flex; align-items: center; justify-content: space-between; gap: 12rpx; }.opportunity-type { padding: 4rpx 8rpx; border-radius: 5rpx; color: #5d6bc8; background: #eef0ff; font-size: 16rpx; }.opportunity-status { color: #2f9b82; font-size: 17rpx; }.opportunity-status.closed { color: #9da6b4; }.opportunity-title { display: block; margin-top: 10rpx; color: #41506a; font-size: 22rpx; font-weight: 740; }.opportunity-copy { display: -webkit-box; overflow: hidden; margin-top: 7rpx; color: #7e8a9d; font-size: 18rpx; line-height: 1.5; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.opportunity-meta { margin-top: 11rpx; color: #9ba6b5; font-size: 16rpx; }.opportunity-close { margin-left: auto; color: #6573dc; }
.event-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.event-card {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 7rpx 18rpx rgba(70, 87, 123, 0.03);
}
.event-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 67rpx;
  height: 67rpx;
  flex: 0 0 auto;
  border-radius: 16rpx;
  color: #5968d8;
  background: #eef0ff;
}
.event-date text:first-child {
  font-size: 15rpx;
}
.event-date text:last-child {
  margin-top: 2rpx;
  font-size: 27rpx;
  font-weight: 760;
}
.event-copy {
  min-width: 0;
  flex: 1;
}
.event-title,
.event-intro,
.event-meta,
.event-capacity {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-title {
  color: #4a5670;
  font-size: 21rpx;
  font-weight: 750;
}
.event-intro {
  margin-top: 5rpx;
  color: #8995a9;
  font-size: 17rpx;
}
.event-meta {
  margin-top: 6rpx;
  color: #6573dc;
  font-size: 16rpx;
}
.event-capacity {
  margin-top: 4rpx;
  color: #a0aabd;
  font-size: 15rpx;
}
.event-action {
  flex: 0 0 auto;
  padding: 9rpx 12rpx;
  border-radius: 13rpx;
  color: #fff;
  background: #6573dc;
  font-size: 17rpx;
  font-weight: 700;
}
.event-action.signed {
  color: #2f9b82;
  background: #e8f7f2;
}
.event-action.disabled {
  color: #aab3c0;
  background: #f1f3f6;
}
.event-action.pending {
  opacity: 0.55;
  pointer-events: none;
}
.event-waiting {
  display: block;
  margin-top: 5rpx;
  color: #b37b2e;
  font-size: 16rpx;
}
.event-action.waiting {
  color: #b37b2e;
  background: #fff4dd;
}
.content-tabs {
  display: flex;
  gap: 26rpx;
  margin: 25rpx 24rpx 14rpx;
  border-bottom: 1rpx solid #e8ebf2;
}
.content-tabs text {
  position: relative;
  padding-bottom: 12rpx;
  color: #9aa5b6;
  font-size: 23rpx;
}
.content-tabs text.active {
  color: #5968d8;
  font-weight: 750;
}
.content-tabs text.active::after {
  position: absolute;
  right: 0;
  bottom: -1rpx;
  left: 0;
  height: 4rpx;
  border-radius: 3rpx;
  background: #6573dc;
  content: "";
}
.post-composer {
  display: flex;
  align-items: flex-end;
  gap: 10rpx;
  margin-bottom: 13rpx;
  padding: 14rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 18rpx;
  background: #fff;
}
.composer-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50rpx;
  height: 50rpx;
  flex: 0 0 auto;
  border-radius: 16rpx;
  color: #fff;
  background: #6573dc;
  font-size: 19rpx;
  font-weight: 700;
}
.composer-input {
  min-height: 50rpx;
  flex: 1;
  color: #45516b;
  font-size: 21rpx;
  line-height: 1.5;
}
.composer-placeholder {
  color: #b1bac7;
}
.composer-send {
  padding: 10rpx 15rpx;
  border-radius: 15rpx;
  color: #fff;
  background: #6573dc;
  font-size: 20rpx;
  font-weight: 700;
}
.composer-send.disabled {
  opacity: 0.4;
}
.join-prompt {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 13rpx;
  padding: 16rpx;
  border: 1rpx solid #e4e7fb;
  border-radius: 18rpx;
  background: #f5f6ff;
}
.prompt-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 47rpx;
  height: 47rpx;
  border-radius: 14rpx;
  background: #e4e7fb;
}
.prompt-icon image {
  width: 25rpx;
  height: 25rpx;
  opacity: 0.7;
}
.prompt-copy {
  min-width: 0;
  flex: 1;
}
.prompt-copy text {
  display: block;
}
.prompt-copy text:first-child {
  color: #5a66c6;
  font-size: 21rpx;
  font-weight: 700;
}
.prompt-copy text:last-child {
  margin-top: 5rpx;
  color: #9ca7c6;
  font-size: 18rpx;
}
.prompt-action {
  color: #6573dc;
  font-size: 20rpx;
  font-weight: 700;
}
.post-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.post-card {
  padding: 19rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 20rpx;
  background: #fff;
  box-shadow: 0 8rpx 22rpx rgba(70, 87, 123, 0.035);
}
.post-author {
  display: flex;
  align-items: center;
}
.post-avatar,
.member-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 17rpx;
  color: #fff;
}
.post-avatar {
  width: 56rpx;
  height: 56rpx;
  margin-right: 11rpx;
}
.post-avatar text,
.member-avatar text {
  font-size: 23rpx;
  font-weight: 750;
}
.post-author-copy {
  min-width: 0;
  flex: 1;
}
.post-name,
.post-meta {
  display: block;
}
.post-name {
  color: #4a5670;
  font-size: 23rpx;
  font-weight: 700;
}
.post-meta {
  margin-top: 5rpx;
  overflow: hidden;
  color: #a0aabd;
  font-size: 17rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.post-more {
  color: #a9b2c0;
  font-size: 22rpx;
}
.post-content {
  display: block;
  margin: 15rpx 0 14rpx;
  color: #55617a;
  font-size: 24rpx;
  line-height: 1.6;
}
.post-actions {
  display: flex;
  align-items: center;
  gap: 22rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f0f2f6;
}
.accepted-answer { display: flex; gap: 8rpx; margin-top: 14rpx; padding: 11rpx 12rpx; border-left: 3rpx solid #5f9b83; color: #55665e; background: #f0f7f3; font-size: 18rpx; line-height: 1.45; }.accepted-label { flex: 0 0 auto; color: #2f9b82; font-weight: 700; }.accept-answer { display: inline-block; margin-top: 7rpx; color: #6573dc; font-size: 17rpx; }
.post-action {
  display: flex;
  align-items: center;
  gap: 5rpx;
  color: #9ca7b6;
  font-size: 18rpx;
}
.post-action.disabled,
.member-connect.disabled {
  opacity: 0.5;
  pointer-events: none;
}
.post-action image {
  width: 24rpx;
  height: 24rpx;
  opacity: 0.55;
}
.post-action-hint {
  margin-left: auto;
  color: #b2bbc7;
  font-size: 17rpx;
}
.member-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
}
.member-card {
  position: relative;
  padding: 20rpx 16rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 18rpx;
  background: #fff;
  text-align: center;
}
.member-avatar {
  width: 68rpx;
  height: 68rpx;
  margin: 0 auto 10rpx;
}
.member-name,
.member-company {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.member-name {
  color: #4a5670;
  font-size: 23rpx;
  font-weight: 700;
}
.member-company {
  margin-top: 5rpx;
  color: #a0aabd;
  font-size: 17rpx;
}
.member-role {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  padding: 4rpx 7rpx;
  border-radius: 6rpx;
  color: #b37b2e;
  background: #fff4dd;
  font-size: 14rpx;
}
.empty-card,
.state-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9aa5b6;
}
.empty-card {
  min-height: 200rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 20rpx;
  background: #fff;
  font-size: 21rpx;
}
.empty-card image,
.state-page image {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 13rpx;
  opacity: 0.35;
}
.empty-hint {
  margin-top: 8rpx;
  color: #b3bcc8;
  font-size: 18rpx;
}
.leave-link {
  margin: 24rpx auto 0;
  color: #b1bac7;
  font-size: 19rpx;
  text-align: center;
}
.state-page {
  min-height: 100vh;
  gap: 8rpx;
  font-size: 22rpx;
}
.state-action {
  color: #6573dc;
  font-size: 20rpx;
}
.loading-dot {
  width: 38rpx;
  height: 38rpx;
  margin-bottom: 13rpx;
  border: 4rpx solid #e3e6f8;
  border-top-color: #6573dc;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.feed-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  margin-bottom: 12rpx;
}
.feed-filter-scroll {
  min-width: 0;
  flex: 1;
  white-space: nowrap;
}
.feed-filter-row {
  display: inline-flex;
  gap: 8rpx;
}
.feed-filter {
  padding: 8rpx 14rpx;
  border: 1rpx solid #e7ebf3;
  border-radius: 17rpx;
  color: #9aa5b6;
  background: #fff;
  font-size: 18rpx;
  white-space: nowrap;
}
.feed-filter.active {
  border-color: #8b96e7;
  color: #5968d8;
  background: #eef0ff;
  font-weight: 700;
}
.feed-sort {
  flex: 0 0 auto;
  color: #6573dc;
  font-size: 18rpx;
}
.composer-main {
  min-width: 0;
  flex: 1;
}
.composer-footer {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 10rpx;
}
.post-type-scroll {
  min-width: 0;
  flex: 1;
  white-space: nowrap;
}
.post-type-row {
  display: inline-flex;
  gap: 7rpx;
}
.post-type-chip {
  padding: 6rpx 10rpx;
  border-radius: 8rpx;
  color: #a0aabd;
  background: #f6f7fa;
  font-size: 16rpx;
  white-space: nowrap;
}
.post-type-chip.active {
  color: #5968d8;
  background: #eef0ff;
}
.composer-counter {
  flex: 0 0 auto;
  color: #b1bac7;
  font-size: 15rpx;
}
.post-name-line {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.post-type-tag {
  padding: 4rpx 7rpx;
  border-radius: 6rpx;
  color: #6573dc;
  background: #eef0ff;
  font-size: 14rpx;
  white-space: nowrap;
}
.post-type-tag.type-experience {
  color: #2f9b82;
  background: #e8f7f2;
}
.post-type-tag.type-event {
  color: #b37b2e;
  background: #fff4dd;
}
.post-type-tag.type-question {
  color: #c76e62;
  background: #fff0ed;
}
.post-action.liked,
.post-action.active {
  color: #6573dc;
}
.post-action.liked image,
.post-action.active image {
  opacity: 1;
}
.compact-empty {
  min-height: 120rpx;
  margin-top: 12rpx;
}
.compact-empty .empty-hint {
  color: #6573dc;
}
.comment-thread {
  margin-top: 14rpx;
  padding: 13rpx;
  border-radius: 14rpx;
  background: #f8f9fc;
}
.comment-loading,
.comment-empty {
  color: #a0aabd;
  font-size: 17rpx;
  text-align: center;
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 11rpx;
}
.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
}
.comment-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34rpx;
  height: 34rpx;
  flex: 0 0 auto;
  border-radius: 11rpx;
  color: #fff;
  font-size: 15rpx;
  font-weight: 700;
}
.comment-copy {
  min-width: 0;
  flex: 1;
}
.comment-author {
  display: block;
  color: #59657c;
  font-size: 17rpx;
  font-weight: 700;
}
.comment-content {
  display: block;
  margin-top: 3rpx;
  color: #7e8a9e;
  font-size: 18rpx;
  line-height: 1.4;
}
.comment-time {
  color: #b1bac7;
  font-size: 15rpx;
}
.comment-compose {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 12rpx;
  padding-top: 10rpx;
  border-top: 1rpx solid #edf0f5;
}
.comment-input {
  min-width: 0;
  flex: 1;
  height: 54rpx;
  padding: 0 12rpx;
  border: 1rpx solid #e6e9f1;
  border-radius: 15rpx;
  color: #4a5670;
  background: #fff;
  font-size: 18rpx;
  box-sizing: border-box;
}
.comment-send {
  padding: 9rpx 13rpx;
  border-radius: 13rpx;
  color: #fff;
  background: #6573dc;
  font-size: 17rpx;
}
.member-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14rpx;
}
.member-toolbar-title,
.member-toolbar-desc {
  display: block;
}
.member-toolbar-title {
  color: #4a5670;
  font-size: 24rpx;
  font-weight: 750;
}
.member-toolbar-desc {
  margin-top: 5rpx;
  color: #a0aabd;
  font-size: 17rpx;
}
.member-toolbar-count {
  color: #6573dc;
  font-size: 19rpx;
}
.member-connect {
  display: inline-block;
  margin-top: 12rpx;
  padding: 6rpx 12rpx;
  border-radius: 13rpx;
  color: #6573dc;
  background: #eef0ff;
  font-size: 17rpx;
}
.sheet-mask {
  position: fixed;
  z-index: 20;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: flex-end;
  background: rgba(29, 37, 66, 0.38);
}
.join-sheet,
.branch-sheet,
.manage-sheet {
  width: 100%;
  padding: 17rpx 24rpx 26rpx;
  border-radius: 28rpx 28rpx 0 0;
  background: #fff;
  box-sizing: border-box;
}
.sheet-handle {
  width: 68rpx;
  height: 7rpx;
  margin: 0 auto 20rpx;
  border-radius: 5rpx;
  background: #e2e6ef;
}
.sheet-kicker {
  display: block;
  color: #a0aabd;
  font-family: monospace;
  font-size: 16rpx;
  font-weight: 700;
  letter-spacing: 0.1em;
}
.sheet-title {
  display: block;
  margin-top: 8rpx;
  color: #3b4864;
  font-size: 29rpx;
  font-weight: 760;
}
.sheet-desc {
  display: block;
  margin-top: 8rpx;
  color: #8d99ac;
  font-size: 19rpx;
  line-height: 1.5;
}
.sheet-label {
  display: block;
  margin-top: 19rpx;
  color: #59657c;
  font-size: 20rpx;
  font-weight: 700;
}
.sheet-optional {
  color: #b1bac7;
  font-size: 16rpx;
  font-weight: 400;
}
.sheet-branch-scroll {
  margin: 10rpx -24rpx 0;
  padding: 0 24rpx;
  white-space: nowrap;
}
.sheet-branch-row {
  display: inline-flex;
  gap: 9rpx;
}
.sheet-branch {
  display: flex;
  flex-direction: column;
  min-width: 190rpx;
  padding: 12rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 15rpx;
  color: #6573dc;
  background: #fff;
  box-sizing: border-box;
}
.sheet-branch text:first-child {
  font-size: 19rpx;
  font-weight: 700;
}
.sheet-branch text:last-child {
  margin-top: 5rpx;
  color: #a0aabd;
  font-size: 16rpx;
}
.sheet-branch.active {
  border-color: #8b96e7;
  background: #eef0ff;
}
.intent-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 9rpx;
  margin-top: 10rpx;
}
.intent-chip {
  padding: 9rpx 15rpx;
  border: 1rpx solid #e8ebf2;
  border-radius: 18rpx;
  color: #8d99ac;
  background: #fff;
  font-size: 18rpx;
}
.intent-chip.active {
  border-color: #8b96e7;
  color: #5968d8;
  background: #eef0ff;
}
.sheet-confirm {
  margin-top: 22rpx;
  padding: 14rpx;
  border-radius: 18rpx;
  color: #fff;
  background: #6573dc;
  font-size: 21rpx;
  font-weight: 700;
  text-align: center;
}
.sheet-confirm.disabled {
  opacity: 0.45;
  pointer-events: none;
}
.sheet-cancel {
  display: block;
  margin-top: 15rpx;
  color: #a0aabd;
  font-size: 18rpx;
  text-align: center;
}
.opportunity-input,.opportunity-textarea { display: block; width: 100%; margin-top: 16rpx; padding: 13rpx 0; border-bottom: 1rpx solid #e4e8f0; color: #42506a; font-size: 21rpx; box-sizing: border-box; }.opportunity-textarea { min-height: 150rpx; line-height: 1.55; }
.branch-sheet-stats {
  display: flex;
  gap: 20rpx;
  margin-top: 17rpx;
  color: #6573dc;
  font-size: 19rpx;
}
.manage-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}
.manage-count {
  color: #6573dc;
  font-size: 20rpx;
}
.manage-list {
  max-height: 620rpx;
  margin: 16rpx -24rpx 0;
  padding: 0 24rpx;
  box-sizing: border-box;
}
.manage-member {
  display: flex;
  align-items: center;
  gap: 11rpx;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #f0f2f6;
}
.manage-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 57rpx;
  height: 57rpx;
  flex: 0 0 auto;
  border-radius: 17rpx;
  color: #fff;
}
.manage-avatar text {
  font-size: 22rpx;
  font-weight: 700;
}
.manage-member-copy {
  min-width: 0;
  flex: 1;
}
.manage-name-line {
  display: flex;
  align-items: center;
  gap: 7rpx;
}
.manage-name {
  overflow: hidden;
  color: #4a5670;
  font-size: 21rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.manage-meta {
  display: block;
  margin-top: 5rpx;
  overflow: hidden;
  color: #a0aabd;
  font-size: 17rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.role-badge {
  padding: 4rpx 7rpx;
  border-radius: 6rpx;
  color: #6573dc;
  background: #eef0ff;
  font-size: 14rpx;
  white-space: nowrap;
}
.role-badge.owner {
  color: #b37b2e;
  background: #fff4dd;
}
.manage-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
  flex: 0 0 auto;
}
.manage-action {
  color: #6573dc;
  font-size: 16rpx;
  white-space: nowrap;
}
.manage-action.danger {
  color: #d86b59;
}
.manage-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 200rpx;
  color: #a0aabd;
  font-size: 18rpx;
}
.manage-loading .loading-dot {
  width: 28rpx;
  height: 28rpx;
  margin: 0;
}
.manage-empty {
  padding: 70rpx 0;
  color: #a0aabd;
  font-size: 19rpx;
  text-align: center;
}
.hero-icon {
  display: block;
  object-fit: contain;
}
.prompt-icon image,
.empty-card image,
.state-page image,
.post-action image {
  display: block;
  object-fit: contain;
}
.event-recap {
  display: block;
  margin-top: 6rpx;
  overflow: hidden;
  color: #6e7b91;
  font-size: 16rpx;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 视觉收口：社群页用分组强调色，不让蓝色承担所有状态。 */
.network-detail-root,
.page {
  color: #1f2329;
  background: #f5f6f8;
}
.cover-topline,
.cover-manage {
  color: rgba(255, 255, 255, 0.92);
}
.summary-card,
.branch-card,
.event-card,
.post-composer,
.post-card,
.member-card,
.empty-card {
  border-color: #e5e6eb;
  box-shadow: 0 2rpx 8rpx rgba(31, 35, 41, 0.03);
}
.branch-card.selected {
  border-color: #b7d4c5;
  background: #f1f8f3;
}
.branch-mark,
.prompt-icon,
.composer-avatar {
  color: #356653;
  background: #eaf4ee;
}
.branch-selected,
.section-link,
.feed-sort,
.member-toolbar-count,
.manage-count,
.state-action {
  color: #4c8067;
}
.event-date {
  color: #8b6535;
  background: #fff3df;
}
.event-action,
.composer-send,
.comment-send,
.sheet-confirm {
  color: #fff;
  background: #4c8067;
  border-radius: 8rpx;
}
.event-action.signed,
.event-action.waiting {
  color: #087f5b;
  background: #e8f8f2;
}
.content-tabs text.active {
  color: #4c8067;
}
.content-tabs text.active::after {
  background: #4c8067;
}
.post-type-chip.active,
.post-type-tag,
.feed-filter.active,
.member-connect {
  color: #356653;
  background: #eaf4ee;
  border-color: #b7d4c5;
}
.post-type-tag.type-experience {
  color: #087f5b;
  background: #e8f8f2;
}
.post-type-tag.type-event {
  color: #ad6800;
  background: #fff7e6;
}
.post-type-tag.type-question {
  color: #c41d7f;
  background: #fff0f6;
}
.post-action.liked,
.post-action.active {
  color: #4c8067;
}
.loading-dot {
  border-color: #d8e9df;
  border-top-color: #4c8067;
}
.join-sheet,
.branch-sheet,
.manage-sheet {
  border-radius: 16rpx 16rpx 0 0;
}
.sheet-branch.active,
.intent-chip.active {
  border-color: #b7d4c5;
  color: #356653;
  background: #eaf4ee;
}
.role-badge {
  color: #356653;
  background: #eaf4ee;
}
.role-badge.owner,
.member-role {
  color: #ad6800;
  background: #fff7e6;
}
.comment-send {
  padding: 9rpx 13rpx;
}

/* 社群详情包含多个横向滚动区和动态内容，所有非滚动列都要能收缩。 */
.network-detail-root,
.page {
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  box-sizing: border-box;
}
.cover-topline,
.cover-top-actions,
.hero-meta,
.section-heading,
.event-card,
.opportunity-top,
.opportunity-meta,
.post-author,
.post-name-line,
.member-toolbar,
.manage-header {
  min-width: 0;
}
.cover-label,
.hero-title,
.hero-desc,
.hero-meta > text,
.section-heading > view:first-child,
.opportunity-title,
.opportunity-copy,
.post-name,
.post-content,
.member-toolbar > view:first-child {
  min-width: 0;
  max-width: 100%;
}
.cover-label,
.hero-title,
.hero-desc,
.opportunity-title,
.opportunity-copy,
.post-content {
  overflow-wrap: anywhere;
  word-break: break-word;
}
.cover-label,
.hero-meta > text:first-child,
.section-heading > view:first-child,
.post-author-copy,
.member-toolbar > view:first-child {
  flex: 1;
  overflow: hidden;
}
.cover-top-actions {
  max-width: 72%;
  flex: 0 1 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.hero-meta > text:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hero-meta > text:last-child,
.section-link,
.event-action,
.branch-selected,
.post-more,
.member-toolbar-count { flex: 0 0 auto; }
.section-heading { gap: 14rpx; }
.branch-card { flex: 0 0 315rpx; }
.event-copy,
.opportunity-card,
.post-author-copy,
.comment-copy { min-width: 0; }
.event-copy,
.opportunity-card,
.post-author-copy { overflow: hidden; }
.opportunity-meta { flex-wrap: wrap; }
.opportunity-meta > text:first-child { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-more { margin-left: 8rpx; }
.accepted-answer,
.comment-content { min-width: 0; overflow-wrap: anywhere; word-break: break-word; }
.content-tabs { min-width: 0; }
.join-sheet,
.branch-sheet,
.manage-sheet { max-width: 100%; max-height: 84vh; overflow-y: auto; }
.manage-member-copy,
.manage-name-line { min-width: 0; }
.manage-name { flex: 1; min-width: 0; }
.manage-actions { flex: 0 0 auto; }

@media (max-width: 360px) {
  .member-grid { grid-template-columns: minmax(0, 1fr); }
  .content-tabs { gap: 17rpx; }
  .cover-top-actions { max-width: 78%; gap: 8rpx; }
  .cover-manage { padding-right: 7rpx; padding-left: 7rpx; }
}
</style>
