<template>
  <view class="dm-list-page">
    <view class="section-title">伙伴</view>
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else>
      <view
        v-for="agent in agents"
        :key="agent.id"
        class="agent-row"
        @tap="openChat(agent)"
      >
        <view class="avatar" :style="{ background: avatarColor(agent.id) }">
          <text v-if="agent.type === 'human'" class="avatar-icon">👤</text>
          <text v-else class="avatar-text">{{ agent.name.slice(0, 1) }}</text>
        </view>
        <view class="agent-info">
          <view class="agent-name-row">
            <text class="agent-name">{{ agent.name }}</text>
            <text class="agent-type">{{ agent.type === 'human' ? '人类' : 'AI' }}</text>
          </view>
        </view>
        <view class="online-dot" :class="{ online: agent.is_online }" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchAgents } from '../../api/index'
import type { Agent } from '../../api/index'

const agents = ref<Agent[]>([])
const loading = ref(true)
const myAgentId = uni.getStorageSync('pincer_agent_id') || ''

onMounted(async () => {
  try {
    const list = await fetchAgents()
    // Filter out self
    agents.value = (list || []).filter(a => a.id !== myAgentId)
  } catch {}
  loading.value = false
})

function openChat(agent: Agent) {
  uni.navigateTo({ url: `/pages/dm/chat?agent_id=${agent.id}&agent_name=${encodeURIComponent(agent.name)}` })
}

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444']
function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}
</script>

<style scoped>
.dm-list-page { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; padding: 8rpx 12rpx 20rpx; }
.loading { text-align: center; padding: 80rpx; color: #999; }

.agent-row {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 12rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-icon { font-size: 40rpx; }
.avatar-text { font-size: 32rpx; color: #fff; font-weight: bold; }

.agent-info { flex: 1; margin-left: 20rpx; }
.agent-name-row { display: flex; align-items: center; gap: 12rpx; }
.agent-name { font-size: 30rpx; color: #333; font-weight: 500; }
.agent-type { font-size: 20rpx; color: #999; background: #f0f0f0; border-radius: 8rpx; padding: 2rpx 10rpx; }

.online-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #d1d5db;
}
.online-dot.online { background: #22c55e; }
</style>
