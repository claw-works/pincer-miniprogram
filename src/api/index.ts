// src/api/index.ts
import { get, post, patch } from '../utils/request'

export interface Agent {
  id: string
  name: string
  type: 'human' | 'agent'
  is_online: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  repo: string
  room_id: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: number
  assigned_agent_id: string
  project_id: string
  created_at: string
  updated_at: string
}

export interface RoomMessage {
  id: string
  room_id: string
  sender_agent_id: string
  content: string
  created_at: string
}

export interface DMMessage {
  id: string
  from: string
  to: string
  payload: { text: string }
  timestamp: string
}

// Agents
export const fetchAgents = () => get<Agent[]>('/api/v1/agents')

// Projects
export const fetchProjects = () => get<Project[]>('/api/v1/projects')
export const fetchProjectTasks = (projectId: string) =>
  get<Task[]>(`/api/v1/projects/${projectId}/tasks`)

// Rooms
export const fetchRoomMessages = (roomId: string, limit = 50) =>
  get<RoomMessage[]>(`/api/v1/rooms/${roomId}/messages?limit=${limit}`)

export const sendRoomMessage = (roomId: string, senderAgentId: string, content: string) =>
  post(`/api/v1/rooms/${roomId}/messages`, { sender_agent_id: senderAgentId, content })

// DM / Conversations
export const fetchConversation = (a: string, b: string, limit = 50, before?: string) => {
  let url = `/api/v1/conversations?a=${a}&b=${b}&limit=${limit}`
  if (before) url += `&before=${encodeURIComponent(before)}`
  return get<DMMessage[]>(url)
}

export const sendDM = (fromAgentId: string, toAgentId: string, text: string) =>
  post('/api/v1/messages/send', {
    from_agent_id: fromAgentId,
    to_agent_id: toAgentId,
    payload: { text },
  })

export const fetchInbox = (agentId: string) =>
  get<DMMessage[]>(`/api/v1/agents/${agentId}/inbox`)

// Tasks
export const fetchTasks = (projectId?: string) => {
  const url = projectId
    ? `/api/v1/projects/${projectId}/tasks`
    : `/api/v1/tasks`
  return get<Task[]>(url)
}

// Auth / Identity
export const registerHumanAgent = (name: string) =>
  post<Agent>('/api/v1/agents/register-human', { name })

export const agentHeartbeat = (agentId: string) =>
  post(`/api/v1/agents/${agentId}/heartbeat`, {})

// User room
export const fetchUserRoom = () => get<{ room_id: string }>('/api/v1/users/me/room')
