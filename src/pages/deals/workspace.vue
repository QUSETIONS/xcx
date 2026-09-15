<template>
  <view class="page">
    <view v-if="loading" class="state-page"><view class="spinner" /><text>正在打开协作室…</text></view>
    <view v-else-if="!workspace" class="state-page"><text>项目协作室暂时没打开</text><view class="retry" @tap="loadWorkspace">重新加载</view></view>
    <template v-else>
      <view class="project-header">
        <text class="eyebrow">PROJECT WORKSPACE</text>
        <view class="title-row"><text class="project-title">{{ workspace.demand_title }}</text><text class="project-status" :class="`status-${workspace.status}`">{{ dealStatus }}</text></view>
        <text class="project-meta">{{ workspace.provider_name || '合作团队' }} · {{ money(workspace.amount) }} · {{ workspace.status === 'in_progress' ? '协作进行中' : '项目已归档' }}</text>
        <view class="project-guard"><text>{{ confidentialityLabel(workspace.collaboration_settings?.confidentiality) }}</text><text>·</text><text>{{ visibilityLabel(workspace.collaboration_settings?.visibility) }}</text></view>
      </view>

      <view v-if="workspace.commercial_proposal" class="commercial-strip">
        <view><text class="strip-label">COMMERCIAL BASELINE</text><text class="strip-title">已选方案与合作范围</text></view>
        <view class="strip-value"><text>{{ money(workspace.commercial_proposal.quote_amount || workspace.amount) }}</text><text v-if="workspace.commercial_proposal.estimated_days">{{ workspace.commercial_proposal.estimated_days }} 天周期</text></view>
        <text v-if="workspace.commercial_proposal.provider_message" class="strip-copy">{{ workspace.commercial_proposal.provider_message }}</text>
      </view>

      <view class="summary-row">
        <view class="summary-cell"><text class="summary-value">{{ workspace.workspace_summary?.members || 0 }}</text><text>协作成员</text></view>
        <view class="summary-cell"><text class="summary-value">{{ workspace.workspace_summary?.tasks?.in_progress || 0 }}</text><text>进行中待办</text></view>
        <view class="summary-cell"><text class="summary-value">{{ milestoneProgress }}%</text><text>交付进度</text></view>
      </view>

      <view v-if="focusItems.length" class="focus-strip">
        <view class="focus-head"><view><text class="section-label">NEXT UP</text><text class="focus-title">先处理这些事项</text></view><text class="focus-count">{{ focusItems.length }} 项</text></view>
        <view v-for="item in focusItems.slice(0, 3)" :key="item.key" class="focus-row" :class="`focus-${item.tone}`" @tap="openFocusItem(item)">
          <view class="focus-dot" /><view class="focus-copy"><text>{{ item.title }}</text><text>{{ item.meta }}</text></view><text class="focus-action">查看</text>
        </view>
      </view>

      <view class="tabs">
        <text v-for="item in tabs" :key="item.id" class="tab" :class="{ active: activeTab === item.id }" @tap="activeTab = item.id">{{ item.label }}</text>
      </view>

      <template v-if="activeTab === 'overview'">
        <section class="project-control-section">
          <view class="section-head control-head">
            <view><text class="section-label">PROJECT CONTROL</text><text class="section-title">项目驾驶舱</text></view>
            <view class="control-stage-copy"><text>当前阶段</text><text>{{ currentProjectStage.title }}</text></view>
          </view>

          <view class="project-stage-line">
            <view v-for="stage in projectStages" :key="stage.id" class="stage-step" :class="{ complete: stage.index < projectStageIndex, active: stage.index === projectStageIndex }">
              <view class="stage-mark"><text>{{ stage.index + 1 }}</text></view>
              <view class="stage-copy"><text>{{ stage.title }}</text><text>{{ stage.copy }}</text></view>
            </view>
          </view>

          <view class="control-ledger">
            <view class="control-item" @tap="openWorkspaceTab('schedule')">
              <text class="control-index">01</text>
              <view class="control-copy"><text class="control-label">会议与回访</text><text class="control-value">{{ nextMeeting?.title || '尚未安排会议' }}</text><text class="control-meta">{{ nextMeeting ? `${meetingDate(nextMeeting.starts_at)} · ${meetingTime(nextMeeting.starts_at)}` : '安排一次对齐会，确定下一步节奏' }}</text></view>
              <text class="control-arrow">→</text>
            </view>
            <view class="control-item" @tap="openWorkspaceTab('tasks')">
              <text class="control-index">02</text>
              <view class="control-copy"><text class="control-label">推进待办</text><text class="control-value">{{ nextOpenTask?.title || '暂时没有待办' }}</text><text class="control-meta">{{ openTasks.length ? `还有 ${openTasks.length} 项待办需要推进` : '记录关键下一步，让协作持续发生' }}</text></view>
              <text class="control-arrow">→</text>
            </view>
            <view class="control-item" @tap="openWorkspaceTab('delivery')">
              <text class="control-index">03</text>
              <view class="control-copy"><text class="control-label">交付与验收</text><text class="control-value">{{ completedMilestones }}/{{ workspace.milestones?.length || 0 }} 个节点完成</text><text class="control-meta">{{ pendingDeliverables.length ? `${pendingDeliverables.length} 条交付记录等待处理` : '交付物与验收记录集中留存' }}</text></view>
              <text class="control-arrow">→</text>
            </view>
            <view class="control-item" @tap="openWorkspaceTab('files')">
              <text class="control-index">04</text>
              <view class="control-copy"><text class="control-label">共享文件</text><text class="control-value">{{ workspace.files?.length || 0 }} 份项目文件</text><text class="control-meta">{{ workspace.messages?.length || 0 }} 条项目讨论可追溯</text></view>
              <text class="control-arrow">→</text>
            </view>
          </view>

          <view v-if="latestActivity" class="project-signal" @tap="openWorkspaceTab('activity')">
            <view class="signal-copy"><text class="section-label">LATEST RECORD</text><text><text v-if="latestActivity.actor_name && latestActivity.actor_name !== '系统'">{{ latestActivity.actor_name }} · </text>{{ latestActivity.content }}</text></view>
            <text class="signal-action">查看动态 →</text>
          </view>
        </section>

        <section v-if="workspace.status === 'in_progress' && kickoffChecks.length" class="kickoff-section">
          <view class="section-head kickoff-head">
            <view><text class="section-label">STARTUP CHECKLIST</text><text class="section-title">把第一周推进得有序</text></view>
            <view class="kickoff-progress"><text>{{ kickoffCompletedCount }}/{{ kickoffChecks.length }}</text><text>已就绪</text></view>
          </view>
          <text class="kickoff-copy">协作室会根据真实的成员、会议、待办和交付节点持续更新。未完成的项目，直接从这里开始。</text>
          <view class="kickoff-list">
            <view v-for="item in kickoffChecks" :key="item.id" class="kickoff-row" :class="{ complete: item.complete }" @tap="handleKickoffCheck(item)">
              <view class="kickoff-mark"><text>{{ item.complete ? '✓' : item.index }}</text></view>
              <view class="kickoff-item-copy"><text>{{ item.title }}</text><text>{{ item.copy }}</text></view>
              <text class="kickoff-action">{{ item.complete ? '查看' : item.action }} →</text>
            </view>
          </view>
        </section>

        <section class="section">
          <view class="section-head"><view><text class="section-label">PEOPLE</text><text class="section-title">正在协作的人</text></view><view v-if="workspace.permissions?.can_manage && workspace.status === 'in_progress'" class="head-actions"><text class="text-action" @tap="openSettingsSheet">项目权限</text><text class="text-action" @tap="openMemberPicker">添加成员</text></view></view>
          <view class="member-list">
            <view v-for="(member, index) in workspace.members" :key="member._id" class="member-row">
              <view class="member-avatar" :class="`avatar-${index % 4}`"><text>{{ initial(member.display_name) }}</text></view>
              <view class="member-copy"><text class="member-name">{{ member.display_name }}</text><text class="member-meta">{{ collaborationRoleLabel(member.collaboration_role, member.role) }} · {{ accessLabel(member.access_level) }}<text v-if="member.company"> · {{ member.company }}</text></text></view>
              <text v-if="canRemove(member)" class="member-remove" @tap="removeMember(member)">移除</text>
            </view>
          </view>
        </section>

        <section class="section milestone-section">
          <view class="section-head"><view><text class="section-label">MILESTONES</text><text class="section-title">交付节点</text></view><text class="section-note">{{ completedMilestones }}/{{ workspace.milestones?.length || 0 }} 已完成</text></view>
          <view v-if="workspace.milestones?.length" class="milestone-list">
            <view v-for="item in workspace.milestones" :key="item._id" class="milestone-row" :class="`milestone-${item.status}`">
              <view class="milestone-mark" @tap="advanceMilestone(item)"><text>{{ item.status === 'completed' ? '✓' : item.status === 'in_progress' ? '→' : '·' }}</text></view>
              <view class="milestone-copy"><text class="milestone-name">{{ item.title }}</text><text class="milestone-meta">{{ milestoneLabel(item.status) }}<text v-if="item.amount"> · {{ money(item.amount) }}</text></text></view>
              <text v-if="workspace.status === 'in_progress' && item.status !== 'completed'" class="row-action" @tap="advanceMilestone(item)">{{ item.status === 'pending' ? '开始' : '完成' }}</text>
            </view>
          </view>
          <view v-else class="section-empty">还没有交付节点。先在项目进度中补充一个双方认可的阶段。</view>
        </section>
      </template>

      <template v-else-if="activeTab === 'conversation'">
        <section class="section conversation-section">
          <view class="section-head"><view><text class="section-label">PROJECT DISCUSSION</text><text class="section-title">把共识留在项目里</text></view><text class="section-note">{{ workspace.messages?.length || 0 }} 条讨论</text></view>
          <view v-if="workspace.messages?.length" class="message-list">
            <view v-for="message in workspace.messages" :key="message._id" class="message-row" :class="{ mine: message.sender_id === currentUserId }">
              <view class="message-avatar"><text>{{ initial(message.sender_name) }}</text></view>
              <view class="message-body"><text class="message-author">{{ message.sender_id === currentUserId ? '我' : message.sender_name }}</text><text v-if="message.content" class="message-content">{{ message.content }}</text><view v-for="attachment in message.attachments || []" :key="attachment.id" class="message-attachment" @tap="openFile({ attachment })"><text>{{ fileKind(attachment) }}</text><text>{{ attachment.name }}</text></view><text class="message-time">{{ simpleDateTime(message.created_at) }}</text></view>
            </view>
          </view>
          <view v-else class="section-empty">先说清楚目标、决定和下一步，后来加入的人也能快速跟上。</view>
          <view v-if="workspace.permissions?.can_edit && workspace.status === 'in_progress'" class="discussion-composer"><textarea v-model="messageText" maxlength="2000" auto-height placeholder="记录一个决定，或问项目里的伙伴…" placeholder-class="note-placeholder" @input="onMessageInput" /><view class="composer-actions"><text class="attachment-action" @tap="chooseMessageAttachment">添加附件</text><text class="note-send" :class="{ disabled: (!messageText.trim() && !messageAttachments.length) || messageSaving }" @tap="sendMessage">{{ messageSaving ? '发送中…' : '发送' }}</text></view><view v-if="messageAttachments.length" class="pending-attachments"><text v-for="item in messageAttachments" :key="item.id">{{ item.name }}</text></view><text v-if="messageSendFailed" class="message-retry-hint">发送未完成，草稿已保留，点击“发送”重试</text></view>
        </section>
      </template>

      <template v-else-if="activeTab === 'tasks'">
        <section class="section">
          <view class="section-head"><view><text class="section-label">TASKS</text><text class="section-title">把下一步说清楚</text></view><text v-if="workspace.status === 'in_progress'" class="text-action" @tap="openTaskSheet">新增待办</text></view>
          <view v-if="workspace.tasks?.length" class="task-list">
            <view v-for="task in workspace.tasks" :key="task._id" class="task-row" :class="[`task-${task.status}`, `due-${taskReminder(task)}`]">
              <view class="task-check" @tap="advanceTask(task)"><text>{{ task.status === 'done' ? '✓' : '' }}</text></view>
              <view class="task-copy"><text class="task-title">{{ task.title }}</text><text v-if="task.description" class="task-desc">{{ task.description }}</text><text class="task-meta"><text v-if="task.assignee_name">{{ task.assignee_name }}</text><text v-if="task.assignee_name && task.due_at"> · </text><text v-if="task.due_at" :class="`task-due due-${taskReminder(task)}`">{{ taskDueCopy(task) }}</text><text v-if="!task.assignee_name && !task.due_at">待分配</text></text></view>
              <text v-if="task.status !== 'done'" class="row-action" @tap="advanceTask(task)">{{ task.status === 'todo' ? '开始' : '完成' }}</text>
            </view>
          </view>
          <view v-else class="section-empty">暂时没有待办。把最需要推进的一件事先写下来。</view>
        </section>
      </template>

      <template v-else-if="activeTab === 'delivery'">
        <section class="section milestone-section">
          <view class="section-head"><view><text class="section-label">MILESTONES</text><text class="section-title">交付节点</text></view><text class="section-note">{{ completedMilestones }}/{{ workspace.milestones?.length || 0 }} 已完成</text></view>
          <view v-if="workspace.milestones?.length" class="milestone-list"><view v-for="item in workspace.milestones" :key="item._id" class="milestone-row" :class="`milestone-${item.status}`"><view class="milestone-mark" @tap="advanceMilestone(item)"><text>{{ item.status === 'completed' ? '✓' : item.status === 'in_progress' ? '→' : '·' }}</text></view><view class="milestone-copy"><text class="milestone-name">{{ item.title }}</text><text class="milestone-meta">{{ milestoneLabel(item.status) }}<text v-if="item.amount"> · {{ money(item.amount) }}</text></text></view><text v-if="workspace.permissions?.can_edit && workspace.status === 'in_progress' && item.status !== 'completed'" class="row-action" @tap="advanceMilestone(item)">{{ item.status === 'pending' ? '开始' : '完成' }}</text></view></view>
        </section>
        <section class="section">
          <view class="section-head"><view><text class="section-label">DELIVERY RECORD</text><text class="section-title">交付与验收</text></view><text v-if="workspace.permissions?.can_edit && workspace.status === 'in_progress'" class="text-action" @tap="openDeliverableSheet">提交交付</text></view>
          <view v-if="workspace.deliverables?.length" class="deliverable-list"><view v-for="item in workspace.deliverables" :key="item._id" class="deliverable-row"><view class="deliverable-status" :class="`deliverable-${item.status}`"><text>{{ deliverableMark(item.status) }}</text></view><view class="deliverable-copy"><text class="deliverable-title">{{ item.title }}</text><text class="deliverable-meta">{{ item.milestone_title || '未关联节点' }} · {{ deliverableStatusLabel(item.status) }} · {{ item.submitter_name }}</text><text v-if="item.description" class="deliverable-desc">{{ item.description }}</text><text v-if="item.attachment" class="deliverable-file" @tap="openFile({ attachment: item.attachment })">查看附件</text></view><text v-if="workspace.permissions?.can_manage && item.status !== 'accepted'" class="row-action" @tap="updateDeliverable(item, item.status === 'submitted' ? 'accepted' : 'submitted')">{{ item.status === 'submitted' ? '确认' : '重开' }}</text></view></view>
          <view v-else class="section-empty">方案、成品和验收说明都可作为一条交付记录留存。</view>
        </section>
      </template>

      <template v-else-if="activeTab === 'schedule'">
        <section class="section meeting-room-section">
          <view class="section-head"><view><text class="section-label">PROJECT CALENDAR</text><text class="section-title">会议与回访</text></view><text v-if="workspace.permissions?.can_edit && workspace.status === 'in_progress'" class="text-action" @tap="openMeetingSheet">安排会议</text></view>

          <view v-if="nextMeeting" class="meeting-brief" :class="`brief-${meetingReminder(nextMeeting)}`">
            <view class="meeting-brief-date"><text>{{ meetingDate(nextMeeting.starts_at) }}</text><text>{{ meetingTime(nextMeeting.starts_at) }}</text></view>
            <view class="meeting-brief-copy"><text class="meeting-brief-label">NEXT SESSION</text><text class="meeting-brief-title">{{ nextMeeting.title }}</text><text class="meeting-brief-meta">{{ meetingTypeLabel(nextMeeting.meeting_type) }} · {{ nextMeeting.location || meetingLocationPlaceholder(nextMeeting) }}</text><text v-if="nextMeeting.agenda" class="meeting-brief-agenda">{{ nextMeeting.agenda }}</text></view>
            <view class="meeting-brief-actions"><text v-if="meetingDueCopy(nextMeeting)" class="meeting-brief-reminder">{{ meetingDueCopy(nextMeeting) }}</text><text v-if="nextMeeting.location" class="meeting-link-action" @tap="copyMeetingLocation(nextMeeting)">{{ meetingLinkActionLabel(nextMeeting) }}</text><text v-if="workspace.permissions?.can_edit" class="meeting-complete-action" @tap="completeMeeting(nextMeeting)">标记完成</text></view>
          </view>

          <view v-if="followUpMeetings.length" class="meeting-ledger">
            <text class="meeting-ledger-label">UPCOMING · {{ followUpMeetings.length }}</text>
            <view v-for="meeting in followUpMeetings" :key="meeting._id" class="meeting-row" :class="`meeting-${meetingReminder(meeting)}`">
              <view class="meeting-date"><text>{{ meetingDate(meeting.starts_at) }}</text><text>{{ meetingTime(meeting.starts_at) }}</text></view>
              <view class="meeting-copy"><text class="meeting-title">{{ meeting.title }}</text><text class="meeting-meta">{{ meetingTypeLabel(meeting.meeting_type) }} · {{ meeting.location || meetingLocationPlaceholder(meeting) }}</text><text v-if="meeting.agenda" class="meeting-agenda">{{ meeting.agenda }}</text></view>
              <text v-if="meeting.location" class="meeting-copy-action" @tap="copyMeetingLocation(meeting)">复制</text>
              <text v-if="workspace.permissions?.can_edit" class="row-action" @tap="completeMeeting(meeting)">完成</text>
            </view>
          </view>

          <view v-if="meetingHistory.length" class="meeting-ledger meeting-history">
            <text class="meeting-ledger-label">PAST &amp; CLOSED · {{ meetingHistory.length }}</text>
            <view v-for="meeting in meetingHistory" :key="meeting._id" class="meeting-row">
              <view class="meeting-date"><text>{{ meetingDate(meeting.starts_at) }}</text><text>{{ meetingTime(meeting.starts_at) }}</text></view>
              <view class="meeting-copy"><text class="meeting-title">{{ meeting.title }}</text><text class="meeting-meta">{{ meetingTypeLabel(meeting.meeting_type) }} · {{ meetingStatusLabel(meeting.status) }}<text v-if="meeting.location"> · {{ meeting.location }}</text></text></view>
              <text class="meeting-status">{{ meetingStatusLabel(meeting.status) }}</text>
            </view>
          </view>

          <view v-if="!workspace.meetings?.length" class="section-empty meeting-empty"><text>先安排一次项目对齐会。</text><text>邀请会同步给项目成员，并出现在站内提醒里。</text></view>
        </section>
      </template>

      <template v-else-if="activeTab === 'files'">
        <section class="section">
          <view class="section-head"><view><text class="section-label">FILES</text><text class="section-title">共享文件</text></view><text v-if="workspace.status === 'in_progress'" class="text-action" @tap="chooseFile">上传文件</text></view>
          <view v-if="fileBusy" class="upload-state"><view class="tiny-spinner" />正在上传并共享…</view>
          <view v-else-if="workspace.files?.length" class="file-list">
            <view v-for="file in workspace.files" :key="file._id" class="file-row" @tap="openFile(file)">
              <view class="file-kind"><text>{{ fileKind(file.attachment) }}</text></view>
              <view class="file-copy"><text class="file-name">{{ file.attachment?.name || '项目文件' }}</text><text class="file-meta">{{ file.uploader_name || '项目成员' }}<text v-if="file.attachment?.size"> · {{ fileSize(file.attachment.size) }}</text><text v-if="file.description"> · {{ file.description }}</text></text><text v-if="file.access_scope === 'restricted'" class="file-restricted">指定成员</text></view>
              <view class="file-actions"><text v-if="file.permissions?.can_manage" class="file-manage" @tap.stop="openFilePermissionSheet(file)">权限</text><text class="file-open">{{ file.permissions?.can_download ? '打开' : '查看' }}</text></view>
            </view>
          </view>
          <view v-else class="section-empty">方案、清单和验收材料会在这里集中保存。</view>
        </section>
      </template>

      <template v-else>
        <section class="section">
          <view class="section-head"><view><text class="section-label">ACTIVITY</text><text class="section-title">项目动态</text></view></view>
          <view class="note-composer"><textarea v-model="activityText" maxlength="600" auto-height placeholder="补充进展、决策或需要协助的事项…" placeholder-class="note-placeholder" /><view class="note-send" :class="{ disabled: !activityText.trim() || activitySaving }" @tap="postActivity"><text>{{ activitySaving ? '发送中…' : '发布动态' }}</text></view></view>
          <view v-if="workspace.activities?.length" class="activity-list">
            <view v-for="activity in workspace.activities" :key="activity._id" class="activity-row">
              <view class="activity-dot" :class="`activity-${activity.type}`" />
              <view class="activity-copy"><text class="activity-content"><text v-if="activity.actor_name && activity.actor_name !== '系统'" class="activity-author">{{ activity.actor_name }} </text>{{ activity.content }}</text><text class="activity-time">{{ simpleDateTime(activity.created_at) }}</text></view>
            </view>
          </view>
          <view v-else class="section-empty">协作过程中的关键决定会在这里留下记录。</view>
        </section>
      </template>
    </template>

    <view v-if="showTaskSheet" class="sheet-mask" @tap="showTaskSheet = false"><view class="sheet" @tap.stop><text class="sheet-label">NEW TASK</text><text class="sheet-title">新增一条待办</text><input v-model="taskForm.title" class="sheet-input" maxlength="120" placeholder="例如：确认首轮方案和预算范围" /><textarea v-model="taskForm.description" class="sheet-textarea" maxlength="500" placeholder="补充交付标准或背景（可选）" /><picker :range="memberChoices" range-key="label" @change="onAssigneeChange"><view class="picker-field"><text>{{ selectedAssigneeLabel }}</text><text>›</text></view></picker><picker mode="date" @change="onDueDateChange"><view class="picker-field"><text>{{ taskForm.due_at ? `截止 ${taskForm.due_at}` : '设置截止日期（可选）' }}</text><text>›</text></view></picker><view class="sheet-actions"><text class="sheet-cancel" @tap="showTaskSheet = false">取消</text><text class="sheet-submit" :class="{ disabled: taskSaving }" @tap="submitTask">{{ taskSaving ? '保存中…' : '添加待办' }}</text></view></view></view>

    <view v-if="showMemberSheet" class="sheet-mask" @tap="showMemberSheet = false"><view class="sheet member-sheet" @tap.stop><view class="sheet-head"><view><text class="sheet-label">ADD COLLABORATOR</text><text class="sheet-title">添加协作成员</text></view><text class="sheet-close" @tap="showMemberSheet = false">×</text></view><text class="sheet-field-label">加入后扮演的角色</text><view class="choice-grid member-role-grid"><text v-for="option in memberRoleOptions" :key="option.value" class="choice-item" :class="{ selected: memberInviteForm.collaboration_role === option.value }" @tap="memberInviteForm.collaboration_role = option.value">{{ option.label }}</text></view><view class="choice-grid compact"><text v-for="option in memberAccessOptions" :key="option.value" class="choice-item" :class="{ selected: memberInviteForm.access_level === option.value }" @tap="memberInviteForm.access_level = option.value">{{ option.label }}</text></view><input v-model="memberKeyword" class="sheet-input" placeholder="搜索姓名、公司或业务方向" @confirm="loadPeople" /><view v-if="memberLoading" class="picker-loading">正在查找成员…</view><scroll-view v-else scroll-y class="people-picker"><view v-for="person in memberCandidates" :key="person.id || person._id" class="candidate-row" @tap="addMember(person)"><view class="candidate-avatar"><text>{{ initial(person.nickname) }}</text></view><view class="candidate-copy"><text>{{ person.nickname || '平台成员' }}</text><text>{{ person.company || person.title || '媒合智联成员' }}</text></view><text class="candidate-action">加入</text></view><view v-if="!memberCandidates.length" class="picker-loading">没有找到可添加的成员</view></scroll-view></view></view>

    <view v-if="showMeetingSheet" class="sheet-mask" @tap="showMeetingSheet = false"><view class="sheet meeting-sheet" @tap.stop><view class="sheet-head"><view><text class="sheet-label">SCHEDULE A MEETING</text><text class="sheet-title">安排一次项目对齐会</text></view><text class="sheet-close" @tap="showMeetingSheet = false">×</text></view><text class="sheet-copy">会议会同步给项目成员，并在开始前进入站内提醒。</text><text class="sheet-field-label">会议主题</text><input v-model="meetingForm.title" class="sheet-input" maxlength="120" placeholder="例如：确认交付范围与排期" /><text class="sheet-field-label">会议方式</text><view class="choice-grid meeting-type-grid"><text v-for="option in meetingTypeOptions" :key="option.value" class="choice-item" :class="{ selected: meetingForm.meeting_type === option.value }" @tap="meetingForm.meeting_type = option.value">{{ option.label }}</text></view><text class="sheet-field-label">开始时间</text><view class="meeting-time-grid"><picker mode="date" @change="onMeetingDateChange"><view class="picker-field"><text>{{ meetingForm.date || '选择日期' }}</text><text>›</text></view></picker><picker mode="time" @change="onMeetingTimeChange"><view class="picker-field"><text>{{ meetingForm.time || '选择时间' }}</text><text>›</text></view></picker></view><text class="sheet-field-label">{{ meetingForm.meeting_type === 'offline' ? '会议地点' : '会议链接或地点' }} <text>（可选）</text></text><input v-model="meetingForm.location" class="sheet-input" maxlength="160" :placeholder="meetingForm.meeting_type === 'offline' ? '填写会议室、地址或楼层' : '粘贴会议链接或填写会面地点'" /><text class="sheet-field-label">本次议程 <text>（可选）</text></text><textarea v-model="meetingForm.agenda" class="sheet-textarea" maxlength="1000" placeholder="例如：确认范围、负责人和下一步时间点" /><view class="sheet-actions"><text class="sheet-cancel" @tap="showMeetingSheet = false">取消</text><text class="sheet-submit" :class="{ disabled: meetingSaving }" @tap="submitMeeting">{{ meetingSaving ? '保存中…' : '发送会议邀请' }}</text></view></view></view>

    <view v-if="showDeliverableSheet" class="sheet-mask" @tap="showDeliverableSheet = false"><view class="sheet" @tap.stop><text class="sheet-label">DELIVERY RECORD</text><text class="sheet-title">提交一条交付记录</text><input v-model="deliverableForm.title" class="sheet-input" maxlength="120" placeholder="例如：首轮策略方案" /><picker :range="milestoneChoices" range-key="label" @change="onDeliverableMilestoneChange"><view class="picker-field"><text>{{ selectedDeliverableMilestone }}</text><text>›</text></view></picker><textarea v-model="deliverableForm.description" class="sheet-textarea" maxlength="1000" placeholder="补充版本、验收说明或下一步建议（可选）" /><text class="attachment-action delivery-attachment" @tap="chooseDeliverableAttachment">{{ deliverableAttachment?.name || '添加交付附件（可选）' }}</text><view class="sheet-actions"><text class="sheet-cancel" @tap="showDeliverableSheet = false">取消</text><text class="sheet-submit" :class="{ disabled: deliverableSaving }" @tap="submitDeliverable">{{ deliverableSaving ? '提交中…' : '提交交付物' }}</text></view></view></view>

    <view v-if="showSettingsSheet" class="sheet-mask" @tap="showSettingsSheet = false"><view class="sheet" @tap.stop><text class="sheet-label">PROJECT ACCESS</text><text class="sheet-title">项目权限与保密</text><text class="sheet-copy">可见范围用于项目索引；协作内容仍只向项目成员开放。</text><text class="sheet-field-label">项目可见范围</text><view class="choice-grid"><text v-for="option in visibilityOptions" :key="option.value" class="choice-item" :class="{ selected: settingsForm.visibility === option.value }" @tap="settingsForm.visibility = option.value">{{ option.label }}</text></view><text class="sheet-field-label">保密级别</text><view class="choice-grid"><text v-for="option in confidentialityOptions" :key="option.value" class="choice-item" :class="{ selected: settingsForm.confidentiality === option.value }" @tap="settingsForm.confidentiality = option.value">{{ option.label }}</text></view><text class="sheet-field-label">新文件默认权限</text><view class="choice-grid compact"><text v-for="option in defaultFileOptions" :key="option.value" class="choice-item" :class="{ selected: settingsForm.default_file_permission === option.value }" @tap="settingsForm.default_file_permission = option.value">{{ option.label }}</text></view><view class="sheet-actions"><text class="sheet-cancel" @tap="showSettingsSheet = false">取消</text><text class="sheet-submit" :class="{ disabled: settingsSaving }" @tap="saveSettings">{{ settingsSaving ? '保存中…' : '保存设置' }}</text></view></view></view>

    <view v-if="showFilePermissionSheet" class="sheet-mask" @tap="showFilePermissionSheet = false"><view class="sheet permission-sheet" @tap.stop><text class="sheet-label">FILE ACCESS</text><text class="sheet-title">{{ selectedFile?.attachment?.name || '文件权限' }}</text><text class="sheet-copy">仅被授权的成员能看到“指定成员”文件；上传者和项目管理者始终可管理。</text><view class="choice-grid compact"><text v-for="option in fileScopeOptions" :key="option.value" class="choice-item" :class="{ selected: filePermissionForm.access_scope === option.value }" @tap="filePermissionForm.access_scope = option.value">{{ option.label }}</text></view><view class="permission-toggle" @tap="filePermissionForm.allow_download = !filePermissionForm.allow_download"><text>允许下载</text><text>{{ filePermissionForm.allow_download ? '已开启' : '仅查看' }}</text></view><view v-if="filePermissionForm.access_scope === 'restricted'" class="permission-members"><text class="sheet-field-label">可查看成员</text><scroll-view scroll-y class="permission-member-list"><view v-for="member in grantableMembers" :key="member.user_id || member.id" class="permission-member" :class="{ selected: filePermissionForm.grant_user_ids.includes(member.user_id || member.id) }" @tap="toggleFileGrant(member)"><view><text>{{ member.display_name }}</text><text>{{ collaborationRoleLabel(member.collaboration_role, member.role) }}</text></view><text>{{ filePermissionForm.grant_user_ids.includes(member.user_id || member.id) ? '已授权' : '授权' }}</text></view></scroll-view></view><view class="sheet-actions"><text class="sheet-cancel" @tap="showFilePermissionSheet = false">取消</text><text class="sheet-submit" :class="{ disabled: filePermissionSaving }" @tap="saveFilePermissions">{{ filePermissionSaving ? '保存中…' : '保存权限' }}</text></view></view></view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { bridge } from '@/api/bridge'
