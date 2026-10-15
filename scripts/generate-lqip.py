#!/usr/bin/env python3
"""
Regénère data/image-lqip.json : pour chaque photo référencée dans
data/points.json, génère une minuscule vignette floutée encodée en base64
(utilisée comme placeholder pendant le chargement de la vraie image) ainsi
que ses dimensions réelles (utilisées pour calculer le ratio du comparateur
avant/après sans attendre le chargement des photos).

Nécessite macOS (utilise l'outil `sips` intégré). À relancer après avoir
ajouté ou remplacé des photos dans data/points/.

Usage : python3 scripts/generate-lqip.py
"""
import json
import os
import subprocess
import base64
import hashlib
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POINTS_JSON = os.path.join(ROOT, 'data', 'points.json')
OUT_JSON = os.path.join(ROOT, 'data', 'image-lqip.json')
SRGB_PROFILE = '/System/Library/ColorSync/Profiles/sRGB Profile.icc'


def main():
    with open(POINTS_JSON) as f:
        points = json.load(f)

    images = sorted({p[k]['image'] for p in points for k in ('before', 'after')})

    manifest = {}
    with tempfile.TemporaryDirectory() as tmp_dir:
        for rel_path in images:
            abs_path = os.path.join(ROOT, rel_path)
            if not os.path.isfile(abs_path):
                print(f"  ! introuvable, ignoré : {rel_path}")
                continue

            tmp_out = os.path.join(tmp_dir, hashlib.md5(rel_path.encode()).hexdigest() + '.jpg')
            subprocess.run([
                'sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '30',
                '--resampleWidth', '20', '-m', SRGB_PROFILE, abs_path, '--out', tmp_out
            ], check=True, capture_output=True)

            data = open(tmp_out, 'rb').read()
            b64 = base64.b64encode(data).decode('ascii')

            dims_out = subprocess.run(
                ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', abs_path],
                check=True, capture_output=True, text=True
            ).stdout
            width = int(dims_out.split('pixelWidth: ')[1].split('\n')[0])
            height = int(dims_out.split('pixelHeight: ')[1].split('\n')[0])

            manifest[rel_path] = {
                'src': f'data:image/jpeg;base64,{b64}',
                'w': width,
                'h': height
            }

    with open(OUT_JSON, 'w') as f:
        json.dump(manifest, f, separators=(',', ':'))

    size_kb = os.path.getsize(OUT_JSON) / 1024
    print(f"{len(manifest)} vignettes générées -> {OUT_JSON} ({size_kb:.0f} Ko)")


if __name__ == '__main__':
    main()
