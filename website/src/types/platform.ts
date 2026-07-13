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

/* ---------- Platform auth (multi-role) ---------- */

export type PlatformRole = 'admin' | 'staff' | 'customer'

export interface PlatformUser {
  id: string
  username: string
  full_name: string
  role: PlatformRole
}

export interface PlatformLoginPayload {
  username: string
  password: string
}

export interface PlatformLoginResponse {
  token: string
  user: PlatformUser
}

export interface PlatformSession {
  token: string
  user: PlatformUser
}

/* ---------- Farms registry ---------- */

export interface RegistryFarm {
  farm_code: string
  name: string
  region: string
  coordinates_lat: number | null
  coordinates_lng: number | null
  area_hectares: number | null
  crop_type: string | null
  owner_name: string | null
  created_at: string
}

/* ---------- Operations ---------- */

export type OperationType =
  | 'irrigation'
  | 'fertilization'
  | 'pest_control'
  | 'harvest'
  | 'pruning'
  | 'pollination'
  | 'soil_sampling'
  | 'drone_survey'
  | 'maintenance'

export type OperationStatus = 'planned' | 'assigned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'

export interface OperationLogEntry {
  status: OperationStatus
  note?: string
  created_at: string
}

export interface OperationAttachment {
  id: string
  file_name: string
  url?: string
  uploaded_at: string
}

export interface Operation {
  operation_id: string
  farm_code: string
  operation_type: OperationType
  status: OperationStatus
  scheduled_date: string
  assigned_to?: string
  notes?: string
  attachments: OperationAttachment[]
  created_at: string
  updated_at: string
  log_entries: OperationLogEntry[]
}

export interface CreateOperationPayload {
  farm_code: string
  operation_type: OperationType
  scheduled_date: string
  assigned_to?: string
  notes?: string
}

export interface OpsActivityEntry {
  type: string
  description: string
  status: string
  timestamp: string
}

export interface OpsDashboard {
  total_farms: number
  active_operations: number
  completed_operations_this_month: number
  open_tasks: number
  irrigation_events_today: number
  active_pest_alerts: number
  recent_activity: OpsActivityEntry[]
}

/* ---------- Pest Management (IPM) ---------- */

export type PestCategory = 'red_palm_weevil' | 'date_palm_pest' | 'greenhouse_pest' | 'custom'

export interface PestType {
  id: number
  name: string
  category: PestCategory
  description?: string
}

export type PestRiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type PestDetectionStatus = 'active' | 'monitoring' | 'treated' | 'resolved'

export interface PestDetection {
  detection_id: string
  farm_code: string
  pest_type_id: number
  risk_level: PestRiskLevel
  detected_by: number | null
  detected_date: string
  location_notes?: string
  status: PestDetectionStatus
  created_at: string
}

export interface CreatePestDetectionPayload {
  farm_code: string
  pest_type_id: number
  risk_level: PestRiskLevel
  location_notes?: string
}

export interface PestTrap {
  id: number
  farm_code: string
  trap_code: string
  pest_type_id: number
  count: number
  checked_date: string
  checked_by: number | null
}

export interface CreatePestTrapPayload {
  farm_code: string
  trap_code: string
  pest_type_id: number
  count: number
}

export interface PestTreatment {
  id: number
  detection_id: string
  treatment_date: string
  method: string
  performed_by: number | null
  notes?: string
  effectiveness_rating?: number
}

export interface CreatePestTreatmentPayload {
  detection_id: string
  method: string
  notes?: string
  effectiveness_rating?: number
}

export interface PestDashboard {
  active_infestations: number
  high_risk_farms: number
  treatment_in_progress: number
  monthly_trend: { month: string; count: number }[]
}

/* ---------- Irrigation ---------- */

export type IrrigationEquipment = 'drip' | 'sprinkler' | 'flood'
export type IrrigationZoneStatus = 'active' | 'maintenance' | 'offline'

export interface IrrigationZone {
  id: string
  farm_code: string
  zone_name: string
  area_hectares: number
  equipment_type: IrrigationEquipment
  status: IrrigationZoneStatus
}

export interface CreateIrrigationZonePayload {
  farm_code: string
  zone_name: string
  area_hectares: number
  equipment_type: IrrigationEquipment
  status?: IrrigationZoneStatus
}

export type IrrigationEventStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped'

export interface IrrigationEvent {
  id: string
  zone_id: string
  scheduled_start: string
  scheduled_end: string
  actual_start?: string
  actual_end?: string
  water_volume_m3?: number
  status: IrrigationEventStatus
  created_by: string
}

export interface CreateIrrigationEventPayload {
  zone_id: string
  scheduled_start: string
  scheduled_end: string
  created_by: string
}

export interface UpdateIrrigationEventPayload {
  status?: IrrigationEventStatus
  actual_start?: string
  actual_end?: string
  water_volume_m3?: number
}

export interface IrrigationDashboard {
  today_scheduled_count: number
  week_total_water_volume_m3: number
  zones_by_status: Record<string, number>
}

/* ---------- Assets ---------- */

