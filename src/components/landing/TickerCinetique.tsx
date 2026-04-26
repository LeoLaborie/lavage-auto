const ITEMS = [
  "0 LITRE D'EAU",
  'LAVEURS CERTIFIÉS',
  'SATISFAIT OU REMBOURSÉ',
]

export default function TickerCinetique() {
  // Doubled list so the -50% translateX loop is seamless
  const loop = Array.from({ length: 2 }).flatMap(() => ITEMS)

  return (
    <section className="overflow-hidden whitespace-nowrap border-y border-rule bg-ink py-4 text-white md:py-5">
      <div className="inline-flex animate-cin-ticker items-center gap-6 font-display text-[22px] font-bold tracking-[-0.02em] md:gap-10 md:text-[32px]">
        {loop.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 md:gap-10">
            <span>{item}</span>
            <span className="text-blue-electric">◆</span>
          </span>
        ))}
        {/* Repeat once more so when first half scrolls -50%, the next half is aligned */}
        {loop.map((item, i) => (
          <span key={`b${i}`} className="inline-flex items-center gap-6 md:gap-10">
            <span>{item}</span>
            <span className="text-blue-electric">◆</span>
          </span>
        ))}
      </div>
    </section>
  )
}
