# Avant / Après — Amélioration de l'espace public

Site statique présentant une carte interactive des espaces publics transformés
et verdis à Montréal. Chaque point de la carte présente une comparaison
photographique « avant / après », avec les dates des deux prises de vue.

Il s'agit d'un site entièrement statique (HTML/CSS/JS), sans serveur ni étape
de compilation, conçu pour être hébergé sur GitHub Pages.

> 📍 Pour ajouter ou modifier un lieu sur la carte, consultez
> **[AJOUTER-UN-LIEU.md](AJOUTER-UN-LIEU.md)**.

## Structure du projet

```
index.html                  page unique de l'application
assets/css/style.css         styles
assets/js/app.js             logique (carte Leaflet, filtre, slider avant/après)
data/points.json             liste des lieux affichés sur la carte
data/points/<slug>/          photos "avant" et "après" de chaque lieu
```

## Ajouter ou modifier un lieu

Toute personne disposant d'un compte GitHub peut proposer un nouveau lieu
ou une modification à un lieu existant (photo, description, type) par
l'entremise d'une issue (gabarits « Proposer un nouveau lieu » et
« Proposer une modification »). Une fois la soumission approuvée (ajout du
label `pret-a-publier`), son intégration dans `data/points.json` et
`data/points/` est automatisée (voir
[.github/workflows/integrer-lieu.yml](.github/workflows/integrer-lieu.yml)
et **[PIPELINE-SOUMISSIONS.md](PIPELINE-SOUMISSIONS.md)** pour le détail
technique de ce pipeline).

La procédure complète — soumission publique ou ajout manuel (structure des
dossiers, champs de `data/points.json`, compression des photos, régénération
des miniatures) — est détaillée dans
**[AJOUTER-UN-LIEU.md](AJOUTER-UN-LIEU.md)**.

## Développement local

Le site charge `data/points.json` par requête `fetch` ; il doit donc être
servi par un serveur local (l'ouverture directe de `index.html` en `file://`
ne fonctionne pas, en raison des restrictions CORS des navigateurs) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Déploiement sur GitHub Pages

1. Poussez ce dépôt sur GitHub.
2. Dans le dépôt : **Settings → Pages**.
3. Sous « Build and deployment », sélectionnez **Deploy from a branch**.
4. Choisissez la branche `main` et le dossier `/ (root)`.
5. Enregistrez. Le site sera accessible après quelques minutes à l'adresse
   `https://<utilisateur>.github.io/<nom-du-dépôt>/`.

Aucun workflow GitHub Actions n'est requis pour le déploiement : le site
demeure entièrement statique. Un workflow distinct automatise par ailleurs
l'intégration des soumissions de lieux (voir la section précédente).

> Les balises `og:image` / `og:url` / `twitter:image` / `canonical` dans
> `index.html` pointent vers le domaine personnalisé `https://avant-apres.ca/`
> (voir le fichier `CNAME`). Si ce domaine devait changer, ces URL devront
> être mises à jour, ainsi que `sitemap.xml`, `robots.txt`, `llms.txt` et le
> JSON-LD du `<head>`, afin que l'aperçu de partage et l'attribution
> demeurent corrects.
>
> Le domaine `avant-apres.ca` doit également être configuré chez le
> registraire (GoDaddy) pour pointer vers GitHub Pages : un enregistrement
> `ALIAS`/`ANAME` (ou les quatre adresses IP `A` de GitHub Pages) sur
> l'apex, et idéalement un enregistrement `CNAME` sur `www` vers
> `<utilisateur>.github.io`. Voir la
> [documentation GitHub sur les domaines personnalisés](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).

## Technologies

- [Leaflet](https://leafletjs.com/) et les fonds de carte
  [OpenStreetMap](https://www.openstreetmap.org/) (filtre CSS pour un rendu
  plus sobre), pour la carte interactive — chargés via CDN, sans clé API
  requise.
- JavaScript natif pour le comparateur avant/après (glisser-déposer à la
  souris et au toucher).
- Polices [Inter](https://fonts.google.com/specimen/Inter) et
  [Poppins](https://fonts.google.com/specimen/Poppins), via Google Fonts.

## Auteur

Créé et maintenu par [Gabriel Fortin](https://gabfortin.com), en
collaboration avec Projet Montréal.
