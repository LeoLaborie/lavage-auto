import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BookingWizard from '../BookingWizard';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

describe('BookingWizard canonical service persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('restores canonical service from storage', () => {
    localStorage.setItem('booking_service_id', 'lavage-complet');
    render(<BookingWizard />);
    expect(screen.getByRole('heading', { name: 'Lavage Complet' })).toBeInTheDocument();
  });
});
