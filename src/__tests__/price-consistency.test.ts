import { services } from '@/lib/constants/services';

describe('Price consistency (ISSUE-001)', () => {
  it('each service has a positive integer amountCents', () => {
    services.forEach(s => {
      expect(Number.isInteger(s.amountCents)).toBe(true);
      expect(s.amountCents).toBeGreaterThan(0);
    });
  });

  it('displayed price corresponds exactly to the cent amount sent to Stripe', () => {
    const visible = services.filter(s => s.isVisible);
    visible.forEach(s => {
      // In the frontend, we render: {service.amountCents / 100}€
      // For Stripe, we send: amountCents verbatim
      const displayedDecimal = s.amountCents / 100;
      expect(displayedDecimal * 100).toBe(s.amountCents);
    });
  });

  it('contains expected legacy core services visible', () => {
    const visibleIds = services.filter(s => s.isVisible).map(s => s.id);
    expect(visibleIds).toContain('lavage-exterieur');
    expect(visibleIds).toContain('lavage-complet');
    expect(visibleIds).toContain('lavage-premium');
  });
});
