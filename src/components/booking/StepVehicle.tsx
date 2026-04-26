import { UserCar, BookingFormData } from './constants';
import { User } from '@supabase/supabase-js';
import { validateEmail, validatePhone } from '@/lib/validation';

interface CustomUser extends User {
  user_metadata: {
    full_name?: string;
    [key: string]: any;
  }
}

interface StepVehicleProps {
  customerInfo: BookingFormData;
  setCustomerInfo: (info: BookingFormData) => void;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  user: CustomUser | null | any;
  userCars: UserCar[];
  selectedCarId: string;
  setSelectedCarId: (id: string) => void;
  isNewCar: boolean;
  setIsNewCar: (isNew: boolean) => void;
  handleBack: () => void;
  handleNext: () => void;
}

const inputBase =
  'w-full rounded-[10px] border bg-white px-3.5 py-2.5 font-cinsans text-sm text-ink placeholder-ink2/40 transition-colors focus:outline-none focus:ring-2 focus:ring-blue/30';

const inputClass = (hasError: boolean) =>
  `${inputBase} ${hasError ? 'border-red-500' : 'border-rule focus:border-ink'}`;

const labelClass =
  'mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2';

export default function StepVehicle({
  customerInfo, setCustomerInfo, formErrors, setFormErrors, user,
  userCars, selectedCarId, setSelectedCarId, isNewCar, setIsNewCar, handleBack, handleNext
}: StepVehicleProps) {
  const validateField = (field: string, value: string) => {
    if (!value.trim()) {
      const labels: Record<string, string> = { firstName: 'Le prénom', lastName: 'Le nom', email: "L'email", phone: 'Le téléphone', make: 'La marque', model: 'Le modèle' };
      setFormErrors((prev) => ({ ...prev, [field]: `${labels[field] || 'Ce champ'} est requis` }));
    } else if (field === 'email' && !validateEmail(value)) {
      setFormErrors((prev) => ({ ...prev, email: 'Veuillez entrer un email valide' }));
    } else if (field === 'phone' && !validatePhone(value)) {
      setFormErrors((prev) => ({ ...prev, phone: 'Numéro de téléphone français invalide' }));
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 md:mb-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/60 md:text-xs">
          Étape 04
        </p>
        <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[34px]">
          Vos coordonnées.
        </h2>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink2/70 md:text-xs">
            Identité
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <label className={labelClass}>Prénom*</label>
              <input
                type="text"
                value={customerInfo.firstName}
                onChange={(e) => {
                  setCustomerInfo({ ...customerInfo, firstName: e.target.value });
                  if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: '' }));
                }}
                onBlur={(e) => validateField('firstName', e.target.value)}
                className={inputClass(!!formErrors.firstName)}
                placeholder="Jean"
              />
            </div>
            <div>
              <label className={labelClass}>Nom*</label>
              <input
                type="text"
                value={customerInfo.lastName}
                onChange={(e) => {
                  setCustomerInfo({ ...customerInfo, lastName: e.target.value });
                  if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: '' }));
                }}
                onBlur={(e) => validateField('lastName', e.target.value)}
                className={inputClass(!!formErrors.lastName)}
                placeholder="Dupont"
              />
            </div>
            <div>
              <label className={labelClass}>Email*</label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => {
                  setCustomerInfo({ ...customerInfo, email: e.target.value });
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                }}
                onBlur={(e) => !user && validateField('email', e.target.value)}
                className={`${inputClass(!!formErrors.email)} ${user ? 'opacity-60' : ''}`}
                disabled={!!user}
                placeholder="jean@mail.com"
              />
            </div>
            <div>
              <label className={labelClass}>Téléphone*</label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => {
                  setCustomerInfo({ ...customerInfo, phone: e.target.value });
                  if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
                }}
                onBlur={(e) => validateField('phone', e.target.value)}
                placeholder="06 12…"
                className={inputClass(!!formErrors.phone)}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-rule pt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink2/70 md:text-xs">
              Véhicule
            </h3>
            {userCars.length > 0 && (
              <div className="inline-flex rounded-[10px] border border-rule bg-white p-1">
                <button
                  type="button"
                  onClick={() => setIsNewCar(false)}
                  className={`rounded-[8px] px-3 py-1.5 font-cinsans text-xs font-semibold transition-colors ${
                    !isNewCar ? 'bg-ink text-white' : 'text-ink2 hover:text-ink'
                  }`}
                >
                  Existant
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewCar(true)}
                  className={`rounded-[8px] px-3 py-1.5 font-cinsans text-xs font-semibold transition-colors ${
                    isNewCar ? 'bg-ink text-white' : 'text-ink2 hover:text-ink'
                  }`}
                >
                  Nouveau
                </button>
              </div>
            )}
          </div>

          {!isNewCar && userCars.length > 0 ? (
            <select
              value={selectedCarId}
              onChange={(e) => {
                setSelectedCarId(e.target.value);
                if (formErrors.carSelection) setFormErrors((prev) => ({ ...prev, carSelection: '' }));
              }}
              className={inputClass(!!formErrors.carSelection)}
            >
              <option value="">Choisir un véhicule…</option>
              {userCars.map(car => (
                <option key={car.id} value={car.id}>{car.make} {car.model}{car.plate ? ` · ${car.plate}` : ''}</option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Marque</label>
                <input
                  type="text"
                  value={customerInfo.make || ''}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, make: e.target.value });
                    if (formErrors.make) setFormErrors((prev) => ({ ...prev, make: '' }));
                  }}
                  onBlur={(e) => validateField('make', e.target.value)}
                  placeholder="Renault"
                  className={inputClass(!!formErrors.make)}
                />
              </div>
              <div>
                <label className={labelClass}>Modèle</label>
                <input
                  type="text"
                  value={customerInfo.model || ''}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, model: e.target.value });
                    if (formErrors.model) setFormErrors((prev) => ({ ...prev, model: '' }));
                  }}
                  onBlur={(e) => validateField('model', e.target.value)}
                  placeholder="Clio"
                  className={inputClass(!!formErrors.model)}
                />
              </div>
              <div>
                <label className={labelClass}>Plaque</label>
                <input
                  type="text"
                  value={customerInfo.licensePlate || ''}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, licensePlate: e.target.value.toUpperCase() });
                    if (formErrors.licensePlate) setFormErrors((prev) => ({ ...prev, licensePlate: '' }));
                  }}
                  placeholder="AA-123-AA"
                  className={inputClass(!!formErrors.licensePlate)}
                />
              </div>
            </div>
          )}
          {formErrors.carSelection && (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 font-cinsans text-xs text-red-600">
              <span aria-hidden>⚠</span> {formErrors.carSelection}
            </p>
          )}
        </div>

        <div className="border-t border-rule pt-6">
          <label className={labelClass}>Notes (optionnel)</label>
          <textarea
            value={customerInfo.notes}
            onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
            rows={2}
            placeholder="Code portail, étage, instructions d'accès…"
            className={inputClass(false)}
          />
        </div>
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
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-7 py-3.5 font-cinsans text-[14px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5"
        >
          Continuer <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
