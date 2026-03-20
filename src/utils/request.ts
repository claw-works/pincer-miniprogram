// src/utils/request.ts
// HTTP request wrapper for uni-app (replaces axios)

const DEFAULT_BASE = import.meta.env.VITE_API_BASE || 'https://seek.abig.fun'

function getApiKey(): string {
  return uni.getStorageSync('pincer_api_key') || ''
}

function getApiBase(): string {
  return (uni.getStorageSync('pincer_base_url') || DEFAULT_BASE).replace(/\/+$/, '')
}

export function request<T = any>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  data?: any
): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${getApiBase()}${path}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'X-API-Key': getApiKey(),
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(res.data)}`))
        }
      },
      fail: (err) => reject(new Error(err.errMsg)),
    })
  })
}

export function get<T = any>(path: string): Promise<T> {
  return request<T>('GET', path)
}

export function post<T = any>(path: string, data: any): Promise<T> {
  return request<T>('POST', path, data)
}

export function patch<T = any>(path: string, data: any): Promise<T> {
  return request<T>('PATCH', path, data)
}