import { useNavTitle } from '@/hooks/useNavTitle'
import { toastError } from '@/utils/feedback'
import { baseURL } from '@/config/env'
import { getStoredSession } from '@/utils/session'

useNavTitle('项目协作室')

const dealId = ref('')
const workspace = ref(null)
const loading = ref(true)
const activeTab = ref('overview')
const tabs = [
  { id: 'overview', label: '概览' },
  { id: 'conversation', label: '讨论' },
  { id: 'tasks', label: '待办' },
  { id: 'delivery', label: '交付' },
  { id: 'schedule', label: '日程' },
  { id: 'files', label: '文件' },
  { id: 'activity', label: '动态' }
]
const showTaskSheet = ref(false)
const taskSaving = ref(false)
const taskForm = ref({ title: '', description: '', assignee_id: '', due_at: '' })
const showMemberSheet = ref(false)
const memberKeyword = ref('')
const memberCandidates = ref([])
const memberLoading = ref(false)
const memberInviteForm = ref({ collaboration_role: 'participant', access_level: 'editor' })
const memberRoleOptions = [
  { value: 'participant', label: '协作成员' }, { value: 'investment', label: '投资方' },
  { value: 'channel', label: '渠道方' }, { value: 'technology', label: '技术团队' },
  { value: 'supplier', label: '供应商' }, { value: 'advisor', label: '顾问' },
  { value: 'observer', label: '观察成员' }
]
const memberAccessOptions = [{ value: 'editor', label: '可编辑' }, { value: 'viewer', label: '仅查看' }]
const fileBusy = ref(false)
const activityText = ref('')
const activitySaving = ref(false)
const messageText = ref('')
const messageAttachments = ref([])
const messageSaving = ref(false)
const messageSendFailed = ref(false)
const pendingMessageId = ref('')
const pendingMessageSignature = ref('')
const showMeetingSheet = ref(false)
const meetingSaving = ref(false)
const meetingForm = ref({ title: '', date: '', time: '', location: '', agenda: '', meeting_type: 'online' })
const showDeliverableSheet = ref(false)
const deliverableSaving = ref(false)
const deliverableForm = ref({ title: '', description: '', milestone_id: '' })
const deliverableAttachment = ref(null)
const showSettingsSheet = ref(false)
const settingsSaving = ref(false)
const settingsForm = ref({ visibility: 'invited', confidentiality: 'standard', default_file_permission: 'download' })
const showFilePermissionSheet = ref(false)
const filePermissionSaving = ref(false)
const selectedFile = ref(null)
const filePermissionForm = ref({ access_scope: 'workspace', allow_download: true, grant_user_ids: [] })
const visibilityOptions = [
  { value: 'private', label: '仅项目方' },
  { value: 'circle', label: '圈内可见' },
  { value: 'invited', label: '受邀可见' },
  { value: 'confidential', label: '严格保密' }
]
const confidentialityOptions = [
  { value: 'standard', label: '一般保密' },
  { value: 'sensitive', label: '敏感项目' },
  { value: 'nda', label: '保密协议' }
]
const defaultFileOptions = [{ value: 'view', label: '仅查看' }, { value: 'download', label: '可下载' }]
const fileScopeOptions = [{ value: 'workspace', label: '全体成员' }, { value: 'restricted', label: '指定成员' }]
const meetingTypeOptions = [{ value: 'online', label: '线上会议' }, { value: 'offline', label: '线下会面' }, { value: 'hybrid', label: '线上线下' }]

