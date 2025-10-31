'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/Header'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) {
      setError('Erreur lors de la connexion Google')
      console.error('Google login error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        if (isLogin) {
          setSuccess('Connexion réussie! Redirection...')
          // Redirect to dashboard or home
          setTimeout(() => window.location.href = '/', 1500)
        } else {
          setSuccess('Compte créé avec succès! Vous pouvez maintenant vous connecter.')
          setIsLogin(true)
          setFormData({ email: formData.email, password: '', name: '', phone: '', address: '' })
        }
      } else {
        setError(data.error || 'Une erreur est survenue')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#004aad]/5 to-[#004aad]/10">
      <Header currentPage="login" />

      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#004aad]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">{isLogin ? '👋' : '✨'}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isLogin ? 'Bon retour !' : 'Créer un compte'}
            </h1>
            <p className="text-gray-600">
              {isLogin 
                ? 'Connectez-vous pour accéder à votre compte et gérer vos réservations'
                : 'Rejoignez-nous pour réserver vos lavages auto en toute simplicité'
              }
            </p>
          </div>

          {/* Toggle buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                isLogin ? 'bg-white text-[#004aad] shadow-sm' : 'text-gray-600'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                !isLogin ? 'bg-white text-[#004aad] shadow-sm' : 'text-gray-600'
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-[#004aad]"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-[#004aad]"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères</p>
              )}
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-[#004aad]"
                    placeholder="Jean Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-[#004aad]"
                    placeholder="06 12 34 56 78"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse (optionnel)
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#004aad] focus:border-[#004aad]"
                    placeholder="123 Rue de la Paix, Paris"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#004aad] text-white py-3 px-4 rounded-lg hover:bg-[#003c8a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isLogin ? 'Connexion...' : 'Création...') 
                : (isLogin ? 'Se connecter' : 'Créer mon compte')
              }
            </button>
          </form>

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
            className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuer avec Google
          </button>

          {/* Benefits section - only show on login */}
          {isLogin && (
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
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-[#004aad] hover:text-blue-700 transition-colors">
            ← Retour à l&apos;accueil
          </a>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Lavage Auto. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}