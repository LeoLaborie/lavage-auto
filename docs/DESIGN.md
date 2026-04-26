# Charte graphique — Nealkar

Document de référence pour le design system du site Nealkar (lavage auto à domicile sans eau). La direction artistique de la landing s'appelle **Cinétique** : éditoriale, contrastée, typographique, avec des accents bleus électriques. Les anciens tokens (primary/secondary/accent) restent disponibles pour les dashboards et pages internes.

---

## 1. Identité

- **Nom de marque** : Nealkar
- **Logo** : `public/images/nealkar-logo.png` (1024×339, fond transparent)
  - Variante claire (sur fond sombre) : appliquer `filter: brightness(0) invert(1)` sur l'image
  - Hauteur d'affichage standard : `h-7` (28px) mobile, `h-8` (32px) desktop
- **Tagline** : « Lavage auto à domicile »
- **Punchline** : « Made with 0L of water »
- **Langue** : Français (fr_FR)

---

## 2. Couleurs

### Palette Cinétique (landing actuelle)

| Token Tailwind | Hex | Usage |
|---|---|---|
| `ink` | `#06080d` | Texte principal, fonds sombres, boutons primaires |
| `ink2` | `#1a1f2e` | Texte secondaire sur fond clair |
| `blue` (DEFAULT) | `#1d4ed8` | Accents typographiques, italiques colorées |
| `blue-electric` | `#3b82f6` | CTA secondaires, accents vifs, pills |
| `blue-deep` | `#0a1c5c` | Ombres bleutées (`rgba(10,28,92,*)`) |
| `blue-wash` | `#eaf0fc` | Fonds de section doux, pills informatifs |
| `rule` | `rgba(6,8,13,0.094)` | Bordures fines, séparateurs |

### Palette Legacy (dashboards et pages internes)

| Token | Hex | Usage |
|---|---|---|
| `primary` | `#004aad` | Bleu marque historique |
| `secondary` | `#19c0c6` | Cyan complémentaire |
| `accent` | `#ffcc53` | Jaune accent |
| `primaryLight` | `#004aad20` | Variante 12 % |
| `secondaryLight` | `#19c0c620` | Variante 12 % |
| `accentLight` | `#ffcc5320` | Variante 12 % |

### Variables CSS globales (`:root`)

```css
--background: #f8fafc;
--foreground: #0f172a;
--primary: #004aad;
--secondary: #19c0c6;
--accent: #ffcc53;
--nav-h: 64px;       /* mobile */
/* @media (min-width: 768px) { --nav-h: 70px; } */
```

### Règles d'usage couleur

- **Ne pas mélanger** Cinétique et Legacy sur une même surface — la landing utilise exclusivement Cinétique, les dashboards/admin restent sur Legacy
- Sur fond `ink`, le texte de support est en `text-white/75` ou `text-white/60` (jamais des gris purs)
- Sur fond clair, le texte secondaire est en `text-ink2`, jamais en `text-gray-*`
- Les italiques d'accroche utilisent `text-blue` ou `text-blue-electric` selon le contraste
- Les gradients ne s'appliquent qu'au texte d'accroche (`background-clip: text`) — jamais en aplat

---

## 3. Typographie

### Stack de polices

Toutes les polices Cinétique sont chargées via `next/font/google` dans `src/app/layout.tsx` et exposées par variables CSS.

| Token Tailwind | Variable CSS | Police | Poids dispo | Usage |
|---|---|---|---|---|
| `font-display` | `--font-display` | **Inter Tight** | 500/600/700/800 | Titres, prix, statistiques |
| `font-cinsans` | `--font-cin-sans` | **Inter** | 400/500/600/700 | Boutons, labels CTA, navigation |
| `font-mono` | `--font-mono` | **JetBrains Mono** | 400/500/600 | Pills, eyebrows, éléments techniques |
| `font-intro` | — | **Intro Rust** | normal | Pages legacy uniquement (`title-font`) |

`Outfit` est chargée comme police de body par défaut (cf. `<body className={outfit.className}>` dans `layout.tsx`).

### Hiérarchie typographique Cinétique

