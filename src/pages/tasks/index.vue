<template>
  <view class="tasks-page">
    <!-- Filter bar -->
    <view class="filter-bar">
      <picker mode="selector" :range="projectOptions" range-key="name" @change="onProjectChange">
        <view class="picker-btn">{{ currentProject?.name || '全部项目' }} ▾</view>
      </picker>
    </view>

    <!-- Status columns - horizontal scroll -->
    <scroll-view class="columns-wrap" scroll-x>
      <view class="columns">
        <view v-for="col in columns" :key="col.status" class="column">
          <view class="col-header">
            <text class="col-title">{{ col.label }}</text>
            <text class="col-count">{{ col.tasks.length }}</text>
          </view>
          <view v-for="t in col.tasks" :key="t.id" class="task-card" @tap="openTask(t)">
            <view class="priority-bar" :class="'p' + t.priority" />
            <text class="task-title">{{ t.title }}</text>
            <view v-if="t.assigned_agent_id" class="assignee">
              <view class="assignee-dot" :style="{ background: avatarColor(t.assigned_agent_id) }" />
              <text class="assignee-name">{{ agentName(t.assigned_agent_id) }}</text>
            </view>
          </view>
          <view v-if="col.tasks.length === 0" class="empty-col">空</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchTasks, fetchProjects, fetchAgents } from '../../api/index'
import type { Task, Project, Agent } from '../../api/index'

const tasks = ref<Task[]>([])
const projects = ref<Project[]>([])
const agents = ref<Agent[]>([])
const currentProjectIdx = ref(0)

const projectOptions = computed(() => [
  { id: '', name: '全部项目' },
  ...projects.value.map(p => ({ id: p.id, name: p.name }))
])

const currentProject = computed(() => projectOptions.value[currentProjectIdx.value])

const STATUSES = [
  { status: 'pending', label: '待认领' },
  { status: 'assigned', label: '已分配' },
  { status: 'running', label: '进行中' },
  { status: 'review', label: '待审核' },
  { status: 'done', label: '已完成' },
]

const filteredTasks = computed(() => {
  const pid = currentProject.value?.id
  return pid ? tasks.value.filter(t => t.project_id === pid) : tasks.value
})

const columns = computed(() =>
  STATUSES.map(s => ({
    ...s,
    tasks: filteredTasks.value.filter(t => t.status === s.status)
  }))
)

const agentMap = computed(() => Object.fromEntries(agents.value.map(a => [a.id, a])))

onMounted(async () => {
  const [t, p, a] = await Promise.allSettled([fetchTasks(), fetchProjects(), fetchAgents()])
  if (t.status === 'fulfilled') tasks.value = t.value || []
  if (p.status === 'fulfilled') projects.value = p.value || []
  if (a.status === 'fulfilled') agents.value = a.value || []
})

function onProjectChange(e: any) {
  currentProjectIdx.value = e.detail.value
  loadTasks()
}

async function loadTasks() {
  const pid = currentProject.value?.id
  try {
    tasks.value = await fetchTasks(pid || undefined)
  } catch {}
}

function openTask(t: Task) {
  uni.showModal({ title: t.title, content: t.description || '无描述', showCancel: false })
}

function agentName(id: string) {
  return agentMap.value[id]?.name || id.slice(0, 6)
}

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444']
function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}
</script>

<style scoped>
.tasks-page { background: #f5f5f5; min-height: 100vh; }

.filter-bar { padding: 16rpx 20rpx; background: #fff; border-bottom: 1rpx solid #eee; }
.picker-btn { font-size: 26rpx; color: #6366f1; padding: 8rpx 20rpx; background: #eef2ff; border-radius: 20rpx; display: inline-block; }

.columns-wrap { width: 100vw; }
.columns { display: flex; flex-direction: row; padding: 20rpx; gap: 16rpx; min-width: max-content; }

.column {
  width: 480rpx;
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  flex-shrink: 0;
}

.col-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16rpx; }
.col-title { font-size: 26rpx; font-weight: bold; color: #333; }
.col-count { font-size: 22rpx; color: #6366f1; background: #eef2ff; border-radius: 20rpx; padding: 2rpx 12rpx; }

.task-card {
  background: #f9fafb;
  border-radius: 12rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
  border-left: 6rpx solid #e5e7eb;
  overflow: hidden;
}

.priority-bar { height: 4rpx; border-radius: 2rpx; background: #e5e7eb; margin-bottom: 10rpx; }
.p8 { background: #ef4444; }
.p7 { background: #f97316; }
.p6 { background: #eab308; }
.p5 { background: #6366f1; }

.task-title { font-size: 26rpx; color: #333; line-height: 1.4; display: block; }

.assignee { display: flex; align-items: center; gap: 8rpx; margin-top: 10rpx; }
.assignee-dot { width: 16rpx; height: 16rpx; border-radius: 50%; }
.assignee-name { font-size: 22rpx; color: #999; }

.empty-col { text-align: center; color: #ccc; padding: 24rpx; font-size: 24rpx; }
</style>