onLoad((query) => {
  dealId.value = String(query?.id || '').trim()
  const tab = String(query?.tab || '').trim()
  if (tabs.some((item) => item.id === tab)) activeTab.value = tab
  loadWorkspace()
})

const dealStatus = computed(() => ({ in_progress: '协作中', completed: '已完成', cancelled: '已结束' })[workspace.value?.status] || '项目')
const completedMilestones = computed(() => (workspace.value?.milestones || []).filter((item) => item.status === 'completed').length)
const milestoneProgress = computed(() => Number(workspace.value?.milestone_summary?.progress || 0))
const memberChoices = computed(() => [{ id: '', label: '暂不指定负责人' }, ...(workspace.value?.members || []).map((member) => ({ id: member.user_id || member.id, label: member.display_name || '项目成员' }))])
const selectedAssigneeLabel = computed(() => memberChoices.value.find((item) => item.id === taskForm.value.assignee_id)?.label || '暂不指定负责人')
const milestoneChoices = computed(() => [{ id: '', label: '不关联里程碑' }, ...(workspace.value?.milestones || []).map((item) => ({ id: item._id || item.id, label: item.title || '项目节点' }))])
const selectedDeliverableMilestone = computed(() => milestoneChoices.value.find((item) => item.id === deliverableForm.value.milestone_id)?.label || '不关联里程碑')
const currentUserId = computed(() => String(getStoredSession()?.userInfo?.id || getStoredSession()?.user?.id || '').trim())
const grantableMembers = computed(() => (workspace.value?.members || []).filter((member) => (member.user_id || member.id) !== currentUserId.value))
const focusItems = computed(() => {
  const tasks = (workspace.value?.tasks || [])
    .filter((item) => item.status !== 'done')
    .map((item) => ({
      key: `task-${item._id}`,
      kind: 'task',
      title: item.title || '项目待办',
      tone: taskReminder(item),
      meta: taskDueCopy(item)
    }))
    .filter((item) => ['overdue', 'today', 'tomorrow'].includes(item.tone))
  const meetings = (workspace.value?.meetings || [])
    .filter((item) => item.status === 'scheduled')
    .map((item) => ({
      key: `meeting-${item._id}`,
      kind: 'meeting',
      title: item.title || '项目会议',
      tone: meetingReminder(item),
      meta: meetingDueCopy(item)
    }))
    .filter((item) => ['soon', 'today'].includes(item.tone))
  const rank = { overdue: 0, soon: 1, today: 2, tomorrow: 3 }
  return [...tasks, ...meetings].sort((left, right) => (rank[left.tone] ?? 9) - (rank[right.tone] ?? 9))
})
const scheduledMeetings = computed(() => (workspace.value?.meetings || [])
  .filter((item) => item.status === 'scheduled' && meetingStartMs(item) >= Date.now())
  .slice()
  .sort((left, right) => meetingStartMs(left) - meetingStartMs(right)))
