'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import Header from '@/components/Header'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import TimeSelector from '@/components/TimeSelector'

const ReservationPopup = dynamic(() => import('@/components/ReservationPopup'), { ssr: false })

export default function Home() {
  const [showReservation, setShowReservation] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState('')
  const [selectedTime, setSelectedTime] = useState<{ type: 'now' | 'later', time?: string, date?: string } | null>(null)
  const [shakingAddress, setShakingAddress] = useState(false)
  const [shakingTime, setShakingTime] = useState(false)

  const handleAddressSelect = (address: string) => {
    setSelectedAddress(address)
    setShakingAddress(false)
  }

  const handleSearch = () => {
    let canProceed = true;

    if (!selectedAddress || selectedAddress.trim() === '') {
      setShakingAddress(true)
      setTimeout(() => {
        setShakingAddress(false)
      }, 600)
      canProceed = false;
    }

    if (!selectedTime) {
      setShakingTime(true)
      setTimeout(() => {
        setShakingTime(false)
      }, 600)
      canProceed = false;
    }

    if (canProceed) {
      setShowReservation(true)
    }
  }
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Full Screen Hero Section */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/banner.png"
            alt="Clean luxury car"
            className="w-full h-full object-cover object-center"
            width={1920}
            height={1080}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
        </div>

        <div className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 title-font drop-shadow-lg animate-fade-in-up">
            Voiture propre<br className="md:hidden" /> en un click
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl drop-shadow-md font-light">
            Le service de lavage auto à domicile n°1 en France.
          </p>

          <div className="bg-white p-4 rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all hover:scale-[1.01]">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className={`w-full md:w-2/5 ${shakingAddress ? 'shake-animation' : ''}`}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">📍</span>
                  </div>
                  <div className="[&>div>input]:pl-10 [&>div>input]:h-14 [&>div>input]:bg-gray-50 [&>div>input]:border-gray-200 [&>div>input]:rounded-xl">
                    <AddressAutocomplete onAddressSelect={handleAddressSelect} />
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/5">
                <div className={`relative h-14 ${shakingTime ? 'shake-animation' : ''}`}>
                  <TimeSelector
                    onSelect={(type, time, date) => setSelectedTime({ type, time, date })}
                    isShaking={shakingTime}
                  />
                </div>
              </div>

              <button
                onClick={handleSearch}
                className={`w-full md:w-1/5 h-14 bg-accent hover:bg-yellow-400 text-primary rounded-xl text-lg font-bold transition-all shadow-md flex items-center justify-center gap-2 ${!selectedAddress || !selectedTime
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:shadow-lg transform active:scale-95'
                  }`}
              >
                <span>Rechercher</span>
                <span className="text-xl">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 relative z-10">

        <section id="services" className="py-24 bg-white">
          <div className="text-center mb-16">
            <span className="text-accent font-bold tracking-wider uppercase text-sm">Nos Services</span>
            <h2 className="text-4xl font-bold text-primary mt-2 title-font">Formules de Lavage</h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Des solutions adaptées à tous les besoins et tous les budgets.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <a href="/reserver?service=exterior" className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-blue-50 text-primary rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                🧽
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Lavage Extérieur</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Nettoyage complet de la carrosserie, vitres extérieures et jantes avec des produits écologiques.</p>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-2xl font-bold text-primary">dès 25€</p>
                <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-accent group-hover:text-primary transition-colors">→</span>
              </div>
            </a>

            <a href="/reserver?service=complete" className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden ring-2 ring-accent/20">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="absolute top-4 right-4 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Populaire</div>
              <div className="w-16 h-16 bg-yellow-50 text-accent-dark rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm group-hover:bg-accent group-hover:text-primary transition-colors">
                ✨
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Lavage Complet</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Le meilleur des deux mondes : nettoyage intérieur et extérieur pour une voiture comme neuve.</p>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-2xl font-bold text-primary">dès 45€</p>
                <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-accent group-hover:text-primary transition-colors">→</span>
              </div>
            </a>

            <a href="/reserver?service=premium" className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
              <div className="w-16 h-16 bg-cyan-50 text-secondary rounded-2xl flex items-center justify-center mb-6 text-3xl shadow-sm group-hover:bg-secondary group-hover:text-white transition-colors">
                💎
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Lavage Premium</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">Service d'exception avec cire de protection, lustrage et traitement des plastiques et cuirs.</p>
              <div className="flex items-center justify-between mt-auto">
                <p className="text-2xl font-bold text-primary">dès 75€</p>
                <span className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-accent group-hover:text-primary transition-colors">→</span>
              </div>
            </a>
          </div>
        </section>

        <section id="applications" className="py-24 bg-gray-50 rounded-[3rem] my-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
              <div className="order-2 md:order-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl transform -translate-x-10 translate-y-10"></div>
                  <Image
                    src="/images/apps/app-mockup.png"
                    alt="Application Client KLYN"
                    width={600}
                    height={800}
                    className="relative z-10 w-full max-w-md mx-auto drop-shadow-2xl transform hover:scale-[1.02] transition-transform duration-500"
                    style={{ objectFit: 'contain' }}
                  />
                  {/* Fallback if image doesn't exist, we might need to use a generic phone frame or just the store buttons nicely arranged */}
                </div>
              </div>
              <div className="order-1 md:order-2">
                <span className="text-primary font-bold tracking-wider uppercase text-sm">Pour les clients</span>
                <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-6 title-font">L'application KLYN</h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Simplifiez votre routine avec notre application dédiée. Réservez, suivez et payez en toute sécurité, le tout depuis votre poche.
                </p>

                <ul className="space-y-4 mb-10">
                  {[
                    "Réservation ultra-rapide en 3 clics",
                    "Suivi GPS de votre laveur en temps réel",
                    "Paiement sécurisé et factures automatiques",
                    "Historique complet de vos entretiens"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-4">
                  <a href="#" className="transition-transform hover:scale-105 hover:shadow-lg rounded-xl overflow-hidden">
                    <Image src="/images/apps/app-store.png" alt="App Store" width={160} height={50} className="h-12 w-auto" />
                  </a>
                  <a href="#" className="transition-transform hover:scale-105 hover:shadow-lg rounded-xl overflow-hidden">
                    <Image src="/images/apps/play-store.png" alt="Google Play" width={160} height={50} className="h-12 w-auto" />
                  </a>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-secondary font-bold tracking-wider uppercase text-sm">Pour les professionnels</span>
                <h2 className="text-4xl font-bold text-gray-900 mt-2 mb-6 title-font">KLYN OPERATORS</h2>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Rejoignez le réseau KLYN et développez votre activité de lavage auto avec nos outils professionnels.
                </p>

                <ul className="space-y-4 mb-10">
                  {[
                    "Planning intelligent et optimisé",
                    "Navigation GPS intégrée vers les clients",
                    "Gestion simplifiée de vos revenus",
                    "Support dédié 7j/7"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-700">
                      <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-sm">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-4">
                  <a href="#" className="transition-transform hover:scale-105 hover:shadow-lg rounded-xl overflow-hidden">
                    <Image src="/images/apps/app-store.png" alt="App Store" width={160} height={50} className="h-12 w-auto" />
                  </a>
                  <a href="#" className="transition-transform hover:scale-105 hover:shadow-lg rounded-xl overflow-hidden">
                    <Image src="/images/apps/play-store.png" alt="Google Play" width={160} height={50} className="h-12 w-auto" />
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tl from-secondary/20 to-transparent rounded-full blur-3xl transform translate-x-10 translate-y-10"></div>
                {/* Placeholder for Operator App Image */}
                <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 transform rotate-2 hover:rotate-0 transition-all duration-500 max-w-sm mx-auto">
                  <div className="aspect-[9/16] bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-800"></div>
                    <div className="text-white text-center p-6 relative z-10">
                      <div className="w-16 h-16 bg-secondary rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl">🚀</div>
                      <h3 className="font-bold text-xl mb-2">Espace Pro</h3>
                      <p className="text-sm text-gray-400">Gérez vos courses en toute simplicité</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-24 bg-white">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-primary mb-4 title-font">Comment ça marche ?</h2>
            <p className="text-gray-500">Un processus simple et transparent.</p>
          </div>

          <div className="relative grid md:grid-cols-3 gap-12 max-w-6xl mx-auto px-4">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 -z-10"></div>

            <div className="relative text-center group">
              <div className="w-24 h-24 bg-white border-4 border-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg transform transition-all group-hover:scale-110 group-hover:border-primary">
                <span className="text-primary text-3xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Réservez</h3>
              <p className="text-gray-600 leading-relaxed">Indiquez votre localisation et choisissez le créneau qui vous convient le mieux.</p>
            </div>

            <div className="relative text-center group">
              <div className="w-24 h-24 bg-white border-4 border-secondary/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg transform transition-all group-hover:scale-110 group-hover:border-secondary">
                <span className="text-secondary text-3xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Relaxez-vous</h3>
              <p className="text-gray-600 leading-relaxed">Nos laveurs professionnels interviennent directement chez vous ou à votre bureau.</p>
            </div>

            <div className="relative text-center group">
              <div className="w-24 h-24 bg-white border-4 border-accent/10 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg transform transition-all group-hover:scale-110 group-hover:border-accent">
                <span className="text-accent text-3xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Profitez</h3>
              <p className="text-gray-600 leading-relaxed">Retrouvez votre véhicule étincelant sans avoir bougé le petit doigt.</p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-4xl font-bold text-center text-primary mb-16 title-font">Ils nous font confiance</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sophie M.",
                  role: "Cliente fidèle",
                  content: "Un gain de temps incroyable ! Le laveur est arrivé à l'heure et ma voiture n'a jamais été aussi propre. Je recommande vivement.",
                  stars: 5
                },
                {
                  name: "Thomas D.",
                  role: "Professionnel",
                  content: "Service impeccable pour ma flotte de véhicules. La facturation est simple et le résultat toujours au rendez-vous.",
                  stars: 5
                },
                {
                  name: "Marie L.",
                  role: "Maman occupée",
                  content: "Plus besoin de faire la queue à la station de lavage le week-end. KLYN s'occupe de tout pendant que je profite de ma famille.",
                  stars: 5
                }
              ].map((testimonial, i) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                  <div className="flex text-accent mb-4">
                    {[...Array(testimonial.stars)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold text-gray-500">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 text-center">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-[3rem] p-12 md:p-24 text-white relative overflow-hidden shadow-2xl mx-4">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 title-font">Prêt à faire briller votre voiture ?</h2>
              <p className="text-xl mb-10 opacity-90 font-light">Rejoignez des milliers de clients satisfaits et redécouvrez le plaisir de conduire une voiture propre.</p>
              <a href="/reserver" className="bg-white text-primary px-10 py-5 rounded-xl text-xl font-bold hover:bg-gray-50 transition-all transform hover:scale-105 inline-block shadow-xl">
                Réserver maintenant
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            {/* Première colonne - Brand */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-white title-font">KLYN</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                La référence du lavage auto à domicile. Qualité, écologie et satisfaction client sont nos priorités.
              </p>
              <div className="flex gap-4">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                  <Image src="/images/social/linkedin.svg" alt="LinkedIn" width={20} height={20} className="invert" />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-primary transition-colors">
                  <Image src="/images/social/instagram.svg" alt="Instagram" width={20} height={20} className="invert" />
                </a>
              </div>
            </div>

            {/* Deuxième colonne - Services */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Services</h3>
              <ul className="space-y-4">
                <li><a href="/reserver?service=exterior" className="text-gray-400 hover:text-accent transition-colors">Lavage Extérieur</a></li>
                <li><a href="/reserver?service=complete" className="text-gray-400 hover:text-accent transition-colors">Lavage Complet</a></li>
                <li><a href="/reserver?service=premium" className="text-gray-400 hover:text-accent transition-colors">Lavage Premium</a></li>
                <li><a href="/entreprise" className="text-gray-400 hover:text-accent transition-colors">Solutions Entreprises</a></li>
              </ul>
            </div>

            {/* Troisième colonne - Informations */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Informations</h3>
              <ul className="space-y-4">
                <li><a href="/faq" className="text-gray-400 hover:text-accent transition-colors">FAQ</a></li>
                <li><a href="/blog" className="text-gray-400 hover:text-accent transition-colors">Blog</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-accent transition-colors">Contact</a></li>
                <li><a href="/recrutement" className="text-gray-400 hover:text-accent transition-colors">Devenir Laveur</a></li>
              </ul>
            </div>

            {/* Quatrième colonne - Contact */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Nous contacter</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-400">
                  <span className="mt-1">📍</span>
                  <span>123 Avenue des Champs-Élysées<br />75008 Paris</span>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <span>📞</span>
                  <a href="tel:+33123456789" className="hover:text-white transition-colors">+33 1 23 45 67 89</a>
                </li>
                <li className="flex items-center gap-3 text-gray-400">
                  <span>✉️</span>
                  <a href="mailto:contact@klyn.fr" className="hover:text-white transition-colors">contact@klyn.fr</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">&copy; 2025 KLYN. Tous droits réservés.</p>
            <div className="flex gap-6 text-sm text-gray-500">
              <a href="/privacy" className="hover:text-white transition-colors">Confidentialité</a>
              <a href="/conditions" className="hover:text-white transition-colors">CGV</a>
              <a href="/cookies" className="hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <ReservationPopup
        isOpen={showReservation}
        onClose={() => setShowReservation(false)}
        address={selectedAddress}
        selectedTime={selectedTime}
      />
    </div>
  );
}
