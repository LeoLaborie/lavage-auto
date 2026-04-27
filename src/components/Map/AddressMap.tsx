'use client'

import { useEffect, useRef } from 'react'
import Map, { useMap } from './Map'
import MapMarker from './MapMarker'

type AddressMapProps = {
  address: string
  lat?: number | null
  lng?: number | null
  draggable?: boolean
  height?: number
  onPositionChange?: (coords: { lat: number; lng: number }) => void
}

function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const { map, isLoaded } = useMap()
  const previousRef = useRef<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!isLoaded || !map) return
    const prev = previousRef.current
    if (!prev) {
      map.jumpTo({ center: [lng, lat], zoom: 16 })
    } else if (prev.lat !== lat || prev.lng !== lng) {
      map.flyTo({ center: [lng, lat], zoom: 16, duration: 600 })
    }
    previousRef.current = { lat, lng }
  }, [isLoaded, map, lat, lng])

  return null
}

export default function AddressMap({
  address,
  lat,
  lng,
  draggable = false,
  height = 240,
  onPositionChange,
}: AddressMapProps) {
  if (lat == null || lng == null) {
    return (
      <div
        className="flex w-full items-center justify-center rounded-[10px] border border-rule bg-blue-wash p-4 text-center font-cinsans text-sm text-ink2"
        style={{ height }}
      >
        <div>
          <p>Adresse non géolocalisée.</p>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block font-semibold text-blue underline"
          >
            Voir sur Google Maps ↗
          </a>
        </div>
      </div>
    )
  }

  return (
    <Map height={height} center={[lng, lat]} zoom={16}>
      <MapCenter lat={lat} lng={lng} />
      <MapMarker
        longitude={lng}
        latitude={lat}
        draggable={draggable}
        onDragEnd={onPositionChange}
      />
    </Map>
  )
}
