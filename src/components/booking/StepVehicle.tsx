import { UserCar, BookingFormData } from './constants';
import { User } from '@supabase/supabase-js';

// Extend the User type to handle the metadata we access
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
  user: CustomUser | null | any; // Accept any fallback just in case the context type is broad
  userCars: UserCar[];
  selectedCarId: string;
  setSelectedCarId: (id: string) => void;
  isNewCar: boolean;
  setIsNewCar: (isNew: boolean) => void;
  handleBack: () => void;
  handleNext: () => void;
}

export default function StepVehicle({
  customerInfo, setCustomerInfo, formErrors, setFormErrors, user,
  userCars, selectedCarId, setSelectedCarId, isNewCar, setIsNewCar, handleBack, handleNext
}: StepVehicleProps) {
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 title-font text-center">Vos coordonnées</h2>

      <div className="space-y-4">
        {/* Identity & Contact - Dense Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Prénom*</label>
            <input
              type="text"
              value={customerInfo.firstName}
              onChange={(e) => {
                setCustomerInfo({ ...customerInfo, firstName: e.target.value });
                if (formErrors.firstName) setFormErrors((prev) => ({ ...prev, firstName: '' }));
              }}
              className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm ${formErrors.firstName ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Jean"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Nom*</label>
            <input
              type="text"
              value={customerInfo.lastName}
              onChange={(e) => {
                setCustomerInfo({ ...customerInfo, lastName: e.target.value });
                if (formErrors.lastName) setFormErrors((prev) => ({ ...prev, lastName: '' }));
              }}
              className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm ${formErrors.lastName ? 'border-red-500' : 'border-gray-200'}`}
              placeholder="Dupont"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Email*</label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => {
                setCustomerInfo({ ...customerInfo, email: e.target.value });
                if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
              }}
              className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm ${formErrors.email ? 'border-red-500' : 'border-gray-200'} ${user ? 'opacity-75' : ''}`}
              disabled={!!user}
              placeholder="jean@mail.com"
            />
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Tél*</label>
            <input
              type="tel"
              value={customerInfo.phone}
              onChange={(e) => {
                setCustomerInfo({ ...customerInfo, phone: e.target.value });
                if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: '' }));
              }}
              placeholder="06 12..."
              className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm ${formErrors.phone ? 'border-red-500' : 'border-gray-200'}`}
            />
          </div>
        </div>

        {/* Vehicle Selection - Compact */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-gray-900 title-font">Votre Véhicule</h3>
            {userCars.length > 0 && (
              <div className="flex gap-2 p-1 bg-gray-100 rounded-lg scale-90 origin-right">
                <label className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs transition-all ${!isNewCar ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500'
                  }`}>
                  <input type="radio" name="carSelection" checked={!isNewCar} onChange={() => setIsNewCar(false)} className="hidden" />
                  <span>Existant</span>
                </label>
                <label className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs transition-all ${isNewCar ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500'
                  }`}>
                  <input type="radio" name="carSelection" checked={isNewCar} onChange={() => setIsNewCar(true)} className="hidden" />
                  <span>Nouveau</span>
                </label>
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
              className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm ${formErrors.carSelection ? 'border-red-500' : 'border-gray-200'}`}
            >
              <option value="">Choisir un véhicule...</option>
              {userCars.map(car => (
                <option key={car.id} value={car.id}>{car.make} {car.model}{car.plate ? ` - ${car.plate}` : ''}</option>
              ))}
            </select>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <input
                  type="text"
                  value={customerInfo.make || ''}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, make: e.target.value })}
                  placeholder="Marque"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={customerInfo.model || ''}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, model: e.target.value })}
                  placeholder="Modèle"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={customerInfo.licensePlate || ''}
                  onChange={(e) => {
                    setCustomerInfo({ ...customerInfo, licensePlate: e.target.value.toUpperCase() });
                    if (formErrors.licensePlate) setFormErrors((prev) => ({ ...prev, licensePlate: '' }));
                  }}
                  placeholder="Plaque"
                  className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm ${formErrors.licensePlate ? 'border-red-500' : 'border-gray-200'}`}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <textarea
            value={customerInfo.notes}
            onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
            rows={2}
            placeholder="Notes (code portail, etc.)"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          />
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
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl text-sm"
        >
          Continuer <span className="ml-2">→</span>
        </button>
      </div>
    </div>
  );
}
