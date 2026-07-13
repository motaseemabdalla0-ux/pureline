"""Pydantic request/response schemas for the platform API."""
from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ---- Requests ----
class CustomerIn(BaseModel):
    full_name: str
    company: str | None = None
    email: EmailStr
    phone: str
    whatsapp: str | None = None


class ServiceRequestIn(BaseModel):
    customer: CustomerIn
    farm_name: str | None = None
    farm_location: str | None = None
    farm_size: str | None = None
    crop_type: str | None = None
    service_slug: str
    service_name: str
    description: str | None = None
    priority: str = "normal"


class StatusEventOut(BaseModel):
    status: str
    note: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class QuotationOut(BaseModel):
    quote_id: str
    template: str
    currency: str
    line_items: list[dict[str, Any]]
    subtotal: float
    tax_percent: float
    tax_amount: float
    total: float
    terms: str | None
    valid_until: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class ServiceRequestOut(BaseModel):
    request_id: str
    farm_name: str | None
    farm_location: str | None
    farm_size: str | None
    crop_type: str | None
    service_slug: str
    service_name: str
    description: str | None
    priority: str
    status: str
    attachments: list[str]
    created_at: datetime
    updated_at: datetime
    status_events: list[StatusEventOut] = []
    quotations: list[QuotationOut] = []

    class Config:
        from_attributes = True


class StatusUpdateIn(BaseModel):
    status: str
    note: str | None = None


# ---- Quotations ----
class LineItemIn(BaseModel):
    description: str
    qty: float = 1
    unit_price: float


class QuotationIn(BaseModel):
    request_id: str  # human request_id, not DB pk
    template: str
    currency: str = "SAR"
    line_items: list[LineItemIn]
    tax_percent: float = 15.0
    terms: str | None = None
    valid_days: int = 30


# ---- Consultancy ----
class ConsultationIn(BaseModel):
    customer: CustomerIn
    kind: str = Field(pattern="^(consultation|assessment|feasibility_study)$")
    farm_context: dict[str, Any] = {}
    notes: str | None = None


class ConsultationOut(BaseModel):
    consultation_id: str
    kind: str
    farm_context: dict[str, Any]
    notes: str | None
    status: str
    advisory_report: str | None
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Admin ----
class AdminLoginIn(BaseModel):
    password: str


class KpiOut(BaseModel):
    total_requests: int
    open_requests: int
    total_quotations: int
    total_customers: int
    requests_by_status: dict[str, int]
    requests_by_service: dict[str, int]


# ---- Platform auth (unified admin/staff/customer login) ----
class PlatformLoginIn(BaseModel):
    username: str
    password: str


class PlatformUserOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str


class PlatformLoginOut(BaseModel):
    token: str
    user: PlatformUserOut


# ---- User management (admin-only) ----
class PlatformUserAdminOut(BaseModel):
    id: int
    username: str
    email: str | None
    full_name: str
    role: str
    staff_title: str | None
    phone: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PlatformUserCreateIn(BaseModel):
    username: str
    password: str
    full_name: str
    role: str = "customer"
    email: str | None = None
    staff_title: str | None = None
    phone: str | None = None


class PlatformUserUpdateIn(BaseModel):
    full_name: str | None = None
    email: str | None = None
    role: str | None = None
    staff_title: str | None = None
    phone: str | None = None
    is_active: bool | None = None
    new_password: str | None = None



# ---- Farm registry ----
class FarmOut(BaseModel):
    farm_code: str | None
    name: str
    location: str | None
    size: str | None
    crop_type: str | None
    is_satellite_monitored: int
    region: str | None
    coordinates_lat: float | None
    coordinates_lng: float | None
    area_hectares: float | None
    owner_name: str | None
    boundary_json: list[list[float]] | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class FarmIn(BaseModel):
    farm_code: str | None = None
    name: str
    location: str | None = None
    size: str | None = None
    crop_type: str | None = None
    region: str | None = None
    coordinates_lat: float | None = None
    coordinates_lng: float | None = None
    area_hectares: float | None = None
    owner_name: str | None = None


