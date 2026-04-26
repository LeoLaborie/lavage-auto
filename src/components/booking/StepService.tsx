import type { ServiceId } from '@/lib/constants/services';
import { Service, services } from './constants';
import { AppleEmoji } from '@/components/AppleEmoji';

interface StepServiceProps {
  selectedService: Service | null;
  setSelectedService: (service: Service) => void;
  handleNext: () => void;
}

const popularServiceId: ServiceId = 'lavage-complet';

export default function StepService({ selectedService, setSelectedService, handleNext }: StepServiceProps) {
  return (
    <div className="animate-fade-in-up">
      <div className="mb-6 md:mb-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/60 md:text-xs">
          Étape 01
        </p>
        <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[34px]">
          Choisissez votre formule.
        </h2>
      </div>

      <div className="grid gap-3.5 md:grid-cols-3 md:gap-5">
        {services.map((service) => {
          const isSelected = selectedService?.id === service.id;
          const isFeatured = service.id === popularServiceId;

          return (
            <button
              key={service.id}
              type="button"
              onClick={() => {
                setSelectedService(service);
                handleNext();
              }}
              className={`group relative flex flex-col rounded-[20px] p-6 text-left transition-all md:p-7 ${
                isSelected
                  ? 'bg-ink text-white shadow-cin-feature'
                  : 'border border-rule bg-white text-ink shadow-cin-card hover:-translate-y-0.5'
              }`}
            >
              {isFeatured && !isSelected && (
                <div className="absolute right-5 top-5 rounded-md bg-blue-wash px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-blue">
                  Populaire
                </div>
              )}
              {isFeatured && isSelected && (
                <div
                  className="absolute right-5 top-5 rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-blue-electric"
                  style={{ background: 'rgba(255,255,255,0.08)' }}
                >
                  Populaire
                </div>
              )}

              <div
                className={`mb-5 flex h-12 w-12 items-center justify-center overflow-hidden rounded-[14px] md:h-14 md:w-14 ${
                  isSelected ? 'bg-blue-electric' : 'bg-blue-wash'
                }`}
              >
                <AppleEmoji name={service.icon} className="h-7 w-7 object-contain md:h-8 md:w-8" />
              </div>

              <h3 className="font-display text-[22px] font-bold tracking-[-0.03em] md:text-[26px]">
                {service.name}
              </h3>
              <p
                className={`mt-2 text-[13px] leading-relaxed md:text-sm ${
                  isSelected ? 'text-white/75' : 'text-ink2'
                }`}
              >
                {service.description}
              </p>

              <div
                className="mt-6 flex items-end justify-between border-t pt-4"
                style={{ borderColor: isSelected ? 'rgba(255,255,255,0.13)' : 'rgba(6,8,13,0.094)' }}
              >
                <span className="font-display text-[40px] font-extrabold leading-none tracking-[-0.04em] md:text-[48px]">
                  {service.price}
                  <span className="text-[24px] md:text-[28px]">€</span>
                </span>
                <span
                  className={`font-mono text-[11px] uppercase tracking-[0.08em] md:text-xs ${
                    isSelected ? 'text-white/60' : 'text-ink2/60'
                  }`}
                >
                  {service.duration}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
