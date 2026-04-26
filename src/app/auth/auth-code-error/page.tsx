import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <main className="min-h-screen bg-white px-5 py-20 md:px-12 md:py-32">
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.2em] text-ink2/70">
          Authentification
        </p>
        <h1 className="mt-6 font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-[44px] text-ink md:text-[64px]">
          Lien expiré.
          <br />
          <span className="italic">Réessayons.</span>
        </h1>
        <p className="mt-6 text-[16px] leading-relaxed text-ink2 md:text-[18px]">
          Un problème est survenu lors de la connexion avec Google. Le lien a
          peut-être expiré ou déjà été utilisé.
        </p>
        <Link
          href="/login"
          className="mt-10 inline-block rounded-xl bg-ink px-8 py-4 font-display text-[15px] font-bold tracking-[-0.01em] text-white shadow-cin-button transition-transform hover:-translate-y-0.5 md:px-10 md:py-[18px] md:text-[16px]"
        >
          Retour à la connexion →
        </Link>
      </div>
    </main>
  )
}
