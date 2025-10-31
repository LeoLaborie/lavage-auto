'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const Header = dynamic(() => import('@/components/Header'), { ssr: false })
const AddressAutocomplete = dynamic(() => import('@/components/AddressAutocomplete'), { ssr: false })
const TimeSelector = dynamic(() => import('@/components/TimeSelector'), { ssr: false })
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
      <section className="h-[70vh] overflow-hidden relative">
          <Image 
            src="/banner.png" 
            alt="Clean luxury car" 
            className="w-full h-full object-cover object-center"
            width={1920}
            height={1080}
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="max-w-4xl w-full px-4 mb-8 flex flex-col items-center">
              <h1 className="text-3xl md:text-4xl font-bold text-primary text-center mb-8 title-font">
                Voiture propre en un click
              </h1>
          
              <div className="flex flex-col md:flex-row gap-4 items-center max-w-4xl w-full">
                <div className={`w-full md:w-3/5 ${shakingAddress ? 'shake-animation' : ''}`}>
                  <AddressAutocomplete onAddressSelect={handleAddressSelect} />
                </div>
                
                <div className="w-full md:w-1/5">
                  <TimeSelector 
                    onSelect={(type, time, date) => setSelectedTime({ type, time, date })}
                    isShaking={shakingTime}
                  />
                </div>
              
                <button 
                  onClick={handleSearch}
                  className={`w-full md:w-1/5 bg-accent text-primary px-8 py-4 rounded-lg text-lg font-bold transition-all shadow-md transform hover:scale-105 ${
                    !selectedAddress || !selectedTime 
                      ? 'opacity-70 cursor-not-allowed' 
                      : 'hover:shadow-lg hover:bg-accent'
                  }`}
                >
                  Rechercher
                </button>
                
                 <ReservationPopup
                  isOpen={showReservation}
                  onClose={() => setShowReservation(false)}
                  address={selectedAddress}
                  selectedTime={selectedTime}
                />
              </div>
            </div>
          </div>
        </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 relative z-10">
        
        <section id="services" className="py-16 bg-white rounded-t-[2.5rem] shadow-lg">
          <h2 className="text-3xl font-bold text-center text-primary mb-12 title-font">Nos Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <a href="/reserver?service=exterior" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer block border-2 border-transparent hover:border-secondary/20">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center mb-6 transform transition-transform group-hover:rotate-6">
                <span className="text-2xl">🧽</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lavage Extérieur</h3>
              <p className="text-gray-600 mb-4">Nettoyage complet de l'extérieur de votre véhicule avec des produits de qualité.</p>
              <p className="text-2xl font-bold text-accent">À partir de 25€</p>
            </a>
            <a href="/reserver?service=complete" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer block border-2 border-transparent hover:border-secondary/20">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center mb-6 transform transition-transform group-hover:rotate-6">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lavage Complet</h3>
              <p className="text-gray-600 mb-4">Nettoyage intérieur et extérieur pour une voiture impeccable.</p>
              <p className="text-2xl font-bold text-accent">À partir de 45€</p>
            </a>
            <a href="/reserver?service=premium" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 cursor-pointer block border-2 border-transparent hover:border-secondary/20">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center mb-6 transform transition-transform group-hover:rotate-6">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lavage Premium</h3>
              <p className="text-gray-600 mb-4">Service complet avec cire, lustrage et traitement des plastiques.</p>
              <p className="text-2xl font-bold text-accent">À partir de 75€</p>
            </a>
          </div>
        </section>

        <section id="applications" className="py-16 bg-white rounded-2xl">
          <h2 className="text-3xl font-bold text-center text-primary mb-12 title-font">Applications</h2>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
            <div className="flex flex-col items-start p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-white border-2 border-transparent hover:border-secondary/20 min-h-[200px]">
              <div className="w-full">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-4">
                    <a href="#" className="inline-block flex-shrink-0">
                      <Image
                        src="/images/apps/app-store.png"
                        alt="Télécharger sur l'App Store"
                        width={200}
                        height={60}
                        className="w-[200px] h-[60px] object-contain rounded-xl overflow-hidden"
                      />
                    </a>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-bold text-primary title-font mb-2">KLYN</h3>
                    <p className="text-gray-600">Simplifiez votre routine avec notre application client dédiée :</p>
                    <ul className="text-gray-600 mt-2 list-disc pl-4">
                      <li>Réservation rapide et intuitive</li>
                      <li>Suivi en temps réel de votre laveur</li>
                      <li>Paiement sécurisé intégré</li>
                      <li>Historique de vos services</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start p-8 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-white border-2 border-transparent hover:border-secondary/20 min-h-[200px]">
              <div className="w-full">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-4">
                    <a href="#" className="inline-block flex-shrink-0">
                      <Image
                        src="/images/apps/play-store.png"
                        alt="Télécharger sur Google Play"
                        width={200}
                        height={60}
                        className="w-[200px] h-[60px] object-contain rounded-xl overflow-hidden"
                      />
                    </a>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-2xl font-bold text-primary title-font mb-2">KLYN OPERATORS</h3>
                    <p className="text-gray-600">L'outil essentiel pour nos laveurs professionnels :</p>
                    <ul className="text-gray-600 mt-2 list-disc pl-4">
                      <li>Gestion optimisée des rendez-vous</li>
                      <li>Navigation GPS intégrée</li>
                      <li>Suivi des prestations réalisées</li>
                      <li>Communication directe avec les clients</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 bg-white rounded-2xl">
          <h2 className="text-3xl font-bold text-center text-primary mb-12 title-font">Fonctionnement</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
               <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Réservez</h3>
              <p className="text-gray-600">Choisissez votre service et votre créneau horaire en quelques clics.</p>
            </div>
            <div className="text-center">
               <div className="w-20 h-20 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Relaxez-vous</h3>
              <p className="text-gray-600">Un laveur professionnel se rend chez vous avec tout le matériel nécessaire.</p>
            </div>
            <div className="text-center">
               <div className="w-20 h-20 bg-gradient-to-br from-accent to-primary rounded-full flex items-center justify-center mx-auto mb-6 transform transition-transform hover:scale-110">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Profitez</h3>
              <p className="text-gray-600">Votre voiture est propre et vous n'avez pas bougé de chez vous.</p>
            </div>
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
            <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-4 title-font">Reserve ton lavage ici</h2>
            <p className="text-xl mb-8 opacity-90">En moins de une minute c'est fait !</p>
              <a href="/reserver" className="bg-accent text-primary px-8 py-4 rounded-lg text-lg font-medium hover:bg-accent transition-all transform hover:scale-105 inline-block shadow-lg">
                Réserver maintenant
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Première colonne - Contact */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-accent">Contactez-nous</h3>
              <div className="space-y-2">
                <p className="flex items-center gap-2 hover:text-secondary transition-all group">
                  <span className="bg-secondary/20 p-2 rounded-full group-hover:bg-secondary/30 transition-all">📞</span>
                  <span>+33 1 23 45 67 89</span>
                </p>
                <p className="flex items-center gap-2 hover:text-secondary transition-all group">
                  <span className="bg-secondary/20 p-2 rounded-full group-hover:bg-secondary/30 transition-all">✉️</span>
                  <span>contact@klyn.fr</span>
                </p>
                <p className="flex items-center gap-2 hover:text-secondary transition-all group">
                  <span className="bg-secondary/20 p-2 rounded-full group-hover:bg-secondary/30 transition-all">📍</span>
                  <span>Disponible partout en France</span>
                </p>
              </div>
              <div className="mt-6 bg-secondary/10 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-accent">Support 24/7</h4>
                <p className="text-white/80">Disponible par chat et téléphone</p>
              </div>
            </div>

            {/* Deuxième colonne - Services */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-accent">Services</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/blog" className="hover:text-secondary transition-all flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:w-3 transition-all"></span>
                    <span>Blog</span>
                  </a>
                </li>
                <li>
                  <a href="/entreprise" className="hover:text-secondary transition-all flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:w-3 transition-all"></span>
                    <span>Solutions pour votre entreprise</span>
                  </a>
                </li>
                <li>
                  <a href="/services" className="hover:text-secondary transition-all flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:w-3 transition-all"></span>
                    <span>Lavage auto et moto à domicile</span>
                  </a>
                </li>
                <li>
                  <a href="/premium" className="hover:text-secondary transition-all flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:w-3 transition-all"></span>
                    <span>Services Premium</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Troisième colonne - Légal */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-accent">Informations</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/faq" className="hover:text-secondary transition-all flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:w-3 transition-all"></span>
                    <span>FAQ</span>
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-secondary transition-all flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:w-3 transition-all"></span>
                    <span>Politique de confidentialité</span>
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="hover:text-secondary transition-all flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:w-3 transition-all"></span>
                    <span>Politique des cookies</span>
                  </a>
                </li>
                <li>
                  <a href="/conditions" className="hover:text-secondary transition-all flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50 group-hover:w-3 transition-all"></span>
                    <span>Conditions générales</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Quatrième colonne - Réseaux sociaux */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-accent">Suivez-nous</h3>
              <div className="flex gap-4">
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-secondary/20 p-3 rounded-full hover:bg-secondary/30 transition-all"
                >
                  <Image 
                    src="/images/social/linkedin.svg"
                    alt="LinkedIn"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block bg-secondary/20 p-3 rounded-full hover:bg-secondary/30 transition-all"
                >
                  <Image 
                    src="/images/social/instagram.svg"
                    alt="Instagram"
                    width={24}
                    height={24}
                    className="w-6 h-6"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-secondary/20 text-center">
            <p className="text-white/60">&copy; 2025 KLYN. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
