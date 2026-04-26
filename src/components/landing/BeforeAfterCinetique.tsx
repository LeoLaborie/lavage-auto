import Image from 'next/image'

export default function BeforeAfterCinetique() {
  return (
    <section className="mx-auto max-w-cin px-5 pb-16 pt-10 md:px-12 md:pb-[120px] md:pt-10">
      <div className="mb-6 grid items-center gap-10 md:mb-8 md:grid-cols-2 md:gap-[60px]">
        <div>
          <div className="mb-5 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
            Avant · Après
          </div>
          <h2 className="m-0 font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-[40px] md:text-[56px] lg:text-[64px]">
            La différence
            <br />
            <span className="italic text-blue">se voit.</span>
          </h2>
        </div>
        <p className="text-[15px] leading-relaxed text-ink2 md:text-[17px]">
          Notre protocole encapsule la saleté dans un polymère biodégradable que
          l&apos;on essuie ensuite à la microfibre. Aucun rinçage, aucune
          micro-rayure. Juste une carrosserie qui reflète le ciel.
        </p>
      </div>

      <div
        className="relative overflow-hidden rounded-[16px] md:rounded-[24px]"
        style={{ boxShadow: '0 30px 80px rgba(10,28,92,0.15)' }}
      >
        <Image
          src="/images/before-after.png"
          alt="Comparaison avant / après lavage Nealkar"
          width={1000}
          height={500}
          className="block h-auto w-full"
          sizes="(max-width: 768px) 100vw, 1320px"
        />
        <div
          className="absolute left-3 top-3 rounded-md px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink backdrop-blur-md md:left-6 md:top-6 md:text-[11px]"
          style={{ background: 'rgba(255,255,255,0.82)' }}
        >
          Avant
        </div>
        <div className="absolute right-3 top-3 rounded-md bg-blue-electric px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-white md:right-6 md:top-6 md:text-[11px]">
          Après · Nealkar
        </div>
      </div>
    </section>
  )
}
