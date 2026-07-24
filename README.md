# Avant / Après — Montréal qui verdit

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
  "before": { "image": "data/points/parc-jeanne-mance/before.jpg", "date": "2018-06" },
  "after":  { "image": "data/points/parc-jeanne-mance/after.jpg",  "date": "2024-09" }
}
```

- `author` : le nom de la personne qui a pris/soumis la comparaison. Affiché
  dans le popup de la carte et dans le panneau de détail. Ce champ est
  optionnel — s'il est absent, la ligne ne s'affiche simplement pas.

- `lat` / `lng` : coordonnées GPS du lieu (clic droit sur Google Maps → copier
  les coordonnées, ou utilise [OpenStreetMap](https://www.openstreetmap.org)).
- `date` : format `AAAA-MM`, affiché automatiquement en français
  (ex. `2024-09` → « septembre 2024 »).
- Les images peuvent être `.jpg`, `.png`, `.webp` ou `.svg`. Pour un bon
  résultat visuel dans le comparateur, utilise deux photos prises au même
  angle/cadrage.

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

## Technologies

- [Leaflet](https://leafletjs.com/) + fonds de carte [CARTO](https://carto.com/basemaps)
  pour la carte interactive (chargés via CDN, aucune clé API requise).
- Vanilla JavaScript pour le comparateur avant/après (glisser-déposer souris
  et tactile).
- Polices [Inter](https://fonts.google.com/specimen/Inter) et
  [Poppins](https://fonts.google.com/specimen/Poppins) via Google Fonts.
