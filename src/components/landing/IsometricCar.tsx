'use client'
import Image from 'next/image'

type Props = {
  progress: number
  dirty: number
}

export default function IsometricCar({ progress, dirty }: Props) {
  const lift = -progress * 12
  return (
    <div className="relative w-full max-w-[580px] aspect-[580/400] mx-auto flex items-center justify-center">
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
        style={{
          bottom: '7.5%',
          width: '65%',
          height: '12%',
          background: 'radial-gradient(ellipse, rgba(10,28,92,0.35), transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <div
        className="relative w-full h-full transition-transform duration-100 ease-linear"
        style={{ transform: `translateY(${lift}px)` }}
      >
        <Image
          src="/images/car-blue-dirty.png"
          alt="Voiture sale"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 580px"
          className="object-contain transition-opacity duration-200 ease-linear"
          style={{
            opacity: dirty,
            filter: 'drop-shadow(0 24px 36px rgba(10,28,92,0.22))',
          }}
        />
        <Image
          src="/images/car-blue-clean.png"
          alt="Voiture propre"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 580px"
          className="object-contain transition-opacity duration-200 ease-linear"
          style={{
            opacity: 1 - dirty,
            filter: 'drop-shadow(0 30px 40px rgba(10,28,92,0.28))',
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute rounded-full bg-white transition-opacity duration-200"
        style={{
          top: '22%',
          left: '32%',
          width: 6,
          height: 6,
          boxShadow: '0 0 16px 4px rgba(255,255,255,0.9)',
          opacity: (1 - dirty) * 0.9,
        }}
      />
      <div
        className="pointer-events-none absolute rounded-full bg-white transition-opacity duration-200"
        style={{
          top: '38%',
          right: '28%',
          width: 4,
          height: 4,
          boxShadow: '0 0 12px 3px rgba(255,255,255,0.9)',
          opacity: (1 - dirty) * 0.8,
        }}
      />
    </div>
  )
}