const nextMeeting = computed(() => scheduledMeetings.value[0] || null)
const followUpMeetings = computed(() => scheduledMeetings.value.slice(1))
const meetingHistory = computed(() => (workspace.value?.meetings || [])
  .filter((item) => item.status !== 'scheduled' || meetingStartMs(item) < Date.now())
  .slice()
  .sort((left, right) => meetingStartMs(right) - meetingStartMs(left)))
const openTasks = computed(() => (workspace.value?.tasks || []).filter((item) => item.status !== 'done'))
const nextOpenTask = computed(() => {
  const order = { overdue: 0, today: 1, tomorrow: 2, later: 3 }
  return openTasks.value.slice().sort((left, right) => (order[taskReminder(left)] ?? 9) - (order[taskReminder(right)] ?? 9))[0] || null
})
const pendingDeliverables = computed(() => (workspace.value?.deliverables || []).filter((item) => item.status !== 'accepted'))
const latestActivity = computed(() => (workspace.value?.activities || [])[0] || null)
const kickoffChecks = computed(() => {
  const members = workspace.value?.members || []
  const milestones = workspace.value?.milestones || []
  const hasCoreMembers = members.length >= 2
  const hasMeeting = scheduledMeetings.value.length > 0
  const hasTask = openTasks.value.length > 0
  const hasMilestone = milestones.length > 0
  return [
    {
      id: 'members', index: '01', title: '确认协作成员',
      copy: hasCoreMembers ? `已有 ${members.length} 位成员进入协作室` : '至少确认项目方和合作方进入协作室',
      complete: hasCoreMembers, action: '添加成员', tab: 'overview', trigger: 'member'
    },
    {
      id: 'meeting', index: '02', title: '安排启动会',
      copy: hasMeeting ? `下一场：${nextMeeting.value?.title || '项目会议'}` : '先约一次对齐会，确认范围、负责人和协作节奏',
      complete: hasMeeting, action: '安排会议', tab: 'schedule', trigger: 'meeting'
    },
    {
      id: 'task', index: '03', title: '明确首个推进动作',
      copy: hasTask ? `当前待办：${nextOpenTask.value?.title || '项目待办'}` : '把最需要推进的一件事写成待办，并指定截止时间',
      complete: hasTask, action: '新增待办', tab: 'tasks', trigger: 'task'
    },
    {
      id: 'milestone', index: '04', title: '确认交付节点',
      copy: hasMilestone ? `已同步 ${milestones.length} 个可追踪的阶段节点` : '补充双方认可的阶段成果与验收节点',
      complete: hasMilestone, action: '查看交付', tab: 'delivery', trigger: 'milestone'
    }
  ]
})
const kickoffCompletedCount = computed(() => kickoffChecks.value.filter((item) => item.complete).length)
const projectStages = [
  { id: 'kickoff', index: 0, title: '合作启动', copy: '范围、成员与权限确认' },
  { id: 'alignment', index: 1, title: '对齐推进', copy: '会议、待办与方案展开' },
  { id: 'delivery', index: 2, title: '交付验收', copy: '节点、交付物与确认推进' },
  { id: 'review', index: 3, title: '归档复盘', copy: '成果沉淀与后续协作' }
]
const projectStageIndex = computed(() => {
  if (workspace.value?.status === 'completed' || workspace.value?.status === 'cancelled') return 3
  if (milestoneProgress.value >= 70 || pendingDeliverables.value.length > 0) return 2
  if (openTasks.value.length || scheduledMeetings.value.length || completedMilestones.value) return 1
  return 0
})
const currentProjectStage = computed(() => projectStages[projectStageIndex.value] || projectStages[0])

async function loadWorkspace() {
  if (!dealId.value) { loading.value = false; return }
  loading.value = true
  try {
    workspace.value = await bridge.deal.workspace(dealId.value)
  } catch (error) {
    toastError(error?.message || '项目协作室没打开，请稍后重试')
  } finally { loading.value = false }
}

function syncWorkspace(next) {
  if (!next) return
  workspace.value = next.workspace || next
}

