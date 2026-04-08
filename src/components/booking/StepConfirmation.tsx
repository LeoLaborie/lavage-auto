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
          <div className="flex justify-between gap-4">
            <span className="text-gray-900 shrink-0">Service:</span>
            <span className="font-medium text-gray-900 text-right break-words min-w-0">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-900 shrink-0">Date:</span>
            <span className="font-medium text-gray-900 text-right">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-900 shrink-0">Heure:</span>
            <span className="font-medium text-gray-900 text-right">{selectedTime}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-900 shrink-0">Adresse:</span>
            <span className="font-medium text-gray-900 text-right break-words min-w-0">{address}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-900 shrink-0">Véhicule:</span>
            <span className="font-medium text-gray-900 text-right break-words min-w-0">{vehicleLabel}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-900 shrink-0">Durée estimée:</span>
            <span className="font-medium text-gray-900 text-right">{durationLabel}</span>
          </div>
          <div className="flex justify-between gap-4 border-t pt-3">
            <span className="text-lg font-semibold text-gray-900">Total:</span>
            <span className="text-2xl font-bold text-blue-600">{displayPrice}€</span>
          </div>
        </div>
      </div>
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Paiement sécurisé :</strong> Votre carte sera enregistrée de manière sécurisée.
          Vous ne serez débité que lorsqu&apos;un laveur acceptera votre mission.
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">
          Le laveur arrivera avec tout le matériel nécessaire.
          Assurez-vous que votre véhicule soit accessible à l&apos;heure convenue.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className={`border-2 border-gray-300 text-gray-900 px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
          >
            Retour
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
              }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement...
              </>
            ) : (
              'Enregistrer ma carte et réserver'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
