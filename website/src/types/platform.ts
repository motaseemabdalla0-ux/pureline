/* Typed payloads for the /api/platform/* backend. */

export type RequestStatus =
  | 'submitted'
  | 'under_review'
  | 'quotation_sent'
  | 'approved'
  | 'in_progress'
  | 'completed'

export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent'

export type ConsultationKind = 'consultation' | 'assessment' | 'feasibility_study'

export type QuotationTemplate = 'greenhouse' | 'irrigation' | 'ndvi' | 'consultancy'

export type ReportType = 'ndvi' | 'satellite' | 'health' | 'operational'

export interface CustomerInfo {
  full_name: string
  company?: string
  email: string
  phone: string
  whatsapp?: string
}

export interface StatusEvent {
  status: RequestStatus
  note?: string
  created_at: string
}

export interface Attachment {
  id: string
  file_name: string
  url?: string
  uploaded_at: string
}

export interface LineItem {
  description: string
  qty: number
  unit_price: number
}

export interface Quotation {
  quote_id: string
  request_id?: string
  template: QuotationTemplate
  currency: string
  line_items: LineItem[]
  subtotal: number
  tax_percent: number
  tax_amount: number
  total: number
  terms: string
  valid_until: string
  created_at: string
}

export interface ServiceRequest {
  request_id: string
  customer: CustomerInfo
  farm_name?: string
  farm_location?: string
  farm_size?: string
  crop_type?: string
  service_slug: string
  service_name: string
  description?: string
  priority?: RequestPriority
  status: RequestStatus
  status_events: StatusEvent[]
  quotations: Quotation[]
  attachments: Attachment[]
  created_at?: string
  updated_at?: string
}

export interface CreateServiceRequestPayload {
  customer: CustomerInfo
  farm_name?: string
  farm_location?: string
  farm_size?: string
  crop_type?: string
  service_slug: string
  service_name: string
  description?: string
  priority?: RequestPriority
}

export interface Consultation {
  id: string
  customer: CustomerInfo
  kind: ConsultationKind
  farm_context?: Record<string, unknown>
  notes?: string
  status: string
  advisory_report?: string
  created_at: string
}

export interface CreateConsultationPayload {
  customer: CustomerInfo
  kind: ConsultationKind
  farm_context?: Record<string, unknown>
  notes?: string
}

export interface CreateQuotationPayload {
  request_id: string
  template: QuotationTemplate
  currency?: string
  line_items: LineItem[]
  tax_percent?: number
  terms?: string
  valid_days?: number
}

export interface AdminLoginResponse {
  token: string
}

export interface AdminKpis {
  total_requests: number
  open_requests: number
  total_quotations: number
  total_customers: number
  requests_by_status: Record<string, number>
  requests_by_service: Record<string, number>
}

export interface AdminCustomer {
  email: string
  full_name: string
  company?: string
  phone?: string
  whatsapp?: string
  request_count?: number
  created_at?: string
}

export interface AdminActivityEntry {
  id: string
  type: string
  message: string
  created_at: string
}

/** Locally-persisted pointer so the customer dashboard can find a request
 * right after submission, before the user re-enters their email. */
export interface MyRequestPointer {
  request_id: string
  email: string
}
