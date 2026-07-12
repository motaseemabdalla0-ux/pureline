"""Idempotent startup seed data for the Farm Operations Management Platform.

Called once from main.py's startup handler (after init_db() creates tables).
Each seed function checks "table empty?" before inserting so repeated
container restarts never duplicate rows.

Farm registry seed: the 6 real satellite-monitored farms are defined in the
frontend's static ``website/src/data/ndvi-farms.json`` (id/name/nameAr plus
the 36-month NDVI series). That file is NOT available inside the chatbot
backend's Docker build context (only ``chatbot/backend`` is built into the
image — no volume mount of ``website/``), and the NDVI series itself must
stay frontend-only per the platform design (this table is the operational
registry, not a satellite-data mirror). So the farm_code/name/region here are
copied by hand from that JSON (read directly, once, during implementation) —
just the lightweight identity fields needed to attach Operations/Pest/
Irrigation/Asset records to a real farm, nothing satellite-derived.
"""
from datetime import datetime

from sqlalchemy.orm import Session

from . import models

# Mirrors the 6 real farm ids/names/regions from website/src/data/ndvi-farms.json.
REAL_FARMS = [
    {"farm_code": "UDH-000338", "name": "Al Udhayb Farm 338", "region": "Al Udhayb"},
    {"farm_code": "UDH-000373", "name": "Al Udhayb Farm 373", "region": "Al Udhayb"},
    {"farm_code": "UDH-000337", "name": "Al Udhayb Farm 337", "region": "Al Udhayb"},
    {"farm_code": "KHP-00007", "name": "Khaybar Farm Plot 07", "region": "Khaybar"},
    {"farm_code": "KHP-00002", "name": "Khaybar Farm Plot 02", "region": "Khaybar"},
    {"farm_code": "UDH-000002", "name": "Al Udhayb Farm 002", "region": "Al Udhayb"},
]

PEST_TYPES = [
    {
        "name": "Red Palm Weevil",
        "category": models.PestCategory.red_palm_weevil,
        "description": "Rhynchophorus ferrugineus — the most destructive date palm pest in the region; "
                        "larvae bore into the trunk, often undetected until structural damage is advanced.",
    },
    {
        "name": "Dubas Bug",
        "category": models.PestCategory.date_palm_pest,
        "description": "Ommatissus lybicus — sap-sucking planthopper causing honeydew buildup, sooty mold, "
                        "and reduced fruit yield; two generations per year, worst in spring and autumn.",
    },
    {
        "name": "Date Palm Scale",
        "category": models.PestCategory.date_palm_pest,
        "description": "Parlatoria blanchardii — armored scale insect infesting fronds and fruit stalks, "
                        "weakening the palm and reducing fruit quality under heavy infestation.",
    },
    {
        "name": "Greenhouse Whitefly",
        "category": models.PestCategory.greenhouse_pest,
        "description": "Trialeurodes vaporariorum — common in protected/greenhouse cultivation, feeds on "
                        "sap and transmits plant viruses; monitored via yellow sticky traps.",
    },
    {
        "name": "Spider Mites",
        "category": models.PestCategory.greenhouse_pest,
        "description": "Tetranychus urticae — thrives in hot, dry conditions; causes leaf stippling and "
                        "webbing, a recurring risk in open-field and greenhouse crops alike.",
    },
]

DEMO_USERS = [
    {
        "username": "admin", "email": "admin@pureline.local", "full_name": "Platform Administrator",
        "role": models.PlatformRole.admin, "staff_title": None, "phone": None,
        "password": "Pureline@2026",
    },
    {
        "username": "agronomist1", "email": "agronomist1@pureline.local", "full_name": "Sara Al-Otaibi",
        "role": models.PlatformRole.staff, "staff_title": "Field Agronomist", "phone": "+966500000001",
        "password": "Pureline@2026",
    },
    {
        "username": "customer1", "email": "customer1@pureline.local", "full_name": "Demo Farm Owner",
        "role": models.PlatformRole.customer, "staff_title": None, "phone": "+966500000002",
        "password": "Pureline@2026",
    },
]


def seed_farms(db: Session) -> None:
    if db.query(models.Farm).filter(models.Farm.farm_code.isnot(None)).first():
        return
    for f in REAL_FARMS:
        db.add(models.Farm(
            farm_code=f["farm_code"], name=f["name"], location=f["region"],
            region=f["region"], crop_type="Date Palm", is_satellite_monitored=1,
        ))
    db.commit()
    print(f"[seed] inserted {len(REAL_FARMS)} farm registry rows", flush=True)


def seed_pest_types(db: Session) -> None:
    if db.query(models.PestType).first():
        return
    for p in PEST_TYPES:
        db.add(models.PestType(name=p["name"], category=p["category"], description=p["description"]))
    db.commit()
    print(f"[seed] inserted {len(PEST_TYPES)} pest type rows", flush=True)


def seed_platform_users(db: Session) -> None:
    if db.query(models.PlatformUser).first():
        return
    # Local import to avoid a circular import at module load time
    from .platform_auth import _hash_password

    print("[seed] === Platform Operations Center — demo logins (first boot) ===", flush=True)
    for u in DEMO_USERS:
        password_hash, salt = _hash_password(u["password"])
        db.add(models.PlatformUser(
            username=u["username"], email=u["email"], password_hash=password_hash,
            password_salt=salt, full_name=u["full_name"], role=u["role"],
            staff_title=u["staff_title"], phone=u["phone"],
        ))
        print(f"[seed]   username={u['username']!r}  password={u['password']!r}  role={u['role'].value}",
              flush=True)
    print("[seed] === change these before any real deployment ===", flush=True)
    db.commit()


def seed_all(db: Session) -> None:
    seed_farms(db)
    seed_pest_types(db)
    seed_platform_users(db)
