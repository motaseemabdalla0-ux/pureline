"""API routes for the Pure Line Services Platform.

Mounted under /api/platform/* by main.py. Covers service requests,
quotations, consultancy, file uploads, admin auth + dashboard, and farm
report generation.
"""
import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas, pdf
from .auth import ADMIN_PASSWORD, issue_token, require_admin
from .database import get_db
from .platform_auth import router as platform_auth_router
from .farm_ops_routers import (
    assets_router, audit_router, boundary_router, farms_router, irrigation_router,
    notifications_router, operations_router, operators_router, ops_dashboard_router,
    pests_router, recycling_router, regions_router, search_router,
    traps_registry_router, users_router, workforce_router,
)

router = APIRouter(prefix="/api/platform")

# Farm Operations Management Platform — mounted alongside the existing
# services-platform endpoints, all still under /api/platform.
router.include_router(platform_auth_router)
router.include_router(farms_router)
router.include_router(operations_router)
router.include_router(pests_router)
router.include_router(irrigation_router)
router.include_router(assets_router)
router.include_router(workforce_router)
router.include_router(ops_dashboard_router)
router.include_router(users_router)
router.include_router(regions_router)
router.include_router(operators_router)
router.include_router(traps_registry_router)
router.include_router(recycling_router)
router.include_router(notifications_router)
router.include_router(audit_router)
router.include_router(search_router)
router.include_router(boundary_router)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/data/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_EXT = {".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx", ".kml", ".kmz"}
MAX_UPLOAD_MB = 15


def _log(db: Session, actor: str, action: str, meta: dict | None = None):
    db.add(models.ActivityLog(actor=actor, action=action, meta=meta or {}))


def _get_or_create_customer(db: Session, c: schemas.CustomerIn) -> models.Customer:
    existing = (
        db.query(models.Customer)
        .filter(models.Customer.email == c.email, models.Customer.phone == c.phone)
        .first()
    )
    if existing:
        return existing
    customer = models.Customer(**c.model_dump())
    db.add(customer)
    db.flush()
    return customer


# ---------------------------------------------------------------- requests --
@router.post("/requests", response_model=schemas.ServiceRequestOut)
def create_request(payload: schemas.ServiceRequestIn, db: Session = Depends(get_db)):
    customer = _get_or_create_customer(db, payload.customer)
    req = models.ServiceRequest(
        customer_id=customer.id,
        farm_name=payload.farm_name,
        farm_location=payload.farm_location,
        farm_size=payload.farm_size,
        crop_type=payload.crop_type,
        service_slug=payload.service_slug,
        service_name=payload.service_name,
        description=payload.description,
        priority=payload.priority,
        status=models.RequestStatus.submitted,
        attachments=[],
    )
    db.add(req)
    db.flush()
    db.add(models.RequestStatusEvent(request_id_fk=req.id, status=models.RequestStatus.submitted,
                                      note="Request submitted by customer"))
    _log(db, customer.email, "request.created", {"request_id": req.request_id, "service": payload.service_slug})
    db.commit()
    db.refresh(req)
    return req


@router.get("/requests/lookup", response_model=list[schemas.ServiceRequestOut])
def lookup_requests(email: str, db: Session = Depends(get_db)):
    """Customer portal lookup — no auth, keyed by the email the request was
    submitted with (matches the 'track by contact info' pattern used across
    the site's other portal-lite flows; documented scope choice)."""
    customer = db.query(models.Customer).filter(models.Customer.email == email).first()
    if not customer:
        return []
    return customer.requests


@router.get("/requests/{request_id}", response_model=schemas.ServiceRequestOut)
def get_request(request_id: str, db: Session = Depends(get_db)):
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    return req


@router.post("/requests/{request_id}/attachments")
async def upload_attachment(request_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"File type {ext} not allowed")
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {MAX_UPLOAD_MB}MB limit")
    stored_name = f"{request_id}_{uuid.uuid4().hex[:8]}{ext}"
    with open(os.path.join(UPLOAD_DIR, stored_name), "wb") as f:
        f.write(contents)
    req.attachments = [*(req.attachments or []), stored_name]
    db.commit()
    return {"stored_name": stored_name, "original_name": file.filename}


