'use client'

import MapLibreGL, { type MapOptions } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const POSITRON_STYLE =
  'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

type MapContextValue = {
  map: MapLibreGL.Map | null
  isLoaded: boolean
}

const MapContext = createContext<MapContextValue | null>(null)

export function useMap() {
  const ctx = useContext(MapContext)
  if (!ctx) throw new Error('useMap must be used within <Map>')
  return ctx
}

type MapProps = {
  children?: ReactNode
  height?: number
} & Omit<MapOptions, 'container' | 'style'>

export default function Map({ children, height = 240, ...props }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreGL.Map | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || !containerRef.current) return

    const instance = new MapLibreGL.Map({
      container: containerRef.current,
      style: POSITRON_STYLE,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      ...props,
    })

    const onLoad = () => setIsLoaded(true)
    instance.on('load', onLoad)
    mapRef.current = instance

    return () => {
      instance.off('load', onLoad)
      instance.remove()
      mapRef.current = null
      setIsLoaded(false)
    }
    // We intentionally only depend on isMounted: re-creating the map on prop
    // changes would be expensive. Callers should remount the component if they
    // need a different style/center.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted])

  return (
    <MapContext.Provider
      value={{ map: mapRef.current, isLoaded: isMounted && isLoaded }}
    >
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-[10px] border border-rule shadow-cin-card"
        style={{ height }}
      >
        {isMounted && children}
      </div>
    </MapContext.Provider>
  )
}
