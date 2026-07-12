"""Farm Operations Management Platform — Modules 2-8.

Farm Registry, Field Operations, Integrated Pest Management, Irrigation
Management, Asset Management, Workforce Management, and the top-level
Operations Dashboard aggregate. All routers here are mounted under
``/api/platform`` by ``routers.py``.

Auth: read endpoints are generally open (mirrors the existing pattern in
routers.py, e.g. GET /requests/lookup); writes/status changes require a
logged-in platform user via ``require_platform_user`` from platform_auth.py,
scoped to staff/admin where the task spec calls for it.
"""
import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas
from .database import get_db
from .platform_auth import require_platform_user

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx", ".kml", ".kmz"}
MAX_UPLOAD_MB = 15

STAFF_OR_ADMIN = ["staff", "admin"]


def _operation_to_assignment_status(status: "models.OperationStatus") -> "models.AssignmentStatus":
    mapping = {
        models.OperationStatus.completed: models.AssignmentStatus.completed,
        models.OperationStatus.cancelled: models.AssignmentStatus.cancelled,
        models.OperationStatus.in_progress: models.AssignmentStatus.in_progress,
    }
    return mapping.get(status, models.AssignmentStatus.assigned)


def _detection_to_assignment_status(status: "models.PestDetectionStatus") -> "models.AssignmentStatus":
    mapping = {
        models.PestDetectionStatus.resolved: models.AssignmentStatus.completed,
        models.PestDetectionStatus.treated: models.AssignmentStatus.in_progress,
        models.PestDetectionStatus.monitoring: models.AssignmentStatus.in_progress,
    }
    return mapping.get(status, models.AssignmentStatus.assigned)


def _sync_assignment_status(db: Session, assignment_type: "models.AssignmentType", reference_id: int,
                             new_status: "models.AssignmentStatus") -> None:
    assignment = (
        db.query(models.TaskAssignment)
        .filter(models.TaskAssignment.assignment_type == assignment_type,
                models.TaskAssignment.reference_id == reference_id)
        .first()
    )
    if assignment:
        assignment.status = new_status
        if new_status == models.AssignmentStatus.completed and not assignment.completion_notes:
            assignment.completion_notes = "Auto-marked complete on source record status change."


# ======================================================================
# 2. Farm Registry
# ======================================================================
farms_router = APIRouter(prefix="/farms", tags=["farms"])


@farms_router.get("", response_model=list[schemas.FarmOut])
def list_farms(region: str | None = None, crop_type: str | None = None,
                search: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Farm)
    if region:
        q = q.filter(models.Farm.region == region)
    if crop_type:
        q = q.filter(models.Farm.crop_type == crop_type)
    if search:
        like = f"%{search}%"
        q = q.filter((models.Farm.name.ilike(like)) | (models.Farm.farm_code.ilike(like)))
    return q.order_by(models.Farm.name).all()


@farms_router.get("/{farm_code}", response_model=schemas.FarmOut)
def get_farm(farm_code: str, db: Session = Depends(get_db)):
    farm = db.query(models.Farm).filter(models.Farm.farm_code == farm_code).first()
    if not farm:
        raise HTTPException(404, "Farm not found")
    return farm


# ======================================================================
# 3. Field Operations Management
# ======================================================================
operations_router = APIRouter(prefix="/operations", tags=["operations"])


@operations_router.post("", response_model=schemas.OperationOut)
def create_operation(payload: schemas.OperationIn,
                      user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                      db: Session = Depends(get_db)):
    try:
        op_type = models.OperationType(payload.operation_type)
    except ValueError:
        raise HTTPException(400, f"Unknown operation_type: {payload.operation_type}")
    op = models.Operation(
        farm_code=payload.farm_code, operation_type=op_type,
        status=models.OperationStatus.assigned if payload.assigned_to else models.OperationStatus.planned,
        scheduled_date=payload.scheduled_date, assigned_to=payload.assigned_to,
        notes=payload.notes, attachments=[],
    )
    db.add(op)
    db.flush()
    db.add(models.OperationLogEntry(operation_id_fk=op.id, status=op.status, note="Operation created"))
    if payload.assigned_to:
        db.add(models.TaskAssignment(
            staff_id=payload.assigned_to, assignment_type=models.AssignmentType.operation,
            reference_id=op.id, due_date=payload.scheduled_date,
            status=models.AssignmentStatus.assigned,
        ))
    db.commit()
    db.refresh(op)
    return op


