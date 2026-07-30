'use client';

import { useEffect, useState } from 'react';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { TestimonialSection } from '@/components/landing/TestimonialSection';
import { CTASection } from '@/components/landing/CTASection';
import { NavBar } from '@/components/landing/NavBar';
import { HeroSection } from '@/components/landing/HeroSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { Footer } from '@/components/landing/Footer';
import { StatsSection } from '@/components/landing/StatsSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { PortalSection } from '@/components/landing/PortalSection';
import { TrustMarque } from '@/components/landing/TrustMarque';
import { activeMode, setMode, type ThemeMode } from '@/lib/theme';

export function LandingContainer() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>('light');

  // The no-flash script in the root layout has already applied the effective
  // mode to <html>; sync local state with it so the toggle icon and
  // theme-aware sections match from the very first interaction.
  useEffect(() => {
    setTheme(activeMode());
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleTheme() {
    const next: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setMode(next); // persists + applies the `.dark` class on <html>
    setTheme(next);
  }

  const isDark = theme === 'dark';

  return (
    <div>
      <div className="min-h-screen bg-white text-ink dark:bg-[#070D1A] dark:text-white overflow-x-hidden antialiased transition-colors duration-300">
        <NavBar isDark={isDark} menuOpen={menuOpen} scrolled={scrolled} setMenuOpen={setMenuOpen} toggleTheme={toggleTheme} />

        <HeroSection isDark={isDark} />

        <TrustMarque />

        <StatsSection />

        <FeaturesSection />

        <HowItWorksSection />

        <SecuritySection />

        <PortalSection />

        <TestimonialSection />

        <CTASection />

        <Footer isDark={isDark} />
      </div>
    </div>
  );
}
