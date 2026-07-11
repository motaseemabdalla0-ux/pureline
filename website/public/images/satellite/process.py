"""
Real satellite imagery processing pipeline for Pure Line.
Source: NASA GIBS public WMS (VIIRS/MODIS Corrected Reflectance True Color) -
real, public-domain satellite imagery of the AlUla / Hijaz region, Saudi Arabia.
No API key required, free for reuse (NASA open data policy).

Produces, per source image:
  - /processed/<name>-1920.webp / -1200 / -800 / -400   (responsive srcset)
  - /processed/<name>-dark.webp                          (darkened + graded for
    hero/section backgrounds so text overlays stay legible)
Plus a manifest.json describing every derived asset (acquisition source/date)
for the site's <SatelliteImage> component to read attribution/date from.
"""
import json
import os
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

RAW_DIR = os.path.dirname(__file__) + "/raw"
OUT_DIR = os.path.dirname(__file__) + "/processed"
os.makedirs(OUT_DIR, exist_ok=True)

SOURCES = {
    "alula_wide":        {"date": "2025-06-15", "label": "AlUla Region — Wide Area"},
    "alula_valley":      {"date": "2025-06-15", "label": "AlUla Valley"},
    "alula_valley_2024": {"date": "2024-06-10", "label": "AlUla Valley"},
    "alula_valley_2023": {"date": "2023-06-10", "label": "AlUla Valley"},
    "alula_north":       {"date": "2025-06-15", "label": "AlUla North"},
    "alula_south":       {"date": "2025-01-15", "label": "AlUla South"},
    "hijaz_region":       {"date": "2025-06-15", "label": "Hijaz Region — Regional Context"},
    "madain_saleh":      {"date": "2025-03-01", "label": "Madain Saleh Corridor"},
}

WIDTHS = [1920, 1200, 800, 400]
manifest = {}

for name, meta in SOURCES.items():
    src_path = f"{RAW_DIR}/{name}.jpg"
    if not os.path.exists(src_path):
        continue
    im = Image.open(src_path).convert("RGB")
    # Real VIIRS/MODIS true-color at this crop size is coarse (~375m/px) —
    # mild sharpen + contrast lift makes it read well as a design asset
    # without pretending it's higher resolution than it is.
    im = ImageEnhance.Contrast(im).enhance(1.12)
    im = ImageEnhance.Color(im).enhance(1.08)
    im = im.filter(ImageFilter.SHARPEN)

    variants = []
    for w in WIDTHS:
        if w > im.width:
            continue
        h = round(im.height * (w / im.width))
        resized = im.resize((w, h), Image.LANCZOS)
        out_name = f"{name}-{w}.webp"
        resized.save(f"{OUT_DIR}/{out_name}", "WEBP", quality=82, method=6)
        variants.append({"width": w, "file": out_name})

    # Dark GIS-dashboard variant: deep teal/navy grade + vignette, used as
    # hero/section backgrounds so white/light text stays legible on top.
    dark = ImageEnhance.Brightness(im).enhance(0.42)
    dark = ImageEnhance.Color(dark).enhance(0.75)
    overlay = Image.new("RGB", dark.size, (5, 15, 20))
    dark = Image.blend(dark, overlay, 0.35)
    w = 1920 if im.width >= 1920 else im.width
    h = round(dark.height * (w / dark.width))
    dark = dark.resize((w, h), Image.LANCZOS)
    dark_name = f"{name}-dark.webp"
    dark.save(f"{OUT_DIR}/{dark_name}", "WEBP", quality=80, method=6)

    manifest[name] = {
        "label": meta["label"],
        "acquired": meta["date"],
        "source": "NASA GIBS (VIIRS Corrected Reflectance True Color) — public domain",
        "variants": variants,
        "dark": dark_name,
    }

with open(f"{OUT_DIR}/manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)

print(f"Processed {len(manifest)} sources -> {OUT_DIR}")
for k, v in manifest.items():
    print(" ", k, "->", len(v["variants"]), "sizes +", v["dark"])
