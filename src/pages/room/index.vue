<template>
  <view class="room-page">
    <!-- Messages -->
    <scroll-view
      class="messages"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-with-animation="false"
      @scroll="onScroll"
    >
      <view v-for="msg in messages" :key="msg.id" class="msg-row" :class="{ self: msg.sender_agent_id === myAgentId }">
        <view class="avatar" :style="{ background: avatarColor(msg.sender_agent_id) }">
          {{ agentInitial(msg.sender_agent_id) }}
        </view>
        <view class="bubble-wrap">
          <text class="sender-name">{{ agentName(msg.sender_agent_id) }}</text>
          <view class="bubble">
            <text class="msg-text" user-select>{{ msg.content }}</text>
          </view>
          <text class="msg-time">{{ formatTime(msg.created_at) }}</text>
        </view>
      </view>
      <view style="height: 80rpx" />
    </scroll-view>

    <!-- Input bar -->
    <view class="input-bar" :style="{ paddingBottom: safeBottom + 'px' }">
      <input
        class="input"
        v-model="inputText"
        placeholder="发消息..."
        :adjust-position="true"
        confirm-type="send"
        @confirm="sendMsg"
      />
      <button class="send-btn" @tap="sendMsg">发送</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { fetchRoomMessages, sendRoomMessage, fetchAgents, fetchUserRoom } from '../../api/index'
import { PincerSocket } from '../../utils/socket'
import type { RoomMessage, Agent } from '../../api/index'

const messages = ref<RoomMessage[]>([])
const inputText = ref('')
const scrollTop = ref(99999)
const safeBottom = ref(0)
const myAgentId = ref('')
const roomId = ref('')
const agents = ref<Agent[]>([])
let socket: PincerSocket | null = null
let inboxTimer: number | null = null

const agentMap = ref<Record<string, Agent>>({})

onMounted(async () => {
  // Safe area
  const info = uni.getSystemInfoSync()
  safeBottom.value = info.safeAreaInsets?.bottom || 0
  
  myAgentId.value = uni.getStorageSync('pincer_agent_id') || ''
  
  // Load agents
  try {
    const list = await fetchAgents()
    agents.value = list || []
    agentMap.value = Object.fromEntries(list.map(a => [a.id, a]))
  } catch {}
  
  // Get room ID (default room)
  try {
    const pages = getCurrentPages()
    const page = pages[pages.length - 1] as any
    roomId.value = page?.options?.room_id || uni.getStorageSync('pincer_default_room') || ''
  } catch {}

  if (!roomId.value) {
    // Use stored room
    roomId.value = uni.getStorageSync('pincer_default_room') || ''
  }

  if (roomId.value) {
    await loadMessages()
    connectWS()
  }
})

onUnmounted(() => {
  socket?.destroy()
  if (inboxTimer) clearInterval(inboxTimer)
})

async function loadMessages() {
  try {
    const msgs = await fetchRoomMessages(roomId.value, 50)
    messages.value = msgs || []
    await nextTick()
    scrollToBottom()
  } catch (e) {
    console.error('loadMessages', e)
  }
}

function connectWS() {
  socket = new PincerSocket(`/api/v1/rooms/${roomId.value}/ws`, (data) => {
    if (data.type === 'room.message' || data.event === 'room.message') {
      const msg = data.message || data.payload
      if (msg && !messages.value.find(m => m.id === msg.id)) {
        messages.value.push(msg)
        nextTick(() => scrollToBottom())
      }
    }
  })
}

async function sendMsg() {
  const text = inputText.value.trim()
  if (!text || !roomId.value || !myAgentId.value) return
  inputText.value = ''
  try {
    await sendRoomMessage(roomId.value, myAgentId.value, text)
    await loadMessages()
  } catch (e) {
    uni.showToast({ title: '发送失败', icon: 'none' })
  }
}

function scrollToBottom() {
  scrollTop.value = 999999
}

function onScroll() {}

function agentName(id: string) {
  return agentMap.value[id]?.name || id.slice(0, 6)
}

function agentInitial(id: string) {
  const name = agentMap.value[id]?.name || '?'
  return name.slice(0, 1)
}

const COLORS = ['#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981','#f59e0b','#ef4444']
function avatarColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}
</script>

<style scoped>
.room-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }

.messages {
  flex: 1;
  padding: 16rpx 20rpx 0;
  box-sizing: border-box;
}

.msg-row {
  display: flex;
  flex-direction: row;
  margin-bottom: 24rpx;
  align-items: flex-start;
}

.msg-row.self {
  flex-direction: row-reverse;
}

.avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
  flex-shrink: 0;
}

.bubble-wrap {
  max-width: 70%;
  margin: 0 16rpx;
}

.msg-row.self .bubble-wrap { align-items: flex-end; display: flex; flex-direction: column; }

.sender-name { font-size: 22rpx; color: #999; margin-bottom: 6rpx; display: block; }

.bubble {
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

.msg-row.self .bubble { background: #6366f1; }
.msg-row.self .msg-text { color: #fff; }

.msg-text { font-size: 28rpx; color: #333; line-height: 1.5; }
.msg-time { font-size: 20rpx; color: #ccc; margin-top: 4rpx; display: block; }

.input-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  box-sizing: border-box;
}

.input {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 28rpx;
  font-size: 28rpx;
  color: #333;
}

.send-btn {
  margin-left: 16rpx;
  background: #6366f1;
  color: #fff;
  border-radius: 36rpx;
  font-size: 26rpx;
  padding: 0 32rpx;
  height: 72rpx;
  line-height: 72rpx;
  min-width: unset;
}
</style>
