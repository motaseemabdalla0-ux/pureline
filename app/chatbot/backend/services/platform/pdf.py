"""Server-side PDF generation (quotations, farm/NDVI/satellite reports).

Pure-Python via reportlab — no system dependencies (unlike WeasyPrint/wkhtmltopdf),
keeps the Docker image small and the build reliable.
"""
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)

BRAND_GREEN = colors.HexColor("#0F6B3A")
BRAND_GOLD = colors.HexColor("#D4AF37")
BRAND_DARK = colors.HexColor("#12281C")

styles = getSampleStyleSheet()
title_style = ParagraphStyle("PLTitle", parent=styles["Title"], textColor=BRAND_GREEN, fontSize=20, spaceAfter=4)
h2_style = ParagraphStyle("PLH2", parent=styles["Heading2"], textColor=BRAND_DARK, fontSize=13, spaceBefore=12, spaceAfter=6)
body_style = ParagraphStyle("PLBody", parent=styles["BodyText"], fontSize=9.5, leading=14, textColor=BRAND_DARK)
small_style = ParagraphStyle("PLSmall", parent=styles["BodyText"], fontSize=8, textColor=colors.HexColor("#666666"))


def _header(elements, doc_title: str, doc_id: str, date: datetime):
    elements.append(Paragraph("PURE LINE", ParagraphStyle(
        "Brand", parent=styles["Title"], textColor=BRAND_GREEN, fontSize=24)))
    elements.append(Paragraph("Agricultural Technology &amp; Smart Farming Solutions", small_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", color=BRAND_GOLD, thickness=1.4))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(doc_title, title_style))
    elements.append(Paragraph(f"Reference: <b>{doc_id}</b> &nbsp;&nbsp;|&nbsp;&nbsp; Date: {date.strftime('%d %b %Y')}", small_style))
    elements.append(Spacer(1, 14))


def _footer_note(elements):
    elements.append(Spacer(1, 18))
    elements.append(HRFlowable(width="100%", color=colors.HexColor("#dddddd"), thickness=0.7))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        "PURE LINE &middot; Riyadh, Saudi Arabia &middot; +966 53 037 0421 &middot; "
        "motaseemabdall0@gmail.com", small_style))


def generate_quotation_pdf(quote: dict, request: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=22 * mm, bottomMargin=18 * mm,
                             leftMargin=20 * mm, rightMargin=20 * mm)
    elements: list = []
    _header(elements, "Quotation", quote["quote_id"], quote["created_at"])

    elements.append(Paragraph(
        f"<b>Client:</b> {request['customer_name']}"
        + (f" ({request['company']})" if request.get("company") else ""),
        body_style,
    ))
    if request.get("farm_name"):
        elements.append(Paragraph(f"<b>Farm:</b> {request['farm_name']} &mdash; {request.get('farm_location') or ''}", body_style))
    elements.append(Paragraph(f"<b>Service:</b> {request['service_name']}", body_style))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("Pricing Breakdown", h2_style))
    table_data = [["Description", "Qty", "Unit Price", "Total"]]
    for item in quote["line_items"]:
        total = float(item["qty"]) * float(item["unit_price"])
        table_data.append([
            item["description"], f"{item['qty']:g}",
            f"{item['unit_price']:,.2f} {quote['currency']}", f"{total:,.2f} {quote['currency']}",
        ])
    table_data.append(["", "", "Subtotal", f"{quote['subtotal']:,.2f} {quote['currency']}"])
    table_data.append(["", "", f"Tax ({quote['tax_percent']:g}%)", f"{quote['tax_amount']:,.2f} {quote['currency']}"])
    table_data.append(["", "", "TOTAL", f"{quote['total']:,.2f} {quote['currency']}"])

    t = Table(table_data, colWidths=[75 * mm, 20 * mm, 35 * mm, 40 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (2, -1), (-1, -1), "Helvetica-Bold"),
        ("LINEBELOW", (0, 0), (-1, 0), 0.7, colors.white),
        ("GRID", (0, 0), (-1, -4), 0.4, colors.HexColor("#e2e2e2")),
        ("LINEABOVE", (2, -3), (-1, -3), 0.6, colors.HexColor("#999999")),
        ("TEXTCOLOR", (2, -1), (-1, -1), BRAND_GREEN),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 12))

    if quote.get("valid_until"):
        elements.append(Paragraph(f"<b>Valid until:</b> {quote['valid_until'].strftime('%d %b %Y')}", body_style))
    elements.append(Paragraph("Terms &amp; Conditions", h2_style))
    elements.append(Paragraph(quote.get("terms") or DEFAULT_TERMS, body_style))

    _footer_note(elements)
    doc.build(elements)
    return buf.getvalue()


DEFAULT_TERMS = (
    "This quotation is valid for the period stated above. Prices are in the currency shown and "
    "exclude any costs not explicitly listed. A signed purchase order or 50% mobilization deposit "
    "is required to begin work. Delivery timelines are confirmed upon project kickoff."
)


def generate_farm_report_pdf(report_type: str, farm: dict, stats: dict) -> bytes:
    """report_type: 'ndvi' | 'satellite' | 'health' | 'operational'"""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=22 * mm, bottomMargin=18 * mm,
                             leftMargin=20 * mm, rightMargin=20 * mm)
    elements: list = []
    title_map = {
        "ndvi": "NDVI Vegetation Report",
        "satellite": "Satellite Monitoring Report",
        "health": "Farm Health Report",
        "operational": "Operational Report",
    }
    doc_title = title_map.get(report_type, "Farm Report")
    report_id = f"PL-RPT-{datetime.utcnow().strftime('%Y%m%d')}-{farm.get('id', 'FARM')}"
    _header(elements, doc_title, report_id, datetime.utcnow())

    elements.append(Paragraph(f"<b>Farm:</b> {farm.get('name')} ({farm.get('id')})", body_style))
    elements.append(Paragraph(f"<b>Region:</b> {farm.get('region', '—')}", body_style))
    elements.append(Spacer(1, 10))

    elements.append(Paragraph("Key Metrics", h2_style))
    rows = [["Metric", "Value"]]
    for k, v in stats.items():
        rows.append([k, str(v)])
    t = Table(rows, colWidths=[85 * mm, 85 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#e2e2e2")),
        ("FONTSIZE", (0, 0), (-1, -1), 9.5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(
        "Data source: RCU NDVI Analysis Portal (real satellite-derived vegetation index readings) "
        "and Esri World Imagery (real satellite/aerial basemap).", small_style))

    _footer_note(elements)
    doc.build(elements)
    return buf.getvalue()
