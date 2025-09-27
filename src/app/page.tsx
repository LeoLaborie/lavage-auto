import Header from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Header />

      {/* Full Screen Hero Section */}
      <section className="relative h-screen text-center overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="/IMG_5460.png" 
            alt="Clean luxury car" 
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-cyan-50/40"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-light text-gray-900 mb-8 leading-tight tracking-tight">
              Lavage automobile<br />
              <span className="text-blue-600 font-medium">haut de gamme à domicile</span>
            </h1>
            <p className="text-2xl md:text-3xl text-gray-700 mb-6 font-medium">
              Fini les files d'attente et les stations de lavage bondées
            </p>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Des professionnels certifiés viennent directement chez vous avec un équipement haut de gamme. 
              Gagnez du temps, préservez votre véhicule et profitez d'un service premium sans vous déplacer.
            </p>
            
            {/* Key Benefits */}
            <div className="grid md:grid-cols-3 gap-6 mb-10 max-w-4xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="text-2xl mb-2">⚡</div>
                <h3 className="font-semibold text-gray-900 mb-1">Rapide & Efficace</h3>
                <p className="text-sm text-gray-600">Service en 30-60 minutes selon la formule choisie</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="text-2xl mb-2">🏆</div>
                <h3 className="font-semibold text-gray-900 mb-1">Qualité Premium</h3>
                <p className="text-sm text-gray-600">Produits écologiques et techniques professionnelles</p>
              </div>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                <div className="text-2xl mb-2">📱</div>
                <h3 className="font-semibold text-gray-900 mb-1">100% Digital</h3>
                <p className="text-sm text-gray-600">Réservation, suivi et paiement entièrement en ligne</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a href="/reserver" className="bg-blue-600 text-white px-10 py-5 rounded-lg text-xl font-semibold hover:bg-blue-700 transition-colors shadow-xl inline-block transform hover:scale-105">
                🚗 Réserver maintenant
              </a>
              <a href="#services" className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-blue-50 transition-colors bg-white/90 backdrop-blur-sm inline-block">
                Découvrir nos services
              </a>
            </div>


          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <section id="services" className="py-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Nos Services</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <a href="/reserver?service=exterior" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer block">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🧽</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lavage Extérieur</h3>
              <p className="text-gray-600 mb-4">Nettoyage complet de l'extérieur de votre véhicule avec des produits de qualité.</p>
              <p className="text-2xl font-bold text-blue-600">À partir de 25€</p>
            </a>
            <a href="/reserver?service=complete" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer block">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lavage Complet</h3>
              <p className="text-gray-600 mb-4">Nettoyage intérieur et extérieur pour une voiture impeccable.</p>
              <p className="text-2xl font-bold text-blue-600">À partir de 45€</p>
            </a>
            <a href="/reserver?service=premium" className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer block">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lavage Premium</h3>
              <p className="text-gray-600 mb-4">Service complet avec cire, lustrage et traitement des plastiques.</p>
              <p className="text-2xl font-bold text-blue-600">À partir de 75€</p>
            </a>
          </div>
        </section>

        <section id="how-it-works" className="py-16 bg-white rounded-2xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Comment ça marche</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Réservez</h3>
              <p className="text-gray-600">Choisissez votre service et votre créneau horaire en quelques clics.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Relaxez-vous</h3>
              <p className="text-gray-600">Un laveur professionnel se rend chez vous avec tout le matériel nécessaire.</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Profitez</h3>
              <p className="text-gray-600">Votre voiture est propre et vous n'avez pas bougé de chez vous.</p>
            </div>
          </div>
        </section>

        <section className="py-16 text-center">
          <div className="bg-blue-600 rounded-2xl p-8 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Prêt à commencer ?</h2>
            <p className="text-xl mb-8 opacity-90">Réservez votre premier lavage en moins de 2 minutes</p>
            <a href="/reserver" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors inline-block">
              Réserver maintenant
            </a>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Lavage Auto. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
