"""
Round 2 processing: real per-farm Esri World Imagery crops (sub-meter res)
and real Wikimedia Commons agriculture photographs for the Projects section.
"""
import json, os
from PIL import Image, ImageEnhance, ImageFilter

RAW = os.path.dirname(__file__) + "/raw"
FARM_OUT = os.path.dirname(__file__) + "/processed/farms"
PROJ_OUT = os.path.dirname(__file__) + "/processed/projects"
os.makedirs(FARM_OUT, exist_ok=True)
os.makedirs(PROJ_OUT, exist_ok=True)

# ---- 1. Per-farm Esri World Imagery crops ----
FARM_BBOXES = {
    "UDH-000338": [38.0355061179778, 26.6915008115001, 38.0475061179778, 26.7035008115001],
    "KHP-00002":  [39.2461503485847, 25.7292281112476, 39.2581503485847, 25.7412281112476],
    "KHP-00007":  [39.239294642509, 25.7300428282531, 39.251294642509, 25.7420428282531],
    "UDH-000337": [38.0627481665151, 26.6974545192527, 38.0747481665151, 26.7094545192527],
    "UDH-000002": [37.9215146660793, 26.7153654062107, 37.9335146660793, 26.7273654062107],
    "UDH-000373": [37.9799716794481, 26.7361912110692, 37.9919716794481, 26.7481912110692],
}
WIDTHS = [1200, 800, 400]
farm_manifest = {}
for code, bbox in FARM_BBOXES.items():
    src = f"{RAW}/esri_{code}.jpg"
    if not os.path.exists(src):
        print("MISSING", src); continue
    im = Image.open(src).convert("RGB")
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im = ImageEnhance.Color(im).enhance(1.05)
    variants = []
    for w in WIDTHS:
        h = round(im.height * (w / im.width))
        r = im.resize((w, h), Image.LANCZOS)
        fname = f"{code}-{w}.webp"
        r.save(f"{FARM_OUT}/{fname}", "WEBP", quality=85, method=6)
        variants.append({"width": w, "file": fname})
    farm_manifest[code] = {
        "bbox": bbox,  # [west, south, east, north] in EPSG:4326 - matches export request
        "pixelSize": [im.width, im.height],
        "variants": variants,
        "source": "Esri World Imagery (ArcGIS Online) — sub-meter satellite/aerial composite",
        "acquired": "current Esri World Imagery basemap layer",
    }

with open(f"{FARM_OUT}/manifest.json", "w") as f:
    json.dump(farm_manifest, f, indent=2)
print(f"Farm crops processed: {len(farm_manifest)}")

# ---- 2. Real Wikimedia Commons project photos ----
PROJECTS = {
    "proj_satellite1": {"title": "Center-pivot irrigation circles, Saudi Arabia (astronaut photograph)", "credit": "NASA / Wikimedia Commons, public domain"},
    "proj_satellite2": {"title": "The Nile River and Crop Circles", "credit": "NASA Earth Observatory / Wikimedia Commons, public domain"},
    "proj_greenhouse1": {"title": "Greenhouse tomato production", "credit": "Wikimedia Commons, CC BY-SA"},
    "proj_greenhouse2": {"title": "Greenhouse crop rows", "credit": "Wikimedia Commons, CC BY-SA"},
    "proj_irrigation1": {"title": "Center-pivot irrigated corn field", "credit": "Wikimedia Commons, CC BY-SA"},
    "proj_irrigation2": {"title": "Center-pivot irrigated grain field", "credit": "Wikimedia Commons, CC BY-SA"},
    "proj_infra1": {"title": "Canal headworks intake infrastructure", "credit": "Wikimedia Commons, CC BY-SA"},
    "proj_infra2": {"title": "Rural agricultural water supply infrastructure", "credit": "Wikimedia Commons, CC BY-SA"},
    "proj_precision1": {"title": "Technology contributing to agriculture", "credit": "USDA / Wikimedia Commons, public domain"},
    "proj_precision2": {"title": "Agricultural drone aerial survey", "credit": "Wikimedia Commons, CC BY-SA"},
    "proj_control1": {"title": "Industrial control room operations", "credit": "Wikimedia Commons, CC BY-SA"},
    "proj_control2": {"title": "Mission control / operations center", "credit": "NASA / Wikimedia Commons, public domain"},
}
proj_manifest = {}
for key, meta in PROJECTS.items():
    src = f"{RAW}/{key}.jpg"
    if not os.path.exists(src):
        print("MISSING", src); continue
    im = Image.open(src).convert("RGB")
    # center-crop to 4:3 to match the Projects grid card aspect ratio
    target_ratio = 4/3
    w, h = im.size
    cur_ratio = w / h
    if cur_ratio > target_ratio:
        new_w = round(h * target_ratio)
        x0 = (w - new_w) // 2
        im = im.crop((x0, 0, x0 + new_w, h))
    else:
        new_h = round(w / target_ratio)
        y0 = (h - new_h) // 2
        im = im.crop((0, y0, w, y0 + new_h))
    variants = []
    for cw in [1200, 800, 500]:
        ch = round(cw / target_ratio)
        r = im.resize((cw, ch), Image.LANCZOS)
        fname = f"{key}-{cw}.webp"
        r.save(f"{PROJ_OUT}/{fname}", "WEBP", quality=82, method=6)
        variants.append({"width": cw, "file": fname})
    proj_manifest[key] = {"title": meta["title"], "credit": meta["credit"], "variants": variants}

with open(f"{PROJ_OUT}/manifest.json", "w") as f:
    json.dump(proj_manifest, f, indent=2)
print(f"Project photos processed: {len(proj_manifest)}")
