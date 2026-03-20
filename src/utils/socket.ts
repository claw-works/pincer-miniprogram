// src/utils/socket.ts
// WebSocket wrapper for uni-app with auto-reconnect and dedup

const API_BASE = import.meta.env.VITE_API_BASE || 'https://seek.abig.fun'
const WS_BASE = API_BASE.replace('https://', 'wss://').replace('http://', 'ws://')

const SEEN_MAX = 500

type MessageHandler = (data: any) => void

export class PincerSocket {
  private url: string
  private onMessage: MessageHandler
  private socketTask: UniApp.SocketTask | null = null
  private reconnectDelay = 3000
  private maxDelay = 60000
  private destroyed = false
  private seenIds = new Set<string>()
  private seenQueue: string[] = []

  constructor(path: string, onMessage: MessageHandler) {
    const apiKey = uni.getStorageSync('pincer_api_key') || ''
    this.url = `${WS_BASE}${path}${path.includes('?') ? '&' : '?'}api_key=${apiKey}`
    this.onMessage = onMessage
    this.connect()
  }

  private connect() {
    if (this.destroyed) return
    this.socketTask = uni.connectSocket({
      url: this.url,
      fail: () => this.scheduleReconnect(),
    })
    this.socketTask.onOpen(() => {
      this.reconnectDelay = 3000
    })
    this.socketTask.onMessage((evt) => {
      try {
        const data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data
        const id = data.id || data.ID || data.trace_id || ''
        if (id && this.seenIds.has(id)) return
        if (id) {
          this.seenIds.add(id)
          this.seenQueue.push(id)
          if (this.seenQueue.length > SEEN_MAX) {
            const old = this.seenQueue.shift()!
            this.seenIds.delete(old)
          }
        }
        this.onMessage(data)
      } catch {}
    })
    this.socketTask.onClose(() => this.scheduleReconnect())
    this.socketTask.onError(() => this.scheduleReconnect())
  }

  private scheduleReconnect() {
    if (this.destroyed) return
    setTimeout(() => this.connect(), this.reconnectDelay)
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay)
  }

  send(data: any) {
    this.socketTask?.send({ data: JSON.stringify(data) })
  }

  destroy() {
    this.destroyed = true
    this.socketTask?.close({})
  }
}