@operations_router.get("", response_model=list[schemas.OperationOut])
def list_operations(farm_code: str | None = None, status: str | None = None,
                     operation_type: str | None = None, assigned_to: int | None = None,
                     db: Session = Depends(get_db)):
    q = db.query(models.Operation)
    if farm_code:
        q = q.filter(models.Operation.farm_code == farm_code)
    if status:
        q = q.filter(models.Operation.status == status)
    if operation_type:
        q = q.filter(models.Operation.operation_type == operation_type)
    if assigned_to is not None:
        q = q.filter(models.Operation.assigned_to == assigned_to)
    return q.order_by(models.Operation.created_at.desc()).all()


@operations_router.get("/{operation_id}", response_model=schemas.OperationOut)
def get_operation(operation_id: str, db: Session = Depends(get_db)):
    op = db.query(models.Operation).filter(models.Operation.operation_id == operation_id).first()
    if not op:
        raise HTTPException(404, "Operation not found")
    return op


@operations_router.patch("/{operation_id}/status", response_model=schemas.OperationOut)
def update_operation_status(operation_id: str, payload: schemas.OperationStatusIn,
                             user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                             db: Session = Depends(get_db)):
    op = db.query(models.Operation).filter(models.Operation.operation_id == operation_id).first()
    if not op:
        raise HTTPException(404, "Operation not found")
    try:
        new_status = models.OperationStatus(payload.status)
    except ValueError:
        raise HTTPException(400, f"Unknown status: {payload.status}")
    op.status = new_status
    db.add(models.OperationLogEntry(operation_id_fk=op.id, status=new_status, note=payload.note))
    _sync_assignment_status(db, models.AssignmentType.operation, op.id, _operation_to_assignment_status(new_status))
    db.commit()
    db.refresh(op)
    return op


@operations_router.post("/{operation_id}/attachments")
async def upload_operation_attachment(operation_id: str, file: UploadFile = File(...),
                                       user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                                       db: Session = Depends(get_db)):
    op = db.query(models.Operation).filter(models.Operation.operation_id == operation_id).first()
    if not op:
        raise HTTPException(404, "Operation not found")
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"File type {ext} not allowed")
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {MAX_UPLOAD_MB}MB limit")
    stored_name = f"{operation_id}_{uuid.uuid4().hex[:8]}{ext}"
    with open(os.path.join(UPLOAD_DIR, stored_name), "wb") as f:
        f.write(contents)
    op.attachments = [*(op.attachments or []), stored_name]
    db.commit()
    return {"stored_name": stored_name, "original_name": file.filename}


# ======================================================================
# 4. Integrated Pest Management (IPM)
# ======================================================================
pests_router = APIRouter(prefix="/pests", tags=["pests"])


@pests_router.get("/types", response_model=list[schemas.PestTypeOut])
def list_pest_types(db: Session = Depends(get_db)):
    return db.query(models.PestType).order_by(models.PestType.name).all()


@pests_router.post("/types", response_model=schemas.PestTypeOut)
def create_pest_type(payload: schemas.PestTypeIn,
                      user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                      db: Session = Depends(get_db)):
    try:
        category = models.PestCategory(payload.category)
    except ValueError:
        raise HTTPException(400, f"Unknown category: {payload.category}")
    pt = models.PestType(name=payload.name, category=category, description=payload.description)
    db.add(pt)
    db.commit()
    db.refresh(pt)
    return pt