# ---- Field Operations ----
class OperationLogEntryOut(BaseModel):
    status: str
    note: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class OperationOut(BaseModel):
    operation_id: str
    farm_code: str
    operation_type: str
    status: str
    scheduled_date: datetime | None
    assigned_to: int | None
    notes: str | None
    attachments: list[str]
    created_at: datetime
    updated_at: datetime
    log_entries: list[OperationLogEntryOut] = []

    class Config:
        from_attributes = True


class OperationIn(BaseModel):
    farm_code: str
    operation_type: str
    scheduled_date: datetime | None = None
    assigned_to: int | None = None
    notes: str | None = None


class OperationStatusIn(BaseModel):
    status: str
    note: str | None = None


# ---- Pest Management (IPM) ----
class PestTypeOut(BaseModel):
    id: int
    name: str
    category: str
    description: str | None

    class Config:
        from_attributes = True


class PestTypeIn(BaseModel):
    name: str
    category: str = "custom"
    description: str | None = None


class PestDetectionOut(BaseModel):
    detection_id: str
    farm_code: str
    pest_type_id: int
    risk_level: str
    detected_by: int | None
    detected_date: datetime
    location_notes: str | None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class PestDetectionIn(BaseModel):
    farm_code: str
    pest_type_id: int
    risk_level: str = "low"
    detected_by: int | None = None
    location_notes: str | None = None


class PestDetectionStatusIn(BaseModel):
    status: str


class TrapRecordOut(BaseModel):
    id: int
    farm_code: str
    trap_code: str
    pest_type_id: int
    count: int
    checked_date: datetime
    checked_by: int | None

    class Config:
        from_attributes = True


class TrapRecordIn(BaseModel):
    farm_code: str
    trap_code: str
    pest_type_id: int
    count: int = 0
    checked_by: int | None = None


class TreatmentRecordOut(BaseModel):
    id: int
    detection_id: int
    treatment_date: datetime
    method: str
    performed_by: int | None
    notes: str | None
    effectiveness_rating: int | None

    class Config:
        from_attributes = True


class TreatmentRecordIn(BaseModel):
    detection_id: int
    method: str
    performed_by: int | None = None
    notes: str | None = None
    effectiveness_rating: int | None = Field(default=None, ge=1, le=5)


# ---- Irrigation ----
class IrrigationZoneOut(BaseModel):
    id: int
    farm_code: str
    zone_name: str
    area_hectares: float | None
    equipment_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class IrrigationZoneIn(BaseModel):
    farm_code: str
    zone_name: str
    area_hectares: float | None = None
    equipment_type: str = "drip"
    status: str = "active"


class IrrigationEventOut(BaseModel):
    id: int
    zone_id: int
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: datetime | None
    actual_end: datetime | None
    water_volume_m3: float | None
    status: str
    created_by: int | None
    created_at: datetime

    class Config:
        from_attributes = True


class IrrigationEventIn(BaseModel):
    zone_id: int
    scheduled_start: datetime
    scheduled_end: datetime
    created_by: int | None = None


class IrrigationEventUpdateIn(BaseModel):
    status: str | None = None
    actual_start: datetime | None = None
    actual_end: datetime | None = None
    water_volume_m3: float | None = None


# ---- Assets ----
class AssetOut(BaseModel):
    asset_code: str
    name: str
    category: str
    farm_code: str | None
    status: str
    purchase_date: datetime | None
    last_service_date: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class AssetIn(BaseModel):
    name: str
    category: str
    farm_code: str | None = None
    status: str = "operational"
    purchase_date: datetime | None = None


class AssetStatusIn(BaseModel):
    status: str


class MaintenanceRecordOut(BaseModel):
    id: int
    asset_id: int
    service_date: datetime
    performed_by: int | None
    description: str
    cost: float | None
    next_due_date: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class MaintenanceRecordIn(BaseModel):
    service_date: datetime | None = None
    performed_by: int | None = None
    description: str
    cost: float | None = None
    next_due_date: datetime | None = None