function initial(value) { return String(value || '协').trim().slice(0, 1) }
function money(value) { return `¥${Number(value || 0).toLocaleString('zh-CN')}` }
function roleLabel(role) { return ({ requester: '需求方', provider: '合作方', advisor: '顾问', member: '协作成员' })[role] || '协作成员' }
function collaborationRoleLabel(role, fallback) { return ({ project_owner: '项目负责人', delivery_lead: '交付负责人', investment: '投资方', channel: '渠道方', technology: '技术团队', supplier: '供应商', advisor: '顾问', observer: '观察成员', participant: roleLabel(fallback) })[role] || roleLabel(fallback) }
function accessLabel(level) { return ({ manager: '可管理', editor: '可编辑', viewer: '仅查看' })[level] || '可编辑' }
function confidentialityLabel(value) { return ({ standard: '一般保密', sensitive: '敏感项目', nda: '保密项目' })[value] || '一般保密' }
function visibilityLabel(value) { return ({ private: '仅项目方', circle: '圈内可见', invited: '受邀成员可见', confidential: '严格保密' })[value] || '受邀成员可见' }
function milestoneLabel(status) { return ({ pending: '待开始', in_progress: '进行中', completed: '已完成' })[status] || '待确认' }
function deliverableMark(status) { return ({ submitted: '待', accepted: '✓', revision_requested: '改' })[status] || '待' }
function deliverableStatusLabel(status) { return ({ submitted: '待验收', accepted: '已确认', revision_requested: '待修改' })[status] || '待确认' }
function meetingTypeLabel(value) { return ({ online: '线上会议', offline: '线下会面', hybrid: '线上线下结合' })[value] || '项目会议' }
function meetingStatusLabel(value) { return ({ scheduled: '已安排', completed: '已完成', cancelled: '已取消' })[value] || '待确认' }
function meetingDate(value) { return String(value || '').slice(5, 10).replace('-', '/') || '待定' }
function meetingTime(value) { return String(value || '').replace('T', ' ').slice(11, 16) || '时间待定' }
function meetingStartMs(meeting) { const timestamp = new Date(meeting?.starts_at || '').getTime(); return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER }
function meetingLocationPlaceholder(meeting) { return meeting?.meeting_type === 'offline' ? '地点待补充' : '会议链接待补充' }
function meetingLinkActionLabel(meeting) { return meeting?.meeting_type === 'offline' ? '复制地点' : '复制链接' }
function simpleDate(value) { return String(value || '').replace('T', ' ').slice(0, 10) || '待确认' }
function simpleDateTime(value) { return String(value || '').replace('T', ' ').slice(0, 16) || '刚刚' }
function shanghaiDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value)
  const fields = Object.fromEntries(parts.filter((item) => item.type !== 'literal').map((item) => [item.type, item.value]))
  return `${fields.year}-${fields.month}-${fields.day}`
}
function taskReminder(task) {
  if (!task?.due_at || task.status === 'done') return 'later'
  const dueAt = String(task.due_at).slice(0, 10)
  const today = shanghaiDate()
  if (dueAt < today) return 'overdue'
  if (dueAt === today) return 'today'
  if (dueAt === shanghaiDate(new Date(Date.now() + 24 * 60 * 60 * 1000))) return 'tomorrow'
  return 'later'
}
function taskDueCopy(task) {
  const state = taskReminder(task)
  if (state === 'overdue') return '已逾期'
  if (state === 'today') return '今天截止'
  if (state === 'tomorrow') return '明天截止'
  return task?.due_at ? `截至 ${simpleDate(task.due_at)}` : '待安排'
}
function meetingReminder(meeting) {
  if (meeting?.status !== 'scheduled') return 'later'
  const timestamp = new Date(meeting.starts_at || '').getTime()
  if (!Number.isFinite(timestamp)) return 'later'
  const minutes = Math.round((timestamp - Date.now()) / 60000)
  if (minutes < 0 || minutes > 24 * 60) return 'later'
  return minutes <= 60 ? 'soon' : 'today'
}
function meetingDueCopy(meeting) {
  const state = meetingReminder(meeting)
  if (state === 'soon') return '一小时内开始'
  if (state === 'today') return '24 小时内开始'
  return ''
}
function copyMeetingLocation(meeting) {
  const location = String(meeting?.location || '').trim()
  if (!location) { uni.showToast({ title: '还没有填写会议链接或地点', icon: 'none' }); return }
  uni.setClipboardData({ data: location, success: () => uni.showToast({ title: meetingLinkActionLabel(meeting) === '复制链接' ? '会议链接已复制' : '会议地点已复制', icon: 'none' }) })
}
function openFocusItem(item) { activeTab.value = item?.kind === 'meeting' ? 'schedule' : 'tasks' }
function openWorkspaceTab(tab) { if (tabs.some((item) => item.id === tab)) activeTab.value = tab }
function handleKickoffCheck(item) {
  if (!item) return
  if (item.complete || item.trigger === 'milestone') return openWorkspaceTab(item.tab)
  if (item.trigger === 'member') return openMemberPicker()
  if (item.trigger === 'meeting') return openMeetingSheet()
  if (item.trigger === 'task') return openTaskSheet()
  openWorkspaceTab(item.tab)
}
function fileSize(value) { const size = Number(value || 0); return size > 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB` }
function fileKind(attachment = {}) { if (attachment.kind === 'image') return '图'; const name = String(attachment.name || '').toLowerCase(); if (name.endsWith('.pdf')) return 'PDF'; if (/\.docx?$/.test(name)) return 'DOC'; if (/\.xlsx?$/.test(name)) return 'XLS'; if (/\.pptx?$/.test(name)) return 'PPT'; return '文件' }
function canRemove(member) { return workspace.value?.permissions?.can_manage && !['requester', 'provider'].includes(member.role) && workspace.value.status === 'in_progress' }
function openSettingsSheet() {
  const settings = workspace.value?.collaboration_settings || {}
  settingsForm.value = {
    visibility: settings.visibility || 'invited',
    confidentiality: settings.confidentiality || 'standard',
    default_file_permission: settings.default_file_permission || 'download'
  }
  showSettingsSheet.value = true
}
async function saveSettings() {
  if (settingsSaving.value) return
  settingsSaving.value = true
  try {
    syncWorkspace(await bridge.deal.updateSettings(dealId.value, settingsForm.value))
    showSettingsSheet.value = false
    uni.showToast({ title: '项目设置已保存', icon: 'success' })
  } catch (error) { toastError(error?.message || '项目设置保存失败') } finally { settingsSaving.value = false }
}
function openFilePermissionSheet(file) {
  selectedFile.value = file
  filePermissionForm.value = {
    access_scope: file.access_scope || 'workspace',
    allow_download: Boolean(file.permissions?.can_download),
    grant_user_ids: Array.isArray(file.granted_user_ids) ? [...file.granted_user_ids] : []
  }
  showFilePermissionSheet.value = true
}
function toggleFileGrant(member) {
  const userId = member.user_id || member.id
  if (!userId) return
  const selected = new Set(filePermissionForm.value.grant_user_ids)
  if (selected.has(userId)) selected.delete(userId)
  else selected.add(userId)
  filePermissionForm.value.grant_user_ids = [...selected]
}
async function saveFilePermissions() {
  const file = selectedFile.value
  if (!file || filePermissionSaving.value) return
  if (filePermissionForm.value.access_scope === 'restricted' && !filePermissionForm.value.grant_user_ids.length) {
    return uni.showToast({ title: '请至少授权一位成员', icon: 'none' })
  }
  filePermissionSaving.value = true
  try {
    syncWorkspace(await bridge.deal.updateFilePermissions(dealId.value, file._id, filePermissionForm.value))
    showFilePermissionSheet.value = false
    uni.showToast({ title: '文件权限已更新', icon: 'success' })
  } catch (error) { toastError(error?.message || '文件权限保存失败') } finally { filePermissionSaving.value = false }
}
function attachmentUrl(attachment = {}) {
  if (/^https?:\/\//i.test(String(attachment.url || ''))) return attachment.url
  const id = encodeURIComponent(attachment.id || attachment._id || '')
  return `${String(baseURL || '').replace(/\/+$/, '')}/attachments/${id}`
}
function attachmentHeader() { const token = getStoredSession()?.token || ''; return token ? { Authorization: `Bearer ${token}` } : {} }

async function advanceMilestone(item) {
  if (!workspace.value || workspace.value.status !== 'in_progress' || item.status === 'completed') return
  const status = item.status === 'pending' ? 'in_progress' : 'completed'
  try { syncWorkspace(await bridge.deal.updateMilestone(dealId.value, item._id, status)) } catch (error) { toastError(error?.message || '里程碑更新失败') }
}

function openTaskSheet() {
  taskForm.value = { title: '', description: '', assignee_id: '', due_at: '' }
  showTaskSheet.value = true
}
function onAssigneeChange(event) { taskForm.value.assignee_id = memberChoices.value[Number(event?.detail?.value || 0)]?.id || '' }
function onDueDateChange(event) { taskForm.value.due_at = String(event?.detail?.value || '').slice(0, 10) }
async function submitTask() {
  const title = taskForm.value.title.trim()
  if (!title || taskSaving.value) return uni.showToast({ title: '请填写待办事项', icon: 'none' })
  taskSaving.value = true
  try {
    syncWorkspace(await bridge.deal.addTask(dealId.value, { ...taskForm.value, title }))
    showTaskSheet.value = false
    uni.showToast({ title: '待办已添加', icon: 'success' })
  } catch (error) { toastError(error?.message || '待办保存失败') } finally { taskSaving.value = false }
}
async function advanceTask(task) {
  if (!workspace.value || workspace.value.status !== 'in_progress' || task.status === 'done') return
  const status = task.status === 'todo' ? 'in_progress' : 'done'
  try { syncWorkspace(await bridge.deal.updateTask(dealId.value, task._id, { status })) } catch (error) { toastError(error?.message || '待办更新失败') }
}

async function openMemberPicker() {
  memberInviteForm.value = { collaboration_role: 'participant', access_level: 'editor' }
  showMemberSheet.value = true
  await loadPeople()
}
async function loadPeople() {
  memberLoading.value = true
  try {
    const result = await bridge.network.people({ keyword: memberKeyword.value.trim(), page: 1, pageSize: 30 })
    const existing = new Set((workspace.value?.members || []).map((member) => member.user_id || member.id))
    memberCandidates.value = (result?.list || []).filter((person) => !existing.has(person.id || person._id)).slice(0, 20)
  } catch (error) { toastError(error?.message || '成员列表暂时不可用') } finally { memberLoading.value = false }
}
async function addMember(person) {
  const userId = person?.id || person?._id
  if (!userId) return
  try {
    const collaborationRole = memberInviteForm.value.collaboration_role
    syncWorkspace(await bridge.deal.addMember(dealId.value, {
      user_id: userId,
      role: collaborationRole === 'advisor' ? 'advisor' : 'member',
      collaboration_role: collaborationRole,
      access_level: memberInviteForm.value.access_level
    }))
    showMemberSheet.value = false
    uni.showToast({ title: '已加入协作室', icon: 'success' })
  } catch (error) { toastError(error?.message || '添加成员失败') }
}
function removeMember(member) {
  uni.showModal({ title: '移除协作成员', content: `确认不再让${member.display_name}参与这个项目吗？`, success: async (result) => {
    if (!result.confirm) return
    try { syncWorkspace(await bridge.deal.removeMember(dealId.value, member._id)); uni.showToast({ title: '已移除', icon: 'success' }) } catch (error) { toastError(error?.message || '移除失败') }
  } })
}

function chooseFile() {
  if (fileBusy.value) return
  const choose = (files = []) => uploadSelected(files)
  if (typeof uni.chooseFile === 'function') return uni.chooseFile({ count: 1, type: 'all', success: (result) => choose(result?.tempFiles || []) })
  uni.chooseImage({ count: 1, success: (result) => choose((result?.tempFilePaths || []).map((path) => ({ path, name: path.split('/').pop(), type: 'image' }))) })
}
async function uploadSelected(files) {
  const file = files?.[0]
  const path = file?.path || file?.tempFilePath
  if (!path) return
  fileBusy.value = true
  try {
    const name = file.name || path.split('/').pop() || '项目文件'
    const isImage = String(file.type || '').startsWith('image') || /\.(png|jpe?g|gif|webp|heic)$/i.test(name)
    const attachment = await bridge.attachments.upload(path, { name, size: Number(file.size || 0), kind: isImage ? 'image' : 'file' })
    syncWorkspace(await bridge.deal.addFile(dealId.value, { attachment_id: attachment.id, attachment }))
    uni.showToast({ title: '文件已共享', icon: 'success' })
  } catch (error) { toastError(error?.message || '文件上传失败') } finally { fileBusy.value = false }
}

function chooseAttachment(callback) {
  // 用对象承载回调，避免小程序页面接线扫描把回调参数误判为全局函数。
  const handlers = { onReady: callback }
  const choose = (files = []) => handlers.onReady(files)
  if (typeof uni.chooseFile === 'function') return uni.chooseFile({ count: 1, type: 'all', success: (result) => choose(result?.tempFiles || []) })
  return uni.chooseImage({ count: 1, success: (result) => choose((result?.tempFilePaths || []).map((path) => ({ path, name: path.split('/').pop(), type: 'image' }))) })
}
async function uploadAttachment(files) {
  const file = files?.[0]
  const path = file?.path || file?.tempFilePath
  if (!path) return null
  const name = file.name || path.split('/').pop() || '项目附件'
  const isImage = String(file.type || '').startsWith('image') || /\.(png|jpe?g|gif|webp|heic)$/i.test(name)
  return bridge.attachments.upload(path, { name, size: Number(file.size || 0), kind: isImage ? 'image' : 'file' })
}
function chooseMessageAttachment() {
  if (messageSaving.value) return
  chooseAttachment(async (files) => {
    try {
      const attachment = await uploadAttachment(files)
      if (attachment) {
        messageAttachments.value = [attachment]
        messageSendFailed.value = false
      }
    } catch (error) { toastError(error?.message || '附件上传失败') }
  })
}

function messageDraftSignature(content, attachments) {
  return JSON.stringify([
    content,
    attachments.map((item) => String(item?.id || item?.name || item?.path || ''))
  ])
}

function workspaceMessageId(content, attachments) {
  const signature = messageDraftSignature(content, attachments)
  if (!pendingMessageId.value || pendingMessageSignature.value !== signature) {
    pendingMessageId.value = `workspace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    pendingMessageSignature.value = signature
  }
  return pendingMessageId.value
}

function appendWorkspaceMessage(message) {
  if (!message || !workspace.value) return
  const messageId = String(message._id || message.id || '')
  const clientMessageId = String(message.client_message_id || '')
  const list = [...(workspace.value.messages || [])]
  const index = list.findIndex((item) => (
    (messageId && String(item._id || item.id || '') === messageId)
    || (clientMessageId && String(item.client_message_id || '') === clientMessageId)
  ))
  if (index >= 0) list.splice(index, 1, message)
  else list.push(message)
  workspace.value.messages = list
}

function onMessageInput() {
  messageSendFailed.value = false
}

async function sendMessage() {
  if (messageSaving.value || (!messageText.value.trim() && !messageAttachments.value.length)) return
  const content = messageText.value.trim()
  const attachments = messageAttachments.value.slice()
  const clientMessageId = workspaceMessageId(content, attachments)
  messageSaving.value = true
  messageSendFailed.value = false
  try {
    const result = await bridge.deal.sendMessage(dealId.value, { content, attachment_ids: attachments.map((item) => item.id), attachments, client_message_id: clientMessageId })
    if (!result?.message) throw new Error('消息暂时未保存，请稍后重试')
    appendWorkspaceMessage(result.message)
    messageText.value = ''
    messageAttachments.value = []
    pendingMessageId.value = ''
    pendingMessageSignature.value = ''
  } catch (error) {
    messageSendFailed.value = true
    toastError(error?.message || '消息发送失败，草稿已保留，可再次点击发送')
  } finally { messageSaving.value = false }
}

function openMeetingSheet() {
  const now = new Date(Date.now() + 24 * 60 * 60 * 1000)
  meetingForm.value = { title: '', date: now.toISOString().slice(0, 10), time: '10:00', location: '', agenda: '', meeting_type: 'online' }
  showMeetingSheet.value = true
}
function onMeetingDateChange(event) { meetingForm.value.date = String(event?.detail?.value || '') }
function onMeetingTimeChange(event) { meetingForm.value.time = String(event?.detail?.value || '') }
async function submitMeeting() {
  if (meetingSaving.value) return
  const title = meetingForm.value.title.trim()
  const startsAt = meetingForm.value.date && meetingForm.value.time ? `${meetingForm.value.date}T${meetingForm.value.time}:00` : ''
  if (!title || !startsAt) return uni.showToast({ title: '请填写会议主题和时间', icon: 'none' })
  meetingSaving.value = true
  try {
    syncWorkspace(await bridge.deal.addMeeting(dealId.value, { title, starts_at: startsAt, location: meetingForm.value.location.trim(), agenda: meetingForm.value.agenda.trim(), meeting_type: meetingForm.value.meeting_type }))
    showMeetingSheet.value = false
    uni.showToast({ title: '会议已安排', icon: 'success' })
  } catch (error) { toastError(error?.message || '会议安排失败') } finally { meetingSaving.value = false }
}
async function completeMeeting(meeting) {
  try { syncWorkspace(await bridge.deal.updateMeeting(dealId.value, meeting._id, { status: 'completed' })) } catch (error) { toastError(error?.message || '会议状态更新失败') }
}

