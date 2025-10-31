'use client';

interface BackButtonProps {
  onClick: () => void;
  isSubmitting: boolean;
}

export default function BackButton({ onClick, isSubmitting }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSubmitting}
      className={`border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors ${
        isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      Retour
    </button>
  );
}