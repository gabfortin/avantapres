# Avant / Après — Amélioration de l'espace public

Site statique présentant une carte interactive des espaces publics transformés
et verdis à Montréal. Chaque point sur la carte affiche une comparaison
photo « avant / après » avec les dates des deux prises de vue.

Aucun serveur, aucune étape de build : c'est du HTML/CSS/JS pur, prêt pour
GitHub Pages.

## Structure du projet

```
index.html                  page unique de l'application
assets/css/style.css         styles
assets/js/app.js             logique (carte Leaflet, filtre, slider avant/après)
data/points.json             liste des lieux affichés sur la carte
data/points/<slug>/          photos "avant" et "après" de chaque lieu
```

## Ajouter un nouveau lieu

1. Crée un dossier dans `data/points/` avec un nom court sans espace
   (ex. `parc-jeanne-mance`).
2. Dépose-y deux photos : `before.jpg` (ou `.png`) et `after.jpg`.
3. Ajoute une entrée dans `data/points.json` :

```json
{
  "id": "parc-jeanne-mance",
  "title": "Parc Jeanne-Mance",
  "borough": "Le Plateau-Mont-Royal",
  "lat": 45.5142,
  "lng": -73.5904,
  "description": "Description courte du projet de verdissement.",
  "author": "Prénom Nom",
  "type": "vegetalisation",
  "before": { "image": "data/points/parc-jeanne-mance/before.jpg", "date": "2018-06" },
  "after":  { "image": "data/points/parc-jeanne-mance/after.jpg",  "date": "2024-09" }
}
```

- `author` : le nom de la personne qui a pris/soumis la comparaison. Affiché
  dans le popup de la carte et dans le panneau de détail. Ce champ est
  optionnel — s'il est absent, la ligne ne s'affiche simplement pas.
- `type` : détermine la couleur et l'icône du point sur la carte. Valeurs
  possibles :
  - `vegetalisation` (feuille verte) — valeur par défaut si le champ est
    absent, pas besoin de l'ajouter aux points existants.
  - `agrandissement-parc` (arbre vert) — agrandissement d'un parc existant.
  - `place-ecole` (chapeau mauve) — cour d'école transformée en place
    publique.
  - `panneau-publicitaire` (panneau gris) — retrait d'un panneau
    publicitaire.
  - `espace-pieton` (silhouette bleue) — création d'un espace piéton.
  - `apaisement-de-circulation` (chevrons orange) — mesures d'apaisement
    de la circulation (dos d'âne, rétrécissement de chaussée, etc.).

- `lat` / `lng` : coordonnées GPS du lieu (clic droit sur Google Maps → copier
  les coordonnées, ou utilise [OpenStreetMap](https://www.openstreetmap.org)).
- `date` : format `AAAA-MM`, affiché automatiquement en français
  (ex. `2024-09` → « septembre 2024 »).
- Les images peuvent être `.jpg`, `.png`, `.webp` ou `.svg`. Pour un bon
  résultat visuel dans le comparateur, utilise deux photos prises au même
  angle/cadrage.
- Compresse tes photos avant de les déposer : une photo de téléphone
  non compressée peut peser plusieurs dizaines de Mo (surtout en `.png` ou
  en HDR), ce qui ralentit énormément le chargement. Vise des `.jpg` de
  ~1500 px de large maximum et qualité ~80 — largement suffisant à l'écran
  et quelques centaines de Ko au lieu de dizaines de Mo.
4. Relance `python3 scripts/generate-lqip.py` (nécessite macOS) pour
   régénérer `data/image-lqip.json`, la miniature floutée utilisée comme
   placeholder le temps que chaque photo haute résolution charge en
   arrière-plan. Sans cette étape, le nouveau point fonctionne quand même —
   il n'a simplement pas de chargement progressif.

Aucune compilation n'est nécessaire : recharge simplement la page, le point
apparaît sur la carte.

> Les 4 lieux fournis par défaut (`rue-wellington-verdun`,
> `ruelle-verte-rosemont`, `place-publique-plateau`, `parc-villeray`) sont des
> **exemples fictifs** avec des illustrations générées, à remplacer par de
> vrais projets et de vraies photos.

## Développement local

Comme le site charge `data/points.json` via `fetch`, il faut le servir via
un petit serveur local (ouvrir `index.html` directement avec `file://` ne
fonctionnera pas à cause des restrictions CORS des navigateurs) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement sur GitHub Pages

1. Pousse ce dépôt sur GitHub.
2. Dans le dépôt : **Settings → Pages**.
3. Sous « Build and deployment », choisis **Deploy from a branch**.
4. Sélectionne la branche `main` et le dossier `/ (root)`.
5. Sauvegarde. Le site sera disponible après quelques minutes à l'adresse
   `https://<utilisateur>.github.io/<nom-du-dépôt>/`.

Aucune action GitHub (workflow) n'est nécessaire — le site est 100 % statique.

> Les balises `og:image` / `og:url` / `twitter:image` / `canonical` dans
> `index.html` pointent vers le domaine personnalisé `https://avant-apres.ca/`
> (voir le fichier `CNAME`). Si ce domaine change un jour, mets à jour ces
> URLs ainsi que `sitemap.xml`, `robots.txt`, `llms.txt` et le JSON-LD du
> `<head>` pour que l'aperçu de partage et l'attribution restent corrects.
>
> Le domaine `avant-apres.ca` doit aussi être configuré chez le registraire
> (GoDaddy) pour pointer vers GitHub Pages : un enregistrement `ALIAS`/`ANAME`
> (ou les 4 IP `A` de GitHub Pages) sur l'apex, et idéalement un `CNAME` sur
> `www` vers `<utilisateur>.github.io`. Voir la
> [doc GitHub sur les domaines personnalisés](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Technologies

- [Leaflet](https://leafletjs.com/) + fonds de carte [OpenStreetMap](https://www.openstreetmap.org/)
  (filtre CSS pour un rendu plus sobre) pour la carte interactive (chargés via CDN,
  aucune clé API requise).
- Vanilla JavaScript pour le comparateur avant/après (glisser-déposer souris
  et tactile).
- Polices [Inter](https://fonts.google.com/specimen/Inter) et
  [Poppins](https://fonts.google.com/specimen/Poppins) via Google Fonts.

## Auteur

Créé et maintenu par [Gabriel Fortin](https://gabfortin.com), en collaboration
avec Projet Montréal.