function openDeliverableSheet() { deliverableForm.value = { title: '', description: '', milestone_id: '' }; deliverableAttachment.value = null; showDeliverableSheet.value = true }
function onDeliverableMilestoneChange(event) { deliverableForm.value.milestone_id = milestoneChoices.value[Number(event?.detail?.value || 0)]?.id || '' }
function chooseDeliverableAttachment() {
  chooseAttachment(async (files) => {
    try { deliverableAttachment.value = await uploadAttachment(files) } catch (error) { toastError(error?.message || '附件上传失败') }
  })
}
async function submitDeliverable() {
  const title = deliverableForm.value.title.trim()
  if (!title || deliverableSaving.value) return uni.showToast({ title: '请填写交付物名称', icon: 'none' })
  deliverableSaving.value = true
  try {
    syncWorkspace(await bridge.deal.addDeliverable(dealId.value, { ...deliverableForm.value, title, attachment_id: deliverableAttachment.value?.id || '', attachment: deliverableAttachment.value }))
    showDeliverableSheet.value = false
    uni.showToast({ title: '交付物已提交', icon: 'success' })
  } catch (error) { toastError(error?.message || '交付物提交失败') } finally { deliverableSaving.value = false }
}
async function updateDeliverable(item, status) {
  try { syncWorkspace(await bridge.deal.updateDeliverable(dealId.value, item._id, { status })) } catch (error) { toastError(error?.message || '交付状态更新失败') }
}
function openFile(file) {
  const attachment = file?.attachment || {}
  if (!attachment.id && !attachment.url) return
  const url = attachmentUrl(attachment)
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    window.fetch(url, { headers: attachmentHeader() })
      .then((response) => { if (!response.ok) throw new Error('附件读取失败'); return response.blob() })
      .then((blob) => {
        const localUrl = URL.createObjectURL(blob)
        if (attachment.kind === 'image') uni.previewImage({ urls: [localUrl], current: localUrl })
        else window.open(localUrl, '_blank')
      })
      .catch(() => toastError('文件暂时无法打开'))
    return
  }
  uni.downloadFile({ url, header: attachmentHeader(), success: (result) => {
    if (attachment.kind === 'image') uni.previewImage({ urls: [result.tempFilePath], current: result.tempFilePath })
    else uni.openDocument({ filePath: result.tempFilePath, showMenu: true })
  }, fail: () => toastError('文件暂时无法打开') })
}

async function postActivity() {
  const content = activityText.value.trim()
  if (!content || activitySaving.value) return
  activitySaving.value = true
  try {
    syncWorkspace(await bridge.deal.addActivity(dealId.value, { content }))
    activityText.value = ''
  } catch (error) { toastError(error?.message || '动态发布失败') } finally { activitySaving.value = false }
}
</script>

