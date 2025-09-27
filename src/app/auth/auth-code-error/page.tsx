export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <span className="text-red-600 text-xl">⚠️</span>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Erreur d'authentification
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Un problème est survenu lors de la connexion avec Google.
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour à l'accueil
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}