# ---- Workforce ----
class StaffOut(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    staff_title: str | None
    phone: str | None
    email: str | None

    class Config:
        from_attributes = True


class TaskAssignmentOut(BaseModel):
    id: int
    staff_id: int
    assignment_type: str
    reference_id: int
    assigned_date: datetime
    due_date: datetime | None
    completion_notes: str | None
    status: str

    class Config:
        from_attributes = True


# ---- Regions Management ----
class RegionOut(BaseModel):
    id: int
    code: str
    name: str
    name_ar: str | None
    description: str | None
    is_active: bool
    created_at: datetime
    farm_count: int = 0

    class Config:
        from_attributes = True


class RegionIn(BaseModel):
    code: str
    name: str
    name_ar: str | None = None
    description: str | None = None


class RegionUpdateIn(BaseModel):
    name: str | None = None
    name_ar: str | None = None
    description: str | None = None
    is_active: bool | None = None


# ---- Farm Operators Management ----
class FarmOperatorOut(BaseModel):
    id: int
    operator_code: str
    full_name: str
    company: str | None
    phone: str | None
    email: str | None
    region: str | None
    license_no: str | None
    status: str
    farm_codes: list[str]
    notes: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class FarmOperatorIn(BaseModel):
    full_name: str
    company: str | None = None
    phone: str | None = None
    email: str | None = None
    region: str | None = None
    license_no: str | None = None
    farm_codes: list[str] = []
    notes: str | None = None


class FarmOperatorUpdateIn(BaseModel):
    full_name: str | None = None
    company: str | None = None
    phone: str | None = None
    email: str | None = None
    region: str | None = None
    license_no: str | None = None
    status: str | None = None
    farm_codes: list[str] | None = None
    notes: str | None = None


# ---- Traps Management (registry) ----
class TrapOut(BaseModel):
    id: int
    trap_code: str
    farm_code: str
    pest_type_id: int
    lat: float | None
    lng: float | None
    status: str
    installed_date: datetime
    notes: str | None
    last_checked: datetime | None = None
    last_count: int | None = None

    class Config:
        from_attributes = True


class TrapIn(BaseModel):
    trap_code: str
    farm_code: str
    pest_type_id: int
    lat: float | None = None
    lng: float | None = None
    notes: str | None = None


class TrapUpdateIn(BaseModel):
    status: str | None = None
    lat: float | None = None
    lng: float | None = None
    notes: str | None = None


# ---- Recycling Stations ----
class RecyclingIntakeOut(BaseModel):
    id: int
    station_id: int
    material: str
    quantity_kg: float
    source_farm_code: str | None
    received_date: datetime
    notes: str | None

    class Config:
        from_attributes = True


class RecyclingStationOut(BaseModel):
    id: int
    station_code: str
    name: str
    name_ar: str | None
    region: str | None
    lat: float | None
    lng: float | None
    status: str
    capacity_tons_month: float | None
    accepted_materials: list[str]
    notes: str | None
    created_at: datetime
    intake_month_kg: float = 0
    intake_total_kg: float = 0

    class Config:
        from_attributes = True


class RecyclingStationIn(BaseModel):
    station_code: str
    name: str
    name_ar: str | None = None
    region: str | None = None
    lat: float | None = None
    lng: float | None = None
    capacity_tons_month: float | None = None
    accepted_materials: list[str] = []
    notes: str | None = None


class RecyclingStationUpdateIn(BaseModel):
    name: str | None = None
    name_ar: str | None = None
    region: str | None = None
    status: str | None = None
    capacity_tons_month: float | None = None
    accepted_materials: list[str] | None = None
    notes: str | None = None


class RecyclingIntakeIn(BaseModel):
    material: str
    quantity_kg: float
    source_farm_code: str | None = None
    notes: str | None = None


# ---- Notifications Center ----
class NotificationOut(BaseModel):
    id: int
    kind: str
    title: str
    body: str | None
    link: str | None
    audience: str
    created_at: datetime
    read: bool = False

    class Config:
        from_attributes = True


# ---- Audit log ----
class AuditEntryOut(BaseModel):
    id: int
    actor: str
    action: str
    meta: dict
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Enterprise search ----
class SearchHit(BaseModel):
    kind: str          # farm | operation | pest_detection | trap | station | operator | region | user
    ref: str           # code / id used to build the link
    title: str
    subtitle: str | None = None
    link: str          # in-app route


class SearchOut(BaseModel):
    query: str
    total: int
    hits: list[SearchHit]


# ---- Farm boundary editor ----
class FarmBoundaryIn(BaseModel):
    """Closed ring of [lat, lng] pairs (>= 3 points)."""
    ring: list[list[float]]
