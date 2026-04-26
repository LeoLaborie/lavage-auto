'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Wordmark from '@/components/landing/Wordmark'

export default function Login() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const supabase = useMemo(() => createClient(), [])

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError('Erreur lors de la connexion Google. Veuillez réessayer.')
      setGoogleLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (!email || !password) {
        setError('Veuillez remplir tous les champs.')
        return
      }

      if (mode === 'signup') {
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères.')
          return
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          if (error.message.includes('already registered')) {
            setError('Cet email est déjà utilisé. Essayez de vous connecter.')
          } else if (error.message.includes('valid email')) {
            setError('Veuillez entrer une adresse email valide.')
          } else {
            setError(error.message)
          }
          return
        }

        setSuccess('Vérifiez votre boîte mail pour confirmer votre inscription.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setError('Email ou mot de passe incorrect.')
          } else if (error.message.includes('Email not confirmed')) {
            setError('Veuillez confirmer votre email avant de vous connecter.')
          } else {
            setError(error.message)
          }
          return
        }

        const roleRes = await fetch('/api/auth/role')
        if (roleRes.ok) {
          const roleData = await roleRes.json()
          if (roleData.success) {
            router.push(redirectTo)
            return
          }
        }

        router.push('/onboarding')
      }
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setLoading(false)
    }
  }

  const isBusy = loading || googleLoading

  return (
    <div
      className="min-h-screen bg-white font-cinsans text-ink antialiased"
      style={{
        background:
          'radial-gradient(ellipse at 50% -10%, #eaf0fc 0%, #ffffff 55%)',
      }}
    >
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-cin items-center justify-between px-5 md:h-20 md:px-12">
          <Link href="/" className="shrink-0">
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink2/70 transition-colors hover:text-ink"
          >
            ← Accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-14 md:py-20">
        <div className="text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink2/70">
            {mode === 'login' ? 'Connexion' : 'Inscription'}
          </p>
          <h1 className="mt-5 font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-ink text-[40px] md:text-[52px]">
            Bienvenue sur Nealkar
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-ink2 md:text-[17px]">
            {mode === 'login'
              ? 'Connectez-vous pour accéder à votre espace'
              : 'Créez votre compte en quelques secondes'}
          </p>
        </div>

        <div className="mt-10 rounded-2xl border border-rule bg-white p-6 shadow-cin-card md:p-8">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-xl border border-blue-wash bg-blue-wash px-4 py-3">
              <p className="text-sm text-blue-deep">{success}</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full rounded-xl border border-rule bg-white px-4 py-3 font-cinsans text-[15px] text-ink placeholder:text-ink2/50 outline-none transition-all focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
                disabled={isBusy}
                autoComplete="email"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink2"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-rule bg-white px-4 py-3 font-cinsans text-[15px] text-ink placeholder:text-ink2/50 outline-none transition-all focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
                disabled={isBusy}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'signup' && (
                <p className="mt-2 font-mono text-[11px] text-ink2/70">
                  Minimum 6 caractères
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={isBusy}
              className="w-full rounded-xl bg-ink px-6 py-4 font-cinsans text-[15px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading
                ? 'Chargement...'
                : mode === 'login'
                  ? 'Se connecter'
                  : 'Créer mon compte'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink2">
            {mode === 'login' ? (
              <>
                Pas encore de compte ?{' '}
                <button
                  onClick={() => {
                    setMode('signup')
                    setError('')
                    setSuccess('')
                  }}
                  className="font-semibold text-blue underline-offset-4 hover:underline"
                >
                  Créer un compte
                </button>
              </>
            ) : (
              <>
                Déjà un compte ?{' '}
                <button
                  onClick={() => {
                    setMode('login')
                    setError('')
                    setSuccess('')
                  }}
                  className="font-semibold text-blue underline-offset-4 hover:underline"
                >
                  Se connecter
                </button>
              </>
            )}
          </p>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-rule" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 font-mono text-[11px] uppercase tracking-[0.2em] text-ink2/70">
                ou
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isBusy}
            className="flex w-full items-center justify-center rounded-xl border-[1.5px] border-ink bg-white px-6 py-4 font-cinsans text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:text-ink"
          >
            {googleLoading ? (
              <span>Redirection vers Google...</span>
            ) : (
              <>
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuer avec Google
              </>
            )}
          </button>
        </div>

        <div className="mt-8 rounded-2xl border border-rule bg-blue-wash/60 p-5 md:p-6">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-deep">
            Pourquoi se connecter ?
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-ink2">
            <li>· Suivre vos réservations en temps réel</li>
            <li>· Historique de vos lavages</li>
            <li>· Réserver plus rapidement</li>
            <li>· Recevoir des notifications</li>
          </ul>
        </div>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto max-w-cin px-5 py-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-ink2/70 md:px-12">
          © {new Date().getFullYear()} Nealkar — Tous droits réservés
        </div>
      </footer>
    </div>
  )
}
