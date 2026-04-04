import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { timeSlots } from './constants';

interface StepScheduleProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  dateTimeErrors: Record<string, string>;
  setDateTimeErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  handleBack: () => void;
  handleNext: () => void;
}

export default function StepSchedule({
  selectedDate, setSelectedDate, selectedTime, setSelectedTime,
  dateTimeErrors, setDateTimeErrors, handleBack, handleNext
}: StepScheduleProps) {
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!selectedDate) {
      setBookedSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/booking/booked-slots?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setBookedSlots(data.data);
      })
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  const isToday = (dateStr: string) => {
    const today = new Date();
    return dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const availableSlots = (selectedDate && isToday(selectedDate)
    ? timeSlots.filter((slot) => {
        const [h, m] = slot.split(':').map(Number);
        const now = new Date();
        return h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
      })
    : timeSlots
  ).filter((slot) => !bookedSlots.includes(slot));

  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 title-font text-center">Quand ?</h2>
      <div className="grid lg:grid-cols-2 gap-6 h-full">
        <div className="bg-gray-50 p-4 rounded-2xl flex-1 flex flex-col">
          <label className="block text-md font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">📅</span> Choisissez une date
          </label>
          <div className="calendar-wrapper-compact">
            <Calendar
              onChange={(value: any) => {
                if (value instanceof Date) {
                  setSelectedDate(format(value, 'yyyy-MM-dd'));
                  setSelectedTime('');
                  if (dateTimeErrors.date) {
                    setDateTimeErrors(prev => ({ ...prev, date: '' }));
                  }
                }
              }}
              value={selectedDate ? new Date(selectedDate) : null}
              locale="fr-FR"
              tileDisabled={({ date }) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              className="w-full border-none !font-sans rounded-xl shadow-sm overflow-hidden text-sm"
              tileClassName="rounded-lg hover:bg-blue-50 focus:bg-blue-100 h-8 w-8 flex items-center justify-center font-medium text-xs"
              navigationLabel={({ date }) => <span className="capitalize font-bold text-primary text-sm">{format(date, 'MMMM yyyy', { locale: fr })}</span>}
              next2Label={null}
              prev2Label={null}
            />
          </div>
          {dateTimeErrors.date && (
            <p className="mt-1 text-xs text-red-600 bg-red-50 p-1 rounded flex items-center gap-1">
              <span>⚠️</span> {dateTimeErrors.date}
            </p>
          )}
        </div>

        <div className="bg-white border-2 border-gray-100 p-4 rounded-2xl h-full overflow-hidden flex flex-col">
          <label className="block text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="text-xl">⏰</span> Créneaux
          </label>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <span className="text-2xl mb-2">👈</span>
              <p className="text-sm">Sélectionnez une date</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              <p className="text-xs text-gray-500 mb-2 sticky top-0 bg-white py-1 z-10">
                Pour le <span className="font-bold text-primary capitalize">{format(new Date(selectedDate), 'EEEE d MMMM', { locale: fr })}</span>
              </p>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-center">
                  <p className="text-sm">Aucun créneau disponible pour cette date.</p>
                </div>
              ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => {
                      setSelectedTime(time);
                      if (dateTimeErrors.time) {
                        setDateTimeErrors(prev => ({ ...prev, time: '' }));
                      }
                    }}
                    className={`py-2 px-1 rounded-lg text-xs font-bold transition-all transform hover:scale-105 ${selectedTime === time
                      ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-1'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                      }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              )}
            </div>
          )}

          {dateTimeErrors.time && (
            <p className="mt-2 text-xs text-red-600 bg-red-50 p-1 rounded flex items-center gap-1">
              <span>⚠️</span> {dateTimeErrors.time}
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
          disabled={!selectedDate || !selectedTime}
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
        >
          Continuer <span className="ml-2">→</span>
        </button>
      </div>
    </div>
  );
}