# -------------------------------------------------------------- quotations --
@router.post("/quotations", response_model=schemas.QuotationOut)
def create_quotation(payload: schemas.QuotationIn, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.request_id == payload.request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    line_items = [
        {"description": li.description, "qty": li.qty, "unit_price": li.unit_price,
         "total": round(li.qty * li.unit_price, 2)}
        for li in payload.line_items
    ]
    subtotal = round(sum(li["total"] for li in line_items), 2)
    tax_amount = round(subtotal * payload.tax_percent / 100, 2)
    total = round(subtotal + tax_amount, 2)
    quote = models.Quotation(
        request_id_fk=req.id, template=payload.template, currency=payload.currency,
        line_items=line_items, subtotal=subtotal, tax_percent=payload.tax_percent,
        tax_amount=tax_amount, total=total, terms=payload.terms,
        valid_until=datetime.utcnow() + timedelta(days=payload.valid_days),
    )
    db.add(quote)
    req.status = models.RequestStatus.quotation_sent
    db.add(models.RequestStatusEvent(request_id_fk=req.id, status=models.RequestStatus.quotation_sent,
                                      note=f"Quotation {quote.quote_id} issued"))
    _log(db, "admin", "quotation.created", {"quote_id": quote.quote_id, "request_id": req.request_id})
    db.commit()
    db.refresh(quote)
    return quote


@router.get("/quotations/{quote_id}", response_model=schemas.QuotationOut)
def get_quotation(quote_id: str, db: Session = Depends(get_db)):
    q = db.query(models.Quotation).filter(models.Quotation.quote_id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quotation not found")
    return q


@router.get("/quotations/{quote_id}/pdf")
def download_quotation_pdf(quote_id: str, db: Session = Depends(get_db)):
    q = db.query(models.Quotation).filter(models.Quotation.quote_id == quote_id).first()
    if not q:
        raise HTTPException(404, "Quotation not found")
    req = q.request
    pdf_bytes = pdf.generate_quotation_pdf(
        {
            "quote_id": q.quote_id, "currency": q.currency, "line_items": q.line_items,
            "subtotal": q.subtotal, "tax_percent": q.tax_percent, "tax_amount": q.tax_amount,
            "total": q.total, "terms": q.terms, "valid_until": q.valid_until, "created_at": q.created_at,
        },
        {
            "customer_name": req.customer.full_name, "company": req.customer.company,
            "farm_name": req.farm_name, "farm_location": req.farm_location,
            "service_name": req.service_name,
        },
    )
    return StreamingResponse(
        iter([pdf_bytes]), media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{q.quote_id}.pdf"'},
    )


# -------------------------------------------------------------- consultancy --
@router.post("/consultations", response_model=schemas.ConsultationOut)
def create_consultation(payload: schemas.ConsultationIn, db: Session = Depends(get_db)):
    customer = _get_or_create_customer(db, payload.customer)
    c = models.ConsultationRequest(
        customer_id=customer.id, kind=payload.kind,
        farm_context=payload.farm_context, notes=payload.notes,
    )
    db.add(c)
    _log(db, customer.email, "consultation.created", {"id": c.consultation_id, "kind": payload.kind})
    db.commit()
    db.refresh(c)
    return c


@router.get("/consultations/lookup", response_model=list[schemas.ConsultationOut])
def lookup_consultations(email: str, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.email == email).first()
    if not customer:
        return []
    return (
        db.query(models.ConsultationRequest)
        .filter(models.ConsultationRequest.customer_id == customer.id)
        .all()
    )


# -------------------------------------------------------------- farm reports --
@router.get("/reports/{report_type}/{farm_id}/pdf")
def download_farm_report(report_type: str, farm_id: str, name: str, region: str,
                          ndvi: float, trend: str, status_label: str, updated: str):
    """Stateless report generator — the frontend already holds the real farm
    data (ndvi-farms.json); it passes the values here to render a formatted,
    downloadable PDF rather than duplicating the dataset server-side."""
    if report_type not in {"ndvi", "satellite", "health", "operational"}:
        raise HTTPException(400, "Unknown report type")
    stats = {
        "Current NDVI": f"{ndvi * 100:.1f}%",
        "Trend": trend,
        "Status": status_label,
        "Last Updated": updated,
    }
    pdf_bytes = pdf.generate_farm_report_pdf(report_type, {"id": farm_id, "name": name, "region": region}, stats)
    return StreamingResponse(
        iter([pdf_bytes]), media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{farm_id}-{report_type}-report.pdf"'},
    )


# -------------------------------------------------------------------- admin --
@router.post("/admin/login")
def admin_login(payload: schemas.AdminLoginIn):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(401, "Incorrect password")
    return {"token": issue_token()}


@router.get("/admin/requests", response_model=list[schemas.ServiceRequestOut])
def admin_list_requests(_admin=Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(models.ServiceRequest).order_by(models.ServiceRequest.created_at.desc()).all()


@router.patch("/admin/requests/{request_id}/status", response_model=schemas.ServiceRequestOut)
def admin_update_status(request_id: str, payload: schemas.StatusUpdateIn,
                         _admin=Depends(require_admin), db: Session = Depends(get_db)):
    req = db.query(models.ServiceRequest).filter(models.ServiceRequest.request_id == request_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    req.status = payload.status
    db.add(models.RequestStatusEvent(request_id_fk=req.id, status=payload.status, note=payload.note))
    _log(db, "admin", "request.status_changed", {"request_id": request_id, "status": payload.status})
    db.commit()
    db.refresh(req)
    return req


@router.get("/admin/customers")
def admin_list_customers(_admin=Depends(require_admin), db: Session = Depends(get_db)):
    customers = db.query(models.Customer).order_by(models.Customer.created_at.desc()).all()
    return [
        {"id": c.id, "full_name": c.full_name, "company": c.company, "email": c.email,
         "phone": c.phone, "created_at": c.created_at, "request_count": len(c.requests)}
        for c in customers
    ]


@router.get("/admin/kpis", response_model=schemas.KpiOut)
def admin_kpis(_admin=Depends(require_admin), db: Session = Depends(get_db)):
    total = db.query(func.count(models.ServiceRequest.id)).scalar() or 0
    open_count = (
        db.query(func.count(models.ServiceRequest.id))
        .filter(models.ServiceRequest.status.notin_([models.RequestStatus.completed]))
        .scalar() or 0
    )
    total_quotes = db.query(func.count(models.Quotation.id)).scalar() or 0
    total_customers = db.query(func.count(models.Customer.id)).scalar() or 0

    by_status: dict[str, int] = {}
    for status, count in db.query(models.ServiceRequest.status, func.count(models.ServiceRequest.id)).group_by(models.ServiceRequest.status):
        by_status[status.value if hasattr(status, "value") else status] = count

    by_service: dict[str, int] = {}
    for slug, count in db.query(models.ServiceRequest.service_slug, func.count(models.ServiceRequest.id)).group_by(models.ServiceRequest.service_slug):
        by_service[slug] = count

    return schemas.KpiOut(
        total_requests=total, open_requests=open_count, total_quotations=total_quotes,
        total_customers=total_customers, requests_by_status=by_status, requests_by_service=by_service,
    )


@router.get("/admin/activity")
def admin_activity(_admin=Depends(require_admin), db: Session = Depends(get_db), limit: int = 50):
    rows = db.query(models.ActivityLog).order_by(models.ActivityLog.created_at.desc()).limit(limit).all()
    return [{"actor": r.actor, "action": r.action, "meta": r.meta, "created_at": r.created_at} for r in rows]
