# Ajouter un nouveau lieu

## Via une soumission publique (recommandé)

Toute personne disposant d'un compte GitHub peut proposer un lieu sans
avoir à modifier le code :

1. Dans le dépôt GitHub, onglet **Issues → New issue → « Proposer un
   nouveau lieu »**, puis remplir le formulaire (titre, arrondissement,
   type, latitude/longitude, description, photos avant/après déposées dans
   les champs prévus).
2. La soumission est révisée dans l'issue. Au besoin, des précisions
   peuvent être demandées en commentaire, ou une valeur corrigée
   directement dans le texte de l'issue.
3. Une fois la soumission jugée conforme, ajouter le label
   `pret-a-publier` sur l'issue.
4. Le workflow `.github/workflows/integrer-lieu.yml` se déclenche
   alors automatiquement : il télécharge les photos, les compresse, génère
   l'entrée dans `data/points.json`, régénère les miniatures, puis ouvre
   une **pull request** de révision (et commente l'issue avec le lien).
5. Le diff de la PR est ensuite vérifié (position sur la carte, rendu des
   photos, description), puis la PR est fusionnée pour publier le lieu.
   Si l'intégration échoue (champ manquant, image introuvable, etc.), le
   robot explique la cause en commentaire sur l'issue et retire le label ;
   une fois la soumission corrigée, le label peut être remis pour relancer
   l'intégration.

> ⚙️ **Configuration requise une seule fois** : créer le label
> `pret-a-publier` dans le dépôt (Issues → Labels → New label). Le label
> `nouveau-lieu` est créé automatiquement par le gabarit d'issue dès la
> première soumission.

Le gabarit (`.github/ISSUE_TEMPLATE/nouveau-lieu.yml`) et le workflow sont
le détail d'implémentation ; le schéma de `data/points.json` ci-dessous
reste la référence si une correction manuelle est nécessaire.

## Manuellement

1. Créer un dossier dans `data/points/` avec un nom court sans espace
   (ex. `parc-jeanne-mance`).
2. Y déposer deux photos : `before.jpg` (ou `.png`) et `after.jpg`.
3. Ajouter une entrée dans `data/points.json` :

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
  les coordonnées, ou utiliser [OpenStreetMap](https://www.openstreetmap.org)).
- `date` : format `AAAA-MM`, affiché automatiquement en français
  (ex. `2024-09` → « septembre 2024 »).
- Les images peuvent être `.jpg`, `.png`, `.webp` ou `.svg`. Pour un bon
  résultat visuel dans le comparateur, utiliser deux photos prises au même
  angle/cadrage.
- Compresser les photos avant de les déposer : une photo de téléphone
  non compressée peut peser plusieurs dizaines de Mo (surtout en `.png` ou
  en HDR), ce qui ralentit énormément le chargement. Viser des `.jpg` de
  ~1500 px de large maximum et qualité ~80 — largement suffisant à l'écran
  et quelques centaines de Ko au lieu de dizaines de Mo.

4. Relancer `python3 scripts/generate-lqip.py` (nécessite `pip install
   Pillow`) pour régénérer `data/image-lqip.json`, la miniature floutée
   utilisée comme
   placeholder le temps que chaque photo haute résolution charge en
   arrière-plan. Sans cette étape, le nouveau point fonctionne quand même —
   il n'a simplement pas de chargement progressif.

5. Rien à faire pour le lien de partage : une fois le changement poussé sur
   `main`, le workflow `generer-pages.yml` lance
   `scripts/generate-pages.py`, qui crée `lieu/<id>/` (page d'aperçu pour
   les réseaux sociaux + image avant/après) et met à jour `sitemap.xml`.
   Le lien à partager est `https://avant-apres.ca/lieu/<id>/`.

Aucune compilation n'est nécessaire : recharger simplement la page, le point
apparaît sur la carte.