| Niveau | Classes type | Exemple |
|---|---|---|
| Hero H1 | `font-display font-extrabold leading-[0.88] tracking-[-0.05em] text-[64px] sm:text-[88px] md:text-[96px] lg:text-[124px]` | « Lavage auto à domicile. » |
| Section H2 | `font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-[44px] md:text-[64px] lg:text-[80px]` | « Trois formules. » |
| CTA H2 (XL) | `font-display font-extrabold leading-[0.9] tracking-[-0.05em] text-[56px] md:text-[100px] lg:text-[140px]` | « Prêt à rouler impeccable ? » |
| Card H3 | `font-display font-bold tracking-[-0.03em] text-[26px] md:text-[34px]` | Nom de service |
| Step H3 (big) | `font-display font-bold leading-[1.05] tracking-[-0.03em] text-[28px] md:text-[44px]` | Étapes 01/04 |
| Step H3 (regular) | `font-display font-bold leading-[1.05] tracking-[-0.03em] text-[22px] md:text-[32px]` | Étapes 02/03 |
| Stat KPI | `font-display font-extrabold leading-none tracking-[-0.03em] text-[26px] md:text-[36px]` | « 0L », « < 24h » |
| Prix | `font-display font-extrabold leading-none tracking-[-0.04em] text-[56px] md:text-[72px]` | Prix card pricing |
| Ticker | `font-display font-bold tracking-[-0.02em] text-[22px] md:text-[32px]` | Bandeau défilant |
| Body principal | `text-[15px] md:text-[17px]` ou `text-base md:text-[19px]` (leading-relaxed) | Paragraphes intro |
| Body card | `text-[13px] md:text-sm` (leading-relaxed) | Description card |
| Eyebrow / Pill | `font-mono text-[11px] font-semibold uppercase tracking-[0.05em] md:text-xs` | « Tarifs », « Comment ça marche » |
| Mention bas-page | `font-mono text-[11px] uppercase tracking-[0.08em] md:text-xs` | « Sans eau · Débit … » |

### Italiques d'accroche

Pattern récurrent : un mot-clé en italique coloré dans le H2.

```tsx
<span className="italic text-blue">Vérifiés.</span>
<span className="italic text-blue-electric">Notés.</span>
```

### Gradient text (CTA finale)

⚠️ **Piège connu** : un glyphe italique qui dépasse (ex : `?`) est clippé par `background-clip: text`. **Toujours** appliquer `display: inline-block` + `padding-right: 0.25em` sur le span.

```tsx
<span
  className="inline-block italic"
  style={{
    background: 'linear-gradient(120deg, #3b82f6, #ffffff)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    paddingRight: '0.25em',
  }}
>
  impeccable&nbsp;?
</span>
```

Gradient hero (variante bleue sur fond clair) : `linear-gradient(120deg, #1d4ed8, #3b82f6)`.

---

## 4. Layout & Espacement

### Largeur conteneur

- `max-w-cin` = **1320px** — conteneur principal de toutes les sections Cinétique
- Padding horizontal : `px-5` (20px) mobile, `md:px-12` (48px) desktop

### Padding vertical des sections

- Section standard : `py-16` (64px) mobile, `md:py-[120px]` desktop
- Section dense (Before/After) : `pb-16 pt-10` mobile, `md:pb-[120px] md:pt-10` desktop

### Hauteur de navigation (sticky)

Variable CSS `--nav-h` :
- Mobile : `64px`
- Desktop (≥ 768px) : `70px`

Toujours référencer cette variable pour les offsets sticky / smooth scroll, jamais coder en dur.

### Grilles types

| Section | Grille |
|---|---|
| Hero | `md:grid-cols-[1.1fr_1fr]` (texte / illustration) |
| Sections texte+image | `md:grid-cols-2` avec `gap-10 md:gap-[60px]` |
| Pricing | `grid-cols-1 md:grid-cols-3 gap-3.5 md:gap-5` |
| HowItWorks | `md:grid-cols-12` avec `col-span-7` / `col-span-5` (alternance asymétrique) |
| Stats | `grid-cols-2 gap-4 md:gap-5` |

### Rayons (border-radius)

| Contexte | Valeur |
|---|---|
| Cards / sections | `rounded-[16px]` mobile, `md:rounded-[24px]` desktop |
| Cards pricing / steps | `rounded-[20px]` |
| Boutons primaires | `rounded-xl` (12px) ou `rounded-[14px]` |
| Boutons secondaires | `rounded-[10px]` |
| Pills / labels | `rounded-md` (6px) ou `rounded-full` |
| Square emoji | `rounded-[14px]` |

---

## 5. Ombres

