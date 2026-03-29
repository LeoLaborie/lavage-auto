import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import StepService from '../StepService';
import { services } from '../constants';

describe('StepService', () => {
  it('marks lavage-complet as popular', () => {
    const service = services.find((s) => s.id === 'lavage-complet');
    expect(service).toBeDefined();

    render(
      <StepService
        selectedService={null}
        setSelectedService={vi.fn()}
        handleNext={vi.fn()}
      />
    );

    expect(screen.getByText('Populaire')).toBeVisible();
  });

  it('calls setSelectedService with canonical id', () => {
    const setSelectedService = vi.fn();
    const handleNext = vi.fn();

    render(
      <StepService
        selectedService={null}
        setSelectedService={setSelectedService}
        handleNext={handleNext}
      />
    );

    fireEvent.click(screen.getByRole('heading', { name: 'Lavage Extérieur' }));

    expect(setSelectedService).toHaveBeenCalled();
    expect(handleNext).toHaveBeenCalled();
  });
});
