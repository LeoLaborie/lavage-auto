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
      <div className="mb-6 md:mb-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/60 md:text-xs">
          Étape 02
        </p>
        <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[34px]">
          Où intervient le laveur&nbsp;?
        </h2>
      </div>

      <div className="mx-auto max-w-xl">
        <label className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2 md:text-xs">
          Adresse complète
        </label>
        <div className={addressError ? 'animate-shake' : ''}>
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
          <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 font-cinsans text-xs text-red-600">
            <span aria-hidden>⚠</span> {addressError}
          </p>
        )}
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/60">
          Numéro · rue · code postal · ville
        </p>
      </div>

      <div className="mt-10 flex flex-col-reverse items-stretch gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-ink bg-transparent px-6 py-3.5 font-cinsans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
        >
          <span aria-hidden>←</span> Retour
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!address}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-7 py-3.5 font-cinsans text-[14px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Continuer <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
