<template>
  <view class="projects-page">
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else>
      <view
        v-for="p in projects"
        :key="p.id"
        class="project-card"
        @tap="openProject(p)"
      >
        <view class="project-header">
          <text class="project-name">{{ p.name }}</text>
          <view v-if="p.room_id" class="chat-badge">聊天室</view>
        </view>
        <text v-if="p.description" class="project-desc">{{ stripMarkdown(p.description) }}</text>
        <text v-if="p.repo" class="project-repo">{{ p.repo }}</text>
        <view class="project-footer">
          <text class="task-count">{{ taskCounts[p.id] ?? '...' }} 个任务</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchProjects, fetchProjectTasks } from '../../api/index'
import type { Project } from '../../api/index'

const projects = ref<Project[]>([])
const taskCounts = ref<Record<string, number>>({})
const loading = ref(true)

onMounted(async () => {
  try {
    const list = await fetchProjects()
    projects.value = list || []
    // Load task counts in parallel
    await Promise.all(list.map(async p => {
      try {
        const tasks = await fetchProjectTasks(p.id)
        taskCounts.value[p.id] = tasks.length
      } catch { taskCounts.value[p.id] = 0 }
    }))
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
})

function openProject(p: Project) {
  uni.navigateTo({ url: `/pages/projects/detail?id=${p.id}` })
}

function stripMarkdown(text: string) {
  return text.replace(/[#*`_~\[\]]/g, '').slice(0, 80)
}
</script>

<style scoped>
.projects-page { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }

.loading { text-align: center; padding: 80rpx; color: #999; }

.project-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.project-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.project-name { font-size: 32rpx; font-weight: bold; color: #333; }

.chat-badge {
  background: #6366f1;
  color: #fff;
  border-radius: 20rpx;
  padding: 4rpx 16rpx;
  font-size: 22rpx;
}

.project-desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  display: block;
  margin-bottom: 8rpx;
}

.project-repo {
  font-size: 22rpx;
  color: #6366f1;
  display: block;
  margin-bottom: 8rpx;
}

.project-footer { border-top: 1rpx solid #f0f0f0; padding-top: 12rpx; margin-top: 12rpx; }
.task-count { font-size: 24rpx; color: #999; }
</style>
