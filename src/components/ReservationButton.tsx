'use client';

interface ReservationButtonProps {
  className?: string;
  isMobile?: boolean;
}

export default function ReservationButton({
  className = '',
  isMobile = false,
}: ReservationButtonProps) {
  const handleClick = () => {
    // Purge la session wizard pour repartir vierge
    localStorage.removeItem('booking_service');
    localStorage.removeItem('booking_date');
    localStorage.removeItem('booking_time');
    localStorage.removeItem('booking_address');
    localStorage.removeItem('booking_customer_info');
    localStorage.removeItem('booking_step');

    window.location.href = '/reserver';
  };

  const baseClasses =
    'rounded-[10px] bg-ink font-cinsans text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,28,92,0.3)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2';

  const variantClasses = isMobile
    ? 'block w-full py-3.5 text-center'
    : 'inline-block px-4 py-2.5 md:px-[22px] md:py-[11px]';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {isMobile ? 'Réserver maintenant' : 'Réserver'}
    </button>
  );
}
