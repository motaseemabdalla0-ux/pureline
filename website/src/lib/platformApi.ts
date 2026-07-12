import type {
  AdminActivityEntry,
  AdminCustomer,
  AdminKpis,
  AdminLoginResponse,
  Asset,
  AssetMaintenance,
  Consultation,
  CreateAssetMaintenancePayload,
  CreateAssetPayload,
  CreateConsultationPayload,
  CreateIrrigationEventPayload,
  CreateIrrigationZonePayload,
  CreateOperationPayload,
  CreatePestDetectionPayload,
  CreatePestTrapPayload,
  CreatePestTreatmentPayload,
  CreateQuotationPayload,
  CreateServiceRequestPayload,
  IrrigationDashboard,
  IrrigationEvent,
  IrrigationZone,
  Operation,
  OpsDashboard,
  PestDashboard,
  PestDetection,
  PestTrap,
  PestTreatment,
  PestType,
  PlatformLoginPayload,
  PlatformLoginResponse,
  PlatformUser,
  Quotation,
  RegistryFarm,
  RequestStatus,
  ServiceRequest,
  StaffMember,
  StaffPerformance,
  UpdateIrrigationEventPayload,
  WorkforceAssignment,
  PlatformManagedUser,
  CreatePlatformUserPayload,
  UpdatePlatformUserPayload,
} from '../types/platform'

const BASE = '/api/platform'
export const ADMIN_TOKEN_KEY = 'pl_admin_token'
export const MY_REQUESTS_KEY = 'pl_my_requests'
export const PLATFORM_SESSION_KEY = 'pl_platform_session'

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

/* ---------- Platform auth (multi-role: admin/staff/customer) ---------- */

