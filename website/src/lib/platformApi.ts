import type {
  AdminActivityEntry,
  AdminCustomer,
  AdminKpis,
  AdminLoginResponse,
  Consultation,
  CreateConsultationPayload,
  CreateQuotationPayload,
  CreateServiceRequestPayload,
  Quotation,
  RequestStatus,
  ServiceRequest,
} from '../types/platform'

const BASE = '/api/platform'
export const ADMIN_TOKEN_KEY = 'pl_admin_token'
export const MY_REQUESTS_KEY = 'pl_my_requests'

export class PlatformApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'PlatformApiError'
    this.status = status
  }
}

function getAdminToken(): string | null {
  try { return localStorage.getItem(ADMIN_TOKEN_KEY) } catch { return null }
}

export function setAdminToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
    else localStorage.removeItem(ADMIN_TOKEN_KEY)
  } catch { /* ignore */ }
}

async function request<T>(path: string, init?: RequestInit, admin = false): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) }
  if (init?.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  if (admin) {
    const token = getAdminToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    throw new PlatformApiError('network_error', 0)
  }
  if (res.status === 401 && admin) {
    setAdminToken(null)
  }
  if (!res.ok) {
    let message = `request_failed_${res.status}`
    try {
      const data = await res.json()
      if (data?.detail) message = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
      else if (data?.message) message = data.message
    } catch { /* ignore */ }
    throw new PlatformApiError(message, res.status)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

/* ---------- Customer-facing endpoints ---------- */

export function createServiceRequest(payload: CreateServiceRequestPayload) {
  return request<ServiceRequest>('/requests', { method: 'POST', body: JSON.stringify(payload) })
}

export function lookupRequestsByEmail(email: string) {
  return request<ServiceRequest[]>(`/requests/lookup?email=${encodeURIComponent(email)}`)
}

export function getRequest(requestId: string) {
  return request<ServiceRequest>(`/requests/${encodeURIComponent(requestId)}`)
}

export async function uploadAttachment(requestId: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return request<ServiceRequest>(`/requests/${encodeURIComponent(requestId)}/attachments`, {
    method: 'POST',
    body: form,
  })
}

export function getQuotation(quoteId: string) {
  return request<Quotation>(`/quotations/${encodeURIComponent(quoteId)}`)
}

export function quotationPdfUrl(quoteId: string) {
  return `${BASE}/quotations/${encodeURIComponent(quoteId)}/pdf`
}

export function createConsultation(payload: CreateConsultationPayload) {
  return request<Consultation>('/consultations', { method: 'POST', body: JSON.stringify(payload) })
}

export function lookupConsultationsByEmail(email: string) {
  return request<Consultation[]>(`/consultations/lookup?email=${encodeURIComponent(email)}`)
}

export function reportPdfUrl(reportType: string, farmId: string, params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v))
  })
  const query = qs.toString()
  return `${BASE}/reports/${encodeURIComponent(reportType)}/${encodeURIComponent(farmId)}/pdf${query ? `?${query}` : ''}`
}

/* ---------- localStorage helpers ---------- */

export function rememberMyRequest(requestId: string, email: string) {
  try {
    const raw = localStorage.getItem(MY_REQUESTS_KEY)
    const list: { request_id: string; email: string }[] = raw ? JSON.parse(raw) : []
    if (!list.some((r) => r.request_id === requestId)) {
      list.push({ request_id: requestId, email })
      localStorage.setItem(MY_REQUESTS_KEY, JSON.stringify(list))
    }
  } catch { /* ignore */ }
}

export function getLastRememberedEmail(): string | null {
  try {
    const raw = localStorage.getItem(MY_REQUESTS_KEY)
    if (!raw) return null
    const list: { request_id: string; email: string }[] = JSON.parse(raw)
    return list.length ? list[list.length - 1].email : null
  } catch { return null }
}

/* ---------- Admin endpoints ---------- */

export function adminLogin(password: string) {
  return request<AdminLoginResponse>('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
}

export function adminListRequests() {
  return request<ServiceRequest[]>('/admin/requests', undefined, true)
}

export function adminUpdateRequestStatus(requestId: string, status: RequestStatus, note?: string) {
  return request<ServiceRequest>(`/admin/requests/${encodeURIComponent(requestId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  }, true)
}

export function adminListCustomers() {
  return request<AdminCustomer[]>('/admin/customers', undefined, true)
}

export function adminGetKpis() {
  return request<AdminKpis>('/admin/kpis', undefined, true)
}

export function adminGetActivity() {
  return request<AdminActivityEntry[]>('/admin/activity', undefined, true)
}

export function adminCreateQuotation(payload: CreateQuotationPayload) {
  return request<Quotation>('/quotations', { method: 'POST', body: JSON.stringify(payload) }, true)
}
