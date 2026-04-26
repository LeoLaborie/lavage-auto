import Link from 'next/link'

export default function CtaCinetique() {
  return (
    <section className="relative overflow-hidden bg-ink px-5 py-16 text-white md:px-12 md:py-[120px]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 80% 30%, rgba(29,78,216,0.4), transparent 50%)',
        }}
      />
      <div className="relative mx-auto max-w-cin text-center">
        <h2 className="m-0 font-display font-extrabold leading-[0.9] tracking-[-0.05em] text-[56px] md:text-[100px] lg:text-[140px]">
          Prêt à rouler
          <br />
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
        </h2>
        <p className="mx-auto mt-7 max-w-[560px] text-[15px] opacity-70 md:mt-9 md:text-[19px]">
          Premier créneau dès demain matin. Annulation gratuite jusqu&apos;à
          24h avant.
        </p>
        <Link
          href="/reserver"
          className="mt-8 inline-block w-full rounded-[14px] bg-white px-8 py-4 font-display text-[15px] font-bold tracking-[-0.01em] text-ink transition-transform hover:-translate-y-0.5 md:mt-10 md:w-auto md:px-10 md:py-[22px] md:text-[17px]"
        >
          Réserver mon lavage →
        </Link>
      </div>
    </section>
  )
}
