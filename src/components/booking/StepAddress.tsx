import AddressAutocomplete from '@/components/AddressAutocomplete';

interface StepAddressProps {
  address: string;
  setAddress: (address: string) => void;
  addressError: string;
  setAddressError: (error: string) => void;
  handleBack: () => void;
  handleNext: () => void;
}

export default function StepAddress({
  address, setAddress, addressError, setAddressError, handleBack, handleNext
}: StepAddressProps) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 title-font text-center">Où ?</h2>
      <div className="max-w-md mx-auto h-full">
          <div className="bg-gray-50 p-6 rounded-2xl">
            <label className="block text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📍</span> Adresse
            </label>
            <div className={`${addressError ? 'animate-shake' : ''}`}>
              <AddressAutocomplete
                value={address}
                onAddressSelect={(selectedAddress) => {
                  setAddress(selectedAddress);
                  if (addressError) {
                    setAddressError('');
                  }
                }}
              />
            </div>
            {addressError && (
              <p className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded flex items-center gap-1">
                <span>⚠️</span> {addressError}
              </p>
            )}
          </div>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
        >
          <span>←</span> Retour
        </button>
        <button
          onClick={handleNext}
          disabled={!address}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
        >
          Continuer <span className="ml-2">→</span>
        </button>
      </div>
    </div>
  );
}
