# Address Map — Corrections post-review (échappatoire BAN + backfill borné)

**Date** : 2026-04-28
**Contexte** : suit la PR #23 (`feat/address-map`) qui introduit la carte d'adresse dans le wizard et le backfill géocodage des bookings legacy.

## Problèmes adressés

1. **Continuer hard-bloqué sur échec BAN** — `StepAddress.tsx:73` gate `Continuer` sur `hasCoords`. Si BAN ne géocode pas l'adresse (réseau, adresse non indexée, timeout), l'utilisateur est piégé sans escape hatch.
2. **Backfill BAN non borné dans les endpoints washer** — `washer/missions/available` et `accepted` lancent jusqu'à 50/100 appels BAN parallèles dans la même requête HTTP, avec timeout 3s/appel et aucun garde-fou si Prisma/BAN throw.

## Décisions clés

- **Problème #1, option B** : préféré mais pas obligatoire. Le gating `hasCoords` reste pour le succès path, mais un bouton secondaire « Continuer sans carte » apparaît uniquement après un échec BAN explicite.
- **Problème #2, option A** : limite de concurrence à 5 + best-effort dans la requête. Les bookings non géocodés cette fois-ci sortent avec `serviceLat/Lng = null`, retentés au prochain refresh.

## Section 1 — Échappatoire UX dans `StepAddress.tsx`

### Comportement

| État | Bouton primaire | Bouton secondaire |
|------|-----------------|-------------------|
| Adresse vide | disabled | absent |
| `isGeocoding` | disabled | absent |
| `hasCoords` (succès) | enabled | absent |
| `geocodeFailed` (échec après débounce + BAN) | disabled | **visible** : « Continuer sans carte » |

### Détails

- Le bouton secondaire est visuellement plus discret (variante outline / typographie mono / texte plus petit) pour éviter de concurrencer le succès path.
- Hint mis à jour quand `geocodeFailed === true` : « Adresse introuvable. Précisez l'adresse, ou continuez sans carte (le laveur recevra l'adresse seule). »
- Click sur secondaire → appelle `handleNext()` ; les coords restent `null` (le serveur accepte déjà ce cas, voir `submit/route.ts`).
- Pas de mode « brouillon » ou de checkbox : si l'utilisateur retape, `geocodeFailed` redevient `false` automatiquement et le secondaire disparaît.

### Tests

E2E (extension de `tests/e2e/address-map.spec.ts` ou nouveau scénario) :
- Saisir une adresse fictive non géocodable (ex. `"zzzzzzz 9999"`).
- Attendre l'apparition du bouton secondaire (≤ 600ms débounce + ≤ 3s BAN).
- Cliquer secondaire → vérifier passage à l'étape créneau.

## Section 2 — Backfill borné dans les endpoints washer

### Nouveau helper dans `src/lib/geocoding.ts`

```ts
export async function geocodeAddressesLimited<T extends { id: string; serviceAddress: string }>(
  items: T[],
  concurrency = 5
): Promise<Map<string, { lat: number; lng: number }>> {
  const out = new Map<string, { lat: number; lng: number }>()
  let i = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++]
      const coords = await geocodeAddress(item.serviceAddress)
      if (coords) out.set(item.id, coords)
    }
  })
  await Promise.all(workers)
  return out
}
```

Caractéristiques :
- `concurrency = 5` : compromis latence/politesse envers BAN (gratuit mais public).
- `geocodeAddress` retourne déjà `null` sur échec, donc pas besoin de `Promise.allSettled` — un échec individuel laisse simplement le booking sans coords (retenté au prochain refresh).

### Refactor des endpoints washer

Pattern appliqué identiquement dans `available/route.ts` et `accepted/route.ts` :

```ts
const needsBackfill = bookings.filter(b => b.serviceLat == null || b.serviceLng == null)
if (needsBackfill.length > 0) {
  try {
    const coordsMap = await geocodeAddressesLimited(needsBackfill, 5)
    if (coordsMap.size > 0) {
      await Promise.all(
        Array.from(coordsMap, ([id, c]) =>
          prisma.booking.update({ where: { id }, data: { serviceLat: c.lat, serviceLng: c.lng } })
        )
      )
      for (const b of bookings) {
        const c = coordsMap.get(b.id)
        if (c) { b.serviceLat = c.lat; b.serviceLng = c.lng }
      }
    }
  } catch (err) {
    console.error('[missions] Backfill failed, continuing without coords:', err)
  }
}
```

Garde-fou clé : le try/catch local empêche qu'une panne BAN/Prisma fasse échouer toute la réponse — la liste de missions est servie même si le backfill se plante, cohérent avec le principe « la fonctionnalité carte est un add-on, pas un blocker ».

### Tests

Aucun nouveau test backend : le backfill BAN est déjà documenté skipped dans `tests/api/washer.spec.ts` (fixtures BAN externes nécessaires). Le helper pur `geocodeAddressesLimited` est trivial et indirectement couvert par les endpoints.

## Plan d'implémentation (ordre)

1. Ajouter `geocodeAddressesLimited` dans `lib/geocoding.ts` — pure fonction, isolée.
2. Refactorer `washer/missions/available/route.ts` — helper + try/catch.
3. Refactorer `washer/missions/accepted/route.ts` — même pattern.
4. Modifier `StepAddress.tsx` — bouton secondaire conditionnel sur `geocodeFailed`.
5. Ajouter scénario E2E échec BAN.

## Hors scope

- Migration one-shot des coords legacy (l'auto-backfill best-effort suffit).
- Retry exponentiel sur BAN (timeout 3s est suffisant).
- Modifications du composant carte (`AddressMap`, `MapMarker`, `Map`).
- Configurabilité de la concurrence (YAGNI).

## Risques résiduels

- Un booking dont BAN refuse l'adresse de manière persistante restera sans coords. Acceptable : le laveur a toujours l'adresse texte + fallback Google Maps existant.
- Un utilisateur impatient peut cliquer « Continuer sans carte » alors que BAN aurait répondu une seconde plus tard. Acceptable : c'est un choix conscient, et le booking sera backfillé côté laveur.
