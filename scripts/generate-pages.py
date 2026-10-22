#!/usr/bin/env python3
"""
Génère une page de partage par lieu dans lieu/<id>/ :

- lieu/<id>/index.html : porte les balises Open Graph / Twitter propres au
  lieu (titre, description, image) pour que l'aperçu soit le bon quand on
  colle le lien sur Facebook, iMessage, etc. (ces plateformes n'exécutent
  pas le JavaScript), puis redirige le visiteur vers la carte avec le
  panneau du lieu ouvert (/?lieu=<id>).
- lieu/<id>/og.jpg : image d'aperçu 1200×630, photos avant | après côte à
  côte.

Met aussi à jour sitemap.xml et supprime les dossiers de lieux retirés de
data/points.json.

Nécessite Pillow (`pip install Pillow`). Relancé automatiquement par
.github/workflows/generer-pages.yml à chaque modification de
data/points.json ou des photos.

Usage : python3 scripts/generate-pages.py
"""
import html
import json
import os
import shutil

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POINTS_JSON = os.path.join(ROOT, 'data', 'points.json')
PAGES_DIR = os.path.join(ROOT, 'lieu')
SITEMAP = os.path.join(ROOT, 'sitemap.xml')
SITE_URL = 'https://avant-apres.ca'
SITE_NAME = 'Avant / Après'
OG_W, OG_H = 1200, 630
DIVIDER = 6
JPEG_QUALITY = 82

PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} — {site}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{page_url}">
  <link rel="icon" href="../../assets/img/favicon.svg" type="image/svg+xml">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="{site}">
  <meta property="og:locale" content="fr_CA">
  <meta property="og:title" content="{title} — {site}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{image_url}">
  <meta property="og:image:width" content="{og_w}">
  <meta property="og:image:height" content="{og_h}">
  <meta property="og:image:alt" content="Avant et après — {title}">
  <meta property="og:url" content="{page_url}">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title} — {site}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{image_url}">

  <meta http-equiv="refresh" content="0; url={map_href}">
  <script>location.replace({map_href_js});</script>
</head>
<body>
  <p><a href="{map_href}">Voir « {title} » sur la carte Avant / Après</a></p>
</body>
</html>
"""


def charger_police(taille):
    for nom in ('DejaVuSans-Bold.ttf', 'Arial Bold.ttf', 'Helvetica.ttc'):
        try:
            return ImageFont.truetype(nom, taille)
        except OSError:
            continue
    return ImageFont.load_default(size=taille)


def etiquette(draw, x, y, texte, police, fond):
    pad_x, pad_y = 18, 10
    l, t, r, b = draw.textbbox((0, 0), texte, font=police)
    w, h = r - l + 2 * pad_x, b - t + 2 * pad_y
    draw.rounded_rectangle((x, y, x + w, y + h), radius=h // 2, fill=fond)
    draw.text((x + pad_x - l, y + pad_y - t), texte, font=police, fill='white')


def generer_og(pt, dest):
    moitie = (OG_W - DIVIDER) // 2
    canvas = Image.new('RGB', (OG_W, OG_H), 'white')
    for i, cle in enumerate(('before', 'after')):
        with Image.open(os.path.join(ROOT, pt[cle]['image'])) as img:
            img = ImageOps.exif_transpose(img).convert('RGB')
            img = ImageOps.fit(img, (moitie, OG_H), Image.LANCZOS)
            canvas.paste(img, (i * (moitie + DIVIDER), 0))

    draw = ImageDraw.Draw(canvas)
    police = charger_police(30)
    etiquette(draw, 24, 24, 'AVANT', police, (148, 98, 47))
    etiquette(draw, moitie + DIVIDER + 24, 24, 'APRÈS', police, (21, 128, 61))
    canvas.save(dest, 'JPEG', quality=JPEG_QUALITY, optimize=True, progressive=True)


def generer_page(pt, dest):
    pid = pt['id']
    page_url = f'{SITE_URL}/lieu/{pid}/'
    map_href = f'../../?lieu={pid}'
    desc = ' '.join((pt.get('description') or pt['borough']).split())
    contenu = PAGE_TEMPLATE.format(
        title=html.escape(pt['title']),
        desc=html.escape(desc),
        site=html.escape(SITE_NAME),
        page_url=html.escape(page_url),
        image_url=html.escape(f'{page_url}og.jpg'),
        og_w=OG_W,
        og_h=OG_H,
        map_href=html.escape(map_href),
        map_href_js=json.dumps(map_href),
    )
    with open(dest, 'w', encoding='utf-8') as f:
        f.write(contenu)


def ecrire_sitemap(ids):
    urls = [f'{SITE_URL}/', f'{SITE_URL}/confidentialite.html']
    urls += [f'{SITE_URL}/lieu/{pid}/' for pid in ids]
    lignes = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url in urls:
        lignes += ['  <url>', f'    <loc>{html.escape(url)}</loc>', '  </url>']
    lignes.append('</urlset>')
    with open(SITEMAP, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lignes) + '\n')


def main():
    with open(POINTS_JSON, encoding='utf-8') as f:
        points = json.load(f)

    os.makedirs(PAGES_DIR, exist_ok=True)
    ids = []
    for pt in points:
        pid = pt['id']
        dossier = os.path.join(PAGES_DIR, pid)
        os.makedirs(dossier, exist_ok=True)
        try:
            generer_og(pt, os.path.join(dossier, 'og.jpg'))
        except (OSError, KeyError) as err:
            print(f"  ! image d'aperçu impossible pour {pid} : {err}")
        generer_page(pt, os.path.join(dossier, 'index.html'))
        ids.append(pid)

    for nom in os.listdir(PAGES_DIR):
        chemin = os.path.join(PAGES_DIR, nom)
        if os.path.isdir(chemin) and nom not in ids:
            shutil.rmtree(chemin)
            print(f"  - supprimé : lieu/{nom}/")

    ecrire_sitemap(ids)
    print(f"{len(ids)} pages générées -> {PAGES_DIR}")


if __name__ == '__main__':
    main()
