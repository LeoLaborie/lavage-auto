import { Service, UserCar } from './constants';

interface StepConfirmationProps {
  selectedService: Service | null;
  selectedDate: string;
  selectedTime: string;
  address: string;
  isSubmitting: boolean;
  vehicleLabel: string;
  handleBack: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export default function StepConfirmation({
  selectedService, selectedDate, selectedTime, address, isSubmitting, vehicleLabel, handleBack, handleSubmit
}: StepConfirmationProps) {

  const displayPrice = selectedService 
    ? (selectedService.amountCents ? selectedService.amountCents / 100 : selectedService.price)
    : 0;

  const durationLabel = selectedService
    ? (selectedService.durationLabel || selectedService.duration)
    : '';

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 title-font text-center">Confirmation</h2>
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Récapitulatif</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-900">Service:</span>
            <span className="font-medium text-gray-900">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900">Date:</span>
            <span className="font-medium text-gray-900">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900">Heure:</span>
            <span className="font-medium text-gray-900">{selectedTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900">Adresse:</span>
            <span className="font-medium text-gray-900">{address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900">Véhicule:</span>
            <span className="font-medium text-gray-900">{vehicleLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900">Durée estimée:</span>
            <span className="font-medium text-gray-900">{durationLabel}</span>
          </div>
          <div className="flex justify-between border-t pt-3">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-blue-600">{displayPrice}€</span>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Important:</strong> Le laveur arrivera avec tout le matériel nécessaire.
          Assurez-vous que votre véhicule soit accessible à l&apos;heure convenue.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className={`border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-3 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Confirmation en cours...
              </>
            ) : (
              'Confirmer la réservation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
