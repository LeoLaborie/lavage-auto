# Carte d'adresses — Design

**Date :** 2026-04-27
**Statut :** Approuvé, prêt pour le plan d'implémentation
**Périmètre :** Visualisation cartographique des adresses de service pour les rôles CLIENT (booking) et LAVEUR (dashboard).

## Objectif

Permettre au client de visualiser et préciser l'adresse saisie pendant le booking via une carte interactive avec marqueur draggable, et au laveur de visualiser l'adresse de chaque mission depuis son dashboard. La position exacte (lat/lng) est persistée sur le `Booking` afin que le laveur reçoive la même position que celle confirmée par le client.

## Décisions de cadrage

| # | Question | Décision |
|---|----------|----------|
| 1 | Périmètre | Client (booking wizard) + Laveur (dashboard) — composant réutilisé |
| 2 | Interaction client | Marqueur draggable, coords stockées sur Booking, label texte intact |
| 3 | UX laveur | Bouton « Voir sur la carte » par mission → accordion inline |
| 4 | Stack | MapLibre GL + Carto Positron, adapté Cinétique (sans `next-themes`/shadcn) |
| 5 | Bookings existants | Lazy backfill côté serveur via BAN (1ʳᵉ visualisation persiste les coords) |
| 6 | Apparition de la carte côté client | Après sélection d'une suggestion (pas avant) |

## Architecture

### Modules à créer

```
src/components/Map/
├── Map.tsx          # Wrapper MapLibre minimal + contexte React (useMap)
├── MapMarker.tsx    # Marqueur (draggable optionnel) + portal pour custom content
└── AddressMap.tsx   # Composant haut niveau métier consommé par les call-sites
```

- `Map.tsx` : adaptation du composant fourni, simplifié — light theme fixe (Carto Positron `https://basemaps.cartocdn.com/gl/positron-gl-style/style.json`), pas de `next-themes`, pas de gestion dark, pas de contrôles fullscreen/locate/compass (non utiles pour notre usage). Style aligné `docs/DESIGN.md` (tokens Cinétique : `border-rule`, `shadow-cin-card`, `font-cinsans`).
- `MapMarker.tsx` : portal vers un élément DOM créé pour le marqueur ; props `{ longitude, latitude, draggable, onDragEnd }`. Marqueur visuel = pin SVG bleu Cinétique inline (pas de `lucide-react`).
- `AddressMap.tsx` : API publique consommée par les call-sites :
  ```tsx
  type AddressMapProps = {
    address: string;
    lat?: number;
    lng?: number;
    draggable?: boolean;        // défaut: false
    height?: number;            // défaut: 240
    onPositionChange?: (coords: { lat: number; lng: number }) => void;
    className?: string;
  };
  ```
  Centre la carte sur `(lat, lng)` à zoom 16. Si lat/lng manquent → état « non géolocalisée » (carte non rendue, message + lien Google Maps).

### Dépendances

- **Ajout :** `maplibre-gl` (~700 KB gzippé). Lazy-load systématique via `next/dynamic`.
- **Pas d'ajout :** ni `next-themes`, ni `lucide-react`, ni `clsx`/`cn`. Le projet utilise SVG inline et concaténation manuelle de classes.

### Lazy loading

Tous les call-sites importent `AddressMap` ainsi :

```tsx
const AddressMap = dynamic(() => import('@/components/Map/AddressMap'), {
  ssr: false,
  loading: () => <MapSkeleton height={240} />,
});
```

`MapSkeleton` est un placeholder léger (rectangle `bg-blue-wash` avec animation pulse, même hauteur que la carte) pour éviter le layout shift.

## Flux client (booking wizard)

### Modifications de `AddressAutocomplete`

Signature étendue (rétro-compatible) :

```ts
interface Props {
  onAddressSelect: (address: string, coords?: { lat: number; lng: number }) => void;
  value?: string;
}
```

À la sélection d'une suggestion BAN, on extrait `feature.geometry.coordinates` (`[lng, lat]`) et on les remonte. Les call-sites existants qui ignorent le 2ᵉ argument ne sont pas cassés.

### Modifications de `StepAddress`

Nouveau state local `coords: { lat: number; lng: number } | null`. Rendu :

```
┌─────────────────────────────────────┐
│ [AddressAutocomplete input]         │
└─────────────────────────────────────┘
   ↓ (si coords définies)
┌─────────────────────────────────────┐
│ [AddressMap height=240 draggable]   │
└─────────────────────────────────────┘
   « Glissez le repère si la position
     n'est pas exacte »
```

`onPositionChange` du `AddressMap` met à jour `coords` (drag du marqueur). Quand l'utilisateur tape une nouvelle adresse, `coords` est reset à null jusqu'à la prochaine sélection.

### Modifications de `BookingWizard`

- Nouveaux champs dans le state : `serviceLat: number | null`, `serviceLng: number | null`.
- Persistés dans `localStorage` avec le reste du wizard (clé versionnée existante via `STORAGE_VERSION`). **Bumper `STORAGE_VERSION`** pour invalider les sessions en cours qui n'auraient pas ces champs.
- Passés à `StepAddress` en `coords` controlled, et inclus dans le payload de `POST /api/booking/submit`.

### Modifications de `POST /api/booking/submit`

Validation Zod (ou équivalent existant) étendue :

```ts
serviceLat: z.number().min(-90).max(90).optional(),
serviceLng: z.number().min(-180).max(180).optional(),
```

Persistés à la création du `Booking` :

```ts
prisma.booking.create({
  data: {
    // ... existants
    serviceLat: payload.serviceLat ?? null,
    serviceLng: payload.serviceLng ?? null,
  },
});
```

