type Step = {
  span: number
  n: string
  t: string
  d: string
  big?: boolean
}

const steps: Step[] = [
  {
    span: 7,
    n: '01',
    t: 'Vous réservez',
    d: 'Service, adresse, créneau. 60 secondes. Carte enregistrée mais non débitée — Stripe Setup Intent.',
    big: true,
  },
  {
    span: 5,
    n: '02',
    t: 'Un laveur accepte',
    d: "Notification temps réel, acceptation moyenne en 2 min. C'est à ce moment-là que votre carte est débitée — pas avant.",
  },
  {
    span: 5,
    n: '03',
    t: 'Lavage sans eau',
    d: 'Polymère biodégradable, microfibre. Photos avant/après obligatoires.',
  },
  {
    span: 7,
    n: '04',
    t: 'Vous validez le résultat',
    d: "Inspectez les photos avant/après. Si quelque chose cloche, on intervient. Annulation gratuite jusqu'à 24h avant le créneau.",
    big: true,
  },
]

function variant(i: number) {
  if (i === 0 || i === 3) return 'dark'
  if (i === 1) return 'blue'
  return 'light'
}

export default function HowItWorksCinetique() {
  return (
    <section
      id="how"
      className="mx-auto max-w-cin px-5 py-16 md:px-12 md:py-[120px]"
    >
      <div className="mb-10 grid items-end gap-10 md:mb-[60px] md:grid-cols-2 md:gap-[60px]">
        <div>
          <div className="mb-5 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
            Comment ça marche
          </div>
          <h2 className="m-0 font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-[44px] md:text-[64px] lg:text-[76px]">
            Quatre étapes.
            <br />
            <span className="italic text-blue">Zéro friction.</span>
          </h2>
        </div>
        <p className="text-base leading-relaxed text-ink2 md:text-lg">
          On a remplacé l&apos;attente, le déplacement, et la mauvaise surprise
          par 4 étapes simples — votre carte n&apos;est débitée qu&apos;à
          l&apos;acceptation, et l&apos;annulation reste gratuite jusqu&apos;à
          24h avant.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-12 md:gap-4">
        {steps.map((s, i) => {
          const v = variant(i)
          const base =
            'relative overflow-hidden rounded-[20px] flex flex-col justify-between'
          const colorCls =
            v === 'dark'
              ? 'bg-ink text-white'
              : v === 'blue'
                ? 'bg-blue text-white'
                : 'bg-white text-ink border border-rule'
          const padding = s.big ? 'p-8 md:p-9' : 'p-7 md:p-8'
          const minH = s.big ? 'min-h-[200px] md:min-h-[240px]' : 'min-h-[180px] md:min-h-[200px]'
          const colSpan =
            s.span === 7 ? 'md:col-span-7' : 'md:col-span-5'
          const labelColor =
            v === 'dark'
              ? 'text-blue-electric'
              : v === 'blue'
                ? 'text-white/80'
                : 'text-blue'
          const titleSize = s.big
            ? 'text-[28px] md:text-[44px]'
            : 'text-[22px] md:text-[32px]'

          return (
            <div
              key={s.n}
              className={`${base} ${colorCls} ${padding} ${minH} ${colSpan}`}
            >
              <div
                className={`font-mono text-[11px] tracking-[0.1em] md:text-xs ${labelColor}`}
              >
                STEP {s.n}
              </div>
              <div className="mt-6">
                <h3
                  className={`m-0 mb-3 font-display font-bold leading-[1.05] tracking-[-0.03em] ${titleSize}`}
                >
                  {s.t}
                </h3>
                <p className="m-0 max-w-[480px] text-[14px] leading-relaxed opacity-85 md:text-[15px]">
                  {s.d}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
