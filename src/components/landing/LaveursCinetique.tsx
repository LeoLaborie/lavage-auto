import Image from 'next/image'

const stats = [
  { k: '4.93', l: 'Note moyenne' },
  { k: '187', l: 'Laveurs actifs' },
  { k: 'KYC', l: 'Stripe + SIRET vérifiés' },
  { k: '24/7', l: 'Support client' },
]

export default function LaveursCinetique() {
  return (
    <section className="bg-ink px-5 py-16 text-white md:px-12 md:py-[120px]">
      <div className="mx-auto grid max-w-cin items-center gap-10 md:grid-cols-2 md:gap-[60px]">
        <div
          className="relative aspect-[4/5] overflow-hidden rounded-[16px] md:rounded-[24px]"
          style={{ boxShadow: '0 30px 80px rgba(10,28,92,0.5)' }}
        >
          <Image
            src="/images/laveur-paris.png"
            alt="Laveur Nealkar à Paris"
            fill
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover"
          />
          <div
            className="absolute bottom-3 left-3 rounded-md px-3 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white backdrop-blur-md md:bottom-5 md:left-5 md:text-[11px]"
            style={{ background: 'rgba(0,0,0,0.62)' }}
          >
            Karim · Paris 11ᵉ · ⋆ 4.97
          </div>
        </div>

        <div>
          <div
            className="mb-5 inline-block rounded-md px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue-electric md:text-xs"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            Nos laveurs
          </div>
          <h2 className="m-0 mb-6 font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-[44px] md:text-[60px] lg:text-[72px]">
            Sélectionnés.
            <br />
            <span className="italic text-blue-electric">Vérifiés.</span> Notés.
          </h2>
          <p className="m-0 mb-9 max-w-[520px] text-[14px] leading-relaxed text-white/75 md:text-[17px]">
            Chaque laveur Nealkar est un indépendant vérifié SIRET, formé à
            notre protocole et noté à chaque mission. Sous 4.7 de moyenne, il
            quitte la plateforme.
          </p>
          <div className="grid grid-cols-2 gap-4 md:gap-5">
            {stats.map((s) => (
              <div
                key={s.l}
                className="border-t pt-3 md:pt-3.5"
                style={{ borderColor: 'rgba(255,255,255,0.13)' }}
              >
                <div className="font-display text-[26px] font-extrabold leading-none tracking-[-0.03em] md:text-[36px]">
                  {s.k}
                </div>
                <div className="mt-1.5 font-mono text-[11px] tracking-[0.05em] text-white/60 md:text-xs">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
