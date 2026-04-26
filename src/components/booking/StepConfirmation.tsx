import { Service } from './constants';

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

  const rows: { label: string; value: string }[] = [
    { label: 'Service', value: selectedService?.name ?? '—' },
    { label: 'Date', value: selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR') : '—' },
    { label: 'Heure', value: selectedTime || '—' },
    { label: 'Adresse', value: address || '—' },
    { label: 'Véhicule', value: vehicleLabel || '—' },
    { label: 'Durée estimée', value: durationLabel || '—' },
  ];

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 md:mb-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/60 md:text-xs">
          Étape 05
        </p>
        <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[34px]">
          Récapitulatif.
        </h2>
      </div>

      <div className="rounded-[16px] border border-rule bg-white">
        <dl className="divide-y divide-rule">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-wrap items-baseline justify-between gap-4 px-5 py-3.5 md:px-6">
              <dt className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70 md:text-xs">
                {row.label}
              </dt>
              <dd className="min-w-0 break-words text-right font-cinsans text-sm font-medium text-ink md:text-[15px]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-5 flex items-end justify-between rounded-[16px] bg-ink px-5 py-5 text-white shadow-cin-feature md:px-7 md:py-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/60 md:text-xs">
          Total
        </span>
        <span className="font-display text-[40px] font-extrabold leading-none tracking-[-0.04em] md:text-[56px]">
          {displayPrice}
          <span className="text-[24px] md:text-[32px]">€</span>
        </span>
      </div>

      <div className="mt-5 rounded-[12px] bg-blue-wash px-4 py-3.5 md:px-5">
        <p className="font-cinsans text-[13px] leading-relaxed text-ink md:text-sm">
          <span className="font-semibold text-blue">Paiement sécurisé.</span> Votre carte est enregistrée sans débit. Vous serez prélevé uniquement à l&apos;acceptation de la mission par un laveur.
        </p>
      </div>

      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/60 md:text-xs">
        Annulation gratuite jusqu&apos;à 24h avant · Sans engagement
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mt-8 flex flex-col-reverse items-stretch gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-ink bg-transparent px-6 py-3.5 font-cinsans text-[14px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden>←</span> Retour
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-7 py-3.5 font-cinsans text-[14px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                Enregistrer ma carte <span aria-hidden>→</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
