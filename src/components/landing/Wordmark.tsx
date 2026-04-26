'use client'

type WordmarkProps = {
  size?: number
  light?: boolean
  animated?: boolean
}

export default function Wordmark({ size = 22, light = false, animated = false }: WordmarkProps) {
  const textColor = light ? 'text-white' : 'text-ink'
  return (
    <div className={`flex items-center gap-2 ${textColor}`}>
      <div
        className="relative overflow-hidden rounded-[6px] bg-blue"
        style={{ width: size, height: size }}
      >
        <div
          className={`absolute rounded-[4px] ${animated ? 'animate-cin-spin' : ''}`}
          style={{
            inset: 3,
            background: 'conic-gradient(from 0deg, #3b82f6, #ffffff, #3b82f6)',
          }}
        />
        <div className="absolute rounded-[3px] bg-blue" style={{ inset: 6 }} />
      </div>
      <div
        className="font-display font-bold tracking-[-0.04em]"
        style={{ fontSize: size * 1.05 }}
      >
        nealkar
      </div>
    </div>
  )
}
