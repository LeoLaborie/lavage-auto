'use client'
import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/Header'

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
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      setError('Erreur lors de la connexion Google. Veuillez réessayer.')
      setGoogleLoading(false)
    }
    // Don't reset loading — browser will navigate away on success
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
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
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

        // Check if user has a DB profile
        const roleRes = await fetch('/api/auth/role')
        if (roleRes.ok) {
          const roleData = await roleRes.json()
          if (roleData.success) {
            router.push(redirectTo)
            return
          }
        }

        // No profile yet → onboarding
        router.push('/onboarding')
      }
    } catch {
      setError('Une erreur inattendue est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004aad]/5 to-[#004aad]/10">
      <Header currentPage="login" />

      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#004aad]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👋</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenue sur Klyn
            </h1>
            <p className="text-gray-600">
              {mode === 'login'
                ? 'Connectez-vous pour accéder à votre espace'
                : 'Créez votre compte en quelques secondes'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Email + Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent outline-none transition-all text-gray-900"
                disabled={loading || googleLoading}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-transparent outline-none transition-all text-gray-900"
                disabled={loading || googleLoading}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              {mode === 'signup' && (
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-[#004aad] text-white rounded-lg font-medium hover:bg-[#003c8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? 'Chargement...'
                : mode === 'login'
                  ? 'Se connecter'
                  : 'Créer mon compte'}
            </button>
          </form>

          {/* Toggle login/signup */}
          <div className="text-center text-sm text-gray-600 mb-6">
            {mode === 'login' ? (
              <p>
                Pas encore de compte ?{' '}
                <button
                  onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                  className="text-[#004aad] font-medium hover:underline"
                >
                  Créer un compte
                </button>
              </p>
            ) : (
              <p>
                Déjà un compte ?{' '}
                <button
                  onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  className="text-[#004aad] font-medium hover:underline"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <span>Redirection vers Google...</span>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuer avec Google
              </>
            )}
          </button>

          {/* Benefits section */}
          <div className="mt-6">
            <div className="bg-[#004aad]/5 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-[#004aad] mb-2">Pourquoi se connecter ?</h3>
              <ul className="text-sm text-[#004aad]/90 space-y-1">
                <li>• Suivre vos réservations en temps réel</li>
                <li>• Historique de vos lavages</li>
                <li>• Réserver plus rapidement</li>
                <li>• Recevoir des notifications</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-[#004aad] hover:text-blue-700 transition-colors">
            ← Retour à l&apos;accueil
          </a>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} Klyn. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}