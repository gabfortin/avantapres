#!/usr/bin/env python3
"""
Intègre une soumission publique (issue GitHub créée via le gabarit
« Proposer un nouveau lieu ») dans data/points.json et data/points/<slug>/.

Appelé par le workflow .github/workflows/integrer-lieu.yml quand le label
d'approbation est ajouté sur une issue. Pas destiné à un usage manuel.

Variables d'environnement attendues :
  ISSUE_BODY   corps markdown de l'issue (rendu des réponses au gabarit)
  ISSUE_NUMBER numéro de l'issue
  ERROR_FILE   chemin où écrire un message d'erreur lisible en cas d'échec
"""
import json
import os
import re
import sys
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POINTS_JSON = os.path.join(ROOT, 'data', 'points.json')
POINTS_DIR = os.path.join(ROOT, 'data', 'points')

TYPE_PAR_LABEL = {
    "Végétalisation": "vegetalisation",
    "Agrandissement de parc": "agrandissement-parc",
    "Cour d'école transformée en place publique": "place-ecole",
    "Retrait d'un panneau publicitaire": "panneau-publicitaire",
    "Création d'un espace piéton": "espace-pieton",
    "Apaisement de la circulation": "apaisement-de-circulation",
}

MAX_WIDTH = 1500
JPEG_QUALITY = 82


class ErreurIntegration(Exception):
    pass


def fail(message):
    raise ErreurIntegration(message)


def parse_issue_body(body):
    """Découpe le corps markdown d'une issue-form en {libellé: valeur}."""
    sections = re.split(r'(?m)^### (.+)$', body)
    # sections[0] est le texte avant le premier titre (vide normalement)
    valeurs = {}
    for i in range(1, len(sections), 2):
        label = sections[i].strip()
        valeur = sections[i + 1].strip() if i + 1 < len(sections) else ""
        valeurs[label] = valeur
    return valeurs


def valeur_ou_vide(valeurs, champ):
    v = valeurs.get(champ, "").strip()
    if v == "_No response_":
        return ""
    return v


def slugify(titre):
    nfkd = unicodedata.normalize('NFKD', titre)
    sans_accents = ''.join(c for c in nfkd if not unicodedata.combining(c))
    slug = sans_accents.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')
    return slug or 'lieu'


def slug_disponible(base_slug, points_existants):
    ids_existants = {p['id'] for p in points_existants}
    if not os.path.isdir(POINTS_DIR):
        dirs_existants = set()
    else:
        dirs_existants = set(os.listdir(POINTS_DIR))

    if base_slug not in ids_existants and base_slug not in dirs_existants:
        return base_slug
    for n in range(2, 100):
        candidat = f"{base_slug}-{n}"
        if candidat not in ids_existants and candidat not in dirs_existants:
            return candidat
    fail(f"impossible de trouver un identifiant unique pour « {base_slug} »")


def extraire_url_image(texte, nom_champ):
    m = re.search(r'!\[[^\]]*\]\((https?://[^\s)]+)\)', texte)
    if not m:
        fail(
            f"aucune image détectée dans le champ « {nom_champ} ». "
            "Glisse-dépose bien l'image directement dans la case prévue."
        )
    return m.group(1)


def telecharger_image(url, dest_sans_extension):
    from PIL import Image
    import io

    req = urllib.request.Request(url, headers={'User-Agent': 'avant-apres-bot'})
    try:
        with urllib.request.urlopen(req, timeout=30) as reponse:
            donnees = reponse.read()
    except Exception as e:
        fail(f"téléchargement de l'image échoué ({url}) : {e}")

    try:
        img = Image.open(io.BytesIO(donnees))
        img.load()
    except Exception as e:
        fail(f"impossible de lire l'image téléchargée ({url}) : {e}")

    if img.mode != 'RGB':
        img = img.convert('RGB')

    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / img.width
        img = img.resize((MAX_WIDTH, round(img.height * ratio)), Image.LANCZOS)

    chemin_final = dest_sans_extension + '.jpg'
    img.save(chemin_final, 'JPEG', quality=JPEG_QUALITY)
    return os.path.relpath(chemin_final, ROOT)


