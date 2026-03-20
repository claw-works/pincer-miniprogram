<template>
  <view class="detail-page">
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="project">
      <view class="info-card">
        <text class="project-name">{{ project.name }}</text>
        <text v-if="project.description" class="project-desc">{{ project.description }}</text>
        <view v-if="project.repo" class="repo-row">
          <text class="repo-label">Repo</text>
          <text class="repo-link" @tap="openRepo">{{ project.repo }}</text>
        </view>
      </view>

      <view v-if="project.room_id" class="room-btn-wrap">
        <button class="room-btn" @tap="enterRoom">进入聊天室 💬</button>
      </view>

      <view class="tasks-section">
        <text class="section-title">任务（{{ tasks.length }}）</text>
        <view v-for="t in tasks" :key="t.id" class="task-card">
          <view class="task-header">
            <text class="task-title">{{ t.title }}</text>
            <view class="status-badge" :class="t.status">{{ statusLabel(t.status) }}</view>
          </view>
          <text v-if="t.assigned_agent_id" class="task-assignee">{{ t.assigned_agent_id.slice(0, 8) }}</text>
        </view>
        <view v-if="tasks.length === 0" class="empty">暂无任务</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchProjects, fetchProjectTasks } from '../../api/index'
import type { Project, Task } from '../../api/index'

const project = ref<Project | null>(null)
const tasks = ref<Task[]>([])
const loading = ref(true)

onMounted(async () => {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  const projectId = page?.options?.id
  if (!projectId) { loading.value = false; return }

  try {
    const list = await fetchProjects()
    project.value = list.find(p => p.id === projectId) || null
    tasks.value = await fetchProjectTasks(projectId)
  } catch {}
  loading.value = false
})

function enterRoom() {
  if (project.value?.room_id) {
    uni.navigateTo({ url: `/pages/room/index?room_id=${project.value.room_id}` })
  }
}

function openRepo() {
  if (project.value?.repo) {
    uni.setClipboardData({ data: project.value.repo })
    uni.showToast({ title: '链接已复制', icon: 'success' })
  }
}

const STATUS_LABELS: Record<string, string> = {
  pending: '待认领', assigned: '已分配', running: '进行中',
  review: '待审核', done: '已完成', rejected: '已拒绝'
}
function statusLabel(s: string) { return STATUS_LABELS[s] || s }
</script>

<style scoped>
.detail-page { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }
.loading { text-align: center; padding: 80rpx; color: #999; }

.info-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.project-name { font-size: 36rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }
.project-desc { font-size: 28rpx; color: #555; line-height: 1.6; display: block; margin-bottom: 16rpx; white-space: pre-wrap; }
.repo-row { display: flex; align-items: center; gap: 12rpx; }
.repo-label { font-size: 22rpx; color: #999; font-weight: bold; }
.repo-link { font-size: 24rpx; color: #6366f1; }

.room-btn-wrap { margin-bottom: 20rpx; }
.room-btn { background: #6366f1; color: #fff; border-radius: 20rpx; font-size: 30rpx; }

.tasks-section { background: #fff; border-radius: 20rpx; padding: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }

.task-card { padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.task-header { display: flex; align-items: center; justify-content: space-between; }
.task-title { font-size: 28rpx; color: #333; flex: 1; }
.status-badge { font-size: 20rpx; border-radius: 10rpx; padding: 4rpx 12rpx; background: #e5e7eb; color: #666; }
.status-badge.running { background: #dbeafe; color: #2563eb; }
.status-badge.done { background: #dcfce7; color: #16a34a; }
.status-badge.review { background: #fef3c7; color: #d97706; }

.task-assignee { font-size: 22rpx; color: #999; margin-top: 4rpx; display: block; }
.empty { text-align: center; color: #ccc; padding: 40rpx; }
</style>
