# Guide de contribution

## Avant de commencer

- Ouvrir une issue avant de commencer une PR significative — pour aligner sur la direction avant d'investir du temps
- Vérifier que le problème ou la feature n'est pas déjà en cours dans les [issues ouvertes](../../issues)
- Pour les bugs mineurs (typos, styles), une PR directe est acceptable sans issue préalable

## Mise en place locale

```bash
git clone https://github.com/aboudou-cto-bloko/vitrinai.git
cd vitrinai
pnpm install
cp .env.example .env.local   # remplir les variables requises
pnpm convex:dev              # terminal 1
pnpm dev                     # terminal 2
```

Variables requises dans `.env.local` :

| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_CONVEX_URL` | Dashboard Convex |
| `CONVEX_DEPLOY_KEY` | Dashboard Convex |
| `PAGESPEED_API_KEY` | Google Cloud Console |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` en local |

## Workflow

```
main          ← production (déployé automatiquement sur Vercel)
feat/xxx      ← nouvelles fonctionnalités
fix/xxx       ← corrections de bugs
chore/xxx     ← maintenance, dépendances, config
```

1. Créer une branche depuis `main` : `git checkout -b feat/nom-feature`
2. Développer, committer avec des messages clairs (voir convention ci-dessous)
3. Vérifier que le build passe : `pnpm tsc --noEmit && pnpm build`
4. Ouvrir une Pull Request vers `main`

## Convention de commits

Format : `type(scope): description courte`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `chore` | Maintenance, dépendances |
| `style` | CSS, animations (sans impact logique) |
| `refactor` | Réécriture sans changement de comportement |
| `docs` | Documentation uniquement |

Exemples :
```
feat(audit): ajouter détection Telegram dans presence.ts
fix(rapport): corriger le score AOF quand TTFB est null
style(landing): hover lift sur les cartes FeaturesSection
docs: mettre à jour le README avec la stack complète
```

## Ce qui est hors scope

- Changer le système de scoring sans discussion préalable en issue
- Ajouter des dépendances lourdes sans justification (vérifier l'alternative légère d'abord)
- Modifier le schéma Convex sans migration des données existantes
- Committer des clés API ou variables d'environnement

## Standards de code

- **TypeScript strict** — pas de `any` sauf dans les `catch` ou les payloads Convex génériques
- **Pas de commentaires qui décrivent le "quoi"** — uniquement le "pourquoi" quand c'est non-évident
- **Animations** — utiliser `motion/react`, préférer `whileInView` pour le contenu hors-fold, `whileHover` pour les micro-interactions
- **Couleurs** — utiliser les tokens Tailwind du projet (`text-savane`, `text-pierre`, `bg-parchemin`…), jamais de valeurs hex inline dans le JSX sauf pour les couleurs dynamiques calculées
- **Icons** — `@phosphor-icons/react` uniquement, toujours `aria-hidden="true"` sur les icônes décoratives

## Convex

Lire `convex/_generated/ai/guidelines.md` avant toute modification du backend. Les règles Convex du projet surchargent les comportements par défaut.

## CI

La CI vérifie automatiquement à chaque PR :
- Type checking (`pnpm tsc --noEmit`)
- Lint (`pnpm lint`)
- Build (`pnpm build`)

Une PR ne peut pas être mergée si la CI échoue.
