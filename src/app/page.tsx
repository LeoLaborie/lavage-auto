import NavCinetique from '@/components/landing/NavCinetique'
import HeroCinetique from '@/components/landing/HeroCinetique'
import TickerCinetique from '@/components/landing/TickerCinetique'
import HowItWorksCinetique from '@/components/landing/HowItWorksCinetique'
import BeforeAfterCinetique from '@/components/landing/BeforeAfterCinetique'
import LaveursCinetique from '@/components/landing/LaveursCinetique'
import PricingCinetique from '@/components/landing/PricingCinetique'
import CtaCinetique from '@/components/landing/CtaCinetique'
import FooterCinetique from '@/components/landing/FooterCinetique'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-cinsans text-ink antialiased">
      <NavCinetique />
      <HeroCinetique />
      <TickerCinetique />
      <HowItWorksCinetique />
      <BeforeAfterCinetique />
      <LaveursCinetique />
      <PricingCinetique />
      <CtaCinetique />
      <FooterCinetique />
    </div>
  )
}
