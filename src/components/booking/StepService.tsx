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
      <h2 className="text-3xl font-bold text-gray-900 mb-8 title-font text-center">Choisissez votre formule</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {services.map((service) => (
          <div
            key={service.id}
            className={`relative p-8 rounded-3xl cursor-pointer transition-all duration-300 group overflow-hidden ${selectedService?.id === service.id
              ? 'bg-white shadow-2xl ring-4 ring-primary scale-105 z-10'
              : 'bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-gray-50'
              }`}
            onClick={() => {
              setSelectedService(service);
              handleNext();
            }}
          >
            {service.id === popularServiceId && (
              <div className="absolute top-4 right-4 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide z-20">
                Populaire
              </div>
            )}

            <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 ${service.id === 'lavage-premium' ? 'bg-secondary' : service.id === 'lavage-complet' ? 'bg-accent' : 'bg-primary'
              }`} />

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors overflow-hidden border-2 ${selectedService?.id === service.id
              ? 'bg-primary text-white border-primary'
              : 'bg-gray-100 text-gray-600 border-gray-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary'
              }`}>
              <AppleEmoji name={service.icon} className="w-full h-full object-contain" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3 title-font">{service.name}</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">{service.description}</p>

            <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
              <span className="text-3xl font-bold text-primary">{service.price}€</span>
              <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <span className="mr-1">⏱️</span>
                {service.duration}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
