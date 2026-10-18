# Avant / Après — Amélioration de l'espace public

Site statique présentant une carte interactive des espaces publics transformés
et verdis à Montréal. Chaque point sur la carte affiche une comparaison
photo « avant / après » avec les dates des deux prises de vue.

Aucun serveur, aucune étape de build : c'est du HTML/CSS/JS pur, prêt pour
GitHub Pages.

> 📍 Tu veux ajouter un lieu à la carte ? Tout est expliqué dans
> **[AJOUTER-UN-LIEU.md](AJOUTER-UN-LIEU.md)**.

## Structure du projet

```
index.html                  page unique de l'application
assets/css/style.css         styles
assets/js/app.js             logique (carte Leaflet, filtre, slider avant/après)
data/points.json             liste des lieux affichés sur la carte
data/points/<slug>/          photos "avant" et "après" de chaque lieu
```

## Ajouter un nouveau lieu

Voir **[AJOUTER-UN-LIEU.md](AJOUTER-UN-LIEU.md)** pour la marche à suivre
complète (structure du dossier, champs de `data/points.json`, compression des
photos, régénération des placeholders).

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