@pests_router.get("/detections", response_model=list[schemas.PestDetectionOut])
def list_detections(farm_code: str | None = None, risk_level: str | None = None,
                     status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.PestDetection)
    if farm_code:
        q = q.filter(models.PestDetection.farm_code == farm_code)
    if risk_level:
        q = q.filter(models.PestDetection.risk_level == risk_level)
    if status:
        q = q.filter(models.PestDetection.status == status)
    return q.order_by(models.PestDetection.detected_date.desc()).all()


@pests_router.post("/detections", response_model=schemas.PestDetectionOut)
def create_detection(payload: schemas.PestDetectionIn,
                      user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                      db: Session = Depends(get_db)):
    pest_type = db.query(models.PestType).filter(models.PestType.id == payload.pest_type_id).first()
    if not pest_type:
        raise HTTPException(404, "Pest type not found")
    try:
        risk = models.RiskLevel(payload.risk_level)
    except ValueError:
        raise HTTPException(400, f"Unknown risk_level: {payload.risk_level}")
    detection = models.PestDetection(
        farm_code=payload.farm_code, pest_type_id=payload.pest_type_id, risk_level=risk,
        detected_by=payload.detected_by or user.id, location_notes=payload.location_notes,
        status=models.PestDetectionStatus.active,
    )
    db.add(detection)
    db.flush()
    assignee_id = payload.detected_by or user.id
    if assignee_id:
        db.add(models.TaskAssignment(
            staff_id=assignee_id, assignment_type=models.AssignmentType.pest_detection,
            reference_id=detection.id, status=models.AssignmentStatus.assigned,
        ))
    db.commit()
    db.refresh(detection)
    return detection


@pests_router.patch("/detections/{detection_id}/status", response_model=schemas.PestDetectionOut)
def update_detection_status(detection_id: str, payload: schemas.PestDetectionStatusIn,
                             user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                             db: Session = Depends(get_db)):
    detection = db.query(models.PestDetection).filter(models.PestDetection.detection_id == detection_id).first()
    if not detection:
        raise HTTPException(404, "Detection not found")
    try:
        new_status = models.PestDetectionStatus(payload.status)
    except ValueError:
        raise HTTPException(400, f"Unknown status: {payload.status}")
    detection.status = new_status
    _sync_assignment_status(db, models.AssignmentType.pest_detection, detection.id,
                             _detection_to_assignment_status(new_status))
    db.commit()
    db.refresh(detection)
    return detection


@pests_router.get("/traps", response_model=list[schemas.TrapRecordOut])
def list_traps(farm_code: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.TrapRecord)
    if farm_code:
        q = q.filter(models.TrapRecord.farm_code == farm_code)
    return q.order_by(models.TrapRecord.checked_date.desc()).all()


@pests_router.post("/traps", response_model=schemas.TrapRecordOut)
def create_trap(payload: schemas.TrapRecordIn,
                 user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                 db: Session = Depends(get_db)):
    pest_type = db.query(models.PestType).filter(models.PestType.id == payload.pest_type_id).first()
    if not pest_type:
        raise HTTPException(404, "Pest type not found")
    trap = models.TrapRecord(
        farm_code=payload.farm_code, trap_code=payload.trap_code, pest_type_id=payload.pest_type_id,
        count=payload.count, checked_by=payload.checked_by or user.id,
    )
    db.add(trap)
    db.commit()
    db.refresh(trap)
    return trap


