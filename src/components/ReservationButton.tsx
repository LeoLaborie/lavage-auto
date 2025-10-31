'use client';

export default function ReservationButton({ className = '', isMobile = false }) {
  const handleClick = () => {
    // Effacer toutes les données de réservation stockées
    localStorage.removeItem('booking_service');
    localStorage.removeItem('booking_date');
    localStorage.removeItem('booking_time');
    localStorage.removeItem('booking_address');
    localStorage.removeItem('booking_customer_info');
    localStorage.removeItem('booking_step');
    
    // Rediriger vers la page de réservation
    window.location.href = '/reserver';
  };

  return (
    <button
      onClick={handleClick}
      className={`${
        isMobile
           ? 'block w-full bg-primary text-white text-center py-3 rounded-lg font-medium hover:bg-secondary transition-all'
           : 'bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary transition-all inline-block'
      } ${className}`}
    >
      {isMobile ? 'Réserver maintenant' : 'Réserver'}
    </button>
  );
}