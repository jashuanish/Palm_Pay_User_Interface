import { PageShell } from '@/components/layout/PageShell';
import { Hero } from '@/components/landing/Hero';
import { Marquee } from '@/components/landing/Marquee';
import { WhyPalmPay } from '@/components/landing/WhyPalmPay';
import { PaymentJourney } from '@/components/landing/PaymentJourney';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { StatsBand } from '@/components/landing/StatsBand';
import { CTASection } from '@/components/landing/CTASection';

export default function HomePage() {
  return (
    <PageShell particles={40}>
      <Hero />
      <Marquee />
      <WhyPalmPay />
      <PaymentJourney />
      <StatsBand />
      <FeatureGrid />
      <CTASection />
    </PageShell>
  );
}