Tokens Tailwind dédiés :

| Token | Valeur | Usage |
|---|---|---|
| `shadow-cin-card` | `0 8px 24px rgba(0,0,0,0.05)` | Cards blanches standard |
| `shadow-cin-feature` | `0 20px 60px rgba(10,28,92,0.4)` | Card mise en avant (fond `ink`) |
| `shadow-cin-button` | `0 8px 24px rgba(10,28,92,0.3)` | CTA primaire hero |

Ombres inline contextuelles :
- Photo laveur : `0 30px 80px rgba(10,28,92,0.5)`
- Bloc Before/After : `0 30px 80px rgba(10,28,92,0.15)`
- Logo header (sticky) : `0 4px 14px rgba(10,28,92,0.3)`

---

## 6. Composants — patterns récurrents

### Eyebrow / pill de section

```tsx
<div className="mb-5 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
  Comment ça marche
</div>
```

Variantes :
- Sur fond clair : `bg-blue-wash text-blue`
- Sur fond sombre : `text-blue-electric` + `style={{ background: 'rgba(255,255,255,0.08)' }}`
- Sur fond pricing : `bg-white text-blue`

### Bouton primaire (CTA principale)

```tsx
<Link
  href="/reserver"
  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-6 py-4 font-cinsans text-[15px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 md:px-7 md:py-[18px]"
>
  Réserver maintenant
  <span className="rounded-md bg-blue-electric px-1.5 py-0.5 text-[11px] font-semibold text-white">
    2 min
  </span>
</Link>
```

### Bouton secondaire (outline)

```tsx
<a className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-ink bg-transparent px-6 py-4 font-cinsans text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white md:px-[26px] md:py-[18px]">
  Voir le procédé →
</a>
```

### Card pricing

- **Standard** : `bg-white text-ink shadow-cin-card`
- **Mise en avant** : `bg-ink text-white shadow-cin-feature md:-translate-y-3` + badge `POPULAIRE` absolu en haut à droite
- Padding : `p-7 md:p-9`
- Header avec carré emoji `h-12 w-12 md:h-14 md:w-14 rounded-[14px]`

### Stats / KPI

- KPI : `font-display text-[26px] md:text-[36px] font-extrabold leading-none tracking-[-0.03em]`
- Label : `font-mono text-[11px] tracking-[0.05em] text-white/60 md:text-xs` (ou `text-ink2`)
- Séparateur : `border-t pt-3 md:pt-3.5` avec `borderColor: 'rgba(255,255,255,0.13)'`

---

## 7. Animations

Définies dans `tailwind.config.js` :

| Classe | Durée | Usage |
|---|---|---|
| `animate-cin-spin` | 4s linear infinite | Voiture isométrique (rotation décor) |
| `animate-cin-pulse` | 2s ease-in-out infinite | Élément pulsant (alpha 0.5 → 1) |
| `animate-cin-ticker` | 30s linear infinite | Bandeau défilant (translateX 0 → -50 %) |
| `animate-cin-ticker-fast` | 25s linear infinite | Variante rapide |

### Hover micro-interactions

- Boutons : `transition-transform hover:-translate-y-0.5`
- Liens nav : `transition-colors hover:text-blue`
- Liens footer : `opacity-85 transition-opacity hover:opacity-100`

### Scroll-driven (hero)

- Hook : `useScrollProgress(ref)` (`src/lib/hooks/useScrollProgress.ts`)
- Wrapper hero : `md:h-[200vh]` + intérieur `md:sticky md:top-[var(--nav-h)]`
- La voiture `IsometricCar` reçoit `progress` (0 → 1) et `dirty` (1 - progress\*3 borné)

### Smooth scroll (ancres)

Pattern unifié, à utiliser dans tous les composants qui ciblent `#how`, `#pricing`, etc.

```tsx
const handleSmoothScroll = (e, href) => {
  e.preventDefault()
  const target = document.querySelector(href)
  if (!target) return
  const navH = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '0',
    10,
  )
  const top = target.getBoundingClientRect().top + window.scrollY - navH
  window.scrollTo({ top, behavior: 'smooth' })
}
```

---

## 8. Imagerie

### Assets clés