function getPlatformToken(): string | null {
  try {
    const raw = localStorage.getItem(PLATFORM_SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return parsed?.token ?? null
  } catch {
    return null
  }
}

/** Like `request`, but attaches the platform-auth Bearer token (new
 * multi-role login), not the old single-password admin token. */
async function platformRequest<T>(path: string, init?: RequestInit, explicitToken?: string): Promise<T> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) }
  if (init?.body && !(init.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }
  const token = explicitToken ?? getPlatformToken()
  if (token) headers['Authorization'] = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    throw new PlatformApiError('network_error', 0)
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

export function platformLogin(payload: PlatformLoginPayload) {
  return platformRequest<PlatformLoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function platformFetchMe(token: string) {
  return platformRequest<PlatformUser>('/auth/me', undefined, token)
}

/* ---------- Farm registry ---------- */

export function listRegistryFarms(params?: { region?: string; crop_type?: string; search?: string }) {
  const qs = new URLSearchParams()
  if (params?.region) qs.set('region', params.region)
  if (params?.crop_type) qs.set('crop_type', params.crop_type)
  if (params?.search) qs.set('search', params.search)
  const query = qs.toString()
  return platformRequest<RegistryFarm[]>(`/farms${query ? `?${query}` : ''}`)
}

export function getRegistryFarm(farmCode: string) {
  return platformRequest<RegistryFarm>(`/farms/${encodeURIComponent(farmCode)}`)
}

/* ---------- Field operations ---------- */

export function listOperations(params?: {
  farm_code?: string
  status?: string
  operation_type?: string
  assigned_to?: string
}, explicitToken?: string) {
  const qs = new URLSearchParams()
  if (params?.farm_code) qs.set('farm_code', params.farm_code)
  if (params?.status) qs.set('status', params.status)
  if (params?.operation_type) qs.set('operation_type', params.operation_type)
  if (params?.assigned_to) qs.set('assigned_to', params.assigned_to)
  const query = qs.toString()
  return platformRequest<Operation[]>(`/operations${query ? `?${query}` : ''}`, undefined, explicitToken)
}

export function getOperation(operationId: string) {
  return platformRequest<Operation>(`/operations/${encodeURIComponent(operationId)}`)
}

export function createOperation(payload: CreateOperationPayload) {
  return platformRequest<Operation>('/operations', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateOperationStatus(operationId: string, status: string, note?: string, explicitToken?: string) {
  return platformRequest<Operation>(`/operations/${encodeURIComponent(operationId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note }),
  }, explicitToken)
}

export async function uploadOperationAttachment(operationId: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return platformRequest<Operation>(`/operations/${encodeURIComponent(operationId)}/attachments`, {
    method: 'POST',
    body: form,
  })
}

/* ---------- Operations dashboard ---------- */

export function getOpsDashboard() {
  return platformRequest<OpsDashboard>('/ops/dashboard')
}

/* ---------- Pest management (IPM) ---------- */

export function listPestTypes() {
  return platformRequest<PestType[]>('/pests/types')
}

export function listPestDetections(params?: { farm_code?: string; risk_level?: string; status?: string }, explicitToken?: string) {
  const qs = new URLSearchParams()
  if (params?.farm_code) qs.set('farm_code', params.farm_code)
  if (params?.risk_level) qs.set('risk_level', params.risk_level)
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString()
  return platformRequest<PestDetection[]>(`/pests/detections${query ? `?${query}` : ''}`, undefined, explicitToken)
}

export function createPestDetection(payload: CreatePestDetectionPayload) {
  return platformRequest<PestDetection>('/pests/detections', { method: 'POST', body: JSON.stringify(payload) })
}

export function updatePestDetectionStatus(detectionId: string, status: string) {
  return platformRequest<PestDetection>(`/pests/detections/${encodeURIComponent(detectionId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function listPestTraps(params?: { farm_code?: string }) {
  const qs = new URLSearchParams()
  if (params?.farm_code) qs.set('farm_code', params.farm_code)
  const query = qs.toString()
  return platformRequest<PestTrap[]>(`/pests/traps${query ? `?${query}` : ''}`)
}

export function createPestTrap(payload: CreatePestTrapPayload) {
  return platformRequest<PestTrap>('/pests/traps', { method: 'POST', body: JSON.stringify(payload) })
}

/** The backend only exposes each pest treatment's public detection reference
 * indirectly (its internal numeric FK is never returned by the detections
 * endpoints), so treatments are always fetched unfiltered and matched to a
 * detection client-side. */
export function listPestTreatments() {
  return platformRequest<PestTreatment[]>('/pests/treatments')
}

export function createPestTreatment(payload: CreatePestTreatmentPayload) {
  return platformRequest<PestTreatment>('/pests/treatments', { method: 'POST', body: JSON.stringify(payload) })
}

export function getPestDashboard() {
  return platformRequest<PestDashboard>('/pests/dashboard')
}

/* ---------- Irrigation management ---------- */

export function listIrrigationZones(params?: { farm_code?: string }) {
  const qs = new URLSearchParams()
  if (params?.farm_code) qs.set('farm_code', params.farm_code)
  const query = qs.toString()
  return platformRequest<IrrigationZone[]>(`/irrigation/zones${query ? `?${query}` : ''}`)
}

export function createIrrigationZone(payload: CreateIrrigationZonePayload) {
  return platformRequest<IrrigationZone>('/irrigation/zones', { method: 'POST', body: JSON.stringify(payload) })
}

export function listIrrigationEvents(params?: { zone_id?: string; farm_code?: string; status?: string }) {
  const qs = new URLSearchParams()
  if (params?.zone_id) qs.set('zone_id', params.zone_id)
  if (params?.farm_code) qs.set('farm_code', params.farm_code)
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString()
  return platformRequest<IrrigationEvent[]>(`/irrigation/events${query ? `?${query}` : ''}`)
}

export function createIrrigationEvent(payload: CreateIrrigationEventPayload) {
  return platformRequest<IrrigationEvent>('/irrigation/events', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateIrrigationEvent(eventId: string, payload: UpdateIrrigationEventPayload) {
  return platformRequest<IrrigationEvent>(`/irrigation/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getIrrigationDashboard() {
  return platformRequest<IrrigationDashboard>('/irrigation/dashboard')
}

/* ---------- Asset management ---------- */

export function listAssets(params?: { category?: string; status?: string; farm_code?: string }, explicitToken?: string) {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.status) qs.set('status', params.status)
  if (params?.farm_code) qs.set('farm_code', params.farm_code)
  const query = qs.toString()
  return platformRequest<Asset[]>(`/assets${query ? `?${query}` : ''}`, undefined, explicitToken)
}

export function getAsset(assetCode: string) {
  return platformRequest<Asset>(`/assets/${encodeURIComponent(assetCode)}`)
}

export function createAsset(payload: CreateAssetPayload) {
  return platformRequest<Asset>('/assets', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateAssetStatus(assetCode: string, status: string) {
  return platformRequest<Asset>(`/assets/${encodeURIComponent(assetCode)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function listAssetMaintenance(assetCode: string) {
  return platformRequest<AssetMaintenance[]>(`/assets/${encodeURIComponent(assetCode)}/maintenance`)
}

export function createAssetMaintenance(assetCode: string, payload: CreateAssetMaintenancePayload) {
  return platformRequest<AssetMaintenance>(`/assets/${encodeURIComponent(assetCode)}/maintenance`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

/* ---------- Workforce management (staff/admin only) ---------- */

export function listStaff(explicitToken?: string) {
  return platformRequest<StaffMember[]>('/workforce/staff', undefined, explicitToken)
}

export function getStaffAssignments(staffId: number) {
  return platformRequest<WorkforceAssignment[]>(`/workforce/staff/${staffId}/assignments`)
}

export function getWorkforcePerformance(explicitToken?: string) {
  return platformRequest<StaffPerformance[]>('/workforce/performance', undefined, explicitToken)
}


/* ---------- User management (admin-only) ---------- */

export function listPlatformUsers(params?: { role?: string; search?: string }) {
  const qs = new URLSearchParams()
  if (params?.role) qs.set('role', params.role)
  if (params?.search) qs.set('search', params.search)
  const query = qs.toString()
  return platformRequest<PlatformManagedUser[]>(`/users${query ? `?${query}` : ''}`)
}

export function createPlatformUser(payload: CreatePlatformUserPayload) {
  return platformRequest<PlatformManagedUser>('/users', { method: 'POST', body: JSON.stringify(payload) })
}

export function updatePlatformUser(userId: number, payload: UpdatePlatformUserPayload) {
  return platformRequest<PlatformManagedUser>(`/users/${userId}`, { method: 'PATCH', body: JSON.stringify(payload) })
}
