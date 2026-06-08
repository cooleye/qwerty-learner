// 前后端同域名部署，生产和开发都用相对路径
const API_BASE = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = localStorage.getItem('ql_token')
  const tokenValue = token ? JSON.parse(token) : null

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (tokenValue) {
    headers.authorization = `Bearer ${tokenValue}`
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    return await res.json()
  } catch {
    return { success: false, error: '网络错误' }
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
}
