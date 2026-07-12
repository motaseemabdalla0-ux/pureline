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
    Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, JSON
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_request_id() -> str:
    """Human-readable unique request ID, e.g. PL-REQ-2026-A1B2C3."""
    return f"PL-REQ-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"


def gen_quote_id() -> str:
    return f"PL-QT-{datetime.utcnow().year}-{uuid.uuid4().hex[:6].upper()}"


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
    """Lightweight farm record for consultancy/report linkage. The 6 real
    RCU-monitored farms are seeded here; customers can also register
    farms of their own that aren't in the satellite-monitored set."""
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, index=True)
    farm_code = Column(String(60), unique=True, index=True, nullable=True)  # matches ndvi-farms.json id when real
    name = Column(String(200), nullable=False)
    location = Column(String(300), nullable=True)
    size = Column(String(100), nullable=True)
    crop_type = Column(String(150), nullable=True)
    is_satellite_monitored = Column(Integer, default=0)  # 0/1 bool (portable across sqlite/postgres)
    created_at = Column(DateTime, default=datetime.utcnow)


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
