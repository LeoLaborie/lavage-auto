/**
 * Géocode une adresse via l'API BAN (Base Adresse Nationale).
 * Retourne null si l'adresse est invalide, si BAN ne répond pas,
 * ou si aucune feature n'est trouvée.
 *
 * BAN est gratuit et sans clé. Timeout 3s pour éviter de bloquer les endpoints.
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!address || address.trim().length < 3) return null

  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null

    const data = await res.json()
    const feature = data?.features?.[0]
    const coords = feature?.geometry?.coordinates

    if (!Array.isArray(coords) || coords.length < 2) return null

    const [lng, lat] = coords
    if (typeof lat !== 'number' || typeof lng !== 'number') return null

    return { lat, lng }
  } catch {
    return null
  }
}
