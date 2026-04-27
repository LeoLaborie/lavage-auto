type MapSkeletonProps = {
  height?: number
}

export default function MapSkeleton({ height = 240 }: MapSkeletonProps) {
  return (
    <div
      className="w-full animate-pulse rounded-[10px] border border-rule bg-blue-wash"
      style={{ height }}
      aria-hidden="true"
    />
  )
}