Aucune migration Prisma : `serviceLat`/`serviceLng` existent déjà (`Float?`).

## Flux laveur (dashboard)

### Modifications de `WasherDashboardView`

Pour chaque mission card (onglets « Missions disponibles » et « Missions acceptées »), ajout :

- Bouton **« Voir sur la carte »** (style outline Cinétique : `border border-rule px-3 py-2 rounded-lg font-cinsans text-sm hover:bg-blue-wash`).
- Au clic, accordion inline sous la card avec `<AddressMap height={220} draggable={false} />`. Pas de modal (évite focus trap, fluide en scroll).
- État ouvert local par carte (`expandedMapId`), une seule carte ouverte à la fois (les autres se ferment automatiquement) pour limiter les instances MapLibre simultanées.
- Si `serviceLat`/`serviceLng` null après le backfill (cas extrême : adresse non trouvée par BAN), le bouton est remplacé par :
  ```tsx
  <a href={`https://maps.google.com/?q=${encodeURIComponent(serviceAddress)}`}
     target="_blank" rel="noopener noreferrer">Voir sur Google Maps ↗</a>
  ```

### Modifications des endpoints washer

Endpoints concernés :

- `GET /api/washer/missions/available`
- `GET /api/washer/missions/accepted`

Logique ajoutée après le `prisma.booking.findMany` :

```ts
const bookings = await prisma.booking.findMany({...});
const needsBackfill = bookings.filter(b => b.serviceLat == null || b.serviceLng == null);

if (needsBackfill.length > 0) {
  const backfilled = await Promise.all(
    needsBackfill.map(async (b) => {
      const coords = await geocodeAddress(b.serviceAddress);
      if (coords) {
        await prisma.booking.update({
          where: { id: b.id },
          data: { serviceLat: coords.lat, serviceLng: coords.lng },
        });
        return { ...b, serviceLat: coords.lat, serviceLng: coords.lng };
      }
      return b;
    })
  );
  // merger backfilled dans bookings...
}
```

Géocodage en parallèle pour limiter la latence ajoutée. BAN n'a pas de quota strict (service public), pas de gestion d'erreur fancy : si BAN renvoie une erreur, on continue avec coords null et l'UI tombera sur le fallback Google Maps.

### Module partagé `lib/geocoding.ts`

```ts
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length < 3) return null;
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature?.geometry?.coordinates) return null;
    const [lng, lat] = feature.geometry.coordinates;
    return { lat, lng };
  } catch {
    return null;
  }
}
```

Timeout 3 s pour ne pas pénaliser l'UX si BAN est lent. Renvoie `null` silencieusement en cas d'échec — appelants gèrent.

## Schema de données

**Aucune modification Prisma.** Les champs nécessaires existent déjà sur `Booking` :

```prisma
serviceLat  Float?  @map("service_lat")
serviceLng  Float?  @map("service_lng")
```

## Tests

### Playwright (existants à étendre + nouveaux)

- `tests/booking/address-map.spec.ts` (**nouveau**) :
  - Saisie d'une adresse, sélection de la suggestion → la carte est rendue, le marqueur visible.
  - Drag du marqueur → les coords transmises à `POST /api/booking/submit` reflètent la nouvelle position (interception de la requête).
- `tests/api/booking.spec.ts` (**étendre**) : payload submit avec `serviceLat/Lng` → vérifier persistance en DB.
- `tests/api/washer.spec.ts` (**étendre**) : créer un Booking avec `serviceLat/Lng = null`, hit `GET /api/washer/missions/available`, vérifier que la réponse contient des coords non nulles ET que le `Booking` en DB a été mis à jour.

### Pas de test unitaire

Le projet n'utilise pas de framework unitaire (vitest a été retiré). On reste sur Playwright pour la validation end-to-end.

## Hors scope (YAGNI)

- Vue carte globale « toutes les missions » dans un onglet dédié — repoussée à v2.
- Reverse-geocoding au drag du marqueur — décidé non (préserver le label texte saisi par le client).
- Calcul de distance laveur ↔ client, ETA, itinéraire (`MapRoute`) — non demandé.
- Filtrage des missions par rayon sur carte — repoussé à v2.
- Géolocalisation automatique du client à l'arrivée sur StepAddress — non, on reste sur la saisie manuelle.

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Bundle size MapLibre alourdit le booking | `next/dynamic({ ssr: false })`, MapLibre exclu du bundle initial |
| BAN indisponible → backfill en boucle | Pas de retry, échec silencieux, fallback Google Maps côté UI |
| Coords drag écrasent une position correcte | Acceptable : le client a la main, c'est le but du drag |
| Tuiles Carto deviennent payantes | Bascule vers MapTiler (clé API gratuite jusqu'à 100k req/mois) ou tuiles OSM brutes — changement local au composant `Map.tsx` |
| Backfill ralentit l'endpoint washer | Géocodage parallèle ; si > 1 s ressenti, passer à un backfill async (job) ou un script one-shot |

## Plan d'exécution (ordre suggéré)

1. Créer `lib/geocoding.ts` + tests
2. Créer `components/Map/Map.tsx` + `MapMarker.tsx` + `AddressMap.tsx` (avec MapSkeleton)
3. Étendre `AddressAutocomplete` (signature `onAddressSelect`)
4. Modifier `StepAddress` + `BookingWizard` (state, localStorage version bump) + `POST /api/booking/submit`
5. Ajouter le bouton « Voir sur la carte » + accordion dans `WasherDashboardView`
6. Implémenter le lazy backfill dans les endpoints washer
7. Tests Playwright (nouveau + extensions)
8. Build + verification manuelle (`npm run build`, `npx playwright test`)
