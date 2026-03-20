<template>
  <view class="chat-page">
    <view v-if="hasMore && !loadingMore" class="load-more" @tap="loadMore">
      <text>↑ 加载更多</text>
    </view>
    <view v-if="loadingMore" class="loading-more">加载中...</view>

    <scroll-view class="messages" scroll-y :scroll-top="scrollTop" :scroll-with-animation="false">
      <view v-for="msg in messages" :key="msg.id" class="msg-row" :class="{ self: isSelf(msg) }">
        <view class="bubble">
          <text class="msg-text" user-select>{{ msgText(msg) }}</text>
          <text class="msg-time">{{ formatTime(msg.timestamp || msg.created_at) }}</text>
        </view>
      </view>
      <view style="height: 80rpx" />
    </scroll-view>

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
import { fetchConversation, sendDM, fetchInbox } from '../../api/index'

const messages = ref<any[]>([])
const inputText = ref('')
const scrollTop = ref(99999)
const safeBottom = ref(0)
const hasMore = ref(true)
const loadingMore = ref(false)

let otherAgentId = ''
let myAgentId = ''
let inboxTimer: number | null = null

onMounted(async () => {
  const info = uni.getSystemInfoSync()
  safeBottom.value = info.safeAreaInsets?.bottom || 0
  myAgentId = uni.getStorageSync('pincer_agent_id') || ''

  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  otherAgentId = page?.options?.agent_id || ''
  const agentName = decodeURIComponent(page?.options?.agent_name || otherAgentId.slice(0,8))
  uni.setNavigationBarTitle({ title: agentName })

  await loadMessages()
  startInboxPoll()
})

onUnmounted(() => {
  if (inboxTimer) clearInterval(inboxTimer)
})

async function loadMessages() {
  if (!myAgentId || !otherAgentId) return
  try {
    const msgs = await fetchConversation(myAgentId, otherAgentId, 50)
    messages.value = msgs || []
    await nextTick()
    scrollTop.value = 999999
  } catch {}
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  try {
    const oldest = messages.value[0]
    if (!oldest) { hasMore.value = false; return }
    const before = oldest.timestamp || oldest.created_at
    const older = await fetchConversation(myAgentId, otherAgentId, 50, before)
    if (!older || older.length === 0) { hasMore.value = false; return }
    if (older.length < 50) hasMore.value = false
    messages.value = [...older, ...messages.value]
  } catch {}
  loadingMore.value = false
}

function startInboxPoll() {
  inboxTimer = setInterval(async () => {
    try {
      const inbox = await fetchInbox(myAgentId)
      if (!inbox || inbox.length === 0) return
      const seenIds = new Set(messages.value.map((m: any) => m.id))
      for (const msg of inbox) {
        const from = msg.from || (msg as any).From || ''
        if (from !== otherAgentId) continue
        if (msg.id && seenIds.has(msg.id)) continue
        messages.value.push(msg)
      }
      await nextTick()
      scrollTop.value = 999999
    } catch {}
  }, 10000) as unknown as number
}

async function sendMsg() {
  const text = inputText.value.trim()
  if (!text || !myAgentId || !otherAgentId) return
  inputText.value = ''
  try {
    await sendDM(myAgentId, otherAgentId, text)
    await loadMessages()
  } catch {
    uni.showToast({ title: '发送失败', icon: 'none' })
  }
}

function isSelf(msg: any) {
  return (msg.from || msg.From || '') === myAgentId
}

function msgText(msg: any) {
  return msg?.payload?.text || msg?.Payload?.text || JSON.stringify(msg.payload || {})
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
}
</script>

<style scoped>
.chat-page { display: flex; flex-direction: column; height: 100vh; background: #f5f5f5; }

.load-more { text-align: center; padding: 16rpx; color: #6366f1; font-size: 24rpx; }
.loading-more { text-align: center; padding: 16rpx; color: #999; font-size: 24rpx; }

.messages { flex: 1; padding: 16rpx 20rpx 0; }

.msg-row { display: flex; margin-bottom: 20rpx; }
.msg-row.self { justify-content: flex-end; }

.bubble {
  max-width: 72%;
  background: #fff;
  border-radius: 16rpx;
  padding: 16rpx 20rpx;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.msg-row.self .bubble { background: #6366f1; }
.msg-row.self .msg-text { color: #fff; }
.msg-row.self .msg-time { color: rgba(255,255,255,0.7); }

.msg-text { font-size: 28rpx; color: #333; line-height: 1.5; display: block; }
.msg-time { font-size: 20rpx; color: #ccc; margin-top: 6rpx; display: block; text-align: right; }

.input-bar {
  display: flex;
  align-items: center;
  padding: 16rpx 20rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
}

.input {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 28rpx;
  font-size: 28rpx;
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
