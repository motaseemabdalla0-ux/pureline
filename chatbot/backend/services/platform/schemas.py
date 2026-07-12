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