<style scoped>
.page { min-height: 100vh; padding: 26rpx 24rpx calc(100rpx + env(safe-area-inset-bottom)); color: #29251F; background: #F4F1EA; box-sizing: border-box; }
.state-page { display: flex; min-height: 72vh; flex-direction: column; align-items: center; justify-content: center; gap: 18rpx; color: #817A70; font-size: 23rpx; }.spinner,.tiny-spinner { width: 32rpx; height: 32rpx; border: 2rpx solid #DED7CB; border-top-color: #69574A; border-radius: 50%; animation: spin .8s linear infinite; }.tiny-spinner { width: 22rpx; height: 22rpx; }.retry { padding: 12rpx 18rpx; border: 1rpx solid #C9C0B3; border-radius: 5rpx; color: #5C2828; }
.project-header { padding: 4rpx 4rpx 28rpx; }.eyebrow,.section-label,.sheet-label { display: block; color: #8A8177; font: 600 17rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }.title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 18rpx; margin-top: 13rpx; }.project-title { max-width: 510rpx; color: #29251F; font-family: Georgia, 'Times New Roman', serif; font-size: 43rpx; font-weight: 500; line-height: 1.14; }.project-status { flex: 0 0 auto; margin-top: 5rpx; padding: 6rpx 9rpx; border-radius: 4rpx; color: #69574A; background: #EEE8DF; font-size: 18rpx; }.status-completed { color: #41463C; background: #E7EBE2; }.status-cancelled { color: #6E5A58; background: #EFE8E6; }.project-meta { display: block; margin-top: 12rpx; color: #817A70; font-size: 21rpx; }
.summary-row { display: grid; grid-template-columns: repeat(3, 1fr); margin-bottom: 28rpx; border-top: 1rpx solid rgba(42,37,31,.12); border-bottom: 1rpx solid rgba(42,37,31,.12); background: #F8F6F0; }.summary-cell { display: flex; min-width: 0; flex-direction: column; gap: 5rpx; padding: 19rpx 14rpx; color: #817A70; font-size: 18rpx; text-align: center; }.summary-cell + .summary-cell { border-left: 1rpx solid rgba(42,37,31,.1); }.summary-value { color: #3D342B; font-family: Georgia, 'Times New Roman', serif; font-size: 31rpx; font-variant-numeric: tabular-nums; }
.focus-strip { margin: -8rpx 0 28rpx; padding: 18rpx 18rpx 7rpx; border-top: 1rpx solid #B8A989; border-bottom: 1rpx solid #DAD2C6; background: #EEE8DE; }.focus-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18rpx; padding-bottom: 8rpx; }.focus-title { display: block; margin-top: 7rpx; color: #3E372F; font-size: 26rpx; font-weight: 600; }.focus-count { color: #69574A; font: 500 25rpx/1 Georgia, 'Times New Roman', serif; }.focus-row { display: flex; align-items: center; gap: 12rpx; padding: 14rpx 0; border-top: 1rpx solid rgba(42,37,31,.09); }.focus-dot { width: 8rpx; height: 8rpx; flex: 0 0 auto; border-radius: 50%; background: #B5A07A; }.focus-overdue .focus-dot { background: #8E4C42; }.focus-soon .focus-dot { background: #69574A; }.focus-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3rpx; }.focus-copy text:first-child { overflow: hidden; color: #443B32; font-size: 21rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.focus-copy text:last-child { overflow: hidden; color: #817A70; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }.focus-action { color: #5C2828; font-size: 18rpx; }
.tabs { display: flex; margin: 0 -2rpx 22rpx; border-bottom: 1rpx solid rgba(42,37,31,.12); }.tab { flex: 1; padding: 12rpx 4rpx 14rpx; color: #8B8379; font-size: 22rpx; text-align: center; }.tab.active { position: relative; color: #5C2828; font-weight: 600; }.tab.active::after { position: absolute; right: 22rpx; bottom: -1rpx; left: 22rpx; height: 2rpx; background: #5C2828; content: ''; }
.section { margin-bottom: 18rpx; padding: 24rpx; border: 1rpx solid rgba(42,37,31,.11); border-radius: 8rpx; background: #FCFBF8; }.section-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16rpx; }.section-title { display: block; margin-top: 7rpx; color: #302B26; font-size: 29rpx; font-weight: 600; }.head-actions { display: flex; align-items: center; gap: 18rpx; }.text-action,.row-action { flex: 0 0 auto; color: #5C2828; font-size: 20rpx; }.section-note { padding-top: 21rpx; color: #8B8379; font-size: 18rpx; }.section-empty { padding: 40rpx 12rpx 18rpx; color: #8B8379; font-size: 21rpx; line-height: 1.6; text-align: center; }
.member-list,.milestone-list,.task-list,.file-list,.activity-list { margin-top: 18rpx; }.member-row,.milestone-row,.task-row,.file-row { display: flex; align-items: center; gap: 13rpx; padding: 15rpx 0; border-top: 1rpx solid rgba(42,37,31,.08); }.member-avatar,.candidate-avatar { display: flex; width: 50rpx; height: 50rpx; align-items: center; justify-content: center; flex: 0 0 auto; border-radius: 50%; color: #FCFBF8; background: #69574A; font-size: 23rpx; }.avatar-1 { background: #5C2828; }.avatar-2 { background: #41463C; }.avatar-3 { background: #94785A; }.member-copy,.milestone-copy,.task-copy,.file-copy,.activity-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; }.member-name,.milestone-name,.task-title,.file-name { overflow: hidden; color: #403A33; font-size: 23rpx; font-weight: 550; text-overflow: ellipsis; white-space: nowrap; }.member-meta,.milestone-meta,.task-meta,.file-meta,.activity-time { display: block; overflow: hidden; margin-top: 4rpx; color: #91897E; font-size: 18rpx; text-overflow: ellipsis; white-space: nowrap; }.member-remove { color: #9A625C; font-size: 18rpx; }
.milestone-section { padding-bottom: 12rpx; }.milestone-mark,.task-check { display: flex; width: 34rpx; height: 34rpx; align-items: center; justify-content: center; flex: 0 0 34rpx; border: 1rpx solid #C8C0B5; color: #8A8177; font-size: 18rpx; }.milestone-in_progress .milestone-mark { border-color: #B5A07A; color: #745E3B; background: #F2EBDD; }.milestone-completed .milestone-mark,.task-done .task-check { border-color: #596050; color: #F7F5EF; background: #596050; }.milestone-completed .milestone-name,.task-done .task-title { color: #837B71; text-decoration: line-through; }
.task-desc { display: -webkit-box; overflow: hidden; margin-top: 5rpx; color: #716960; font-size: 19rpx; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.task-check { border-radius: 50%; }.task-in_progress .task-check { border-color: #A78D68; background: #F5EFE5; }.task-due.due-overdue { color: #8E4C42; }.task-due.due-today { color: #69574A; }.task-due.due-tomorrow { color: #856A42; }.task-row.due-overdue { background: linear-gradient(90deg, rgba(142,76,66,.055), transparent 68%); }
.upload-state { display: flex; align-items: center; justify-content: center; gap: 10rpx; padding: 45rpx 0 26rpx; color: #817A70; font-size: 20rpx; }.file-kind { display: flex; width: 52rpx; height: 52rpx; align-items: center; justify-content: center; flex: 0 0 auto; color: #5C2828; background: #F1EAE5; font: 600 16rpx/1 Georgia, serif; }.file-actions { display: flex; align-items: center; gap: 14rpx; }.file-manage { padding: 5rpx 8rpx; border: 1rpx solid #D9D0C5; color: #69574A; font-size: 17rpx; }.file-open { color: #5C2828; font-size: 19rpx; }
.note-composer { margin-top: 20rpx; padding: 14rpx; border: 1rpx solid #DED8CE; background: #FAF8F3; }.note-composer textarea { width: 100%; min-height: 96rpx; color: #3A342E; font-size: 22rpx; line-height: 1.55; box-sizing: border-box; }.note-placeholder { color: #AAA196; }.note-send { display: inline-flex; float: right; margin-top: 9rpx; padding: 10rpx 15rpx; color: #F8F5EE; background: #342F29; font-size: 19rpx; }.note-send.disabled { opacity: .45; }.note-composer::after { display: block; clear: both; content: ''; }.activity-row { display: flex; gap: 13rpx; padding: 16rpx 0; border-top: 1rpx solid rgba(42,37,31,.08); }.activity-dot { width: 9rpx; height: 9rpx; flex: 0 0 auto; margin-top: 8rpx; border-radius: 50%; background: #B5A07A; }.activity-task_completed,.activity-deal_status_updated { background: #596050; }.activity-file_shared { background: #5C2828; }.activity-content { color: #595148; font-size: 21rpx; line-height: 1.55; }.activity-author { color: #3B342D; font-weight: 600; }
.project-guard { display: flex; gap: 8rpx; margin-top: 11rpx; color: #766D62; font-size: 18rpx; }.project-guard text:first-child { color: #5C2828; }.commercial-strip { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10rpx 20rpx; margin: 0 0 26rpx; padding: 20rpx 18rpx; border-top: 1rpx solid rgba(42,37,31,.13); border-bottom: 1rpx solid rgba(42,37,31,.13); background: #EDE8DE; }.strip-label { display: block; color: #817A70; font: 600 15rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }.strip-title { display: block; margin-top: 7rpx; color: #383129; font-size: 24rpx; font-weight: 600; }.strip-value { display: flex; align-items: flex-end; flex-direction: column; gap: 5rpx; color: #5C2828; font: 500 29rpx/1.1 Georgia, 'Times New Roman', serif; }.strip-value text + text { color: #7D7368; font: 400 17rpx/1.2 system-ui, sans-serif; }.strip-copy { grid-column: 1 / -1; overflow: hidden; color: #746B61; font-size: 19rpx; line-height: 1.55; text-overflow: ellipsis; white-space: nowrap; }
.message-list { display: flex; flex-direction: column; gap: 18rpx; margin-top: 24rpx; }.message-row { display: flex; align-items: flex-start; gap: 12rpx; }.message-row.mine { flex-direction: row-reverse; }.message-avatar { display: flex; width: 42rpx; height: 42rpx; align-items: center; justify-content: center; flex: 0 0 auto; border-radius: 50%; color: #F8F5EE; background: #69574A; font-size: 19rpx; }.mine .message-avatar { background: #5C2828; }.message-body { display: flex; max-width: 78%; align-items: flex-start; flex-direction: column; gap: 5rpx; }.mine .message-body { align-items: flex-end; }.message-author,.message-time { color: #948C82; font-size: 17rpx; }.message-content { padding: 13rpx 15rpx; border: 1rpx solid rgba(42,37,31,.08); color: #4B433A; background: #F4F1EA; font-size: 21rpx; line-height: 1.55; }.mine .message-content { border-color: #433B33; color: #F9F6F0; background: #403831; }.message-attachment { display: flex; max-width: 100%; align-items: center; gap: 8rpx; padding: 9rpx 11rpx; border: 1rpx solid #D9D1C6; color: #5C2828; background: #FAF8F3; font-size: 18rpx; }.discussion-composer { margin-top: 24rpx; padding: 14rpx; border-top: 1rpx solid rgba(42,37,31,.12); background: #FAF8F3; }.discussion-composer textarea { width: 100%; min-height: 78rpx; color: #3A342E; font-size: 22rpx; line-height: 1.55; box-sizing: border-box; }.composer-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 9rpx; }.composer-actions .note-send { float: none; margin-top: 0; }.attachment-action { display: inline-flex; padding: 8rpx 0; color: #69574A; font-size: 19rpx; }.pending-attachments { display: flex; flex-wrap: wrap; gap: 7rpx; margin-top: 8rpx; }.pending-attachments text { max-width: 220rpx; overflow: hidden; padding: 5rpx 7rpx; color: #665D52; background: #EEE9E0; font-size: 17rpx; text-overflow: ellipsis; white-space: nowrap; }.message-retry-hint { display: block; margin-top: 9rpx; color: #8E4C42; font-size: 17rpx; line-height: 1.4; }
.deliverable-list,.meeting-list { margin-top: 18rpx; }.deliverable-row,.meeting-row { display: flex; align-items: flex-start; gap: 13rpx; padding: 16rpx 0; border-top: 1rpx solid rgba(42,37,31,.08); }.meeting-soon { background: linear-gradient(90deg, rgba(105,87,74,.07), transparent 74%); }.deliverable-status { display: flex; width: 36rpx; height: 36rpx; align-items: center; justify-content: center; flex: 0 0 auto; border: 1rpx solid #CFC5B9; color: #7C7165; font-size: 19rpx; }.deliverable-accepted { border-color: #596050; color: #F8F5EE; background: #596050; }.deliverable-revision_requested { border-color: #A26859; color: #8E4C42; background: #F7EDE8; }.deliverable-copy,.meeting-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; }.deliverable-title,.meeting-title { color: #403A33; font-size: 23rpx; font-weight: 550; }.deliverable-meta,.meeting-meta,.deliverable-desc { display: block; overflow: hidden; margin-top: 4rpx; color: #91897E; font-size: 18rpx; line-height: 1.45; text-overflow: ellipsis; }.meeting-reminder { display: block; margin-top: 6rpx; color: #69574A; font-size: 17rpx; }.deliverable-file { margin-top: 7rpx; color: #5C2828; font-size: 18rpx; }.meeting-date { display: flex; width: 72rpx; align-items: flex-end; flex-direction: column; flex: 0 0 72rpx; color: #5C2828; font-family: Georgia, 'Times New Roman', serif; font-size: 21rpx; }.meeting-date text + text { margin-top: 3rpx; color: #93897E; font-family: system-ui, sans-serif; font-size: 16rpx; }.meeting-status { flex: 0 0 auto; color: #8B8379; font-size: 18rpx; }.file-restricted { display: inline-block; margin-top: 5rpx; color: #87594B; font-size: 17rpx; }.delivery-attachment { width: 100%; margin-top: 10rpx; padding: 13rpx 14rpx; border: 1rpx dashed #CFC6BB; box-sizing: border-box; }
.sheet-mask { position: fixed; z-index: 20; inset: 0; display: flex; align-items: flex-end; background: rgba(31,27,23,.44); }.sheet { width: 100%; max-height: 84vh; padding: 28rpx 24rpx calc(30rpx + env(safe-area-inset-bottom)); border-radius: 12rpx 12rpx 0 0; background: #FCFBF8; box-sizing: border-box; }.sheet-title { display: block; margin-top: 8rpx; color: #302B26; font-family: Georgia, 'Times New Roman', serif; font-size: 34rpx; font-weight: 500; }.sheet-copy { display: block; margin-top: 12rpx; color: #817A70; font-size: 19rpx; line-height: 1.55; }.sheet-field-label { display: block; margin-top: 22rpx; color: #756C61; font-size: 18rpx; }.choice-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10rpx; margin-top: 10rpx; }.choice-grid.compact { grid-template-columns: repeat(2, minmax(0, 1fr)); }.choice-item { padding: 14rpx 10rpx; border: 1rpx solid #DED8CE; color: #756C61; background: #FAF8F3; font-size: 20rpx; text-align: center; }.choice-item.selected { border-color: #5C2828; color: #5C2828; background: #F3ECE7; }.permission-toggle { display: flex; justify-content: space-between; margin-top: 18rpx; padding: 16rpx 0; border-top: 1rpx solid rgba(42,37,31,.1); border-bottom: 1rpx solid rgba(42,37,31,.1); color: #4D453C; font-size: 21rpx; }.permission-toggle text + text { color: #69574A; font-size: 19rpx; }.permission-member-list { max-height: 310rpx; margin-top: 8rpx; }.permission-member { display: flex; align-items: center; justify-content: space-between; padding: 14rpx 0; border-bottom: 1rpx solid rgba(42,37,31,.08); color: #4A4239; font-size: 21rpx; }.permission-member view { display: flex; flex-direction: column; gap: 3rpx; }.permission-member view text + text { color: #91897E; font-size: 17rpx; }.permission-member > text { color: #8A8177; font-size: 18rpx; }.permission-member.selected > text { color: #5C2828; }.sheet-input,.sheet-textarea,.picker-field { width: 100%; margin-top: 20rpx; padding: 15rpx; border: 1rpx solid #DED8CE; border-radius: 5rpx; color: #3A342E; background: #FAF8F3; font-size: 22rpx; box-sizing: border-box; }.sheet-textarea { height: 130rpx; }.picker-field { display: flex; justify-content: space-between; margin-top: 12rpx; color: #716960; }.sheet-actions { display: flex; gap: 12rpx; margin-top: 24rpx; }.sheet-cancel,.sheet-submit { flex: 1; padding: 15rpx; border: 1rpx solid #CFC6BB; color: #625B53; font-size: 22rpx; text-align: center; }.sheet-submit { border-color: #342F29; color: #F8F5EE; background: #342F29; }.sheet-submit.disabled { opacity: .55; }.member-sheet { min-height: 580rpx; }.sheet-head { display: flex; justify-content: space-between; }.sheet-close { padding: 0 8rpx; color: #82786F; font-size: 38rpx; }.picker-loading { padding: 45rpx 0; color: #8B8379; font-size: 21rpx; text-align: center; }.people-picker { height: 460rpx; margin-top: 10rpx; }.candidate-row { display: flex; align-items: center; gap: 12rpx; padding: 15rpx 0; border-bottom: 1rpx solid rgba(42,37,31,.08); }.candidate-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 3rpx; color: #403A33; font-size: 22rpx; }.candidate-copy text + text { color: #91897E; font-size: 18rpx; }.candidate-action { color: #5C2828; font-size: 19rpx; }
.member-role-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }.member-role-grid .choice-item { padding: 12rpx 5rpx; font-size: 18rpx; }

/* Project cockpit: a precise index to the work already happening in this room. */
.project-control-section { margin: 0 0 36rpx; padding: 3rpx 4rpx 0; border-top: 1rpx solid rgba(42,37,31,.13); border-bottom: 1rpx solid rgba(42,37,31,.13); }
.control-head { align-items: flex-end; padding: 26rpx 0 24rpx; }
.control-head .section-title { font-family: Georgia, 'Times New Roman', serif; font-size: 35rpx; font-weight: 500; }
.control-stage-copy { display: flex; align-items: flex-end; flex-direction: column; gap: 5rpx; color: #8B8379; font-size: 17rpx; }
.control-stage-copy text + text { color: #5C2828; font: 500 23rpx/1.1 Georgia, 'Times New Roman', serif; }
.project-stage-line { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0 -4rpx; border-top: 1rpx solid rgba(42,37,31,.10); border-bottom: 1rpx solid rgba(42,37,31,.10); }
.stage-step { position: relative; display: flex; min-width: 0; flex-direction: column; gap: 10rpx; padding: 18rpx 13rpx 19rpx; color: #958D83; }
.stage-step + .stage-step { border-left: 1rpx solid rgba(42,37,31,.08); }
.stage-mark { display: flex; width: 25rpx; height: 25rpx; align-items: center; justify-content: center; border: 1rpx solid #CAC1B6; border-radius: 50%; color: #8E857A; font: 500 15rpx/1 Georgia, 'Times New Roman', serif; }
.stage-copy { display: flex; min-width: 0; flex-direction: column; gap: 5rpx; }.stage-copy text:first-child { overflow: hidden; color: inherit; font-size: 20rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.stage-copy text + text { min-height: 30rpx; color: #A39B90; font-size: 15rpx; line-height: 1.4; }
.stage-step.complete .stage-mark { border-color: #596050; color: #F8F5EE; background: #596050; }.stage-step.complete .stage-copy text:first-child { color: #596050; }.stage-step.active { background: #F1ECE4; }.stage-step.active .stage-mark { border-color: #5C2828; color: #F8F5EE; background: #5C2828; }.stage-step.active .stage-copy text:first-child { color: #5C2828; }.stage-step.active .stage-copy text + text { color: #71685E; }
.control-ledger { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }.control-item { display: grid; grid-template-columns: 34rpx minmax(0, 1fr) 22rpx; gap: 10rpx; min-width: 0; align-items: flex-start; padding: 22rpx 13rpx 23rpx; border-bottom: 1rpx solid rgba(42,37,31,.09); }.control-item:nth-child(odd) { border-right: 1rpx solid rgba(42,37,31,.09); }.control-item:nth-last-child(-n + 2) { border-bottom: 0; }
.control-index { padding-top: 2rpx; color: #AE9A78; font: 500 16rpx/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .04em; }.control-copy { display: flex; min-width: 0; flex-direction: column; }.control-label { color: #7B7268; font: 600 15rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .09em; }.control-value { display: block; overflow: hidden; margin-top: 9rpx; color: #3E372F; font: 500 24rpx/1.3 Georgia, 'Times New Roman', serif; text-overflow: ellipsis; white-space: nowrap; }.control-meta { display: block; overflow: hidden; margin-top: 7rpx; color: #938A80; font-size: 17rpx; line-height: 1.4; text-overflow: ellipsis; white-space: nowrap; }.control-arrow { padding-top: 25rpx; color: #806A51; font-size: 20rpx; text-align: right; }
.project-signal { display: flex; align-items: center; justify-content: space-between; gap: 18rpx; padding: 18rpx 13rpx 20rpx; border-top: 1rpx solid rgba(42,37,31,.09); background: #F7F4ED; }.signal-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 8rpx; }.signal-copy text + text { display: -webkit-box; overflow: hidden; color: #675F56; font-size: 19rpx; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.signal-action { flex: 0 0 auto; color: #5C2828; font-size: 18rpx; }

/* Startup is a live operational checklist, not a decorative onboarding card. */
.kickoff-section { margin: 0 0 36rpx; padding: 3rpx 4rpx 0; border-top: 1rpx solid rgba(42,37,31,.13); border-bottom: 1rpx solid rgba(42,37,31,.13); }
.kickoff-head { align-items: flex-end; padding: 25rpx 0 13rpx; }.kickoff-head .section-title { font-family: Georgia, 'Times New Roman', serif; font-size: 34rpx; font-weight: 500; }.kickoff-progress { display: flex; align-items: flex-end; flex-direction: column; gap: 4rpx; color: #8B8379; font-size: 16rpx; }.kickoff-progress text:first-child { color: #5C2828; font: 500 26rpx/1 Georgia, 'Times New Roman', serif; }.kickoff-copy { display: block; max-width: 580rpx; padding-bottom: 20rpx; color: #817A70; font-size: 18rpx; line-height: 1.55; }
.kickoff-list { border-top: 1rpx solid rgba(42,37,31,.10); }.kickoff-row { display: grid; grid-template-columns: 42rpx minmax(0, 1fr) auto; gap: 13rpx; align-items: center; padding: 17rpx 8rpx 17rpx 0; border-bottom: 1rpx solid rgba(42,37,31,.08); }.kickoff-row:last-child { border-bottom: 0; }.kickoff-mark { display: flex; width: 30rpx; height: 30rpx; align-items: center; justify-content: center; border: 1rpx solid #C9C0B5; color: #8C8378; font: 500 16rpx/1 ui-monospace, SFMono-Regular, Menlo, monospace; }.kickoff-item-copy { display: flex; min-width: 0; flex-direction: column; gap: 5rpx; }.kickoff-item-copy text:first-child { overflow: hidden; color: #40382F; font-size: 22rpx; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.kickoff-item-copy text + text { overflow: hidden; color: #92897E; font-size: 17rpx; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }.kickoff-action { padding-left: 9rpx; color: #5C2828; font-size: 18rpx; }.kickoff-row.complete .kickoff-mark { border-color: #596050; color: #F8F5EE; background: #596050; }.kickoff-row.complete .kickoff-item-copy text:first-child { color: #596050; }.kickoff-row.complete .kickoff-action { color: #766D62; }

/* Meeting room: a calm run-of-show, not another generic settings list. */
.meeting-room-section { padding: 0; border: 0; border-radius: 0; background: transparent; }
.meeting-room-section > .section-head { padding: 4rpx 4rpx 22rpx; border-bottom: 1rpx solid rgba(42,37,31,.12); }
.meeting-room-section .section-title { font-family: Georgia, 'Times New Roman', serif; font-size: 33rpx; font-weight: 500; }
.meeting-brief { display: grid; grid-template-columns: 86rpx minmax(0,1fr); column-gap: 18rpx; margin-top: 22rpx; padding: 22rpx 20rpx 19rpx; border: 1rpx solid rgba(92,40,40,.19); background: #FCFBF8; }
.meeting-brief.brief-soon { border-color: rgba(92,40,40,.38); background: #F4ECE7; }
.meeting-brief-date { display: flex; align-items: flex-end; flex-direction: column; padding: 4rpx 16rpx 0 0; border-right: 1rpx solid rgba(42,37,31,.10); color: #5C2828; font-family: Georgia, 'Times New Roman', serif; font-size: 25rpx; line-height: 1.1; }
.meeting-brief-date text + text { margin-top: 8rpx; color: #817A70; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 16rpx; letter-spacing: .04em; }
.meeting-brief-copy { display: flex; min-width: 0; flex-direction: column; }
.meeting-brief-label,.meeting-ledger-label { display: block; color: #9A7C57; font: 600 15rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .12em; }
.meeting-brief-title { display: block; overflow: hidden; margin-top: 9rpx; color: #302B26; font-family: Georgia, 'Times New Roman', serif; font-size: 29rpx; font-weight: 500; line-height: 1.28; text-overflow: ellipsis; white-space: nowrap; }
.meeting-brief-meta,.meeting-brief-agenda { display: block; overflow: hidden; margin-top: 7rpx; color: #817A70; font-size: 18rpx; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.meeting-brief-agenda { color: #665D52; white-space: normal; }
.meeting-brief-actions { display: flex; grid-column: 2; flex-wrap: wrap; gap: 12rpx; align-items: center; margin-top: 14rpx; }
.meeting-brief-reminder { color: #745E3B; font-size: 17rpx; }
.meeting-link-action,.meeting-copy-action { color: #5C2828; font-size: 18rpx; }
.meeting-link-action { padding-bottom: 1rpx; border-bottom: 1rpx solid rgba(92,40,40,.32); }
.meeting-complete-action { margin-left: auto; padding: 7rpx 10rpx; border: 1rpx solid #302D29; color: #F8F5EE; background: #302D29; font-size: 17rpx; }
.meeting-ledger { margin-top: 44rpx; border-top: 1rpx solid rgba(42,37,31,.11); }
.meeting-ledger-label { padding: 18rpx 4rpx 9rpx; color: #8A8177; }
.meeting-room-section .meeting-row { gap: 16rpx; padding: 19rpx 4rpx; border-top: 1rpx solid rgba(42,37,31,.08); background: transparent; }
.meeting-room-section .meeting-row.meeting-soon { background: transparent; }
.meeting-room-section .meeting-date { width: 74rpx; flex-basis: 74rpx; padding-right: 13rpx; border-right: 1rpx solid rgba(42,37,31,.08); color: #5C2828; font-size: 21rpx; }
.meeting-room-section .meeting-title { font-family: Georgia, 'Times New Roman', serif; font-size: 24rpx; font-weight: 500; }
.meeting-room-section .meeting-meta { margin-top: 6rpx; color: #91897E; }
.meeting-agenda { display: -webkit-box; overflow: hidden; margin-top: 5rpx; color: #716960; font-size: 18rpx; line-height: 1.45; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.meeting-copy-action { align-self: center; padding: 6rpx 0; }
.meeting-history { opacity: .72; }
.meeting-history .meeting-title { color: #655F58; }
.meeting-empty { display: flex; align-items: center; flex-direction: column; gap: 5rpx; margin-top: 22rpx; padding: 52rpx 20rpx; border-top: 1rpx solid rgba(42,37,31,.10); border-bottom: 1rpx solid rgba(42,37,31,.10); }
.meeting-empty text:first-child { color: #403A33; font-family: Georgia, 'Times New Roman', serif; font-size: 27rpx; }.meeting-empty text + text { color: #8B8379; font-size: 19rpx; }
.meeting-sheet { overflow-y: auto; padding-top: 30rpx; }.meeting-sheet .sheet-copy { max-width: 560rpx; }.meeting-sheet .sheet-field-label { margin-top: 20rpx; color: #625B53; font: 600 17rpx/1.2 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; }.meeting-sheet .sheet-field-label text { color: #999187; font-family: system-ui, sans-serif; font-weight: 400; letter-spacing: 0; }.meeting-sheet .sheet-input,.meeting-sheet .sheet-textarea { margin-top: 10rpx; }.meeting-type-grid { grid-template-columns: repeat(3, minmax(0,1fr)); }.meeting-type-grid .choice-item { padding: 13rpx 6rpx; font-size: 18rpx; }.meeting-time-grid { display: grid; grid-template-columns: 1.2fr .8fr; gap: 10rpx; }.meeting-time-grid .picker-field { margin-top: 10rpx; }.meeting-sheet .sheet-actions { margin-top: 28rpx; }
@media (max-width: 360px) { .project-stage-line { grid-template-columns: repeat(2, minmax(0, 1fr)); }.stage-step:nth-child(3) { border-left: 0; }.stage-step:nth-child(-n + 2) { border-bottom: 1rpx solid rgba(42,37,31,.08); }.control-item { grid-template-columns: 28rpx minmax(0, 1fr) 16rpx; padding-right: 9rpx; padding-left: 9rpx; }.control-item:nth-child(odd) { border-right: 1rpx solid rgba(42,37,31,.09); }.control-value { font-size: 21rpx; }.control-meta { font-size: 15rpx; }.kickoff-row { grid-template-columns: 36rpx minmax(0, 1fr) auto; gap: 8rpx; }.kickoff-mark { width: 27rpx; height: 27rpx; font-size: 14rpx; }.kickoff-item-copy text:first-child { font-size: 20rpx; }.kickoff-item-copy text + text { font-size: 15rpx; }.kickoff-action { padding-left: 3rpx; font-size: 16rpx; }.meeting-brief { grid-template-columns: 76rpx minmax(0,1fr); column-gap: 12rpx; padding-right: 14rpx; padding-left: 14rpx; }.meeting-brief-title { font-size: 26rpx; }.meeting-brief-actions { gap: 8rpx; }.meeting-complete-action { margin-left: 0; }.meeting-type-grid .choice-item { font-size: 16rpx; } }
@keyframes spin { to { transform: rotate(360deg); } }

/* 项目工作台是信息密度最高的页面：标题、动作和长文本必须各自守住列宽。 */
.page {
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}
.project-header,
.title-row,
.project-title,
.section-head,
.section-head > view:first-child,
.focus-head,
.focus-head > view:first-child,
.summary-row,
.message-row,
.message-body,
.meeting-brief,
.meeting-brief-copy,
.meeting-brief-actions,
.file-row,
.activity-row {
  min-width: 0;
}
.project-header,
.section-head > view:first-child,
.focus-head > view:first-child,
.message-body,
.meeting-brief-copy { overflow: hidden; }
.title-row { gap: 12rpx; }
.project-title {
  display: block;
  flex: 1;
  max-width: none;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
  word-break: break-word;
}
.project-status,
.focus-count,
.section-note,
.text-action,
.row-action,
.meeting-status { flex: 0 0 auto; white-space: nowrap; }
.project-meta,
.project-guard { max-width: 100%; overflow-wrap: anywhere; word-break: break-word; }
.section-head { gap: 12rpx; }
.summary-cell { overflow: hidden; }
.summary-value { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.focus-copy,
.member-copy,
.milestone-copy,
.task-copy,
.file-copy,
.activity-copy,
.signal-copy,
.strip-copy,
.kickoff-item-copy,
.deliverable-copy,
.meeting-copy,
.candidate-copy { min-width: 0; }
.focus-action,
.signal-action,
.kickoff-action,
.member-remove,
.file-actions,
.candidate-action { flex: 0 0 auto; }
.strip-copy,
.message-content,
.message-attachment,
.activity-content,
.deliverable-desc,
.meeting-agenda { overflow-wrap: anywhere; word-break: break-word; }
.message-body { max-width: 78%; }
.message-content,
.message-attachment { max-width: 100%; box-sizing: border-box; }
.message-attachment { min-width: 0; overflow: hidden; }
.meeting-brief-date,
.meeting-date { flex: 0 0 auto; }
.meeting-brief-actions { flex-wrap: wrap; }
.meeting-complete-action { margin-left: auto; white-space: nowrap; }
.sheet { max-width: 100%; overflow-y: auto; box-sizing: border-box; }
.choice-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.permission-toggle,
.permission-member { min-width: 0; }
.permission-toggle > text:first-child,
.permission-member > view { min-width: 0; flex: 1; overflow: hidden; }
.permission-member > text { flex: 0 0 auto; white-space: nowrap; }

@media (max-width: 360px) {
  .page { padding-right: 18rpx; padding-left: 18rpx; }
  .project-title { font-size: 37rpx; }
  .summary-cell { padding-right: 7rpx; padding-left: 7rpx; font-size: 16rpx; }
  .focus-strip { padding-right: 12rpx; padding-left: 12rpx; }
  .section { padding-right: 16rpx; padding-left: 16rpx; }
  .meeting-brief { grid-template-columns: 70rpx minmax(0, 1fr); column-gap: 10rpx; padding-right: 12rpx; padding-left: 12rpx; }
  .meeting-complete-action { margin-left: 0; }
}
</style>
