# Notes de décision — Avant / Après

Décisions de design qui ne se devinent pas en lisant le code.

## Barre du haut et modale « À propos » (19 novembre 2026)

- **Bouton « i » tout à droite** : il n'est plus collé au titre. C'est le
  dernier élément du bandeau, après le filtre d'arrondissement, à 8 px de lui
  (`.site-header .about-btn { margin-left: -12px; }`, l'écart du bandeau étant
  de 20 px), comme le prévoit `~/Developer/MAP-DESIGN-SYSTEM.md` et comme sur
  les autres sites de Gabriel. Sur téléphone, rien ne change : il était déjà
  en haut à droite.
- **« ♥ Supporter »** à côté de chaque élu dans la modale (`.about-don`),
  plutôt que « Me supporter » de la barre des autres sites, puisque la modale
  présente plusieurs élus. Les lecteurs d'écran entendent « Supporter
  <nom> : faire un don ». Sous 480 px, cœur seul (le texte chevauchait la
  description des élus).
- Pas de bouton de don dans la barre : projet fait en collaboration (voir
  `~/Developer/DESIGN-PAGES.md`, « Bouton Me supporter »).
