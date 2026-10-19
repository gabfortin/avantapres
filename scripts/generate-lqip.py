#!/usr/bin/env python3
"""
Regénère data/image-lqip.json : pour chaque photo référencée dans
data/points.json, génère une minuscule vignette floutée encodée en base64
(utilisée comme placeholder pendant le chargement de la vraie image) ainsi
que ses dimensions réelles (utilisées pour calculer le ratio du comparateur
avant/après sans attendre le chargement des photos).

Nécessite Pillow (`pip install Pillow`). À relancer après avoir ajouté ou
remplacé des photos dans data/points/.

Usage : python3 scripts/generate-lqip.py
"""
import json
import os
import base64
import io

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POINTS_JSON = os.path.join(ROOT, 'data', 'points.json')
OUT_JSON = os.path.join(ROOT, 'data', 'image-lqip.json')
THUMB_WIDTH = 20
JPEG_QUALITY = 30


def generer_vignette(abs_path):
    with Image.open(abs_path) as img:
        width, height = img.size
        if img.mode != 'RGB':
            img = img.convert('RGB')
        ratio = THUMB_WIDTH / width
        thumb = img.resize((THUMB_WIDTH, max(1, round(height * ratio))), Image.LANCZOS)
        buf = io.BytesIO()
        thumb.save(buf, 'JPEG', quality=JPEG_QUALITY)
        b64 = base64.b64encode(buf.getvalue()).decode('ascii')
    return b64, width, height


def main():
    with open(POINTS_JSON, encoding='utf-8') as f:
        points = json.load(f)

    images = sorted({p[k]['image'] for p in points for k in ('before', 'after')})

    manifest = {}
    for rel_path in images:
        abs_path = os.path.join(ROOT, rel_path)
        if not os.path.isfile(abs_path):
            print(f"  ! introuvable, ignoré : {rel_path}")
            continue

        b64, width, height = generer_vignette(abs_path)
        manifest[rel_path] = {
            'src': f'data:image/jpeg;base64,{b64}',
            'w': width,
            'h': height
        }

    with open(OUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, separators=(',', ':'))

    size_kb = os.path.getsize(OUT_JSON) / 1024
    print(f"{len(manifest)} vignettes générées -> {OUT_JSON} ({size_kb:.0f} Ko)")


if __name__ == '__main__':
    main()
