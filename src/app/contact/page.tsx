'use client';

import { useState } from 'react';
import NavCinetique from '@/components/landing/NavCinetique';
import FooterCinetique from '@/components/landing/FooterCinetique';
import { useToast } from '@/contexts/ToastContext';
import { validateContactForm, ContactFormData } from '@/lib/validation';

const SUBJECTS: { value: string; label: string }[] = [
  { value: '', label: 'Choisissez un sujet' },
  { value: 'question', label: 'Question générale' },
  { value: 'booking', label: 'Problème de réservation' },
  { value: 'service', label: 'Question sur un service' },
  { value: 'complaint', label: 'Réclamation' },
  { value: 'other', label: 'Autre' },
];

const INFO_ITEMS: { label: string; value: React.ReactNode }[] = [
  { label: 'Adresse', value: <>123 Rue de la Propreté<br />75001 Paris, France</> },
  { label: 'Téléphone', value: '+33 1 23 45 67 89' },
  { label: 'Email', value: 'contact@lavage-auto.fr' },
  {
    label: 'Horaires',
    value: (
      <>
        Lun – Ven : 8h00 – 19h00
        <br />
        Sam – Dim : 9h00 – 17h00
      </>
    ),
  },
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Combien de temps à l’avance réserver ?',
    a: 'Vous pouvez réserver jusqu’à 2h à l’avance.',
  },
  {
    q: 'Que faire en cas d’annulation ?',
    a: 'Annulation gratuite jusqu’à 1h avant le rendez-vous.',
  },
  {
    q: 'Zones de service ?',
    a: 'Paris et petite couronne pour le moment.',
  },
];

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateContactForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Message envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.');
        setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
      } else {
        const data = await res.json();
        if (data.errors) {
          setErrors(data.errors);
        } else {
          toast.error(data.error || 'Erreur lors de l’envoi du message');
        }
      }
    } catch {
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full rounded-xl border bg-white px-4 py-3.5 text-[15px] text-ink placeholder:text-ink2/40 transition-colors focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/30 ${
      hasError ? 'border-red-500' : 'border-rule'
    }`;

  return (
    <div
      className="min-h-screen bg-white"
      style={{
        background:
          'radial-gradient(ellipse at 70% 0%, #eaf0fc 0%, #ffffff 55%)',
      }}
    >
      <NavCinetique />

      <main className="mx-auto max-w-cin px-5 py-16 md:px-12 md:py-[120px]">
        <header className="mb-12 max-w-3xl md:mb-16">
          <div className="mb-5 font-mono text-[11px] uppercase tracking-[0.16em] text-ink2/60 md:text-xs">
            Contact
          </div>
          <h1 className="font-display text-[40px] font-medium leading-[1.05] tracking-[-0.02em] text-ink md:text-[64px]">
            Une question ?{' '}
            <span className="inline-block pr-[0.25em] italic text-blue">
              On vous répond.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ink2/70 md:text-base">
            Une demande, un retour, un imprévu ? Notre équipe lit chaque message et répond sous 24 heures ouvrées.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <section className="rounded-[20px] bg-white p-6 shadow-cin-card md:p-9">
            <div className="mb-7 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-medium tracking-[-0.01em] text-ink md:text-[28px]">
                Envoyez un message
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink2/40">
                01 / Formulaire
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70"
                  >
                    Prénom *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={inputClass(!!errors.firstName)}
                    placeholder="Votre prénom"
                  />
                  {errors.firstName && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70"
                  >
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={inputClass(!!errors.lastName)}
                    placeholder="Votre nom"
                  />
                  {errors.lastName && (
                    <p className="mt-1.5 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={inputClass(!!errors.email)}
                  placeholder="votre@email.com"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70"
                >
                  Téléphone *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={inputClass(!!errors.phone)}
                  placeholder="06 12 34 56 78"
                />
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70"
                >
                  Sujet *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={inputClass(!!errors.subject)}
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={6}
                  className={`${inputClass(!!errors.message)} resize-none`}
                  placeholder="Décrivez votre demande…"
                />
                {errors.message && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 py-4 font-display text-[15px] font-medium text-white shadow-cin-button transition-all hover:bg-ink2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Envoi en cours…' : 'Envoyer le message'}
                {!isSubmitting && (
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                )}
              </button>
            </form>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[20px] bg-ink p-7 text-white shadow-cin-feature md:p-8">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 className="font-display text-xl font-medium tracking-[-0.01em] md:text-2xl">
                  Coordonnées
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] opacity-50">
                  02 / Direct
                </span>
              </div>
              <ul className="space-y-5">
                {INFO_ITEMS.map((item) => (
                  <li key={item.label} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                    <div className="mb-1 font-mono text-[10px] uppercase tracking-[0.12em] opacity-50">
                      {item.label}
                    </div>
                    <div className="text-[15px] leading-relaxed">{item.value}</div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[20px] bg-white p-7 shadow-cin-card md:p-8">
              <div className="mb-5 flex items-baseline justify-between">
                <h2 className="font-display text-xl font-medium tracking-[-0.01em] text-ink md:text-2xl">
                  FAQ rapide
                </h2>
                <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink2/40">
                  03 / Express
                </span>
              </div>
              <ul className="space-y-4">
                {FAQ_ITEMS.map((item) => (
                  <li
                    key={item.q}
                    className="border-t pt-4 first:border-t-0 first:pt-0"
                    style={{ borderColor: 'rgba(6, 8, 13, 0.094)' }}
                  >
                    <div className="mb-1 font-display text-[15px] font-medium text-ink">
                      {item.q}
                    </div>
                    <p className="text-sm leading-relaxed text-ink2/70">{item.a}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <FooterCinetique />
    </div>
  );
}
