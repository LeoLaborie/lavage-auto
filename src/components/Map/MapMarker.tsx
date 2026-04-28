'use client'

import MapLibreGL from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMap } from './Map'

type MapMarkerProps = {
  longitude: number
  latitude: number
  draggable?: boolean
  onDragEnd?: (coords: { lat: number; lng: number }) => void
}

export default function MapMarker({
  longitude,
  latitude,
  draggable = false,
  onDragEnd,
}: MapMarkerProps) {
  const { map, isLoaded } = useMap()
  const markerRef = useRef<MapLibreGL.Marker | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Create marker once when map is ready.
  useEffect(() => {
    if (!isLoaded || !map) return

    const el = document.createElement('div')
    elementRef.current = el

    const marker = new MapLibreGL.Marker({ element: el, draggable })
      .setLngLat([longitude, latitude])
      .addTo(map)

    markerRef.current = marker
    setIsReady(true)

    const handleDragEnd = () => {
      const ll = marker.getLngLat()
      onDragEnd?.({ lat: ll.lat, lng: ll.lng })
    }
    marker.on('dragend', handleDragEnd)

    return () => {
      marker.off('dragend', handleDragEnd)
      marker.remove()
      markerRef.current = null
      elementRef.current = null
      setIsReady(false)
    }
    // Recreate when map identity changes; coord/draggable updates handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map])

  // Sync position when props change.
  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude])
  }, [longitude, latitude])

  // Sync draggable when prop changes.
  useEffect(() => {
    markerRef.current?.setDraggable(draggable)
  }, [draggable])

  if (!isReady || !elementRef.current) return null

  return createPortal(
    <div
      className="relative -translate-x-1/2 -translate-y-full cursor-pointer text-blue"
      aria-label="Position de l'adresse"
    >
      <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
        <path
          d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z"
          fill="currentColor"
        />
        <circle cx="16" cy="16" r="6" fill="white" />
      </svg>
    </div>,
    elementRef.current
  )
}