@pests_router.get("/treatments", response_model=list[schemas.TreatmentRecordOut])
def list_treatments(detection_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(models.TreatmentRecord)
    if detection_id is not None:
        q = q.filter(models.TreatmentRecord.detection_id == detection_id)
    return q.order_by(models.TreatmentRecord.treatment_date.desc()).all()


@pests_router.post("/treatments", response_model=schemas.TreatmentRecordOut)
def create_treatment(payload: schemas.TreatmentRecordIn,
                      user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                      db: Session = Depends(get_db)):
    detection = db.query(models.PestDetection).filter(models.PestDetection.id == payload.detection_id).first()
    if not detection:
        raise HTTPException(404, "Detection not found")
    treatment = models.TreatmentRecord(
        detection_id=payload.detection_id, method=payload.method,
        performed_by=payload.performed_by or user.id, notes=payload.notes,
        effectiveness_rating=payload.effectiveness_rating,
    )
    db.add(treatment)
    if detection.status == models.PestDetectionStatus.active:
        detection.status = models.PestDetectionStatus.treated
    db.commit()
    db.refresh(treatment)
    return treatment


@pests_router.get("/dashboard")
def pests_dashboard(db: Session = Depends(get_db)):
    active_count = (
        db.query(func.count(models.PestDetection.id))
        .filter(models.PestDetection.status.in_(
            [models.PestDetectionStatus.active, models.PestDetectionStatus.monitoring]))
        .scalar() or 0
    )
    high_risk_farms = (
        db.query(func.count(func.distinct(models.PestDetection.farm_code)))
        .filter(models.PestDetection.risk_level.in_([models.RiskLevel.high, models.RiskLevel.critical]))
        .filter(models.PestDetection.status.in_(
            [models.PestDetectionStatus.active, models.PestDetectionStatus.monitoring]))
        .scalar() or 0
    )
    treatment_in_progress = (
        db.query(func.count(models.PestDetection.id))
        .filter(models.PestDetection.status == models.PestDetectionStatus.treated)
        .scalar() or 0
    )

    now = datetime.utcnow()
    # Build month buckets by walking back 6 calendar months from current month.
    buckets = []
    year, month = now.year, now.month
    for _ in range(6):
        buckets.append((year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    buckets.reverse()
    monthly_trend = []
    for (y, m) in buckets:
        start = datetime(y, m, 1)
        end = datetime(y + 1, 1, 1) if m == 12 else datetime(y, m + 1, 1)
        count = (
            db.query(func.count(models.PestDetection.id))
            .filter(models.PestDetection.detected_date >= start, models.PestDetection.detected_date < end)
            .scalar() or 0
        )
        monthly_trend.append({"year": y, "month": m, "count": count})

    return {
        "active_infestation_count": active_count,
        "high_risk_farm_count": high_risk_farms,
        "treatment_in_progress_count": treatment_in_progress,
        "monthly_trend": monthly_trend,
    }


# ======================================================================
# 5. Irrigation Management
# ======================================================================
irrigation_router = APIRouter(prefix="/irrigation", tags=["irrigation"])


@irrigation_router.get("/zones", response_model=list[schemas.IrrigationZoneOut])
def list_zones(farm_code: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.IrrigationZone)
    if farm_code:
        q = q.filter(models.IrrigationZone.farm_code == farm_code)
    return q.order_by(models.IrrigationZone.zone_name).all()


@irrigation_router.post("/zones", response_model=schemas.IrrigationZoneOut)
def create_zone(payload: schemas.IrrigationZoneIn,
                 user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                 db: Session = Depends(get_db)):
    try:
        equipment = models.EquipmentType(payload.equipment_type)
        status = models.ZoneStatus(payload.status)
    except ValueError as e:
        raise HTTPException(400, str(e))
    zone = models.IrrigationZone(
        farm_code=payload.farm_code, zone_name=payload.zone_name,
        area_hectares=payload.area_hectares, equipment_type=equipment, status=status,
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)
    return zone


@irrigation_router.get("/events", response_model=list[schemas.IrrigationEventOut])
def list_events(zone_id: int | None = None, farm_code: str | None = None, status: str | None = None,
                 date_from: datetime | None = None, date_to: datetime | None = None,
                 db: Session = Depends(get_db)):
    q = db.query(models.IrrigationEvent)
    if zone_id is not None:
        q = q.filter(models.IrrigationEvent.zone_id == zone_id)
    if farm_code:
        q = q.join(models.IrrigationZone).filter(models.IrrigationZone.farm_code == farm_code)
    if status:
        q = q.filter(models.IrrigationEvent.status == status)
    if date_from:
        q = q.filter(models.IrrigationEvent.scheduled_start >= date_from)
    if date_to:
        q = q.filter(models.IrrigationEvent.scheduled_start <= date_to)
    return q.order_by(models.IrrigationEvent.scheduled_start.desc()).all()


@irrigation_router.post("/events", response_model=schemas.IrrigationEventOut)
def create_event(payload: schemas.IrrigationEventIn,
                  user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                  db: Session = Depends(get_db)):
    zone = db.query(models.IrrigationZone).filter(models.IrrigationZone.id == payload.zone_id).first()
    if not zone:
        raise HTTPException(404, "Irrigation zone not found")
    event = models.IrrigationEvent(
        zone_id=payload.zone_id, scheduled_start=payload.scheduled_start,
        scheduled_end=payload.scheduled_end, created_by=payload.created_by or user.id,
        status=models.IrrigationEventStatus.scheduled,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@irrigation_router.patch("/events/{event_id}", response_model=schemas.IrrigationEventOut)
def update_event(event_id: int, payload: schemas.IrrigationEventUpdateIn,
                  user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                  db: Session = Depends(get_db)):
    event = db.query(models.IrrigationEvent).filter(models.IrrigationEvent.id == event_id).first()
    if not event:
        raise HTTPException(404, "Irrigation event not found")
    if payload.status is not None:
        try:
            event.status = models.IrrigationEventStatus(payload.status)
        except ValueError:
            raise HTTPException(400, f"Unknown status: {payload.status}")
    if payload.actual_start is not None:
        event.actual_start = payload.actual_start
    if payload.actual_end is not None:
        event.actual_end = payload.actual_end
    if payload.water_volume_m3 is not None:
        event.water_volume_m3 = payload.water_volume_m3
    db.commit()
    db.refresh(event)
    return event


@irrigation_router.get("/dashboard")
def irrigation_dashboard(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    week_start = today_start - timedelta(days=today_start.weekday())
    week_end = week_start + timedelta(days=7)

    today_scheduled = (
        db.query(func.count(models.IrrigationEvent.id))
        .filter(models.IrrigationEvent.scheduled_start >= today_start,
                models.IrrigationEvent.scheduled_start < today_end)
        .scalar() or 0
    )
    week_volume = (
        db.query(func.coalesce(func.sum(models.IrrigationEvent.water_volume_m3), 0.0))
        .filter(models.IrrigationEvent.scheduled_start >= week_start,
                models.IrrigationEvent.scheduled_start < week_end)
        .scalar() or 0.0
    )
    zones_by_status: dict[str, int] = {}
    for status, count in db.query(models.IrrigationZone.status, func.count(models.IrrigationZone.id)) \
            .group_by(models.IrrigationZone.status):
        zones_by_status[status.value if hasattr(status, "value") else status] = count

    return {
        "today_scheduled_events": today_scheduled,
        "week_total_water_volume_m3": round(float(week_volume), 2),
        "zones_by_status": zones_by_status,
    }


# ======================================================================
# 6. Asset Management
# ======================================================================
assets_router = APIRouter(prefix="/assets", tags=["assets"])


@assets_router.get("", response_model=list[schemas.AssetOut])
def list_assets(category: str | None = None, status: str | None = None,
                 farm_code: str | None = None, db: Session = Depends(get_db)):
    q = db.query(models.Asset)
    if category:
        q = q.filter(models.Asset.category == category)
    if status:
        q = q.filter(models.Asset.status == status)
    if farm_code:
        q = q.filter(models.Asset.farm_code == farm_code)
    return q.order_by(models.Asset.name).all()


@assets_router.post("", response_model=schemas.AssetOut)
def create_asset(payload: schemas.AssetIn,
                  user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                  db: Session = Depends(get_db)):
    try:
        category = models.AssetCategory(payload.category)
        status = models.AssetStatus(payload.status)
    except ValueError as e:
        raise HTTPException(400, str(e))
    asset = models.Asset(
        name=payload.name, category=category, farm_code=payload.farm_code,
        status=status, purchase_date=payload.purchase_date,
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@assets_router.get("/{asset_code}", response_model=schemas.AssetOut)
def get_asset(asset_code: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_code == asset_code).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    return asset


@assets_router.patch("/{asset_code}/status", response_model=schemas.AssetOut)
def update_asset_status(asset_code: str, payload: schemas.AssetStatusIn,
                         user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                         db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_code == asset_code).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    try:
        asset.status = models.AssetStatus(payload.status)
    except ValueError:
        raise HTTPException(400, f"Unknown status: {payload.status}")
    db.commit()
    db.refresh(asset)
    return asset


@assets_router.get("/{asset_code}/maintenance", response_model=list[schemas.MaintenanceRecordOut])
def list_maintenance(asset_code: str, db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_code == asset_code).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    return (
        db.query(models.MaintenanceRecord)
        .filter(models.MaintenanceRecord.asset_id == asset.id)
        .order_by(models.MaintenanceRecord.service_date.desc())
        .all()
    )


@assets_router.post("/{asset_code}/maintenance", response_model=schemas.MaintenanceRecordOut)
def create_maintenance(asset_code: str, payload: schemas.MaintenanceRecordIn,
                        user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                        db: Session = Depends(get_db)):
    asset = db.query(models.Asset).filter(models.Asset.asset_code == asset_code).first()
    if not asset:
        raise HTTPException(404, "Asset not found")
    service_date = payload.service_date or datetime.utcnow()
    record = models.MaintenanceRecord(
        asset_id=asset.id, service_date=service_date, performed_by=payload.performed_by or user.id,
        description=payload.description, cost=payload.cost, next_due_date=payload.next_due_date,
    )
    db.add(record)
    asset.last_service_date = service_date
    db.commit()
    db.refresh(record)
    return record


# ======================================================================
# 7. Workforce Management
# ======================================================================
workforce_router = APIRouter(prefix="/workforce", tags=["workforce"])


@workforce_router.get("/staff", response_model=list[schemas.StaffOut])
def list_staff(user=Depends(require_platform_user(STAFF_OR_ADMIN)), db: Session = Depends(get_db)):
    return (
        db.query(models.PlatformUser)
        .filter(models.PlatformUser.role == models.PlatformRole.staff)
        .order_by(models.PlatformUser.full_name)
        .all()
    )


@workforce_router.get("/staff/{staff_id}/assignments")
def staff_assignments(staff_id: int, user=Depends(require_platform_user(STAFF_OR_ADMIN)),
                       db: Session = Depends(get_db)):
    staff = db.query(models.PlatformUser).filter(models.PlatformUser.id == staff_id).first()
    if not staff:
        raise HTTPException(404, "Staff member not found")

    ops = db.query(models.Operation).filter(models.Operation.assigned_to == staff_id).all()
    op_items = [
        {
            "type": "operation", "reference": op.operation_id, "farm_code": op.farm_code,
            "status": op.status.value if hasattr(op.status, "value") else op.status,
            "date": op.scheduled_date or op.created_at,
        }
        for op in ops
    ]

    pest_assignments = (
        db.query(models.TaskAssignment)
        .filter(models.TaskAssignment.staff_id == staff_id,
                models.TaskAssignment.assignment_type == models.AssignmentType.pest_detection)
        .all()
    )
    pest_items = []
    for ta in pest_assignments:
        detection = db.query(models.PestDetection).filter(models.PestDetection.id == ta.reference_id).first()
        pest_items.append({
            "type": "pest_detection",
            "reference": detection.detection_id if detection else None,
            "farm_code": detection.farm_code if detection else None,
            "status": ta.status.value if hasattr(ta.status, "value") else ta.status,
            "date": ta.due_date or ta.assigned_date,
        })

    merged = sorted(op_items + pest_items, key=lambda x: x["date"] or datetime.min, reverse=True)
    return merged


@workforce_router.get("/performance")
def workforce_performance(user=Depends(require_platform_user(STAFF_OR_ADMIN)), db: Session = Depends(get_db)):
    staff_members = (
        db.query(models.PlatformUser)
        .filter(models.PlatformUser.role == models.PlatformRole.staff)
        .all()
    )
    results = []
    for s in staff_members:
        total_ops = db.query(func.count(models.Operation.id)).filter(models.Operation.assigned_to == s.id).scalar() or 0
        completed_ops = (
            db.query(func.count(models.Operation.id))
            .filter(models.Operation.assigned_to == s.id, models.Operation.status == models.OperationStatus.completed)
            .scalar() or 0
        )
        total_pest_assignments = (
            db.query(func.count(models.TaskAssignment.id))
            .filter(models.TaskAssignment.staff_id == s.id,
                    models.TaskAssignment.assignment_type == models.AssignmentType.pest_detection)
            .scalar() or 0
        )
        completed_pest_assignments = (
            db.query(func.count(models.TaskAssignment.id))
            .filter(models.TaskAssignment.staff_id == s.id,
                    models.TaskAssignment.assignment_type == models.AssignmentType.pest_detection,
                    models.TaskAssignment.status == models.AssignmentStatus.completed)
            .scalar() or 0
        )
        total = total_ops + total_pest_assignments
        completed = completed_ops + completed_pest_assignments
        completion_rate = round((completed / total) * 100, 1) if total else 0.0
        results.append({
            "staff_id": s.id, "full_name": s.full_name, "staff_title": s.staff_title,
            "total_assignments": total, "completed_assignments": completed,
            "completion_rate_percent": completion_rate,
        })
    return results


# ======================================================================
# 8. Operations Dashboard (top-level KPI aggregate)
# ======================================================================
ops_dashboard_router = APIRouter(prefix="/ops", tags=["ops-dashboard"])


@ops_dashboard_router.get("/dashboard")
def ops_dashboard(db: Session = Depends(get_db)):
    """Top-level KPIs for the Operations Center. NDVI/weather figures are
    intentionally NOT included here — the frontend already holds the real
    36-month NDVI series in ndvi-farms.json and should compute those
    client-side; this endpoint only covers what actually lives in Postgres."""
    total_farms = db.query(func.count(models.Farm.id)).scalar() or 0

    active_operations = (
        db.query(func.count(models.Operation.id))
        .filter(models.Operation.status.in_([
            models.OperationStatus.planned, models.OperationStatus.assigned,
            models.OperationStatus.in_progress, models.OperationStatus.delayed,
        ]))
        .scalar() or 0
    )

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    completed_this_month = (
        db.query(func.count(models.Operation.id))
        .filter(models.Operation.status == models.OperationStatus.completed,
                models.Operation.updated_at >= month_start)
        .scalar() or 0
    )

    open_tasks = (
        db.query(func.count(models.Operation.id))
        .filter(models.Operation.status.notin_([
            models.OperationStatus.completed, models.OperationStatus.cancelled,
        ]))
        .scalar() or 0
    )

    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + timedelta(days=1)
    irrigation_events_today = (
        db.query(func.count(models.IrrigationEvent.id))
        .filter(models.IrrigationEvent.scheduled_start >= today_start,
                models.IrrigationEvent.scheduled_start < today_end)
        .scalar() or 0
    )

    active_pest_alerts = (
        db.query(func.count(models.PestDetection.id))
        .filter(models.PestDetection.risk_level.in_([models.RiskLevel.high, models.RiskLevel.crit