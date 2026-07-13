"""Data models for the Pure Line Services Platform.

Covers: customers, service requests (with status workflow), quotations
(with line items), farms (consultancy/report linkage — NDVI/satellite data
itself stays in the frontend's real-data JSON, this just tracks which real
farm a request/report is about), activity log (for the admin dashboard).
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, JSON
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_request_id() -> str:
    """Human-readable unique request ID, e.g. PL-REQ-2026-A1B2C3."""
    return f"PL-REQ-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"


def gen_quote_id() -> str:
    return f"PL-QT-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"


def gen_operation_id() -> str:
    return f"PL-OP-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"


def gen_detection_id() -> str:
    return f"PL-PEST-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"


def gen_asset_code() -> str:
    return f"PL-AST-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"


class RequestStatus(str, enum.Enum):
    submitted = "submitted"
    under_review = "under_review"
    quotation_sent = "quotation_sent"
    approved = "approved"
    in_progress = "in_progress"
    completed = "completed"


class RequestPriority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(200), nullable=False)
    company = Column(String(200), nullable=True)
    email = Column(String(200), nullable=False, index=True)
    phone = Column(String(50), nullable=False, index=True)
    whatsapp = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    requests = relationship("ServiceRequest", back_populates="customer")


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(40), unique=True, index=True, default=gen_request_id)

    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    customer = relationship("Customer", back_populates="requests")

    # Farm info (free-text — a request may be for a farm not yet in our
    # tracked real-data set)
    farm_name = Column(String(200), nullable=True)
    farm_location = Column(String(300), nullable=True)
    farm_size = Column(String(100), nullable=True)
    crop_type = Column(String(150), nullable=True)

    # Service info
    service_slug = Column(String(100), nullable=False, index=True)
    service_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(RequestPriority), default=RequestPriority.normal)
    status = Column(Enum(RequestStatus), default=RequestStatus.submitted, index=True)

    attachments = Column(JSON, default=list)  # list of stored filenames

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    quotations = relationship("Quotation", back_populates="request")
    status_events = relationship(
        "RequestStatusEvent", back_populates="request",
        order_by="RequestStatusEvent.created_at",
    )


class RequestStatusEvent(Base):
    """Timeline entry — every status transition a request goes through."""
    __tablename__ = "request_status_events"

    id = Column(Integer, primary_key=True, index=True)
    request_id_fk = Column(Integer, ForeignKey("service_requests.id"), nullable=False)
    request = relationship("ServiceRequest", back_populates="status_events")
    status = Column(Enum(RequestStatus), nullable=False)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Quotation(Base):
    __tablename__ = "quotations"

    id = Column(Integer, primary_key=True, index=True)
    quote_id = Column(String(40), unique=True, index=True, default=gen_quote_id)

    request_id_fk = Column(Integer, ForeignKey("service_requests.id"), nullable=False)
    request = relationship("ServiceRequest", back_populates="quotations")

    template = Column(String(60), nullable=False)  # greenhouse|irrigation|ndvi|consultancy
    currency = Column(String(10), default="SAR")
    line_items = Column(JSON, default=list)  # [{description, qty, unit_price, total}]
    subtotal = Column(Float, default=0)
    tax_percent = Column(Float, default=15.0)
    tax_amount = Column(Float, default=0)
    total = Column(Float, default=0)
    terms = Column(Text, nullable=True)
    valid_until = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)


class Farm(Base):
    """Farm registry record for consultancy/report linkage AND operational
    management (Field Ops / Pest / Irrigation / Assets attach to a farm via
    ``farm_code``). The 6 real satellite-monitored farms are seeded here from
    ``ndvi-farms.json`` (id/name/region only); customers can also register
    farms of their own that aren't in the satellite-monitored set.

    The 36-month NDVI/satellite series stays in the frontend's static JSON —
    this table intentionally does NOT duplicate it, only operational/registry
    fields (ownership, region, area, crop type)."""
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    farm_code = Column(String(60), unique=True, index=True, nullable=True)  # matches ndvi-farms.json id when real
    name = Column(String(200), nullable=False)
    location = Column(String(300), nullable=True)
    size = Column(String(100), nullable=True)
    crop_type = Column(String(150), nullable=True)
    is_satellite_monitored = Column(Integer, default=0)  # 0/1 bool (portable across sqlite/postgres)
    created_at = Column(DateTime, default=datetime.utcnow)

    # --- Farm Registry extension (operational/registry fields) ---
    region = Column(String(150), nullable=True, index=True)
    coordinates_lat = Column(Float, nullable=True)
    coordinates_lng = Column(Float, nullable=True)
    area_hectares = Column(Float, nullable=True)
    owner_name = Column(String(200), nullable=True)
    # Custom field-boundary ring drawn in the platform's boundary editor:
    # list of [lat, lng] pairs (closed ring). Null when no custom boundary.
    boundary_json = Column(JSON, nullable=True)


# ======================================================================
# Unified Platform Auth
# ======================================================================
class PlatformRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"
    customer = "customer"


class PlatformUser(Base):
    """Multi-user platform identity (admin / staff / customer). Alongside —
    not replacing — the single shared admin password in auth.py, which still
    gates the existing /admin/* endpoints."""
    __tablename__ = "platform_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, index=True, nullable=False)
    email = Column(String(200), nullable=True)
    password_hash = Column(String(200), nullable=False)
    password_salt = Column(String(64), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(Enum(PlatformRole), default=PlatformRole.customer, index=True)
    staff_title = Column(String(150), nullable=True)  # e.g. "Field Agronomist"
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================================================
# Field Operations Management
# ======================================================================
class OperationType(str, enum.Enum):
    irrigation = "irrigation"
    fertilization = "fertilization"
    pest_control = "pest_control"
    harvest = "harvest"
    pruning = "pruning"
    pollination = "pollination"
    soil_sampling = "soil_sampling"
    drone_survey = "drone_survey"
    maintenance = "maintenance"


class OperationStatus(str, enum.Enum):
    planned = "planned"
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    delayed = "delayed"
    cancelled = "cancelled"


class Operation(Base):
    __tablename__ = "operations"

    id = Column(Integer, primary_key=True, index=True)
    operation_id = Column(String(40), unique=True, index=True, default=gen_operation_id)
    farm_code = Column(String(60), index=True, nullable=False)
    operation_type = Column(Enum(OperationType), nullable=False, index=True)
    status = Column(Enum(OperationStatus), default=OperationStatus.planned, index=True)
    scheduled_date = Column(DateTime, nullable=True)
    assigned_to = Column(Integer, ForeignKey("platform_users.id"), nullable=True)
    assignee = relationship("PlatformUser", foreign_keys=[assigned_to])
    notes = Column(Text, nullable=True)
    attachments = Column(JSON, default=list)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    log_entries = relationship(
        "OperationLogEntry", back_populates="operation",
        order_by="OperationLogEntry.created_at",
    )


class OperationLogEntry(Base):
    """Timeline entry — every status transition an operation goes through
    (mirrors RequestStatusEvent)."""
    __tablename__ = "operation_log_entries"

    id = Column(Integer, primary_key=True, index=True)
    operation_id_fk = Column(Integer, ForeignKey("operations.id"), nullable=False)
    operation = relationship("Operation", back_populates="log_entries")
    status = Column(Enum(OperationStatus), nullable=False)
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================================================
# Integrated Pest Management (IPM)
# ======================================================================
class PestCategory(str, enum.Enum):
    red_palm_weevil = "red_palm_weevil"
    date_palm_pest = "date_palm_pest"
    greenhouse_pest = "greenhouse_pest"
    custom = "custom"


class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class PestDetectionStatus(str, enum.Enum):
    active = "active"
    monitoring = "monitoring"
    treated = "treated"
    resolved = "resolved"


class PestType(Base):
    __tablename__ = "pest_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), unique=True, nullable=False)
    category = Column(Enum(PestCategory), default=PestCategory.custom, index=True)
    description = Column(Text, nullable=True)


class PestDetection(Base):
    __tablename__ = "pest_detections"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(String(40), unique=True, index=True, default=gen_detection_id)
    farm_code = Column(String(60), index=True, nullable=False)
    pest_type_id = Column(Integer, ForeignKey("pest_types.id"), nullable=False)
    pest_type = relationship("PestType")
    risk_level = Column(Enum(RiskLevel), default=RiskLevel.low, index=True)
    detected_by = Column(Integer, ForeignKey("platform_users.id"), nullable=True)
    detected_date = Column(DateTime, default=datetime.utcnow, index=True)
    location_notes = Column(String(500), nullable=True)
    status = Column(Enum(PestDetectionStatus), default=PestDetectionStatus.active, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    treatments = relationship(
        "TreatmentRecord", back_populates="detection",
        order_by="TreatmentRecord.treatment_date",
    )


class TrapRecord(Base):
    __tablename__ = "trap_records"

    id = Column(Integer, primary_key=True, index=True)
    farm_code = Column(String(60), index=True, nullable=False)
    trap_code = Column(String(80), nullable=False, index=True)
    pest_type_id = Column(Integer, ForeignKey("pest_types.id"), nullable=False)
    pest_type = relationship("PestType")
    count = Column(Integer, default=0)
    checked_date = Column(DateTime, default=datetime.utcnow, index=True)
    checked_by = Column(Integer, ForeignKey("platform_users.id"), nullable=True)


class TreatmentRecord(Base):
    __tablename__ = "treatment_records"

    id = Column(Integer, primary_key=True, index=True)
    detection_id = Column(Integer, ForeignKey("pest_detections.id"), nullable=False)
    detection = relationship("PestDetection", back_populates="treatments")
    treatment_date = Column(DateTime, default=datetime.utcnow)
    method = Column(String(200), nullable=False)
    performed_by = Column(Integer, ForeignKey("platform_users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    effectiveness_rating = Column(Integer, nullable=True)  # 1-5


# ======================================================================
# Irrigation Management
# ======================================================================
class EquipmentType(str, enum.Enum):
    drip = "drip"
    sprinkler = "sprinkler"
    flood = "flood"
    other = "other"


class ZoneStatus(str, enum.Enum):
    active = "active"
    maintenance = "maintenance"
    offline = "offline"


class IrrigationEventStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    skipped = "skipped"


class IrrigationZone(Base):
    __tablename__ = "irrigation_zones"

    id = Column(Integer, primary_key=True, index=True)
    farm_code = Column(String(60), index=True, nullable=False)
    zone_name = Column(String(150), nullable=False)
    area_hectares = Column(Float, nullable=True)
    equipment_type = Column(Enum(EquipmentType), default=EquipmentType.drip)
    status = Column(Enum(ZoneStatus), default=ZoneStatus.active, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    events = relationship("IrrigationEvent", back_populates="zone")


class IrrigationEvent(Base):
    __tablename__ = "irrigation_events"

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(Integer, ForeignKey("irrigation_zones.id"), nullable=False)
    zone = relationship("IrrigationZone", back_populates="events")
    scheduled_start = Column(DateTime, nullable=False)
    scheduled_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    water_volume_m3 = Column(Float, nullable=True)
    status = Column(Enum(IrrigationEventStatus), default=IrrigationEventStatus.scheduled, index=True)
    created_by = Column(Integer, ForeignKey("platform_users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================================================
# Asset Management
# ======================================================================
class AssetCategory(str, enum.Enum):
    pump = "pump"
    sensor = "sensor"
    irrigation_equipment = "irrigation_equipment"
    vehicle = "vehicle"
    drone = "drone"
    monitoring_device = "monitoring_device"


class AssetStatus(str, enum.Enum):
    operational = "operational"
    maintenance = "maintenance"
    offline = "offline"
    retired = "retired"


class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_code = Column(String(40), unique=True, index=True, default=gen_asset_code)
    name = Column(String(200), nullable=False)
    category = Column(Enum(AssetCategory), nullable=False, index=True)
    farm_code = Column(String(60), nullable=True, index=True)  # null = shared/depot asset
    status = Column(Enum(AssetStatus), default=AssetStatus.operational, index=True)
    purchase_date = Column(DateTime, nullable=True)
    last_service_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    maintenance_records = relationship(
        "MaintenanceRecord", back_populates="asset",
        order_by="MaintenanceRecord.service_date",
    )


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    asset = relationship("Asset", back_populates="maintenance_records")
    service_date = Column(DateTime, default=datetime.utcnow)
    performed_by = Column(Integer, ForeignKey("platform_users.id"), nullable=True)
    description = Column(Text, nullable=False)
    cost = Column(Float, nullable=True)
    next_due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================================================
# Workforce Management
# ======================================================================
class AssignmentType(str, enum.Enum):
    operation = "operation"
    pest_detection = "pest_detection"


class AssignmentStatus(str, enum.Enum):
    assigned = "assigned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class TaskAssignment(Base):
    """Generic assignment linking a staff PlatformUser to either an Operation
    or a PestDetection (polymorphic-lite: assignment_type + reference_id,
    where reference_id is the internal integer PK of the referenced row)."""
    __tablename__ = "task_assignments"

    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("platform_users.id"), nullable=False)
    staff = relationship("PlatformUser")
    assignment_type = Column(Enum(AssignmentType), nullable=False, index=True)
    reference_id = Column(Integer, nullable=False)  # Operation.id or PestDetection.id
    assigned_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=True)
    completion_notes = Column(Text, nullable=True)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.assigned, index=True)


class ConsultationRequest(Base):
    __tablename__ = "consultation_requests"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(String(40), unique=True, index=True,
                              default=lambda: f"PL-CON-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}")
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    kind = Column(String(60), nullable=False)  # consultation|assessment|feasibility_study
    farm_context = Column(JSON, default=dict)  # assessment form answers
    notes = Column(Text, nullable=True)
    status = Column(Enum(RequestStatus), default=RequestStatus.submitted)
    advisory_report = Column(Text, nullable=True)  # filled in by admin
    created_at = Column(DateTime, default=datetime.utcnow)


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    actor = Column(String(100), default="system")
    action = Column(String(200), nullable=False)
    meta = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================================================
# Regions Management
# ======================================================================
class Region(Base):
    """Administrative agricultural region (e.g. Al Udhayb, Khaybar). Farms
    reference regions by name string (kept loose to match the existing
    ``farms.region`` column without a migration)."""
    __tablename__ = "regions"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(40), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    name_ar = Column(String(150), nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================================================
# Farm Operators Management
# ======================================================================
class FarmOperator(Base):
    """A person/company operating one or more registered farms."""
    __tablename__ = "farm_operators"

    id = Column(Integer, primary_key=True, index=True)
    operator_code = Column(String(60), unique=True, index=True, nullable=False)
    full_name = Column(String(200), nullable=False)
    company = Column(String(200), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    region = Column(String(150), nullable=True, index=True)
    license_no = Column(String(100), nullable=True)
    status = Column(String(30), default="active", index=True)  # active | suspended | retired
    farm_codes = Column(JSON, default=list)  # farms this operator runs
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================================================
# Traps Management (registry — complements pest TrapRecord check logs)
# ======================================================================
class Trap(Base):
    """Physical pest trap installed in a field. ``TrapRecord`` rows (check
    logs) reference the same ``trap_code``."""
    __tablename__ = "traps"

    id = Column(Integer, primary_key=True, index=True)
    trap_code = Column(String(80), unique=True, index=True, nullable=False)
    farm_code = Column(String(60), index=True, nullable=False)
    pest_type_id = Column(Integer, ForeignKey("pest_types.id"), nullable=False)
    pest_type = relationship("PestType")
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    status = Column(String(30), default="active", index=True)  # active | needs_service | damaged | removed
    installed_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ======================================================================
# Recycling Stations
# ======================================================================
class RecyclingStation(Base):
    """Agricultural-waste recycling station (green waste, palm fronds,
    plastic mulch, compost intake)."""
    __tablename__ = "recycling_stations"

    id = Column(Integer, primary_key=True, index=True)
    station_code = Column(String(60), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    name_ar = Column(String(200), nullable=True)
    region = Column(String(150), nullable=True, index=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    status = Column(String(30), default="operational", index=True)  # operational | maintenance | closed
    capacity_tons_month = Column(Float, nullable=True)
    accepted_materials = Column(JSON, default=list)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    intakes = relationship("RecyclingIntake", back_populates="station",
                           order_by="RecyclingIntake.received_date.desc()")


class RecyclingIntake(Base):
    """One delivery of material into a recycling station."""
    __tablename__ = "recycling_intakes"

    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("recycling_stations.id"), nullable=False, index=True)
    station = relationship("RecyclingStation", back_populates="intakes")
    material = Column(String(100), nullable=False)
    quantity_kg = Column(Float, nullable=False, default=0)
    source_farm_code = Column(String(60), nullable=True, index=True)
    received_date = Column(DateTime, default=datetime.utcnow, index=True)
    notes = Column(String(500), nullable=True)


# ======================================================================
# Notifications Center
# ======================================================================
class Notification(Base):
    """Platform notification. ``audience`` targets a role ('admin', 'staff',
    'all') — per-user read state is tracked in ``NotificationRead``."""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    kind = Column(String(40), default="info", index=True)  # info | pest | operation | irrigation | recycling | user | system
    title = Column(String(300), nullable=False)
    body = Column(String(600), nullable=True)
    link = Column(String(300), nullable=True)  # in-app route, e.g. /platform/pests/PL-PEST-...
    audience = Column(String(20), default="staff", index=True)  # admin | staff | all
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class NotificationRead(Base):
    __tablename__ = "notification_reads"

    id = Column(Integer, primary_key=True, index=True)
    notification_id = Column(Integer, ForeignKey("notifications.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("platform_users.id"), nullable=False, index=True)
    read_at = Column(DateTime, default=datetime.utcnow)