def main():
    issue_body = os.environ.get('ISSUE_BODY', '')
    issue_number = os.environ.get('ISSUE_NUMBER', '?')
    error_file = os.environ.get('ERROR_FILE')

    try:
        valeurs = parse_issue_body(issue_body)

        for champ in ("Titre du lieu", "Arrondissement / quartier", "Type d'intervention",
                      "Latitude", "Longitude", "Description courte"):
            if not valeur_ou_vide(valeurs, champ):
                fail(f"le champ obligatoire « {champ} » est vide ou introuvable.")

        titre = valeur_ou_vide(valeurs, "Titre du lieu")
        arrondissement = valeur_ou_vide(valeurs, "Arrondissement / quartier")
        type_label = valeur_ou_vide(valeurs, "Type d'intervention")
        type_slug = TYPE_PAR_LABEL.get(type_label)
        if not type_slug:
            fail(f"type d'intervention inconnu : « {type_label} »")

        try:
            lat = float(valeur_ou_vide(valeurs, "Latitude").replace(',', '.'))
            lng = float(valeur_ou_vide(valeurs, "Longitude").replace(',', '.'))
        except ValueError:
            fail("latitude/longitude invalides (doivent être des nombres).")

        description = valeur_ou_vide(valeurs, "Description courte")
        auteur = valeur_ou_vide(valeurs, "Votre nom (affiché publiquement)")
        date_avant = valeur_ou_vide(valeurs, "Date de la photo avant (AAAA-MM)")
        date_apres = valeur_ou_vide(valeurs, "Date de la photo après (AAAA-MM)")

        with open(POINTS_JSON, encoding='utf-8') as f:
            points = json.load(f)

        base_slug = slugify(titre)
        slug = slug_disponible(base_slug, points)

        dossier = os.path.join(POINTS_DIR, slug)
        os.makedirs(dossier, exist_ok=True)

        url_avant = extraire_url_image(
            valeurs.get("Photo avant — glissez l'image ici", ""), "Photo avant"
        )
        url_apres = extraire_url_image(
            valeurs.get("Photo après — glissez l'image ici", ""), "Photo après"
        )

        image_avant = telecharger_image(url_avant, os.path.join(dossier, 'before'))
        image_apres = telecharger_image(url_apres, os.path.join(dossier, 'after'))

        nouveau_point = {
            "id": slug,
            "title": titre,
            "borough": arrondissement,
            "lat": lat,
            "lng": lng,
            "description": description,
            "type": type_slug,
            "before": {"image": image_avant, "date": date_avant},
            "after": {"image": image_apres, "date": date_apres},
        }
        if auteur:
            nouveau_point["author"] = auteur

        points.append(nouveau_point)
        with open(POINTS_JSON, 'w', encoding='utf-8') as f:
            json.dump(points, f, ensure_ascii=False, indent=2)
            f.write('\n')

        import importlib.util
        lqip_spec = importlib.util.spec_from_file_location(
            'generate_lqip', os.path.join(ROOT, 'scripts', 'generate-lqip.py')
        )
        generate_lqip = importlib.util.module_from_spec(lqip_spec)
        lqip_spec.loader.exec_module(generate_lqip)
        generate_lqip.main()

        github_output = os.environ.get('GITHUB_OUTPUT')
        if github_output:
            with open(github_output, 'a') as f:
                f.write(f"slug={slug}\n")
                f.write(f"titre={titre}\n")

        print(f"Lieu « {titre} » intégré sous l'identifiant « {slug} » (issue #{issue_number}).")

    except ErreurIntegration as e:
        message = f"L'intégration automatique a échoué : {e}"
        print(f"ERREUR: {message}", file=sys.stderr)
        if error_file:
            with open(error_file, 'w', encoding='utf-8') as f:
                f.write(message)
        sys.exit(1)


if __name__ == '__main__':
    main()
