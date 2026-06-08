// 前后端同域名部署，生产和开发都用相对路径
const API_BASE = '/api'

async function request<T>(path: string, options: RequestInit = {}): Promise<{ success: boolean; data?: T; error?: string }> {
  // 管理员 API 用 admin_token，其他用用户 token
  const isAdminPath = path.startsWith('/admin/')
  const adminToken = localStorage.getItem('admin_token')
  const userToken = localStorage.getItem('ql_token')

  let tokenValue = null
  if (isAdminPath && adminToken) {
    tokenValue = adminToken  // admin_token 是纯字符串，不用 JSON.parse
  } else if (userToken) {
    try { tokenValue = JSON.parse(userToken) } catch { tokenValue = userToken }
  }

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
