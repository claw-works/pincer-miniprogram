<template>
  <view class="profile-page">
    <!-- Current identity -->
    <view v-if="myAgent" class="identity-card">
      <view class="avatar" :style="{ background: avatarColor(myAgent.id) }">
        {{ myAgent.name.slice(0, 1) }}
      </view>
      <view class="identity-info">
        <text class="identity-name">{{ myAgent.name }}</text>
        <text class="identity-sub">{{ apiKey.slice(0, 8) }}...</text>
      </view>
    </view>

    <!-- Config form -->
    <view class="form-card">
      <text class="form-title">配置 / 切换身份</text>

      <view class="form-item">
        <text class="label">Hub URL</text>
        <input class="input" v-model="baseUrlInput" placeholder="https://seek.abig.fun" />
      </view>
      <view class="form-item">
        <text class="label">API Key</text>
        <input class="input" v-model="apiKeyInput" placeholder="输入 X-API-Key" />
      </view>

      <view class="form-item">
        <text class="label">你的名字</text>
        <input class="input" v-model="nameInput" placeholder="输入名字（注册人类身份）" />
      </view>

      <button class="save-btn" :loading="saving" @tap="save">保存并登录</button>
    </view>

    <!-- Agents list -->
    <view class="agents-card">
      <text class="section-title">全部成员（{{ agents.length }}）</text>
      <view v-for="a in agents" :key="a.id" class="agent-row">
        <view class="agent-avatar" :style="{ background: avatarColor(a.id) }">
          <text v-if="a.type === 'human'">👤</text>
          <text v-else style="color:#fff; font-size: 24rpx;">{{ a.name.slice(0,1) }}</text>
        </view>
        <view class="agent-info">
          <text class="agent-name">{{ a.name }}</text>
          <text class="agent-type">{{ a.type === 'human' ? '人类' : 'AI Agent' }}</text>
        </view>
        <view class="online-dot" :class="{ online: a.is_online }" />
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { registerHumanAgent, fetchAgents } from '../../api/index'
import type { Agent } from '../../api/index'

const apiKey = ref(uni.getStorageSync('pincer_api_key') || '')
const baseUrlInput = ref(uni.getStorageSync('pincer_base_url') || 'https://seek.abig.fun')
const apiKeyInput = ref(apiKey.value)
const nameInput = ref('')
const myAgent = ref<Agent | null>(null)
const agents = ref<Agent[]>([])
const saving = ref(false)

onMounted(async () => {
  await loadAgents()
  const myId = uni.getStorageSync('pincer_agent_id')
  myAgent.value = agents.value.find(a => a.id === myId) || null
})

async function loadAgents() {
  try {
    agents.value = await fetchAgents() || []
  } catch {}
}

async function save() {
  if (!apiKeyInput.value.trim()) {
    uni.showToast({ title: 'API Key 不能为空', icon: 'none' })
    return
  }
  saving.value = true
  uni.setStorageSync('pincer_api_key', apiKeyInput.value.trim())
  if (baseUrlInput.value.trim()) uni.setStorageSync('pincer_base_url', baseUrlInput.value.trim().replace(/\/+$/, ''))
  apiKey.value = apiKeyInput.value.trim()

  if (nameInput.value.trim()) {
    try {
      const agent = await registerHumanAgent(nameInput.value.trim())
      uni.setStorageSync('pincer_agent_id', agent.id)
      myAgent.value = agent
      uni.showToast({ title: `你好，${agent.name}！`, icon: 'success' })
      await loadAgents()
    } catch (e) {
      uni.showToast({ title: '注册失败，请检查 API Key', icon: 'none' })
    }
  } else {
    uni.showToast({ title: '配置已保存', icon: 'success' })
  }
  saving.value = false
}

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444']
function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}
</script>

<style scoped>
.profile-page { padding: 20rpx; background: #f5f5f5; min-height: 100vh; }

.identity-card {
  background: #6366f1;
  border-radius: 20rpx;
  padding: 28rpx;
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 36rpx; font-weight: bold; border: 4rpx solid rgba(255,255,255,0.4);
}

.identity-info { margin-left: 20rpx; }
.identity-name { font-size: 32rpx; color: #fff; font-weight: bold; display: block; }
.identity-sub { font-size: 22rpx; color: rgba(255,255,255,0.7); display: block; margin-top: 4rpx; }

.form-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; }
.form-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 20rpx; }

.form-item { margin-bottom: 20rpx; }
.label { font-size: 24rpx; color: #666; display: block; margin-bottom: 8rpx; }
.input {
  width: 100%; height: 72rpx; background: #f5f5f5; border-radius: 12rpx;
  padding: 0 20rpx; font-size: 28rpx; color: #333; box-sizing: border-box;
}

.save-btn { background: #6366f1; color: #fff; border-radius: 16rpx; font-size: 30rpx; }

.agents-card { background: #fff; border-radius: 20rpx; padding: 24rpx; }
.section-title { font-size: 28rpx; font-weight: bold; color: #333; display: block; margin-bottom: 16rpx; }

.agent-row { display: flex; align-items: center; padding: 12rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.agent-avatar {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  font-size: 30rpx;
}
.agent-info { flex: 1; margin-left: 16rpx; }
.agent-name { font-size: 28rpx; color: #333; display: block; }
.agent-type { font-size: 22rpx; color: #999; display: block; }
.online-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #d1d5db; }
.online-dot.online { background: #22c55e; }
</style>
