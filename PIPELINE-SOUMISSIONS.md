# Pipeline de soumission des lieux — doc technique

Documentation de référence pour quiconque maintient ou modifie le pipeline
qui transforme une issue GitHub en entrée dans `data/points.json`. Pour le
mode d'emploi côté utilisateur (comment proposer ou modifier un lieu), voir
**[AJOUTER-UN-LIEU.md](AJOUTER-UN-LIEU.md)**.

## Vue d'ensemble

```
Issue GitHub (gabarit)
  → label `pret-a-publier` ajouté (déclencheur)
    → .github/workflows/integrer-lieu.yml
      → scripts/integrate_submission.py
        → modifie data/points.json (+ data/points/, data/image-lqip.json)
      → peter-evans/create-pull-request ouvre une PR
      → commente l'issue avec le lien de la PR
    → révision humaine de la PR → merge → publication
```

Deux gabarits alimentent le même pipeline :

- `.github/ISSUE_TEMPLATE/nouveau-lieu.yml` — **« Proposer un nouveau lieu »**
- `.github/ISSUE_TEMPLATE/modifier-lieu.yml` — **« Proposer une modification »**

## Détection du type de soumission

Il n'y a pas de branchement au niveau du workflow : un seul script
(`scripts/integrate_submission.py`) gère les deux gabarits. Il distingue
une modification d'une création en vérifiant la présence du champ
**« Lien du lieu à modifier »** dans le corps de l'issue (`main()` →
`valeur_ou_vide(valeurs, "Lien du lieu à modifier")`). Si présent → 
`modifier_lieu()` ; sinon → `creer_nouveau_lieu()`.

⚠️ Ce routage ne dépend volontairement **pas** d'un label. Voir « GitHub
n'auto-crée pas les labels d'un gabarit » plus bas pour la raison.

## `scripts/integrate_submission.py` — structure

- `parse_issue_body(body)` — découpe le markdown d'une issue-form en
  `{libellé du champ: valeur}` à partir des titres `### `.
- `extraire_url_image(texte, nom_champ)` — trouve l'URL d'une image
  déposée dans un champ, que GitHub l'ait rendue en markdown
  (`![alt](url)`, glisser-déposer) ou en HTML (`<img src="url">`, certains
  collages d'images redimensionnables).
- `extraire_types_coches(texte, requis=True)` — lit les cases cochées du
  champ « Type(s) d'intervention » et les traduit en slugs internes
  (`TYPE_PAR_LABEL`). `requis=False` pour le gabarit de modification, où
  rien de coché signifie « ne pas changer les types ».
- `extraire_id_lieu(texte)` — reconnaît l'identifiant d'un lieu à partir
  du lien « Partager » (`/lieu/<id>/`), du lien interne (`?lieu=<id>`), ou
  d'un identifiant brut.
- `telecharger_image(...)` / `remplacer_image(...)` — téléchargent,
  compressent (≤1500px, JPEG qualité 82) et écrivent la photo ; en cas de
  remplacement, l'ancien fichier est supprimé si son extension diffère
  (ex. `before.png` → `before.jpg`).
- `creer_nouveau_lieu(valeurs, issue_number)` / `modifier_lieu(valeurs,
  issue_number)` — logique propre à chaque gabarit. Chacune retourne un
  dict de sorties destinées à la PR (`pr_branch`, `pr_title`,
  `pr_commit_message`, `pr_body`, `resume`).
- `ecrire_github_output(...)` — écrit ces sorties dans `$GITHUB_OUTPUT`,
  avec le format multi-ligne requis pour `pr_body`.

Le titre/branche/corps de la PR sont calculés **en Python**, pas dans le
YAML du workflow — plus simple à tester et à faire évoluer que des
expressions ternaires GitHub Actions.

## `.github/workflows/integrer-lieu.yml` — étapes

1. Déclenché sur `issues: labeled`, filtré sur
   `github.event.label.name == 'pret-a-publier'`.
2. `python3 scripts/integrate_submission.py` — fait tout le travail,
   écrit un message d'erreur lisible dans `ERROR_FILE` s'il échoue.
3. `peter-evans/create-pull-request` — ouvre la PR à partir des sorties
   Python.
4. Commente l'issue avec le lien de la PR (succès), ou poste l'erreur et
   retire le label `pret-a-publier` (échec, pour permettre de corriger et
   relancer en remettant le label).

## Configuration requise (une seule fois par dépôt)

- **Label `pret-a-publier`** créé manuellement (Issues → Labels). C'est le
  seul label dont le workflow dépend.
- **Settings → Actions → General → Workflow permissions** : « Allow
  GitHub Actions to create and approve pull requests » doit être coché,
  sinon la création de PR échoue avec *"GitHub Actions is not permitted
  to create or approve pull requests."* Si le dépôt appartient à une
  organisation GitHub, ce réglage peut être verrouillé au niveau de
  l'organisation (`github.com/organizations/<org>/settings/actions`) — il
  faut alors les droits de propriétaire de l'org pour le changer.

## Pièges rencontrés pendant le développement

- **GitHub n'auto-crée pas les labels déclarés dans un gabarit d'issue.**
  `labels: ["nouveau-lieu"]` dans le YAML ne crée le label que s'il existe
  déjà dans le dépôt — sinon l'issue est créée sans aucun label. Le
  workflow s'appuyait initialement là-dessus pour router entre les deux
  gabarits ; ça a cassé la toute première soumission réelle. D'où le choix
  de router par contenu du corps de l'issue plutôt que par label (voir
  plus haut), et de ne garder qu'un seul label strictement nécessaire
  (`pret-a-publier`).
- **Les serveurs de tuiles d'OpenStreetMap bloquent sans préavis.** Sans
  rapport direct avec ce pipeline, mais découvert dans le même
  contexte : `tile.openstreetmap.org` applique sa politique d'usage
  (bénévole, pas prévue pour un trafic de production) en renvoyant un
  placeholder « Access blocked » avec un code **200** — donc invisible
  dans un simple contrôle de statut HTTP. Si la carte semble à nouveau
  cassée, vérifier le contenu réel d'une tuile, pas juste son code
  retour. CARTO (`basemaps.cartocdn.com`) a été envisagé comme
  alternative mais exige désormais une clé API (même symptôme : 200 avec
  un visuel « API key required »).