| Fichier | Dimensions | Usage |
|---|---|---|
| `public/images/nealkar-logo.png` | 1024×339 | Logo (header + footer) |
| `public/images/before-after.png` | 880×572 | Comparaison avant/après (recadré 7 % par côté) |
| `public/images/before-after.original.png` | 1024×572 | Source non recadrée |
| `public/images/laveur-paris.png` | — | Portrait laveur (section LaveursCinetique) |
| `public/images/car-blue-clean.png` | — | Voiture isométrique propre |
| `public/images/car-blue-dirty.png` | — | Voiture isométrique sale |

### Règles

- Toujours utiliser `next/image` avec `width`/`height` explicites pour éviter le CLS
- Sur image sombre, ajouter un overlay/badge avec `backdrop-blur-md` + `rgba(255,255,255,0.82)`
- Les badges « Avant » / « Après » sont en `font-mono text-[10px] uppercase tracking-[0.08em]`
- Pas de PNG décoratifs : préférer emojis natifs (🧽 ✨ 💎) ou SVG vectoriels

---

## 9. Décor & textures

### Grid pattern (hero)

```tsx
backgroundImage:
  'linear-gradient(rgba(6,8,13,0.03) 1px, transparent 1px), ' +
  'linear-gradient(90deg, rgba(6,8,13,0.03) 1px, transparent 1px)',
backgroundSize: '48px 48px',
maskImage: 'radial-gradient(ellipse at center, #000 30%, transparent 80%)',
```

### Glow / halo

```tsx
background: 'radial-gradient(circle, rgba(59,130,246,0.13), transparent 60%)',
filter: 'blur(20px)',
```

### Background gradient hero

```tsx
background: 'radial-gradient(ellipse at 70% 30%, #eaf0fc 0%, #ffffff 50%)',
```

### Background CTA

```tsx
background: 'radial-gradient(circle at 80% 30%, rgba(29,78,216,0.4), transparent 50%)',
```

---

## 10. Sections de la landing (architecture)

Ordre canonique dans `src/app/page.tsx` :

1. **NavCinetique** — Sticky header (`bg-#ffffffea` + `backdrop-blur-[10px]`)
2. **HeroCinetique** — H1 + voiture isométrique scroll-driven, fond radial clair
3. **TickerCinetique** — Bandeau défilant `bg-ink text-white`
4. **HowItWorksCinetique** — 4 cards alternées (dark / blue / light / dark)
5. **BeforeAfterCinetique** — Image 880×572 avec badges Avant/Après
6. **LaveursCinetique** — Portrait + KPI sur fond `bg-ink`
7. **PricingCinetique** — 3 cards sur fond `bg-blue-wash`, card centrale = featured
8. **CtaCinetique** — H2 XL gradient sur fond `bg-ink`
9. **FooterCinetique** — Logo blanc + 3 colonnes de liens, fond `bg-ink`

---

## 11. Voix éditoriale

- **Ton** : éditorial, confiant, direct. Pas de superlatifs, pas de jargon marketing.
- **Pattern récurrent** : phrases nominales courtes en H2, ponctuées (« Sélectionnés. Vérifiés. Notés. », « Trois formules. Aucun engagement. »)
- **Engagements visibles** : « 0L d'eau », « < 24h », « Sans engagement », « Annulation gratuite jusqu'à 24h avant », « Débit à l'acceptation du laveur »
- **Symboles techniques** : `◆` (séparateur ticker), `→` (call-to-action), `✓` (features)
- **Mentions légales / techniques** : toujours en `font-mono uppercase tracking-[0.08em]` à 11/12px
- **Pas de hardcoded metrics** non vérifiables (notes moyennes, nombre de laveurs, etc.) — n'afficher que des engagements vérifiables (KYC, support, sans eau)

---

## 12. Accessibilité

- `<html lang="fr">` côté layout racine
- Contraste minimum sur `text-white/60` vérifié sur fond `ink` (#06080d)
- Tous les éléments décoratifs : `aria-hidden`
- Logos : `aria-label="Nealkar — accueil"` sur le `<Link>` parent
- Focus visible conservé sur tous les CTA (pas de `outline:none` global)
- Animations courtes (≤ 0.3s pour interactions) — pas de mouvement persistant gênant

---

## 13. Responsive

Breakpoints Tailwind utilisés :
- `sm:` 640px
- `md:` 768px (breakpoint principal mobile/desktop)
- `lg:` 1024px (typographie XL uniquement)

Mobile-first : toutes les classes sans préfixe ciblent mobile, `md:` introduit la version desktop.
