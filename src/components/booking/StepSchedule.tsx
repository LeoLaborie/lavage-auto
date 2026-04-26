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
      <div className="mb-6 md:mb-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/60 md:text-xs">
          Étape 03
        </p>
        <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] md:text-[34px]">
          Quand&nbsp;?
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <div className="rounded-[16px] border border-rule bg-white p-4">
          <label className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2 md:text-xs">
            Date
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
              className="w-full border-none !font-sans rounded-[10px] overflow-hidden text-sm"
              tileClassName="rounded-[8px] hover:bg-blue-wash focus:bg-blue-wash h-8 w-8 flex items-center justify-center font-cinsans text-xs"
              navigationLabel={({ date }) => (
                <span className="font-display text-sm font-bold capitalize tracking-[-0.02em] text-ink">
                  {format(date, 'MMMM yyyy', { locale: fr })}
                </span>
              )}
              next2Label={null}
              prev2Label={null}
            />
          </div>
          {dateTimeErrors.date && (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 font-cinsans text-xs text-red-600">
              <span aria-hidden>⚠</span> {dateTimeErrors.date}
            </p>
          )}
        </div>

        <div className="flex flex-col rounded-[16px] border border-rule bg-white p-4">
          <label className="mb-3 block font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2 md:text-xs">
            Créneau
          </label>

          {!selectedDate ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-rule bg-blue-wash/40 p-8 text-center">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/60">
                Sélectionnez une date
              </span>
            </div>
          ) : (
            <div className="custom-scrollbar flex-1 overflow-y-auto pr-1">
              <p className="sticky top-0 z-10 mb-3 bg-white py-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70">
                {format(new Date(selectedDate), 'EEEE d MMMM', { locale: fr })}
              </p>
              {loadingSlots ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-ink"></div>
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="py-8 text-center font-cinsans text-sm text-ink2">
                  Aucun créneau disponible.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => {
                          setSelectedTime(time);
                          if (dateTimeErrors.time) {
                            setDateTimeErrors(prev => ({ ...prev, time: '' }));
                          }
                        }}
                        className={`rounded-[8px] px-1 py-2 font-cinsans text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-ink text-white'
                            : 'border border-rule bg-white text-ink hover:bg-blue-wash hover:text-blue'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {dateTimeErrors.time && (
            <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 font-cinsans text-xs text-red-600">
              <span aria-hidden>⚠</span> {dateTimeErrors.time}
            </p>
          )}
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
          disabled={!selectedDate || !selectedTime}
          className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-ink px-7 py-3.5 font-cinsans text-[14px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Continuer <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}