export type AssetCategory = 'pump' | 'sensor' | 'irrigation_equipment' | 'vehicle' | 'drone' | 'monitoring_device'
export type AssetStatus = 'operational' | 'maintenance' | 'offline' | 'retired'

export interface Asset {
  asset_code: string
  name: string
  category: AssetCategory
  farm_code: string
  status: AssetStatus
  purchase_date?: string
  last_service_date?: string
}

export interface CreateAssetPayload {
  name: string
  category: AssetCategory
  farm_code: string
  purchase_date?: string
}

export interface AssetMaintenance {
  id: string
  asset_id: string
  service_date: string
  performed_by: string
  description: string
  cost?: number
  next_due_date?: string
}

export interface CreateAssetMaintenancePayload {
  service_date: string
  performed_by: string
  description: string
  cost?: number
  next_due_date?: string
}

/* ---------- Workforce ---------- */

export interface StaffMember {
  id: number
  username: string
  full_name: string
  role: PlatformRole
  staff_title?: string | null
  phone?: string | null
  email?: string | null
}

export type WorkforceAssignmentType = 'operation' | 'pest_detection'

/** Merged, time-sorted feed of a staff member's field-operation and
 * pest-detection assignments, as returned by
 * `GET /workforce/staff/{id}/assignments`. */
export interface WorkforceAssignment {
  type: WorkforceAssignmentType
  reference: string | null
  farm_code?: string | null
  status: string
  date: string
}

export interface StaffPerformance {
  staff_id: number
  full_name: string
  staff_title?: string | null
  total_assignments: number
  completed_assignments: number
  completion_rate_percent: number
}

/* ---------- User management (admin-only) ---------- */

export interface PlatformManagedUser {
  id: number
  username: string
  email: string | null
  full_name: string
  role: PlatformRole
  staff_title: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

export interface CreatePlatformUserPayload {
  username: string
  password: string
  full_name: string
  role: PlatformRole
  email?: string
  staff_title?: string
  phone?: string
}

export interface UpdatePlatformUserPayload {
  full_name?: string
  email?: string
  role?: PlatformRole
  staff_title?: string
  phone?: string
  is_active?: boolean
  new_password?: string
}

/* ---------- Regions Management ---------- */

export interface Region {
  id: number
  code: string
  name: string
  name_ar: string | null
  description: string | null
  is_active: boolean
  created_at: string
  farm_count: number
}

export interface CreateRegionPayload {
  code: string
  name: string
  name_ar?: string
  description?: string
}

export interface UpdateRegionPayload {
  name?: string
  name_ar?: string
  description?: string
  is_active?: boolean
}

/* ---------- Farm Operators ---------- */

export type OperatorStatus = 'active' | 'suspended' | 'retired'

export interface FarmOperator {
  id: number
  operator_code: string
  full_name: string
  company: string | null
  phone: string | null
  email: string | null
  region: string | null
  license_no: string | null
  status: OperatorStatus
  farm_codes: string[]
  notes: string | null
  created_at: string
}

export interface CreateFarmOperatorPayload {
  full_name: string
  company?: string
  phone?: string
  email?: string
  region?: string
  license_no?: string
  farm_codes?: string[]
  notes?: string
}

export interface UpdateFarmOperatorPayload extends Partial<CreateFarmOperatorPayload> {
  status?: OperatorStatus
}

/* ---------- Traps Management (registry) ---------- */

export type TrapStatus = 'active' | 'needs_service' | 'damaged' | 'removed'

export interface Trap {
  id: number
  trap_code: string
  farm_code: string
  pest_type_id: number
  lat: number | null
  lng: number | null
  status: TrapStatus
  installed_date: string
  notes: string | null
  last_checked: string | null
  last_count: number | null
}

export interface CreateTrapPayload {
  trap_code: string
  farm_code: string
  pest_type_id: number
  lat?: number
  lng?: number
  notes?: string
}

export interface TrapsDashboard {
  total_traps: number
  by_status: Record<string, number>
  checks_this_week: number
  catch_this_week: number
}

/* ---------- Recycling Stations ---------- */

export type StationStatus = 'operational' | 'maintenance' | 'closed'

export interface RecyclingStation {
  id: number
  station_code: string
  name: string
  name_ar: string | null
  region: string | null
  lat: number | null
  lng: number | null
  status: StationStatus
  capacity_tons_month: number | null
  accepted_materials: string[]
  notes: string | null
  created_at: string
  intake_month_kg: number
  intake_total_kg: number
}

export interface CreateRecyclingStationPayload {
  station_code: string
  name: string
  name_ar?: string
  region?: string
  lat?: number
  lng?: number
  capacity_tons_month?: number
  accepted_materials?: string[]
  notes?: string
}

export interface RecyclingIntake {
  id: number
  station_id: number
  material: string
  quantity_kg: number
  source_farm_code: string | null
  received_date: string
  notes: string | null
}

export interface CreateRecyclingIntakePayload {
  material: string
  quantity_kg: number
  source_farm_code?: string
  notes?: string
}

export interface RecyclingDashboard {
  total_stations: number
  by_status: Record<string, number>
  intake_month_kg: number
  intake_by_material_kg: Record<string, number>
}
