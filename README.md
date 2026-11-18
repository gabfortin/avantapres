# Avant / Après — Amélioration de l'espace public

Carte interactive des espaces publics transformés et verdis à Montréal : chaque
lieu montre une comparaison photographique « avant / après », avec les dates
des deux prises de vue. Pour montrer concrètement ce que change un
réaménagement, et pour que le public propose ses propres lieux.

**En ligne :** [avant-apres.ca](https://avant-apres.ca)

> Pour ajouter ou modifier un lieu sur la carte, voir
> **[AJOUTER-UN-LIEU.md](AJOUTER-UN-LIEU.md)**.

## Contenu

| Élément | Ce qu'il fait |
|---|---|
| **Carte** | Un marqueur par lieu, coloré selon son type, filtrable par arrondissement |
| **Comparateur avant / après** | Curseur à glisser (souris et toucher) entre les deux photos |
| **Pages de partage** | Une page par lieu (`lieu/<id>/`), avec son propre aperçu pour les réseaux sociaux |
| **Bouton « i »** | Fenêtre « À propos », signature et lien Confidentialité |

Mode sombre selon l'appareil.

## Données

### Sources

| Source | Producteur | Utilisée pour |
|---|---|---|
| `data/points.json` et `data/points/<slug>/` | Gabriel Fortin, Alex Norris et les contributions du public | Lieux, descriptions et photos |
| [OpenFreeMap](https://openfreemap.org), à partir d'[OpenStreetMap](https://www.openstreetmap.org) | Contributeurs d'OpenStreetMap, ODbL ; OpenMapTiles | Fond de carte |

### Mise à jour

**Contributions du public** : toute personne avec un compte GitHub peut
proposer un lieu ou une modification par une issue (gabarits « Proposer un
nouveau lieu » et « Proposer une modification »). Quand la soumission reçoit
le label `pret-a-publier`,
[`.github/workflows/integrer-lieu.yml`](.github/workflows/integrer-lieu.yml)
l'intègre à `data/points.json` et `data/points/` dans une PR. Détail :
[PIPELINE-SOUMISSIONS.md](PIPELINE-SOUMISSIONS.md).

**À la main** : structure des dossiers, champs de `data/points.json`,
compression des photos et miniatures : [AJOUTER-UN-LIEU.md](AJOUTER-UN-LIEU.md).

**Automatique, après chaque changement de lieu** :
[`.github/workflows/generer-pages.yml`](.github/workflows/generer-pages.yml)
régénère les pages de partage `lieu/<id>/` (`scripts/generate-pages.py`) à
chaque push qui touche `data/points.json`, `data/points/` ou ce script.

## Utilisation locale

```bash
python3 -m http.server 8000   # http://localhost:8000
```

Un serveur est nécessaire : la page charge `data/points.json` par requête
réseau (`file://` ne fonctionne pas).

## Architecture

| Fichier | Rôle |
|---|---|
| `index.html` | Page de la carte |
| `confidentialite.html` | Politique de confidentialité (avec mode sombre) |
| `assets/js/app.js` | Carte (API de Leaflet), filtre, comparateur avant/après |
| `assets/vendor/carte/` | Composant de carte commun (modèle `~/Developer/outils/communs/carte/`) : API de Leaflet dessinée par MapLibre, fond OpenFreeMap |
| `assets/css/style.css` | Styles : jetons du `:root`, redéfinis pour le mode sombre |
| `data/points.json` | Liste des lieux |
| `data/points/<slug>/` | Photos « avant » et « après » de chaque lieu |
| `data/image-lqip.json` | Aperçus flous des photos (`scripts/generate-lqip.py`) |
| `lieu/<id>/` | Pages de partage générées par `scripts/generate-pages.py` |
| `scripts/integrate_submission.py` | Intégration d'une issue de soumission |
| `sw.js` | Ancien service worker (cache des tuiles OSM) : efface son cache et se désinstalle ; à supprimer dans quelques mois |
| `.github/ISSUE_TEMPLATE/` | Gabarits des issues de soumission |
| `llms.txt`, `robots.txt`, `sitemap.xml` | Référencement |

**Origine du système de design des cartes** ([MAP-DESIGN-SYSTEM.md](../MAP-DESIGN-SYSTEM.md)) :
textes de marque en `--brand-ink`, étiquettes de catégorie en `--*-ink`
(versions claires en sombre), fonds, marqueurs et boutons en `--*-dark`.

## Publication

GitHub Pages, branche `main`, domaine dans `CNAME` : `avant-apres.ca`,
enregistré chez **Namecheap** (apex en `ALIAS`/`ANAME` ou les quatre adresses
`A` de GitHub Pages, `www` en `CNAME`). (Ce site n'a pas encore le numéro de
version x.y.z des autres sites.)

Si le domaine change : mettre à jour `og:image`, `og:url`, `twitter:image`,
`canonical` et le JSON-LD de `index.html`, ainsi que `sitemap.xml`,
`robots.txt` et `llms.txt`.

## Confidentialité

Aucun cookie ni compte.

| Quand | Ce qui est envoyé | À qui |
|---|---|---|
| Chaque visite | Page, site d'origine, appareil, pays | GoatCounter (mesure d'audience anonyme) |
| Chaque visite | Polices Inter et Poppins | Google Fonts |
| Carte | Fond de carte de la zone affichée | OpenFreeMap |
| Proposer un lieu | Le contenu de l'issue | GitHub (compte de la personne) |

Détails : [confidentialite.html](confidentialite.html), à mettre à jour (avec
sa date) si un service externe est ajouté.

## Crédits

- [MapLibre GL JS](https://maplibre.org) (BSD-3-Clause) et le composant de carte commun (API de Leaflet), hébergés dans `assets/vendor/carte/` ; fond [OpenFreeMap](https://openfreemap.org), © [OpenMapTiles](https://www.openmaptiles.org)
- Polices [Inter](https://fonts.google.com/specimen/Inter) et [Poppins](https://fonts.google.com/specimen/Poppins) (SIL OFL 1.1), depuis Google Fonts
- Fond de carte © les contributeurs d'[OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL)

## Auteurs

Développé par [Gabriel Fortin](https://gabfortin.com) et Alex Norris, avec
Projet Montréal.

## Documentation détaillée

| Fichier | Contenu |
|---|---|
| [AJOUTER-UN-LIEU.md](AJOUTER-UN-LIEU.md) | Proposer un lieu par issue, ou l'ajouter à la main |
| [PIPELINE-SOUMISSIONS.md](PIPELINE-SOUMISSIONS.md) | Fonctionnement technique de l'intégration des soumissions |
